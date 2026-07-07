import { Router, Request, Response } from 'express';
import { createJob, createRemixJob, getJob, findCompletedJobByUrl, getAllJobs, deleteJob, deleteRecipeFrames, countActiveJobsForUser, getClient, getExtractionsForUserInTimeframe } from './db.js';
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

    // Enforce rolling rate limit per user (with custom override in app_metadata)
    let limit = config.FREE_MAX_EXTRACTIONS_PER_WINDOW;
    try {
      const { data: { user }, error: authError } = await getClient().auth.admin.getUserById(req.userId!);
      if (!authError && user) {
        limit = resolveUserRateLimit(user);
      }
    } catch (err) {
      console.warn(`Failed to fetch user metadata for rate limit check:`, err);
    }

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
    try {
      const { data: { user }, error: authError } = await getClient().auth.admin.getUserById(req.userId!);
      if (!authError && user) {
        limit = resolveUserRateLimit(user);
        tier = user.app_metadata?.tier === 'premium' ? 'premium' : 'free';
      }
    } catch (err) {
      console.warn(`Failed to fetch user metadata for rate limit status:`, err);
    }

    const windowDays = config.EXTRACTION_LIMIT_WINDOW_DAYS;

    if (limit < 0) {
      res.status(200).json({
        success: true,
        tier,
        limit: -1,
        used: 0,
        remaining: -1,
        windowDays
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
      windowDays
    });
  } catch (error) {
    console.error('Error fetching rate limit status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching rate limit status.',
    });
  }
});

