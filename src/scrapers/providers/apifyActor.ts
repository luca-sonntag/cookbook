import { ApifyClient } from 'apify-client';
import { config } from '../../config.js';
import { updateJob } from '../../db.js';
import { withRetry } from '../../retry.js';
import type { ScrapingResult } from '../index.js';
import type { SocialScrapeContext, SocialScrapeProvider } from './types.js';

/**
 * Optional final-fallback provider: the first-party Apify actor
 * (`apify-actor` repo, `social-video-downloader`).
 *
 * Runs yt-dlp behind Apify's residential-proxy escalation and re-hosts the muxed MP4
 * in the actor's key-value store (or returns a direct CDN URL for YouTube). Slower and
 * paid, but it's the only path that still works when RapidAPI is down AND this host's
 * IP is blocked (Instagram/TikTok). Auto-disabled unless `APIFY_SOCIAL_ACTOR_ID` and a
 * real `APIFY_TOKEN` are configured.
 *
 * Ported from the former `src/apify/` orchestrator + provider so all social sources
 * live in one registry.
 */

const PLACEHOLDER_TOKENS = new Set(['your_apify_token_here', 'your_apify_api_token']);
const RUN_MAX_ATTEMPTS = 3;
const RUN_BASE_DELAY_MS = 2000;
const TERMINAL = new Set(['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED']);

const apifyClient = new ApifyClient({ token: config.APIFY_TOKEN });

/** Runs the actor once and returns its raw dataset items (empty output is a retryable failure). */
async function runActor(actorId: string, videoUrl: string, jobId?: string): Promise<unknown[]> {
  const run = await apifyClient.actor(actorId).start({ url: videoUrl, quality: '720' });
  const runId = run.id;
  console.log(`[apify] Started actor run ${runId} (${actorId})`);

  let runInfo: any = run;
  let lastPercent = 0;
  let isTerminal = false;

  while (!isTerminal) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    runInfo = await apifyClient.run(runId).get();
    if (!runInfo) throw new Error(`Failed to retrieve status for Actor run ${runId}`);
    isTerminal = TERMINAL.has(runInfo.status);

    if (jobId) {
      try {
        const logText = await apifyClient.run(runId).log().get();
        if (logText) {
          const matches = [...logText.matchAll(/\[download\]\s+(\d+(?:\.\d+)?)\%/g)];
          if (matches.length > 0) {
            const pct = parseFloat(matches[matches.length - 1][1]);
            if (pct > lastPercent) {
              lastPercent = pct;
              const scaled = Math.round(15 + (pct / 100) * 35); // 15–50%
              await updateJob(jobId, {
                status: 'scraping',
                recipe: { isProgress: true, percent: scaled, stage: 'scraping' } as any,
              });
            }
          }
        }
      } catch (err: any) {
        console.warn(`[apify] Error polling logs for run ${runId}: ${err.message}`);
      }
    }
  }

  if (runInfo.status !== 'SUCCEEDED') {
    throw new Error(`Actor run ${runId} finished with status: ${runInfo.status}`);
  }

  const { items } = await apifyClient.dataset(runInfo.defaultDatasetId).listItems();
  if (!items || items.length === 0) throw new Error(`Actor ${actorId} returned no dataset items.`);
  return items;
}

/** Maps the actor's dataset item onto a ScrapingResult (appends the Apify token to KV-store URLs). */
function parseItems(items: unknown[]): ScrapingResult {
  const successful = (items as any[]).find(
    (i) => i && i.status !== 'error' && typeof i.videoUrl === 'string' && i.videoUrl,
  );
  const item = (successful ?? items[0]) as any;
  if (!item) throw new Error('Apify actor returned no dataset items.');

  const rawVideoUrl = (item.videoUrl || '') as string;
  const rawAudioUrl = (item.audioUrl || rawVideoUrl) as string;
  if (!rawVideoUrl) {
    throw new Error(`Apify actor produced no video URL${item.error ? `: ${item.error}` : ''}.`);
  }

  // KV-store records are not public — append ?token=<APIFY_TOKEN>. Direct CDN URLs (source="cdn") pass through.
  const token = config.APIFY_TOKEN;
  const appendToken = (url: string) =>
    url.includes('api.apify.com') ? `${url}${url.includes('?') ? '&' : '?'}token=${token}` : url;

  let authorHandle = (item.authorHandle || '') as string;
  if (authorHandle && !authorHandle.startsWith('@')) authorHandle = `@${authorHandle}`;

  const headers =
    item.httpHeaders && typeof item.httpHeaders === 'object'
      ? (item.httpHeaders as Record<string, string>)
      : undefined;

  return {
    caption: (item.caption || '') as string,
    imageUrl: (item.imageUrl || '') as string,
    authorHandle: authorHandle || undefined,
    media: {
      kind: 'direct',
      videoUrl: appendToken(rawVideoUrl),
      audioUrl: appendToken(rawAudioUrl),
      headers,
    },
  };
}

export const apifyActorProvider: SocialScrapeProvider = {
  name: 'apify-actor',

  isEnabled() {
    const token = config.APIFY_TOKEN;
    const actorId = config.APIFY_SOCIAL_ACTOR_ID;
    return !!token && !PLACEHOLDER_TOKENS.has(token) && !!actorId;
  },

  async scrape(url: string, ctx: SocialScrapeContext): Promise<ScrapingResult> {
    const actorId = config.APIFY_SOCIAL_ACTOR_ID!;
    const items = await withRetry(() => runActor(actorId, url, ctx.jobId), {
      maxAttempts: RUN_MAX_ATTEMPTS,
      baseDelayMs: RUN_BASE_DELAY_MS,
    });
    return parseItems(items);
  },
};
