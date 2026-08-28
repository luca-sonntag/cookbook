import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import type { WeekNavigatorProps } from './types';

function formatWeekRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startStr = start.toLocaleDateString('de-DE', options);
  const endStr = end.toLocaleDateString('de-DE', options);
  return `${startStr} – ${endStr}`;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  weekStart,
  weekEnd,
  isCurrentWeek,
  onPrevWeek,
  onNextWeek,
  onToday,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between px-1 pt-1 pb-1">
      <button
        onClick={onPrevWeek}
        aria-label={t('mealPlanner.prevWeek')}
        className="w-10 h-10 flex items-center justify-center rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/60 active:scale-90 transition-all cursor-pointer border-none"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {formatWeekRange(weekStart, weekEnd)}
        </span>
        {!isCurrentWeek && (
          <button
            onClick={onToday}
            className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 active:scale-95 transition-all cursor-pointer border-none"
          >
            {t('mealPlanner.today')}
          </button>
        )}
      </div>

      <button
        onClick={onNextWeek}
        aria-label={t('mealPlanner.nextWeek')}
        className="w-10 h-10 flex items-center justify-center rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/60 active:scale-90 transition-all cursor-pointer border-none"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default WeekNavigator;
