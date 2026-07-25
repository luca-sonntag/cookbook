import fs from 'fs/promises';
import path from 'path';
import { getClient } from './db.js';

/**
 * Photo import: the user's own photos of a physical recipe source (cookbook
 * page, magazine clipping, handwritten recipe card) as an input channel next to
 * social-media links.
 *
 * There is no scrapeable URL for such an import, so the job carries a synthetic
 * `photo://{uploadId}` URL instead. That value doubles as the discriminator in
 * the worker and satisfies the partial unique index on (user_id,
 * url_normalized) for free, because every import gets a fresh uploadId.
 *
 * The photos live in the private `recipe-photos` bucket only between the API
 * request and the worker run: the API route uploads them, the worker downloads
 * them into its run directory and deletes them again in its `finally` block.
 * They are never exposed via a durable URL. `sweepOldPhotoImports` is the
 * backstop for imports whose job never ran.
 */

const BUCKET = 'recipe-photos';

export const PHOTO_URL_PREFIX = 'photo://';

/** Maximum number of photos accepted per import. */
export const MAX_IMPORT_PHOTOS = 5;

/** True when the job URL denotes a photo import rather than a scrapeable link. */
export function isPhotoJobUrl(url: string): boolean {
  return url.startsWith(PHOTO_URL_PREFIX);
}

/** Builds the synthetic job URL for an upload. */
export function photoJobUrl(uploadId: string): string {
  return `${PHOTO_URL_PREFIX}${uploadId}`;
}

/** Extracts the upload id from a photo job URL, or null if it is not one. */
export function photoUploadIdFromUrl(url: string): string | null {
  if (!isPhotoJobUrl(url)) return null;
  const uploadId = url.slice(PHOTO_URL_PREFIX.length).trim();
  return uploadId || null;
}

function folderFor(userId: string, uploadId: string): string {
  return `${userId}/${uploadId}`;
}

/** Uploads a single import photo to `recipe-photos/{userId}/{uploadId}/{index}.jpg`. */
export async function uploadImportPhoto(
  userId: string,
  uploadId: string,
  index: number,
  buffer: Buffer,
): Promise<void> {
  const storagePath = `${folderFor(userId, uploadId)}/${index}.jpg`;

  const { error } = await getClient().storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

  if (error) throw new Error(`Failed to upload import photo: ${error.message}`);
}

/**
 * Downloads every photo of an import into `runDir` as `photo_{i}.jpg`, ordered
 * by the index encoded in the file name (that order is the page order the user
 * picked and is meaningful to the extraction prompt).
 */
export async function downloadImportPhotos(
  userId: string,
  uploadId: string,
  runDir: string,
): Promise<{ paths: string[]; bytes: number }> {
  const folder = folderFor(userId, uploadId);
  const { data: files, error } = await getClient().storage.from(BUCKET).list(folder);
  if (error || !files || files.length === 0) return { paths: [], bytes: 0 };

  const ordered = files
    .map(file => ({ file, index: parseInt(file.name.replace(/\.jpg$/i, ''), 10) }))
    .filter(entry => !Number.isNaN(entry.index))
    .sort((a, b) => a.index - b.index);

  const paths: string[] = [];
  let bytes = 0;

  for (const { file, index } of ordered) {
    const { data: blob, error: dlError } = await getClient().storage
      .from(BUCKET)
      .download(`${folder}/${file.name}`);
    // A missing slide would silently truncate the recipe, so fail loudly here
    // instead of extracting from half the pages.
    if (dlError || !blob) throw new Error(`Failed to download import photo ${index}: ${dlError?.message ?? 'no data'}`);

    const buffer = Buffer.from(await blob.arrayBuffer());
    const localPath = path.join(runDir, `photo_${index}.jpg`);
    await fs.writeFile(localPath, buffer);
    paths.push(localPath);
    bytes += buffer.byteLength;
  }

  return { paths, bytes };
}

/** Removes all stored photos of an import. */
export async function deleteImportPhotos(userId: string, uploadId: string): Promise<void> {
  const folder = folderFor(userId, uploadId);
  const { data, error } = await getClient().storage.from(BUCKET).list(folder);
  if (error || !data || data.length === 0) return;
  const paths = data.map(f => `${folder}/${f.name}`);
  await getClient().storage.from(BUCKET).remove(paths);
}

/**
 * Backstop cleanup for imports whose job never ran (or crashed before its
 * `finally`). Unlike `recipe-frames`, this bucket is two levels deep
 * ({userId}/{uploadId}/), so the sweep descends one extra level.
 */
export async function sweepOldPhotoImports(maxAgeHours = 24): Promise<number> {
  const cutoff = Date.now() - maxAgeHours * 3600 * 1000;
  const { data: userFolders, error } = await getClient().storage.from(BUCKET).list('', { limit: 1000 });
  if (error || !userFolders || userFolders.length === 0) return 0;

  let removed = 0;
  for (const userFolder of userFolders) {
    if (!userFolder.name) continue;
    const { data: uploadFolders, error: uploadsError } = await getClient().storage
      .from(BUCKET)
      .list(userFolder.name, { limit: 1000 });
    if (uploadsError || !uploadFolders || uploadFolders.length === 0) continue;

    for (const uploadFolder of uploadFolders) {
      if (!uploadFolder.name) continue;
      const folder = `${userFolder.name}/${uploadFolder.name}`;
      const { data: files, error: filesError } = await getClient().storage.from(BUCKET).list(folder);
      if (filesError || !files || files.length === 0) continue;

      const allExpired = files.every(f => {
        const ts = f.created_at ? new Date(f.created_at).getTime() : 0;
        return ts > 0 && ts < cutoff;
      });
      if (!allExpired) continue;

      const paths = files.map(f => `${folder}/${f.name}`);
      const { error: removeError } = await getClient().storage.from(BUCKET).remove(paths);
      if (!removeError) removed += paths.length;
    }
  }
  return removed;
}
