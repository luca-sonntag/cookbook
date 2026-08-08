import { useMemo } from 'react';
import { ArrowLeft, Shuffle, ShoppingCart, Trash2, Sparkles, Check, Clock } from 'lucide-react';
import type { MealPlan, Job } from '../../types';
import { useI18n } from '../../context/I18nContext';
import CachedImage from '../CachedImage';
import {
  resolveEntries,
  groupByDay,
  weekNutrition,
  perDayNutrition,
  type NutritionTotals,
} from './mealPlanUtils';

interface PlanViewProps {
  plan: MealPlan;
  history: Job[];
  swappingEntryId: string | null;
  addedToShoppingList: boolean;
  onBack: () => void;
  onSwap: (entryId: string) => void;
  onDelete: () => void;
  onAddAllToShoppingList: () => void;
  onOpenRecipe?: (jobId: string) => void;
}

function mealTypeLabel(t: (k: string) => string, type: string | null | undefined): string | null {
  switch (type) {
    case 'breakfast': return t('planner.mealBreakfast');
    case 'lunch': return t('planner.mealLunch');
    case 'dinner': return t('planner.mealDinner');
    case 'snack': return t('planner.mealSnack');
    default: return null;
  }
}

export default function PlanView({
  plan,
  history,
  swappingEntryId,
  addedToShoppingList,
  onBack,
  onSwap,
  onDelete,
  onAddAllToShoppingList,
  onOpenRecipe,
}: PlanViewProps) {
  const { t } = useI18n();

  const resolved = useMemo(() => resolveEntries(plan.entries || [], history), [plan.entries, history]);
  const days = useMemo(() => groupByDay(resolved), [resolved]);
  const week = useMemo(() => weekNutrition(resolved), [resolved]);
  const perDay = useMemo(() => perDayNutrition(resolved), [resolved]);

  const hasDayStructure = days.length > 1 || (days.length === 1 && days[0].dayIndex !== null);
  const title = plan.title?.trim() || t('planner.untitled');

  const NutritionRow = ({ label, values }: { label: string; values: NutritionTotals }) => (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="font-semibold text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex gap-3 tabular-nums text-gray-700 dark:text-gray-200">
        <span><span className="font-bold">{Math.round(values.calories)}</span> {t('recipe.nutritionCalories')}</span>
        <span><span className="font-bold">{Math.round(values.protein)}</span>g {t('recipe.nutritionProtein')}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 hover:bg-black/[0.08] active:scale-90 transition-all cursor-pointer shrink-0"
          aria-label={t('planner.back')}
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('planner.planMeta', { dishes: (plan.entries || []).length, servings: plan.servings })}
            {plan.goal ? ` · ${plan.goal}` : ''}
          </p>
        </div>
      </div>

      {/* Rationale */}
      {plan.rationale && (
        <div className="flex gap-2.5 p-3.5 rounded-2xl bg-emerald-500/[0.07] border border-emerald-600/10">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
              {t('planner.rationaleTitle')}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{plan.rationale}</p>
          </div>
        </div>
      )}

      {/* Nutrition summary */}
      {(week.calories > 0 || week.protein > 0) && (
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-[0_2px_6px_rgba(0,0,0,0.03)]">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{t('planner.nutritionTitle')}</p>
          <NutritionRow label={t('planner.nutritionPerDay')} values={perDay} />
          <NutritionRow label={t('planner.nutritionWeek')} values={week} />
        </div>
      )}

      {/* Shopping list button */}
      <button
        type="button"
        onClick={onAddAllToShoppingList}
        className={`flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-sm font-bold active:scale-[0.99] transition-all cursor-pointer ${
          addedToShoppingList
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
            : 'bg-white dark:bg-gray-900 shadow-[0_2px_6px_rgba(0,0,0,0.03)] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        {addedToShoppingList ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
        {addedToShoppingList ? t('planner.addedToShoppingList') : t('planner.addAllToShoppingList')}
      </button>

      {/* Dishes grouped by day */}
      <div className="flex flex-col gap-5">
        {days.map(({ dayIndex, items }) => (
          <div key={dayIndex ?? 'unassigned'} className="flex flex-col gap-2">
            {hasDayStructure && (
              <h3 className="text-sm font-bold text-gray-900 dark:text-white px-0.5">
                {dayIndex !== null ? t('planner.day', { n: dayIndex + 1 }) : t('planner.dishesHeading')}
              </h3>
            )}
            {items.map(({ entry, recipe }) => {
              const isSwapping = swappingEntryId === entry.id;
              const meal = mealTypeLabel(t, entry.mealType);
              const totalMinutes = (recipe?.prepTime || 0) + (recipe?.cookTime || 0);
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-gray-900 shadow-[0_2px_6px_rgba(0,0,0,0.03)]"
                >
                  <button
                    type="button"
                    onClick={() => recipe && entry.jobId && onOpenRecipe?.(entry.jobId)}
                    disabled={!recipe}
                    className="w-16 h-16 rounded-xl overflow-hidden shrink-0 disabled:cursor-default"
                  >
                    <CachedImage
                      src={recipe?.imageUrl || recipe?.imageUrls?.[0]}
                      emoji={recipe?.emoji}
                      alt={recipe?.title || ''}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    {meal && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                        {meal}
                      </span>
                    )}
                    {recipe ? (
                      <button
                        type="button"
                        onClick={() => entry.jobId && onOpenRecipe?.(entry.jobId)}
                        className="block text-left text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug cursor-pointer"
                      >
                        {recipe.title}
                      </button>
                    ) : (
                      <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 italic">
                        {t('planner.removedRecipe')}
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {totalMinutes > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {totalMinutes} min
                        </span>
                      )}
                      {entry.note && <span className="truncate italic">· {entry.note}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSwap(entry.id)}
                    disabled={isSwapping}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-500/10 active:scale-90 transition-all shrink-0 disabled:opacity-60 cursor-pointer"
                    aria-label={t('planner.swap')}
                  >
                    {isSwapping ? (
                      <span className="w-4 h-4 rounded-full border-2 border-emerald-500/40 border-t-emerald-500 animate-spin" />
                    ) : (
                      <Shuffle className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 active:scale-[0.99] transition-all cursor-pointer mt-1"
      >
        <Trash2 className="w-4 h-4" />
        {t('planner.deletePlan')}
      </button>
    </div>
  );
}
