import React from 'react';
import { Coffee, Utensils, Moon, Apple, Sparkles, UtensilsCrossed } from 'lucide-react';
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
      {/* Minimalist Icon Box */}
      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-850 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-3 shadow-2xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        <UtensilsCrossed className="w-5 h-5 stroke-[1.75]" />
      </div>

      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-1">
        {t('mealPlanner.emptyDayTitle')}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 max-w-xs leading-relaxed">
        {t('mealPlanner.emptyDaySubtitle')}
      </p>

      {/* Clean Monochrome Action Buttons */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('breakfast');
          }}
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold active:scale-[0.97] transition-all duration-150 cursor-pointer border-none shadow-2xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
        >
          <Coffee className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          <span>{t('mealPlanner.quickAddBreakfast')}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('lunch');
          }}
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold active:scale-[0.97] transition-all duration-150 cursor-pointer border-none shadow-2xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
        >
          <Utensils className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          <span>{t('mealPlanner.quickAddLunch')}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('dinner');
          }}
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold active:scale-[0.97] transition-all duration-150 cursor-pointer border-none shadow-2xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
        >
          <Moon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          <span>{t('mealPlanner.quickAddDinner')}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('snack');
          }}
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold active:scale-[0.97] transition-all duration-150 cursor-pointer border-none shadow-2xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
        >
          <Apple className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
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
          className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold active:scale-[0.97] transition-all duration-150 cursor-pointer border-none shadow-2xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
        >
          <Sparkles className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span>{t('mealPlanner.quickAddRandom')}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyDayState;
