import type { ApifySocialProvider, ApifySocialScrapeResult } from '../types.js';

/**
 * Active provider: rover-omniscraper "Ultra-Fast Social Media Downloader".
 *
 * Covers 21+ platforms (Instagram, TikTok, YouTube, Facebook, Twitter/X, …) via
 * an embedded Cobalt server. Called with `downloadMode: 'auto'` so each clip is
 * returned as a single video+audio file.
 *
 * The output shape differs from a typical scraper: the actor stores the media
 * file in the Apify key-value store and pushes a metadata record to the dataset.
 * The playable link is `downloadUrl` (a direct KV-store file URL). Note this
 * actor exposes NO post caption and NO thumbnail — only `metadata.title`/
 * `artist` — so those recipe fields rely on the local yt-dlp fallback when this
 * provider is used.
 *
 * See `docs/apify.social-downloader.md` for the actor's input/output schema.
 */
export const mediaDownloaderActor: ApifySocialProvider = {
  name: 'media-downloader-actor',
  actorId: 'rover-omniscraper/media-downloader-actor',

  buildInput(videoUrl) {
    return {
      url: videoUrl,
      downloadMode: 'auto', // video + audio merged into one file
    };
  },

  parse(items) {
    // We submit a single `url`, so the actor returns one record per run. Prefer
    // the first successful item; fall back to the first item for error detail.
    const successful = (items as any[]).find(
      (i) => i && i.status !== 'error' && typeof i.downloadUrl === 'string' && i.downloadUrl,
    );
    const item = (successful ?? items[0]) as any;

    if (!item) {
      throw new Error('media-downloader-actor returned no dataset items.');
    }

    const downloadUrl = (item.downloadUrl || '') as string;
    if (!downloadUrl) {
      const reason = item.error ? `: ${item.error}` : '';
      throw new Error(`media-downloader-actor produced no download URL${reason}.`);
    }

    // This actor has no post-caption/thumbnail; expose the best available title.
    const meta = (item.metadata ?? {}) as any;
    const caption = (meta.title || item.filename || '') as string;
    const authorHandle = (meta.artist || '') as string;

    const result: ApifySocialScrapeResult = {
      caption,
      audioUrl: downloadUrl,
      videoUrl: downloadUrl,
      imageUrl: '', // this actor does not expose a thumbnail
      authorHandle: authorHandle || undefined,
    };
    return result;
  },
};
