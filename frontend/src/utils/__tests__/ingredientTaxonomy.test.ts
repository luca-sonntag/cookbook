import { describe, it, expect } from 'vitest';
import { getParentIngredient, normalizeIngredientName } from '../ingredientTaxonomy';

describe('ingredientTaxonomy', () => {
  it('normalizes parenthetical and comma modifiers dynamically without hardcoded dictionaries or language rules', () => {
    expect(normalizeIngredientName('Zwiebel (weiß, fein gewürfelt)')).toBe('zwiebel');
    expect(normalizeIngredientName('Zwiebel, gewürfelt')).toBe('zwiebel');
  });

  it('normalizes sauces and products with parenthetical modifiers', () => {
    expect(normalizeIngredientName('Pizzasauce (klassisch)')).toBe('pizzasauce');
    expect(normalizeIngredientName('Pizzasauce')).toBe('pizzasauce');
  });

  it('uses explicit parentIngredient when provided', () => {
    const custom = getParentIngredient({
      name: 'Custom Component',
      parentIngredient: { name: 'Raw Parent', baseName: 'raw_parent', unit: 'g' }
    });
    expect(custom).toEqual({ name: 'Raw Parent', baseName: 'raw_parent', unit: 'g' });
  });

  it('correctly returns parent ingredient or normalized fallback', () => {
    const zitroneExplicit = getParentIngredient({
      name: 'Zitrone (abgerieben)',
      parentIngredient: { name: 'Zitrone', baseName: 'lemon', unit: 'Stück' }
    });
    expect(zitroneExplicit).toEqual({ name: 'Zitrone', baseName: 'lemon', unit: 'Stück' });

    const zitroneNormalized = getParentIngredient({ name: 'Zitrone (abgerieben)', unit: 'Stück' });
    expect(zitroneNormalized).toEqual({ name: 'Zitrone', baseName: 'zitrone', unit: 'Stück' });
  });
});
