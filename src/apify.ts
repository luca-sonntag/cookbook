import { ApifyClient } from 'apify-client';
import { config } from './config.js';
import { withRetry } from './retry.js';

// Initialize the Apify Client
const client = new ApifyClient({
  token: config.APIFY_TOKEN,
});

export interface ScrapingResult {
  caption: string;
  audioUrl: string;
  videoUrl: string;
  imageUrl: string;
  instagramHandle?: string;
}

/**
 * Triggers the Apify Instagram Reel Scraper for the given Reel URL
 * and extracts the caption and direct audio URL from the dataset items.
 */
export async function scrapeReel(reelUrl: string): Promise<ScrapingResult> {
  if (!config.APIFY_TOKEN || config.APIFY_TOKEN === 'your_apify_token_here') {
    throw new Error('Apify API token is not configured in environment variables.');
  }

  const { run, items } = await withRetry(async () => {
    const run = await client.actor('apify/instagram-reel-scraper').call({ username: [reelUrl] });
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    return { run, items };
  }, { maxAttempts: 3, baseDelayMs: 2000 });

  if (!items || items.length === 0) {
    throw new Error('No items found in the scraper dataset output.');
  }

  const item = items[0];

  // Extract caption and audioUrl
  const caption = (item.caption as string) || '';
  const audioUrl = (item.audioUrl as string) || '';
  const videoUrl = (item.videoUrl || item.video_url || (item.videoVersions as any[])?.[0]?.url || audioUrl) as string;
  const imageUrl = (item.displayUrl || item.thumbnail_url || item.thumbnailUrl || item.videoCover || '') as string;
  const instagramHandle = (item.ownerUsername || item.username || '') as string;

  if (!audioUrl) {
    throw new Error('Audio URL was not found in the scraped reel metadata.');
  }

  return {
    caption,
    audioUrl,
    videoUrl,
    imageUrl,
    instagramHandle: instagramHandle ? `@${instagramHandle.replace(/^@/, '')}` : undefined,
  };
}

/**
 * Triggers the Apify Youtube Video Downloader for the given YouTube URL
 * and extracts the caption, direct audio/video URLs and author handle.
 */
export async function scrapeYoutubeVideo(videoUrl: string): Promise<ScrapingResult> {
  if (!config.APIFY_TOKEN || config.APIFY_TOKEN === 'your_apify_token_here') {
    throw new Error('Apify API token is not configured in environment variables.');
  }

  const { items } = await withRetry(async () => {
    const run = await client.actor('apilabs/youtube-video-downloader').call({
      urls: [{ url: videoUrl }]
    });
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    return { items };
  }, { maxAttempts: 3, baseDelayMs: 2000 });

  if (!items || items.length === 0) {
    throw new Error('No items found in the YouTube downloader dataset output.');
  }

  const item = items[0];

  const caption = (item.title || item.description || item.caption || '') as string;
  const audioUrl = (item.audioUrl || item.downloadUrl || item.videoUrl || item.url || item.formats?.[0]?.url || '') as string;
  const targetVideoUrl = (item.downloadUrl || item.videoUrl || item.url || item.formats?.[0]?.url || '') as string;
  const imageUrl = (item.thumbnail || item.thumbnailUrl || item.imageUrl || '') as string;
  
  let authorHandle = (item.uploader_id || item.uploader || item.channel || '') as string;
  if (authorHandle && !authorHandle.startsWith('@')) {
    authorHandle = `@${authorHandle}`;
  }

  if (!audioUrl) {
    throw new Error('No download link was found in the scraped YouTube metadata.');
  }

  return {
    caption,
    audioUrl,
    videoUrl: targetVideoUrl,
    imageUrl,
    instagramHandle: authorHandle || undefined,
  };
}

/**
 * Triggers the Apify TikTok Video Scraper for the given TikTok URL
 * and extracts the caption, direct video URL and author handle.
 */
export async function scrapeTiktokVideo(videoUrl: string): Promise<ScrapingResult> {
  if (!config.APIFY_TOKEN || config.APIFY_TOKEN === 'your_apify_token_here') {
    throw new Error('Apify API token is not configured in environment variables.');
  }

  const { items } = await withRetry(async () => {
    const run = await client.actor('clockworks/tiktok-video-scraper').call({
      postURLs: [videoUrl]
    });
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    return { items };
  }, { maxAttempts: 3, baseDelayMs: 2000 });

  if (!items || items.length === 0) {
    throw new Error('No items found in the TikTok video scraper dataset output.');
  }

  const item = items[0];

  const caption = (item.text || item.caption || '') as string;
  const playAddr = (item.video?.downloadAddr || item.video?.playAddr || item.videoUrl || item.downloadAddr || '') as string;
  const imageUrl = (item.video?.cover || item.imageUrl || '') as string;
  
  let authorHandle = (item.author?.username || item.author?.nickname || '') as string;
  if (authorHandle && !authorHandle.startsWith('@')) {
    authorHandle = `@${authorHandle}`;
  }

  if (!playAddr) {
    throw new Error('No download link was found in the scraped TikTok metadata.');
  }

  return {
    caption,
    audioUrl: playAddr,
    videoUrl: playAddr,
    imageUrl,
    instagramHandle: authorHandle || undefined,
  };
}

