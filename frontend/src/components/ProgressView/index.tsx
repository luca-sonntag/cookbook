import { useEffect, type ReactNode } from 'react';
import { Flame, Coins, Utensils, Trophy, Lock } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useGamification } from '../../context/GamificationContext';
import { progressPct, xpToNextLevel } from '../../utils/levels';
import { ALL_BADGE_KEYS, badgeEmoji } from '../../utils/badges';

/**
 * The "Fortschritt" (progress) tab: level + animated-free XP bar, streak, coins,
 * total cooks and the badge grid. Reads the shared gamification snapshot. Coins
 * are shown but there is no shop yet (first pass).
 */
export default function ProgressView() {
  const { t } = useI18n();
  const { snapshot, refresh } = useGamification();

  // Refresh whenever the tab is opened so the stats are current.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = snapshot?.stats;
  const thresholds = snapshot?.levelThresholds ?? [];
  const earned = new Set((snapshot?.badges ?? []).map((b) => b.key));

  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;
  const fill = progressPct(xp, level, thresholds);
  const toNext = xpToNextLevel(xp, level, thresholds);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
        {t('app.gamification.tabTitle')}
      </h1>

      {/* Level + XP bar */}
      <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-md">
            <Trophy className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {t('app.gamification.level', { level })}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {toNext == null
                ? t('app.gamification.maxLevel')
                : t('app.gamification.xpToNext', { xp: toNext, level: level + 1 })}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{xp}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {t('app.gamification.xp')}
            </div>
          </div>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-[width] duration-700 ease-out"
            style={{ width: `${fill}%` }}
          />
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={<Flame className="h-5 w-5" />}
          value={stats?.currentStreak ?? 0}
          label={t('app.gamification.streakDays', { days: stats?.currentStreak ?? 0 })}
          accent="text-orange-500"
        />
        <StatTile
          icon={<Coins className="h-5 w-5" />}
          value={stats?.coins ?? 0}
          label={t('app.gamification.coins')}
          accent="text-amber-500"
        />
        <StatTile
          icon={<Utensils className="h-5 w-5" />}
          value={stats?.totalCooks ?? 0}
          label={t('app.gamification.totalCooks')}
          accent="text-emerald-500"
        />
      </div>

      {(stats?.longestStreak ?? 0) > 0 && (
        <div className="-mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          {t('app.gamification.longestStreak', { days: stats?.longestStreak ?? 0 })}
        </div>
      )}

      {/* Badges */}
      <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">
          {t('app.gamification.badgesTitle')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {ALL_BADGE_KEYS.map((key) => {
            const has = earned.has(key);
            return (
              <div
                key={key}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-colors ${
                  has
                    ? 'border-amber-400/40 bg-amber-400/10'
                    : 'border-black/5 bg-black/[0.02] opacity-60 dark:border-white/10 dark:bg-white/[0.02]'
                }`}
              >
                <div className="relative text-2xl">
                  {has ? (
                    badgeEmoji(key)
                  ) : (
                    <>
                      <span className="grayscale">{badgeEmoji(key)}</span>
                      <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-gray-400" />
                    </>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium leading-tight ${
                    has ? 'text-amber-700 dark:text-amber-300' : 'text-gray-400'
                  }`}
                >
                  {t(`app.gamification.badges.${key}`)}
                </span>
              </div>
            );
          })}
        </div>
        {earned.size === 0 && (
          <p className="mt-3 text-center text-xs text-gray-400">
            {t('app.gamification.badgesEmpty')}
          </p>
        )}
      </div>
    </div>
  );
}

function StatTile({
  icon,
  value,
  label,
  accent,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-black/5 bg-white p-3 text-center shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className={accent}>{icon}</div>
      <div className="text-lg font-black text-gray-900 dark:text-white">{value}</div>
      <div className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
