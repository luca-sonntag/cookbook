import { scrapeInstagramReel } from './instagram.js';
import { scrapeVideoData } from './video.js';
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
  scrape(url: string): Promise<ScrapingResult>;
}

export function getScraperForUrl(url: string): Scraper {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();

  if (hostname.includes('instagram.com')) {
    return { scrape: scrapeInstagramReel };
  } else if (hostname.includes('tiktok.com') || hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return { scrape: scrapeVideoData };
  } else {
    return { scrape: scrapeWebsite };
  }
}
