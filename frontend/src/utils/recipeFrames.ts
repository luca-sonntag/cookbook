import { apiUrl } from '../api';
import { setCachedImage } from './imageStore';

/**
 * Pulls a completed job's recipe frames (a one-time, transient hand-off) and
 * stores them in the device's local IndexedDB cache under their `local:` keys.
 * The frames are deleted server-side once delivered, so this must run before the
 * recipe is shown — otherwise the images are gone for good. Best-effort: any
 * failure just means the recipe renders without images.
 *
 * Shared by the foreground extraction hook (`useRecipeExtraction`) and the
 * background multi-job store (`ExtractionJobsContext`).
 */
export async function pullAndCacheFrames(jobId: string, token: string): Promise<void> {
  try {
    const response = await fetch(apiUrl(`/api/jobs/${jobId}/frames`), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return;
    const data = await response.json();
    if (!data.success || !Array.isArray(data.frames)) return;

    await Promise.all(
      data.frames.map((f: { index: number; dataUrl: string }) =>
        setCachedImage(`local:${jobId}:${f.index}`, f.dataUrl)
      )
    );
  } catch (err) {
    console.warn('Failed to pull recipe frames for local caching:', err);
  }
}
