/**
 * Client mirror of `backend/src/photoImport.ts`. A job created from the user's
 * own photos has no scrapeable source, so it carries a synthetic
 * `photo://{uploadId}` URL. Anything that renders `job.url` as a link must skip
 * these — the scheme is not resolvable and would surface a dead link.
 */
const PHOTO_URL_PREFIX = 'photo://';

/** True when a job URL denotes a photo import rather than a real source link. */
export function isPhotoImportUrl(url?: string | null): boolean {
  return !!url && url.startsWith(PHOTO_URL_PREFIX);
}

/**
 * Resolves the display handle for a recipe creator.
 * - Returns `instagramHandle` if present.
 * - Returns `@fotoimport` (or translated fallback) ONLY for photo imports.
 * - Returns `null` if no handle is available for standard recipes (so header handle is omitted).
 */
export function getCreatorHandle(
  handle?: string | null,
  reelUrl?: string | null,
  photoFallbackText?: string
): string | null {
  if (handle && handle.trim()) {
    return handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`;
  }
  if (isPhotoImportUrl(reelUrl)) {
    return photoFallbackText ? `@${photoFallbackText.toLowerCase().replace(/\s+/g, '')}` : '@fotoimport';
  }
  return null;
}

