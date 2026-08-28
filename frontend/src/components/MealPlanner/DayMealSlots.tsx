import React from 'react';
import { Sun, Utensils, Moon, Cookie, Plus } from 'lucide-react';
import type { DayMealSlotsProps } from './types';
import type { MealType } from '../../types';
import { MealPlanCard } from './MealPlanCard';
import { useI18n } from '../../context/I18nContext';

interface SlotConfig {
  type: MealType;
  titleKey: string;
  icon: React.ReactNode;
}

const SLOTS: SlotConfig[] = [
  {
    type: 'breakfast',
    titleKey: 'mealPlanner.meals.breakfast',
    icon: <Sun className="w-4 h-4 text-amber-500" />,
  },
  {
    type: 'lunch',
    titleKey: 'mealPlanner.meals.lunch',
    icon: <Utensils className="w-4 h-4 text-emerald-500" />,
  },
  {
    type: 'dinner',
    titleKey: 'mealPlanner.meals.dinner',
    icon: <Moon className="w-4 h-4 text-indigo-500" />,
  },
  {
    type: 'snack',
    titleKey: 'mealPlanner.meals.snack',
    icon: <Cookie className="w-4 h-4 text-rose-500" />,
  },
];

export const DayMealSlots: React.FC<DayMealSlotsProps> = ({
  entries,
  onAddRecipeToSlot,
  onUpdateServings,
  onToggleCooked,
  onDeleteEntry,
  onSelectRecipe,
  onOpenCookMode,
}) => {
  const { t } = useI18n();

  return (
    <div className="space-y-4 pt-2 pb-24">
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3">🍽️</span>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
            {t('mealPlanner.emptyDayTitle')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {t('mealPlanner.emptyDaySubtitle')}
          </p>
          <button
            onClick={() => onAddRecipeToSlot('dinner')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('mealPlanner.addFirstMeal')}
          </button>
        </div>
      ) : (
        SLOTS.map((slot) => {
          const slotEntries = entries.filter((e) => e.mealType === slot.type);
          const slotTitle = t(slot.titleKey);

          return (
            <div key={slot.type} className="space-y-2">
              {/* Slot Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-gray-100 dark:bg-gray-800">
                    {slot.icon}
                  </span>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {slotTitle}
                  </h3>
                </div>

                {slotEntries.length > 0 && (
                  <button
                    onClick={() => onAddRecipeToSlot(slot.type)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('mealPlanner.emptySlot', { meal: slotTitle })}</span>
                  </button>
                )}
              </div>

              {/* Slot Content */}
              {slotEntries.length > 0 ? (
                <div className="space-y-2">
                  {slotEntries.map((entry) => (
                    <MealPlanCard
                      key={entry.id}
                      entry={entry}
                      onUpdateServings={onUpdateServings}
                      onToggleCooked={onToggleCooked}
                      onDeleteEntry={onDeleteEntry}
                      onSelectRecipe={onSelectRecipe}
                      onOpenCookMode={onOpenCookMode}
                    />
                  ))}
                </div>
              ) : (
                /* Empty Slot Add Button */
                <button
                  onClick={() => onAddRecipeToSlot(slot.type)}
                  className="w-full py-3 px-4 rounded-2xl bg-gray-100/70 dark:bg-gray-800/60 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 border-none shadow-[0_2px_6px_rgba(0,0,0,0.02)] text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-2 text-xs font-semibold active:scale-[0.99] transition-all group cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  <span>{t('mealPlanner.emptySlot', { meal: slotTitle })}</span>
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
