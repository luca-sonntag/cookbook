import React from 'react';
import { Sun, Utensils, Moon, Cookie, Sparkles } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { hapticLight, hapticMedium } from '../../utils/haptics';
import type { MealType } from '../../types';

interface EmptyDayStateProps {
  onAddRecipeToSlot: (slotType: MealType) => void;
  onRandomPick?: () => void;
}

export const EmptyDayState: React.FC<EmptyDayStateProps> = ({
  onAddRecipeToSlot,
  onRandomPick,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-fade-in">
      {/* Decorative Icon Badge */}
      <div className="relative mb-3.5">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center text-3xl shadow-xs">
          🍽️
        </div>
      </div>

      <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-1">
        {t('mealPlanner.emptyDayTitle')}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-xs leading-relaxed">
        {t('mealPlanner.emptyDaySubtitle')}
      </p>

      {/* Quick Meal Action Chips */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('breakfast');
          }}
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-500/15 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none"
        >
          <Sun className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{t('mealPlanner.quickAddBreakfast')}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('lunch');
          }}
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none"
        >
          <Utensils className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{t('mealPlanner.quickAddLunch')}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('dinner');
          }}
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/15 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none"
        >
          <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{t('mealPlanner.quickAddDinner')}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('snack');
          }}
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 dark:bg-rose-500/15 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none"
        >
          <Cookie className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{t('mealPlanner.quickAddSnack')}</span>
        </button>
      </div>

      {/* Random Picker Button if supported */}
      {onRandomPick && (
        <button
          onClick={() => {
            hapticMedium();
            onRandomPick();
          }}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 text-xs font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('mealPlanner.quickAddRandom')}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyDayState;
