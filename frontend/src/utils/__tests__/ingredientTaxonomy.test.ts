import { describe, it, expect } from 'vitest';
import { getParentIngredient } from '../ingredientTaxonomy';

describe('ingredientTaxonomy', () => {
  it('resolves Eigelb and Eiweiß to Ei (egg)', () => {
    const eigelb = getParentIngredient({ name: 'Eigelb', baseName: 'egg yolk' });
    expect(eigelb).toEqual({ name: 'Ei', baseName: 'egg', unit: 'Stück' });

    const eiweiss = getParentIngredient({ name: 'Eiweiß', baseName: 'egg white' });
    expect(eiweiss).toEqual({ name: 'Ei', baseName: 'egg', unit: 'Stück' });
  });

  it('resolves Zitronenabrieb and Zitronensaft to Zitrone (lemon)', () => {
    const abrieb = getParentIngredient({ name: 'Zitronenabrieb', baseName: 'lemon zest' });
    expect(abrieb).toEqual({ name: 'Zitrone', baseName: 'lemon', unit: 'Stück' });

    const saft = getParentIngredient({ name: 'Zitronensaft' });
    expect(saft).toEqual({ name: 'Zitrone', baseName: 'lemon', unit: 'Stück' });
  });

  it('uses explicit parentIngredient when provided', () => {
    const custom = getParentIngredient({
      name: 'Custom Component',
      parentIngredient: { name: 'Raw Parent', baseName: 'raw_parent', unit: 'g' }
    });
    expect(custom).toEqual({ name: 'Raw Parent', baseName: 'raw_parent', unit: 'g' });
  });

  it('returns null for standard non-derived ingredients', () => {
    const salt = getParentIngredient({ name: 'Salz', baseName: 'salt' });
    expect(salt).toBeNull();
  });
});
