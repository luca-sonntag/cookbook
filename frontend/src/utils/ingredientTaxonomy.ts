import { Ingredient, ParentIngredientInfo } from '../types';

interface KnownTaxonomyRule {
  targetNames: string[];
  targetBaseNames: string[];
  parent: ParentIngredientInfo;
}

const KNOWN_TAXONOMY_RULES: KnownTaxonomyRule[] = [
  {
    targetNames: ['eigelb', 'eiweiß', 'eigelbe', 'eiweiße'],
    targetBaseNames: ['egg yolk', 'egg white', 'egg-yolk', 'egg-white'],
    parent: { name: 'Ei', baseName: 'egg', unit: 'Stück' },
  },
  {
    targetNames: ['zitronenabrieb', 'zitronenschale', 'zitronensaft', 'zitronenabrieb (bio)'],
    targetBaseNames: ['lemon zest', 'lemon juice', 'lemon peel'],
    parent: { name: 'Zitrone', baseName: 'lemon', unit: 'Stück' },
  },
  {
    targetNames: ['orangenabrieb', 'orangenschale', 'orangensaft'],
    targetBaseNames: ['orange zest', 'orange juice', 'orange peel'],
    parent: { name: 'Orange', baseName: 'orange', unit: 'Stück' },
  },
  {
    targetNames: ['limettenabrieb', 'limettenschale', 'limettensaft'],
    targetBaseNames: ['lime zest', 'lime juice', 'lime peel'],
    parent: { name: 'Limette', baseName: 'lime', unit: 'Stück' },
  },
  {
    targetNames: ['knoblauchzehe', 'knoblauchzehen'],
    targetBaseNames: ['garlic clove', 'garlic cloves'],
    parent: { name: 'Knoblauch', baseName: 'garlic', unit: 'Zehe' },
  },
  {
    targetNames: ['hähnchenbrust', 'hähnchenkeule', 'hähncheninnenfilet', 'hähnchenbrustfilet'],
    targetBaseNames: ['chicken breast', 'chicken thigh', 'chicken fillet'],
    parent: { name: 'Hähnchen', baseName: 'chicken', unit: 'g' },
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

  // 3. Regex Heuristics
  // e.g. "Zitronensaft" -> "Zitrone"
  const suffixMatch = cleanName.match(/^(.+?)(abrieb|schale|saft)$/i);
  if (suffixMatch && suffixMatch[1].length >= 3) {
    const rawRoot = suffixMatch[1];
    const capitalizedName = rawRoot.charAt(0).toUpperCase() + rawRoot.slice(1);
    return {
      name: capitalizedName,
      baseName: rawRoot,
      unit: 'Stück',
    };
  }

  // e.g. "Knoblauchzehe" / "Knoblauchzehen"
  const zeheMatch = cleanName.match(/^(.+?)zehe(n)?$/i);
  if (zeheMatch && zeheMatch[1].length >= 3) {
    const rawRoot = zeheMatch[1];
    const capitalizedName = rawRoot.charAt(0).toUpperCase() + rawRoot.slice(1);
    return {
      name: capitalizedName,
      baseName: rawRoot,
      unit: 'Zehe',
    };
  }

  return null;
}
