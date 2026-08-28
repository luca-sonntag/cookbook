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
  onMoveToTomorrow,
  onSelectRecipe,
  onOpenCookMode,
}) => {
  const { t } = useI18n();

  return (
    <div className="space-y-3 pt-1 pb-24">
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3">🍽️</span>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
            {t('mealPlanner.emptyDayTitle')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 max-w-xs">
            {t('mealPlanner.emptyDaySubtitle')}
          </p>
          <button
            onClick={() => onAddRecipeToSlot('dinner')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer border-none"
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
              {slotEntries.length > 0 ? (
                <>
                  {/* Slot Header when entries exist */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-none">
                        {slot.icon}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200">
                        {slotTitle}
                      </h3>
                    </div>

                    <button
                      onClick={() => onAddRecipeToSlot(slot.type)}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 active:scale-95 transition-all cursor-pointer border-none"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('mealPlanner.emptySlot', { meal: slotTitle })}</span>
                    </button>
                  </div>

                  {/* Slot Content */}
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
                /* Compact Asymmetric Quick-Add Row (38px height) */
                <button
                  onClick={() => onAddRecipeToSlot(slot.type)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-100/60 dark:bg-gray-800/50 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 border-none shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-[0.99] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-white/80 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {slot.icon}
                    </span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                      {slotTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('mealPlanner.emptySlot', { meal: slotTitle })}</span>
                  </div>
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
