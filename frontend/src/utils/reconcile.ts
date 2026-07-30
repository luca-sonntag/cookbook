/**
 * Pure (IndexedDB-free) core of the write-outbox: the op model, the coalescing
 * rules, and the overlay that merges pending local writes onto server truth.
 *
 * Kept dependency-free so it is trivially unit-testable without an IDB mock.
 * All conflict handling is last-write-wins — cross-device real-time consistency
 * is explicitly out of scope, so a newer local intent always wins over the
 * server snapshot until the server confirms it.
 */

import type { Job } from '../types';

/** Job-level mutations the outbox can queue. Each maps to one existing,
 *  retry-safe backend endpoint. Collection *entity* CRUD is intentionally not
 *  here — it stays online (see useCollections). */
export type OutboxOpType = 'favorite' | 'flags' | 'collections' | 'deleteJob';

export type OutboxStatus = 'pending' | 'inflight' | 'failed';

export interface OutboxOp {
  /** Primary key. */
  id: string;
  /** Owning Supabase user id — every read/flush is scoped by this. */
  userId: string;
  type: OutboxOpType;
  /** The job id the op mutates. */
  targetId: string;
  /** Type-specific body sent to the server, e.g. { isFavorite } / { flags } / { collectionIds }. */
  payload: FavoritePayload | FlagsPayload | CollectionsPayload | Record<string, never>;
  /** `${type}:${targetId}` — collapses repeated edits of the same field. */
  dedupeKey: string;
  /** FIFO ordering + LWW tiebreak. */
  createdAt: number;
  /** Last coalesce time. */
  updatedAt: number;
  retryCount: number;
  status: OutboxStatus;
  lastError?: string;
}

export interface FavoritePayload { isFavorite: boolean; }
export interface FlagsPayload { flags: string[]; }
export interface CollectionsPayload { collectionIds: string[]; }

export function dedupeKeyFor(type: OutboxOpType, targetId: string): string {
  return `${type}:${targetId}`;
}

/**
 * Applies the coalescing rules for an incoming op against the current op list,
 * returning the resulting list. Only `pending` ops are merged/dropped —
 * `inflight`/`failed` ops are left untouched (an inflight send completes on its
 * own; a fresh edit for the same key just becomes a new pending op, and LWW on
 * the next drain still lands the latest value).
 */
export function coalesce(existing: OutboxOp[], incoming: OutboxOp): OutboxOp[] {
  const isPending = (o: OutboxOp) => o.status === 'pending';
  let ops = [...existing];

  if (incoming.type === 'deleteJob') {
    // A queued delete makes any pending metadata edit on the same job moot.
    ops = ops.filter(
      o => !(isPending(o) && o.targetId === incoming.targetId && o.type !== 'deleteJob')
    );
    // Don't queue a second delete for the same job.
    if (ops.some(o => isPending(o) && o.dedupeKey === incoming.dedupeKey)) return ops;
    ops.push(incoming);
    return ops;
  }

  // Scalar edit: collapse into the pending op with the same dedupeKey, if any.
  const idx = ops.findIndex(o => isPending(o) && o.dedupeKey === incoming.dedupeKey);
  if (idx >= 0) {
    ops[idx] = { ...ops[idx], payload: incoming.payload, updatedAt: incoming.updatedAt };
    return ops;
  }

  ops.push(incoming);
  return ops;
}

/**
 * Overlays pending/inflight ops onto the authoritative server list so
 * not-yet-synced local changes survive a refresh and a cold restart without
 * flicker. Applied in `createdAt` order (LWW). Failed ops must NOT be passed in
 * — a permanently failed write falls back to server truth by design.
 */
export function reconcileHistory(serverJobs: Job[], pendingOps: OutboxOp[]): Job[] {
  if (pendingOps.length === 0) return serverJobs;

  const byId = new Map<string, Job>(serverJobs.map(j => [j.id, { ...j }]));
  const deleted = new Set<string>();

  const ordered = [...pendingOps].sort((a, b) => a.createdAt - b.createdAt);
  for (const op of ordered) {
    if (op.type === 'deleteJob') {
      deleted.add(op.targetId);
      continue;
    }
    const job = byId.get(op.targetId);
    if (!job) continue;
    if (op.type === 'favorite') {
      job.isFavorite = (op.payload as FavoritePayload).isFavorite;
    } else if (op.type === 'flags') {
      job.flags = (op.payload as FlagsPayload).flags;
    } else if (op.type === 'collections') {
      job.collectionIds = (op.payload as CollectionsPayload).collectionIds;
    }
  }

  return serverJobs
    .filter(j => !deleted.has(j.id))
    .map(j => byId.get(j.id)!);
}
