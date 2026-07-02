import { useState, useEffect } from 'react';
import { getCachedImage, setCachedImage } from '../utils/imageStore';

/**
 * Helper to fetch an image via the backend proxy, draw it onto a canvas,
 * resize it to max 800px (preserving aspect ratio), and compress it to a JPEG Base64 string.
 */
async function compressAndConvertToBase64(url: string): Promise<string> {
  // Use the existing backend image proxy to bypass CORS/CORP blocks
  const proxyUrl = url.startsWith('/') ? url : `/api/image?url=${encodeURIComponent(url)}`;
  
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image via proxy: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`URL did not return an image (got ${contentType})`);
  }

  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Ensure CORS is handled
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D context from canvas'));
          return;
        }

        // Calculate new dimensions (max 800px, preserving aspect ratio)
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.75); // 75% quality JPEG
        resolve(base64);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image into HTMLImageElement'));
    };

    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Custom hook to manage client-side image caching.
 * Checks IndexedDB first, falls back to fetching, compressing, and caching.
 */
export function useCachedImage(originalUrl: string | null | undefined) {
  const [src, setSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!originalUrl) {
      setSrc(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function loadAndCache() {
      try {
        // 1. Check IndexedDB cache
        const cached = await getCachedImage(originalUrl!);
        if (cached) {
          if (isMounted) {
            setSrc(cached);
            setIsLoading(false);
          }
          return;
        }

        // 2. If not cached, fetch, compress, and convert to Base64
        const base64 = await compressAndConvertToBase64(originalUrl!);
        
        // 3. Save to IndexedDB cache
        await setCachedImage(originalUrl!, base64);

        if (isMounted) {
          setSrc(base64);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error in useCachedImage:', err);
        if (isMounted) {
          // Fallback to proxy URL directly if compression/caching fails
          const fallbackUrl = originalUrl!.startsWith('/') 
            ? originalUrl! 
            : `/api/image?url=${encodeURIComponent(originalUrl!)}`;
          setSrc(fallbackUrl);
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
