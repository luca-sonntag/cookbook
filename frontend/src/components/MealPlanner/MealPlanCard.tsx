import React from 'react';
import { Clock, Flame, Users, Trash2, CheckCircle2, Play, Plus, Minus, CalendarClock } from 'lucide-react';
import type { MealPlanCardProps } from './types';
import CachedImage from '../CachedImage';
import { useDialog } from '../../context/DialogContext';
import { useI18n } from '../../context/I18nContext';
import { hapticLight, hapticMedium, hapticHeavy } from '../../utils/haptics';

export const MealPlanCard: React.FC<MealPlanCardProps> = ({
  entry,
  onUpdateServings,
  onToggleCooked,
  onDeleteEntry,
  onMoveToTomorrow,
  onSelectRecipe,
  onOpenCookMode,
}) => {
  const dialog = useDialog();
  const { t } = useI18n();
  const recipe = entry.recipe;

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
      onClick={() => onSelectRecipe(entry.recipeId)}
      className={`group relative flex items-center gap-3 p-3 rounded-2xl md:rounded-3xl border-none shadow-[0_2px_6px_rgba(0,0,0,0.03)] transition-all cursor-pointer ${
        entry.isCooked
          ? 'bg-emerald-50/50 dark:bg-emerald-950/25'
          : 'bg-white dark:bg-gray-900 hover:shadow-md'
      }`}
    >
      {/* Recipe Thumbnail */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
        <CachedImage
          src={recipe?.imageUrl}
          alt={recipe?.title || 'Recipe'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {entry.isCooked && (
          <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center backdrop-blur-[1px]">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Recipe Content */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5">
          <h4 className={`text-sm font-bold truncate ${
            entry.isCooked
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {recipe?.title || 'Rezept'}
          </h4>
          {entry.isCooked && (
            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              {t('mealPlanner.doneBadge')}
            </span>
          )}
        </div>

        {/* Badges: Time & Calories */}
        <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-gray-600 dark:text-gray-300">
          {recipe?.prepTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              {recipe.prepTime} min
            </span>
          )}
          {recipe?.calories && (
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              {Math.round(recipe.calories)} kcal
            </span>
          )}
        </div>

        {/* Actions bar: Servings Stepper & Quick Actions */}
        <div className="flex items-center justify-between mt-2 pt-0.5 gap-2">
          {/* Servings Stepper */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border-none"
          >
            <button
              onClick={handleServingsDecrease}
              disabled={entry.servings <= 1}
              aria-label="Decrease servings"
              className="w-7 h-7 rounded-xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-700 dark:text-gray-200 disabled:opacity-30 active:scale-90 cursor-pointer border-none"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1 px-1.5 min-w-[34px] justify-center">
              <Users className="w-3 h-3 text-gray-400" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{entry.servings}</span>
            </div>
            <button
              onClick={handleServingsIncrease}
              aria-label="Increase servings"
              className="w-7 h-7 rounded-xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-700 dark:text-gray-200 active:scale-90 cursor-pointer border-none"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Buttons with distinct tactile shapes */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Move to Tomorrow */}
            {onMoveToTomorrow && (
              <button
                onClick={() => {
                  hapticLight();
                  onMoveToTomorrow(entry);
                }}
                title={t('mealPlanner.moveToTomorrow')}
                aria-label={t('mealPlanner.moveToTomorrow')}
                className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-500 hover:text-indigo-600 active:scale-90 transition-all flex items-center justify-center cursor-pointer border-none"
              >
                <CalendarClock className="w-4 h-4" />
              </button>
            )}

            {/* Toggle Cooked */}
            <button
              onClick={() => {
                hapticMedium();
                onToggleCooked(entry);
              }}
              title={entry.isCooked ? t('mealPlanner.markAsUncooked') : t('mealPlanner.markAsCooked')}
              className={`w-9 h-9 rounded-2xl transition-all active:scale-90 flex items-center justify-center cursor-pointer border-none ${
                entry.isCooked
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-500 hover:text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>

            {/* Cook Mode */}
            {onOpenCookMode && (
              <button
                onClick={() => onOpenCookMode(entry.recipeId)}
                title={t('mealPlanner.cookNow')}
                className="w-9 h-9 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-90 transition-all flex items-center justify-center cursor-pointer border-none"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            )}

            {/* Delete Entry */}
            <button
              onClick={handleDelete}
              aria-label={t('mealPlanner.deleteConfirmBtn')}
              className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-600 active:scale-90 transition-all flex items-center justify-center cursor-pointer border-none"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
