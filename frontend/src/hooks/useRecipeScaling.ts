import { useState, useEffect } from 'react';
import type { Recipe } from '../types';
import { formatQuantity } from '../utils/formatQuantity';

export function useRecipeScaling(recipe: Recipe) {
  const recipeId = recipe.id || recipe.title;
  const storageKey = `recipe_servings_${recipeId}`;

  const [servings, setServings] = useState<number>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? parseInt(saved, 10) : (recipe.servings || 4);
  });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setServings(parseInt(saved, 10));
    } else {
      setServings(recipe.servings || 4);
    }
  }, [recipeId, recipe.servings, storageKey]);

  const updateServings = (newServings: number | ((s: number) => number)) => {
    setServings((prev) => {
      const next = typeof newServings === 'function' ? newServings(prev) : newServings;
      localStorage.setItem(storageKey, next.toString());
      return next;
    });
  };

  const baseServings = recipe.servings || 1;
  const scaleFactor = servings / baseServings;

  const formatAmount = (amount: number | undefined | null, unit: string | undefined | null) => {
    if (!amount) return '';
    return formatQuantity(amount * scaleFactor, unit);
  };

  const formatNutritionValue = (val: string | number | undefined | null) => {
    if (val === undefined || val === null || val === '') return '—';
    if (typeof val === 'number') {
      if (val === 0) return '—';
      return Math.round(val * scaleFactor);
    }
    const match = val.match(/^([\d.,]+)\s*([a-zA-Z%]*)$/);
    if (!match) return val;
    const numPart = parseFloat(match[1].replace(',', '.'));
    if (isNaN(numPart)) return val;
    if (numPart === 0) return '—';
    const scaled = Math.round(numPart * scaleFactor * 10) / 10;
    const unit = match[2] || 'g';
    return `${scaled}${unit}`;
  };

  return {
    servings,
    setServings: updateServings,
    scaleFactor,
    formatAmount,
    formatNutritionValue,
  };
}
