import { Router, Request, Response } from 'express';
import { createJob, createRemixJob, getJob, findCompletedJobByUrl, getAllJobs, deleteJob } from './db.js';
import { requireAuth } from './auth.js';

export const apiRouter = Router();

apiRouter.use(requireAuth);

// Regular expression to validate basic Instagram Reel URLs
// Examples:
// - https://www.instagram.com/reel/C8C_jApt_2j/
// - https://instagram.com/reel/C8C_jApt_2j
const INSTAGRAM_REEL_REGEX = /^(https?:\/\/)?(www\.)?instagram\.com\/(?:reel|reels|p)\/[A-Za-z0-9_-]+\/?(\?.*)?$/i;

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

    if (!INSTAGRAM_REEL_REGEX.test(cleanUrl)) {
      res.status(400).json({
        success: false,
        error: 'Invalid URL. Must be a valid Instagram Reel URL (e.g., https://www.instagram.com/reel/.../ ).',
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
