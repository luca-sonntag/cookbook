import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import path from 'path';
import { getNextPendingJob, updateJob } from './db.js';
import { scrapeReel } from './apify.js';
import { extractRecipeFromAudio } from './gemini.js';

let isRunning = false;
let workerInterval: NodeJS.Timeout | null = null;

/**
 * Downloads a file from a URL to a local destination.
 */
async function downloadFile(url: string, destPath: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download audio file from ${url}: HTTP ${response.status} ${response.statusText}`);
  }

  const mimeType = response.headers.get('content-type') || 'audio/mp4';
  const body = response.body;
  if (!body) {
    throw new Error('Download response body is empty.');
  }

  const fileStream = createWriteStream(destPath);
  const nodeStream = Readable.fromWeb(body as any);
  await pipeline(nodeStream, fileStream);

  return mimeType;
}

/**
 * Processes a single job end-to-end.
 */
async function processJob(jobId: string, url: string): Promise<void> {
  const tempDir = path.resolve('temp-downloads');
  let audioFilePath = '';

  try {
    // 1. Mark job as scraping
    console.log(`[Job ${jobId}] Starting scraping for ${url}...`);
    await updateJob(jobId, { status: 'scraping' });

    // 2. Perform scraping via Apify
    const scrapeResult = await scrapeReel(url);
    console.log(`[Job ${jobId}] Scraped successfully. Caption length: ${scrapeResult.caption.length}`);

    // 3. Mark job as processing
    await updateJob(jobId, { status: 'processing' });

    // 4. Ensure temp directory exists and download audio file
    await fs.mkdir(tempDir, { recursive: true });
    // Determine extension: usually instagram reel audio is mp4 audio (m4a/mp4) or mp3
    const fileExt = scrapeResult.audioUrl.includes('.mp3') ? '.mp3' : '.mp4';
    audioFilePath = path.join(tempDir, `${jobId}${fileExt}`);

    console.log(`[Job ${jobId}] Downloading audio file...`);
    const mimeType = await downloadFile(scrapeResult.audioUrl, audioFilePath);
    console.log(`[Job ${jobId}] Downloaded to ${audioFilePath} (${mimeType})`);

    // 5. Upload to Gemini and extract recipe
    console.log(`[Job ${jobId}] Uploading to Gemini and extracting recipe...`);
    const recipe = await extractRecipeFromAudio(audioFilePath, mimeType, scrapeResult.caption);
    console.log(`[Job ${jobId}] Recipe successfully extracted! Title: "${recipe.title}"`);

    // 6. Update job as completed
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
    // 7. Cleanup local audio file
    if (audioFilePath) {
      try {
        await fs.unlink(audioFilePath);
        console.log(`[Job ${jobId}] Cleaned up local file ${audioFilePath}`);
      } catch (err: any) {
        // Ignore file not found or already deleted
      }
    }
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
