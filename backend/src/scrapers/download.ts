import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import yt from 'youtube-dl-exec';
import { getYtdlpCookieOptions } from '../config.js';
import type { MediaDownload } from './index.js';

const youtubedl: any = (yt as any).default || yt;

/** Downloads a URL to a local file, following HTTP/HTTPS redirects. Resolves the content-type. */
function downloadFile(url: string, destPath: string, headers?: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    function attemptGet(currentUrl: string) {
      const protocol = currentUrl.startsWith('https') ? https : http;
      const request = protocol.get(currentUrl, { headers }, (response) => {
        if (
          response.statusCode === 301 ||
          response.statusCode === 302 ||
          response.statusCode === 307 ||
          response.statusCode === 308
        ) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            attemptGet(redirectUrl);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download from ${currentUrl}: HTTP ${response.statusCode} ${response.statusMessage}`));
          return;
        }

        const mimeType = response.headers['content-type'] || 'audio/mp4';
        const fileStream = createWriteStream(destPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => fileStream.close(() => resolve(mimeType)));
        fileStream.on('error', (err) => {
          fs.unlink(destPath).catch(() => {});
          reject(err);
        });
      });

      request.on('error', (err) => reject(err));
    }

    attemptGet(url);
  });
}

export interface DownloadedMedia {
  /** Local path to the audio file, or '' when absent/failed. */
  audioFilePath: string;
  /** Local path to the video file (for frame extraction), or '' when absent/failed. */
  videoFilePath: string;
  /** Best-effort mime type for the audio file (from its extension). */
  mimeType?: string;
}

/**
 * Fetches a scrape result's media to local files under `runDir`, per its download
 * strategy. Individual downloads fail soft (the corresponding path comes back '') so a
 * missing video still lets audio + caption drive extraction.
 */
export async function downloadMedia(media: MediaDownload, runDir: string): Promise<DownloadedMedia> {
  if (media.kind === 'none') return { audioFilePath: '', videoFilePath: '' };

  const audioExt = media.kind === 'ytdlp' ? '.mp3' : media.audioUrl?.includes('.mp3') ? '.mp3' : '.mp4';
  let audioFilePath = path.join(runDir, `audio${audioExt}`);
  let videoFilePath = path.join(runDir, 'video.mp4');
  const downloads: Promise<unknown>[] = [];

  if (media.kind === 'ytdlp') {
    const cookieOpts = getYtdlpCookieOptions();
    downloads.push(
      youtubedl(media.sourceUrl, {
        output: audioFilePath,
        format: 'bestaudio/best',
        extractAudio: true,
        audioFormat: 'mp3',
        noWarnings: true,
        noPlaylist: true,
        ...cookieOpts,
      }).catch((err: any) => {
        console.warn(`[download] yt-dlp audio download failed: ${err.message}`);
        audioFilePath = '';
      }),
    );
    downloads.push(
      youtubedl(media.sourceUrl, {
        output: videoFilePath,
        format: 'bestvideo/best',
        noWarnings: true,
        noPlaylist: true,
        ...cookieOpts,
      }).catch((err: any) => {
        console.warn(`[download] yt-dlp video download failed (will skip frame extraction): ${err.message}`);
        videoFilePath = '';
      }),
    );
  } else {
    // direct
    if (media.audioUrl) {
      downloads.push(
        downloadFile(media.audioUrl, audioFilePath, media.headers).catch((err) => {
          console.warn(`[download] audio download failed: ${err.message}`);
          audioFilePath = '';
        }),
      );
    } else {
      audioFilePath = '';
    }
    if (media.videoUrl) {
      downloads.push(
        downloadFile(media.videoUrl, videoFilePath, media.headers).catch((err) => {
          console.warn(`[download] video download failed (will skip frame extraction): ${err.message}`);
          videoFilePath = '';
        }),
      );
    } else {
      videoFilePath = '';
    }
  }

  await Promise.allSettled(downloads);
  return { audioFilePath, videoFilePath, mimeType: audioExt === '.mp3' ? 'audio/mp3' : 'audio/mp4' };
}
