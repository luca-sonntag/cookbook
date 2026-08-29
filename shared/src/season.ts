import type { HolidayEvent, Season, SharedRecipe } from './types.js';

/**
 * Northern-hemisphere meteorological seasons (month-based).
 * DACH/Europe audience.
 */
export function getSeason(date: Date): Season {
  const m = date.getUTCMonth(); // 0=Jan
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

/** Seasonal produce / dish keywords (German + English), matched as substrings. */
export const SEASON_KEYWORDS: Record<Season, string[]> = {
  spring: [
    'spargel', 'asparagus', 'rhabarber', 'rhubarb', 'bärlauch', 'radieschen',
    'radish', 'erdbeere', 'strawberry', 'spinat', 'spinach', 'frühling', 'spring',
    'lamm', 'lamb', 'morchel', 'morel', 'kresse', 'cress'
  ],
  summer: [
    'tomate', 'tomato', 'zucchini', 'aubergine', 'eggplant', 'beere', 'berry',
    'wassermelone', 'watermelon', 'mais', 'corn', 'pfirsich', 'peach', 'grill', 'bbq',
    'salat', 'salad', 'melone', 'melon', 'gazpacho', 'gurke', 'cucumber', 'paprika',
    'sommer', 'summer'
  ],
  autumn: [
    'kürbis', 'pumpkin', 'squash', 'apfel', 'apple', 'pilz', 'mushroom',
    'kastanie', 'chestnut', 'birne', 'pear', 'kohl', 'cabbage', 'rote bete', 'beetroot',
    'zwetschke', 'zwetschge', 'plum', 'herbst', 'autumn', 'maronen', 'feige', 'fig', 'walnuss', 'walnut'
  ],
  winter: [
    'grünkohl', 'kale', 'rosenkohl', 'sprout', 'orange', 'mandarine', 'clementine',
    'zimt', 'cinnamon', 'lebkuchen', 'gingerbread', 'eintopf', 'stew', 'suppe', 'soup',
    'fondue', 'raclette', 'braten', 'roast', 'glühwein', 'winter'
  ],
};

/** Keywords for the currently active season. */
export function seasonKeywords(season: Season): string[] {
  return SEASON_KEYWORDS[season];
}

/** Common keyword dictionaries for thematic discovery and planning. */
export const COMFORT_KEYWORDS = [
  'pizza', 'burger', 'pasta', 'taco', 'nacho', 'fries', 'fritten', 'pommes',
  'comfort', 'cheese', 'käse', 'snack', 'dip', 'fingerfood', 'wings', 'wrap',
  'sandwich', 'toast', 'overload', 'cremig', 'creamy', 'fondue'
];

export const BRUNCH_KEYWORDS = [
  'pancake', 'waffel', 'waffle', 'ei', 'egg', 'omelett', 'omelette', 'rührei',
  'toast', 'brunch', 'frühstück', 'breakfast', 'smoothie', 'bowl', 'porridge',
  'müsli', 'croissant', 'crepe', 'stulle', 'avocado'
];

export const PASTA_KEYWORDS = [
  'pasta', 'spaghetti', 'penne', 'nudel', 'noodle', 'lasagne', 'gnocchi',
  'tagliatelle', 'tortellini', 'macaroni', 'ravioli', 'fusilli', 'rigatoni',
  'bolognese', 'carbonara', 'pesto', 'alfredo'
];

export const GRILL_KEYWORDS = [
  'grill', 'bbq', 'steak', 'burger', 'spieß', 'skewer', 'marinade',
  'kräuterbutter', 'kotelett', 'rippchen', 'ribs', 'würstchen'
];

/**
 * Short-term calendar events and genuine holiday windows (DACH-flavoured).
 * Note: Long-term seasons (e.g. 3-month summer grilling) are handled via
 * seasonal produce and day-of-week rotation, not as overriding holiday events.
 */
export function getActiveHolidays(date: Date): HolidayEvent[] {
  const m = date.getUTCMonth() + 1; // 1=Jan
  const d = date.getUTCDate();
  const events: HolidayEvent[] = [];

  const inWindow = (mm: number, from: number, to: number) => m === mm && d >= from && d <= to;

  // Valentine's Day (Feb 10 - Feb 14)
  if (inWindow(2, 10, 14)) {
    events.push({
      id: 'valentine',
      label: "Valentine's Day (romantic dinner for two)",
      titleKey: 'catalog.recommendations.holidayValentine',
      defaultTitle: 'Valentinstag: Dinner for Two',
      badgeEmoji: '❤️',
      keywords: ['schokolade', 'chocolate', 'dessert', 'herz', 'romantic', 'pasta', 'steak', 'kuchen', 'cake'],
    });
  }

  // Oktoberfest / Bavarian specials (Sept 18 - Oct 5)
  if ((m === 9 && d >= 18) || (m === 10 && d <= 5)) {
    events.push({
      id: 'oktoberfest',
      label: 'Oktoberfest (Bavarian hearty dishes & pretzels)',
      titleKey: 'catalog.recommendations.holidayOktoberfest',
      defaultTitle: 'Bayerische Schmankerl & Brezen',
      badgeEmoji: '🥨',
      keywords: ['brezel', 'pretzel', 'obazda', 'schweinebraten', 'haxe', 'knödel', 'dumpling', 'sauerkraut', 'bier'],
    });
  }

  // Halloween & Pumpkin Harvest Peak (Oct 26 - Nov 1)
  if ((m === 10 && d >= 26) || (m === 11 && d === 1)) {
    events.push({
      id: 'halloween',
      label: 'Halloween & Pumpkin specials',
      titleKey: 'catalog.recommendations.holidayHalloween',
      defaultTitle: 'Kürbis & Herbst-Spezial',
      badgeEmoji: '🎃',
      keywords: ['kürbis', 'pumpkin', 'squash', 'cremesuppe', 'muffin', 'zimt', 'apfel'],
    });
  }

  // Christmas baking & holiday feasts (Dec 15 - Dec 26)
  if (m === 12 && d >= 15 && d <= 26) {
    events.push({
      id: 'christmas',
      label: 'Christmas (festive baking & roasts)',
      titleKey: 'catalog.recommendations.holidayChristmas',
      defaultTitle: 'Festliche Weihnachts-Küche',
      badgeEmoji: '🎄',
      keywords: ['keks', 'cookie', 'plätzchen', 'braten', 'roast', 'lebkuchen', 'gingerbread', 'gans', 'goose', 'ente', 'duck', 'zimt', 'cinnamon', 'vanillekipferl'],
    });
  }

  // Silvester / New Year (Dec 29 - Jan 2)
  if ((m === 12 && d >= 29) || (m === 1 && d <= 2)) {
    events.push({
      id: 'new_year',
      label: "New Year's Eve (fondue, raclette, party finger food)",
      titleKey: 'catalog.recommendations.holidayNewYear',
      defaultTitle: 'Silvester-Snacks & Party-Food',
      badgeEmoji: '🎉',
      keywords: ['fondue', 'raclette', 'dip', 'fingerfood', 'party', 'bowle', 'snack', 'häppchen', 'blüte', 'crostini'],
    });
  }

  return events;
}

/**
 * Lowercased haystack of a recipe's searchable text: title, tags, and ingredient
 * baseNames and names.
 */
export function recipeHaystack(recipe: SharedRecipe): string {
  const parts: string[] = [recipe.title || ''];
  if (recipe.description) parts.push(recipe.description);
  if (recipe.tags) parts.push(...recipe.tags);
  for (const group of recipe.ingredients || []) {
    for (const item of group.items || []) {
      if (item.baseName) parts.push(item.baseName);
      if (item.name) parts.push(item.name);
    }
  }
  return parts.join(' ').toLowerCase();
}

/** Count how many of `keywords` appear in the recipe's haystack. */
export function countKeywordMatches(recipe: SharedRecipe, keywords: string[]): number {
  const hay = recipeHaystack(recipe);
  let n = 0;
  for (const kw of keywords) {
    const k = kw.trim().toLowerCase();
    if (k && hay.includes(k)) n++;
  }
  return n;
}
