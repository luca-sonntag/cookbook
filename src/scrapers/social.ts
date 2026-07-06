import yt from 'youtube-dl-exec';
import { scrapeSocialMediaVideo } from '../apify/index.js';
import type { ScrapingResult } from './index.js';
import { getYtdlpCookieOptions } from '../config.js';

const youtubedl: any = (yt as any).default || yt;

/**
 * Consolidates social media scraping for supported video platforms
 * (Instagram, Facebook, YouTube, TikTok).
 */
export async function scrapeSocial(url: string): Promise<ScrapingResult> {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();
  const isInstagram = hostname.includes('instagram.com');
  const isFacebook = hostname.includes('facebook.com');
  const isTikTok = hostname.includes('tiktok.com');
  const isYouTube = hostname.includes('youtube.com') || hostname.includes('youtu.be');

  if (!isInstagram && !isFacebook && !isTikTok && !isYouTube) {
    throw new Error(`scrapeSocial called with unsupported URL: ${url}`);
  }

  // Try the Apify social provider chain first (see src/apify/)
  try {
    const res = await scrapeSocialMediaVideo(url);
    return {
      caption: res.caption,
      audioUrl: res.audioUrl,
      videoUrl: res.videoUrl,
      imageUrl: res.imageUrl,
      authorHandle: res.authorHandle,
      requiresYtDlpDownload: false,
      originalUrl: url,
    };
  } catch (apifyError: any) {
    console.warn(`Apify social scraping failed for ${url}, falling back to local yt-dlp:`, apifyError.message);
  }

  // Fallback to local yt-dlp
  try {
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      noPlaylist: true,
      format: 'bestaudio/best',
      ...getYtdlpCookieOptions()
    });

    const metadata = output as any;

    return {
      caption: metadata.description || metadata.title || '',
      audioUrl: metadata.url,
      videoUrl: metadata.url,
      imageUrl: metadata.thumbnail || '',
      authorHandle: metadata.uploader_id || metadata.uploader || metadata.channel || '',
      headers: {
        ...metadata.http_headers,
        ...(metadata.cookies ? { Cookie: metadata.cookies } : {})
      },
      requiresYtDlpDownload: true,
      originalUrl: url,
    };
  } catch (error: any) {
    throw new Error(`Failed to extract social media video data using local yt-dlp: ${error.message}`);
  }
}
