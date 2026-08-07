/**
 * Level/XP helpers shared by the reward overlay and the progress tab.
 * `thresholds[i]` is the cumulative XP needed for level i+1 (thresholds[0] = 0).
 * When thresholds is empty (not yet loaded) callers degrade gracefully to a
 * full bar with no "next level".
 */

export function levelBounds(
  level: number,
  thresholds: number[],
): { floor: number; ceil: number | null } {
  const floor = thresholds[level - 1] ?? 0;
  const ceil = level < thresholds.length ? thresholds[level] : null;
  return { floor, ceil };
}

/** Fill percentage (0–100) of the XP bar within the given level. */
export function progressPct(xp: number, level: number, thresholds: number[]): number {
  const { floor, ceil } = levelBounds(level, thresholds);
  if (ceil == null || ceil <= floor) return 100;
  return Math.max(0, Math.min(100, ((xp - floor) / (ceil - floor)) * 100));
}

/** XP remaining to the next level, or null when already at the max level. */
export function xpToNextLevel(xp: number, level: number, thresholds: number[]): number | null {
  const { ceil } = levelBounds(level, thresholds);
  if (ceil == null) return null;
  return Math.max(0, ceil - xp);
}
