import type { ParentIngredientInfo } from '../types';

interface KnownTaxonomyRule {
  targetNames: string[];
  targetBaseNames: string[];
  parent: ParentIngredientInfo;
}

const KNOWN_TAXONOMY_RULES: KnownTaxonomyRule[] = [
  {
    targetNames: ['ei', 'eier', 'eigelb', 'eiweiß', 'eigelbe', 'eiweiße'],
    targetBaseNames: ['egg', 'eggs', 'egg yolk', 'egg white', 'egg-yolk', 'egg-white'],
    parent: { name: 'Ei', baseName: 'egg', unit: 'Stück' },
  },
  {
    targetNames: ['zitrone', 'zitronen', 'zitronenabrieb', 'zitronenschale', 'zitronensaft', 'zitronenabrieb (bio)'],
    targetBaseNames: ['lemon', 'lemons', 'lemon zest', 'lemon juice', 'lemon peel'],
    parent: { name: 'Zitrone', baseName: 'lemon', unit: 'Stück' },
  },
  {
    targetNames: ['orange', 'orangen', 'orangenabrieb', 'orangenschale', 'orangensaft'],
    targetBaseNames: ['orange', 'oranges', 'orange zest', 'orange juice', 'orange peel'],
    parent: { name: 'Orange', baseName: 'orange', unit: 'Stück' },
  },
  {
    targetNames: ['limette', 'limetten', 'limettenabrieb', 'limettenschale', 'limettensaft'],
    targetBaseNames: ['lime', 'limes', 'lime zest', 'lime juice', 'lime peel'],
    parent: { name: 'Limette', baseName: 'lime', unit: 'Stück' },
  },
  {
    targetNames: ['knoblauch', 'knoblauchzehe', 'knoblauchzehen'],
    targetBaseNames: ['garlic', 'garlic clove', 'garlic cloves'],
    parent: { name: 'Knoblauch', baseName: 'garlic', unit: 'Zehe' },
  },
];

/**
 * Resolves the raw parent ingredient for grocery store shopping list aggregation.
 * Checks explicit `ingredient.parentIngredient` first, then taxonomy rules, then regex heuristics.
 */
export function getParentIngredient(ing: {
  name: string;
  baseName?: string;
  unit?: string;
  parentIngredient?: ParentIngredientInfo;
}): ParentIngredientInfo | null {
  // 1. Explicitly provided parent
  if (ing.parentIngredient?.baseName && ing.parentIngredient?.name) {
    return ing.parentIngredient;
  }

  const cleanName = ing.name.toLowerCase().trim();
  const cleanBaseName = (ing.baseName || '').toLowerCase().trim();

  // 2. Known explicit rule matching
  for (const rule of KNOWN_TAXONOMY_RULES) {
    if (
      rule.targetNames.includes(cleanName) ||
      (cleanBaseName && rule.targetBaseNames.includes(cleanBaseName))
    ) {
      return rule.parent;
    }
  }

  return null;
}
