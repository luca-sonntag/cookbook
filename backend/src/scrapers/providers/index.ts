import type { ScrapingResult } from '../index.js';
import { apifyActorProvider } from './apifyActor.js';
import { localYtdlpProvider } from './localYtdlp.js';
import { rapidApiProvider } from './rapidApi.js';
import type { SocialScrapeContext, SocialScrapeProvider } from './types.js';

export type { SocialScrapeProvider, SocialScrapeContext, SocialPlatform } from './types.js';
export { detectPlatform } from './types.js';

/**
 * Ordered registry of social scrape providers (priority: top → bottom).
 *
 * The orchestrator (`scrapeWithProviders`) tries each *enabled* provider in turn and
 * falls through to the next whenever one throws. Add a provider by implementing
 * {@link SocialScrapeProvider} under `providers/` and inserting it here — order is
 * priority, and `isEnabled()` gates it on configuration.
 *
 * Order rationale:
 *  1. rapidApi   — direct CDN URLs + caption, no proxy, ~2–7s. Handles the common case.
 *  2. localYtdlp — free/fast, but only when this host's IP isn't blocked by the platform.
 *  3. apifyActor — paid residential-proxy fallback; the only path that survives a
 *                  blocked IP. Disabled unless APIFY_SOCIAL_ACTOR_ID is configured.
 */
export const socialProviders: SocialScrapeProvider[] = [
  rapidApiProvider,
  localYtdlpProvider,
  apifyActorProvider,
];

/**
 * Runs the registered providers in order until one succeeds. Throws only when every
 * enabled provider has failed, aggregating the individual reasons.
 */
export async function scrapeWithProviders(
  url: string,
  ctx: SocialScrapeContext,
): Promise<ScrapingResult> {
  const enabled = socialProviders.filter((p) => p.isEnabled());
  if (enabled.length === 0) {
    throw new Error('No social scrape providers are enabled.');
  }

  const failures: string[] = [];
  for (const provider of enabled) {
    try {
      const result = await provider.scrape(url, ctx);
      console.log(`[social] provider "${provider.name}" succeeded for ${url} (caption ${result.caption.length} chars)`);
      return result;
    } catch (err: any) {
      const message = err?.message ?? String(err);
      console.warn(`[social] provider "${provider.name}" failed for ${url}: ${message}`);
      failures.push(`${provider.name}: ${message}`);
    }
  }

  throw new Error(`All ${enabled.length} social provider(s) failed for ${url}. ${failures.join(' | ')}`);
}
