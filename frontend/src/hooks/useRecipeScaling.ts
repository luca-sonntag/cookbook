import { useState, useEffect } from 'react';
import type { Recipe } from '../types';

export function useRecipeScaling(recipe: Recipe) {
  const [servings, setServings] = useState<number>(recipe.servings || 4);

  useEffect(() => {
    setServings(recipe.servings || 4);
  }, [recipe.servings]);

  const baseServings = recipe.servings || 1;
  const scaleFactor = servings / baseServings;

  const formatAmount = (amount: number | undefined | null, unit: string | undefined | null) => {
    if (!amount) return '';
    const scaled = amount * scaleFactor;

    const lowerUnit = (unit || '').toLowerCase().trim();
    const isWeightOrVolume = ['g', 'ml', 'kg', 'l', 'gramm', 'milliliter', 'liter', 'kilogramm'].includes(lowerUnit);

    // For weights, volumes, or large values, display as rounded whole numbers or decimals
    if (isWeightOrVolume || scaled >= 20) {
      if (scaled % 1 === 0) {
        return scaled.toString();
      }
      if (scaled >= 10) {
        return Math.round(scaled).toString();
      }
      return (Math.round(scaled * 10) / 10).toString();
    }

    // Otherwise, use mixed fractions for clean home-cooking measurements
    const tolerance = 0.05;
    const intPart = Math.floor(scaled);
    const decPart = scaled - intPart;

    let fractionStr = '';
    if (Math.abs(decPart - 0.25) < tolerance) {
      fractionStr = '¼';
    } else if (Math.abs(decPart - 0.5) < tolerance) {
      fractionStr = '½';
    } else if (Math.abs(decPart - 0.75) < tolerance) {
      fractionStr = '¾';
    } else if (Math.abs(decPart - 0.333) < tolerance) {
      fractionStr = '⅓';
    } else if (Math.abs(decPart - 0.666) < tolerance) {
      fractionStr = '⅔';
    } else if (Math.abs(decPart - 0.125) < tolerance) {
      fractionStr = '⅛';
    } else if (decPart > 0.95) {
      return (intPart + 1).toString();
    } else if (decPart < 0.05) {
      return intPart.toString();
    } else {
      return (Math.round(scaled * 10) / 10).toString();
    }

    if (intPart === 0) {
      return fractionStr;
    }
    return `${intPart} ${fractionStr}`;
  };

  const formatNutritionValue = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '';
    if (typeof val === 'number') {
      return Math.round(val * scaleFactor);
    }
    const match = val.match(/^([\d.,]+)\s*([a-zA-Z%]*)$/);
    if (!match) return val;
    const numPart = parseFloat(match[1].replace(',', '.'));
    if (isNaN(numPart)) return val;
    const scaled = Math.round(numPart * scaleFactor * 10) / 10;
    const unit = match[2] || 'g';
    return `${scaled}${unit}`;
  };

  return {
    servings,
    setServings,
    scaleFactor,
    formatAmount,
    formatNutritionValue,
  };
}
