/**
 * Stage 3: multi-turn, tool-using ingredient resolver.
 *
 * Replaces the single-shot reranker, which could only ever pick from ten
 * pre-filtered candidates. That fixed window is why the matcher accumulated a
 * long list of hand-written guard clauses: when the right entry was not among the
 * ten, the model had no way to ask for it and would settle for the least wrong
 * one. Here the model searches the BLS catalogue itself and keeps searching until
 * it is satisfied, or reports honestly that the food is not in the database.
 *
 * Every result is written to the mapping store by the caller, so a given food is
 * resolved once for all users rather than once per recipe.
 */

import {
  GoogleGenerativeAI,
  FunctionDeclarationSchemaType,
  type FunctionCall,
  type GenerateContentResult,
  type Part,
} from '@google/generative-ai';
import { config } from '../config.js';
import type { CanonicalIngredient } from '../data/canonicalIngredients.js';
import type { EstimatedNutrients } from './mappingStore.js';
import type { ParentIngredientInfo } from '../types.js';

export interface ResolverInput {
  name: string;
  baseName?: string;
  brand?: string;
  modifier?: string;
  category?: string;
  synonyms?: string[];
  searchQueries?: string[];
  parentIngredient?: ParentIngredientInfo;
}

export interface ResolverResult {
  /** BLS code when the catalogue has an accurate entry, null when it genuinely does not. */
  blsCode: string | null;
  /** Model's own estimate per 100 g, only meaningful when blsCode is null. */
  estimatedNutrients: EstimatedNutrients | null;
  confidence: number | null;
  reasoning: string | null;
  model: string;
  /** True when the loop was cut short by the turn or time budget. */
  budgetExhausted: boolean;
}

/** Catalogue access the resolver is given. Injected so this module stays testable. */
export interface CatalogueAccess {
  search(query: string, category?: string, limit?: number): CanonicalIngredient[];
  get(blsCode: string): CanonicalIngredient | null;
  listCategory(category: string, limit?: number): CanonicalIngredient[];
}

const MAX_TURNS = Math.max(2, config.INGREDIENT_RESOLVER_MAX_TURNS);
const TURN_TIMEOUT_MS = 20_000;
/**
 * Ceiling on resolver calls in flight across the whole process, not per recipe.
 * Per-recipe concurrency alone would multiply by the number of recipes being
 * extracted at once and walk straight into the provider's rate limit.
 */
const GLOBAL_CONCURRENCY = Math.max(1, config.INGREDIENT_RESOLVER_CONCURRENCY);

let genAIInstance: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI | null {
  if (!genAIInstance && config.GEMINI_API_KEY) {
    genAIInstance = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }
  return genAIInstance;
}

// ── Global semaphore ─────────────────────────────────────────────────────────

let active = 0;
const waiting: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (active < GLOBAL_CONCURRENCY) {
    active++;
    return;
  }
  await new Promise<void>(resolve => waiting.push(resolve));
  active++;
}

function releaseSlot(): void {
  active--;
  const next = waiting.shift();
  if (next) next();
}

/**
 * Runs `tasks` with at most `limit` in flight, preserving input order in the result.
 * Used to fan out the ingredients of one recipe; the global semaphore above still
 * caps the total across concurrent recipes.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}

// ── Tool declarations ────────────────────────────────────────────────────────

const TOOLS = [
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

const SYSTEM_INSTRUCTION = `You are a nutrition scientist matching recipe ingredients to entries of the German BLS 4.0 food database.

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

// ── Resolver ─────────────────────────────────────────────────────────────────

function buildPrompt(input: ResolverInput): string {
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

function compact(item: CanonicalIngredient): Record<string, unknown> {
  return {
    bls_code: item.bls_code || item.id,
    name_de: item.name_de,
    name_en: item.name_en || '',
    category: item.category,
  };
}

function withNutrients(item: CanonicalIngredient): Record<string, unknown> {
  return { ...compact(item), nutrients_per_100g: item.nutrients_per_100g };
}

function runTool(call: FunctionCall, catalogue: CatalogueAccess): unknown {
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

function readSubmission(
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

  // The code must exist. A model can invent a plausible-looking code, and this
  // result is about to be stored and reused for every future recipe.
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

/**
 * Resolves one ingredient against the BLS catalogue.
 *
 * Bounded by turn count and wall clock: a resolver that keeps searching must not
 * be able to hold up an extraction. On exhaustion the caller gets
 * `budgetExhausted` and decides what to fall back to.
 */
export async function resolveIngredient(
  input: ResolverInput,
  catalogue: CatalogueAccess
): Promise<ResolverResult | null> {
  if (!config.INGREDIENT_RESOLVER_ENABLED) return null;

  const genAI = getGenAI();
  if (!genAI) return null;

  const modelName = config.GEMINI_RERANKER_MODEL;
  await acquireSlot();

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      tools: TOOLS as never,
      generationConfig: { temperature: 0 },
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const chat = model.startChat();
    let message: string | Part[] = buildPrompt(input);

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response: GenerateContentResult = await withTimeout(chat.sendMessage(message), TURN_TIMEOUT_MS);
      const calls: FunctionCall[] = response.response.functionCalls() ?? [];

      if (calls.length === 0) {
        // No tool call and no submission: the model answered in prose, which it
        // was told not to do. Nothing usable to store.
        return null;
      }

      const submission = calls.find(c => c.name === 'submit_match');
      if (submission) {
        const outcome = readSubmission(submission, catalogue, modelName);
        if (!('rejected' in outcome)) return outcome;
        message = [
          {
            functionResponse: {
              name: 'submit_match',
              response: { error: outcome.rejected },
            },
          },
        ];
        continue;
      }

      message = calls.map(call => ({
        functionResponse: {
          name: call.name,
          response: runTool(call, catalogue) as object,
        },
      }));
    }

    return {
      blsCode: null,
      estimatedNutrients: null,
      confidence: null,
      reasoning: 'Turn budget exhausted before the model submitted a match.',
      model: modelName,
      budgetExhausted: true,
    };
  } catch (err: any) {
    console.warn(`[ingredientResolver] "${input.name}" failed (${modelName}):`, err?.message || err);
    return null;
  } finally {
    releaseSlot();
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Resolver turn timed out after ${ms} ms`)), ms).unref?.()
    ),
  ]);
}
