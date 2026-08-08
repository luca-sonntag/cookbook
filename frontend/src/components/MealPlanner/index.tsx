import { useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Sparkles } from 'lucide-react';
import type { Job, Ingredient } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { useMealPlan } from '../../hooks/useMealPlan';
import PremiumModal from '../PremiumModal';
import PlannerSetupForm, { type PlannerSetupValues } from './PlannerSetupForm';
import PlanView from './PlanView';
import { plannerPlanId, buildPlannerRoute } from './plannerRoutes';
import { resolveEntries, scaleIngredientsForPlan } from './mealPlanUtils';

interface MealPlannerProps {
  history: Job[];
  historyLoaded?: boolean;
  /** Current `#/history/...` sub-path. */
  subPath: string | null;
  /** Navigate within the history tab (`null` = catalog home). */
  onNavigate: (subPath: string | null) => void;
  onAddIngredients?: (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => void;
  onNavigateToShoppingList?: () => void;
  onOpenRecipe?: (jobId: string) => void;
}

export default function MealPlanner({
  history,
  historyLoaded = true,
  subPath,
  onNavigate,
  onAddIngredients,
  onNavigateToShoppingList,
  onOpenRecipe,
}: MealPlannerProps) {
  const { t } = useI18n();
  const { isPremium } = useAuth();
  const dialog = useDialog();
  const { plans, generatePlan, swapEntry, deletePlan } = useMealPlan();

  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [swappingEntryId, setSwappingEntryId] = useState<string | null>(null);
  const [addedPlanId, setAddedPlanId] = useState<string | null>(null);

  const completedRecipes = useMemo(
    () => history.filter(j => j.status === 'completed' && j.recipe),
    [history],
  );

  const planId = plannerPlanId(subPath);
  const currentPlan = planId ? plans.find(p => p.id === planId) ?? null : null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleGenerate = async (values: PlannerSetupValues) => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
      return;
    }
    if (completedRecipes.length === 0) return;
    setGenerateError(null);
    setIsGenerating(true);
    const result = await generatePlan({
      goal: values.goal,
      servings: values.servings,
      numDishes: values.numDishes,
      includeJobIds: values.includeJobIds,
    });
    setIsGenerating(false);
    if (result.success && result.data) {
      onNavigate(buildPlannerRoute(result.data.id));
    } else {
      setGenerateError(result.error || t('planner.createError'));
    }
  };

  const handleSwap = async (entryId: string) => {
    if (!currentPlan) return;
    setSwappingEntryId(entryId);
    const result = await swapEntry(currentPlan.id, entryId);
    setSwappingEntryId(null);
    if (!result.success) {
      dialog.alert({ title: t('planner.title'), message: result.error || t('planner.swapError'), confirmLabel: 'OK', status: 'warning' });
    }
  };

  const handleDelete = async () => {
    if (!currentPlan) return;
    const ok = await dialog.confirm({
      title: t('planner.deleteConfirmTitle'),
      message: t('planner.deleteConfirmMessage'),
      confirmLabel: t('planner.deletePlan'),
      status: 'danger',
    });
    if (!ok) return;
    await deletePlan(currentPlan.id);
    onNavigate(buildPlannerRoute());
  };

  const handleAddAllToShoppingList = () => {
    if (!currentPlan || !onAddIngredients) return;
    const resolved = resolveEntries(currentPlan.entries || [], history);
    // Collapse duplicate recipes so each contributes once, at the plan's servings.
    const seen = new Set<string>();
    let added = 0;
    for (const { entry, recipe, job } of resolved) {
      if (!recipe || !job) continue;
      if (seen.has(job.id)) continue;
      seen.add(job.id);
      const targetServings = entry.servings || currentPlan.servings;
      const scaled = scaleIngredientsForPlan(recipe, targetServings);
      onAddIngredients(scaled, job.id, recipe.title);
      added++;
    }
    if (added > 0) {
      setAddedPlanId(currentPlan.id);
    }
  };

  // ── Detail view ──────────────────────────────────────────────────────────
  if (planId && currentPlan) {
    return (
      <>
        <PlanView
          plan={currentPlan}
          history={history}
          swappingEntryId={swappingEntryId}
          addedToShoppingList={addedPlanId === currentPlan.id}
          onBack={() => onNavigate(buildPlannerRoute())}
          onSwap={handleSwap}
          onDelete={handleDelete}
          onAddAllToShoppingList={onNavigateToShoppingList ? () => { handleAddAllToShoppingList(); onNavigateToShoppingList(); } : handleAddAllToShoppingList}
          onOpenRecipe={onOpenRecipe}
        />
        <PremiumModal isOpen={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen} />
      </>
    );
  }

  // A stale/unknown plan id → fall back to the planner home.
  // ── Home view (setup + saved plans) ────────────────────────────────────────
  const noRecipes = historyLoaded && completedRecipes.length === 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate(null)}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 hover:bg-black/[0.08] active:scale-90 transition-all cursor-pointer shrink-0"
          aria-label={t('planner.back')}
        >
          <ChevronRight className="w-4.5 h-4.5 rotate-180" />
        </button>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('planner.title')}</h1>
        </div>
      </div>

      {noRecipes ? (
        <div className="flex flex-col items-center gap-3 text-center py-14 px-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-white">{t('planner.noRecipesTitle')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{t('planner.noRecipesHint')}</p>
        </div>
      ) : (
        <PlannerSetupForm
          recipes={completedRecipes}
          isGenerating={isGenerating}
          error={generateError}
          onGenerate={handleGenerate}
        />
      )}

      {/* Saved plans */}
      {plans.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('planner.savedPlans')}</h3>
          <div className="flex flex-col gap-2">
            {plans.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => onNavigate(buildPlannerRoute(plan.id))}
                className="flex items-center gap-3 w-full p-3.5 rounded-2xl bg-white dark:bg-gray-900 shadow-[0_2px_6px_rgba(0,0,0,0.03)] text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.99] transition-all cursor-pointer"
              >
                <span className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </span>
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {plan.title?.trim() || t('planner.untitled')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {t('planner.planMeta', { dishes: (plan.entries || []).length, servings: plan.servings })}
                    {plan.goal ? ` · ${plan.goal}` : ''}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      <PremiumModal isOpen={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen} />
    </div>
  );
}
