import fs from 'fs/promises';
import path from 'path';
import { claimNextJob, updateJob, getJob, getClient, reclaimExpiredJobs, heartbeatJob, uploadRecipeFrame, sweepOldRecipeFrames, getMaxVideoDurationSeconds } from './db.js';
import { randomUUID } from 'node:crypto';
import { getScraperForUrl } from './scrapers/index.js';
import { downloadMedia } from './scrapers/download.js';
import { extractRecipe, remixRecipe } from './gemini.js';
import { pruneOldGeminiLogs } from './logger.js';
import type { Job, ProgressData } from './types.js';
import { config } from './config.js';

const workerId = randomUUID();
let activeJobs = 0;
let workerInterval: NodeJS.Timeout | null = null;
let reclaimInterval: NodeJS.Timeout | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Processes a single job end-to-end.
 */
async function processJob(job: Job): Promise<void> {
  const jobId = job.id;
  const url = job.url;
  const safeTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const userSegment = job.userId ? job.userId : 'unassigned';
  const runDir = path.resolve('logs', userSegment, `run-${safeTimestamp}_${jobId}`);
  const framesDir = path.join(runDir, 'frames');
  let audioFilePath = '';
  let videoFilePath = '';
  let framePaths: string[] = [];

  const heartbeat = setInterval(() => heartbeatJob(jobId), 30_000);

  try {
    // Fetch user preferences from Supabase Auth admin API if userId is present
    let userPrefs: {
      recipeLanguage?: string;
      preferredTemperatureUnit?: string;
      preferredUnitSystem?: string;
    } | undefined;

    if (job.userId) {
      try {
        console.log(`[Job ${jobId}] Fetching user metadata for user ${job.userId}...`);
        const { data: { user }, error: authError } = await getClient().auth.admin.getUserById(job.userId);
        if (authError) {
          console.warn(`[Job ${jobId}] Failed to fetch user metadata: ${authError.message}`);
        } else if (user?.user_metadata) {
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
          console.log(`[Job ${jobId}] Loaded user preferences:`, userPrefs);
        }
      } catch (err: any) {
        console.warn(`[Job ${jobId}] Error retrieving user metadata: ${err.message}`);
      }
    }

    if (job.parentJobId) {
      console.log(`[Job ${jobId}] Starting remix processing...`);
      await updateJob(jobId, { status: 'processing', recipe: { isProgress: true, percent: 30, stage: 'extracting_recipe' } as any });
      await fs.mkdir(runDir, { recursive: true });

      const parentJob = await getJob(job.parentJobId);
      if (!parentJob || !parentJob.recipe) {
        throw new Error('Parent job or recipe not found for remix.');
      }

      console.log(`[Job ${jobId}] Requesting remix from Gemini...`);
      const recipe = await remixRecipe(parentJob.recipe, job.prompt || '', runDir, userPrefs);
      
      if (recipe.isRecipe === false) {
        throw new Error('Unrelated request: The prompt was not recognized as a valid recipe modification.');
      }

      recipe.id = jobId;
      recipe.imageUrl = parentJob.recipe.imageUrl;
      recipe.imageUrls = parentJob.recipe.imageUrls;
      recipe.instagramHandle = parentJob.recipe.instagramHandle;
      recipe.parentJobId = parentJob.id;
      recipe.parentRecipeTitle = parentJob.recipe.title;
      recipe.remixPrompt = job.prompt || null;

      await updateJob(jobId, { status: 'completed', recipe, error: null });
      return;
    }

    // 1. Mark job as scraping
    console.log(`[Job ${jobId}] Starting scraping for ${url}...`);
    await updateJob(jobId, { status: 'scraping', recipe: { isProgress: true, percent: 15, stage: 'scraping' } as any });

    // 2. Perform scraping via the appropriate scraper
    const scraper = getScraperForUrl(url);
    const scrapeResult = await scraper.scrape(url, jobId);
    console.log(`[Job ${jobId}] Scraped successfully. Caption/Title length: ${scrapeResult.caption.length}`);

    // 2b. Enforce the video-length cap *before* downloading — the duration is known from
    // scrape metadata (RapidAPI / yt-dlp), so we reject over-limit videos without spending
    // any download bandwidth. 0 disables the check; results without a reported duration pass.
    // Prioritise the DB-backed `max_video_duration_seconds` global setting over the env default.
    const maxDuration = await getMaxVideoDurationSeconds();
    if (maxDuration > 0 && scrapeResult.durationSeconds && scrapeResult.durationSeconds > maxDuration) {
      const actualSec = Math.round(scrapeResult.durationSeconds);
      throw new Error(`Video too long: ${actualSec}s exceeds the ${maxDuration}s limit.`);
    }

    // 3. Mark job as processing
    await updateJob(jobId, { status: 'processing', recipe: { isProgress: true, percent: 50, stage: 'downloading_media' } as any });

    // 4. Ensure run directory exists
    await fs.mkdir(runDir, { recursive: true });

    // 5. Download audio + video to local files (download strategy encapsulated per provider).
    console.log(`[Job ${jobId}] Downloading media...`);
    const downloaded = await downloadMedia(scrapeResult.media, runDir);
    audioFilePath = downloaded.audioFilePath;
    videoFilePath = downloaded.videoFilePath;
    const mimeType = downloaded.mimeType;
    console.log(`[Job ${jobId}] Downloads complete (media: ${(downloaded.mediaBytes / (1024 * 1024)).toFixed(2)} MB).`);

    // Persist the total downloaded media size (audio + video) so admin metrics
    // can aggregate total downloaded MB over a time window. A failure here must
    // not abort recipe extraction, so we swallow errors.
    if (downloaded.mediaBytes > 0) {
      await updateJob(jobId, { mediaBytes: downloaded.mediaBytes }).catch((err) =>
        console.warn(`[Job ${jobId}] Failed to persist media_bytes: ${err.message}`),
      );
    }

    // 6. If video is available, extract frames and create grid first
    let gridImagePath: string | undefined;
    framePaths = [];

    if (videoFilePath) {
      await updateJob(jobId, { status: 'processing', recipe: { isProgress: true, percent: 55, stage: 'extracting_frames' } as any });
      try {
        const { extractFrames, createImageGrid } = await import('./frameExtractor.js');
        console.log(`[Job ${jobId}] Extracting frames from video...`);
        framePaths = await extractFrames(videoFilePath, framesDir);
        
        const localGridPath = path.join(framesDir, 'grid.jpg');
        console.log(`[Job ${jobId}] Creating tiled frame grid at ${localGridPath}...`);
        await createImageGrid(framePaths, localGridPath);
        gridImagePath = localGridPath;
      } catch (err: any) {
        console.warn(`[Job ${jobId}] Frame extraction / grid generation failed: ${err.message}`);
      }
    }

    console.log(`[Job ${jobId}] Running recipe extraction and frame selection in parallel...`);

    const frameSelectionPromise: Promise<string[] | null> = (gridImagePath && framePaths.length > 0)
      ? (async () => {
        try {
          const { selectBestFoodFrame } = await import('./gemini.js');
          console.log(`[Job ${jobId}] Asking Gemini to pick best food shots from grid...`);
          const bestIndices = await selectBestFoodFrame(framePaths, gridImagePath, runDir);
          console.log(`[Job ${jobId}] Best frames selected: indices ${bestIndices.join(', ')}`);

          // Upload best frames to Supabase Storage as a transient hand-off: the
          // extracting device pulls them once (GET /api/jobs/:id/frames) and they
          // are deleted right after. The recipe stores only local references, so
          // we never persist/rehost third-party video frames server-side.
          const localRefs: string[] = [];
          for (let i = 0; i < bestIndices.length; i++) {
            const idx = bestIndices[i];
            const buffer = await fs.readFile(framePaths[idx]);
            await uploadRecipeFrame(jobId, i, buffer);
            localRefs.push(`local:${jobId}:${i}`);
          }

          return localRefs;
        } catch (err: any) {
          console.warn(`[Job ${jobId}] Frame selection failed (falling back to cover): ${err.message}`);
          return null;
        }
      })()
      : Promise.resolve(null);

    await updateJob(jobId, { status: 'processing', recipe: { isProgress: true, percent: 75, stage: 'extracting_recipe' } as any });

    const [recipe, selectedImageUrls] = await Promise.all([
      extractRecipe(
        audioFilePath || undefined,
        mimeType,
        scrapeResult.caption,
        gridImagePath,
        runDir,
        userPrefs,
        scrapeResult.htmlContent
      ),
      frameSelectionPromise,
    ]);

    console.log(`[Job ${jobId}] Recipe extracted: "${recipe.title}"`);
    await updateJob(jobId, { status: 'processing', recipe: { isProgress: true, percent: 90, stage: 'finalizing' } as any });

    // Assign image: prefer Gemini-selected frames, fall back to scraper thumbnail
    if (selectedImageUrls && selectedImageUrls.length > 0) {
      recipe.imageUrls = selectedImageUrls;
      recipe.imageUrl = selectedImageUrls[0];
    } else {
      recipe.imageUrl = scrapeResult.imageUrl ?? null;
      if (recipe.imageUrl) {
        recipe.imageUrls = [recipe.imageUrl];
      }
    }

    recipe.instagramHandle = scrapeResult.authorHandle || null;

    // Assign unique recipe ID equal to jobId
    recipe.id = jobId;

    // 7. Update job as completed
    await updateJob(jobId, {
      status: 'completed',
      recipe,
      error: null,
    });
  } catch (error: any) {
    console.error(`[Job ${jobId}] Failed during execution:`, error.message);
    await updateJob(jobId, {
      status: 'failed',
      error: error.message || 'Unknown error occurred during processing.',
    });
  } finally {
    clearInterval(heartbeat);
    const cleanupPaths = [audioFilePath, videoFilePath, ...framePaths].filter(Boolean);
    await Promise.allSettled(cleanupPaths.map((p) => fs.unlink(p).catch(() => { })));
    console.log(`[Job ${jobId}] Temp files (including ${framePaths.length} individual frames) cleaned up. Run folder: ${runDir}`);
  }
}

/**
 * Worker loop that claims and dispatches jobs up to WORKER_CONCURRENCY in parallel.
 */
async function workerTick(): Promise<void> {
  while (activeJobs < config.WORKER_CONCURRENCY) {
    let job;
    try {
      job = await claimNextJob(workerId);
    } catch (error: any) {
      console.error('Error claiming job:', error.message);
      break;
    }
    if (!job) break;

    activeJobs++;
    processJob(job).finally(() => {
      activeJobs--;
    });
  }
}

async function cleanupOldRunDirs(days: number): Promise<void> {
  try {
    const logsDir = path.resolve('logs');
    const userDirs = await fs.readdir(logsDir);
    const now = Date.now();
    const maxAgeMs = days * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const userDir of userDirs) {
      const userDirPath = path.join(logsDir, userDir);
      const userStat = await fs.stat(userDirPath);
      if (!userStat.isDirectory()) continue;

      const files = await fs.readdir(userDirPath);
      for (const file of files) {
        if (!file.startsWith('run-')) continue;
        const filePath = path.join(userDirPath, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory() && (now - stats.mtimeMs) > maxAgeMs) {
          await fs.rm(filePath, { recursive: true, force: true });
          deletedCount++;
        }
      }

      // Cleanup empty user directories
      const remainingFiles = await fs.readdir(userDirPath);
      if (remainingFiles.length === 0) {
        await fs.rm(userDirPath, { recursive: true, force: true });
      }
    }
    if (deletedCount > 0) {
      console.log(`[Cleanup] Deleted ${deletedCount} old run directories (older than ${days} days).`);
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error('[Cleanup] Error cleaning up old logs:', err.message);
    }
  }
}

/**
 * Starts the background job queue loop.
 */
export function startQueue(pollIntervalMs = 2000): void {
  if (workerInterval) return;
  console.log('Background job queue worker started.');

  workerInterval = setInterval(workerTick, pollIntervalMs);
  reclaimInterval = setInterval(
    () => reclaimExpiredJobs(config.WORKER_LEASE_TIMEOUT_MINUTES).catch(console.error),
    60_000
  );
  
  // Run cleanup once at startup, then every 12 hours.
  // Local debug run-dirs are pruned after 30 days; the persistent gemini_logs
  // table is pruned after 90 days (wider than the 30-day metrics window).
  const runCleanup = () => {
    cleanupOldRunDirs(30);
    void pruneOldGeminiLogs(90);
    // Backstop for transient recipe frames the device never pulled (see db.ts).
    sweepOldRecipeFrames(24)
      .then(n => { if (n > 0) console.log(`[cleanup] Swept ${n} orphaned recipe frame(s).`); })
      .catch(err => console.error('[cleanup] Frame sweep failed:', err));
  };
  runCleanup();
  cleanupInterval = setInterval(runCleanup, 12 * 60 * 60 * 1000);

}

/**
 * Stops the background job queue loop.
 */
export function stopQueue(): void {
  if (workerInterval) { clearInterval(workerInterval); workerInterval = null; }
  if (reclaimInterval) { clearInterval(reclaimInterval); reclaimInterval = null; }
  if (cleanupInterval) { clearInterval(cleanupInterval); cleanupInterval = null; }
  console.log('Background job queue worker stopped.');
}
