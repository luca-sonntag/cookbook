import yt from 'youtube-dl-exec';
import { getYtdlpCookieOptions } from '../../config.js';
import type { ScrapingResult } from '../index.js';
import type { SocialScrapeProvider } from './types.js';

const youtubedl: any = (yt as any).default || yt;

/**
 * Fallback provider: local yt-dlp, direct from this host.
 *
 * Resolves metadata only, then hands the download back via `media.kind === 'ytdlp'`
 * (download.ts re-invokes yt-dlp to fetch the bytes from `sourceUrl`, since the probed
 * format URL isn't a reliably-downloadable pair). Free and fast — but only works when
 * this host's IP isn't blocked by the platform, which is why it sits below the
 * proxy-backed providers for IG/TikTok.
 */
export const localYtdlpProvider: SocialScrapeProvider = {
  name: 'local-ytdlp',

  isEnabled() {
    return true; // yt-dlp is bundled; always available as a last resort
  },

  async scrape(url: string): Promise<ScrapingResult> {
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      noPlaylist: true,
      format: 'bestaudio/best',
      ...getYtdlpCookieOptions(),
    });

    const metadata = output as any;

    return {
      caption: metadata.description || metadata.title || '',
      imageUrl: metadata.thumbnail || '',
      authorHandle: metadata.uploader_id || metadata.uploader || metadata.channel || '',
      durationSeconds: typeof metadata.duration === 'number' ? metadata.duration : undefined,
      media: { kind: 'ytdlp', sourceUrl: url },
    };
  },
};
