import { scrapeSocial } from './social.js';
import { scrapeWebsite } from './website.js';

export interface ScrapingResult {
  caption: string;
  audioUrl?: string; // Optional because websites might not have audio
  videoUrl?: string; // Optional because websites might not have video
  imageUrl?: string;
  authorHandle?: string;
  htmlContent?: string; // For text-based websites
  headers?: Record<string, string>; // Necessary HTTP headers for downloading media (like User-Agent)
  requiresYtDlpDownload?: boolean; // Signal to queue.ts to use yt-dlp for downloading
  originalUrl?: string; // The original URL for yt-dlp to download from
}

export interface Scraper {
  scrape(url: string, jobId?: string): Promise<ScrapingResult>;
}

export function getScraperForUrl(url: string): Scraper {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();

  const isSocial = hostname.includes('instagram.com') ||
                   hostname.includes('facebook.com') ||
                   hostname.includes('tiktok.com') ||
                   hostname.includes('youtube.com') ||
                   hostname.includes('youtu.be');

  if (isSocial) {
    return { scrape: scrapeSocial };
  } else {
    return { scrape: scrapeWebsite };
  }
}
