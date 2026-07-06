import { withRetry } from '../retry.js';
import { apifyClient, assertApifyTokenConfigured } from './client.js';
import { apifySocialProviders } from './providers/index.js';
import type { ApifySocialProvider, ApifySocialScrapeResult } from './types.js';

export type { ApifySocialProvider, ApifySocialScrapeResult } from './types.js';
export { apifySocialProviders } from './providers/index.js';

/** Retry policy applied to each provider's actor run before falling back. */
const PROVIDER_MAX_ATTEMPTS = 3;
const PROVIDER_BASE_DELAY_MS = 2000;

/**
 * Runs a single provider's actor and returns its raw dataset items.
 * Empty output is treated as a (retryable) failure so a flaky run gets another
 * attempt before the orchestrator moves on to the next provider.
 */
async function runProvider(provider: ApifySocialProvider, videoUrl: string): Promise<unknown[]> {
  const run = await apifyClient.actor(provider.actorId).call(provider.buildInput(videoUrl));
  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  if (!items || items.length === 0) {
    throw new Error(`Actor ${provider.actorId} returned no dataset items.`);
  }
  return items;
}

/**
 * Resolves a social-media video URL into a direct download link using the
 * registered Apify providers.
 *
 * Providers are attempted in registration order; each is retried on transient
 * errors, and the next provider is tried whenever one fails outright (error or
 * missing download link). Throws only when every provider has failed, with the
 * individual failure reasons aggregated into the message.
 */
export async function scrapeSocialMediaVideo(videoUrl: string): Promise<ApifySocialScrapeResult> {
  assertApifyTokenConfigured();

  const providers = apifySocialProviders;
  if (providers.length === 0) {
    throw new Error('No Apify social providers are registered.');
  }

  const failures: string[] = [];

  for (const provider of providers) {
    try {
      const items = await withRetry(
        () => runProvider(provider, videoUrl),
        { maxAttempts: PROVIDER_MAX_ATTEMPTS, baseDelayMs: PROVIDER_BASE_DELAY_MS },
      );
      return provider.parse(items, videoUrl);
    } catch (err: any) {
      const message = err?.message ?? String(err);
      console.warn(`[apify] Provider "${provider.name}" failed for ${videoUrl}: ${message}`);
      failures.push(`${provider.name}: ${message}`);
    }
  }

  throw new Error(
    `All ${providers.length} Apify social provider(s) failed for ${videoUrl}. ${failures.join(' | ')}`,
  );
}
