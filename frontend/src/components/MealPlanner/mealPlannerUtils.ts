import type { Ingredient, IngredientGroup } from '../../types';

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function scaleIngredientGroups(
  ingredients: IngredientGroup[] | undefined,
  targetServings: number,
  baseServings: number,
): Ingredient[] {
  if (!ingredients || ingredients.length === 0) return [];
  const scaleFactor = (targetServings || baseServings) / (baseServings || 2);
  const scaled: Ingredient[] = [];

  for (const group of ingredients) {
    for (const item of group.items) {
      scaled.push({
        ...item,
        amount: (item.amount || 0) * scaleFactor,
      });
    }
  }
  return scaled;
}
