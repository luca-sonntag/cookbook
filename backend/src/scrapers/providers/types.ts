import type { ScrapingResult } from '../index.js';

export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'facebook';

/** Detects the platform from a social URL, or null when unsupported. */
export function detectPlatform(url: string): SocialPlatform | null {
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host.includes('instagram.com')) return 'instagram';
  if (host.includes('tiktok.com')) return 'tiktok';
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('facebook.com') || host.includes('fb.watch')) return 'facebook';
  return null;
}

/** Extracts a technical username/handle from a social URL if embedded in the path (e.g. /username/reel/...). */
export function extractUsernameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();
    const parts = urlObj.pathname.split('/').filter(Boolean);

    if (host.includes('instagram.com')) {
      // Formats: /username/reel/shortcode/ or /username/p/shortcode/
      if (parts.length >= 3 && (parts[1] === 'reel' || parts[1] === 'p')) {
        return parts[0];
      }
    } else if (host.includes('tiktok.com')) {
      // Format: /@username/video/id
      if (parts[0] && parts[0].startsWith('@')) {
        return parts[0].substring(1);
      }
    } else if (host.includes('youtube.com') || host.includes('youtu.be')) {
      // Format: /@username/shorts/id or /@username
      if (parts[0] && parts[0].startsWith('@')) {
        return parts[0].substring(1);
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/** Context passed to every provider for a single scrape attempt. */
export interface SocialScrapeContext {
  /** Job id for progress reporting (optional). */
  jobId?: string;
  /** Platform detected from the URL. */
  platform: SocialPlatform;
}

/**
 * A social-media scrape provider.
 *
 * Providers are registered in priority order in `providers/index.ts`; the
 * orchestrator (`scrapeWithProviders`) tries each enabled one top-to-bottom and
 * falls through to the next whenever one throws. To add a provider: implement this
 * interface in a new file under `providers/` and append it to the registry array —
 * no orchestrator changes required.
 */
export interface SocialScrapeProvider {
  /** Short id used in logs (e.g. "rapidapi-all-in-one"). */
  readonly name: string;
  /** True when the provider is configured/usable (e.g. its API key is set). Disabled providers are skipped. */
  isEnabled(): boolean;
  /** Resolve the URL into a normalized {@link ScrapingResult}. Throw to fall through to the next provider. */
  scrape(url: string, ctx: SocialScrapeContext): Promise<ScrapingResult>;
}
