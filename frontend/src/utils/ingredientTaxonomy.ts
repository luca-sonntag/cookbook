import type { ParentIngredientInfo } from '../types';

/**
 * Dynamically normalizes an ingredient name for grouping without hardcoded dictionaries.
 * Removes parenthetical descriptions, trailing comma modifiers, and handles basic plural stemming.
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

  // 3. Lowercase & character normalization
  name = name.toLowerCase().replace(/ß/g, 'ss');

  // 4. Plural stemming heuristic (German/English: "Zwiebeln" -> "zwiebel", "Onions" -> "onion")
  if (name.length > 4) {
    if (name.endsWith('n') && !name.endsWith('en')) {
      name = name.slice(0, -1);
    } else if (name.endsWith('en') && name.length > 5) {
      name = name.slice(0, -1);
    } else if (name.endsWith('s') && !name.endsWith('ss')) {
      name = name.slice(0, -1);
    }
  }

  return name;
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
