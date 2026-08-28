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
  iconBg: string;
  hoverBg: string;
  iconColor: string;
}

const SLOTS: SlotTheme[] = [
  {
    type: 'breakfast',
    titleKey: 'mealPlanner.meals.breakfast',
    icon: <Coffee className="w-3.5 h-3.5" />,
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
    hoverBg: 'hover:bg-amber-500/5 dark:hover:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400 group-hover:text-amber-700',
  },
  {
    type: 'lunch',
    titleKey: 'mealPlanner.meals.lunch',
    icon: <Utensils className="w-3.5 h-3.5" />,
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    hoverBg: 'hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700',
  },
  {
    type: 'dinner',
    titleKey: 'mealPlanner.meals.dinner',
    icon: <Moon className="w-3.5 h-3.5" />,
    iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
    hoverBg: 'hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700',
  },
  {
    type: 'snack',
    titleKey: 'mealPlanner.meals.snack',
    icon: <Apple className="w-3.5 h-3.5" />,
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300',
    hoverBg: 'hover:bg-rose-500/5 dark:hover:bg-rose-500/10',
    iconColor: 'text-rose-600 dark:text-rose-400 group-hover:text-rose-700',
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
                    <span className={`p-1.5 rounded-xl ${slot.iconBg} flex items-center justify-center shadow-2xs`}>
                      {slot.icon}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100">
                        {slotTitle}
                      </h3>
                      {slotEntries.length > 1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
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
                    className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-90 transition-transform duration-150 cursor-pointer border-none shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.25]" />
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
              /* Inviting Quick-Add Slot Card */
              <button
                onClick={() => {
                  hapticLight();
                  onAddRecipeToSlot(slot.type);
                }}
                className={`w-full px-3.5 py-2.5 rounded-2xl bg-white/85 dark:bg-gray-900/90 ${slot.hoverBg} border-none shadow-2xs flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-200 active:scale-[0.98] transition-all duration-150 group cursor-pointer`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`p-1.5 rounded-xl ${slot.iconBg} ${slot.iconColor} transition-colors shadow-2xs`}>
                    {slot.icon}
                  </span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    {slotTitle}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-xl bg-gray-100/80 dark:bg-gray-800 shadow-2xs flex items-center justify-center text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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
