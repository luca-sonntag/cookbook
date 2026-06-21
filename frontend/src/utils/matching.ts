import type { Ingredient } from '../types';

// Suffixes of kitchen tools/containers to avoid matching as ingredients
const nonIngredientSuffixes = [
  'hobel', 'presse', 'reibe', 'schäler', 'stampfer', 'mühle', 
  'topf', 'pfanne', 'blech', 'papier', 'messer', 'löffel', 
  'gabel', 'schüssel', 'teller', 'tasse', 'brett', 'waage', 
  'ofen', 'herd', 'dose', 'glas', 'flasche', 'packung', 
  'tüte', 'beutel'
];

/**
 * Checks if a word in the instruction text matches an ingredient target word.
 * Implements robust compound word rules to prevent false positives while allowing valid cooking terms.
 */
export function matchesIngredientWord(textWord: string, targetWord: string): boolean {
  if (textWord === targetWord) return true;

  // Prevent matching tools/containers/utensils as ingredients (e.g. Käsehobel should not match Käse)
  if (nonIngredientSuffixes.some(suffix => textWord.endsWith(suffix))) {
    return false;
  }

  // 1. Text word contains target word as a compound suffix (e.g., text: "streukäse", target: "käse")
  if (textWord.endsWith(targetWord)) {
    const prefix = textWord.slice(0, -targetWord.length);
    if (prefix.length >= 3) return true;
  }

  // 2. Text word contains target word as a compound prefix (e.g., text: "kartoffelscheiben", target: "kartoffel")
  if (textWord.startsWith(targetWord)) {
    const suffix = textWord.slice(targetWord.length);
    if (suffix.length >= 3) return true;
  }

  // 3. Target word contains text word as a compound suffix (e.g., text: "zwiebel", target: "frühlingszwiebel")
  if (targetWord.endsWith(textWord)) {
    const prefix = targetWord.slice(0, -textWord.length);
    if (prefix.length >= 3) return true;
  }

  // 4. Target word contains text word as a compound prefix (e.g., text: "knoblauch", target: "knoblauchzehen")
  if (targetWord.startsWith(textWord)) {
    const suffix = targetWord.slice(textWord.length);
    if (suffix.length >= 3) return true;
  }

  return false;
}

/**
 * Generates matching candidate words/phrases for a given ingredient.
 * Handles singular/plural variations and compound word parts.
 */
export function getIngredientTargets(ing: Ingredient): string[] {
  const targets: string[] = [];
  const stopwords = new Set([
    'rote', 'roter', 'rotes', 'gelbe', 'gelber', 'gelbes', 'grüne', 'grüner', 'grünes', 
    'weiße', 'weißer', 'weißes', 'frische', 'frischer', 'frisches', 'große', 'großer', 'großes', 
    'kleine', 'kleiner', 'kleines', 'light', 'mager', 'optional', 'getrocknete', 'getrockneter', 
    'getrocknetes', 'gemahlen', 'gemahlener', 'gemahlenes', 'frisch', 'kalt', 'warm', 'heiß', 
    'dünne', 'dünner', 'dünnes', 'dicke', 'dicker', 'dickes', 'flüssige', 'flüssiger', 'flüssiges', 
    'weiche', 'weicher', 'weiches', 'hart', 'harte', 'harter', 'hartes', 'grob', 'grobe', 
    'grober', 'grobes', 'fein', 'feine', 'feiner', 'feines', 'geschnitten', 'geschnittene', 
    'geschnittener', 'gehackt', 'gehackte', 'gehackter', 'gerieben', 'geriebene', 'geriebener', 
    'geschält', 'geschälte', 'geschälter', 'entkernt', 'entkernte', 'entkernter', 'stück', 'g', 'ml'
  ]);

  const addWordAndVariations = (rawWord: string) => {
    if (!rawWord) return;
    // Clean: split by comma or parentheses, trim, lowercase
    const cleaned = rawWord.split(/[,(]/)[0].trim().toLowerCase();
    if (!cleaned) return;

    // If it contains spaces, add the full phrase (e.g. "rote zwiebeln")
    if (cleaned.includes(' ')) {
      targets.push(cleaned);
    }

    // Split into word tokens
    const tokens = cleaned.split(/\s+/);
    tokens.forEach(token => {
      if (token.length <= 2 || stopwords.has(token)) return;

      // Add the token itself
      targets.push(token);

      // Singular / Plural / suffix endings:
      // If it ends with "n" (preceded by e, l, r) -> add singular (dropping "n")
      if (token.endsWith('n') && (token.endsWith('en') || token.endsWith('eln') || token.endsWith('ern'))) {
        targets.push(token.slice(0, -1));
      }
      // If it ends with "e" -> add plural (adding "n")
      if (token.endsWith('e')) {
        targets.push(token + 'n');
      }
      // If it ends with "er" (like "eier") -> add singular ("ei")
      if (token.endsWith('eier')) {
        targets.push(token.slice(0, -3));
      } else if (token.endsWith('er') && !['butter', 'ingwer', 'pfeffer', 'zucker'].includes(token)) {
        targets.push(token.slice(0, -2));
      }
      // If it ends with "s" -> add without "s" (e.g. "chilis" -> "chili")
      if (token.endsWith('s') && !['gorgonzola', 'parmesan', 'ananas', 'kokos'].includes(token)) {
        targets.push(token.slice(0, -1));
      }

      // German compound prefixes (e.g. "knoblauchzehen" -> "knoblauch")
      const compoundSuffixes = ['pulver', 'saft', 'mark', 'zehen', 'zehe', 'schoten', 'schote'];
      for (const suffix of compoundSuffixes) {
        if (token.endsWith(suffix) && token.length > suffix.length) {
          const prefix = token.slice(0, -suffix.length);
          if (prefix.length >= 3) {
            targets.push(prefix);
            // also handle prefix plural/singular if applicable (e.g. "tomaten" from "tomatenmark" -> "tomate")
            if (prefix.endsWith('en')) {
              targets.push(prefix.slice(0, -1));
            }
          }
        }
      }
    });
  };

  addWordAndVariations(ing.name);
  if (ing.baseName) {
    addWordAndVariations(ing.baseName);
  }

  // Return unique targets sorted by length descending
  return Array.from(new Set(targets)).sort((a, b) => b.length - a.length);
}
