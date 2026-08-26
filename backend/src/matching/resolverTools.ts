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
        description: 'Search food database (Open Food Facts DACH). Returns matching foods with codes and macros per 100g.',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            query: {
              type: FunctionDeclarationSchemaType.STRING,
              description: 'German or English search term, e.g. "Pecorino", "Parmesan", "Hähnchenbrust", "Reispapier".',
            },
            category: {
              type: FunctionDeclarationSchemaType.STRING,
              description: 'Optional category (e.g. DAIRY, MEAT_FISH, FRUITS_VEGETABLES, SPICES_OILS, GRAINS_PASTA).',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_ingredient',
        description: 'Fetches detailed nutrient breakdown for a specific food code / barcode.',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            bls_code: {
              type: FunctionDeclarationSchemaType.STRING,
              description: 'Exact food code / barcode, e.g. "5028482101690" or "off_123".',
            },
          },
          required: ['bls_code'],
        },
      },
      {
        name: 'submit_match',
        description: 'Submit final matched food code, or empty string with estimated per-100g macros if absent from database.',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            bls_code: {
              type: FunctionDeclarationSchemaType.STRING,
              description: 'Verified food code / barcode, or empty string if no accurate match exists.',
            },
            confidence: {
              type: FunctionDeclarationSchemaType.NUMBER,
              description: 'Confidence (0.0 to 1.0).',
            },
            reasoning: {
              type: FunctionDeclarationSchemaType.STRING,
              description: 'Short reason for choice or estimate.',
            },
            estimated_calories: {
              type: FunctionDeclarationSchemaType.NUMBER,
              description: 'Only if bls_code is empty: kcal / 100g.',
            },
            estimated_protein: {
              type: FunctionDeclarationSchemaType.NUMBER,
              description: 'Only if bls_code is empty: protein (g) / 100g.',
            },
            estimated_carbs: {
              type: FunctionDeclarationSchemaType.NUMBER,
              description: 'Only if bls_code is empty: carbs (g) / 100g.',
            },
            estimated_fat: {
              type: FunctionDeclarationSchemaType.NUMBER,
              description: 'Only if bls_code is empty: fat (g) / 100g.',
            },
          },
          required: ['bls_code', 'confidence'],
        },
      },
    ],
  },
];

export const SYSTEM_INSTRUCTION = `You match recipe ingredients to entries of the food database (Open Food Facts DACH).

Rules:
1. Prefer plain, unprocessed foods over prepared, canned or seasoned dishes ("Kartoffel" -> raw potato). Supermarket store brands (e.g. Rewe Bio, Edeka, Ja!, K-Bio, Gut & Günstig, Dennree, Alnatura) for raw staples (potatoes, garlic, onions, eggs, butter, milk) ARE valid plain food matches.
2. Never confuse ground spices with fresh produce ("Paprikapulver" is spice, NOT bell pepper; "Knoblauchpulver" is NOT fresh garlic).
3. Match exact cut/animal (chicken breast != turkey or pork).
4. For branded or special trend foods (e.g. "Eatlean", "Reispapier", "Sriracha", "Skyr", "Buldak"), select the exact matching product entry.
5. If the database lacks an accurate match, submit empty bls_code with estimated per-100g nutrients. An honest estimate is far better than a wrong match.
6. If one of the initial candidates is accurate, call submit_match directly without searching. Otherwise search with search_ingredients.`;

export function buildPrompt(input: ResolverInput, initialCandidates?: CanonicalIngredient[]): string {
  const lines = [`Ingredient: "${input.name}"`];
  if (input.baseName) lines.push(`Base name: "${input.baseName}"`);
  if (input.brand) lines.push(`Brand: "${input.brand}"`);
  if (input.modifier) lines.push(`Modifier: "${input.modifier}"`);
  if (input.category) lines.push(`Category: ${input.category}`);
  if (input.synonyms?.length) lines.push(`Synonyms: ${input.synonyms.join(', ')}`);
  if (input.searchQueries?.length) {
    lines.push(`Suggested search: ${input.searchQueries.join(', ')}`);
  }

  if (initialCandidates && initialCandidates.length > 0) {
    lines.push('', 'Top candidates from food database:');
    for (const c of initialCandidates) {
      const code = c.bls_code || c.id;
      const n = c.nutrients_per_100g;
      lines.push(`- [${code}] ${c.name_de} (${c.category}) | 100g: ${n.calories} kcal, ${n.protein}g P, ${n.carbs}g C, ${n.fat}g F`);
    }
    lines.push('', 'If a candidate fits, submit_match immediately. Otherwise use search_ingredients.');
  } else {
    lines.push('', 'Find the matching food entry or submit estimate.');
  }

  return lines.join('\n');
}

export function compact(item: CanonicalIngredient): Record<string, unknown> {
  const n = item.nutrients_per_100g;
  return {
    code: item.bls_code || item.id,
    name: item.name_de,
    category: item.category,
    per_100g: `${n.calories} kcal | ${n.protein}P | ${n.carbs}C | ${n.fat}F`,
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
      const hits = catalogue.search(query, category, 6);
      return hits.length > 0 ? { results: hits.map(compact) } : { results: [] };
    }
    case 'get_ingredient': {
      const code = String(args.bls_code ?? '').trim();
      const item = catalogue.get(code);
      return item ? withNutrients(item) : { error: `No food entry with code "${code}".` };
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
    return { rejected: `No food entry with code "${rawCode}". Search again and submit a code that exists.` };
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
