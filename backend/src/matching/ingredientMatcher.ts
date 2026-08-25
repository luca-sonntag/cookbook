import MiniSearch from 'minisearch';
import { CANONICAL_INGREDIENTS, type CanonicalIngredient } from '../data/canonicalIngredients.js';
import { BASE_NAME_TO_CANONICAL_ID } from './baseNameMap.js';
import { canonicalizeBaseName, buildMappingKeys, toEnglishSingular } from './baseNameCanonical.js';
import {
  resolveIngredient,
  mapWithConcurrency,
  type CatalogueAccess,
  type ResolverInput,
} from './ingredientResolver.js';
import {
  lookupMapping,
  storeMapping,
  flushHitCounts,
  type EstimatedNutrients,
} from './mappingStore.js';
import type { Recipe, Ingredient, ParentIngredientInfo, GeminiUsageInfo } from '../types.js';

// Re-exported so existing callers and tests keep importing it from the matcher.
export { toEnglishSingular, canonicalizeBaseName, buildMappingKeys };

/**
 * Ingredients of one recipe resolved in parallel. Kept small on purpose: the
 * resolver's process-wide semaphore is the real limit, and a large fan-out here
 * would just queue up behind it.
 */
const RECIPE_RESOLVE_CONCURRENCY = 3;

interface IndexedIngredient extends CanonicalIngredient {
  search_aliases: string;
}

// 1. Exact lookup maps for O(1) matching
const byId = new Map<string, CanonicalIngredient>();
const byAlias = new Map<string, CanonicalIngredient>();
const byNameEn = new Map<string, CanonicalIngredient>();
const byNameDe = new Map<string, CanonicalIngredient>();

// 2. Category-scoped item lists for MiniSearch instances
const itemsByCategory = new Map<string, IndexedIngredient[]>();
const allIndexedItems: IndexedIngredient[] = [];

// Simplicity score for choosing between multiple exact alias matches and ranking raw staples
function getSimplicityScore(item: CanonicalIngredient): number {
  const de = (item.name_de || '').toLowerCase();
  const en = (item.name_en || '').toLowerCase();
  let score = 100 - de.length;
  if (de.includes('roh') || en.includes('raw')) score += 40;
  if (de.includes('pulver') && !de.includes('backpulver')) score += 25;
  if (de.includes('nature') || de.includes('mager') || en.includes('plain') || en.includes('unsalted') || de.includes('trocken')) score += 20;
  if (
    de.includes('zubereitung') ||
    de.includes('gebäck') ||
    de.includes('gericht') ||
    de.includes('salat') ||
    de.includes('burger') ||
    de.includes('konserve') ||
    de.includes('gegrillt') ||
    de.includes('gebacken') ||
    de.includes('gedünstet') ||
    de.includes('mit fett und salz') ||
    de.includes('paniert') ||
    de.includes('frittiert')
  ) {
    score -= 30;
  }
  return score;
}

// Populate indexes
for (const item of CANONICAL_INGREDIENTS) {
  // Index by id (e.g. bls_m111300) and clean code (e.g. m111300)
  byId.set(item.id.toLowerCase().trim(), item);
  if (item.bls_code) {
    byId.set(item.bls_code.toLowerCase().trim(), item);
  }

  const aliases = [
    item.name_de,
    item.name_en,
    ...(item.aliases || []),
  ].filter(Boolean);

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
    const rawEn = (item.bls_code === 'X654042' || item.id === 'bls_x654042') ? 'French fries' : item.name_en;
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

const categoryMiniSearchMap = new Map<string, MiniSearch<IndexedIngredient>>();
for (const [cat, items] of itemsByCategory.entries()) {
  const ms = new MiniSearch<IndexedIngredient>(miniSearchOptions);
  ms.addAll(items);
  categoryMiniSearchMap.set(cat, ms);
}

const globalMiniSearch = new MiniSearch<IndexedIngredient>(miniSearchOptions);
globalMiniSearch.addAll(allIndexedItems);

/**
 * Cleans punctuation, parentheses, brackets, quantities, and superfluous culinary adjectives.
 */
export function normalizeSearchTerm(term: string): string {
  if (!term) return '';
  return term
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/[,;:\/\\+*&]/g, ' ')
    .replace(/\b(frisch|frische|frischer|frisches|getrocknet|getrocknete|getrockneter|gemahlen|gemahlene|gehackt|gehackte|gewürfelt|geschnitten|gepresst|gepresste|gepresster|gepresstes|püriert|pürierte|püriertes|geschält|geschälte|geschälter|geschältes|gehobelt|gehobelte|gerieben|geriebener|geriebene|abgetropft|fein|grob|kaltgepresst|bio|ungesüßt|gesüßt|vegan|vegetarisch|optional|nach belieben|zum anbraten|zum garnieren|etwas|prise|ca\.?|warm|kalt|heiß|flüssig|weich|hart|reif|unreif|mittelgroß|groß|klein|dünn|dick)\b/gi, ' ')
    .replace(/\b(fresh|dried|ground|minced|chopped|diced|sliced|pressed|pureed|peeled|shaved|grated|drained|fine|coarse|cold-pressed|organic|unsweetened|sweetened|vegan|vegetarian|optional|to taste|for frying|for garnish|some|pinch|approx\.?|warm|cold|hot|liquid|soft|hard|ripe|unripe|medium|large|small|thin|thick)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes culinary measurement units to canonical keys.
 */
export function normalizeUnit(unit: string): string {
  if (!unit) return 'piece';
  const u = unit.toLowerCase().trim();
  if (['g', 'gramm', 'grams', 'gram', 'gr', 'g.'].includes(u)) return 'g';
  if (['kg', 'kilogramm', 'kilograms', 'kilo'].includes(u)) return 'kg';
  if (['ml', 'milliliter', 'milliliters'].includes(u)) return 'ml';
  if (['l', 'liter', 'liters', 'ltr'].includes(u)) return 'l';
  if (['el', 'esslöffel', 'tbsp', 'tablespoon', 'tablespoons'].includes(u)) return 'tablespoon';
  if (['tl', 'teelöffel', 'tsp', 'teaspoon', 'teaspoons'].includes(u)) return 'teaspoon';
  if (['stk', 'stück', 'stueck', 'piece', 'pieces', 'pc', 'pcs', 'x'].includes(u)) return 'piece';
  if (['scheibe', 'scheiben', 'slice', 'slices'].includes(u)) return 'slice';
  if (['packung', 'packungen', 'pkg', 'pack', 'packs', 'package', 'packages', 'pck', 'pckg', 'päckchen', 'paeckchen', 'beutel'].includes(u)) return 'pack';
  if (['dose', 'dosen', 'can', 'cans', 'tin'].includes(u)) return 'can';
  if (['glas', 'gläser', 'glaeser', 'jar', 'jars'].includes(u)) return 'jar';
  if (['becher', 'tub', 'tubs'].includes(u)) return 'cup';
  if (['tasse', 'tassen', 'cup', 'cups'].includes(u)) return 'cup';
  if (['bund', 'bunch', 'bunches'].includes(u)) return 'bunch';
  if (['prise', 'prisen', 'pinch', 'pinches'].includes(u)) return 'pinch';
  if (['zehe', 'zehen', 'clove', 'cloves'].includes(u)) return 'clove';
  if (['handvoll', 'handful'].includes(u)) return 'handful';
  return 'piece';
}

/**
 * Normalizes supermarket category names to match canonical BLS categories.
 */
function normalizeCategory(cat?: string): string | null {
  if (!cat) return null;
  const upper = cat.toUpperCase().trim();
  if (itemsByCategory.has(upper)) return upper;
  const mapping: Record<string, string> = {
    'PRODUCE': 'FRUITS_VEGETABLES',
    'FRUITS': 'FRUITS_VEGETABLES',
    'VEGETABLES': 'FRUITS_VEGETABLES',
    'OBST': 'FRUITS_VEGETABLES',
    'GEMÜSE': 'FRUITS_VEGETABLES',
    'OBST & GEMÜSE': 'FRUITS_VEGETABLES',
    'MOLKEREIPRODUKTE': 'DAIRY',
    'MILCHPRODUKTE': 'DAIRY',
    'KÄSE': 'DAIRY',
    'CHEESE': 'DAIRY',
    'FLEISCH': 'MEAT_FISH',
    'FISCH': 'MEAT_FISH',
    'FLEISCH & FISCH': 'MEAT_FISH',
    'MEAT': 'MEAT_FISH',
    'FISH': 'MEAT_FISH',
    'SEAFOOD': 'MEAT_FISH',
    'GETREIDE': 'GRAINS_PASTA',
    'NUDELN': 'GRAINS_PASTA',
    'PASTA': 'GRAINS_PASTA',
    'GRAINS': 'GRAINS_PASTA',
    'BACKEN': 'BAKING_COOKING',
    'BACKZUTATEN': 'BAKING_COOKING',
    'BAKING': 'BAKING_COOKING',
    'SPICES': 'SPICES_OILS',
    'OILS': 'SPICES_OILS',
    'GEWÜRZE': 'SPICES_OILS',
    'ÖLE': 'SPICES_OILS',
    'GEWÜRZE & ÖLE': 'SPICES_OILS',
    'SWEETS': 'SWEETS_SNACKS',
    'SNACKS': 'SWEETS_SNACKS',
    'SÜSSWAREN': 'SWEETS_SNACKS',
    'BEVERAGES': 'BEVERAGES',
    'GETRÄNKE': 'BEVERAGES',
    'DRINKS': 'BEVERAGES',
    'CANNED': 'CANNED_PRESERVED',
    'KONSERVEN': 'CANNED_PRESERVED',
    'BREAD': 'BREAD_BAKERY',
    'BROT': 'BREAD_BAKERY',
    'BACKWAREN': 'BREAD_BAKERY',
  };
  return mapping[upper] || null;
}

/**
 * Builds candidate search queries from raw name, baseName, synonyms and searchQueries.
 */
function buildSearchQueries(
  name: string,
  baseName?: string,
  synonyms?: string[],
  searchQueries?: string[]
): string[] {
  const queries: string[] = [];
  const seen = new Set<string>();

  const add = (q?: string) => {
    if (!q) return;
    const clean = normalizeSearchTerm(q);
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      queries.push(clean);
    }
  };

  add(name);
  add(baseName);

  if (searchQueries && Array.isArray(searchQueries)) {
    for (const sq of searchQueries) add(sq);
  }

  if (synonyms && Array.isArray(synonyms)) {
    for (const syn of synonyms) add(syn);
  }

  if (name.includes(' ') || name.includes('-')) {
    const words = name.split(/[\s-]+/).map(normalizeSearchTerm).filter(w => w.length > 2);
    for (const w of words) add(w);
    if (words.length >= 2) {
      add(words[words.length - 1]);
    }
  }

  return queries;
}


/**
 * Generic nutritional plausibility check comparing estimated ingredient macros
 * against canonical BLS entry values per 100g.
 * 
 * Protects against false matches where a light/zero/fat-reduced/custom product
 * is mistakenly mapped to a high-fat, high-sugar, or high-calorie standard staple.
 */
export function isNutritionallyPlausible(
  ingredient: Ingredient,
  candidate: CanonicalIngredient | null | undefined
): boolean {
  if (!candidate) return false;
  if (ingredient.calories === undefined || ingredient.calories === null) return true;
  if (!ingredient.amount || ingredient.amount <= 0) return true;

  const weightGrams = calculateWeightGrams(ingredient.amount, ingredient.unit, null, ingredient.gramsPerUnit);
  if (weightGrams <= 0) return true;

  const estKcalPer100g = (ingredient.calories / weightGrams) * 100;
  const candKcalPer100g = candidate.nutrients_per_100g.calories;

  // 1. Zero / Ultra-low calorie check (e.g. Zero Ketchup ~15 kcal vs standard Ketchup 98 kcal, Diet sodas ~0 vs 45)
  if (estKcalPer100g <= 35 && candKcalPer100g >= 75) {
    return false;
  }

  // 2. Light / Low-fat vs Full-fat check (e.g. Eat Lean Cheese ~160 kcal vs Gouda 380 kcal; Miracle Whip ~130 kcal vs Mayo 750 kcal)
  if (estKcalPer100g <= 220 && candKcalPer100g >= 340) {
    return false;
  }

  // 3. Significant Relative Calorie Divergence (> 2.5x gap for foods with substantial absolute differences)
  if (estKcalPer100g > 0 && candKcalPer100g > 0) {
    const ratio = candKcalPer100g / estKcalPer100g;
    if (ratio >= 2.5 && (candKcalPer100g - estKcalPer100g) >= 50) {
      return false;
    }
  }

  // 4. Macro Fat check: low-fat specified (<= 5g/100g) vs high-fat candidate (>= 25g/100g)
  if (ingredient.fat !== undefined && ingredient.fat !== null) {
    const estFatPer100g = (ingredient.fat / weightGrams) * 100;
    if (estFatPer100g <= 5 && candidate.nutrients_per_100g.fat >= 25) {
      return false;
    }
  }

  // 5. Macro Carbs check: low-carb / sugar-free specified (<= 3g/100g) vs high-carb candidate (>= 18g/100g)
  if (ingredient.carbs !== undefined && ingredient.carbs !== null) {
    const estCarbsPer100g = (ingredient.carbs / weightGrams) * 100;
    if (estCarbsPer100g <= 3 && candidate.nutrients_per_100g.carbs >= 18) {
      return false;
    }
  }

  return true;
}

/**
 * Stage 0 & Stage 1: Synchronous O(1) Fast-Path lookup.
 * Covers 92%+ of all ingredients instantly in 0 ms.
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
  // If an ingredient has a brand or a qualifying modifier (e.g. fettreduziert, zuckerfrei, leicht, etc.),
  // do not do blind O(1) fast-path matching. Fast-Path is only for unmodified basic staples.
  const hasModifierOrBrand = Boolean(
    (modifier && modifier.trim().length > 0) ||
    (brand && brand.trim().length > 0)
  );

  if (hasModifierOrBrand) {
    return null;
  }

  const isPowderQuery = /\b(pulver|powder)\b/i.test(name) || /\b(pulver|powder)\b/i.test(baseName || '');

  // 0. Stage 0: Universal BaseName Fast-Path (authoritative direct English key match + safe singularizer)
  if (baseName) {
    const normBase = baseName.toLowerCase().trim();
    const singular = toEnglishSingular(normBase);
    const mappedId = BASE_NAME_TO_CANONICAL_ID[normBase] || BASE_NAME_TO_CANONICAL_ID[singular];
    if (mappedId) {
      const item = byId.get(mappedId.toLowerCase().trim()) || byId.get('bls_' + mappedId.toLowerCase().trim());
      if (item) return item;
    }
  }

  // 1. Parent ingredient priority (e.g. "Ei" for "Eigelb", "Zitrone" for "Zitronensaft")
  if (parentIngredient?.name || parentIngredient?.baseName) {
    if (parentIngredient.baseName) {
      const normParentBase = parentIngredient.baseName.toLowerCase().trim();
      const singularParent = toEnglishSingular(normParentBase);
      const mappedParentId = BASE_NAME_TO_CANONICAL_ID[normParentBase] || BASE_NAME_TO_CANONICAL_ID[singularParent];
      if (mappedParentId) {
        const item = byId.get(mappedParentId.toLowerCase().trim()) || byId.get('bls_' + mappedParentId.toLowerCase().trim());
        if (item) return item;
      }
    }
    if (parentIngredient.name) {
      const normParent = normalizeSearchTerm(parentIngredient.name);
      const directParent = byAlias.get(normParent) || byNameDe.get(normParent) || byId.get(normParent);
      if (directParent) {
        return directParent;
      }
    }
  }

  // 2. Build search query list
  const queriesToTest = buildSearchQueries(name, baseName, synonyms, searchQueries);

  // 3. Stage 1: Exact O(1) Fast-Path (authoritative direct alias match)
  for (const q of queriesToTest) {
    const direct = byAlias.get(q) || byNameDe.get(q) || byId.get(q) || byNameEn.get(q);
    if (direct) {
      if (isPowderQuery && direct.category === 'FRUITS_VEGETABLES' && !direct.name_de.toLowerCase().includes('pulver')) {
        continue;
      }
      return direct;
    }
  }

  return null;
}

/**
 * Stage 2: MiniSearch BM25 candidate retrieval with lightweight domain pre-filters.
 */
export function getMiniSearchCandidates(
  name: string,
  baseName?: string,
  category?: string,
  synonyms?: string[],
  searchQueries?: string[],
  limit = 10,
  modifier?: string,
  brand?: string
): CanonicalIngredient[] {
  const cleanCategory = normalizeCategory(category);
  const targetMiniSearch = cleanCategory && categoryMiniSearchMap.has(cleanCategory) ? categoryMiniSearchMap.get(cleanCategory)! : null;
  const searchEngine = targetMiniSearch || globalMiniSearch;
  const queriesToTest = buildSearchQueries(name, baseName, synonyms, searchQueries);

  const candidateMap = new Map<string, { item: CanonicalIngredient; score: number }>();
  const lowerQuery = (name + ' ' + (baseName || '') + ' ' + (modifier || '') + ' ' + (brand || '')).toLowerCase();

  for (const q of queriesToTest) {
    if (q.length < 2) continue;
    const results = searchEngine.search(q, {
      boost: { name_de: 3.0, search_aliases: 2.5, name_en: 1.0 },
      fuzzy: q.length >= 5 ? 0.2 : false,
      prefix: false,
      combineWith: 'OR',
    });

    for (const r of results.slice(0, limit)) {
      if (!candidateMap.has(r.id)) {
        const item = byId.get(r.id);
        if (item) {
          candidateMap.set(r.id, { item, score: r.score });
        }
      }
    }
  }

  const filtered: CanonicalIngredient[] = [];

  for (const { item } of candidateMap.values()) {
    const candDe = (item.name_de || '').toLowerCase();

    // Never match fitness protein powder to baking leavening agents (Backpulver/Natron)
    const isBakingLeavening = item.bls_code?.startsWith('R42') || candDe.includes('backpulver') || candDe.includes('natron');
    const isLeaveningQuery = /\b(backpulver|natron|baking powder|baking soda|leavening)\b/i.test(lowerQuery);
    if (!isLeaveningQuery && isBakingLeavening) continue;

    // Flour vs Pastry guard
    if (/\b(mehl|flour)\b/i.test(lowerQuery) && (candDe.includes('kuchen') || candDe.includes('torte') || candDe.includes('gebäck') || item.bls_code?.startsWith('D4'))) {
      continue;
    }

    // Spice vs Sauce guard
    const isSpiceQuery = (cleanCategory === 'SPICES_OILS' || /\b(pulver|powder|gewürz|spice)\b/i.test(lowerQuery)) && !/\b(ketchup|sauce|soße|dressing|dip)\b/i.test(lowerQuery);
    if (isSpiceQuery && (candDe.includes('ketchup') || candDe.includes('sauce') || candDe.includes('soße') || candDe.includes('dressing'))) {
      continue;
    }

    // Pesto vs Dried herbs guard
    if (/\bpesto\b/i.test(lowerQuery) && (candDe.includes('getrocknet') || candDe.includes('blatt') || item.category === 'FRUITS_VEGETABLES')) {
      continue;
    }

    // Pulver/Powder guard
    if (/\b(pulver|powder)\b/i.test(lowerQuery) && item.category === 'FRUITS_VEGETABLES' && !candDe.includes('pulver') && !candDe.includes('powder') && !candDe.includes('getrocknet')) {
      continue;
    }

    // Poultry vs Beef/Offal guard
    const isPoultryQuery = /\b(hähnchen|huhn|hühner|geflügel|pute|truthahn|chicken|turkey)\b/i.test(lowerQuery);
    if (isPoultryQuery && (item.bls_code?.startsWith('U') || candDe.includes('leber') || candDe.includes('niere') || candDe.includes('schwein') || candDe.includes('rind'))) {
      continue;
    }

    // Seasoning vs Animal Fat guard
    const isSeasoningQuery = /\b(gewürz|seasoning|rub)\b/i.test(lowerQuery);
    if (isSeasoningQuery && (item.category === 'SPICES_OILS' || item.bls_code?.startsWith('Q')) && (candDe.includes('fett') || candDe.includes('schmalz') || candDe.includes('talg'))) {
      continue;
    }

    // Nutmeg vs Tree Nuts guard
    if (/\b(muskat|muskatnuss|nutmeg)\b/i.test(lowerQuery) && (item.category === 'NUTS_SEEDS' || item.bls_code?.startsWith('H1') || item.bls_code?.startsWith('H2') || candDe.includes('walnuss') || candDe.includes('haselnuss'))) {
      continue;
    }

    // Pure spice/seasoning vs Meat/Fish/Prepared Dishes guard
    const isPureSpiceQuery = /\b(pulver|powder|gewürz|seasoning|rub|salz|salt|flocken|flakes)\b/i.test(lowerQuery) && !/\b(fleisch|meat|fish|fisch|lachs|salmon|currywurst|suppe|soup)\b/i.test(lowerQuery);
    if (isPureSpiceQuery && (item.category === 'MEAT_FISH' || item.category === 'READY_MEALS' || item.bls_code?.startsWith('T') || item.bls_code?.startsWith('U') || item.bls_code?.startsWith('V') || item.bls_code?.startsWith('W') || item.bls_code?.startsWith('X') || item.bls_code?.startsWith('Y') || candDe.includes('geräuchert') || candDe.includes('gebraten') || candDe.includes('gegrillt') || candDe.includes('pommes'))) {
      continue;
    }

    // Broth vs Animal Fat guard
    const isBrothQuery = /\b(brühe|bouillon|broth|stock|fond)\b/i.test(lowerQuery);
    if (isBrothQuery && (item.category === 'SPICES_OILS' || item.bls_code?.startsWith('Q') || candDe.includes('fett') || candDe.includes('talg') || candDe.includes('schmalz'))) {
      continue;
    }

    // Pastry/Cookies vs Meat Substitute guard
    const isPastryQuery = /\b(keks|kuchen|torte|gebäck|cookie|biscuit|pastry)\b/i.test(lowerQuery);
    if (isPastryQuery && (item.bls_code?.startsWith('H91') || candDe.includes('schnitzel') || candDe.includes('bratwurst') || candDe.includes('frikadelle'))) {
      continue;
    }

    // Chili flakes vs Grain Flakes guard
    const isChiliFlakesQuery = /\b(chili|chilikörner|chiliflocken|pepper flakes)\b/i.test(lowerQuery);
    if (isChiliFlakesQuery && (item.category === 'GRAINS_PASTA' || candDe.includes('haferflocken') || candDe.includes('dinkelflocken'))) {
      continue;
    }

    filtered.push(item);
    if (filtered.length >= limit) break;
  }

  return filtered;
}

/**
 * Catalogue access handed to the tool-using resolver.
 *
 * Deliberately thin: the resolver drives the search itself, so this exposes the
 * MiniSearch index and the id maps as they are, without the candidate pre-filters
 * the old single-shot reranker needed.
 */
export const catalogueAccess: CatalogueAccess = {
  search(query: string, category?: string, limit = 12): CanonicalIngredient[] {
    const clean = normalizeSearchTerm(query) || query.toLowerCase().trim();
    if (!clean) return [];

    const cleanCategory = category ? normalizeCategory(category) : null;
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
    const clean = normalizeCategory(category) || category.toUpperCase().trim();
    const items = itemsByCategory.get(clean);
    if (!items) return [];
    // Simplest first: a caller scanning a category wants the staples, not the
    // long tail of prepared variants.
    return [...items]
      .sort((a, b) => getSimplicityScore(b) - getSimplicityScore(a))
      .slice(0, limit);
  },
};

/**
 * Stage 3: resolve one ingredient that no cheap stage could match.
 *
 * Checks the learned mapping store first, and only pays for the tool-using
 * resolver on a genuine miss. Whatever the resolver decides is written back to
 * the store, so the next recipe containing this food anywhere, for any user,
 * takes the cheap path.
 */
export async function resolveAndRemember(
  input: ResolverInput
): Promise<{ match: CanonicalIngredient | null; estimate: EstimatedNutrients | null; usage?: GeminiUsageInfo }> {
  const keys = buildMappingKeys(input.baseName, input.name);
  const category = (input.category || '').toUpperCase().trim();

  if (keys.length > 0) {
    const known = await lookupMapping(keys, category);
    if (known) {
      const item = known.blsCode ? catalogueAccess.get(known.blsCode) : null;
      return { match: item, estimate: known.estimatedNutrients };
    }
  }

  const resolved = await resolveIngredient(input, catalogueAccess);
  if (!resolved || resolved.budgetExhausted) {
    // Nothing trustworthy came back. Storing this would freeze a non-answer for
    // every future recipe, so leave the key unresolved and try again next time.
    return { match: null, estimate: null, usage: resolved?.usage };
  }

  const item = resolved.blsCode ? catalogueAccess.get(resolved.blsCode) : null;

  if (keys.length > 0) {
    await storeMapping(keys, category, {
      blsCode: item ? item.bls_code || item.id : null,
      resolution: item ? 'matched' : 'no_match',
      estimatedNutrients: item ? null : resolved.estimatedNutrients,
      source: 'agent',
      confidence: resolved.confidence,
      model: resolved.model,
      reasoning: resolved.reasoning,
    });
  }

  return { match: item, estimate: item ? null : resolved.estimatedNutrients, usage: resolved.usage };
}

/**
 * Finds a matching canonical ingredient: Fast-Path -> learned mapping store -> resolver.
 * (Convenience method for standalone lookups / unit tests.)
 */
export async function findCanonicalIngredient(
  name: string,
  baseName?: string,
  category?: string,
  synonyms?: string[],
  searchQueries?: string[],
  parentIngredient?: ParentIngredientInfo,
  modifier?: string,
  brand?: string,
  ingredientRef?: Ingredient
): Promise<CanonicalIngredient | null> {
  // 1. Synchronous Fast-Path
  // const fast = findFastPathMatch(name, baseName, category, synonyms, searchQueries, parentIngredient, modifier, brand);
  // if (fast && (!ingredientRef || isNutritionallyPlausible(ingredientRef, fast))) {
  //   return fast;
  // }

  // 2. Learned mapping store -> tool-using resolver
  const { match } = await resolveAndRemember({
    name,
    baseName,
    brand,
    modifier,
    category,
    synonyms,
    searchQueries,
    parentIngredient,
  });
  return match;
}

/**
 * Calculates the total weight in grams for a given amount, unit, and matched ingredient.
 * Prioritizes Gemini's estimated gramsPerUnit when available, with fallback to item standard units.
 */
export function calculateWeightGrams(
  amount: number,
  unit: string,
  item: CanonicalIngredient | null,
  gramsPerUnit?: number | null
): number {
  if (amount <= 0) return 0;
  const normUnit = normalizeUnit(unit);

  // 1. Direct grams / milliliters
  if (normUnit === 'g' || normUnit === 'ml') return amount;
  if (normUnit === 'kg' || normUnit === 'l') return amount * 1000;

  // 2. High-precision Gemini gramsPerUnit (when available > 0)
  if (gramsPerUnit !== undefined && gramsPerUnit !== null && gramsPerUnit > 0) {
    return amount * gramsPerUnit;
  }

  // 3. Specific standard unit weights from canonical BLS item (e.g. piece, slice, clove, tablespoon)
  if (item?.standard_units) {
    const std = item.standard_units as Record<string, number | undefined>;
    if (std[normUnit] !== undefined && std[normUnit]! > 0) {
      return amount * std[normUnit]!;
    }
  }

  // 4. Global standard defaults by unit
  const globalDefaults: Record<string, number> = {
    tablespoon: 15,
    teaspoon: 5,
    cup: 200,
    clove: 3,
    pinch: 0.5,
    slice: 25,
    piece: 80,
    pack: 250,
    can: 400,
    jar: 350,
    bunch: 80,
    handful: 30,
  };

  if (globalDefaults[normUnit] !== undefined) {
    return amount * globalDefaults[normUnit];
  }

  return amount * 100;
}

/**
 * Helper to apply matched canonical nutritional data to an ingredient and compute its macro values.
 */
export function applyCanonicalMatchToIngredient(
  ingredient: Ingredient,
  match: CanonicalIngredient | null,
  cachedEstimate?: EstimatedNutrients | null
): {
  matched: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  let effectiveMatch = match;
  if (effectiveMatch && !isNutritionallyPlausible(ingredient, effectiveMatch)) {
    effectiveMatch = null;
  }

  if (!effectiveMatch) {
    // Remixes echo the parent's match fields back from the model — drop them so an
    // unmatched ingredient never carries a stale canonical reference next to
    // LLM-estimated macros.
    ingredient.isVerified = false;
    ingredient.canonicalId = undefined;
    ingredient.matchedName = undefined;

    // A stored per-100 g estimate fills in only where the extraction produced no
    // number at all. It never overwrites the model's own per-quantity values,
    // which were computed with the recipe in view.
    if (cachedEstimate && !((ingredient.calories ?? 0) > 0)) {
      const grams = calculateWeightGrams(ingredient.amount, ingredient.unit, null, ingredient.gramsPerUnit);
      const factor = grams / 100;
      ingredient.calories = Math.round(cachedEstimate.calories * factor);
      ingredient.protein = Math.round(cachedEstimate.protein * factor * 10) / 10;
      ingredient.carbs = Math.round(cachedEstimate.carbs * factor * 10) / 10;
      ingredient.fat = Math.round(cachedEstimate.fat * factor * 10) / 10;
    }

    return {
      matched: false,
      calories: ingredient.calories ?? 0,
      protein: ingredient.protein ?? 0,
      carbs: ingredient.carbs ?? 0,
      fat: ingredient.fat ?? 0,
    };
  }

  const weightGrams = calculateWeightGrams(ingredient.amount, ingredient.unit, effectiveMatch, ingredient.gramsPerUnit);
  const factor = weightGrams / 100;

  // Populate gramsPerUnit on ingredient if missing
  if ((!ingredient.gramsPerUnit || ingredient.gramsPerUnit <= 0) && ingredient.amount > 0) {
    ingredient.gramsPerUnit = Math.round((weightGrams / ingredient.amount) * 10) / 10;
  }

  const cal = Math.round(effectiveMatch.nutrients_per_100g.calories * factor);
  const prot = Math.round(effectiveMatch.nutrients_per_100g.protein * factor * 10) / 10;
  const carb = Math.round(effectiveMatch.nutrients_per_100g.carbs * factor * 10) / 10;
  const fat = Math.round(effectiveMatch.nutrients_per_100g.fat * factor * 10) / 10;

  ingredient.canonicalId = effectiveMatch.id;
  ingredient.matchedName = effectiveMatch.name_de;
  ingredient.isVerified = true;
  ingredient.calories = cal;
  ingredient.protein = prot;
  ingredient.carbs = carb;
  ingredient.fat = fat;

  if (!ingredient.category || ingredient.category === 'OTHER') {
    ingredient.category = effectiveMatch.category;
  }

  return { matched: true, calories: cal, protein: prot, carbs: carb, fat };
}

/**
 * Matches and enriches a single ingredient.
 */
export async function matchAndEnrichIngredient(ingredient: Ingredient, groupCategory?: string): Promise<{
  matched: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}> {
  const effectiveCategory = ingredient.category || groupCategory;
  const match = await findCanonicalIngredient(
    ingredient.name,
    ingredient.baseName,
    effectiveCategory,
    ingredient.synonyms,
    ingredient.searchQueries,
    ingredient.parentIngredient,
    ingredient.modifier,
    ingredient.brand,
    ingredient
  );

  return applyCanonicalMatchToIngredient(ingredient, match);
}

/**
 * Enriches all ingredients in a recipe with canonical nutritional data and
 * computes the recipe-level nutritional values per serving.
 * 
 * Executes Fast-Path instantly in 0 ms, and gathers all remaining unverified items
 * into ONE single batch call to Gemini Flash-Lite for maximum speed and lowest cost.
 */
export async function enrichRecipeWithCanonicalIngredients(
  recipe: Recipe
): Promise<{ usage?: GeminiUsageInfo }> {
  if (!recipe || !recipe.ingredients) return {};

  const flatItems: Array<{ ing: Ingredient; groupName?: string; id: string }> = [];
  let itemCounter = 0;

  for (const group of recipe.ingredients) {
    if (!group.items) continue;
    for (const ing of group.items) {
      flatItems.push({ ing, groupName: group.name, id: `item_${itemCounter++}` });
    }
  }

  if (flatItems.length === 0) return {};

  const matchedCanonicalMap = new Map<string, CanonicalIngredient | null>();
  const estimateMap = new Map<string, EstimatedNutrients>();
  const unresolved: Array<{ id: string; input: ResolverInput }> = [];

  // Phase 1: Fast-Path for all items
  for (const { ing, groupName, id } of flatItems) {
    const effectiveCategory = ing.category || groupName;
    const fastMatch = findFastPathMatch(
      ing.name,
      ing.baseName,
      effectiveCategory,
      ing.synonyms,
      ing.searchQueries,
      ing.parentIngredient,
      ing.modifier,
      ing.brand
    );

    if (fastMatch && isNutritionallyPlausible(ing, fastMatch)) {
      matchedCanonicalMap.set(id, fastMatch);
    } else {
      unresolved.push({
        id,
        input: {
          name: ing.name,
          baseName: ing.baseName,
          brand: ing.brand,
          modifier: ing.modifier,
          category: effectiveCategory,
          synonyms: ing.synonyms,
          searchQueries: ing.searchQueries,
          parentIngredient: ing.parentIngredient,
        },
      });
    }
  }

  // Phase 2: Store lookup, then the tool-using resolver for whatever is left.
  // Fanned out because each resolver call is several turns; the resolver's own
  // global semaphore keeps the total across concurrent recipes in check.
  let totalPromptTokens = 0;
  let totalCandidateTokens = 0;
  let totalTokens = 0;
  let totalCostUsd = 0;
  let totalDurationMs = 0;
  let modelUsed: string | undefined;
  let resolverCallCount = 0;

  if (unresolved.length > 0) {
    const results = await mapWithConcurrency(unresolved, RECIPE_RESOLVE_CONCURRENCY, item =>
      resolveAndRemember(item.input)
    );

    for (let i = 0; i < unresolved.length; i++) {
      const { id } = unresolved[i];
      const { match, estimate, usage } = results[i];
      matchedCanonicalMap.set(id, match);
      if (!match && estimate) estimateMap.set(id, estimate);
      if (usage) {
        resolverCallCount++;
        modelUsed = usage.model ?? modelUsed;
        totalDurationMs += usage.durationMs ?? 0;
        if (usage.tokenUsage) {
          totalPromptTokens += usage.tokenUsage.promptTokens;
          totalCandidateTokens += usage.tokenUsage.candidateTokens;
          totalTokens += usage.tokenUsage.totalTokens;
        }
        if (usage.costEstimate) {
          totalCostUsd += usage.costEstimate.totalCostUsd;
        }
      }
    }
  }

  // Counters only steer store curation, so this must never block the extraction.
  void flushHitCounts();

  // Phase 3: Apply nutritional calculation to all recipe ingredients
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let matchedCalories = 0;

  for (const { ing, id } of flatItems) {
    const match = matchedCanonicalMap.get(id) || null;
    const res = applyCanonicalMatchToIngredient(ing, match, estimateMap.get(id) ?? null);
    totalCalories += res.calories;
    totalProtein += res.protein;
    totalCarbs += res.carbs;
    totalFat += res.fat;
    if (res.matched) matchedCalories += res.calories;
  }

  const servings = recipe.servings > 0 ? recipe.servings : 1;

  // The per-serving figure is derived, unconditionally. A recipe-level value the
  // source stated lives in `sourceNutritionalValues` and is shown alongside rather
  // than instead of this one — mixing both into this field is what previously made
  // it impossible to tell a BLS sum from a model guess.
  recipe.nutritionalValues = {
    calories: Math.round(totalCalories / servings),
    protein: Math.round((totalProtein / servings) * 10) / 10,
    carbs: Math.round((totalCarbs / servings) * 10) / 10,
    fat: Math.round((totalFat / servings) * 10) / 10,
  };

  // Share of the calories backed by BLS rather than by a Gemini estimate. A recipe
  // whose calories are dominated by unmatched ingredients must not claim to be
  // database-verified.
  recipe.nutritionCoverage = totalCalories > 0
    ? Math.round((matchedCalories / totalCalories) * 100) / 100
    : 0;

  const resolverUsage: GeminiUsageInfo | undefined = resolverCallCount > 0 ? {
    model: modelUsed,
    durationMs: totalDurationMs,
    tokenUsage: {
      promptTokens: totalPromptTokens,
      candidateTokens: totalCandidateTokens,
      totalTokens,
    },
    costEstimate: {
      inputCostUsd: 0,
      outputCostUsd: 0,
      totalCostUsd: parseFloat(totalCostUsd.toFixed(6)),
      totalCostFormatted: `$${totalCostUsd.toFixed(4)}`,
    },
  } : undefined;

  return { usage: resolverUsage };
}
