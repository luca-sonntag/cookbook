/**
 * Lightweight IndexedDB wrapper for caching compressed recipe images.
 * Stores images as Base64 data URLs keyed by the original image URL.
 *
 * Cache architecture:
 *   L1 — module-level Map (synchronous, session-scoped, zero-latency)
 *   L2 — IndexedDB  (async, persists across page reloads)
 *
 * Both layers are kept in sync automatically by this module.
 */

const DB_NAME = 'recipe-image-cache';
const DB_VERSION = 1;
const STORE_NAME = 'images';

/** L1 in-memory cache — keyed by original image URL. */
const memCache = new Map<string, string>();

/**
 * Synchronous read from the L1 memory cache.
 * Returns the cached Base64 string, or null if not yet loaded this session.
 * Used by useCachedImage's useState lazy initializer to avoid any async delay
 * on the very first render when the image has already been seen this session.
 */
export function getMemoryCachedImage(url: string): string | null {
  return memCache.get(url) ?? null;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Retrieves a cached Base64 image by its original URL.
 * Checks the L1 memory cache first — falls back to IndexedDB.
 */
export async function getCachedImage(url: string): Promise<string | null> {
  // L1 hit: return immediately without touching IndexedDB.
  if (memCache.has(url)) return memCache.get(url)!;

  try {
    const db = await getDB();
    const result = await new Promise<string | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    // Promote to L1 so the next call is instant.
    if (result) memCache.set(url, result);
    return result;
  } catch (err) {
    console.error('Failed to get image from IndexedDB:', err);
    return null;
  }
}

/**
 * Caches a Base64 image keyed by its original URL.
 * Writes to both the L1 memory cache and IndexedDB.
 */
export async function setCachedImage(url: string, base64Data: string): Promise<void> {
  // Write to L1 immediately so subsequent reads are synchronous.
  memCache.set(url, base64Data);

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(base64Data, url);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Failed to save image to IndexedDB:', err);
  }
}

/**
 * Deletes a cached image by its original URL.
 * Removes from both the L1 memory cache and IndexedDB.
 */
export async function deleteCachedImage(url: string): Promise<void> {
  // Evict from L1 first so stale data is never returned.
  memCache.delete(url);

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(url);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Failed to delete image from IndexedDB:', err);
  }
}

/**
 * Clears all cached images from both the L1 memory cache and IndexedDB.
 */
export async function clearImageCache(): Promise<void> {
  // Clear L1 first.
  memCache.clear();

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Failed to clear IndexedDB image cache:', err);
  }
}
