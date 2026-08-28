import React from 'react';
import { Users, Trash2, CheckCircle2, Play, Plus, Minus, CalendarClock } from 'lucide-react';
import type { MealPlanEntry } from '../../types';
import { useDialog } from '../../context/DialogContext';
import { useI18n } from '../../context/I18nContext';
import { hapticLight, hapticMedium, hapticHeavy } from '../../utils/haptics';

export interface MealPlanCardActionsProps {
  entry: MealPlanEntry;
  onUpdateServings: (id: string, servings: number) => void;
  onToggleCooked: (entry: MealPlanEntry) => void;
  onDeleteEntry: (id: string) => void;
  onMoveToTomorrow?: (entry: MealPlanEntry) => void;
  onOpenCookMode?: (recipeId: string) => void;
}

export const MealPlanCardActions: React.FC<MealPlanCardActionsProps> = ({
  entry,
  onUpdateServings,
  onToggleCooked,
  onDeleteEntry,
  onMoveToTomorrow,
  onOpenCookMode,
}) => {
  const dialog = useDialog();
  const { t } = useI18n();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await dialog.confirm({
      title: t('mealPlanner.deleteConfirmTitle'),
      message: t('mealPlanner.deleteConfirmMessage'),
      confirmLabel: t('mealPlanner.deleteConfirmBtn'),
      cancelLabel: t('mealPlanner.cancelBtn'),
      status: 'danger',
    });
    if (confirmed) {
      hapticHeavy();
      onDeleteEntry(entry.id);
    }
  };

  const handleServingsDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (entry.servings > 1) {
      hapticLight();
      onUpdateServings(entry.id, entry.servings - 1);
    }
  };

  const handleServingsIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticLight();
    onUpdateServings(entry.id, entry.servings + 1);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center justify-between mt-2 pt-0.5 gap-2 select-none"
    >
      {/* Servings Stepper */}
      <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-850 p-0.5 rounded-xl border-none shadow-2xs">
        <button
          onClick={handleServingsDecrease}
          disabled={entry.servings <= 1}
          aria-label={t('mealPlanner.changeServings')}
          className="w-7 h-7 rounded-lg bg-white dark:bg-gray-750 shadow-xs flex items-center justify-center text-gray-700 dark:text-gray-200 disabled:opacity-30 active:scale-[0.88] transition-transform duration-150 cursor-pointer border-none"
        >
          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
        <div className="flex items-center gap-1 px-1.5 min-w-[32px] justify-center text-gray-800 dark:text-gray-200">
          <Users className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          <span className="text-xs font-black">{entry.servings}</span>
        </div>
        <button
          onClick={handleServingsIncrease}
          aria-label={t('mealPlanner.changeServings')}
          className="w-7 h-7 rounded-lg bg-white dark:bg-gray-750 shadow-xs flex items-center justify-center text-gray-700 dark:text-gray-200 active:scale-[0.88] transition-transform duration-150 cursor-pointer border-none"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      {/* Action Cluster */}
      <div className="flex items-center gap-1">
        {/* Cook Mode (Play) */}
        {onOpenCookMode && (
          <button
            onClick={() => {
              hapticMedium();
              onOpenCookMode(entry.recipeId);
            }}
            title={t('mealPlanner.cookNow')}
            aria-label={t('mealPlanner.cookNow')}
            className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 active:scale-[0.90] transition-all duration-150 flex items-center justify-center cursor-pointer border-none shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </button>
        )}

        {/* Toggle Cooked */}
        <button
          onClick={() => {
            hapticMedium();
            onToggleCooked(entry);
          }}
          title={entry.isCooked ? t('mealPlanner.markAsUncooked') : t('mealPlanner.markAsCooked')}
          aria-label={entry.isCooked ? t('mealPlanner.markAsUncooked') : t('mealPlanner.markAsCooked')}
          className={`w-8 h-8 rounded-xl transition-all duration-150 active:scale-[0.90] flex items-center justify-center cursor-pointer border-none shadow-2xs ${
            entry.isCooked
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-gray-750'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.25]" />
        </button>

        {/* Move to Tomorrow */}
        {onMoveToTomorrow && (
          <button
            onClick={() => {
              hapticLight();
              onMoveToTomorrow(entry);
            }}
            title={t('mealPlanner.moveToTomorrow')}
            aria-label={t('mealPlanner.moveToTomorrow')}
            className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 dark:hover:bg-gray-750 active:scale-[0.90] transition-all duration-150 flex items-center justify-center cursor-pointer border-none shadow-2xs"
          >
            <CalendarClock className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Delete Entry */}
        <button
          onClick={handleDelete}
          title={t('mealPlanner.deleteAction')}
          aria-label={t('mealPlanner.deleteConfirmBtn')}
          className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 dark:hover:bg-gray-750 active:scale-[0.90] transition-all duration-150 flex items-center justify-center cursor-pointer border-none shadow-2xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default MealPlanCardActions;

