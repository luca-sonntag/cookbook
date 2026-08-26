/**
 * Backfill script: Populates the `ingredient_mappings` table by resolving ingredients
 * from the oldest recipes in the database using the learned mapping store & Gemini resolver.
 *
 * Ingredients already in `ingredient_mappings` (e.g. from static seed or earlier runs)
 * hit the store/cache with 0 API calls. Unmapped ingredients are resolved via Gemini
 * and automatically persisted to `ingredient_mappings` for all future extractions.
 *
 * Usage:
 *   npm run mappings:backfill
 *   npm run mappings:backfill -- --limit=100 --offset=0
 *   npm run mappings:backfill -- --all
 */

import { getClient, rowToRecipe, type RecipeRow } from '../db.js';
import { resolveAndRemember } from '../matching/ingredientMatcher.js';
import { mapWithConcurrency, type ResolverInput } from '../matching/ingredientResolver.js';
import { flushHitCounts } from '../matching/mappingStore.js';
import type { Recipe } from '../types.js';

interface CliOptions {
  limit: number;
  offset: number;
  all: boolean;
  concurrency: number;
  verbose: boolean;
}

interface ItemToResolve {
  recipeId?: string;
  recipeTitle: string;
  input: ResolverInput;
}

function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = { limit: 50, offset: 0, all: false, concurrency: 3, verbose: false };

  for (const arg of args) {
    if (arg === '--all') options.all = true;
    else if (arg.startsWith('--limit=')) options.limit = Math.max(1, parseInt(arg.split('=')[1], 10) || 50);
    else if (arg.startsWith('--offset=')) options.offset = Math.max(0, parseInt(arg.split('=')[1], 10) || 0);
    else if (arg.startsWith('--concurrency=')) options.concurrency = Math.max(1, parseInt(arg.split('=')[1], 10) || 3);
    else if (arg === '--verbose' || arg === '-v') options.verbose = true;
  }
  return options;
}

function extractIngredients(recipe: Recipe): ResolverInput[] {
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) return [];
  const inputs: ResolverInput[] = [];

  for (const group of recipe.ingredients) {
    if (!group?.items || !Array.isArray(group.items)) continue;
    for (const ing of group.items) {
      if (!ing || !ing.name) continue;
      inputs.push({
        name: ing.name,
        baseName: ing.baseName,
        brand: ing.brand,
        modifier: ing.modifier,
        category: ing.category || group.name,
        synonyms: ing.synonyms,
        searchQueries: ing.searchQueries,
        parentIngredient: ing.parentIngredient,
      });
    }
  }

  return inputs;
}

async function main(): Promise<void> {
  const options = parseCliArgs();
  const client = getClient();

  console.log('='.repeat(60));
  console.log('Ingredient Mappings Backfill (Oldest Recipes)');
  console.log(`Limit: ${options.all ? 'ALL' : options.limit} | Offset: ${options.offset} | Concurrency: ${options.concurrency}`);
  console.log('='.repeat(60) + '\n');

  const PAGE_SIZE = 100;
  let currentOffset = options.offset;
  let remainingLimit = options.all ? Number.MAX_SAFE_INTEGER : options.limit;

  let totalRecipesScanned = 0;
  let totalIngredients = 0;
  let cacheHits = 0;
  let resolverCalls = 0;
  let matchedBlsCount = 0;
  let noMatchEstimatedCount = 0;
  let totalCostUsd = 0;
  let totalTokens = 0;

  while (remainingLimit > 0) {
    const fetchCount = Math.min(PAGE_SIZE, remainingLimit);
    const { data, error } = await client
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: true })
      .range(currentOffset, currentOffset + fetchCount - 1);

    if (error) {
      throw new Error(`Failed to fetch recipes at offset ${currentOffset}: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('No more recipes found.');
      break;
    }

    console.log(`Fetched batch of ${data.length} recipe(s) (Offset: ${currentOffset})...`);

    for (let rIdx = 0; rIdx < data.length; rIdx++) {
      const row = data[rIdx] as RecipeRow;
      const recipe = rowToRecipe(row);
      totalRecipesScanned++;

      const ingredientInputs = extractIngredients(recipe);
      if (ingredientInputs.length === 0) {
        if (options.verbose) {
          console.log(`[${totalRecipesScanned}] Recipe "${recipe.title}" (${recipe.id}): 0 ingredients, skipping.`);
        }
        continue;
      }

      console.log(
        `\n[${totalRecipesScanned}] Processing "${recipe.title}" (${recipe.id}) - ${ingredientInputs.length} ingredient(s)...`
      );

      const items: ItemToResolve[] = ingredientInputs.map(input => ({
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        input,
      }));

      totalIngredients += items.length;

      const results = await mapWithConcurrency(items, options.concurrency, async item => {
        const res = await resolveAndRemember(item.input);
        return { item, res };
      });

      for (const { item, res } of results) {
        const nameDisplay = item.input.baseName || item.input.name;
        if (res.usage) {
          resolverCalls++;
          totalTokens += res.usage.tokenUsage?.totalTokens ?? 0;
          totalCostUsd += res.usage.costEstimate?.totalCostUsd ?? 0;
          const target = res.match ? `BLS ${res.match.bls_code || res.match.id} (${res.match.name_de})` : 'NO_MATCH (Estimated)';
          console.log(`  🤖 [Gemini Resolver] "${nameDisplay}" -> ${target}`);
        } else {
          cacheHits++;
          const target = res.match ? `BLS ${res.match.bls_code || res.match.id}` : 'Store cached';
          if (options.verbose) {
            console.log(`  ⚡ [Store Hit] "${nameDisplay}" -> ${target}`);
          }
        }

        if (res.match) {
          matchedBlsCount++;
        } else if (res.estimate) {
          noMatchEstimatedCount++;
        }
      }

      await flushHitCounts();
    }

    currentOffset += data.length;
    if (!options.all) {
      remainingLimit -= data.length;
    }

    if (data.length < fetchCount) {
      break;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Backfill Summary:');
  console.log(`  Recipes scanned:     ${totalRecipesScanned}`);
  console.log(`  Total ingredients:   ${totalIngredients}`);
  console.log(`  Store / Cache hits:  ${cacheHits}`);
  console.log(`  Gemini tool calls:   ${resolverCalls}`);
  console.log(`  BLS matches:         ${matchedBlsCount}`);
  console.log(`  Estimates (no match):${noMatchEstimatedCount}`);
  console.log(`  Total tokens used:   ${totalTokens}`);
  console.log(`  Estimated LLM cost:  $${totalCostUsd.toFixed(4)}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('\n❌ Backfill failed:', err?.message || err);
  process.exit(1);
});
