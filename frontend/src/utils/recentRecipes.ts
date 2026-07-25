/**
 * Tracks which recipes the user recently opened — purely client-side.
 *
 * Powers the "Zuletzt geöffnet" shelf on the cookbook home and the matching
 * sort option in the catalog list. Deliberately localStorage-only: opening a
 * recipe is a high-frequency, low-value event that isn't worth a round trip,
 * and the ordering is only meaningful on the device it happened on.
 */

const STORAGE_KEY = 'recipe_recent_opened';

/** Cap so the entry never grows unbounded for heavy users. */
const MAX_ENTRIES = 60;

/** jobId -> timestamp (ms) of the last time the recipe was opened. */
export type RecentMap = Record<string, number>;

export function readRecentMap(): RecentMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const map: RecentMap = {};
    for (const [id, ts] of Object.entries(parsed)) {
      if (typeof ts === 'number' && Number.isFinite(ts)) map[id] = ts;
    }
    return map;
  } catch {
    return {};
  }
}

function writeRecentMap(map: RecentMap): RecentMap {
  // Keep only the newest MAX_ENTRIES so the payload stays small.
  const trimmed: RecentMap = Object.fromEntries(
    Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_ENTRIES)
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota / private mode — the shelf just stays empty */
  }
  return trimmed;
}

/** Records `jobId` as opened right now and returns the updated map. */
export function markRecipeOpened(jobId: string): RecentMap {
  if (!jobId) return readRecentMap();
  return writeRecentMap({ ...readRecentMap(), [jobId]: Date.now() });
}

/** Drops entries for recipes that no longer exist and returns the updated map. */
export function pruneRecentMap(validIds: Set<string>): RecentMap {
  const map = readRecentMap();
  const next: RecentMap = {};
  let changed = false;
  for (const [id, ts] of Object.entries(map)) {
    if (validIds.has(id)) next[id] = ts;
    else changed = true;
  }
  return changed ? writeRecentMap(next) : map;
}
