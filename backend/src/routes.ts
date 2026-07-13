import { Router, Request, Response } from 'express';
import { createJob, createRemixJob, saveCompletedRemix, getJob, findCompletedJobByUrl, getAllJobs, deleteJob, deleteRecipeFrames, countActiveJobsForUser, getClient, getExtractionsForUserInTimeframe, countCompletedRecipesForUser, updateJob, isBetaActive, getBetaMaxExtractions, getBetaMaxSavedRecipes, getFreeMaxExtractions, getFreeMaxSavedRecipes, getPremiumMaxExtractions, getPremiumMaxSavedRecipes, setFavorite, setFlags, listCollections, createCollection, updateCollection, deleteCollection, setRecipeCollections, createFeedback, getAllGlobalSettings, updateGlobalSettings, getAllFeedback, getJobMetrics } from './db.js';
import { config } from './config.js';
import { requireAuth, requireAdmin } from './auth.js';
import { chatAboutRecipe, generateChatChips, remixRecipe } from './gemini.js';
import { getLlmMetrics } from './adminMetrics.js';

export const apiRouter = Router();

apiRouter.use(requireAuth);

// Regular expression to validate standard URLs
// Supports Instagram, TikTok, YouTube Shorts, and generic websites
const SUPPORTED_URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;

/**
 * Helper to fetch a user by ID and automatically assign the beta tier if beta is active
 * and the user is currently on the free/unassigned tier.
 */
async function fetchAndSyncUser(userId: string): Promise<any> {
  const { data, error } = await getClient().auth.admin.getUserById(userId);
  if (error || !data?.user) {
    throw error || new Error('User not found');
  }

  let user = data.user;
  const currentTier = user.app_metadata?.tier;
  const betaActive = await isBetaActive();

  if (betaActive && currentTier !== 'premium' && currentTier !== 'beta') {
    try {
      console.log(`Auto-assigning beta tier to user ${userId} (current: ${currentTier})`);
      const { data: updatedData, error: updateError } = await getClient().auth.admin.updateUserById(userId, {
        app_metadata: { ...user.app_metadata, tier: 'beta' }
      });
      if (updateError) {
        console.error(`Failed to auto-assign beta tier to user ${userId}:`, updateError.message);
      } else if (updatedData?.user) {
        user = updatedData.user;
      }
    } catch (err) {
      console.error(`Error auto-assigning beta tier to user ${userId}:`, err);
    }
  }

  return user;
}

/**
 * Helper to determine a user's rate limit based on their tier and overrides in app_metadata.
 */
async function resolveUserRateLimit(user: any): Promise<number> {
  const meta = user?.app_metadata || {};

  // 1. Custom override check
  if (typeof meta.custom_extraction_limit === 'number') {
    return meta.custom_extraction_limit;
  }
  if (typeof meta.max_extractions_per_window === 'number') {
    return meta.max_extractions_per_window;
  }
  if (typeof meta.custom_extraction_limit === 'string') {
    return parseInt(meta.custom_extraction_limit, 10);
  }
  if (typeof meta.max_extractions_per_window === 'string') {
    return parseInt(meta.max_extractions_per_window, 10);
  }

  // 2. Subscription tier check
  if (meta.tier === 'premium') {
    return await getPremiumMaxExtractions();
  }
  if (meta.tier === 'beta') {
    return await getBetaMaxExtractions();
  }

  // 3. Fallback to free tier
  return await getFreeMaxExtractions();
}

/**
 * Determines whether a user has unlimited access — either the premium tier or
 * an explicit unlimited (-1) override in app_metadata.
 */
function isPremiumUser(user: any): boolean {
  const meta = user?.app_metadata || {};
  return meta.tier === 'premium' ||
    meta.custom_extraction_limit === -1 ||
    meta.max_extractions_per_window === -1;
}

/**
 * Endpoint to submit an Instagram Reel URL for recipe extraction.
 * POST /api/extract-recipe
 * Body: { url: string }
 */
apiRouter.post('/extract-recipe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing required field: "url" must be a string.',
      });
      return;
    }

    // Clean up the URL by stripping leading/trailing curly braces, parentheses, quotes, or spaces
    const cleanUrl = url.trim().replace(/^[{("'\s]+|[})"'\s]+$/g, '');

    if (!SUPPORTED_URL_REGEX.test(cleanUrl)) {
      res.status(400).json({
        success: false,
        error: 'Invalid URL. Must be a valid URL (e.g., Instagram Reel, TikTok, YouTube Shorts, or Recipe Website).',
      });
      return;
    }

    try {
      const urlObj = new URL(cleanUrl);
      const hostname = urlObj.hostname.toLowerCase();
      const isYouTube = hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be';

      if (isYouTube) {
        const isShort = urlObj.pathname.startsWith('/shorts/');
        if (!isShort) {
          res.status(400).json({
            success: false,
            error: 'Only YouTube Shorts are supported, not regular YouTube videos.',
          });
          return;
        }
      }
    } catch (e) {
      res.status(400).json({
        success: false,
        error: 'Invalid URL format.',
      });
      return;
    }

    // Check if job for this URL has already successfully completed (scoped to user)
    const existingJob = await findCompletedJobByUrl(cleanUrl, req.userId!);
    if (existingJob) {
      res.status(200).json({
        success: true,
        jobId: existingJob.id,
        status: existingJob.status,
        message: 'Recipe already extracted successfully.',
      });
      return;
    }

    // Enforce per-user quota to protect Apify/Gemini budget
    const activeCount = await countActiveJobsForUser(req.userId!);
    if (activeCount >= config.MAX_JOBS_PER_USER) {
      res.status(429).json({
        success: false,
        error: `You already have ${activeCount} active job(s). Please wait for them to finish before submitting more.`,
      });
      return;
    }

    // Fetch the user once for tier-based gating (cookbook cap + rolling rate limit).
    let user: any = null;
    try {
      user = await fetchAndSyncUser(req.userId!);
    } catch (err) {
      console.warn(`Failed to fetch user metadata for gating checks:`, err);
    }

    // Dev-override: allow simulating premium in development environments
    if (process.env.NODE_ENV !== 'production' && req.headers['x-simulate-premium'] === 'true') {
      if (!user) user = { id: req.userId, app_metadata: {} };
      if (!user.app_metadata) user.app_metadata = {};
      user.app_metadata.tier = 'premium';
    }

    const premium = isPremiumUser(user);

    // Enforce the cookbook cap: free accounts may only keep a limited number of
    // saved recipes. Existing recipes stay accessible — the user must delete one
    // or upgrade to Premium before extracting more.
    if (!premium) {
      const savedCount = await countCompletedRecipesForUser(req.userId!);
      const isBeta = user?.app_metadata?.tier === 'beta';
      const limit = isBeta ? await getBetaMaxSavedRecipes() : await getFreeMaxSavedRecipes();
      if (limit >= 0 && savedCount >= limit) {
        res.status(403).json({
          success: false,
          code: 'COOKBOOK_FULL',
          error: `Cookbook full (${savedCount}/${limit}). Delete a recipe or upgrade to Premium to extract more.`,
        });
        return;
      }
    }

    // Enforce rolling rate limit per user (with custom override in app_metadata)
    const limit = user ? await resolveUserRateLimit(user) : await getFreeMaxExtractions();

    // If limit is non-negative (not -1 for unlimited)
    if (limit >= 0) {
      const windowDays = config.EXTRACTION_LIMIT_WINDOW_DAYS;
      const extractions = await getExtractionsForUserInTimeframe(req.userId!, windowDays);
      if (extractions.length >= limit) {
        const oldestJob = extractions[0];
        let minutesRemaining = 0;
        if (oldestJob) {
          const resetTime = new Date(new Date(oldestJob.createdAt).getTime() + windowDays * 24 * 60 * 60 * 1000);
          const msRemaining = resetTime.getTime() - Date.now();
          minutesRemaining = Math.max(1, Math.ceil(msRemaining / (60 * 1000)));
        }

        res.status(429).json({
          success: false,
          error: `Rate limit: You have reached your limit of ${limit} recipe extractions per ${windowDays} days.` +
            (minutesRemaining > 0 ? ` Please try again in ${minutesRemaining} minutes.` : ''),
        });
        return;
      }
    }

    // Create a new pending job in the database
    const job = await createJob(cleanUrl, req.userId!);


    res.status(202).json({
      success: true,
      jobId: job.id,
      status: job.status,
      message: 'Recipe extraction job successfully queued.',
    });
  } catch (error: any) {
    console.error('Error creating recipe extraction job:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating job.',
    });
  }
});

/**
 * Endpoint to submit a recipe remix request.
 * POST /api/jobs/:id/remix
 * Body: { prompt: string }
 */
apiRouter.post('/jobs/:id/remix', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing required field: "prompt" must be a string.',
      });
      return;
    }

    if (prompt.length > 250) {
      res.status(400).json({
        success: false,
        error: 'Remix prompt must not exceed 250 characters.',
      });
      return;
    }

    // Get the parent job
    const parentJob = await getJob(id, req.userId!);
    if (!parentJob) {
      res.status(404).json({
        success: false,
        error: 'Parent job not found.',
      });
      return;
    }

    if (parentJob.status !== 'completed' || !parentJob.recipe) {
      res.status(400).json({
        success: false,
        error: 'Parent job must be completed and contain a recipe.',
      });
      return;
    }

    // Enforce premium access for remixing
    let isPremium = false;
    try {
      let user: any = null;
      user = await fetchAndSyncUser(req.userId!);

      // Dev-override: allow simulating premium in development environments
      if (process.env.NODE_ENV !== 'production' && req.headers['x-simulate-premium'] === 'true') {
        if (!user) user = { id: req.userId, app_metadata: {} };
        if (!user.app_metadata) user.app_metadata = {};
        user.app_metadata.tier = 'premium';
      }

      if (user) {
        const meta = user.app_metadata || {};
        isPremium = meta.tier === 'premium' ||
                    meta.tier === 'beta' ||
                    meta.custom_extraction_limit === -1 ||
                    meta.max_extractions_per_window === -1;
      }
    } catch (err) {
      console.warn(`Failed to fetch user metadata for remix premium check:`, err);
      if (process.env.NODE_ENV !== 'production' && req.headers['x-simulate-premium'] === 'true') {
        isPremium = true;
      }
    }

    if (!isPremium) {
      res.status(403).json({
        success: false,
        error: 'Recipe Remix is a premium feature. Please upgrade to Premium to customize recipes.',
      });
      return;
    }

    // Create a new remix job
    const job = await createRemixJob(parentJob.id, parentJob.url, prompt, req.userId!);

    res.status(202).json({
      success: true,
      jobId: job.id,
      status: job.status,
      message: 'Recipe remix job successfully queued.',
    });
  } catch (error: any) {
    console.error('Error creating remix job:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating remix job.',
    });
  }
});

/**
 * Endpoint to poll status and get results of an extraction job.
 * GET /api/jobs/:id
 */
apiRouter.get('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent browser caching of dynamic job status
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Missing job ID parameter.',
      });
      return;
    }

    const job = await getJob(id, req.userId!);

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      job: {
        id: job.id,
        url: job.url,
        status: job.status,
        error: job.error,
        recipe: job.recipe,
        progress: job.progress,
        parentJobId: job.parentJobId,
        prompt: job.prompt,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching job details:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while retrieving job.',
    });
  }
});

/**
 * Endpoint to retrieve all recipe extraction jobs.
 * GET /api/jobs
 */
apiRouter.get('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    // Prevent browser caching of dynamic job list
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    const jobs = await getAllJobs(req.userId!);
    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error: any) {
    console.error('Error fetching recipe history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while retrieving recipe history.',
    });
  }
});

/**
 * Endpoint to delete a specific recipe extraction job.
 * DELETE /api/jobs/:id
 */
apiRouter.delete('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await deleteJob(id, req.userId!);
    if (deleted) {
      deleteRecipeFrames(id).catch(err =>
        console.warn(`Failed to delete storage frames for job ${id}:`, err.message)
      );
    }
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Job not found.',
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: 'Job deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting job.',
    });
  }
});

/**
 * Endpoint to retrieve the current user's recipe extraction rate limit status.
 * GET /api/extractions/limit
 */
apiRouter.get('/extractions/limit', async (req: Request, res: Response): Promise<void> => {
  try {
    let limit = await getFreeMaxExtractions();
    let tier: 'free' | 'beta' | 'premium' = 'free';
    let user: any = null;
    try {
      user = await fetchAndSyncUser(req.userId!);
    } catch (err) {
      console.warn(`Failed to fetch user metadata for rate limit status:`, err);
    }

    // Dev-override: allow simulating premium in development environments
    if (process.env.NODE_ENV !== 'production' && req.headers['x-simulate-premium'] === 'true') {
      if (!user) user = { id: req.userId, app_metadata: {} };
      if (!user.app_metadata) user.app_metadata = {};
      user.app_metadata.tier = 'premium';
    }

    if (user) {
      limit = await resolveUserRateLimit(user);
      tier = user.app_metadata?.tier === 'premium' 
        ? 'premium' 
        : (user.app_metadata?.tier === 'beta' ? 'beta' : 'free');
    }

    const windowDays = config.EXTRACTION_LIMIT_WINDOW_DAYS;

    // Cookbook cap status (mirrors the POST /extract-recipe enforcement) so the
    // extract screen can proactively show a "cookbook full" state.
    const premium = isPremiumUser(user);
    const savedRecipes = await countCompletedRecipesForUser(req.userId!);
    const maxSavedRecipes = premium 
      ? -1 
      : (user?.app_metadata?.tier === 'beta' ? await getBetaMaxSavedRecipes() : await getFreeMaxSavedRecipes());
    const cookbookFull = maxSavedRecipes >= 0 && savedRecipes >= maxSavedRecipes;

    if (limit < 0) {
      res.status(200).json({
        success: true,
        tier,
        limit: -1,
        used: 0,
        remaining: -1,
        windowDays,
        savedRecipes,
        maxSavedRecipes,
        cookbookFull
      });
      return;
    }

    const extractions = await getExtractionsForUserInTimeframe(req.userId!, windowDays);
    const used = extractions.length;
    const remaining = Math.max(0, limit - used);

    res.status(200).json({
      success: true,
      tier,
      limit,
      used,
      remaining,
      windowDays,
      savedRecipes,
      maxSavedRecipes,
      cookbookFull
    });
  } catch (error) {
    console.error('Error fetching rate limit status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching rate limit status.',
    });
  }
});

/**
 * Endpoint to sync a user's subscription status from RevenueCat.
 * POST /api/billing/sync
 */
apiRouter.post('/billing/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const secretKey = config.REVENUECAT_SECRET_KEY;
    if (!secretKey) {
      console.warn('REVENUECAT_SECRET_KEY is not configured in backend. Trusting client tier update (fallback mode).');
      // For local testing without a secret API key, we let the client tell us their status.
      // This preserves our local fallback but makes it highly secure in production.
      const clientTier = req.body.tier;
      if (clientTier === 'premium' || clientTier === 'free') {
        const betaActive = await isBetaActive();
        const finalTier = clientTier === 'free' && betaActive ? 'beta' : clientTier;
        const { error } = await getClient().auth.admin.updateUserById(userId, {
          app_metadata: { tier: finalTier },
        });
        if (error) throw error;
        res.status(200).json({ success: true, tier: finalTier, fallback: true });
        return;
      }
      const betaActive = await isBetaActive();
      res.status(200).json({ success: true, tier: betaActive ? 'beta' : 'free', fallback: true });
      return;
    }

    // Call RevenueCat API to securely fetch subscriber entitlements
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RevenueCat API error:', errorText);
      res.status(500).json({ success: false, error: 'Failed to fetch status from RevenueCat.' });
      return;
    }

    const rcData = (await response.json()) as any;
    const entitlements = rcData.subscriber?.entitlements || {};
    const premiumEntitlement = entitlements.premium;

    let isPremium = false;
    if (premiumEntitlement) {
      const expiresDate = premiumEntitlement.expires_date;
      if (!expiresDate) {
        // Lifetime subscription
        isPremium = true;
      } else {
        // Subscription check
        isPremium = new Date(expiresDate).getTime() > Date.now();
      }
    }

    const betaActive = await isBetaActive();
    const newTier = isPremium ? 'premium' : (betaActive ? 'beta' : 'free');

    // Update Supabase app_metadata
    const { error } = await getClient().auth.admin.updateUserById(userId, {
      app_metadata: { tier: newTier },
    });

    if (error) {
      console.error('Failed to update Supabase user tier:', error.message);
      res.status(500).json({ success: false, error: 'Failed to update user profile.' });
      return;
    }

    res.status(200).json({ success: true, tier: newTier });
  } catch (error: any) {
    console.error('Error syncing billing status:', error);
    res.status(500).json({ success: false, error: 'Internal server error during sync.' });
  }
});

/**
 * Endpoint to delete the current user's account.
 * DELETE /api/users/me
 */
apiRouter.delete('/users/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized. Missing user ID.',
      });
      return;
    }

    // Call Supabase Admin API to delete the user
    const { error } = await getClient().auth.admin.deleteUser(userId);
    if (error) {
      console.error('Supabase admin deleteUser error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to delete user account: ${error.message}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting user account:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting account.',
    });
  }
});

/**
 * Endpoint to get LLM-generated quick-action chips for the chat.
 * GET /api/jobs/:id/chat/chips?lang=de|en
 */
apiRouter.get('/jobs/:id/chat/chips', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lang = (req.query.lang as string) || 'de';

    const job = await getJob(id, req.userId!);
    if (!job || !job.recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found.' });
      return;
    }

    const chips = await generateChatChips(job.recipe, lang);

    res.status(200).json({ success: true, chips });
  } catch (error: any) {
    console.error('Error generating chat chips:', error);
    res.status(500).json({ success: false, error: 'Failed to generate chat chips.' });
  }
});

/**
 * Endpoint to confirm a pending remix and execute it.
 * POST /api/jobs/:id/chat/confirm
 * Body: { modificationRequest: string }
 */
apiRouter.post('/jobs/:id/chat/confirm', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { modificationRequest, replaceCurrent } = req.body;

    if (!modificationRequest || typeof modificationRequest !== 'string') {
      res.status(400).json({ success: false, error: 'Missing required field: "modificationRequest".' });
      return;
    }

    const job = await getJob(id, req.userId!);
    if (!job || !job.recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found.' });
      return;
    }

    // Resolve user preferences
    let userPrefs: any;
    try {
      const { data, error: authError } = await getClient().auth.admin.getUserById(req.userId!);
      if (!authError && data?.user?.user_metadata) {
        const meta = data.user.user_metadata;
        const languageMap: Record<string, string> = {
          'de': 'German', 'en': 'English', 'german': 'German', 'english': 'English'
        };
        userPrefs = {
          recipeLanguage: meta.language ? languageMap[meta.language.toLowerCase()] : undefined,
          preferredTemperatureUnit: meta.preferred_temperature_unit,
          preferredUnitSystem: meta.preferred_unit_system,
        };
      }
    } catch {}

    const remixedRecipe = await remixRecipe(job.recipe, modificationRequest, undefined, userPrefs);

    if (replaceCurrent) {
      // Preserve images from the original recipe (Gemini doesn't know about them)
      const mergedRecipe = {
        ...remixedRecipe,
        imageUrl: job.recipe?.imageUrl ?? null,
        imageUrls: job.recipe?.imageUrls ?? (job.recipe?.imageUrl ? [job.recipe.imageUrl] : []),
        id,
        parentJobId: job.parentJobId,
        remixPrompt: modificationRequest,
      };

      await updateJob(id, {
        recipe: mergedRecipe as any,
        status: 'completed',
      });

      const updatedJob = await getJob(id, req.userId!);
      res.status(200).json({
        success: true,
        replaced: true,
        updatedRecipeJson: updatedJob?.recipe,
      });
    } else {
      // Save as a new remix job
      const savedJob = await saveCompletedRemix(id, job.url, remixedRecipe, modificationRequest, req.userId!);
      res.status(200).json({
        success: true,
        newJobId: savedJob.id,
        updatedRecipeJson: savedJob.recipe,
      });
    }
  } catch (error: any) {
    console.error('Error confirming remix:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm remix.' });
  }
});

/**
 * Endpoint to chat about a recipe.
 * POST /api/jobs/:id/chat
 * Body: { message: string, history: Array<{role: 'user'|'model', text: string}> }
 */
apiRouter.post('/jobs/:id/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing required field: "message" must be a string.',
      });
      return;
    }

    if (!Array.isArray(history)) {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid field: "history" must be an array.',
      });
      return;
    }

    // Get the recipe job
    const job = await getJob(id, req.userId!);
    if (!job || !job.recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found.',
      });
      return;
    }

    // Enforce premium access for chat
    let isPremium = false;
    let user: any = null;
    try {
      user = await fetchAndSyncUser(req.userId!);

      // Dev-override: allow simulating premium in development environments
      if (process.env.NODE_ENV !== 'production' && req.headers['x-simulate-premium'] === 'true') {
        if (!user) user = { id: req.userId, app_metadata: {} };
        if (!user.app_metadata) user.app_metadata = {};
        user.app_metadata.tier = 'premium';
      }

      if (user) {
        const meta = user.app_metadata || {};
        isPremium = meta.tier === 'premium' ||
                    meta.tier === 'beta' ||
                    meta.custom_extraction_limit === -1 ||
                    meta.max_extractions_per_window === -1;
      }
    } catch (err) {
      console.warn(`Failed to fetch user metadata for chat premium check:`, err);
      if (process.env.NODE_ENV !== 'production' && req.headers['x-simulate-premium'] === 'true') {
        isPremium = true;
      }
    }

    if (!isPremium) {
      res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        error: 'AI Kitchen Chef Chat is a premium feature. Please upgrade to Premium to chat with KochBuddy.',
      });
      return;
    }

    // Resolve user preferences for recipe language and unit system formatting
    let userPrefs: {
      recipeLanguage?: string;
      preferredTemperatureUnit?: string;
      preferredUnitSystem?: string;
    } | undefined;

    if (user?.user_metadata) {
      const meta = user.user_metadata;
      const languageMap: Record<string, string> = {
        'de': 'German',
        'en': 'English',
        'german': 'German',
        'english': 'English'
      };
      
      let recipeLanguage: string | undefined;
      if (meta.language) {
        recipeLanguage = languageMap[meta.language.toLowerCase()];
      }
      if (!recipeLanguage && meta.recipe_language) {
        recipeLanguage = languageMap[meta.recipe_language.toLowerCase()] || meta.recipe_language;
      }

      userPrefs = {
        recipeLanguage,
        preferredTemperatureUnit: meta.preferred_temperature_unit,
        preferredUnitSystem: meta.preferred_unit_system,
      };
    }

    // Process chat request with Gemini
    const result = await chatAboutRecipe(
      job.recipe,
      message,
      history,
      req.userId!,
      userPrefs
    );

    let responsePayload: any = {
      success: true,
      chatMessage: result.chatMessage,
      toolCalled: result.toolCalled,
      toolArgs: result.toolArgs,
      recipeWasModified: result.recipeWasModified,
      pendingRemix: result.pendingRemix,
      modificationRequest: result.modificationRequest,
    };

    // If recipe was modified AND not pending confirmation, save immediately
    // (pending remixes are saved later via /confirm endpoint)
    if (result.recipeWasModified && result.newRecipe) {
      const remixPrompt = result.toolArgs?.modification_request || 'AI Copilot modification';
      console.log(`[chat route] Saving completed recipe remix for parent job ${id}`);
      const savedJob = await saveCompletedRemix(
        id,
        job.url,
        result.newRecipe,
        remixPrompt,
        req.userId!
      );
      responsePayload.newJobId = savedJob.id;
      responsePayload.updatedRecipeJson = savedJob.recipe;
    }

    res.status(200).json(responsePayload);
  } catch (error: any) {
    console.error('Error in recipe chat handler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during recipe chat.',
    });
  }
});

// Helper to check user premium status
async function checkPremium(req: Request): Promise<boolean> {
  let isPremium = false;
  try {
    let user = await fetchAndSyncUser(req.userId!);

    // Dev-override: allow simulating premium in development environments
    if (process.env.NODE_ENV !== 'production' && req.headers['x-simulate-premium'] === 'true') {
      if (!user) user = { id: req.userId, app_metadata: {} };
      if (!user.app_metadata) user.app_metadata = {};
      user.app_metadata.tier = 'premium';
    }

    if (user) {
      const meta = user.app_metadata || {};
      isPremium = meta.tier === 'premium' ||
                  meta.tier === 'beta' ||
                  meta.custom_extraction_limit === -1 ||
                  meta.max_extractions_per_window === -1;
    }
  } catch (err) {
    console.warn(`Failed to fetch user metadata for premium check:`, err);
    if (process.env.NODE_ENV !== 'production' && req.headers['x-simulate-premium'] === 'true') {
      isPremium = true;
    }
  }
  return isPremium;
}

/**
 * Endpoint to update a recipe's favorite status.
 * PATCH /api/jobs/:id/favorite
 */
apiRouter.patch('/jobs/:id/favorite', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isFavorite } = req.body;

    if (typeof isFavorite !== 'boolean') {
      res.status(400).json({ success: false, error: 'Field isFavorite must be a boolean.' });
      return;
    }

    const job = await getJob(id, req.userId!);
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found.' });
      return;
    }

    await setFavorite(id, req.userId!, isFavorite);
    res.status(200).json({ success: true, message: 'Favorite status updated.' });
  } catch (error: any) {
    console.error('Error updating favorite status:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * Endpoint to update custom tags/flags.
 * PATCH /api/jobs/:id/flags
 */
apiRouter.patch('/jobs/:id/flags', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { flags } = req.body;

    if (!Array.isArray(flags)) {
      res.status(400).json({ success: false, error: 'Field flags must be an array of strings.' });
      return;
    }

    const isPremium = await checkPremium(req);
    if (!isPremium) {
      res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        error: 'Custom tags and flags are premium features. Please upgrade to Premium.',
      });
      return;
    }

    const job = await getJob(id, req.userId!);
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found.' });
      return;
    }

    await setFlags(id, req.userId!, flags);
    res.status(200).json({ success: true, message: 'Custom flags updated.' });
  } catch (error: any) {
    console.error('Error updating custom flags:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * Endpoint to retrieve all collections.
 * GET /api/collections
 */
apiRouter.get('/collections', async (req: Request, res: Response): Promise<void> => {
  try {
    const collections = await listCollections(req.userId!);
    res.status(200).json({ success: true, collections });
  } catch (error: any) {
    console.error('Error listing collections:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * Endpoint to create a new collection.
 * POST /api/collections
 */
apiRouter.post('/collections', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, emoji, color, position } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ success: false, error: 'Field name must be a non-empty string.' });
      return;
    }

    const isPremium = await checkPremium(req);
    if (!isPremium) {
      res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        error: 'Collections are a premium feature. Please upgrade to Premium.',
      });
      return;
    }

    const collection = await createCollection(req.userId!, { name, emoji, color, position });
    res.status(201).json({ success: true, collection });
  } catch (error: any) {
    console.error('Error creating collection:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * Endpoint to submit an in-app bug report / feedback.
 * POST /api/feedback
 * Available to all authenticated users. Optional screenshot (compressed
 * client-side) and diagnostic context are stored alongside the message.
 */
apiRouter.post('/feedback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, type, context, screenshots } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Field message must be a non-empty string.' });
      return;
    }
    if (message.length > 4000) {
      res.status(400).json({ success: false, error: 'Message is too long (max 4000 characters).' });
      return;
    }

    const feedbackType: 'bug' | 'idea' = type === 'idea' ? 'idea' : 'bug';

    if (context !== undefined && (typeof context !== 'object' || context === null)) {
      res.status(400).json({ success: false, error: 'Field context must be an object.' });
      return;
    }

    let screenshotsBase64: string[] | undefined;
    if (screenshots !== undefined) {
      if (!Array.isArray(screenshots) || !screenshots.every((s) => typeof s === 'string')) {
        res.status(400).json({ success: false, error: 'Field screenshots must be an array of base64 strings.' });
        return;
      }
      if (screenshots.length > 6) {
        res.status(400).json({ success: false, error: 'Too many screenshots (max 6).' });
        return;
      }
      // Keep the whole payload under the global 1mb JSON body cap (base64 inflates ~33%).
      const totalLength = screenshots.reduce((sum: number, s: string) => sum + s.length, 0);
      if (totalLength > 1_500_000) {
        res.status(400).json({ success: false, error: 'Screenshots are too large.' });
        return;
      }
      screenshotsBase64 = screenshots.length > 0 ? screenshots : undefined;
    }

    const { id } = await createFeedback(req.userId!, {
      type: feedbackType,
      message: message.trim(),
      context,
      screenshotsBase64,
    });

    res.status(201).json({ success: true, id });
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * Endpoint to update a collection.
 * PATCH /api/collections/:id
 */
apiRouter.patch('/collections/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, emoji, color, position } = req.body;

    const isPremium = await checkPremium(req);
    if (!isPremium) {
      res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        error: 'Collections are a premium feature. Please upgrade to Premium.',
      });
      return;
    }

    const collection = await updateCollection(id, req.userId!, { name, emoji, color, position });
    res.status(200).json({ success: true, collection });
  } catch (error: any) {
    console.error('Error updating collection:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * Endpoint to delete a collection.
 * DELETE /api/collections/:id
 */
apiRouter.delete('/collections/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const isPremium = await checkPremium(req);
    if (!isPremium) {
      res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        error: 'Collections are a premium feature. Please upgrade to Premium.',
      });
      return;
    }

    const deleted = await deleteCollection(id, req.userId!);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Collection not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Collection deleted.' });
  } catch (error: any) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * Endpoint to associate a job/recipe with collections.
 * PATCH /api/jobs/:id/collections
 */
apiRouter.patch('/jobs/:id/collections', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { collectionIds } = req.body;

    if (!Array.isArray(collectionIds)) {
      res.status(400).json({ success: false, error: 'Field collectionIds must be an array of strings.' });
      return;
    }

    const isPremium = await checkPremium(req);
    if (!isPremium) {
      res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        error: 'Collections are a premium feature. Please upgrade to Premium.',
      });
      return;
    }

    const job = await getJob(id, req.userId!);
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found.' });
      return;
    }

    await setRecipeCollections(id, req.userId!, collectionIds);
    res.status(200).json({ success: true, message: 'Recipe collections updated.' });
  } catch (error: any) {
    console.error('Error updating recipe collections:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * Check if the user is an admin.
 * GET /api/admin/check
 * Available to all authenticated users.
 */
apiRouter.get('/admin/check', (req: Request, res: Response): void => {
  const email = req.userEmail;
  if (!email) {
    res.json({ success: true, isAdmin: false });
    return;
  }
  const adminEmails = config.ADMIN_EMAILS.split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = adminEmails.includes(email.toLowerCase());
  res.json({ success: true, isAdmin });
});

/**
 * Fetch all global settings.
 * GET /api/admin/settings
 * Requires admin privileges.
 */
apiRouter.get('/admin/settings', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getAllGlobalSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching global settings:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * Update global settings.
 * PATCH /api/admin/settings
 * Requires admin privileges.
 */
apiRouter.patch('/admin/settings', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ success: false, error: 'Settings object is required.' });
      return;
    }

    await updateGlobalSettings(settings);
    res.json({ success: true, message: 'Global settings updated.' });
  } catch (error) {
    console.error('Error updating global settings:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * Retrieve all feedback.
 * GET /api/admin/feedback
 * Requires admin privileges.
 */
apiRouter.get('/admin/feedback', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const feedback = await getAllFeedback();
    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * Retrieve system metrics and LLM cost analytics.
 * GET /api/admin/metrics
 * Requires admin privileges.
 */
apiRouter.get('/admin/metrics', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Fetch total user count from Supabase Auth Admin API
    let userCount = 0;
    try {
      const { data, error } = await getClient().auth.admin.listUsers({ perPage: 1000 });
      if (!error && data?.users) {
        userCount = data.users.length;
      }
    } catch (err: any) {
      console.error('Error fetching users from Supabase Admin:', err.message);
    }

    // 2. Fetch db jobs metrics
    const jobsMetrics = await getJobMetrics();

    // 3. Fetch logs LLM metrics
    const llmMetrics = await getLlmMetrics(30);

    res.json({
      success: true,
      users: {
        total: userCount,
      },
      jobs: jobsMetrics,
      llm: llmMetrics,
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});



