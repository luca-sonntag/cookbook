import { scrapeReel } from '../apify.js';
import type { ScrapingResult } from './index.js';

export async function scrapeInstagramReel(url: string): Promise<ScrapingResult> {
  const hostname = new URL(url).hostname.toLowerCase();
  if (!hostname.includes('instagram.com')) {
    throw new Error(`scrapeInstagramReel called with non-Instagram URL: ${url}`);
  }
  const result = await scrapeReel(url);
  return {
    caption: result.caption,
    audioUrl: result.audioUrl,
    videoUrl: result.videoUrl,
    imageUrl: result.imageUrl,
    authorHandle: result.instagramHandle,
  };
}
