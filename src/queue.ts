import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { getNextPendingJob, updateJob, getJob, getClient, resetStuckJobs } from './db.js';
import { getScraperForUrl } from './scrapers/index.js';
import { extractRecipe, remixRecipe } from './gemini.js';
import type { Job } from './types.js';
import yt from 'youtube-dl-exec';

const youtubedl: any = (yt as any).default || yt;

let isRunning = false;
let workerInterval: NodeJS.Timeout | null = null;

/**
 * Downloads a file from a URL to a local destination, following HTTP/HTTPS redirects.
 */
async function downloadFile(url: string, destPath: string, headers?: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    function attemptGet(currentUrl: string) {
      const protocol = currentUrl.startsWith('https') ? https : http;
      const request = protocol.get(currentUrl, { headers }, (response) => {
        // Handle redirect
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            attemptGet(redirectUrl);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download audio file from ${currentUrl}: HTTP ${response.statusCode} ${response.statusMessage}`));
          return;
        }

        const mimeType = response.headers['content-type'] || 'audio/mp4';
        const fileStream = createWriteStream(destPath);

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => {
            resolve(mimeType);
          });
        });

        fileStream.on('error', (err) => {
          fs.unlink(destPath).catch(() => { });
          reject(err);
        });
      });

      request.on('error', (err) => {
        reject(err);
      });
    }

    attemptGet(url);
  });
}

/**
 * Processes a single job end-to-end.
 */
async function processJob(job: Job): Promise<void> {
  const jobId = job.id;
  const url = job.url;
  const safeTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.resolve('logs', `run-${safeTimestamp}_${jobId}`);
  const framesDir = path.join(runDir, 'frames');
  let audioFilePath = '';
  let videoFilePath = '';

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
      await updateJob(jobId, { status: 'processing' });
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
    await updateJob(jobId, { status: 'scraping' });

    // 2. Perform scraping via the appropriate scraper
    const scraper = getScraperForUrl(url);
    const scrapeResult = await scraper.scrape(url);
    console.log(`[Job ${jobId}] Scraped successfully. Caption/Title length: ${scrapeResult.caption.length}`);

    // 3. Mark job as processing
    await updateJob(jobId, { status: 'processing' });

    // 4. Ensure run directory exists
    await fs.mkdir(runDir, { recursive: true });

    let mimeType: string | undefined = undefined;

    // 5. Download audio and video in parallel (if available)
    if (scrapeResult.audioUrl || scrapeResult.requiresYtDlpDownload) {
      console.log(`[Job ${jobId}] Downloading audio/video...`);
      const audioExt = scrapeResult.requiresYtDlpDownload ? '.mp3' : ((scrapeResult.audioUrl && scrapeResult.audioUrl.includes('.mp3')) ? '.mp3' : '.mp4');
      audioFilePath = path.join(runDir, `audio${audioExt}`);
      videoFilePath = path.join(runDir, 'video.mp4');
      
      const downloadPromises: Promise<any>[] = [];

      if (scrapeResult.requiresYtDlpDownload && scrapeResult.originalUrl) {
        // Use yt-dlp directly for robust downloading instead of native http requests
        downloadPromises.push(
          youtubedl(scrapeResult.originalUrl, { 
            output: audioFilePath, 
            format: 'bestaudio/best', 
            extractAudio: true,
            audioFormat: 'mp3',
            noWarnings: true 
          })
            .catch((err: any) => {
              console.warn(`[Job ${jobId}] yt-dlp audio download failed: ${err.message}`);
              audioFilePath = '';
            })
        );
        if (scrapeResult.videoUrl) {
           downloadPromises.push(
            youtubedl(scrapeResult.originalUrl, { output: videoFilePath, format: 'bestvideo/best', noWarnings: true })
              .catch((err: any) => {
                console.warn(`[Job ${jobId}] yt-dlp video download failed (will skip frame extraction): ${err.message}`);
                videoFilePath = '';
              })
          );
        }
      } else {
        downloadPromises.push(downloadFile(scrapeResult.audioUrl!, audioFilePath, scrapeResult.headers).catch((err) => {
          console.warn(`[Job ${jobId}] Audio download failed: ${err.message}`);
          audioFilePath = '';
        }));
        
        if (scrapeResult.videoUrl) {
          downloadPromises.push(downloadFile(scrapeResult.videoUrl, videoFilePath, scrapeResult.headers).catch((err) => {
            console.warn(`[Job ${jobId}] Video download failed (will skip frame extraction): ${err.message}`);
            videoFilePath = '';
          }));
        }
      }

      await Promise.allSettled(downloadPromises);
      mimeType = audioExt === '.mp3' ? 'audio/mp3' : 'audio/mp4'; // Fallback
      console.log(`[Job ${jobId}] Downloads complete.`);
    }

    // 6. If video is available, extract frames and create grid first
    let gridImagePath: string | undefined;
    let framePaths: string[] = [];

    if (videoFilePath) {
      try {
        const { extractFrames, createImageGrid } = await import('./frameExtractor.js');
        console.log(`[Job ${jobId}] Extracting frames from video...`);
        framePaths = await extractFrames(videoFilePath, framesDir, 25);
        
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

          // Save best frames permanently as local files
          const recipeImagesDir = path.resolve('public', 'recipe-images');
          await fs.mkdir(recipeImagesDir, { recursive: true });
          
          const savedUrls: string[] = [];
          for (let i = 0; i < bestIndices.length; i++) {
            const idx = bestIndices[i];
            const savedImagePath = path.join(recipeImagesDir, `${jobId}-${i}.jpg`);
            await fs.copyFile(framePaths[idx], savedImagePath);
            savedUrls.push(`/recipe-images/${jobId}-${i}.jpg`);
          }

          return savedUrls;
        } catch (err: any) {
          console.warn(`[Job ${jobId}] Frame selection failed (falling back to cover): ${err.message}`);
          return null;
        }
      })()
      : Promise.resolve(null);

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
    // 8. Cleanup local audio and video files (frames are kept for inspection)
    const cleanupPaths = [audioFilePath, videoFilePath].filter(Boolean);
    await Promise.allSettled(cleanupPaths.map((p) => fs.unlink(p).catch(() => { })));
    console.log(`[Job ${jobId}] Temp files cleaned up. Run folder: ${runDir}`);
  }
}

/**
 * Worker loop that picks up the next pending job.
 */
async function workerTick(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const job = await getNextPendingJob();
    if (job) {
      await processJob(job);
    }
  } catch (error: any) {
    console.error('Error in worker queue tick:', error.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Starts the background job queue loop.
 */
export function startQueue(pollIntervalMs = 2000): void {
  if (workerInterval) return;
  console.log('Background job queue worker started.');

  // Reset any scraping/processing jobs stuck from a previous crash/restart to failed
  resetStuckJobs().catch(err => {
    console.error('Failed to reset stuck jobs on startup:', err);
  });

  workerInterval = setInterval(workerTick, pollIntervalMs);
}

/**
 * Stops the background job queue loop.
 */
export function stopQueue(): void {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('Background job queue worker stopped.');
  }
}
