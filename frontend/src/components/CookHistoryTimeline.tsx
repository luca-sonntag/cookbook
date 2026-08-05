import { UtensilsCrossed, Camera, Clock, Flame } from 'lucide-react';
import type { CookHistory } from '../hooks/useCookHistory';
import { useI18n } from '../context/I18nContext';
import { formatRelative } from '../utils/formatRelative';

interface CookHistoryTimelineProps {
  history: CookHistory | null;
}

/**
 * Timeline of past cooks for a recipe, newest first. Shows date, optional
 * dish photo, and badges for cooking-mode / timer usage.
 */
export default function CookHistoryTimeline({ history }: CookHistoryTimelineProps) {
  const { t, language } = useI18n();

  if (!history || history.count === 0) {
    return (
      <div className="rounded-3xl bg-white dark:bg-gray-900 p-5 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-500/10 text-gray-400 mb-2">
          <UtensilsCrossed className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('app.gamification.cookedTimelineTitle')}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t('app.gamification.cookedTimelineEmpty')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-gray-900 p-5">
      <h4 className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">
        {t('app.gamification.cookedTimelineTitle')}
        <span className="ml-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          ({history.count}×)
        </span>
      </h4>
      <ol className="relative border-l border-black/10 dark:border-white/10 ml-1.5 space-y-4">
        {history.items.map((item) => (
          <li key={item.id} className="ml-4">
            <span className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white dark:ring-gray-900" />
            <div className="flex items-start gap-3">
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt=""
                  className="h-12 w-12 flex-shrink-0 rounded-xl object-cover border border-black/10 dark:border-white/10"
                  loading="lazy"
                />
              ) : (
                <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-gray-500/10 flex items-center justify-center text-gray-400">
                  <Camera className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span>{formatRelative(item.cookedAt, language)}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {item.viaCookingMode && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                      <UtensilsCrossed className="h-3 w-3" />
                      {t('app.gamification.cookedViaMode')}
                    </span>
                  )}
                  {item.timerElapsed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5">
                      <Flame className="h-3 w-3" />
                      {t('app.gamification.cookedWithTimer')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
