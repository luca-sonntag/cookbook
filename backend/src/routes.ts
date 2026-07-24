import { Router, Request, Response } from 'express';
import { createJob, createRemixJob, saveCompletedRemix, getJob, findCompletedJobByUrl, findActiveJobByUrl, getAllJobs, deleteJob, deleteRecipeFrames, getRecipeFrames, countActiveJobsForUser, getClient, getExtractionsForUserInTimeframe, countCompletedRecipesForUser, updateJob, isAlphaActive, getAlphaMaxExtractions, getAlphaMaxSavedRecipes, getFreeMaxExtractions, getFreeMaxSavedRecipes, getPremiumMaxExtractions, getPremiumMaxSavedRecipes, setFavorite, setFlags, listCollections, createCollection, updateCollection, deleteCollection, setRecipeCollections, createFeedback, getAllGlobalSettings, updateGlobalSettings, getAllFeedback, getJobMetrics, getExtractionsPerUser, getFailedJobs } from './db.js';
import { config } from './config.js';
import { requireAuth, requireAdmin } from './auth.js';
import { chatAboutRecipe, generateChatChips, remixRecipe } from './gemini.js';
import { getLlmMetrics } from './adminMetrics.js';
import { AppError, sendAppError } from './errors.js';

export const apiRouter = Router();

apiRouter.use(requireAuth);

// Regular expression to validate standard URLs
// Supports Instagram, TikTok, YouTube Shorts, and generic websites
const SUPPORTED_URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;

/**
 * Helper to fetch a user by ID and automatically assign the alpha tier if alpha is active
 * and the user is currently on the free/unassigned tier.
 */
async function fetchAndSyncUser(userId: string): Promise<any> {
  const { data, error } = await getClient().auth.admin.getUserById(userId);
  if (error || !data?.user) {
    throw error || new Error('User not found');
  }

  let user = data.user;
  const currentTier = user.app_metadata?.tier;
  const alphaActive = await isAlphaActive();

  if (alphaActive && currentTier !== 'premium' && currentTier !== 'alpha') {
    try {
      console.log(`Auto-assigning alpha tier to user ${userId} (current: ${currentTier})`);
      const { data: updatedData, error: updateError } = await getClient().auth.admin.updateUserById(userId, {
        app_metadata: { ...user.app_metadata, tier: 'alpha' }
      });
      if (updateError) {
        console.error(`Failed to auto-assign alpha tier to user ${userId}:`, updateError.message);
      } else if (updatedData?.user) {
        user = updatedData.user;
      }
    } catch (err) {
      console.error(`Error auto-assigning alpha tier to user ${userId}:`, err);
    }
  } else if (!alphaActive && currentTier === 'alpha') {
    try {
      console.log(`Auto-reverting user ${userId} from alpha to free tier because alpha is inactive`);
      const { data: updatedData, error: updateError } = await getClient().auth.admin.updateUserById(userId, {
        app_metadata: { ...user.app_metadata, tier: 'free' }
      });
      if (updateError) {
        console.error(`Failed to auto-revert alpha tier for user ${userId}:`, updateError.message);
      } else if (updatedData?.user) {
        user = updatedData.user;
      }
    } catch (err) {
      console.error(`Error auto-reverting alpha tier for user ${userId}:`, err);
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
  if (meta.tier === 'alpha') {
    return await getAlphaMaxExtractions();
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
      throw new AppError('MISSING_FIELD', { params: { field: 'url' } });
    }

    // Clean up the URL by stripping leading/trailing curly braces, parentheses, quotes, or spaces
    const cleanUrl = url.trim().replace(/^[{("'\s]+|[})"'\s]+$/g, '');

    if (!SUPPORTED_URL_REGEX.test(cleanUrl)) {
      throw new AppError('INVALID_URL', { message: 'URL failed SUPPORTED_URL_REGEX.' });
    }

    try {
      const urlObj = new URL(cleanUrl);
      const hostname = urlObj.hostname.toLowerCase();
      const isYouTube = hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be';

      if (isYouTube) {
        const isShort = urlObj.pathname.startsWith('/shorts/');
        if (!isShort) {
          throw new AppError('YOUTUBE_SHORTS_ONLY');
        }
      }
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError('INVALID_URL', { message: 'URL failed to parse.' });
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

    // Check if a job for this URL is already running (scoped to user). Without this,
    // re-submitting the same URL while the first extraction is still in flight -
    // e.g. after the app was closed/reopened mid-extraction - creates a second job
    // that also completes, resulting in a duplicate saved recipe.
    const activeJob = await findActiveJobByUrl(cleanUrl, req.userId!);
    if (activeJob) {
      res.status(202).json({
        success: true,
        jobId: activeJob.id,
        status: activeJob.status,
        message: 'Recipe extraction already in progress.',
      });
      return;
    }

    // Enforce per-user quota to protect Apify/Gemini budget
    const activeCount = await countActiveJobsForUser(req.userId!);
    if (activeCount >= config.MAX_JOBS_PER_USER) {
      throw new AppError('ACTIVE_JOB_EXISTS', { params: { count: activeCount } });
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
      const isAlpha = user?.app_metadata?.tier === 'alpha';
      const limit = isAlpha ? await getAlphaMaxSavedRecipes() : await getFreeMaxSavedRecipes();
      if (limit >= 0 && savedCount >= limit) {
        throw new AppError('COOKBOOK_FULL', { params: { count: savedCount, limit } });
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

        throw new AppError('RATE_LIMIT_EXCEEDED', {
          params: { limit, days: windowDays, minutes: minutesRemaining },
        });
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
    if (!(error instanceof AppError)) console.error('Error creating recipe extraction job:', error);
    sendAppError(res, error);
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
      throw new AppError('MISSING_FIELD', { params: { field: 'prompt' } });
    }

    if (prompt.length > 250) {
      throw new AppError('REMIX_PROMPT_TOO_LONG', { params: { max: 250 } });
    }

    // Get the parent job
    const parentJob = await getJob(id, req.userId!);
    if (!parentJob) {
      throw new AppError('PARENT_JOB_NOT_FOUND');
    }

    if (parentJob.status !== 'completed' || !parentJob.recipe) {
      throw new AppError('PARENT_JOB_NOT_COMPLETED');
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
                    meta.tier === 'alpha' ||
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
      throw new AppError('PREMIUM_REQUIRED', { params: { feature: 'remix' } });
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
    if (!(error instanceof AppError)) console.error('Error creating remix job:', error);
    sendAppError(res, error);
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
      throw new AppError('MISSING_FIELD', { params: { field: 'id' } });
    }

    const job = await getJob(id, req.userId!);

    if (!job) {
      throw new AppError('JOB_NOT_FOUND');
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
    if (!(error instanceof AppError)) console.error('Error fetching job details:', error);
    sendAppError(res, error);
  }
});

/**
 * One-time transient hand-off of a recipe's video frames to the extracting device.
 * GET /api/jobs/:id/frames
 *
 * Returns the frames as base64 data URLs, then deletes them from Storage once the
 * response is delivered. This keeps frames off our servers long-term (they live
 * only in the device's local IndexedDB cache afterwards), so we don't rehost
 * third-party video content. If the device never calls this, sweepOldRecipeFrames
 * removes the orphans as a backstop.
 */
apiRouter.get('/jobs/:id/frames', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    // Ownership check: getJob is scoped to the requesting user.
    const job = await getJob(id, req.userId!);
    if (!job) {
      throw new AppError('JOB_NOT_FOUND');
    }

    const frames = await getRecipeFrames(id);

    // Delete the transient copies once the bytes have been delivered.
    res.on('finish', () => {
      if (frames.length === 0) return;
      deleteRecipeFrames(id).catch(err =>
        console.warn(`Failed to delete transient frames for job ${id}:`, err.message)
      );
    });

    res.status(200).json({ success: true, frames });
  } catch (error: any) {
    if (!(error instanceof AppError)) console.error('Error delivering recipe frames:', error);
    sendAppError(res, error);
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
    if (!(error instanceof AppError)) console.error('Error fetching recipe history:', error);
    sendAppError(res, error);
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
      throw new AppError('JOB_NOT_FOUND');
    }
    res.status(200).json({
      success: true,
      message: 'Job deleted successfully.',
    });
  } catch (error: any) {
    if (!(error instanceof AppError)) console.error('Error deleting job:', error);
    sendAppError(res, error);
  }
});

/**
 * Endpoint to retrieve the current user's recipe extraction rate limit status.
 * GET /api/extractions/limit
 */
apiRouter.get('/extractions/limit', async (req: Request, res: Response): Promise<void> => {
  try {
    let limit = await getFreeMaxExtractions();
    let tier: 'free' | 'alpha' | 'premium' = 'free';
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
        : (user.app_metadata?.tier === 'alpha' ? 'alpha' : 'free');
    }

    const windowDays = config.EXTRACTION_LIMIT_WINDOW_DAYS;

    // Cookbook cap status (mirrors the POST /extract-recipe enforcement) so the
    // extract screen can proactively show a "cookbook full" state.
    const premium = isPremiumUser(user);
    const savedRecipes = await countCompletedRecipesForUser(req.userId!);
    const maxSavedRecipes = premium 
      ? -1 
      : (user?.app_metadata?.tier === 'alpha' ? await getAlphaMaxSavedRecipes() : await getFreeMaxSavedRecipes());
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
    if (!(error instanceof AppError)) console.error('Error fetching rate limit status:', error);
    sendAppError(res, error);
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
      throw new AppError('UNAUTHORIZED');
    }

    const secretKey = config.REVENUECAT_SECRET_KEY;
    if (!secretKey) {
      console.warn('REVENUECAT_SECRET_KEY is not configured in backend. Trusting client tier update (fallback mode).');
      // For local testing without a secret API key, we let the client tell us their status.
      // This preserves our local fallback but makes it highly secure in production.
      const clientTier = req.body.tier;
      if (clientTier === 'premium' || clientTier === 'free') {
        const alphaActive = await isAlphaActive();
        const finalTier = clientTier === 'free' && alphaActive ? 'alpha' : clientTier;
        const { error } = await getClient().auth.admin.updateUserById(userId, {
          app_metadata: { tier: finalTier },
        });
        if (error) throw error;
        res.status(200).json({ success: true, tier: finalTier, fallback: true });
        return;
      }
      const alphaActive = await isAlphaActive();
      res.status(200).json({ success: true, tier: alphaActive ? 'alpha' : 'free', fallback: true });
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
      throw new AppError('REVENUECAT_FAILED', { message: 'Failed to fetch status from RevenueCat.' });
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

    const alphaActive = await isAlphaActive();
    const newTier = isPremium ? 'premium' : (alphaActive ? 'alpha' : 'free');

    // Update Supabase app_metadata
    const { error } = await getClient().auth.admin.updateUserById(userId, {
      app_metadata: { tier: newTier },
    });

    if (error) {
      console.error('Failed to update Supabase user tier:', error.message);
      throw new AppError('PROFILE_UPDATE_FAILED', { message: 'Failed to update user profile.' });
    }

    res.status(200).json({ success: true, tier: newTier });
  } catch (error: any) {
    if (!(error instanceof AppError)) console.error('Error syncing billing status:', error);
    sendAppError(res, error);
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
      throw new AppError('UNAUTHORIZED', { message: 'Unauthorized. Missing user ID.' });
    }

    // Call Supabase Admin API to delete the user
    const { error } = await getClient().auth.admin.deleteUser(userId);
    if (error) {
      console.error('Supabase admin deleteUser error:', error);
      throw new AppError('ACCOUNT_DELETE_FAILED', { message: `Failed to delete user account: ${error.message}` });
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully.',
    });
  } catch (error: any) {
    if (!(error instanceof AppError)) console.error('Error deleting user account:', error);
    sendAppError(res, error);
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
      throw new AppError('RECIPE_NOT_FOUND');
    }

    const chips = await generateChatChips(job.recipe, lang);

    res.status(200).json({ success: true, chips });
  } catch (error: any) {
    if (!(error instanceof AppError)) console.error('Error generating chat chips:', error);
    sendAppError(res, error);
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
      throw new AppError('MISSING_FIELD', { params: { field: 'modificationRequest' } });
    }

    const job = await getJob(id, req.userId!);
    if (!job || !job.recipe) {
      throw new AppError('RECIPE_NOT_FOUND');
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
    if (!(error instanceof AppError)) console.error('Error confirming remix:', error);
    sendAppError(res, error);
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
    const { message, history, stagedChanges } = req.body;

    // Optional: modifications the user has already collected in the chat "transaction"
    // (not yet applied). Passed to the model so it can build on them consistently.
    const normalizedStagedChanges: string[] | undefined = Array.isArray(stagedChanges)
      ? stagedChanges.filter((c: unknown): c is string => typeof c === 'string' && c.trim().length > 0)
      : undefined;

    if (!message || typeof message !== 'string') {
      throw new AppError('MISSING_FIELD', { params: { field: 'message' } });
    }

    if (!Array.isArray(history)) {
      throw new AppError('INVALID_FIELD', { params: { field: 'history' } });
    }

    // Get the recipe job
    const job = await getJob(id, req.userId!);
    if (!job || !job.recipe) {
      throw new AppError('RECIPE_NOT_FOUND');
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
                    meta.tier === 'alpha' ||
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
      throw new AppError('PREMIUM_REQUIRED', { params: { feature: 'chat' } });
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
      userPrefs,
      normalizedStagedChanges
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
    if (!(error instanceof AppError)) console.error('Error in recipe chat handler:', error);
    sendAppError(res, error);
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
                  meta.tier === 'alpha' ||
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
      throw new AppError('INVALID_FIELD', { params: { field: 'isFavorite' } });
    }

    const job = await getJob(id, req.userId!);
    if (!job) {
      throw new AppError('JOB_NOT_FOUND');
    }

    await setFavorite(id, req.userId!, isFavorite);
    res.status(200).json({ success: true, message: 'Favorite status updated.' });
  } catch (error: any) {
    if (!(error instanceof AppError)) console.error('Error updating favorite status:', error);
    sendAppError(res, error);
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
      throw new AppError('INVALID_FIELD', { params: { field: 'flags' } });
    }

    const isPremium = await checkPremium(req);
    if (!isPremium) {
      throw new AppError('PREMIUM_REQUIRED', { params: { feature: 'tags' } });
    }

    const job = await getJob(id, req.userId!);
    if (!job) {
      throw new AppError('JOB_NOT_FOUND');
    }

    await setFlags(id, req.userId!, flags);
    res.status(200).json({ success: true, message: 'Custom flags updated.' });
  } catch (error: any) {
    if (!(error instanceof AppError)) console.error('Error updating custom flags:', error);
    sendAppError(res, error);
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
    if (!(error instanceof AppError)) console.error('Error listing collections:', error);
    sendAppError(res, error);
  }
});

/**
 * Endpoint to create a new collection.
 * POST /api/collections
 */
apiRouter.post('/collections', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, emoji, position } = req.body;

    if (!name || typeof name !== 'string') {
      throw new AppError('INVALID_FIELD', { params: { field: 'name' } });
    }

    const isPremium = await checkPremium(req);
    if (!isPremium) {
      throw new AppError('PREMIUM_REQUIRED', { params: { feature: 'collections' } });
    }

    const collection = await createCollection(req.userId!, { name, emoji, position });
    res.status(201).json({ success: true, collection });
  } catch (error: any) {
    if (!(error instanceof AppError)) console.error('Error creating collection:', error);
    sendAppError(res, error);
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
      throw new AppError('MISSING_FIELD', { params: { field: 'message' } });
    }
    if (message.length > 4000) {
      throw new AppError('MESSAGE_TOO_LONG', { params: { max: 4000 } });
    }

    const feedbackType: 'bug' | 'idea' = type === 'idea' ? 'idea' : 'bug';

    if (context !== undefined && (typeof context !== 'object' || context === null)) {
      throw new AppError('INVALID_FIELD', { params: { field: 'context' } });
    }

    let screenshotsBase64: string[] | undefined;
    if (screenshots !== undefined) {
      if (!Array.isArray(screenshots) || !screenshots.every((s) => typeof s === 'string')) {
        throw new AppError('INVALID_FIELD', { params: { field: 'screenshots' } });
      }
      if (screenshots.length > 6) {
        throw new AppError('TOO_MANY_SCREENSHOTS', { params: { max: 6 } });
      }
      // Keep the whole payload under the global 1mb JSON body cap (base64 inflates ~33%).
      const totalLength = screenshots.reduce((sum: number, s: string) => sum + s.length, 0);
      if (totalLength > 1_500_000) {
        throw new AppError('SCREENSHOTS_TOO_LARGE');
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
    if (!(error instanceof AppError)) console.error('Error creating feedback:', error);
    sendAppError(res, error);
  }
});

/**
 * Endpoint to update a collection.
 * PATCH /api/collections/:id
 */
apiRouter.patch('/collections/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, emoji, position } = req.body;

    const isPremium = await checkPremium(req);
    if (!isPremium) {
      throw new AppError('PREMIUM_REQUIRED', { params: { feature: 'collections' } });
    }

    const collection = await updateCollection(id, req.userId!, { name, emoji, position });
    res.status(200).json({ success: true, collection });
  } catch (error: any) {
    if (!(error instanceof AppError)) console.error('Error updating collection:', error);
    sendAppError(res, error);
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
      throw new AppError('PREMIUM_REQUIRED', { params: { feature: 'collections' } });
    }

    const deleted = await deleteCollection(id, req.userId!);
    if (!deleted) {
      throw new AppError('COLLECTION_NOT_FOUND');
    }

    res.status(200).json({ success: true, message: 'Collection deleted.' });
  } catch (error: any) {
    if (!(error instanceof AppError)) console.error('Error deleting collection:', error);
    sendAppError(res, error);
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
      throw new AppError('INVALID_FIELD', { params: { field: 'collectionIds' } });
    }

    const isPremium = await checkPremium(req);
    if (!isPremium) {
      throw new AppError('PREMIUM_REQUIRED', { params: { feature: 'collections' } });
    }

    const job = await getJob(id, req.userId!);
    if (!job) {
      throw new AppError('JOB_NOT_FOUND');
    }

    await setRecipeCollections(id, req.userId!, collectionIds);
    res.status(200).json({ success: true, message: 'Recipe collections updated.' });
  } catch (error: any) {
    if (!(error instanceof AppError)) console.error('Error updating recipe collections:', error);
    sendAppError(res, error);
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
    if (!(error instanceof AppError)) console.error('Error fetching global settings:', error);
    sendAppError(res, error);
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
      throw new AppError('MISSING_FIELD', { params: { field: 'settings' } });
    }

    await updateGlobalSettings(settings);
    res.json({ success: true, message: 'Global settings updated.' });
  } catch (error) {
    if (!(error instanceof AppError)) console.error('Error updating global settings:', error);
    sendAppError(res, error);
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
    if (!(error instanceof AppError)) console.error('Error fetching feedback:', error);
    sendAppError(res, error);
  }
});

/**
 * Translate an admin-metrics range key into a query cutoff (`since`) and the
 * daily-chart window size (`windowDays`). `today`/`7d`/`30d` are calendar-day
 * windows anchored to the start of the day; `all` (default) is unbounded.
 */
function resolveMetricsRange(range: string): { since: Date | null; windowDays: number | null } {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  switch (range) {
    case 'today':
      return { since: startOfToday, windowDays: 1 };
    case '3d': {
      const since = new Date(startOfToday);
      since.setDate(since.getDate() - 2);
      return { since, windowDays: 3 };
    }
    case '7d': {
      const since = new Date(startOfToday);
      since.setDate(since.getDate() - 6);
      return { since, windowDays: 7 };
    }
    case '30d': {
      const since = new Date(startOfToday);
      since.setDate(since.getDate() - 29);
      return { since, windowDays: 30 };
    }
    case 'all':
    default:
      return { since: null, windowDays: null };
  }
}

/**
 * Retrieve system metrics and LLM cost analytics.
 * GET /api/admin/metrics
 * Requires admin privileges.
 */
apiRouter.get('/admin/metrics', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Resolve the requested time range into a cutoff timestamp + daily-window
    // size. `all` (or an unknown value) aggregates over all time.
    const range = String(req.query.range ?? 'all');
    const { since, windowDays } = resolveMetricsRange(range);

    // 1. Fetch users from Supabase Auth Admin API. `total` is the all-time
    // user base; `newInRange` counts users who registered within the selected
    // window (equal to `total` for the unbounded "all" range).
    let userCount = 0;
    let newUsers = 0;
    // Map of user_id → email, used to label the per-user extraction breakdown.
    const emailById = new Map<string, string | null>();
    try {
      const { data, error } = await getClient().auth.admin.listUsers({ perPage: 1000 });
      if (!error && data?.users) {
        userCount = data.users.length;
        newUsers = since
          ? data.users.filter((u) => u.created_at && new Date(u.created_at) >= since).length
          : userCount;
        for (const u of data.users) {
          emailById.set(u.id, u.email ?? null);
        }
      }
    } catch (err: any) {
      console.error('Error fetching users from Supabase Admin:', err.message);
    }

    // 2. Fetch db jobs metrics (scoped to the selected range)
    const jobsMetrics = await getJobMetrics(since, windowDays);

    // 2b. Fetch failed jobs details
    const failedJobsRaw = await getFailedJobs(since);
    const failedJobs = failedJobsRaw.map((job) => ({
      ...job,
      email: emailById.get(job.userId) ?? null,
    }));

    // 3. Fetch logs LLM metrics (scoped to the selected range)
    const llmMetrics = await getLlmMetrics(since, windowDays);

    // 4. Count extracted recipes per user (only users with >0 in the range),
    // resolving each user_id to an email for display.
    const perUserRaw = await getExtractionsPerUser(since);
    const extractionsPerUser = perUserRaw.map((entry) => ({
      userId: entry.userId,
      email: emailById.get(entry.userId) ?? null,
      count: entry.count,
    }));

    res.json({
      success: true,
      range,
      users: {
        total: userCount,
        newInRange: newUsers,
      },
      jobs: {
        ...jobsMetrics,
        failedJobs,
      },
      llm: llmMetrics,
      extractionsPerUser,
    });
  } catch (error) {
    if (!(error instanceof AppError)) console.error('Error fetching admin metrics:', error);
    sendAppError(res, error);
  }
});

/**
 * Retrieve a list of registered users.
 * GET /api/admin/users
 * Requires admin privileges.
 */
apiRouter.get('/admin/users', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getClient().auth.admin.listUsers({ perPage: 1000 });
    if (error) {
      throw error;
    }

    // Fetch extraction counts per user from jobs table
    const { data: jobs } = await getClient()
      .from('jobs')
      .select('user_id');

    const countsByUser: Record<string, number> = {};
    if (jobs) {
      jobs.forEach((j: { user_id: string }) => {
        if (j.user_id) {
          countsByUser[j.user_id] = (countsByUser[j.user_id] || 0) + 1;
        }
      });
    }

    const users = (data?.users || []).map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      tier: user.app_metadata?.tier || 'free',
      custom_limit: user.app_metadata?.custom_extraction_limit ?? user.app_metadata?.max_extractions_per_window ?? null,
      extractions_count: countsByUser[user.id] || 0,
    }));

    res.json({ success: true, users });
  } catch (error: any) {
    if (!(error instanceof AppError)) console.error('Error listing users for admin:', error);
    sendAppError(res, error);
  }
});




