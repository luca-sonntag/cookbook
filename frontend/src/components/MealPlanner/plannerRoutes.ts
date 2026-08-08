/**
 * Sub-route encoding for the weekly meal planner, which lives *under* the
 * `history` (Rezepte) tab so the bottom nav stays at five tabs.
 *
 *   #/history/planner            → planner home (setup form + saved plans)
 *   #/history/planner/<planId>   → a single generated plan
 *
 * `planner` never collides with a recipe jobId (UUIDs are hex-only) nor with
 * the catalog's reserved `list` segment.
 */
export const PLANNER_SEGMENT = 'planner';

/** True when the history sub-path addresses the planner rather than the catalog. */
export function isPlannerRoute(subPath: string | null | undefined): boolean {
  if (!subPath) return false;
  return subPath === PLANNER_SEGMENT || subPath.startsWith(`${PLANNER_SEGMENT}/`);
}

/** Builds the history sub-path for the planner, optionally for one plan. */
export function buildPlannerRoute(planId?: string | null): string {
  return planId ? `${PLANNER_SEGMENT}/${encodeURIComponent(planId)}` : PLANNER_SEGMENT;
}

/** Extracts the plan id from a planner sub-path, or null for the planner home. */
export function plannerPlanId(subPath: string | null | undefined): string | null {
  if (!isPlannerRoute(subPath)) return null;
  const rest = subPath!.slice(PLANNER_SEGMENT.length).replace(/^\//, '');
  if (!rest) return null;
  try {
    return decodeURIComponent(rest);
  } catch {
    return rest;
  }
}
