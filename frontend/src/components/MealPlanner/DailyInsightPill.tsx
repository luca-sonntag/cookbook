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
    <div className="w-full flex items-center justify-center pt-0.5 pb-1 animate-fade-in">
      <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[11px] sm:text-xs font-semibold shadow-[0_2px_6px_rgba(0,0,0,0.02)] border-none">
        <span className="flex items-center gap-1">
          <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          {mealsText}
        </span>

        {totalCalories > 0 && (
          <>
            <span className="text-emerald-400/40 dark:text-emerald-600/60">•</span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              {Math.round(totalCalories)} kcal
            </span>
          </>
        )}

        {totalTime > 0 && (
          <>
            <span className="text-emerald-400/40 dark:text-emerald-600/60">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {totalTime} min
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyInsightPill;
