import React from 'react';
import { Utensils, Clock, Flame, CheckCircle2 } from 'lucide-react';
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

  const cookedCount = entries.filter((e) => e.isCooked).length;
  const isAllCooked = cookedCount > 0 && cookedCount === entries.length;

  const mealsText =
    entries.length === 1
      ? t('mealPlanner.insightMealsSingle')
      : t('mealPlanner.insightMeals', { count: entries.length });

  return (
    <div className="w-full flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 pt-1 pb-0.5 text-[11px] font-bold animate-fade-in select-none">
      {/* Meals Count Pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 shadow-2xs">
        <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>{mealsText}</span>
      </div>

      {/* Calories Pill */}
      {totalCalories > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 shadow-2xs">
          <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500/20" />
          <span>{Math.round(totalCalories)} kcal</span>
        </div>
      )}

      {/* Prep Time Pill */}
      {totalTime > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{totalTime} min</span>
        </div>
      )}

      {/* Cooked Progress Pill */}
      {cookedCount > 0 && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl shadow-2xs transition-colors ${
            isAllCooked
              ? 'bg-emerald-600 text-white font-extrabold shadow-sm shadow-emerald-600/30'
              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isAllCooked
              ? t('mealPlanner.allCookedDone')
              : t('mealPlanner.insightCookedProgress', {
                  cooked: cookedCount,
                  total: entries.length,
                })}
          </span>
        </div>
      )}
    </div>
  );
};

export default DailyInsightPill;
