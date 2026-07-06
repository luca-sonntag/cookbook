import type { ApifySocialProvider } from '../types.js';
import { socialVideoDownloader } from './socialVideoDownloader.js';

/**
 * Ordered registry of Apify social download providers.
 *
 * The orchestrator (`scrapeSocialMediaVideo`) tries these top-to-bottom and
 * falls back to the next one whenever a provider errors or yields no download
 * link. Add a new fallback by implementing an {@link ApifySocialProvider} under
 * `providers/` and appending it here — order defines priority.
 */
export const apifySocialProviders: ApifySocialProvider[] = [
  socialVideoDownloader,
];
