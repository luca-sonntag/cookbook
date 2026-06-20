import { Router, Request, Response } from 'express';
import { createJob, getJob, findCompletedJobByUrl } from './db.js';
import { requireApiKey } from './auth.js';

export const apiRouter = Router();

apiRouter.use(requireApiKey);

// Regular expression to validate basic Instagram Reel URLs
// Examples:
// - https://www.instagram.com/reel/C8C_jApt_2j/
// - https://instagram.com/reel/C8C_jApt_2j
const INSTAGRAM_REEL_REGEX = /^(https?:\/\/)?(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?(\?.*)?$/;

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

    // Check if job for this URL has already successfully completed
    const existingJob = await findCompletedJobByUrl(cleanUrl);
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
    const job = await createJob(cleanUrl);


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

    const job = await getJob(id);

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
