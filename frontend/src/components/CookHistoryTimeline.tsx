import { useState } from 'react';
import { UtensilsCrossed, Camera, Clock, X } from 'lucide-react';
import type { CookHistory } from '../hooks/useCookHistory';
import { useI18n } from '../context/I18nContext';
import { formatRelative } from '../utils/formatRelative';

interface CookHistoryTimelineProps {
  history: CookHistory | null;
}

/**
 * Timeline of past cooks for a recipe, newest first. Shows clean event cards
 * with dish photos, XP rewards, and exact timestamps.
 */
export default function CookHistoryTimeline({ history }: CookHistoryTimelineProps) {
  const { t, language } = useI18n();
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  if (!history || history.count === 0) {
    return (
      <div className="rounded-3xl bg-white dark:bg-gray-900 p-5 text-center border border-black/5 dark:border-white/5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
          <UtensilsCrossed className="h-6 w-6" />
        </div>
        <p className="text-base font-extrabold text-gray-900 dark:text-white">
          {t('app.gamification.cookedTimelineTitle')}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          {t('app.gamification.cookedTimelineEmpty')}
        </p>
      </div>
    );
  }

  // Calculate total XP accumulated for this recipe
  const totalXp = history.items.reduce((sum, item) => sum + (item.xpAwarded ?? 0), 0);

  const formatExactDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString(language, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-gray-900 p-5 border border-black/5 dark:border-white/5 shadow-2xs">
      {/* Header section with title and total stats */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-black/5 dark:border-white/5">
        <div>
          <h4 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>{t('app.gamification.cookedTimelineTitle')}</span>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-black rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {history.count}×
            </span>
          </h4>
        </div>
        {totalXp > 0 && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-extrabold border border-amber-500/25 whitespace-nowrap flex-shrink-0">
            <span>{t('app.gamification.cookedTotalXp', { xp: totalXp })}</span>
          </div>
        )}
      </div>

      {/* History cards timeline */}
      <div className="space-y-3.5">
        {history.items.map((item, index) => {
          const attemptNum = history.count - index;
          const exactTime = formatExactDate(item.cookedAt);

          return (
            <div
              key={item.id}
              className="relative rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-black/5 dark:border-white/10 p-3.5 transition-all hover:border-emerald-500/30"
            >
              {/* Card top bar */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {t('app.gamification.cookedAttempt', { count: attemptNum })}
                </span>
                {item.xpAwarded && item.xpAwarded > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 whitespace-nowrap">
                    +{item.xpAwarded} XP
                  </span>
                ) : null}
              </div>

              {/* Card body: photo + details */}
              <div className="flex items-start gap-3">
                {/* Photo thumbnail */}
                {item.photoUrl ? (
                  <div className="relative group flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoUrl(item.photoUrl)}
                      className="block overflow-hidden rounded-xl border border-black/10 dark:border-white/10 shadow-xs focus:outline-none"
                    >
                      <img
                        src={item.photoUrl}
                        alt=""
                        className="h-14 w-14 object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </button>
                  </div>
                ) : (
                  <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-gray-200/60 dark:bg-gray-700/50 flex flex-col items-center justify-center text-gray-400 border border-black/5 dark:border-white/5">
                    <Camera className="h-5 w-5" />
                    <span className="text-[9px] font-medium mt-0.5 text-gray-400">
                      {t('app.gamification.cookedNoPhoto')}
                    </span>
                  </div>
                )}

                {/* Info block */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-xs font-bold text-gray-900 dark:text-gray-100">
                    <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                      {formatRelative(item.cookedAt, language)}
                    </span>
                    {exactTime && (
                      <span className="text-[11px] font-normal text-gray-400 dark:text-gray-500">
                        ({exactTime})
                      </span>
                    )}
                  </div>

                  {item.viaCookingMode && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 border border-teal-500/20">
                        <UtensilsCrossed className="h-3 w-3 text-teal-500" />
                        {t('app.gamification.cookedViaMode')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div
            className="relative max-w-lg w-full max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white bg-black/40 rounded-full hover:bg-black/60 transition-colors focus:outline-none"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewPhotoUrl}
              alt=""
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
