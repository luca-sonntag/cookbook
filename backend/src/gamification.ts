/**
 * Gamification orchestration: turns a "user cooked recipe X" event into a
 * persisted cook_event + ledger row + updated aggregate stats + badges.
 *
 * The pure scoring math lives in gamificationFormula.ts; this module is the I/O
 * shell that loads context, applies streak/level bookkeeping, and writes.
 *
 * Concurrency note: user_stats is updated read-modify-write. Two *concurrent*
 * cooks by the same user could race; for the expected single-user, low-frequency
 * usage this is acceptable, and the duplicate guard below absorbs rapid re-taps.
 * A DB-side transaction/RPC is the natural upgrade if that ever matters.
 */
import type { CookSignals, CookedResult, UserStats } from './types.js';
import { computeAward, levelForXp } from './gamificationFormula.js';
import {
  getGamificationConfig,
  getUserStats,
  getLastCookEvent,
  getCookCountForJob,
  getCookCountSince,
  insertCookEvent,
  insertLedgerRows,
  upsertUserStats,
  getUserBadges,
  awardBadges,
  getDistinctCookedRecipeCount,
} from './db.js';

/** All badge keys the launch set can award (labels live in the frontend i18n). */
export const BADGE_KEYS = [
  'first_cook', 'cook_10', 'cook_50',
  'streak_3', 'streak_7', 'streak_30',
  'first_photo', 'distinct_5', 'distinct_10',
] as const;

// ── Date helpers (UTC day boundaries) ────────────────────────────────────────
// Streaks use UTC days so the server stays authoritative without a client TZ.
// Known simplification: a late-evening cook near the UTC boundary may land on
// the next day; acceptable for the first pass.

function utcDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDayIso(d: Date): string {
  return `${utcDateStr(d)}T00:00:00.000Z`;
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return utcDateStr(d);
}

interface BadgeEvalParams {
  totalCooks: number;
  currentStreak: number;
  hasPhoto: boolean;
  distinctRecipes: number;
  existing: Set<string>;
}

/** Returns badge keys newly earned by this cook (not already held). */
function evaluateBadges(p: BadgeEvalParams): string[] {
  const earned: string[] = [];
  const add = (k: string) => { if (!p.existing.has(k)) earned.push(k); };
  if (p.totalCooks >= 1) add('first_cook');
  if (p.totalCooks >= 10) add('cook_10');
  if (p.totalCooks >= 50) add('cook_50');
  if (p.currentStreak >= 3) add('streak_3');
  if (p.currentStreak >= 7) add('streak_7');
  if (p.currentStreak >= 30) add('streak_30');
  if (p.hasPhoto) add('first_photo');
  if (p.distinctRecipes >= 5) add('distinct_5');
  if (p.distinctRecipes >= 10) add('distinct_10');
  return earned;
}

/**
 * Record that `userId` cooked `jobId`, awarding XP/coins and updating streak,
 * level and badges. Returns everything the reward overlay needs to animate.
 */
export async function recordCook(
  userId: string,
  jobId: string,
  signals: CookSignals = {},
): Promise<CookedResult> {
  const config = await getGamificationConfig();
  const prevStats = await getUserStats(userId);
  const previousXp = prevStats.xp;
  const previousLevel = prevStats.level;
  const now = new Date();

  // Duplicate guard: same recipe re-tapped within the velocity window is a no-op
  // so a double-tap doesn't double-award. Different recipes are never blocked.
  const last = await getLastCookEvent(userId);
  if (last && last.jobId === jobId) {
    const deltaMs = now.getTime() - new Date(last.cookedAt).getTime();
    if (deltaMs < config.velocityMinSeconds * 1000) {
      return {
        stats: prevStats,
        earned: { xp: 0, coins: 0, reasons: ['duplicate'] },
        newBadges: [],
        previousXp,
        previousLevel,
        leveledUp: false,
        duplicate: true,
      };
    }
  }

  const priorCookCount = await getCookCountForJob(userId, jobId);
  const cooksToday = await getCookCountSince(userId, startOfUtcDayIso(now));
  const cookIndexToday = cooksToday + 1;

  // Streak: at most one increment per day; a gap of >1 day resets to 1.
  const today = utcDateStr(now);
  let currentStreak: number;
  if (prevStats.lastCookDate === today) {
    currentStreak = prevStats.currentStreak || 1; // already cooked today — hold
  } else if (prevStats.lastCookDate && addDaysStr(prevStats.lastCookDate, 1) === today) {
    currentStreak = (prevStats.currentStreak || 0) + 1;
  } else {
    currentStreak = 1;
  }
  const longestStreak = Math.max(prevStats.longestStreak, currentStreak);

  const hasPhoto = !!signals.hasPhoto && !!signals.photoPath;
  const award = computeAward(config, {
    priorCookCount,
    cookIndexToday,
    streakDays: currentStreak,
    hasPhoto,
    difficultyTier: '1', // no difficulty signal on recipes yet — flat at launch
  });

  const cookEventId = await insertCookEvent({
    userId,
    jobId,
    xp: award.xp,
    coins: award.coins,
    hasPhoto,
    photoPath: signals.photoPath ?? null,
    verified: award.verified,
    leaderboardEligible: award.leaderboardEligible,
    trustScore: award.trustScore,
    viaCookingMode: !!signals.viaCookingMode,
    timerElapsed: !!signals.timerElapsed,
  });

  await insertLedgerRows(userId, cookEventId, [
    { deltaXp: award.xp, deltaCoins: award.coins, reason: 'cook' },
  ]);

  const newXp = previousXp + award.xp;
  const newLevel = levelForXp(newXp, config.levelThresholds);
  const newStats: UserStats = {
    userId,
    xp: newXp,
    level: newLevel,
    coins: prevStats.coins + award.coins,
    currentStreak,
    longestStreak,
    lastCookDate: today,
    totalCooks: prevStats.totalCooks + 1,
  };
  await upsertUserStats(newStats);

  // Badges — distinct-recipe count is read after the insert so it includes this cook.
  const existing = new Set(await getUserBadges(userId));
  const distinctRecipes = await getDistinctCookedRecipeCount(userId);
  const newBadges = evaluateBadges({
    totalCooks: newStats.totalCooks,
    currentStreak,
    hasPhoto,
    distinctRecipes,
    existing,
  });
  await awardBadges(userId, newBadges);

  return {
    stats: newStats,
    earned: { xp: award.xp, coins: award.coins, reasons: award.reasons },
    newBadges,
    previousXp,
    previousLevel,
    leveledUp: newLevel > previousLevel,
  };
}
