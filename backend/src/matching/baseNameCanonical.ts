/**
 * Deterministic canonicalization of ingredient base names into cache keys.
 *
 * The LLM produces `baseName` as free text, so the same food arrives as
 * "bacon cubes", "Bacon", "bacon" across recipes. That variance is what keeps a
 * learned mapping store from ever hitting. This module collapses those spellings
 * to one key — in code, with no model call, so the result never drifts.
 *
 * Design rule: the two failure directions are NOT symmetric.
 * - Stripping too little → a more specific key → cache miss → resolver runs. Costs a call.
 * - Stripping too much → two different foods share a key → wrong nutrition, stored
 *   globally, for everyone.
 * The removal list below is therefore deliberately conservative: it contains only
 * words describing cut, size or handling, never words that change what the food is.
 * "powder", "flour", "ground", "smoked", "dried" and friends are explicitly NOT
 * removed — "paprika powder" is a different food from "paprika".
 */

/**
 * Cut / size / handling words only. Removing any of these must never change which
 * food is meant. When in doubt, leave a word out of this list.
 */
const NOISE_WORDS = new Set([
  // English — cut & handling
  'chopped', 'diced', 'sliced', 'minced', 'shredded', 'grated', 'crushed', 'cubed',
  'cube', 'cubes', 'halved', 'quartered', 'drained', 'rinsed', 'washed', 'trimmed',
  'crumbled', 'torn', 'pitted', 'stemmed', 'cut',
  // English — size & quality
  'fresh', 'large', 'small', 'medium', 'big', 'ripe', 'good', 'quality',
  'optional', 'plain',
  // German — cut & handling
  'gehackt', 'gehackte', 'gehackter', 'gehacktes', 'gehackten',
  'gewürfelt', 'gewürfelte', 'gewürfelter', 'gewürfeltes', 'gewürfelten',
  'geschnitten', 'geschnittene', 'geschnittener', 'geschnittenes', 'geschnittenen',
  'gerieben', 'geriebene', 'geriebener', 'geriebenes', 'geriebenen',
  'zerkleinert', 'abgetropft', 'gehobelt', 'gehobelte', 'entsteint',
  // German — size & quality
  'frisch', 'frische', 'frischer', 'frisches', 'frischen',
  'groß', 'große', 'großer', 'großes', 'klein', 'kleine', 'kleiner', 'kleines',
  'mittelgroß', 'reif', 'reife', 'reifer', 'reifes',
]);

/**
 * Identity-bearing words. Present as a guard: if one of these is ever added to
 * NOISE_WORDS by accident, canonicalization would silently merge distinct foods.
 * They are filtered back out of the removal set at module load.
 */
const PROTECTED_WORDS = new Set([
  'powder', 'pulver', 'flour', 'mehl', 'oil', 'öl', 'juice', 'saft', 'sauce',
  'soße', 'paste', 'mark', 'milk', 'milch', 'cheese', 'käse', 'butter', 'cream',
  'sahne', 'flakes', 'flocken', 'seed', 'seeds', 'meal', 'syrup', 'sirup',
  'extract', 'vinegar', 'essig', 'broth', 'stock', 'brühe', 'fond', 'water',
  'wasser', 'zest', 'abrieb', 'peel', 'schale', 'ground', 'gemahlen', 'dried',
  'getrocknet', 'smoked', 'geräuchert', 'raw', 'roh', 'cooked', 'gekocht',
  'yolk', 'white', 'breast', 'thigh', 'leg', 'wing', 'mince', 'salt', 'salz',
  'sugar', 'zucker', 'honey', 'honig', 'wine', 'wein', 'beer', 'bier',
]);

for (const word of PROTECTED_WORDS) NOISE_WORDS.delete(word);

/** Leading articles and quantifiers that carry no food identity. */
const LEADING_FILLER = new Set(['a', 'an', 'the', 'of', 'some', 'ein', 'eine', 'der', 'die', 'das']);

/**
 * Safely converts an English plural food noun to its singular form.
 * Preserves nouns ending in -ss, -us, -is, -se, -cous (e.g. cheese, hummus, asparagus, couscous).
 */
export function toEnglishSingular(word: string): string {
  if (!word || word.length <= 2) return word;
  const lower = word.toLowerCase().trim();

  // 1. Never strip singular words ending in -ss, -us, -is, -se, -cous
  if (/(?:ss|us|is|cous|se)$/.test(lower)) {
    return lower;
  }

  // 2. Berries & -ies (strawberries -> strawberry, raspberries -> raspberry)
  if (lower.endsWith('ies')) {
    return lower.slice(0, -3) + 'y';
  }

  // 3. -oes (potatoes -> potato, tomatoes -> tomato)
  if (lower.endsWith('oes')) {
    return lower.slice(0, -2);
  }

  // 4. -leaves (leaves -> leaf)
  if (lower.endsWith('leaves')) {
    return lower.slice(0, -3) + 'f';
  }

  // 5. Standard Plural -s (eggs -> egg, onions -> onion, carrots -> carrot, shrimps -> shrimp)
  if (lower.endsWith('s') && !lower.endsWith('ss')) {
    return lower.slice(0, -1);
  }

  return lower;
}

/**
 * Reduces a raw base name to its deterministic cache key.
 *
 * Pure and synchronous: same input always yields the same output, independent of
 * model, prompt or recipe context. An empty or unusable input yields ''.
 */
export function canonicalizeBaseName(raw: string | undefined | null): string {
  if (!raw) return '';

  let text = String(raw)
    .toLowerCase()
    .normalize('NFC')
    // Parenthesised asides never carry the head noun.
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    // Quantities and units glued to the name ("500 g bacon").
    .replace(/\d+([.,]\d+)?/g, ' ')
    // Separators → space. Hyphens included so "cold-pressed" splits into words.
    .replace(/[,;:/\\+*&_."'`´’]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return '';

  let words = text.split(' ').filter(Boolean);

  // Drop leading filler, but never reduce the name to nothing.
  while (words.length > 1 && LEADING_FILLER.has(words[0])) words.shift();

  const kept = words.filter(w => !NOISE_WORDS.has(w));
  // If every word was noise the input was pure description — keep the original
  // words rather than emitting an empty key.
  words = kept.length > 0 ? kept : words;

  // Singularize the head noun only. English compounds keep their modifier intact
  // ("chicken breasts" → "chicken breast", never "chicken breas").
  const last = words.length - 1;
  words[last] = toEnglishSingular(words[last]);

  return words.join(' ').trim();
}

/**
 * Canonical primary mapping key under which a resolved mapping is stored.
 *
 * Prioritizes the model's standardized English `baseName` (e.g. "cottage cheese", "rolled oat").
 * If `baseName` is absent (legacy recipe text), falls back to canonicalized `rawName`.
 * Ensures exactly 1 single-source-of-truth entry per food in ingredient_mappings.
 */
export function buildMappingKeys(baseName?: string, rawName?: string): string[] {
  const primary = canonicalizeBaseName(baseName);
  if (primary && primary.length >= 2) {
    return [primary];
  }
  const fallback = canonicalizeBaseName(rawName);
  if (fallback && fallback.length >= 2) {
    return [fallback];
  }
  return [];
}
