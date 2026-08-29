import React from 'react';
import { Trash2, CheckCircle2, Play, CalendarClock } from 'lucide-react';
import type { MealPlanEntry } from '../../types';
import { useDialog } from '../../context/DialogContext';
import { useI18n } from '../../context/I18nContext';
import { hapticLight, hapticMedium, hapticHeavy } from '../../utils/haptics';
import ServingsStepper from '../ServingsStepper';

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

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center justify-between mt-2 pt-0.5 gap-1.5 select-none"
    >
      {/* Reusable Modern Servings Stepper */}
      <ServingsStepper
        servings={entry.servings}
        onDecrease={() => onUpdateServings(entry.id, entry.servings - 1)}
        onIncrease={() => onUpdateServings(entry.id, entry.servings + 1)}
        size="md"
        showIcon={true}
        ariaLabel={t('mealPlanner.changeServings')}
      />

      {/* Action Buttons Cluster */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Cook Mode (Play) */}
        {onOpenCookMode && (
          <button
            onClick={() => {
              hapticMedium();
              onOpenCookMode(entry.recipeId);
            }}
            title={t('mealPlanner.cookNow')}
            aria-label={t('mealPlanner.cookNow')}
            className="w-8.5 h-8.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-600/30 active:scale-[0.90] transition-all duration-150 flex items-center justify-center cursor-pointer border-none"
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
          className={`w-8.5 h-8.5 rounded-full transition-all duration-150 active:scale-[0.90] flex items-center justify-center cursor-pointer border-none ${
            entry.isCooked
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'bg-gray-100/90 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-gray-750'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.25]" />
        </button>

        {/* Move to Tomorrow (Shown dynamically when container has >=215px) */}
        {onMoveToTomorrow && (
          <button
            onClick={() => {
              hapticLight();
              onMoveToTomorrow(entry);
            }}
            title={t('mealPlanner.moveToTomorrow')}
            aria-label={t('mealPlanner.moveToTomorrow')}
            className="hidden @[215px]:flex w-8.5 h-8.5 rounded-full bg-gray-100/90 dark:bg-gray-800/80 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:scale-[0.90] transition-all duration-150 items-center justify-center cursor-pointer border-none"
          >
            <CalendarClock className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Delete Entry */}
        <button
          onClick={handleDelete}
          title={t('mealPlanner.deleteAction')}
          aria-label={t('mealPlanner.deleteConfirmBtn')}
          className="w-8.5 h-8.5 rounded-full bg-gray-100/90 dark:bg-gray-800/80 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 active:scale-[0.90] transition-all duration-150 flex items-center justify-center cursor-pointer border-none"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default MealPlanCardActions;
