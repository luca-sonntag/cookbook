import { useState, useMemo } from 'react';
import { UtensilsCrossed, Clock, Timer } from 'lucide-react';
import type { CookHistory } from '../hooks/useCookHistory';
import { useI18n } from '../context/I18nContext';
import { formatRelative } from '../utils/formatRelative';
import { hapticLight } from '../utils/haptics';
import FullscreenImageModal from './FullscreenImageModal';

interface CookHistoryTimelineProps {
  history: CookHistory | null;
}

/**
 * Clean, flat list of past cooks for a recipe, newest first.
 * Shows dish photos, attempt number, exact timestamp, XP earned, and cooking mode info.
 */
export default function CookHistoryTimeline({ history }: CookHistoryTimelineProps) {
  const { t, language } = useI18n();
  const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number | null>(null);

  // Collect all photos from history so user can swipe through them in fullscreen
  const historyPhotos = useMemo(() => {
    if (!history) return [];
    return history.items
      .map((item) => item.photoUrl)
      .filter((url): url is string => Boolean(url));
  }, [history]);

  if (!history || history.count === 0) {
    return (
      <div className="rounded-3xl bg-white dark:bg-gray-900 p-6 text-center border-none shadow-[0_2px_6px_rgba(0,0,0,0.03)] space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-1">
          <UtensilsCrossed className="h-6 w-6 stroke-[1.75]" />
        </div>
        <p className="text-base font-extrabold text-gray-900 dark:text-white">
          {t('app.gamification.cookedTimelineTitle')}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          {t('app.gamification.cookedTimelineEmpty')}
        </p>
      </div>
    );
  }

  const formatExactDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString(language, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-gray-900 p-4 sm:p-5 border-none shadow-[0_2px_6px_rgba(0,0,0,0.03)] space-y-3">
      {/* Clean section header */}
      <div className="flex items-center gap-2 pb-0.5">
        <h4 className="text-base font-extrabold text-gray-900 dark:text-white">
          {t('app.gamification.cookedTimelineTitle')}
        </h4>
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
          {history.count}×
        </span>
      </div>

      {/* History cards timeline */}
      <div className="space-y-2.5">
        {history.items.map((item, index) => {
          const attemptNum = history.count - index;
          const exactTime = formatExactDate(item.cookedAt);
          const photoIndex = item.photoUrl ? historyPhotos.indexOf(item.photoUrl) : -1;

          return (
            <div
              key={item.id}
              className="rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 p-3 sm:p-3.5 flex items-center gap-3.5 border-none shadow-xs transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/70"
            >
              {/* Photo thumbnail */}
              {item.photoUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setFullscreenPhotoIndex(photoIndex !== -1 ? photoIndex : 0);
                  }}
                  className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 overflow-hidden rounded-2xl bg-gray-200 dark:bg-gray-700 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] group cursor-pointer border-none p-0 active:scale-95 transition-transform"
                >
                  <img
                    src={item.photoUrl}
                    alt=""
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ) : (
                <div className="w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                  <UtensilsCrossed className="w-6 h-6 stroke-[1.75]" />
                  <span className="text-[10px] font-semibold mt-1 text-gray-400 dark:text-gray-500">
                    {t('app.gamification.cookedNoPhoto')}
                  </span>
                </div>
              )}

              {/* Info block */}
              <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                {/* Title & XP Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {t('app.gamification.cookedAttempt', { count: attemptNum })}
                  </span>
                  {item.xpAwarded && item.xpAwarded > 0 ? (
                    <span className="inline-flex items-center text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 px-2 py-0.5 rounded-full shrink-0">
                      +{item.xpAwarded} XP
                    </span>
                  ) : null}
                </div>

                {/* Timestamp Row */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {formatRelative(item.cookedAt, language)}
                  </span>
                  {exactTime && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      · {exactTime}
                    </span>
                  )}
                </div>

                {/* Badges / Chips Row */}
                {(item.viaCookingMode || item.timerElapsed) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {item.viaCookingMode && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold px-2 py-0.5">
                        <UtensilsCrossed className="w-3 h-3" />
                        {t('app.gamification.cookedViaMode')}
                      </span>
                    )}
                    {item.timerElapsed && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[11px] font-bold px-2 py-0.5">
                        <Timer className="w-3 h-3" />
                        {t('app.gamification.cookedWithTimer')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Photo Lightbox Modal using shared FullscreenImageModal component */}
      <FullscreenImageModal
        images={historyPhotos}
        initialIndex={fullscreenPhotoIndex}
        onClose={() => setFullscreenPhotoIndex(null)}
      />
    </div>
  );
}
