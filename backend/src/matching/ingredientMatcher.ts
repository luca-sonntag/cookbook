import type { CanonicalIngredient } from '../data/canonicalIngredients.js';
import { canonicalizeBaseName, buildMappingKeys, toEnglishSingular } from './baseNameCanonical.js';
import {
  resolveIngredient,
  mapWithConcurrency,
  type ResolverInput,
} from './ingredientResolver.js';
import {
  lookupMapping,
  storeMapping,
  flushHitCounts,
  type EstimatedNutrients,
} from './mappingStore.js';
import type { Recipe, Ingredient, ParentIngredientInfo, GeminiUsageInfo } from '../types.js';
import { normalizeUnit, normalizeSearchTerm } from './matcherUtils.js';
import {
  calculateWeightGrams,
  isNutritionallyPlausible,
  applyCanonicalMatchToIngredient,
} from './nutritionCalculator.js';
import { catalogueAccess } from './ingredientIndex.js';

// Re-exported so existing callers, routes and unit tests keep importing from ingredientMatcher.
export {
  toEnglishSingular,
  canonicalizeBaseName,
  buildMappingKeys,
  normalizeUnit,
  normalizeSearchTerm,
  calculateWeightGrams,
  isNutritionallyPlausible,
  applyCanonicalMatchToIngredient,
  catalogueAccess,
};

/**
 * Ingredients of one recipe resolved in parallel. Kept small on purpose: the
 * resolver's process-wide semaphore is the real limit, and a large fan-out here
 * would just queue up behind it.
 */
const RECIPE_RESOLVE_CONCURRENCY = 3;

/**
 * Resolves one ingredient via the learned mapping store (cache) or Gemini tool resolver.
 *
 * Checks the learned mapping store first, and only pays for the tool-using
 * resolver on a genuine miss. Whatever the resolver decides is written back to
 * the store, so the next recipe containing this food anywhere, for any user,
 * takes the cheap path.
 */
export async function resolveAndRemember(
  input: ResolverInput
): Promise<{ match: CanonicalIngredient | null; estimate: EstimatedNutrients | null; usage?: GeminiUsageInfo }> {
  const keys = buildMappingKeys(input.baseName, input.name);
  const category = (input.category || '').toUpperCase().trim();

  if (keys.length > 0) {
    const known = await lookupMapping(keys, category);
    if (known) {
      const item = known.blsCode ? catalogueAccess.get(known.blsCode) : null;
      return { match: item, estimate: known.estimatedNutrients };
    }
  }

  const resolved = await resolveIngredient(input, catalogueAccess);
  if (!resolved || resolved.budgetExhausted) {
    // Nothing trustworthy came back. Storing this would freeze a non-answer for
    // every future recipe, so leave the key unresolved and try again next time.
    return { match: null, estimate: null, usage: resolved?.usage };
  }

  const item = resolved.blsCode ? catalogueAccess.get(resolved.blsCode) : null;

  if (keys.length > 0) {
    await storeMapping(keys, category, {
      blsCode: item ? item.bls_code || item.id : null,
      resolution: item ? 'matched' : 'no_match',
      estimatedNutrients: item ? null : resolved.estimatedNutrients,
      source: 'agent',
      confidence: resolved.confidence,
      model: resolved.model,
      reasoning: resolved.reasoning,
    });
  }

  return { match: item, estimate: item ? null : resolved.estimatedNutrients, usage: resolved.usage };
}

/**
 * Finds a matching canonical ingredient via the learned mapping store and Gemini resolver.
 * (Convenience method for standalone lookups / unit tests.)
 */
export async function findCanonicalIngredient(
  name: string,
  baseName?: string,
  category?: string,
  synonyms?: string[],
  searchQueries?: string[],
  parentIngredient?: ParentIngredientInfo,
  modifier?: string,
  brand?: string,
  _ingredientRef?: Ingredient
): Promise<CanonicalIngredient | null> {
  const { match } = await resolveAndRemember({
    name,
    baseName,
    brand,
    modifier,
    category,
    synonyms,
    searchQueries,
    parentIngredient,
  });
  return match;
}

/**
 * Matches and enriches a single ingredient.
 */
export async function matchAndEnrichIngredient(
  ingredient: Ingredient,
  groupCategory?: string
): Promise<{
  matched: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}> {
  const effectiveCategory = ingredient.category || groupCategory;
  const match = await findCanonicalIngredient(
    ingredient.name,
    ingredient.baseName,
    effectiveCategory,
    ingredient.synonyms,
    ingredient.searchQueries,
    ingredient.parentIngredient,
    ingredient.modifier,
    ingredient.brand,
    ingredient
  );

  return applyCanonicalMatchToIngredient(ingredient, match);
}

/**
 * Enriches all ingredients in a recipe with canonical nutritional data and
 * computes the recipe-level nutritional values per serving.
 *
 * All items are resolved via the learned mapping store & tool-using Gemini resolver.
 */
export async function enrichRecipeWithCanonicalIngredients(
  recipe: Recipe
): Promise<{ usage?: GeminiUsageInfo }> {
  if (!recipe || !recipe.ingredients) return {};

  const flatItems: Array<{ ing: Ingredient; groupName?: string; id: string }> = [];
  let itemCounter = 0;

  for (const group of recipe.ingredients) {
    if (!group.items) continue;
    for (const ing of group.items) {
      flatItems.push({ ing, groupName: group.name, id: `item_${itemCounter++}` });
    }
  }

  if (flatItems.length === 0) return {};

  const matchedCanonicalMap = new Map<string, CanonicalIngredient | null>();
  const estimateMap = new Map<string, EstimatedNutrients>();

  const unresolved: Array<{ id: string; input: ResolverInput }> = flatItems.map(({ ing, groupName, id }) => ({
    id,
    input: {
      name: ing.name,
      baseName: ing.baseName,
      brand: ing.brand,
      modifier: ing.modifier,
      category: ing.category || groupName,
      synonyms: ing.synonyms,
      searchQueries: ing.searchQueries,
      parentIngredient: ing.parentIngredient,
    },
  }));

  // Resolve all items in parallel via learned store & Gemini tool resolver
  let totalPromptTokens = 0;
  let totalCandidateTokens = 0;
  let totalTokens = 0;
  let totalCostUsd = 0;
  let totalDurationMs = 0;
  let modelUsed: string | undefined;
  let resolverCallCount = 0;

  if (unresolved.length > 0) {
    const results = await mapWithConcurrency(unresolved, RECIPE_RESOLVE_CONCURRENCY, item =>
      resolveAndRemember(item.input)
    );

    for (let i = 0; i < unresolved.length; i++) {
      const { id } = unresolved[i];
      const { match, estimate, usage } = results[i];
      matchedCanonicalMap.set(id, match);
      if (!match && estimate) estimateMap.set(id, estimate);
      if (usage) {
        resolverCallCount++;
        modelUsed = usage.model ?? modelUsed;
        totalDurationMs += usage.durationMs ?? 0;
        if (usage.tokenUsage) {
          totalPromptTokens += usage.tokenUsage.promptTokens;
          totalCandidateTokens += usage.tokenUsage.candidateTokens;
          totalTokens += usage.tokenUsage.totalTokens;
        }
        if (usage.costEstimate) {
          totalCostUsd += usage.costEstimate.totalCostUsd;
        }
      }
    }
  }

  // Counters only steer store curation, so this must never block the extraction.
  void flushHitCounts();

  // Apply nutritional calculation to all recipe ingredients
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let matchedCalories = 0;

  for (const { ing, id } of flatItems) {
    const match = matchedCanonicalMap.get(id) || null;
    const res = applyCanonicalMatchToIngredient(ing, match, estimateMap.get(id) ?? null);
    totalCalories += res.calories;
    totalProtein += res.protein;
    totalCarbs += res.carbs;
    totalFat += res.fat;
    if (res.matched) matchedCalories += res.calories;
  }

  const servings = recipe.servings > 0 ? recipe.servings : 1;

  recipe.nutritionalValues = {
    calories: Math.round(totalCalories / servings),
    protein: Math.round((totalProtein / servings) * 10) / 10,
    carbs: Math.round((totalCarbs / servings) * 10) / 10,
    fat: Math.round((totalFat / servings) * 10) / 10,
  };

  recipe.nutritionCoverage =
    totalCalories > 0 ? Math.round((matchedCalories / totalCalories) * 100) / 100 : 0;

  const resolverUsage: GeminiUsageInfo | undefined =
    resolverCallCount > 0
      ? {
          model: modelUsed,
          durationMs: totalDurationMs,
          tokenUsage: {
            promptTokens: totalPromptTokens,
            candidateTokens: totalCandidateTokens,
            totalTokens,
          },
          costEstimate: {
            inputCostUsd: 0,
            outputCostUsd: 0,
            totalCostUsd: parseFloat(totalCostUsd.toFixed(6)),
            totalCostFormatted: `$${totalCostUsd.toFixed(4)}`,
          },
        }
      : undefined;

  return { usage: resolverUsage };
}
