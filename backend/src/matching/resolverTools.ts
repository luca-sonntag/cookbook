import {
  FunctionDeclarationSchemaType,
  type FunctionCall,
} from '@google/generative-ai';
import type { CanonicalIngredient } from '../data/canonicalIngredients.js';
import type { EstimatedNutrients } from './mappingStore.js';
import type { ResolverInput, ResolverResult, CatalogueAccess } from './ingredientResolver.js';

export const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'search_ingredients',
        description:
          'Full-text search over the German BLS 4.0 food database. Returns matching entries with their code, German name, English name and category. Use German search terms - the database is German. Call this repeatedly with different wordings until you find the right entry.',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            query: {
              type: FunctionDeclarationSchemaType.STRING,
              description: 'German search term, e.g. "Pecorino" or "Schafskäse hart".',
            },
            category: {
              type: FunctionDeclarationSchemaType.STRING,
              description:
                'Optional category filter. One of: FRUITS_VEGETABLES, DAIRY, MEAT_FISH, GRAINS_PASTA, BAKING_COOKING, SPICES_OILS, SWEETS_SNACKS, BEVERAGES, CANNED_PRESERVED, BREAD_BAKERY, READY_MEALS, FROZEN, REFRIGERATED_CONVENIENCE.',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_ingredient',
        description:
          'Fetches one BLS entry by its exact code, including nutrients per 100 g. Use this to sanity-check a candidate before selecting it - if the nutrients are implausible for the ingredient, it is the wrong entry.',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            bls_code: {
              type: FunctionDeclarationSchemaType.STRING,
              description: 'Exact BLS code as returned by search_ingredients, e.g. "M306400".',
            },
          },
          required: ['bls_code'],
        },
      },
      {
        name: 'list_category',
        description:
          'Lists entries of one category. Useful when search terms keep failing and you want to see what the database actually contains for a food group.',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            category: {
              type: FunctionDeclarationSchemaType.STRING,
              description: 'Category key, e.g. "DAIRY".',
            },
          },
          required: ['category'],
        },
      },
      {
        name: 'submit_match',
        description:
          'Reports the final answer. Call exactly once, as the last step, after you have verified the entry with get_ingredient.',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            bls_code: {
              type: FunctionDeclarationSchemaType.STRING,
              description:
                'The verified BLS code, or an empty string if the database has no accurate entry for this ingredient.',
            },
            confidence: {
              type: FunctionDeclarationSchemaType.NUMBER,
              description: 'How certain you are, from 0 to 1.',
            },
            reasoning: {
              type: FunctionDeclarationSchemaType.STRING,
              description: 'One short sentence on why this entry is the right one, or why none fits.',
            },
            estimated_calories: {
              type: FunctionDeclarationSchemaType.NUMBER,
              description: 'Only when bls_code is empty: estimated kcal per 100 g.',
            },
            estimated_protein: {
              type: FunctionDeclarationSchemaType.NUMBER,
              description: 'Only when bls_code is empty: estimated protein in g per 100 g.',
            },
            estimated_carbs: {
              type: FunctionDeclarationSchemaType.NUMBER,
              description: 'Only when bls_code is empty: estimated carbohydrates in g per 100 g.',
            },
            estimated_fat: {
              type: FunctionDeclarationSchemaType.NUMBER,
              description: 'Only when bls_code is empty: estimated fat in g per 100 g.',
            },
          },
          required: ['bls_code', 'confidence'],
        },
      },
    ],
  },
];

export const SYSTEM_INSTRUCTION = `You are a nutrition scientist matching recipe ingredients to entries of the German BLS 4.0 food database.

Work like this:
1. Search the database with search_ingredients. The database is German, so search in German. If the first wording finds nothing useful, try a synonym, a broader term, or the base food.
2. Verify your best candidate with get_ingredient and check that its nutrients per 100 g are plausible for this ingredient.
3. Report with submit_match.

Rules that decide the answer:
- Prefer the plain, raw, unprepared form of a food over a prepared dish, a canned version, or a seasoned or fried variant. For "Kartoffel" choose raw potato, not potato salad or french fries.
- Never confuse a dried ground spice with the fresh produce it comes from. "Paprikapulver" is a spice, NOT a bell pepper. "Knoblauchpulver" is not fresh garlic.
- Match the actual animal and cut. Chicken is not turkey, is not pork, and breast is not liver.
- If the database genuinely has no accurate entry for this ingredient, submit an empty bls_code together with your own nutrient estimate per 100 g. That is a correct and useful answer.
- NEVER select an entry just because it appeared in a search result. A wrong match is worse than no match, because it is stored and reused for every future recipe.`;

export function buildPrompt(input: ResolverInput): string {
  const lines = [`Ingredient as written in the recipe: "${input.name}"`];
  if (input.baseName) lines.push(`English base name: "${input.baseName}"`);
  if (input.brand) lines.push(`Brand: "${input.brand}"`);
  if (input.modifier) lines.push(`Modifier / Preparation: "${input.modifier}"`);
  if (input.category) lines.push(`Category: ${input.category}`);
  if (input.synonyms?.length) lines.push(`Synonyms: ${input.synonyms.join(', ')}`);
  if (input.searchQueries?.length) {
    lines.push(`Suggested German search terms: ${input.searchQueries.join(', ')}`);
  }
  lines.push('', 'Find the matching BLS entry.');
  return lines.join('\n');
}

export function compact(item: CanonicalIngredient): Record<string, unknown> {
  return {
    bls_code: item.bls_code || item.id,
    name_de: item.name_de,
    name_en: item.name_en || '',
    category: item.category,
  };
}

export function withNutrients(item: CanonicalIngredient): Record<string, unknown> {
  return { ...compact(item), nutrients_per_100g: item.nutrients_per_100g };
}

export function runTool(call: FunctionCall, catalogue: CatalogueAccess): unknown {
  const args = (call.args ?? {}) as Record<string, unknown>;

  switch (call.name) {
    case 'search_ingredients': {
      const query = String(args.query ?? '').trim();
      if (!query) return { error: 'query must not be empty' };
      const category = args.category ? String(args.category).toUpperCase().trim() : undefined;
      const hits = catalogue.search(query, category, 12);
      return hits.length > 0
        ? { results: hits.map(compact) }
        : { results: [], hint: 'Nothing found. Try a different wording, a synonym, or the base food.' };
    }
    case 'get_ingredient': {
      const code = String(args.bls_code ?? '').trim();
      const item = catalogue.get(code);
      return item ? withNutrients(item) : { error: `No BLS entry with code "${code}".` };
    }
    case 'list_category': {
      const category = String(args.category ?? '').toUpperCase().trim();
      const items = catalogue.listCategory(category, 60);
      return items.length > 0
        ? { results: items.map(compact), truncated: items.length >= 60 }
        : { error: `Unknown category "${category}".` };
    }
    default:
      return { error: `Unknown tool "${call.name}".` };
  }
}

export function readSubmission(
  call: FunctionCall,
  catalogue: CatalogueAccess,
  model: string
): ResolverResult | { rejected: string } {
  const args = (call.args ?? {}) as Record<string, unknown>;
  const rawCode = String(args.bls_code ?? '').trim();
  const confidence = typeof args.confidence === 'number' ? args.confidence : null;
  const reasoning = args.reasoning ? String(args.reasoning) : null;

  if (!rawCode) {
    const estimate: EstimatedNutrients = {
      calories: Number(args.estimated_calories) || 0,
      protein: Number(args.estimated_protein) || 0,
      carbs: Number(args.estimated_carbs) || 0,
      fat: Number(args.estimated_fat) || 0,
    };
    return {
      blsCode: null,
      estimatedNutrients: estimate.calories > 0 ? estimate : null,
      confidence,
      reasoning,
      model,
      budgetExhausted: false,
    };
  }

  const item = catalogue.get(rawCode);
  if (!item) {
    return { rejected: `No BLS entry with code "${rawCode}". Search again and submit a code that exists.` };
  }

  return {
    blsCode: item.bls_code || item.id,
    estimatedNutrients: null,
    confidence,
    reasoning,
    model,
    budgetExhausted: false,
  };
}
