import type { Ingredient, Recipe, MealPlanEntry, Job } from '../../types';

/** Per-person nutrition totals (values are already per serving on a Recipe). */
export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const EMPTY_NUTRITION: NutritionTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

function num(v: number | null | undefined): number {
  return typeof v === 'number' && isFinite(v) ? v : 0;
}

/**
 * Flatten a recipe's grouped ingredients into a flat list, scaled from the
 * recipe's base servings to `targetServings`. Mirrors the scaleFactor logic in
 * `useRecipeScaling` (amount × targetServings / baseServings).
 */
export function scaleIngredientsForPlan(recipe: Recipe, targetServings: number): Ingredient[] {
  const base = recipe.servings && recipe.servings > 0 ? recipe.servings : 1;
  const factor = targetServings / base;
  const out: Ingredient[] = [];
  for (const group of recipe.ingredients || []) {
    for (const item of group.items || []) {
      out.push({ ...item, amount: (item.amount || 0) * factor });
    }
  }
  return out;
}

/** Per-person nutrition of a single recipe (nutritionalValues are per serving). */
export function recipeNutrition(recipe: Recipe): NutritionTotals {
  const n = recipe.nutritionalValues;
  if (!n) return { ...EMPTY_NUTRITION };
  return {
    calories: num(n.calories),
    protein: num(n.protein),
    carbs: num(n.carbs),
    fat: num(n.fat),
  };
}

function addNutrition(a: NutritionTotals, b: NutritionTotals): NutritionTotals {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

/** A plan entry resolved against the user's recipe library. */
export interface ResolvedEntry {
  entry: MealPlanEntry;
  job: Job | null;
  recipe: Recipe | null;
}

/** Resolve each plan entry's jobId to a Job from the loaded history. */
export function resolveEntries(entries: MealPlanEntry[], history: Job[]): ResolvedEntry[] {
  const byId = new Map(history.map(j => [j.id, j]));
  return [...entries]
    .sort((a, b) => a.position - b.position)
    .map(entry => {
      const job = entry.jobId ? byId.get(entry.jobId) ?? null : null;
      return { entry, job, recipe: job?.recipe ?? null };
    });
}

/** Weekly (all dishes) per-person nutrition total. */
export function weekNutrition(resolved: ResolvedEntry[]): NutritionTotals {
  return resolved.reduce<NutritionTotals>(
    (acc, r) => (r.recipe ? addNutrition(acc, recipeNutrition(r.recipe)) : acc),
    { ...EMPTY_NUTRITION },
  );
}

/**
 * Average per-person nutrition per day. When entries carry dayIndex we divide
 * by the number of distinct days; otherwise we fall back to the dish count so
 * the figure still reads as "per meal".
 */
export function perDayNutrition(resolved: ResolvedEntry[]): NutritionTotals {
  const withRecipe = resolved.filter(r => r.recipe);
  if (withRecipe.length === 0) return { ...EMPTY_NUTRITION };
  const week = weekNutrition(withRecipe);
  const days = new Set(
    withRecipe
      .map(r => r.entry.dayIndex)
      .filter((d): d is number => typeof d === 'number'),
  );
  const divisor = days.size > 0 ? days.size : withRecipe.length;
  return {
    calories: Math.round(week.calories / divisor),
    protein: Math.round(week.protein / divisor),
    carbs: Math.round(week.carbs / divisor),
    fat: Math.round(week.fat / divisor),
  };
}

/** Group resolved entries by dayIndex; entries without a day go under `null`. */
export function groupByDay(resolved: ResolvedEntry[]): { dayIndex: number | null; items: ResolvedEntry[] }[] {
  const map = new Map<number | null, ResolvedEntry[]>();
  for (const r of resolved) {
    const key = typeof r.entry.dayIndex === 'number' ? r.entry.dayIndex : null;
    const list = map.get(key) ?? [];
    list.push(r);
    map.set(key, list);
  }
  const keys = [...map.keys()].sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  });
  return keys.map(dayIndex => ({ dayIndex, items: map.get(dayIndex)! }));
}
