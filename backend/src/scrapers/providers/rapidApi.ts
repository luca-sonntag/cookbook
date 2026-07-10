import { config } from '../../config.js';
import type { ScrapingResult } from '../index.js';
import { fetchMetadata } from '../youtubeDescription.js';
import type { SocialScrapeContext, SocialScrapeProvider } from './types.js';

/**
 * Primary provider: the "Social Download All In One" RapidAPI.
 *
 * A single POST to `/v1/social/autolink` resolves an Instagram / TikTok / YouTube /
 * Facebook URL into **direct, cross-network-fetchable** media URLs plus caption /
 * author / thumbnail in ~2–7s, with no proxy and no download on our side. We hand the
 * direct URLs to `downloadFile` (queue.ts) and pull the bytes over our own bandwidth.
 *
 * Empirically (2026-07-07) the URLs 200/206 cross-network on all four platforms —
 * including a progressive Instagram MP4 and a non-IP-bound TikTok CDN URL, the two
 * cases plain yt-dlp could not hand back directly.
 *
 * Caption gaps it has (only the YouTube *title*; a stub for Facebook) and its generic
 * author values are enriched here via {@link fetchMetadata} (local yt-dlp metadata).
 */

interface RapidMedia {
  url?: string;
  type?: string; // "video" | "audio" | "image"
  quality?: string; // e.g. "720p", "hd_no_watermark", "HD", "mp4 (720p)", "1080x1920p"
  extension?: string; // e.g. "mp4", "m4a", "mp3"
}

interface RapidResponse {
  url?: string;
  source?: string;
  author?: string;
  title?: string;
  thumbnail?: string;
  duration?: number;
  medias?: RapidMedia[];
  error?: boolean | string;
  owner?: {
    username?: string;
  } | null;
}

/** Max video resolution we bother downloading (keeps file size + Gemini cost down). */
const MAX_HEIGHT = 720;

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

/** RapidAPI often returns a generic/placeholder author (e.g. "youtube", "User"); prefer yt-dlp's when so. */
function isGenericAuthor(handle?: string): boolean {
  if (!handle) return true;
  const s = handle.replace(/^@/, '').toLowerCase();
  return ['', 'youtube', 'facebook', 'instagram', 'tiktok', 'user', 'admin'].includes(s);
}

/** Best-effort parse of a pixel height from a quality/extension/url string. */
function parseHeight(m: RapidMedia): number | null {
  const s = `${m.quality ?? ''} ${m.extension ?? ''} ${m.url ?? ''}`;
  const wxh = s.match(/(\d{3,4})x(\d{3,4})/); // "1080x1920" -> take height
  if (wxh) return parseInt(wxh[2], 10);
  const p = s.match(/(\d{3,4})\s*p/i); // "720p", "(1080p)"
  if (p) return parseInt(p[1], 10);
  if (/\bhd\b/i.test(s)) return 720;
  if (/\bsd\b/i.test(s)) return 480;
  return null;
}

function parseKbps(m: RapidMedia): number {
  const match = `${m.quality ?? ''}`.match(/(\d+)\s*k/i);
  return match ? parseInt(match[1], 10) : 0;
}

function isType(m: RapidMedia, type: string): boolean {
  return (m.type ?? '').toLowerCase().includes(type) || (type === 'video' && /\.mp4|mp4/i.test(m.extension ?? ''));
}

/** Pick the best video ≤ MAX_HEIGHT (else the smallest available), preferring mp4. */
function pickVideo(medias: RapidMedia[]): RapidMedia | null {
  const videos = medias.filter((m) => m.url && isType(m, 'video'));
  if (!videos.length) return null;
  const mp4s = videos.filter((m) => /mp4/i.test(m.extension ?? '') || /mp4/i.test(m.url ?? ''));
  const pool = mp4s.length ? mp4s : videos;

  const annotated = pool.map((m) => ({ m, h: parseHeight(m) }));
  const underCap = annotated.filter((a) => a.h != null && a.h <= MAX_HEIGHT);
  if (underCap.length) return underCap.sort((a, b) => b.h! - a.h!)[0].m; // highest ≤ cap
  const known = annotated.filter((a) => a.h != null);
  if (known.length) return known.sort((a, b) => a.h! - b.h!)[0].m; // smallest known (e.g. IG 1080x1920)
  return pool[0]; // no parseable heights — trust API order
}

/** Pick the highest-bitrate audio-only track, if any. */
function pickAudio(medias: RapidMedia[]): RapidMedia | null {
  const audios = medias.filter((m) => m.url && isType(m, 'audio'));
  if (!audios.length) return null;
  return audios.sort((a, b) => parseKbps(b) - parseKbps(a))[0];
}

export const rapidApiProvider: SocialScrapeProvider = {
  name: 'rapidapi-all-in-one',

  isEnabled() {
    return !!config.RAPIDAPI_KEY;
  },

  async scrape(url: string, ctx: SocialScrapeContext): Promise<ScrapingResult> {
    const key = config.RAPIDAPI_KEY!;
    const host = config.RAPIDAPI_SOCIAL_HOST;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let data: RapidResponse;
    try {
      const res = await fetch(`https://${host}/v1/social/autolink`, {
        method: 'POST',
        headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': host, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`RapidAPI HTTP ${res.status}`);
      data = (await res.json()) as RapidResponse;
    } finally {
      clearTimeout(timeout);
    }

    if (data.error) throw new Error(`RapidAPI error: ${typeof data.error === 'string' ? data.error : 'unknown'}`);

    const medias = Array.isArray(data.medias) ? data.medias : [];
    const video = pickVideo(medias);
    if (!video?.url) throw new Error('RapidAPI returned no usable video media.');
    const audio = pickAudio(medias);

    let caption = (data.title ?? '').toString();
    let authorHandle = (data.owner?.username ?? data.author ?? '').toString();
    if (authorHandle && !authorHandle.startsWith('@')) authorHandle = `@${authorHandle}`;

    // RapidAPI's caption is the full post text for IG/TikTok, but only the *title* for
    // YouTube and a stub ("- Facebook Reel") for Facebook; its author is often generic.
    // Enrich from local yt-dlp metadata (~2s, no proxy) when weak — best-effort.
    if (ctx.platform === 'youtube' || caption.length < 40 || isGenericAuthor(authorHandle)) {
      const meta = await fetchMetadata(url);
      if (meta.description && meta.description.length > caption.length) caption = meta.description;
      if (meta.authorHandle && isGenericAuthor(authorHandle)) authorHandle = meta.authorHandle;
    }

    return {
      caption,
      imageUrl: (data.thumbnail ?? '').toString(),
      authorHandle: authorHandle || undefined,
      media: {
        kind: 'direct',
        videoUrl: video.url,
        audioUrl: audio?.url ?? video.url, // separate audio track when present; else the (progressive) video
        // CDN links served fine cross-network with just a UA in testing.
        headers: { 'User-Agent': BROWSER_UA },
      },
    };
  },
};
