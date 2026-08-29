import React from 'react';
import { Plus } from 'lucide-react';
import type { DayMealSlotsProps } from './types';
import { MealPlanCard } from './MealPlanCard';
import { EmptyDayState } from './EmptyDayState';
import { useI18n } from '../../context/I18nContext';
import { hapticLight } from '../../utils/haptics';

export const DayMealSlots: React.FC<DayMealSlotsProps> = ({
  entries,
  onAddRecipe,
  onUpdateServings,
  onToggleCooked,
  onDeleteEntry,
  onMoveToTomorrow,
  onSelectRecipe,
  onOpenCookMode,
}) => {
  const { t } = useI18n();

  if (entries.length === 0) {
    return <EmptyDayState onAddRecipe={onAddRecipe} />;
  }

  return (
    <div className="space-y-3 pt-1 pb-24">
      {/* Planned Meals Cards */}
      <div className="space-y-2.5">
        {entries.map((entry) => (
          <MealPlanCard
            key={entry.id}
            entry={entry}
            onUpdateServings={onUpdateServings}
            onToggleCooked={onToggleCooked}
            onDeleteEntry={onDeleteEntry}
            onMoveToTomorrow={onMoveToTomorrow}
            onSelectRecipe={onSelectRecipe}
            onOpenCookMode={onOpenCookMode}
          />
        ))}
      </div>

      {/* Add another recipe button */}
      <button
        type="button"
        onClick={() => {
          hapticLight();
          onAddRecipe();
        }}
        className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-850 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-bold active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 border-none shadow-xs ring-1 ring-black/[0.03] dark:ring-white/[0.04] cursor-pointer min-h-[48px]"
      >
        <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
        <span>{t('mealPlanner.addAnotherRecipe')}</span>
      </button>
    </div>
  );
};

export default DayMealSlots;

