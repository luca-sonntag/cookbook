import { useState, useEffect } from 'react';
import { getCachedImage, setCachedImage, getMemoryCachedImage } from '../utils/imageStore';
import { compressImage, PREVIEW_PROFILE } from '../utils/imageCompression';
import { apiUrl } from '../api';

/**
 * Helper to fetch an image via the backend proxy, draw it onto a canvas,
 * resize it to max 800px (preserving aspect ratio), and compress it to a JPEG Base64 string.
 */
async function compressAndConvertToBase64(url: string): Promise<string> {
  // Use the existing backend image proxy to bypass CORS/CORP blocks
  const proxyUrl = apiUrl(url.startsWith('/') ? url : `/api/image?url=${encodeURIComponent(url)}`);
  
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image via proxy: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`URL did not return an image (got ${contentType})`);
  }

  const blob = await response.blob();

  return compressImage(blob, PREVIEW_PROFILE);
}

/**
 * Custom hook to manage client-side image caching.
 *
 * Cache hierarchy (managed by imageStore.ts):
 *   L1 — module-level Map in imageStore (synchronous, zero-latency, session-scoped)
 *   L2 — IndexedDB (persisted across page reloads, async)
 *   L3 — network fetch via /api/image proxy (compress → save to L1 + L2)
 *
 * useState is initialised synchronously from the L1 cache so that images
 * which have already been loaded this session never show a loading flash,
 * even when the component is re-mounted or the tab is switched.
 */
export function useCachedImage(originalUrl: string | null | undefined) {
  // Synchronous lazy initializer: if the image is already in the L1 memory
  // cache (imageStore module-level Map), set src immediately — no async, no flash.
  const [src, setSrc] = useState<string | null>(() => {
    if (!originalUrl) return null;
    return getMemoryCachedImage(originalUrl);
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (!originalUrl) return false;
    // Already in memory → no loading needed.
    return getMemoryCachedImage(originalUrl) === null;
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!originalUrl) {
      setSrc(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // L1 synchronous hit: already in memory cache — nothing async needed.
    const memorySrc = getMemoryCachedImage(originalUrl);
    if (memorySrc !== null) {
      setSrc(memorySrc);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function loadAndCache() {
      try {
        // getCachedImage checks L1 first, then L2 (IndexedDB), and promotes L2→L1.
        const cached = await getCachedImage(originalUrl!);
        if (cached) {
          if (isMounted) {
            setSrc(cached);
            setIsLoading(false);
          }
          return;
        }

        // Local-only references (`local:{jobId}:{i}`) are recipe video frames that
        // live solely in this device's cache — we never rehost them. If they aren't
        // cached (e.g. extracted on another device, or already purged), there is
        // nothing to fetch; show no image rather than hitting the network.
        if (originalUrl!.startsWith('local:')) {
          if (isMounted) {
            setSrc(null);
            setIsLoading(false);
          }
          return;
        }

        // L3: Fetch, compress, and convert to Base64
        const base64 = await compressAndConvertToBase64(originalUrl!);

        // setCachedImage writes to both L1 (memory) and L2 (IndexedDB).
        await setCachedImage(originalUrl!, base64);

        if (isMounted) {
          setSrc(base64);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error in useCachedImage:', err);
        if (isMounted) {
          setSrc(null);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }

    loadAndCache();

    return () => {
      isMounted = false;
    };
  }, [originalUrl]);

  return { src, isLoading, error };
}
