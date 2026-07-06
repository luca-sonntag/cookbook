import type { ApifySocialProvider, ApifySocialScrapeResult } from '../types.js';

/**
 * Primary provider: wilcode "All Social Media Video Downloader".
 *
 * Supports Instagram, Facebook, TikTok and YouTube. Called with `mergeAV` so
 * Instagram/Facebook clips come back as a single merged file exposed in the
 * `download` field.
 *
 * See `docs/apify.social-downloader.md` for the actor's input/output schema.
 */
export const allSocialMediaVideoDownloader: ApifySocialProvider = {
  name: 'all-social-media-video-downloader',
  actorId: 'wilcode/all-social-media-video-downloader',

  buildInput(videoUrl) {
    return {
      url: videoUrl,
      mergeAV: true,
    };
  },

  parse(items) {
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

    const result: ApifySocialScrapeResult = {
      caption,
      audioUrl: downloadUrl,
      videoUrl: downloadUrl,
      imageUrl,
      authorHandle: authorHandle || undefined,
    };
    return result;
  },
};
