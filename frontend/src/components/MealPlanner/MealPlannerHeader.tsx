import React from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { PageHeader } from '../PageHeader';
import type { MealPlannerHeaderProps } from './types';

function formatWeekRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startStr = start.toLocaleDateString('de-DE', options);
  const endStr = end.toLocaleDateString('de-DE', options);
  return `${startStr} – ${endStr}`;
}

export const MealPlannerHeader: React.FC<MealPlannerHeaderProps> = ({
  weekStart,
  weekEnd,
  isCurrentWeek,
  plannedTotalCount,
  isAddingToShopping,
  onPrevWeek,
  onNextWeek,
  onToday,
  onShopWeek,
}) => {
  const { t } = useI18n();

  const shopAction = plannedTotalCount > 0 ? (
    <button
      onClick={onShopWeek}
      disabled={isAddingToShopping}
      className="flex items-center justify-center gap-1.5 w-10 h-10 min-w-[40px] min-h-[40px] sm:w-auto sm:px-3 sm:py-2 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold active:scale-95 transition-all disabled:opacity-50 cursor-pointer border-none"
      title={t('mealPlanner.shopWeekDescription')}
      aria-label={t('mealPlanner.shopWeek')}
    >
      {isAddingToShopping ? (
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
      ) : (
        <ShoppingBag className="w-5 h-5" />
      )}
      <span className="hidden sm:inline">{t('mealPlanner.shopWeek')}</span>
    </button>
  ) : undefined;

  return (
    <div className="w-full flex flex-col gap-4">
      <PageHeader
        icon={<CalendarIcon className="w-6 h-6" />}
        title={t('mealPlanner.title')}
        subtitle={t('mealPlanner.subtitle')}
        action={shopAction}
      />

      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md p-1.5 rounded-2xl">
        <button
          onClick={onPrevWeek}
          aria-label={t('mealPlanner.prevWeek')}
          className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 active:scale-90 transition-all shadow-sm shadow-black/[0.03]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
            {formatWeekRange(weekStart, weekEnd)}
          </span>
          {!isCurrentWeek && (
            <button
              onClick={onToday}
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 active:scale-95 transition-all"
            >
              {t('mealPlanner.today')}
            </button>
          )}
        </div>

        <button
          onClick={onNextWeek}
          aria-label={t('mealPlanner.nextWeek')}
          className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 active:scale-90 transition-all shadow-sm shadow-black/[0.03]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
