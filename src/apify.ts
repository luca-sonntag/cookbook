import { ApifyClient } from 'apify-client';
import { config } from './config.js';

// Initialize the Apify Client
const client = new ApifyClient({
  token: config.APIFY_TOKEN,
});

export interface ScrapingResult {
  caption: string;
  audioUrl: string;
  videoUrl: string;
  imageUrl: string;
}

/**
 * Triggers the Apify Instagram Reel Scraper for the given Reel URL
 * and extracts the caption and direct audio URL from the dataset items.
 */
export async function scrapeReel(reelUrl: string): Promise<ScrapingResult> {
  if (!config.APIFY_TOKEN || config.APIFY_TOKEN === 'your_apify_token_here') {
    throw new Error('Apify API token is not configured in environment variables.');
  }

  // Trigger the apify~instagram-reel-scraper actor
  // According to AGENTS.md, Reel URLs are passed in the `username` array.
  const run = await client.actor('apify/instagram-reel-scraper').call({
    username: [reelUrl],
  });

  // Fetch the resulting dataset items
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    throw new Error('No items found in the scraper dataset output.');
  }

  const item = items[0];

  // Extract caption and audioUrl
  const caption = (item.caption as string) || '';
  const audioUrl = (item.audioUrl as string) || '';
  const videoUrl = (item.videoUrl || item.video_url || (item.videoVersions as any[])?.[0]?.url || audioUrl) as string;
  const imageUrl = (item.displayUrl || item.thumbnail_url || item.thumbnailUrl || item.videoCover || '') as string;

  if (!audioUrl) {
    throw new Error('Audio URL was not found in the scraped reel metadata.');
  }

  return {
    caption,
    audioUrl,
    videoUrl,
    imageUrl,
  };
}
