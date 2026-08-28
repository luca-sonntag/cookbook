import React from 'react';
import { Clock, Flame, CheckCircle2 } from 'lucide-react';
import type { MealPlanCardProps } from './types';
import CachedImage from '../CachedImage';
import { MealPlanCardActions } from './MealPlanCardActions';
import { useI18n } from '../../context/I18nContext';

export const MealPlanCard: React.FC<MealPlanCardProps> = ({
  entry,
  onUpdateServings,
  onToggleCooked,
  onDeleteEntry,
  onMoveToTomorrow,
  onSelectRecipe,
  onOpenCookMode,
}) => {
  const { t } = useI18n();
  const recipe = entry.recipe;
  const calories = recipe?.calories;

  return (
    <div
      onClick={() => onSelectRecipe(entry.recipeId)}
      className={`group relative flex items-center gap-3 p-3 rounded-2xl md:rounded-3xl border-none transition-all duration-200 cursor-pointer select-none active:scale-[0.99] ${
        entry.isCooked
          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 shadow-2xs'
          : 'bg-white dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Recipe Thumbnail with 1px outline */}
      <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
        <CachedImage
          src={recipe?.imageUrl}
          alt={recipe?.title || 'Recipe'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {entry.isCooked && (
          <div className="absolute inset-0 bg-emerald-900/50 flex items-center justify-center backdrop-blur-[1px] animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
        )}
      </div>

      {/* Recipe Content */}
      <div className="flex-1 min-w-0 pr-0.5">
        <div className="flex items-center gap-1.5">
          <h4
            className={`text-xs sm:text-sm font-extrabold line-clamp-1 leading-snug transition-colors ${
              entry.isCooked
                ? 'text-gray-500 dark:text-gray-400 line-through decoration-gray-400/60'
                : 'text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
            }`}
          >
            {recipe?.title || 'Rezept'}
          </h4>
          {entry.isCooked && (
            <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              {t('mealPlanner.doneBadge')}
            </span>
          )}
        </div>

        {/* Badges: Time & Calories */}
        <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
          {recipe?.prepTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
              <span>{recipe.prepTime} min</span>
            </span>
          )}
          {calories && (
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500" />
              <span>{Math.round(calories)} kcal</span>
            </span>
          )}
        </div>

        {/* Action Bar */}
        <MealPlanCardActions
          entry={entry}
          onUpdateServings={onUpdateServings}
          onToggleCooked={onToggleCooked}
          onDeleteEntry={onDeleteEntry}
          onMoveToTomorrow={onMoveToTomorrow}
          onOpenCookMode={onOpenCookMode}
        />
      </div>
    </div>
  );
};

export default MealPlanCard;
