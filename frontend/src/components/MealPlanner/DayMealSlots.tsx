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

      {/* Add another recipe text button */}
      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onAddRecipe();
          }}
          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/8 active:scale-95 transition-all cursor-pointer border-none bg-transparent select-none"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('mealPlanner.addAnotherRecipe')}</span>
        </button>
      </div>
    </div>
  );
};

export default DayMealSlots;

