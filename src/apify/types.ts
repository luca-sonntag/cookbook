/**
 * Normalized result returned by every Apify social download provider.
 *
 * Each provider maps its actor-specific output shape onto this interface so the
 * rest of the scraping pipeline (see `src/scrapers/social.ts`) stays completely
 * provider-agnostic.
 */
export interface ApifySocialScrapeResult {
  caption: string;
  /** Direct, playable media URL (used for both the audio + video download). */
  videoUrl: string;
  audioUrl: string;
  imageUrl: string;
  /** Author/uploader handle, normalized to start with "@" when present. */
  authorHandle?: string;
}

/**
 * A single Apify actor capable of resolving a social-media video URL into a
 * direct download link.
 *
 * Providers are tried in registration order (see `providers/index.ts`): the
 * first one that succeeds wins, and any failure — a thrown error or a missing
 * download link — falls through to the next provider.
 *
 * To add a new fallback:
 *   1. Create a file under `providers/` exporting an `ApifySocialProvider`.
 *   2. Append it to the array in `providers/index.ts`.
 * No changes to the orchestrator are required.
 */
export interface ApifySocialProvider {
  /** Short, human-readable id used in logs (e.g. "all-social-media-video-downloader"). */
  readonly name: string;
  /** Apify actor id in `owner/actor-name` form. */
  readonly actorId: string;
  /** Builds the actor input payload for the given video URL. */
  buildInput(videoUrl: string): Record<string, unknown>;
  /**
   * Maps the actor's dataset items onto a normalized result.
   * Must throw when no usable download URL can be extracted.
   */
  parse(items: unknown[], videoUrl: string): ApifySocialScrapeResult;
}
