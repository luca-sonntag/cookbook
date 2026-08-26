/**
 * Proof of Concept: Open Food Facts (OFF) API Integration
 *
 * Demonstrates querying Open Food Facts for modern branded, trend,
 * and fitness foods that are typically missing from the German BLS 4.0 database.
 *
 * Usage:
 *   npx tsx src/scripts/pocOpenFoodFacts.ts
 */

export interface OpenFoodFactsProduct {
  code: string;
  name: string;
  brand?: string;
  nutrientsPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar?: number;
    fiber?: number;
  };
}

export async function searchOpenFoodFacts(
  query: string,
  limit = 3
): Promise<OpenFoodFactsProduct[]> {
  const clean = query.trim();
  if (!clean) return [];

  const url = new URL('https://de.openfoodfacts.org/cgi/search.pl');
  url.searchParams.set('search_terms', clean);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', String(limit));
  url.searchParams.set(
    'fields',
    'code,product_name,product_name_de,product_name_en,brands,nutriments'
  );

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'CookbookApp/1.0.0 (https://cookbook.app; contact: dev@cookbook.app)',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`OpenFoodFacts API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { products?: any[] };
  const products = data.products || [];

  const results: OpenFoodFactsProduct[] = [];

  for (const p of products) {
    const nutriments = p.nutriments || {};
    let calories = Number(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0);
    if (!calories && nutriments['energy_100g']) {
      calories = Math.round(Number(nutriments['energy_100g']) / 4.184);
    }

    const protein = Number(nutriments['proteins_100g'] ?? nutriments['proteins'] ?? 0);
    const carbs = Number(nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? 0);
    const fat = Number(nutriments['fat_100g'] ?? nutriments['fat'] ?? 0);
    const sugar = Number(nutriments['sugars_100g'] ?? nutriments['sugars'] ?? 0);
    const fiber = Number(nutriments['fiber_100g'] ?? nutriments['fiber'] ?? 0);

    const name = p.product_name_de || p.product_name || p.product_name_en;
    if (!name) continue;

    // Discard entries with no calorie data at all
    if (calories <= 0 && protein <= 0 && carbs <= 0 && fat <= 0) continue;

    results.push({
      code: p.code || '',
      name: name.trim(),
      brand: p.brands ? String(p.brands).trim() : undefined,
      nutrientsPer100g: {
        calories: Math.round(calories),
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,
        sugar: Math.round(sugar * 10) / 10,
        fiber: Math.round(fiber * 10) / 10,
      },
    });
  }

  return results;
}

async function main(): Promise<void> {
  console.log('='.repeat(70));
  console.log('🔬 Open Food Facts (OFF) API - Proof of Concept for Trend Foods');
  console.log('='.repeat(70) + '\n');

  const testQueries = [
    'Eatlean Cheese',
    'Reispapier',
    'Miracle Whip Balance',
    'Sriracha',
    'Buldak Carbonara',
    'Gochujang',
    'High Protein Pudding Schoko',
    'Alpro Soja ungesüßt',
  ];

  for (const query of testQueries) {
    const t0 = Date.now();
    try {
      const results = await searchOpenFoodFacts(query, 2);
      const dur = Date.now() - t0;
      console.log(`🔎 Query: "${query}" (⏱️ ${dur}ms)`);

      if (results.length === 0) {
        console.log('   ❌ Keine Treffer gefunden.\n');
        continue;
      }

      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        const n = item.nutrientsPer100g;
        const brandStr = item.brand ? ` [Marke: ${item.brand}]` : '';
        console.log(
          `   [${i + 1}] ${item.name}${brandStr}\n` +
          `       Barcode: ${item.code}\n` +
          `       100g: ${n.calories} kcal | ${n.protein}g Protein | ${n.carbs}g Carbs | ${n.fat}g Fett`
        );
      }
      console.log();
    } catch (err: any) {
      console.error(`   ❌ Fehler bei "${query}":`, err?.message || err);
    }
    // Small polite delay between requests
    await new Promise(r => setTimeout(r, 250));
  }

  console.log('='.repeat(70));
  console.log('✅ PoC Test erfolgreich abgeschlossen.');
  console.log('='.repeat(70));
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
  main().catch(console.error);
}
