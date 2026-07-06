import { ApifyClient } from 'apify-client';
import { config } from '../config.js';

/** Shared Apify client instance used by all social download providers. */
export const apifyClient = new ApifyClient({
  token: config.APIFY_TOKEN,
});

/** Placeholder values shipped in `.env.example`; treated as "not configured". */
const PLACEHOLDER_TOKENS = new Set(['your_apify_token_here', 'your_apify_api_token']);

/** Throws when the Apify token is missing or still set to a placeholder. */
export function assertApifyTokenConfigured(): void {
  if (!config.APIFY_TOKEN || PLACEHOLDER_TOKENS.has(config.APIFY_TOKEN)) {
    throw new Error('Apify API token is not configured in environment variables.');
  }
}
