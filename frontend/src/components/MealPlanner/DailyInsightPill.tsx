import React from 'react';
import { Utensils, Clock, Flame } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import type { DailyInsightPillProps } from './types';
import { getTotalTime } from '../../hooks/useSavedCatalog';

export const DailyInsightPill: React.FC<DailyInsightPillProps> = ({ entries }) => {
  const { t } = useI18n();

  if (entries.length === 0) return null;

  // recipe.calories is already per portion/serving
  const totalCalories = entries.reduce((sum, e) => {
    const cal = e.recipe?.calories ? Number(e.recipe.calories) : 0;
    return sum + cal;
  }, 0);

  const totalTime = entries.reduce((sum, e) => {
    return sum + getTotalTime(e.recipe);
  }, 0);

  const mealsText =
    entries.length === 1
      ? t('mealPlanner.insightMealsSingle')
      : t('mealPlanner.insightMeals', { count: entries.length });

  return (
    <div className="w-full flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 pt-1 pb-0.5 text-xs font-semibold animate-fade-in select-none">
      {/* Meals Count Chip (Clean Flat) */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100/90 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-none">
        <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2] shrink-0" />
        <span>{mealsText}</span>
      </div>

      {/* Calories Chip (Clean Flat) */}
      {totalCalories > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100/90 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-none">
          <Flame className="w-3.5 h-3.5 text-amber-500 stroke-[2] shrink-0" />
          <span>{Math.round(totalCalories)} kcal</span>
        </div>
      )}

      {/* Total Time Chip (Clean Flat) */}
      {totalTime > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100/90 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-none">
          <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-400 stroke-[2] shrink-0" />
          <span>{totalTime} min</span>
        </div>
      )}
    </div>
  );
};

export default DailyInsightPill;
