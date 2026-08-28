import React from 'react';
import { Coffee, Utensils, Moon, Apple, Plus } from 'lucide-react';
import type { DayMealSlotsProps } from './types';
import type { MealType } from '../../types';
import { MealPlanCard } from './MealPlanCard';
import { EmptyDayState } from './EmptyDayState';
import { useI18n } from '../../context/I18nContext';
import { hapticLight } from '../../utils/haptics';

interface SlotTheme {
  type: MealType;
  titleKey: string;
  icon: React.ReactNode;
}

const SLOTS: SlotTheme[] = [
  {
    type: 'breakfast',
    titleKey: 'mealPlanner.meals.breakfast',
    icon: <Coffee className="w-3.5 h-3.5" />,
  },
  {
    type: 'lunch',
    titleKey: 'mealPlanner.meals.lunch',
    icon: <Utensils className="w-3.5 h-3.5" />,
  },
  {
    type: 'dinner',
    titleKey: 'mealPlanner.meals.dinner',
    icon: <Moon className="w-3.5 h-3.5" />,
  },
  {
    type: 'snack',
    titleKey: 'mealPlanner.meals.snack',
    icon: <Apple className="w-3.5 h-3.5" />,
  },
];

export const DayMealSlots: React.FC<DayMealSlotsProps> = ({
  entries,
  onAddRecipeToSlot,
  onUpdateServings,
  onToggleCooked,
  onDeleteEntry,
  onMoveToTomorrow,
  onSelectRecipe,
  onOpenCookMode,
}) => {
  const { t } = useI18n();

  if (entries.length === 0) {
    return <EmptyDayState onAddRecipeToSlot={onAddRecipeToSlot} />;
  }

  return (
    <div className="space-y-3 pt-1 pb-24">
      {SLOTS.map((slot) => {
        const slotEntries = entries.filter((e) => e.mealType === slot.type);
        const slotTitle = t(slot.titleKey);

        return (
          <div key={slot.type} className="space-y-1.5">
            {slotEntries.length > 0 ? (
              <>
                {/* Slot Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center">
                      {slot.icon}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200">
                        {slotTitle}
                      </h3>
                      {slotEntries.length > 1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          {slotEntries.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      hapticLight();
                      onAddRecipeToSlot(slot.type);
                    }}
                    aria-label={t('mealPlanner.emptySlot', { meal: slotTitle })}
                    className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:scale-90 transition-transform duration-150 cursor-pointer border-none"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                </div>

                {/* Slot Content Cards */}
                <div className="space-y-2">
                  {slotEntries.map((entry) => (
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
              </>
            ) : (
              /* Minimalist Quick-Add Slot Card */
              <button
                onClick={() => {
                  hapticLight();
                  onAddRecipeToSlot(slot.type);
                }}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/70 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/70 border-none shadow-2xs flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 active:scale-[0.98] transition-all duration-150 group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors">
                    {slot.icon}
                  </span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {slotTitle}
                  </span>
                </div>
                <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors">
                  <Plus className="w-3.5 h-3.5 stroke-[2]" />
                </div>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DayMealSlots;
