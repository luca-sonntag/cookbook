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


