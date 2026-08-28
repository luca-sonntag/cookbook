import React from 'react';
import { Utensils, Clock, Flame } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import type { DailyInsightPillProps } from './types';

export const DailyInsightPill: React.FC<DailyInsightPillProps> = ({ entries }) => {
  const { t } = useI18n();

  if (entries.length === 0) return null;

  const totalCalories = entries.reduce((sum, e) => {
    const cal = e.recipe?.calories ? Number(e.recipe.calories) : 0;
    const baseServings = e.recipe?.servings ? Number(e.recipe.servings) : 2;
    const scale = (e.servings || baseServings) / baseServings;
    return sum + cal * scale;
  }, 0);

  const totalTime = entries.reduce((sum, e) => {
    return sum + (e.recipe?.prepTime ? Number(e.recipe.prepTime) : 0);
  }, 0);

  const mealsText =
    entries.length === 1
      ? t('mealPlanner.insightMealsSingle')
      : t('mealPlanner.insightMeals', { count: entries.length });

  return (
    <div className="w-full flex items-center justify-center gap-2.5 sm:gap-3.5 pt-1.5 pb-0.5 mt-0.5 text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 animate-fade-in">
      <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200">
        <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        {mealsText}
      </span>

      {totalCalories > 0 && (
        <>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            {Math.round(totalCalories)} kcal
          </span>
        </>
      )}

      {totalTime > 0 && (
        <>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {totalTime} min
          </span>
        </>
      )}
    </div>
  );
};

export default DailyInsightPill;
