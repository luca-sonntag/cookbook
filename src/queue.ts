import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { getNextPendingJob, updateJob } from './db.js';
import { scrapeReel } from './apify.js';
import { extractRecipeFromAudio } from './gemini.js';

let isRunning = false;
let workerInterval: NodeJS.Timeout | null = null;

/**
 * Downloads a file from a URL to a local destination, following HTTP/HTTPS redirects.
 */
async function downloadFile(url: string, destPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    function attemptGet(currentUrl: string) {
      const protocol = currentUrl.startsWith('https') ? https : http;
      const request = protocol.get(currentUrl, (response) => {
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
          fs.unlink(destPath).catch(() => {});
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
async function processJob(jobId: string, url: string): Promise<void> {
  const tempDir = path.resolve('temp-downloads');
  const framesDir = path.join(tempDir, `frames-${jobId}`);
  let audioFilePath = '';
  let videoFilePath = '';

  try {
    // 1. Mark job as scraping
    console.log(`[Job ${jobId}] Starting scraping for ${url}...`);
    await updateJob(jobId, { status: 'scraping' });

    // 2. Perform scraping via Apify
    const scrapeResult = await scrapeReel(url);
    console.log(`[Job ${jobId}] Scraped successfully. Caption length: ${scrapeResult.caption.length}`);

    // 3. Mark job as processing
    await updateJob(jobId, { status: 'processing' });

    // 4. Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    const audioExt = scrapeResult.audioUrl.includes('.mp3') ? '.mp3' : '.mp4';
    audioFilePath = path.join(tempDir, `${jobId}-audio${audioExt}`);
    const videoExt = '.mp4';
    videoFilePath = path.join(tempDir, `${jobId}-video${videoExt}`);

    // 5. Download audio and video in parallel
    console.log(`[Job ${jobId}] Downloading audio and video in parallel...`);
    const [mimeType] = await Promise.all([
      downloadFile(scrapeResult.audioUrl, audioFilePath),
      downloadFile(scrapeResult.videoUrl, videoFilePath).catch((err) => {
        // Video download is best-effort — don't fail the job if it fails
        console.warn(`[Job ${jobId}] Video download failed (will skip frame extraction): ${err.message}`);
        videoFilePath = '';
      }),
    ]);
    console.log(`[Job ${jobId}] Downloads complete.`);

    // 6. Run Gemini recipe extraction AND frame selection in parallel
    console.log(`[Job ${jobId}] Running recipe extraction and frame selection in parallel...`);

    const frameSelectionPromise: Promise<string | null> = videoFilePath
      ? (async () => {
          try {
            const { extractFrames } = await import('./frameExtractor.js');
            const { selectBestFoodFrame } = await import('./gemini.js');
            const framePaths = await extractFrames(videoFilePath, framesDir, 8);
            console.log(`[Job ${jobId}] Extracted ${framePaths.length} frames, asking Gemini to pick best food shot...`);
            const bestIndex = await selectBestFoodFrame(framePaths);
            console.log(`[Job ${jobId}] Best frame selected: index ${bestIndex}`);

            // Save best frame permanently as a local file
            const recipeImagesDir = path.resolve('public', 'recipe-images');
            await fs.mkdir(recipeImagesDir, { recursive: true });
            const savedImagePath = path.join(recipeImagesDir, `${jobId}.jpg`);
            await fs.copyFile(framePaths[bestIndex], savedImagePath);
            return `/recipe-images/${jobId}.jpg`;
          } catch (err: any) {
            console.warn(`[Job ${jobId}] Frame selection failed (falling back to cover): ${err.message}`);
            return null;
          }
        })()
      : Promise.resolve(null);

    const [recipe, selectedImageUrl] = await Promise.all([
      extractRecipeFromAudio(audioFilePath, mimeType as string, scrapeResult.caption),
      frameSelectionPromise,
    ]);

    console.log(`[Job ${jobId}] Recipe extracted: "${recipe.title}"`);

    // Assign image: prefer Gemini-selected frame, fall back to Apify cover thumbnail
    recipe.imageUrl = selectedImageUrl ?? scrapeResult.imageUrl ?? null;

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
    // 8. Cleanup local audio and video files
    const cleanupPaths = [audioFilePath, videoFilePath].filter(Boolean);
    await Promise.allSettled(cleanupPaths.map((p) => fs.unlink(p).catch(() => {})));
    // Cleanup temp frames dir
    await fs.rm(framesDir, { recursive: true, force: true }).catch(() => {});
    console.log(`[Job ${jobId}] Temp files cleaned up.`);
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
      await processJob(job.id, job.url);
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
