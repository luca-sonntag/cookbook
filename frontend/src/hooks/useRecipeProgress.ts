import { useState, useEffect } from 'react';
import type { Recipe } from '../types';

export function useRecipeProgress(recipe: Recipe) {
  const recipeId = recipe.id || recipe.title;
  const ingredientsKey = `recipe_ingredients_${recipeId}`;
  const stepsKey = `recipe_steps_${recipeId}`;

  // Pre-check common pantry staples (salt, water, oil, ...) that the user likely already has.
  // The id formula MUST match RecipeIngredients.tsx (`${name}-${originalIdx}-${idx}`), where
  // originalIdx is the group's index in the original recipe.ingredients array.
  const buildStapleDefaults = (): Record<string, boolean> => {
    const defaults: Record<string, boolean> = {};
    recipe.ingredients?.forEach((group, groupIdx) => {
      group.items?.forEach((ing, idx) => {
        if (ing.isStaple) {
          defaults[`${ing.name}-${groupIdx}-${idx}`] = true;
        }
      });
    });
    return defaults;
  };

  const loadCheckedIngredients = (): Record<string, boolean> => {
    let saved: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem(ingredientsKey);
      if (raw) saved = JSON.parse(raw);
    } catch {
      saved = {};
    }
    // Staples start checked, but explicit user choices (incl. unchecking a staple) win.
    return { ...buildStapleDefaults(), ...saved };
  };

  // Initial load
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>(loadCheckedIngredients);

  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(stepsKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync state when recipe changes
  useEffect(() => {
    setCheckedIngredients(loadCheckedIngredients());

    try {
      const savedSteps = localStorage.getItem(stepsKey);
      setCheckedSteps(savedSteps ? JSON.parse(savedSteps) : {});
    } catch {
      setCheckedSteps({});
    }
  }, [recipeId, ingredientsKey, stepsKey]);

  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(ingredientsKey, JSON.stringify(next));
      return next;
    });
  };

  const toggleStep = (stepNum: number) => {
    setCheckedSteps((prev) => {
      const next = { ...prev, [stepNum]: !prev[stepNum] };
      localStorage.setItem(stepsKey, JSON.stringify(next));
      return next;
    });
  };

  return {
    checkedIngredients,
    checkedSteps,
    toggleIngredient,
    toggleStep,
  };
}
