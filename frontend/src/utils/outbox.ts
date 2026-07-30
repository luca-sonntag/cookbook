/**
 * Durable write-outbox: persists job-level mutations (favorite / flags /
 * collection-assignment / delete) so they survive a cold restart and sync when
 * connectivity returns. Backs the ephemeral optimistic UI in useSavedCatalog
 * with real durability + retry, replacing rollback-on-failure.
 *
 * IndexedDB I/O lives here; the pure op model, coalescing, and overlay live in
 * reconcile.ts. Every target endpoint already exists and is retry-safe
 * (absolute-value PATCHes, guarded soft-delete), so re-sending an op is safe.
 */

import { apiUrl } from '../api';
import { getOfflineDB, OUTBOX_STORE, readCachedHistory, writeCachedHistory } from './recipeStore';
import {
  coalesce,
  dedupeKeyFor,
  reconcileHistory,
  type OutboxOp,
  type OutboxOpType,
} from './reconcile';

/** Auth accessors injected by useOfflineSync (which owns the AuthContext). */
export interface OutboxAuth {
  getAccessToken: () => Promise<string | null>;
  refreshSession: () => Promise<{ error?: string }>;
}

export interface OutboxStatus {
  pendingCount: number;
  failedCount: number;
}

// ── IndexedDB primitives ───────────────────────────────────────────────────

async function readAllOps(): Promise<OutboxOp[]> {
  try {
    const db = await getOfflineDB();
    return await new Promise<OutboxOp[]>((resolve, reject) => {
      const tx = db.transaction(OUTBOX_STORE, 'readonly');
      const req = tx.objectStore(OUTBOX_STORE).getAll();
      req.onsuccess = () => resolve((req.result as OutboxOp[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to read outbox:', err);
    return [];
  }
}

async function readOpsForUser(userId: string): Promise<OutboxOp[]> {
  const all = await readAllOps();
  return all.filter(o => o.userId === userId);
}

async function putOp(op: OutboxOp): Promise<void> {
  const db = await getOfflineDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const req = tx.objectStore(OUTBOX_STORE).put(op);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function deleteOp(id: string): Promise<void> {
  const db = await getOfflineDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const req = tx.objectStore(OUTBOX_STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Status pub/sub ─────────────────────────────────────────────────────────

const listeners = new Set<(s: OutboxStatus) => void>();

export function subscribe(listener: (s: OutboxStatus) => void): () => void {
  listeners.add(listener);
  void notify();
  return () => listeners.delete(listener);
}

async function notify(): Promise<void> {
  if (listeners.size === 0) return;
  const all = await readAllOps();
  const status: OutboxStatus = {
    pendingCount: all.filter(o => o.status !== 'failed').length,
    failedCount: all.filter(o => o.status === 'failed').length,
  };
  listeners.forEach(l => l(status));
}

// ── Public read used by the reconcile overlay ──────────────────────────────

/** Non-failed ops for a user, in FIFO order — the set overlaid onto server
 *  truth by reconcileHistory. Failed ops are excluded by design (they fall back
 *  to server truth). */
export async function getPendingOps(userId: string): Promise<OutboxOp[]> {
  const ops = await readOpsForUser(userId);
  return ops.filter(o => o.status !== 'failed').sort((a, b) => a.createdAt - b.createdAt);
}

export async function clearOutbox(userId: string): Promise<void> {
  const ops = await readOpsForUser(userId);
  await Promise.all(ops.map(o => deleteOp(o.id).catch(() => {})));
  void notify();
}

// ── Enqueue (+ coalesce, + apply-to-cache) ─────────────────────────────────

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeOp(userId: string, type: OutboxOpType, targetId: string, payload: OutboxOp['payload']): OutboxOp {
  const now = Date.now();
  return {
    id: newId(),
    userId,
    type,
    targetId,
    payload,
    dedupeKey: dedupeKeyFor(type, targetId),
    createdAt: now,
    updatedAt: now,
    retryCount: 0,
    status: 'pending',
  };
}

/**
 * Persists the op with coalescing applied, then reflects it into the local
 * cache snapshot so the change survives a restart even before it syncs. The
 * caller (a hook) is responsible for the instant optimistic UI state.
 */
async function enqueue(userId: string, op: OutboxOp): Promise<void> {
  // 1. Durably reflect the intent in the cached snapshot (best-known state).
  try {
    const cached = await readCachedHistory(userId);
    if (cached) await writeCachedHistory(userId, reconcileHistory(cached, [op]));
  } catch (err) {
    console.error('Failed to apply outbox op to cache:', err);
  }

  // 2. Coalesce against the current queue and persist the delta. coalesce keeps
  //    referential identity for untouched ops, so reference-inequality detects
  //    exactly the ops that were added or mutated.
  const existing = await readOpsForUser(userId);
  const next = coalesce(existing, op);
  const nextById = new Map(next.map(o => [o.id, o]));
  await Promise.all([
    ...existing.filter(o => !nextById.has(o.id)).map(o => deleteOp(o.id)),
    ...next
      .filter(o => existing.find(e => e.id === o.id) !== o)
      .map(o => putOp(o)),
  ]);
  void notify();
}

// ── Drain / flush ──────────────────────────────────────────────────────────

let draining = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let lastAuth: OutboxAuth | null = null;

const RETRY_BASE_MS = 30_000;
const RETRY_MAX_MS = 5 * 60_000;

function scheduleRetry(retryCount: number): void {
  if (retryTimer) return;
  const delay = Math.min(RETRY_BASE_MS * 2 ** retryCount, RETRY_MAX_MS);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (lastAuth) void flush(lastAuth);
  }, delay);
}

type SendResult = 'done' | 'retry' | 'failed';

function endpointFor(op: OutboxOp): { method: string; path: string; body?: string } {
  switch (op.type) {
    case 'favorite':
      return { method: 'PATCH', path: `/api/jobs/${op.targetId}/favorite`, body: JSON.stringify(op.payload) };
    case 'flags':
      return { method: 'PATCH', path: `/api/jobs/${op.targetId}/flags`, body: JSON.stringify(op.payload) };
    case 'collections':
      return { method: 'PATCH', path: `/api/jobs/${op.targetId}/collections`, body: JSON.stringify(op.payload) };
    case 'deleteJob':
      return { method: 'DELETE', path: `/api/jobs/${op.targetId}` };
  }
}

async function sendOp(op: OutboxOp, auth: OutboxAuth): Promise<SendResult> {
  const { method, path, body } = endpointFor(op);
  const doFetch = (token: string) =>
    fetch(apiUrl(path), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body } : {}),
    });

  let token = await auth.getAccessToken();
  if (!token) return 'retry';

  let resp: Response;
  try {
    resp = await doFetch(token);
  } catch {
    return 'retry'; // offline / network error — never discard
  }

  if (resp.status === 401) {
    // One refresh attempt, then retry the request.
    const r = await auth.refreshSession();
    if (r?.error) return 'retry';
    token = await auth.getAccessToken();
    if (!token) return 'retry';
    try {
      resp = await doFetch(token);
    } catch {
      return 'retry';
    }
    if (resp.status === 401) return 'retry';
  }

  if (resp.ok) return 'done';
  if (op.type === 'deleteJob' && resp.status === 404) return 'done'; // already gone
  if (resp.status >= 500) return 'retry'; // server transient
  return 'failed'; // permanent 4xx (e.g. 403 premium-gated)
}

async function drain(auth: OutboxAuth): Promise<void> {
  const ops = (await readAllOps())
    .filter(o => o.status !== 'failed')
    .sort((a, b) => a.createdAt - b.createdAt);

  for (const op of ops) {
    const result = await sendOp(op, auth);
    if (result === 'done') {
      await deleteOp(op.id);
    } else if (result === 'retry') {
      await putOp({ ...op, status: 'pending', retryCount: op.retryCount + 1 });
      scheduleRetry(op.retryCount + 1);
      break; // transient — stop; the whole queue retries together later
    } else {
      // Permanent failure: park it (surfaced via status) and move on. The next
      // fetchHistory reconcile drops its overlay, so the UI snaps to server truth.
      await putOp({ ...op, status: 'failed', lastError: 'permanent' });
    }
  }
  void notify();
}

/** Drains the outbox once, single-flight. Safe to call from any trigger. */
export async function flush(auth: OutboxAuth): Promise<void> {
  lastAuth = auth;
  if (draining) return;
  draining = true;
  try {
    const locks = (navigator as Navigator & { locks?: LockManager }).locks;
    if (locks?.request) {
      await locks.request('snagbite-outbox', { ifAvailable: true }, async lock => {
        if (!lock) return; // another tab holds it
        await drain(auth);
      });
    } else {
      await drain(auth);
    }
  } finally {
    draining = false;
  }
}

// ── Queue facade (called by hooks) ─────────────────────────────────────────

function enqueueAndMaybeFlush(userId: string, op: OutboxOp): void {
  void enqueue(userId, op).then(() => {
    if (navigator.onLine && lastAuth) void flush(lastAuth);
  });
}

export function queueFavorite(userId: string, jobId: string, isFavorite: boolean): void {
  enqueueAndMaybeFlush(userId, makeOp(userId, 'favorite', jobId, { isFavorite }));
}

export function queueFlags(userId: string, jobId: string, flags: string[]): void {
  enqueueAndMaybeFlush(userId, makeOp(userId, 'flags', jobId, { flags }));
}

export function queueCollections(userId: string, jobId: string, collectionIds: string[]): void {
  enqueueAndMaybeFlush(userId, makeOp(userId, 'collections', jobId, { collectionIds }));
}

export function queueDeleteJob(userId: string, jobId: string): void {
  enqueueAndMaybeFlush(userId, makeOp(userId, 'deleteJob', jobId, {}));
}
