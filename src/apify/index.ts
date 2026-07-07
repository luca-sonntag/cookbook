import { withRetry } from '../retry.js';
import { apifyClient, assertApifyTokenConfigured } from './client.js';
import { apifySocialProviders } from './providers/index.js';
import type { ApifySocialProvider, ApifySocialScrapeResult } from './types.js';
import { updateJob } from '../db.js';

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
async function runProvider(provider: ApifySocialProvider, videoUrl: string, jobId?: string): Promise<unknown[]> {
  const run = await apifyClient.actor(provider.actorId).start(provider.buildInput(videoUrl));
  const runId = run.id;

  console.log(`[apify] Started actor run ${runId} for provider "${provider.name}"`);

  let runInfo: any = run;
  let lastPercent = 0;
  let isTerminal = false;
  const terminalStatuses = new Set(['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED']);

  // Poll the run status and logs until it finishes
  while (!isTerminal) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Fetch run status
    runInfo = await apifyClient.run(runId).get();
    if (!runInfo) {
      throw new Error(`Failed to retrieve status for Actor run ${runId}`);
    }

    isTerminal = terminalStatuses.has(runInfo.status);

    // Fetch logs to extract progress
    if (jobId) {
      try {
        const logText = await apifyClient.run(runId).log().get();
        if (logText) {
          const matches = [...logText.matchAll(/\[download\]\s+(\d+(?:\.\d+)?)\%/g)];
          if (matches.length > 0) {
            const ytDlpPercent = parseFloat(matches[matches.length - 1][1]);
            if (ytDlpPercent > lastPercent) {
              lastPercent = ytDlpPercent;
              // Scale to 15% - 50%
              const scaledPercent = Math.round(15 + (ytDlpPercent / 100) * 35);
              console.log(`[Job ${jobId}] Parsed actor download progress: ${ytDlpPercent}% (scaled: ${scaledPercent}%)`);
              await updateJob(jobId, {
                status: 'scraping',
                recipe: { isProgress: true, percent: scaledPercent, stage: 'scraping' } as any,
              });
            }
          }
        }
      } catch (err: any) {
        console.warn(`[apify] Error polling logs for run ${runId}: ${err.message}`);
      }
    }
  }

  // Check if the run succeeded
  if (runInfo.status !== 'SUCCEEDED') {
    throw new Error(`Actor run ${runId} finished with status: ${runInfo.status}`);
  }

  // Retrieve dataset items
  const { items } = await apifyClient.dataset(runInfo.defaultDatasetId).listItems();
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
export async function scrapeSocialMediaVideo(videoUrl: string, jobId?: string): Promise<ApifySocialScrapeResult> {
  assertApifyTokenConfigured();

  const providers = apifySocialProviders;
  if (providers.length === 0) {
    throw new Error('No Apify social providers are registered.');
  }

  const failures: string[] = [];

  for (const provider of providers) {
    try {
      const items = await withRetry(
        () => runProvider(provider, videoUrl, jobId),
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
