import yt from 'youtube-dl-exec';
import type { ScrapingResult } from './index.js';
import { getYtdlpCookieOptions } from '../config.js';

const youtubedl: any = (yt as any).default || yt;

export async function scrapeVideoData(url: string): Promise<ScrapingResult> {
  try {
    // Extract video metadata and the best direct audio/video URL
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      noPlaylist: true,
      // Prefer best audio format that's small
      format: 'bestaudio/best',
      ...getYtdlpCookieOptions()
    });

    const metadata = output as any;

    return {
      caption: metadata.description || metadata.title || '',
      audioUrl: metadata.url,
      videoUrl: metadata.url, // yt-dlp 'url' often contains the combined stream or audio stream
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
    throw new Error(`Failed to extract video data using yt-dlp: ${error.message}`);
  }
}
