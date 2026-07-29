import { useState, useEffect } from 'react';
import type { Recipe } from '../types';

export function useRecipeProgress(recipe: Recipe) {
  const recipeId = recipe.id || recipe.title;
  const stepsKey = `recipe_steps_${recipeId}`;

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
    try {
      const savedSteps = localStorage.getItem(stepsKey);
      setCheckedSteps(savedSteps ? JSON.parse(savedSteps) : {});
    } catch {
      setCheckedSteps({});
    }
  }, [recipeId, stepsKey]);

  const toggleStep = (stepNum: number) => {
    setCheckedSteps((prev) => {
      const next = { ...prev, [stepNum]: !prev[stepNum] };
      localStorage.setItem(stepsKey, JSON.stringify(next));
      return next;
    });
  };

  return {
    checkedSteps,
    toggleStep,
  };
}
