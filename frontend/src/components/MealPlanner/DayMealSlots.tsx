import React from 'react';
import { Sun, Utensils, Moon, Cookie, Plus } from 'lucide-react';
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
  iconBg: string;
  cardBg: string;
  textColor: string;
}

const SLOTS: SlotTheme[] = [
  {
    type: 'breakfast',
    titleKey: 'mealPlanner.meals.breakfast',
    icon: <Sun className="w-4 h-4 text-amber-500" />,
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    cardBg: 'hover:bg-amber-500/5 dark:hover:bg-amber-500/10',
    textColor: 'text-amber-700 dark:text-amber-300',
  },
  {
    type: 'lunch',
    titleKey: 'mealPlanner.meals.lunch',
    icon: <Utensils className="w-4 h-4 text-emerald-500" />,
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    cardBg: 'hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10',
    textColor: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    type: 'dinner',
    titleKey: 'mealPlanner.meals.dinner',
    icon: <Moon className="w-4 h-4 text-indigo-500" />,
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    cardBg: 'hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10',
    textColor: 'text-indigo-700 dark:text-indigo-300',
  },
  {
    type: 'snack',
    titleKey: 'mealPlanner.meals.snack',
    icon: <Cookie className="w-4 h-4 text-rose-500" />,
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    cardBg: 'hover:bg-rose-500/5 dark:hover:bg-rose-500/10',
    textColor: 'text-rose-700 dark:text-rose-300',
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
    <div className="space-y-3.5 pt-1 pb-24">
      {SLOTS.map((slot) => {
        const slotEntries = entries.filter((e) => e.mealType === slot.type);
        const slotTitle = t(slot.titleKey);

        return (
          <div key={slot.type} className="space-y-2">
            {slotEntries.length > 0 ? (
              <>
                {/* Slot Header when entries exist */}
                <div className="flex items-center justify-between px-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-xl ${slot.iconBg} flex items-center justify-center shadow-2xs`}>
                      {slot.icon}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
                        {slotTitle}
                      </h3>
                      {slotEntries.length > 1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-gray-200/80 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
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
                    className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-emerald-600 active:scale-90 transition-transform duration-150 cursor-pointer border-none"
                  >
                    <Plus className="w-4 h-4 stroke-[2.25]" />
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
              /* Compact Tactile Quick-Add Slot Card */
              <button
                onClick={() => {
                  hapticLight();
                  onAddRecipeToSlot(slot.type);
                }}
                className={`w-full px-3.5 py-2.5 rounded-2xl bg-white/70 dark:bg-gray-800/40 ${slot.cardBg} border-none shadow-2xs flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300 active:scale-[0.98] transition-all duration-150 group cursor-pointer`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`p-1.5 rounded-xl bg-white dark:bg-gray-700 ${slot.textColor} transition-colors shadow-2xs`}>
                    {slot.icon}
                  </span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    {slotTitle}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-xl bg-white dark:bg-gray-700 shadow-2xs flex items-center justify-center text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
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
