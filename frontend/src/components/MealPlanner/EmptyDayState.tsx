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
      {/* Minimalist Flat Icon Box */}
      <div className="w-13 h-13 rounded-2xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3.5 border-none shadow-2xs">
        <UtensilsCrossed className="w-6 h-6 stroke-[2]" />
      </div>

      <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white mb-1">
        {t('mealPlanner.emptyDayTitle')}
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs leading-relaxed">
        {t('mealPlanner.emptyDaySubtitle')}
      </p>

      {/* Generous Touch-Optimized Action Buttons with pure emerald icon outlines */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-2.5 sm:gap-3">
        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('breakfast');
          }}
          className="flex items-center gap-2.5 px-3.5 py-3.5 rounded-2xl bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] min-h-[48px]"
        >
          <Coffee className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.25] shrink-0" />
          <span>{t('mealPlanner.quickAddBreakfast')}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('lunch');
          }}
          className="flex items-center gap-2.5 px-3.5 py-3.5 rounded-2xl bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] min-h-[48px]"
        >
          <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.25] shrink-0" />
          <span>{t('mealPlanner.quickAddLunch')}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('dinner');
          }}
          className="flex items-center gap-2.5 px-3.5 py-3.5 rounded-2xl bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] min-h-[48px]"
        >
          <Moon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.25] shrink-0" />
          <span>{t('mealPlanner.quickAddDinner')}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onAddRecipeToSlot('snack');
          }}
          className="flex items-center gap-2.5 px-3.5 py-3.5 rounded-2xl bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs sm:text-sm font-bold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] min-h-[48px]"
        >
          <Apple className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.25] shrink-0" />
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
          className="mt-4 inline-flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold active:scale-[0.96] transition-all duration-150 cursor-pointer border-none shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] min-h-[42px]"
        >
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2]" />
          <span>{t('mealPlanner.quickAddRandom')}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyDayState;
