import { useState, useEffect } from 'react';
import type { Recipe } from '../types';

export function useRecipeProgress(recipe: Recipe) {
  const ingredientsKey = `recipe_ingredients_${recipe.title}`;
  const stepsKey = `recipe_steps_${recipe.title}`;

  // Initial load
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(ingredientsKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(stepsKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync state when recipe title changes
  useEffect(() => {
    try {
      const savedIngredients = localStorage.getItem(ingredientsKey);
      setCheckedIngredients(savedIngredients ? JSON.parse(savedIngredients) : {});
    } catch {
      setCheckedIngredients({});
    }

    try {
      const savedSteps = localStorage.getItem(stepsKey);
      setCheckedSteps(savedSteps ? JSON.parse(savedSteps) : {});
    } catch {
      setCheckedSteps({});
    }
  }, [recipe.title, ingredientsKey, stepsKey]);

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
