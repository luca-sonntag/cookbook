import React from 'react';
import { Coffee, Utensils, Moon, Apple, Sparkles, ChefHat } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-fade-in select-none">
      {/* Warm Culinary Badge */}
      <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-amber-500/10 to-emerald-500/10 dark:from-emerald-500/20 dark:to-amber-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3.5 shadow-2xs">
        <ChefHat className="w-7 h-7 stroke-[1.8]" />
      </div>

      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-1">
        {t('mealPlanner.emptyDayTitle')}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 max-w-xs leading-relaxed">
        {t('mealPlanner.emptyDaySubtitle')}
      </p>

      {/* Culinary Toned Quick Action Chips */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('breakfast');
          }}
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-500/15 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 text-xs font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none shadow-2xs"
        >
          <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{t('mealPlanner.quickAddBreakfast')}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('lunch');
          }}
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none shadow-2xs"
        >
          <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{t('mealPlanner.quickAddLunch')}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('dinner');
          }}
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/15 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 text-xs font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none shadow-2xs"
        >
          <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{t('mealPlanner.quickAddDinner')}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('snack');
          }}
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 dark:bg-rose-500/15 dark:hover:bg-rose-500/20 text-rose-800 dark:text-rose-200 text-xs font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none shadow-2xs"
        >
          <Apple className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{t('mealPlanner.quickAddSnack')}</span>
        </button>
      </div>

      {/* Random Picker Button */}
      {onRandomPick && (
        <button
          onClick={() => {
            hapticMedium();
            onRandomPick();
          }}
          className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/15 to-emerald-500/15 hover:from-amber-500/20 hover:to-emerald-500/20 dark:from-amber-500/20 dark:to-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{t('mealPlanner.quickAddRandom')}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyDayState;
