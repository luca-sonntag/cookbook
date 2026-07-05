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
 * Triggers the Apify All Social Media Video Downloader for the given URL
 * and extracts the caption, direct video URL, image URL and author/uploader.
 */
export async function scrapeSocialMediaVideo(videoUrl: string): Promise<ScrapingResult> {
  if (!config.APIFY_TOKEN || config.APIFY_TOKEN === 'your_apify_token_here') {
    throw new Error('Apify API token is not configured in environment variables.');
  }

  const { items } = await withRetry(async () => {
    const run = await client.actor('wilcode/all-social-media-video-downloader').call({
      url: videoUrl,
      mergeAV: true,
    });
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    return { items };
  }, { maxAttempts: 3, baseDelayMs: 2000 });

  if (!items || items.length === 0) {
    throw new Error('No items found in the All Social Media Video Downloader dataset output.');
  }

  const item = items[0] as any;

  const caption = (item.description || item.title || item.caption || '') as string;
  
  let downloadUrl = '';
  if (item.download) {
    if (Array.isArray(item.download) && item.download.length > 0) {
      const mergedItem = item.download.find((d: any) => d.resolution === 'merged');
      if (mergedItem && typeof mergedItem.url === 'string') {
        downloadUrl = mergedItem.url;
      } else if (typeof item.download[0].url === 'string') {
        downloadUrl = item.download[0].url;
      }
    } else if (typeof item.download === 'string') {
      downloadUrl = item.download;
    }
  }

  if (!downloadUrl) {
    downloadUrl = (item.direct_url || item.downloadUrl || item.videoUrl || '') as string;
  }
  const imageUrl = (item.thumbnail || item.thumbnailUrl || item.imageUrl || '') as string;
  
  let authorHandle = (item.uploader || item.author || '') as string;
  if (authorHandle && !authorHandle.startsWith('@')) {
    authorHandle = `@${authorHandle}`;
  }

  if (!downloadUrl) {
    throw new Error('No download link was found in the scraped social media metadata.');
  }

  return {
    caption,
    audioUrl: downloadUrl,
    videoUrl: downloadUrl,
    imageUrl,
    instagramHandle: authorHandle || undefined,
  };
}


