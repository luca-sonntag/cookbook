/**
 * Offline-first store for the saved-recipe cookbook.
 *
 * Mirrors the L1(memory) + L2(IndexedDB) design of `imageStore.ts`, but caches
 * the whole per-user jobs array as ONE record — it maps 1:1 to the `history`
 * `useState<Job[]>` in App.tsx and to the single `setHistory` sink, so hydrating
 * is a single atomic `get`. This lets the cookbook paint instantly on a cold
 * start (even fully offline) instead of waiting on `GET /api/jobs`.
 *
 * The database (`snagbite-offline`) also declares the `outbox` object store used
 * by the write-outbox (see `outbox.ts`) so both share one DB version — bumping
 * the version in only one module would race the other's `onupgradeneeded`.
 */

import type { Job } from '../types';

const DB_NAME = 'snagbite-offline';
const DB_VERSION = 1;

export const HISTORY_STORE = 'history';
export const OUTBOX_STORE = 'outbox';

/** Schema tag stored with each snapshot; bump when `Job`'s shape changes so
 *  stale blobs are discarded rather than mis-read (no migration engine needed). */
const HISTORY_SCHEMA = 1;

interface HistoryRecord {
  jobs: Job[];
  cachedAt: number;
  schema: number;
}

/** L1 in-memory cache — keyed by Supabase user id, so accounts never mix. */
const memHistory = new Map<string, Job[]>();

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Opens (and, on first use, creates) the shared offline database. Both the
 * `history` and `outbox` stores are created here so the two feature modules
 * agree on a single schema version.
 */
export function getOfflineDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      // History snapshot: out-of-line key = userId.
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE);
      }
      // Write-outbox: in-line key on `id`, queried per user via the index.
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        const outbox = db.createObjectStore(OUTBOX_STORE, { keyPath: 'id' });
        outbox.createIndex('by-user', 'userId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Synchronous read from the L1 memory cache. Returns the cached jobs array, or
 * null if not yet loaded this session. Lets the hydrate effect paint without an
 * await when the snapshot has already been touched this session.
 */
export function getMemoryHistory(userId: string): Job[] | null {
  return memHistory.get(userId) ?? null;
}

/**
 * Reads the cached cookbook for a user. Checks L1 first, falls back to
 * IndexedDB. Returns null on a miss, a schema mismatch, or any error — the
 * caller then relies on the network fetch, so a bad blob is simply discarded.
 */
export async function readCachedHistory(userId: string): Promise<Job[] | null> {
  const mem = memHistory.get(userId);
  if (mem) return mem;

  try {
    const db = await getOfflineDB();
    const record = await new Promise<HistoryRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(HISTORY_STORE, 'readonly');
      const req = tx.objectStore(HISTORY_STORE).get(userId);
      req.onsuccess = () => resolve(req.result as HistoryRecord | undefined);
      req.onerror = () => reject(req.error);
    });

    if (!record || record.schema !== HISTORY_SCHEMA || !Array.isArray(record.jobs)) {
      return null;
    }
    // Promote to L1 so the next read is synchronous.
    memHistory.set(userId, record.jobs);
    return record.jobs;
  } catch (err) {
    console.error('Failed to read cached history from IndexedDB:', err);
    return null;
  }
}

/**
 * Persists the fresh server snapshot for a user to both L1 and IndexedDB. The
 * snapshot is disposable, so a `QuotaExceededError` (or any other failure) is
 * swallowed — the app just re-fetches on the next start.
 */
export async function writeCachedHistory(userId: string, jobs: Job[]): Promise<void> {
  // Write to L1 immediately so subsequent reads (and getMemoryHistory) are hot.
  memHistory.set(userId, jobs);

  try {
    const db = await getOfflineDB();
    const record: HistoryRecord = { jobs, cachedAt: Date.now(), schema: HISTORY_SCHEMA };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HISTORY_STORE, 'readwrite');
      const req = tx.objectStore(HISTORY_STORE).put(record, userId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to write cached history to IndexedDB:', err);
  }
}

/**
 * Drops a user's cached cookbook from both layers. Called on logout / account
 * switch so a shared device never shows one account's recipes to the next.
 */
export async function clearCachedHistory(userId: string): Promise<void> {
  memHistory.delete(userId);

  try {
    const db = await getOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HISTORY_STORE, 'readwrite');
      const req = tx.objectStore(HISTORY_STORE).delete(userId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to clear cached history from IndexedDB:', err);
  }
}
