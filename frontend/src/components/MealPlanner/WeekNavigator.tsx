import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { hapticLight } from '../../utils/haptics';
import type { WeekNavigatorProps } from './types';

function formatWeekRange(start: Date, end: Date, language: string): string {
  const locale = language === 'en' ? 'en-US' : 'de-DE';
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString(locale, { month: 'short' });
  const endMonth = end.toLocaleDateString(locale, { month: 'short' });

  if (startMonth === endMonth) {
    return locale === 'en-US'
      ? `${startMonth} ${startDay} – ${endDay}`
      : `${startDay}. – ${endDay}. ${startMonth}`;
  }

  return `${startDay}. ${startMonth} – ${endDay}. ${endMonth}`;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  weekStart,
  weekEnd,
  isCurrentWeek,
  onPrevWeek,
  onNextWeek,
  onToday,
}) => {
  const { t, language } = useI18n();

  const handlePrev = () => {
    hapticLight();
    onPrevWeek();
  };

  const handleNext = () => {
    hapticLight();
    onNextWeek();
  };

  const handleToday = () => {
    hapticLight();
    onToday();
  };

  return (
    <div className="flex items-center justify-between px-1.5 py-1">
      <button
        onClick={handlePrev}
        aria-label={t('mealPlanner.prevWeek')}
        className="w-11 h-11 flex items-center justify-center rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/60 active:scale-[0.92] transition-transform duration-150 cursor-pointer border-none"
      >
        <ChevronLeft className="w-5 h-5 stroke-[2.25]" />
      </button>

      <div className="flex items-center gap-2">
        <span className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
          {formatWeekRange(weekStart, weekEnd, language)}
        </span>
        {!isCurrentWeek && (
          <button
            onClick={handleToday}
            className="text-[11px] font-bold tracking-wide px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 active:scale-[0.94] transition-all duration-150 cursor-pointer border-none shadow-xs"
          >
            {t('mealPlanner.today')}
          </button>
        )}
      </div>

      <button
        onClick={handleNext}
        aria-label={t('mealPlanner.nextWeek')}
        className="w-11 h-11 flex items-center justify-center rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/60 active:scale-[0.92] transition-transform duration-150 cursor-pointer border-none"
      >
        <ChevronRight className="w-5 h-5 stroke-[2.25]" />
      </button>
    </div>
  );
};

export default WeekNavigator;
