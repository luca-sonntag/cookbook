import { describe, it, expect } from 'vitest';
import type { Job } from '../../types';
import {
  coalesce,
  reconcileHistory,
  dedupeKeyFor,
  type OutboxOp,
  type OutboxOpType,
} from '../reconcile';

let seq = 0;
function makeOp(
  type: OutboxOpType,
  targetId: string,
  payload: OutboxOp['payload'],
  overrides: Partial<OutboxOp> = {}
): OutboxOp {
  const t = ++seq;
  return {
    id: `op-${t}`,
    userId: 'user-1',
    type,
    targetId,
    payload,
    dedupeKey: dedupeKeyFor(type, targetId),
    createdAt: t,
    updatedAt: t,
    retryCount: 0,
    status: 'pending',
    ...overrides,
  };
}

function job(id: string, extra: Partial<Job> = {}): Job {
  return {
    id,
    url: `https://example/${id}`,
    status: 'completed',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    isFavorite: false,
    flags: [],
    collectionIds: [],
    ...extra,
  };
}

describe('coalesce', () => {
  it('collapses repeated favorite toggles on the same job into one op with the latest value', () => {
    const first = makeOp('favorite', 'j1', { isFavorite: true });
    const second = makeOp('favorite', 'j1', { isFavorite: false });
    const result = coalesce([first], second);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(first.id); // kept the original record id
    expect(result[0].payload).toEqual({ isFavorite: false }); // latest value
    expect(result[0].updatedAt).toBe(second.updatedAt);
  });

  it('keeps separate ops for the same field on different jobs', () => {
    const a = makeOp('favorite', 'j1', { isFavorite: true });
    const b = makeOp('favorite', 'j2', { isFavorite: true });
    expect(coalesce([a], b)).toHaveLength(2);
  });

  it('does not merge into an inflight op (a fresh edit becomes a new pending op)', () => {
    const inflight = makeOp('favorite', 'j1', { isFavorite: true }, { status: 'inflight' });
    const incoming = makeOp('favorite', 'j1', { isFavorite: false });
    const result = coalesce([inflight], incoming);
    expect(result).toHaveLength(2);
  });

  it('deleteJob drops pending metadata ops for the same job', () => {
    const fav = makeOp('favorite', 'j1', { isFavorite: true });
    const flags = makeOp('flags', 'j1', { flags: ['x'] });
    const other = makeOp('favorite', 'j2', { isFavorite: true });
    const del = makeOp('deleteJob', 'j1', {});

    const result = coalesce([fav, flags, other], del);
    const types = result.map(o => `${o.type}:${o.targetId}`).sort();
    expect(types).toEqual(['deleteJob:j1', 'favorite:j2']);
  });

  it('does not queue a second delete for the same job', () => {
    const del1 = makeOp('deleteJob', 'j1', {});
    const del2 = makeOp('deleteJob', 'j1', {});
    expect(coalesce([del1], del2)).toHaveLength(1);
  });

  it('collapses repeated collection assignments on the same job', () => {
    const a = makeOp('collections', 'j1', { collectionIds: ['c1'] });
    const b = makeOp('collections', 'j1', { collectionIds: ['c1', 'c2'] });
    const result = coalesce([a], b);
    expect(result).toHaveLength(1);
    expect(result[0].payload).toEqual({ collectionIds: ['c1', 'c2'] });
  });
});

describe('reconcileHistory', () => {
  it('returns the server list unchanged when there are no pending ops', () => {
    const server = [job('j1'), job('j2')];
    expect(reconcileHistory(server, [])).toBe(server);
  });

  it('overlays a pending favorite over server truth without mutating input', () => {
    const server = [job('j1', { isFavorite: false })];
    const ops = [makeOp('favorite', 'j1', { isFavorite: true })];
    const result = reconcileHistory(server, ops);

    expect(result[0].isFavorite).toBe(true);
    expect(server[0].isFavorite).toBe(false); // input not mutated
  });

  it('removes a job with a queued delete', () => {
    const server = [job('j1'), job('j2')];
    const ops = [makeOp('deleteJob', 'j1', {})];
    const result = reconcileHistory(server, ops);
    expect(result.map(j => j.id)).toEqual(['j2']);
  });

  it('applies flags and collections overlays', () => {
    const server = [job('j1', { flags: [], collectionIds: [] })];
    const ops = [
      makeOp('flags', 'j1', { flags: ['spicy'] }),
      makeOp('collections', 'j1', { collectionIds: ['c9'] }),
    ];
    const result = reconcileHistory(server, ops);
    expect(result[0].flags).toEqual(['spicy']);
    expect(result[0].collectionIds).toEqual(['c9']);
  });

  it('applies the latest op last (last-write-wins by createdAt)', () => {
    const server = [job('j1', { isFavorite: false })];
    // Deliberately pass out of order; reconcile sorts by createdAt.
    const later = makeOp('favorite', 'j1', { isFavorite: true }, { createdAt: 200 });
    const earlier = makeOp('favorite', 'j1', { isFavorite: false }, { createdAt: 100 });
    const result = reconcileHistory(server, [later, earlier]);
    expect(result[0].isFavorite).toBe(true);
  });

  it('ignores ops that target jobs not present in the server list', () => {
    const server = [job('j1')];
    const ops = [makeOp('favorite', 'ghost', { isFavorite: true })];
    expect(() => reconcileHistory(server, ops)).not.toThrow();
    expect(reconcileHistory(server, ops).map(j => j.id)).toEqual(['j1']);
  });
});
