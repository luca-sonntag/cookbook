import type { ParentIngredientInfo } from '../types';

/**
 * Dynamically normalizes an ingredient name for grouping without hardcoded dictionaries or language-specific rules.
 * Removes parenthetical descriptions and trailing comma modifiers.
 */
export function normalizeIngredientName(rawName: string): string {
  if (!rawName) return '';

  let name = rawName.trim();

  // 1. Remove parenthetical descriptions, e.g. "Zwiebel (gewürfelt)" -> "Zwiebel"
  name = name.replace(/\s*\([^)]*\)/g, '').trim();

  // 2. Remove trailing comma modifiers, e.g. "Zwiebel, fein gewürfelt" -> "Zwiebel"
  const commaIndex = name.indexOf(',');
  if (commaIndex !== -1) {
    name = name.slice(0, commaIndex).trim();
  }

  // 3. Lowercase & trim
  return name.toLowerCase().trim();
}

/**
 * Resolves parent ingredient info dynamically.
 * Checks explicit `ingredient.parentIngredient` first, then computes dynamic normalized baseName.
 */
export function getParentIngredient(ing: {
  name: string;
  baseName?: string;
  unit?: string;
  parentIngredient?: ParentIngredientInfo;
}): ParentIngredientInfo | null {
  // 1. Explicitly provided parent from AI
  if (ing.parentIngredient?.baseName && ing.parentIngredient?.name) {
    return ing.parentIngredient;
  }

  const normalized = normalizeIngredientName(ing.name);
  if (!normalized) return null;

  // Capitalize normalized name for clean display
  const displayName = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return {
    name: displayName,
    baseName: normalized,
    unit: ing.unit
  };
}
