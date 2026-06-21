import { useMemo } from 'react';
import type { Recipe, NutritionalEstimates } from '../types';

export function useRecipeNutrition(recipe: Recipe) {
  return useMemo(() => {
    // 1. Check if recipe has original/extracted nutritional estimates
    const original = recipe.nutritionalEstimates;
    const hasOriginal = !!(
      original &&
      ((original.calories !== undefined && original.calories !== null && original.calories !== 0) ||
        (original.protein !== undefined && original.protein !== null && original.protein !== '') ||
        (original.carbs !== undefined && original.carbs !== null && original.carbs !== '') ||
        (original.fat !== undefined && original.fat !== null && original.fat !== ''))
    );

    if (hasOriginal) {
      return {
        nutritionalEstimates: original,
        isAiEstimated: false,
        hasNutritionInfo: true,
      };
    }

    // 2. Otherwise, check if we can calculate from ingredients
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let hasIngredientEstimates = false;

    if (recipe.ingredients) {
      for (const group of recipe.ingredients) {
        for (const ing of group.items) {
          if (
            (ing.calories !== undefined && ing.calories !== null && ing.calories > 0) ||
            (ing.protein !== undefined && ing.protein !== null && ing.protein > 0) ||
            (ing.carbs !== undefined && ing.carbs !== null && ing.carbs > 0) ||
            (ing.fat !== undefined && ing.fat !== null && ing.fat > 0)
          ) {
            hasIngredientEstimates = true;
            totalCalories += ing.calories || 0;
            totalProtein += ing.protein || 0;
            totalCarbs += ing.carbs || 0;
            totalFat += ing.fat || 0;
          }
        }
      }
    }

    if (hasIngredientEstimates) {
      // Create NutritionalEstimates formatted values (e.g. "25g")
      // so it maps perfectly to standard display format and existing formatNutritionValue function
      const calculated: NutritionalEstimates = {
        calories: totalCalories > 0 ? Math.round(totalCalories) : null,
        protein: totalProtein > 0 ? `${Math.round(totalProtein * 10) / 10}g` : null,
        carbs: totalCarbs > 0 ? `${Math.round(totalCarbs * 10) / 10}g` : null,
        fat: totalFat > 0 ? `${Math.round(totalFat * 10) / 10}g` : null,
      };

      const hasNutritionInfo =
        calculated.calories !== null ||
        calculated.protein !== null ||
        calculated.carbs !== null ||
        calculated.fat !== null;

      return {
        nutritionalEstimates: calculated,
        isAiEstimated: true,
        hasNutritionInfo,
      };
    }

    // 3. Fallback: no nutrition information
    return {
      nutritionalEstimates: null,
      isAiEstimated: false,
      hasNutritionInfo: false,
    };
  }, [recipe]);
}
