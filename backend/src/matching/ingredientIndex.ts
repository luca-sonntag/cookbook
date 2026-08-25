import MiniSearch from 'minisearch';
import { CANONICAL_INGREDIENTS, type CanonicalIngredient } from '../data/canonicalIngredients.js';
import type { CatalogueAccess } from './ingredientResolver.js';
import {
  normalizeSearchTerm,
  normalizeCategory,
  getSimplicityScore,
} from './matcherUtils.js';

interface IndexedIngredient extends CanonicalIngredient {
  search_aliases: string;
}

// Exact lookup map for O(1) code resolution
export const byId = new Map<string, CanonicalIngredient>();

// Category-scoped item lists for MiniSearch instances
export const itemsByCategory = new Map<string, IndexedIngredient[]>();
const allIndexedItems: IndexedIngredient[] = [];

// Populate indexes
for (const item of CANONICAL_INGREDIENTS) {
  byId.set(item.id.toLowerCase().trim(), item);
  if (item.bls_code) {
    byId.set(item.bls_code.toLowerCase().trim(), item);
  }

  const aliases = [item.name_de, item.name_en, ...(item.aliases || [])].filter(Boolean);

  const cleanAliases: string[] = [];
  for (const alias of aliases) {
    const norm = normalizeSearchTerm(alias);
    if (norm) cleanAliases.push(norm);
  }

  const indexedItem: IndexedIngredient = {
    ...item,
    search_aliases: Array.from(new Set(cleanAliases)).join(' '),
  };

  allIndexedItems.push(indexedItem);

  const cat = item.category || 'OTHER';
  if (!itemsByCategory.has(cat)) {
    itemsByCategory.set(cat, []);
  }
  itemsByCategory.get(cat)!.push(indexedItem);
}

// Build MiniSearch indexes
const miniSearchOptions = {
  fields: ['name_de', 'name_en', 'search_aliases'],
  storeFields: ['id', 'name_de', 'name_en', 'category', 'bls_code'],
  searchOptions: {
    boost: { name_de: 3.0, search_aliases: 2.5, name_en: 1.0 },
    fuzzy: 0.2,
    prefix: false,
  },
};

export const categoryMiniSearchMap = new Map<string, MiniSearch<IndexedIngredient>>();
for (const [cat, items] of itemsByCategory.entries()) {
  const ms = new MiniSearch<IndexedIngredient>(miniSearchOptions);
  ms.addAll(items);
  categoryMiniSearchMap.set(cat, ms);
}

export const globalMiniSearch = new MiniSearch<IndexedIngredient>(miniSearchOptions);
globalMiniSearch.addAll(allIndexedItems);

const validCategorySet = new Set(itemsByCategory.keys());

/**
 * Catalogue access handed to the tool-using resolver.
 */
export const catalogueAccess: CatalogueAccess = {
  search(query: string, category?: string, limit = 12): CanonicalIngredient[] {
    const clean = normalizeSearchTerm(query) || query.toLowerCase().trim();
    if (!clean) return [];

    const cleanCategory = category ? normalizeCategory(category, validCategorySet) : null;
    const engine =
      cleanCategory && categoryMiniSearchMap.has(cleanCategory)
        ? categoryMiniSearchMap.get(cleanCategory)!
        : globalMiniSearch;

    const results = engine.search(clean, {
      boost: { name_de: 3.0, search_aliases: 2.5, name_en: 1.0 },
      fuzzy: clean.length >= 5 ? 0.2 : false,
      prefix: true,
      combineWith: 'OR',
    });

    const items: CanonicalIngredient[] = [];
    for (const result of results) {
      const item = byId.get(result.id);
      if (item) items.push(item);
      if (items.length >= limit) break;
    }
    return items;
  },

  get(blsCode: string): CanonicalIngredient | null {
    const clean = (blsCode || '').toLowerCase().trim();
    if (!clean) return null;
    return byId.get(clean) || byId.get('bls_' + clean) || null;
  },

  listCategory(category: string, limit = 60): CanonicalIngredient[] {
    const clean = normalizeCategory(category, validCategorySet) || category.toUpperCase().trim();
    const items = itemsByCategory.get(clean);
    if (!items) return [];
    return [...items]
      .sort((a, b) => getSimplicityScore(b) - getSimplicityScore(a))
      .slice(0, limit);
  },
};
