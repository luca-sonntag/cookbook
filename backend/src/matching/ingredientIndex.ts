import MiniSearch from 'minisearch';
import { CANONICAL_INGREDIENTS, type CanonicalIngredient } from '../data/canonicalIngredients.js';
import type { ParentIngredientInfo } from '../types.js';
import type { CatalogueAccess } from './ingredientResolver.js';
import {
  normalizeSearchTerm,
  normalizeCategory,
  buildSearchQueries,
  getSimplicityScore,
} from './matcherUtils.js';

interface IndexedIngredient extends CanonicalIngredient {
  search_aliases: string;
}

// 1. Exact lookup maps for O(1) matching
export const byId = new Map<string, CanonicalIngredient>();
export const byAlias = new Map<string, CanonicalIngredient>();
export const byNameEn = new Map<string, CanonicalIngredient>();
export const byNameDe = new Map<string, CanonicalIngredient>();

// 2. Category-scoped item lists for MiniSearch instances
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
    if (!norm) continue;
    cleanAliases.push(norm);

    const existing = byAlias.get(norm);
    if (!existing || getSimplicityScore(item) > getSimplicityScore(existing)) {
      byAlias.set(norm, item);
    }
  }

  if (item.name_de) {
    const normDe = normalizeSearchTerm(item.name_de);
    const existing = byNameDe.get(normDe);
    if (!existing || getSimplicityScore(item) > getSimplicityScore(existing)) {
      byNameDe.set(normDe, item);
    }
  }

  if (item.name_en) {
    const rawEn =
      item.bls_code === 'X654042' || item.id === 'bls_x654042' ? 'French fries' : item.name_en;
    const normEn = normalizeSearchTerm(rawEn);
    const existing = byNameEn.get(normEn);
    if (!existing || getSimplicityScore(item) > getSimplicityScore(existing)) {
      byNameEn.set(normEn, item);
    }
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

/**
 * Synchronous O(1) Fast-Path lookup for exact direct BLS alias / name matches.
 * Covers basic staples with authoritative alias or database name matches.
 */
export function findFastPathMatch(
  name: string,
  baseName?: string,
  category?: string,
  synonyms?: string[],
  searchQueries?: string[],
  parentIngredient?: ParentIngredientInfo,
  modifier?: string,
  brand?: string
): CanonicalIngredient | null {
  const hasModifierOrBrand = Boolean(
    (modifier && modifier.trim().length > 0) || (brand && brand.trim().length > 0)
  );

  if (hasModifierOrBrand) {
    return null;
  }

  const isPowderQuery =
    /\b(pulver|powder)\b/i.test(name) || /\b(pulver|powder)\b/i.test(baseName || '');

  // 1. Parent ingredient priority (e.g. "Ei" for "Eigelb", "Zitrone" for "Zitronensaft")
  if (parentIngredient?.name) {
    const normParent = normalizeSearchTerm(parentIngredient.name);
    const directParent =
      byAlias.get(normParent) || byNameDe.get(normParent) || byId.get(normParent);
    if (directParent) {
      return directParent;
    }
  }

  // 2. Build search query list
  const queriesToTest = buildSearchQueries(name, baseName, synonyms, searchQueries);

  // 3. Exact O(1) Fast-Path (authoritative direct alias match)
  for (const q of queriesToTest) {
    const direct = byAlias.get(q) || byNameDe.get(q) || byId.get(q) || byNameEn.get(q);
    if (direct) {
      if (
        isPowderQuery &&
        direct.category === 'FRUITS_VEGETABLES' &&
        !direct.name_de.toLowerCase().includes('pulver')
      ) {
        continue;
      }
      return direct;
    }
  }

  return null;
}
