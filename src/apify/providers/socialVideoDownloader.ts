import type { ApifySocialProvider, ApifySocialScrapeResult } from '../types.js';

/** Placeholder until the actor is pushed; override with APIFY_SOCIAL_ACTOR_ID. */
const DEFAULT_ACTOR_ID = 'YOUR_APIFY_USERNAME/social-video-downloader';

/**
 * Primary provider: our own first-party Apify actor, maintained in a separate
 * sibling repo (`../apify-actor`, next to this one).
 *
 * Wraps yt-dlp behind Apify residential proxies and returns caption + thumbnail +
 * author plus a merged MP4 stored in the Apify key-value store — a public,
 * directly-fetchable `videoUrl`. This restores the caption + cover image that the
 * third-party rover-omniscraper actor did not provide.
 *
 * Set `APIFY_SOCIAL_ACTOR_ID` to your pushed actor id
 * (`<username>/social-video-downloader`) after `apify push`. Until then the call
 * fails and the chain falls through to the local yt-dlp fallback in social.ts.
 *
 * See `docs/apify.social-downloader.md` for the actor's input/output schema.
 */
export const socialVideoDownloader: ApifySocialProvider = {
  name: 'social-video-downloader',
  actorId: process.env.APIFY_SOCIAL_ACTOR_ID || DEFAULT_ACTOR_ID,

  buildInput(videoUrl) {
    return {
      url: videoUrl,
      quality: '720',
      proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
    };
  },

  parse(items) {
    // We submit a single `url`, so the actor returns one record. Prefer the first
    // successful item; fall back to the first item for error detail.
    const successful = (items as any[]).find(
      (i) => i && i.status !== 'error' && typeof i.videoUrl === 'string' && i.videoUrl,
    );
    const item = (successful ?? items[0]) as any;

    if (!item) {
      throw new Error('social-video-downloader returned no dataset items.');
    }

    const videoUrl = (item.videoUrl || '') as string;
    if (!videoUrl) {
      const reason = item.error ? `: ${item.error}` : '';
      throw new Error(`social-video-downloader produced no video URL${reason}.`);
    }

    let authorHandle = (item.authorHandle || '') as string;
    if (authorHandle && !authorHandle.startsWith('@')) authorHandle = `@${authorHandle}`;

    const result: ApifySocialScrapeResult = {
      caption: (item.caption || '') as string,
      videoUrl,
      audioUrl: (item.audioUrl || videoUrl) as string,
      imageUrl: (item.imageUrl || '') as string,
      authorHandle: authorHandle || undefined,
    };
    return result;
  },
};
