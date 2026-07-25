import { ChevronRight, Clock, Crown, Flame, Utensils } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface RecipeMetaStripProps {
  /** Combined prep + cook time, already formatted for display. */
  totalTimeLabel: string | null;
  servings: number;
  /** Per-serving calories, or null when the recipe has no nutrition data. */
  calories: number | null;
  /** Free users see a crown instead of the calorie value (premium gate). */
  isPremium: boolean;
  onOpenDetails: () => void;
}

/**
 * A single tappable row summarising the recipe's key figures (total time,
 * servings, calories). Replaces the three stacked meta cards that used to push
 * the ingredient list a full screen down; the detail values live in
 * `RecipeInfoSheet`, which this row opens.
 */
export default function RecipeMetaStrip({
  totalTimeLabel,
  servings,
  calories,
  isPremium,
  onOpenDetails,
}: RecipeMetaStripProps) {
  const { t } = useI18n();

  const chipClasses =
    'flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap';

  return (
    <button
      type="button"
      onClick={onOpenDetails}
      aria-label={t('recipe.metaDetails')}
      className="w-full flex items-center gap-3 min-h-[44px] py-2.5 px-3 -mx-1 rounded-xl bg-gradient-to-br from-emerald-500/[0.05] via-transparent to-indigo-500/[0.05] border border-black/5 dark:border-white/5 text-left cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] outline-none"
    >
      <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-none">
        {totalTimeLabel && (
          <span className={chipClasses}>
            <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            {totalTimeLabel}
          </span>
        )}

        <span className={chipClasses}>
          <Utensils className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          {t('recipe.servingsCount', { count: servings })}
        </span>

        {calories !== null && (
          <span className={chipClasses}>
            <Flame className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            {isPremium ? (
              `${calories} kcal`
            ) : (
              <>
                <span className="text-gray-400 dark:text-gray-500">kcal</span>
                <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
              </>
            )}
          </span>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
    </button>
  );
}
