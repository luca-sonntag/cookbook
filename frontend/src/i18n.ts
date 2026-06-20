export const IngredientCategory = {
  PRODUCE: 'PRODUCE',
  BAKERY: 'BAKERY',
  MEAT_POULTRY: 'MEAT_POULTRY',
  SEAFOOD: 'SEAFOOD',
  DAIRY_EGGS: 'DAIRY_EGGS',
  PANTRY: 'PANTRY',
  GRAINS_PASTA: 'GRAINS_PASTA',
  SPICES_HERBS: 'SPICES_HERBS',
  BAKING: 'BAKING',
  CONDIMENTS_OILS: 'CONDIMENTS_OILS',
  FROZEN: 'FROZEN',
  BEVERAGES: 'BEVERAGES',
  OTHER: 'OTHER'
} as const;

export type IngredientCategory = typeof IngredientCategory[keyof typeof IngredientCategory];

export type SupportedLanguage = 'de' | 'en';

export const categoryTranslations: Record<SupportedLanguage, Record<IngredientCategory, string>> = {
  de: {
    [IngredientCategory.PRODUCE]: 'Obst & Gemüse',
    [IngredientCategory.BAKERY]: 'Brot & Backwaren',
    [IngredientCategory.MEAT_POULTRY]: 'Fleisch & Geflügel',
    [IngredientCategory.SEAFOOD]: 'Fisch & Meeresfrüchte',
    [IngredientCategory.DAIRY_EGGS]: 'Molkereiprodukte & Eier',
    [IngredientCategory.PANTRY]: 'Konserven & Vorrat',
    [IngredientCategory.GRAINS_PASTA]: 'Getreide & Nudeln',
    [IngredientCategory.SPICES_HERBS]: 'Gewürze & Kräuter',
    [IngredientCategory.BAKING]: 'Backzutaten',
    [IngredientCategory.CONDIMENTS_OILS]: 'Saucen & Öle',
    [IngredientCategory.FROZEN]: 'Tiefkühlkost',
    [IngredientCategory.BEVERAGES]: 'Getränke',
    [IngredientCategory.OTHER]: 'Sonstiges',
  },
  en: {
    [IngredientCategory.PRODUCE]: 'Produce',
    [IngredientCategory.BAKERY]: 'Bakery',
    [IngredientCategory.MEAT_POULTRY]: 'Meat & Poultry',
    [IngredientCategory.SEAFOOD]: 'Seafood',
    [IngredientCategory.DAIRY_EGGS]: 'Dairy & Eggs',
    [IngredientCategory.PANTRY]: 'Pantry & Canned Goods',
    [IngredientCategory.GRAINS_PASTA]: 'Grains & Pasta',
    [IngredientCategory.SPICES_HERBS]: 'Spices & Herbs',
    [IngredientCategory.BAKING]: 'Baking',
    [IngredientCategory.CONDIMENTS_OILS]: 'Condiments & Oils',
    [IngredientCategory.FROZEN]: 'Frozen Foods',
    [IngredientCategory.BEVERAGES]: 'Beverages',
    [IngredientCategory.OTHER]: 'Other',
  }
};

// Map legacy category names (German or generic English) to English enum keys for backward compatibility
export const legacyCategoryMap: Record<string, IngredientCategory> = {
  'obst & gemüse': IngredientCategory.PRODUCE,
  'obst und gemüse': IngredientCategory.PRODUCE,
  'gemüse': IngredientCategory.PRODUCE,
  'frische kräuter': IngredientCategory.PRODUCE,
  'brot & backwaren': IngredientCategory.BAKERY,
  'backwaren': IngredientCategory.BAKERY,
  'fleisch & geflügel': IngredientCategory.MEAT_POULTRY,
  'fleisch': IngredientCategory.MEAT_POULTRY,
  'geflügel': IngredientCategory.MEAT_POULTRY,
  'fisch & meeresfrüchte': IngredientCategory.SEAFOOD,
  'fisch': IngredientCategory.SEAFOOD,
  'molkereiprodukte & eier': IngredientCategory.DAIRY_EGGS,
  'molkereiprodukte': IngredientCategory.DAIRY_EGGS,
  'käse & molkereiprodukte': IngredientCategory.DAIRY_EGGS,
  'milchprodukte': IngredientCategory.DAIRY_EGGS,
  'eier': IngredientCategory.DAIRY_EGGS,
  'konserven & vorrat': IngredientCategory.PANTRY,
  'konserven': IngredientCategory.PANTRY,
  'vorrat': IngredientCategory.PANTRY,
  'vorratskammer': IngredientCategory.PANTRY,
  'getreide & nudeln': IngredientCategory.GRAINS_PASTA,
  'getreide': IngredientCategory.GRAINS_PASTA,
  'nudeln': IngredientCategory.GRAINS_PASTA,
  'gewürze & kräuter': IngredientCategory.SPICES_HERBS,
  'gewürze': IngredientCategory.SPICES_HERBS,
  'backzutaten': IngredientCategory.BAKING,
  'saucen & öle': IngredientCategory.CONDIMENTS_OILS,
  'öle & saucen': IngredientCategory.CONDIMENTS_OILS,
  'öle': IngredientCategory.CONDIMENTS_OILS,
  'saucen': IngredientCategory.CONDIMENTS_OILS,
  'tiefkühlkost': IngredientCategory.FROZEN,
  'getränke': IngredientCategory.BEVERAGES,
  'sonstiges': IngredientCategory.OTHER,
  'extras': IngredientCategory.OTHER,
  'ingredients': IngredientCategory.OTHER,
  'zutaten': IngredientCategory.OTHER,
};

export function translateCategory(category: string, lang: SupportedLanguage = 'de'): string {
  if (!category) return categoryTranslations[lang][IngredientCategory.OTHER];
  const cleanCategory = category.trim().toUpperCase();
  
  // 1. If it's already a valid enum key, translate it directly
  if (cleanCategory in IngredientCategory) {
    return categoryTranslations[lang][cleanCategory as IngredientCategory] || category;
  }
  
  // 2. Backward compatibility: check if it's a legacy category name
  const lowerCategory = category.trim().toLowerCase();
  const mappedKey = legacyCategoryMap[lowerCategory];
  if (mappedKey) {
    return categoryTranslations[lang][mappedKey];
  }

  // 3. Fallback: return the original string
  return category;
}

// Fixed sorting order for supermarket layout
export const categoryOrder: IngredientCategory[] = [
  IngredientCategory.PRODUCE,
  IngredientCategory.BAKERY,
  IngredientCategory.PANTRY,
  IngredientCategory.GRAINS_PASTA,
  IngredientCategory.SPICES_HERBS,
  IngredientCategory.DAIRY_EGGS,
  IngredientCategory.MEAT_POULTRY,
  IngredientCategory.SEAFOOD,
  IngredientCategory.BAKING,
  IngredientCategory.CONDIMENTS_OILS,
  IngredientCategory.FROZEN,
  IngredientCategory.BEVERAGES,
  IngredientCategory.OTHER
];

// Icons for each category
export const categoryIcons: Record<IngredientCategory, string> = {
  [IngredientCategory.PRODUCE]: '🥦',
  [IngredientCategory.BAKERY]: '🍞',
  [IngredientCategory.MEAT_POULTRY]: '🥩',
  [IngredientCategory.SEAFOOD]: '🐟',
  [IngredientCategory.DAIRY_EGGS]: '🥛',
  [IngredientCategory.PANTRY]: '🥫',
  [IngredientCategory.GRAINS_PASTA]: '🍝',
  [IngredientCategory.SPICES_HERBS]: '🧂',
  [IngredientCategory.BAKING]: '🥣',
  [IngredientCategory.CONDIMENTS_OILS]: '🍾',
  [IngredientCategory.FROZEN]: '❄️',
  [IngredientCategory.BEVERAGES]: '🥤',
  [IngredientCategory.OTHER]: '🛍️',
};

export function getCategoryIcon(category: string): string {
  if (!category) return '🛍️';
  const cleanCategory = category.trim().toUpperCase();
  if (cleanCategory in IngredientCategory) {
    return categoryIcons[cleanCategory as IngredientCategory];
  }
  const lowerCategory = category.trim().toLowerCase();
  const mappedKey = legacyCategoryMap[lowerCategory];
  if (mappedKey) {
    return categoryIcons[mappedKey];
  }
  return '🛍️'; // Default
}
