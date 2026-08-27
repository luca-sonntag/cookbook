import React from 'react';
import { Clock, Flame, Users, Trash2, CheckCircle2, Play, Plus, Minus } from 'lucide-react';
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
      className={`group relative flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-gray-800/90 border border-black/[0.04] dark:border-white/[0.06] shadow-sm shadow-black/[0.03] hover:shadow-md transition-all cursor-pointer ${
        entry.isCooked ? 'opacity-70 dark:opacity-60 bg-gray-50/50 dark:bg-gray-800/40' : ''
      }`}
    >
      {/* Recipe Thumbnail */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700">
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
        <h4 className={`text-sm font-bold text-gray-900 dark:text-white truncate ${
          entry.isCooked ? 'line-through text-gray-500 dark:text-gray-400' : ''
        }`}>
          {recipe?.title || 'Rezept'}
        </h4>

        {/* Badges: Time & Calories */}
        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          {recipe?.prepTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {recipe.prepTime} min
            </span>
          )}
          {recipe?.calories && (
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500/80" />
              {Math.round(recipe.calories)} kcal
            </span>
          )}
        </div>

        {/* Actions bar: Servings Stepper & Quick Actions */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
          {/* Servings Stepper */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/80 px-2 py-0.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200"
          >
            <Users className="w-3 h-3 text-gray-400" />
            <button
              onClick={handleServingsDecrease}
              disabled={entry.servings <= 1}
              aria-label="Decrease servings"
              className="p-2 rounded hover:bg-white dark:hover:bg-gray-600 disabled:opacity-30 active:scale-90"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span className="min-w-3 text-center text-[11px] font-bold">{entry.servings}</span>
            <button
              onClick={handleServingsIncrease}
              aria-label="Increase servings"
              className="p-2 rounded hover:bg-white dark:hover:bg-gray-600 active:scale-90"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Toggle Cooked */}
            <button
              onClick={() => {
                hapticMedium();
                onToggleCooked(entry);
              }}
              title={entry.isCooked ? t('mealPlanner.markAsUncooked') : t('mealPlanner.markAsCooked')}
              className={`p-2.5 rounded-xl transition-all active:scale-90 ${
                entry.isCooked
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>

            {/* Cook Mode */}
            {onOpenCookMode && (
              <button
                onClick={() => onOpenCookMode(entry.recipeId)}
                title={t('mealPlanner.cookNow')}
                className="p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-90 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            )}

            {/* Delete Entry */}
            <button
              onClick={handleDelete}
              aria-label={t('mealPlanner.deleteConfirmBtn')}
              className="p-2.5 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-90 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
