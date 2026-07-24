import type { ScrapingResult } from './index.js';
import { AppError } from '../errors.js';
import { detectPlatform, scrapeWithProviders } from './providers/index.js';

/**
 * Scrapes a social-media video (Instagram, Facebook, TikTok, YouTube) by running the
 * ordered provider registry in `providers/` — RapidAPI (primary) → local yt-dlp →
 * Apify actor (optional). See `providers/index.ts` for ordering and how to add one.
 */
export async function scrapeSocial(url: string, jobId?: string): Promise<ScrapingResult> {
  const platform = detectPlatform(url);
  if (!platform) {
    throw new AppError('INVALID_URL', { message: `scrapeSocial called with unsupported URL: ${url}` });
  }

  return scrapeWithProviders(url, { jobId, platform });
}
