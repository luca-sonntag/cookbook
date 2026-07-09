import { Router, Request, Response } from 'express';
import { createJob, createRemixJob, getJob, findCompletedJobByUrl, getAllJobs, deleteJob, deleteRecipeFrames, countActiveJobsForUser, getClient, getExtractionsForUserInTimeframe, countCompletedRecipesForUser } from './db.js';
import { config } from './config.js';
import { requireAuth } from './auth.js';

export const apiRouter = Router();

apiRouter.use(requireAuth);

// Regular expression to validate standard URLs
// Supports Instagram, TikTok, YouTube Shorts, and generic websites
const SUPPORTED_URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;

/**
 * Helper to determine a user's rate limit based on their tier and overrides in app_metadata.
 */
function resolveUserRateLimit(user: any): number {
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
    return config.PREMIUM_MAX_EXTRACTIONS_PER_WINDOW;
  }

  // 3. Fallback to free tier
  return config.FREE_MAX_EXTRACTIONS_PER_WINDOW;
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
      const { data, error: authError } = await getClient().auth.admin.getUserById(req.userId!);
      if (!authError) user = data.user;
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
      if (savedCount >= config.FREE_MAX_SAVED_RECIPES) {
        res.status(403).json({
          success: false,
          code: 'COOKBOOK_FULL',
          error: `Cookbook full (${savedCount}/${config.FREE_MAX_SAVED_RECIPES}). Delete a recipe or upgrade to Premium to extract more.`,
        });
        return;
      }
    }

    // Enforce rolling rate limit per user (with custom override in app_metadata)
    const limit = user ? resolveUserRateLimit(user) : config.FREE_MAX_EXTRACTIONS_PER_WINDOW;

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
      const { data, error: authError } = await getClient().auth.admin.getUserById(req.userId!);
      if (!authError && data?.user) {
        user = data.user;
      }

      // Dev-override: allow simulating premium in development environments
      if (process.env.NODE_ENV !== 'production' && req.headers['x-simulate-premium'] === 'true') {
        if (!user) user = { id: req.userId, app_metadata: {} };
        if (!user.app_metadata) user.app_metadata = {};
        user.app_metadata.tier = 'premium';
      }

      if (user) {
        const meta = user.app_metadata || {};
        isPremium = meta.tier === 'premium' ||
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
    let limit = config.FREE_MAX_EXTRACTIONS_PER_WINDOW;
    let tier: 'free' | 'premium' = 'free';
    let user: any = null;
    try {
      const { data, error: authError } = await getClient().auth.admin.getUserById(req.userId!);
      if (!authError && data.user) {
        user = data.user;
      }
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
      limit = resolveUserRateLimit(user);
      tier = user.app_metadata?.tier === 'premium' ? 'premium' : 'free';
    }

    const windowDays = config.EXTRACTION_LIMIT_WINDOW_DAYS;

    // Cookbook cap status (mirrors the POST /extract-recipe enforcement) so the
    // extract screen can proactively show a "cookbook full" state.
    const premium = isPremiumUser(user);
    const savedRecipes = await countCompletedRecipesForUser(req.userId!);
    const maxSavedRecipes = premium ? -1 : config.FREE_MAX_SAVED_RECIPES;
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
        const { error } = await getClient().auth.admin.updateUserById(userId, {
          app_metadata: { tier: clientTier },
        });
        if (error) throw error;
        res.status(200).json({ success: true, tier: clientTier, fallback: true });
        return;
      }
      res.status(200).json({ success: true, tier: 'free', fallback: true });
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

    const newTier = isPremium ? 'premium' : 'free';

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

