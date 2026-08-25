import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findCanonicalIngredient,
  normalizeSearchTerm,
  normalizeUnit,
  calculateWeightGrams,
  enrichRecipeWithCanonicalIngredients,
  toEnglishSingular,
  isNutritionallyPlausible,
  catalogueAccess,
} from './ingredientMatcher.js';
import type { Recipe } from '../types.js';

describe('Ingredient Matcher & Normalizer (BLS 4.0 + Hybrid Search)', () => {
  describe('toEnglishSingular', () => {
    test('safely converts regular and irregular plurals without breaking words ending in s/ss/us/se', () => {
      // Plural to singular conversions
      assert.equal(toEnglishSingular('eggs'), 'egg');
      assert.equal(toEnglishSingular('onions'), 'onion');
      assert.equal(toEnglishSingular('carrots'), 'carrot');
      assert.equal(toEnglishSingular('potatoes'), 'potato');
      assert.equal(toEnglishSingular('tomatoes'), 'tomato');
      assert.equal(toEnglishSingular('strawberries'), 'strawberry');
      assert.equal(toEnglishSingular('raspberries'), 'raspberry');
      assert.equal(toEnglishSingular('leaves'), 'leaf');
      assert.equal(toEnglishSingular('shrimps'), 'shrimp');

      // Words ending in s/ss/us/is/se that MUST NOT be truncated
      assert.equal(toEnglishSingular('cheese'), 'cheese');
      assert.equal(toEnglishSingular('hummus'), 'hummus');
      assert.equal(toEnglishSingular('asparagus'), 'asparagus');
      assert.equal(toEnglishSingular('couscous'), 'couscous');
      assert.equal(toEnglishSingular('watercress'), 'watercress');
    });
  });

  describe('normalizeSearchTerm', () => {
    test('cleans parentheses, comma suffixes and extra modifiers', () => {
      assert.equal(normalizeSearchTerm('Zwiebel (fein gewürfelt)'), 'zwiebel');
      assert.equal(normalizeSearchTerm('Knoblauchzehe, gepresst'), 'knoblauchzehe');
      assert.equal(normalizeSearchTerm('Hähnchenbrustfilet (Bio-Qualität)'), 'hähnchenbrustfilet');
      assert.equal(normalizeSearchTerm('Olivenöl extra vergine'), 'olivenöl extra vergine');
    });
  });

  describe('normalizeUnit', () => {
    test('normalizes German and English culinary units', () => {
      assert.equal(normalizeUnit('g'), 'g');
      assert.equal(normalizeUnit('Gramm'), 'g');
      assert.equal(normalizeUnit('EL'), 'tablespoon');
      assert.equal(normalizeUnit('TL'), 'teaspoon');
      assert.equal(normalizeUnit('Stück'), 'piece');
      assert.equal(normalizeUnit('Zehe'), 'clove');
      assert.equal(normalizeUnit('Prise'), 'pinch');
    });
  });

  describe('findCanonicalIngredient', () => {
    test('matches German staples to BLS 4.0 database', async () => {
      const garlic = await findCanonicalIngredient('Knoblauchzehen', 'garlic', 'FRUITS_VEGETABLES', [], ['Knoblauch']);
      assert.ok(garlic);
      assert.ok(garlic.name_de.toLowerCase().includes('knoblauch'));

      const chicken = await findCanonicalIngredient('Hähnchenbrustfilet', 'chicken breast', 'MEAT_FISH', [], ['Hähnchenbrustfilet', 'Hähnchen Brustfilet']);
      assert.ok(chicken);
      assert.ok(chicken.name_de.toLowerCase().includes('hähnchen'));

      const onion = await findCanonicalIngredient('rote Zwiebel', 'onion', 'FRUITS_VEGETABLES', [], ['Zwiebel']);
      assert.ok(onion);
      assert.ok(onion.name_de.toLowerCase().includes('zwiebel'));

      const oats = await findCanonicalIngredient('Haferflocken', 'rolled oats', 'GRAINS_PASTA', [], ['Haferflocken']);
      assert.ok(oats);
      assert.ok(oats.name_de.toLowerCase().includes('hafer'));

      const egg = await findCanonicalIngredient('Eier', 'egg', 'DAIRY', [], ['Hühnerei', 'Ei']);
      assert.ok(egg);
      assert.ok(egg.name_de.toLowerCase().includes('ei'));
    });

    test('prefers lean variant when mager/lean is requested', async () => {
      const leanQuark = await findCanonicalIngredient('Magerquark', 'quark', 'DAIRY', ['Speisequark mager'], ['Magerquark', 'Speisequark mager']);
      assert.ok(leanQuark);
      assert.ok(leanQuark.name_de.toLowerCase().includes('mager') || leanQuark.name_de.toLowerCase().includes('quark'));
      assert.ok(leanQuark.nutrients_per_100g.fat <= 1.0);
    });

    test('matches cheeses like Gouda or Mozzarella', async () => {
      const gouda = await findCanonicalIngredient('Gouda gerieben', 'gouda', 'DAIRY', [], ['Gouda']);
      assert.ok(gouda);
      assert.ok(gouda.name_de.toLowerCase().includes('gouda'));
    });

    test('matches meat staples like Rinderhackfleisch', async () => {
      const beef = await findCanonicalIngredient('Rinderhack', 'ground beef', 'MEAT_FISH', [], ['Rinderhackfleisch', 'Rinderhack']);
      assert.ok(beef);
      assert.ok(beef.name_de.toLowerCase().includes('rind'));
    });

    test('returns null for unlisted exotic fantasy ingredients', async () => {
      const exotic = await findCanonicalIngredient('Unbekannte Fantasie-Geheimsauce XYZ 999', 'secret exotic fantasy sauce');
      assert.equal(exotic, null);
    });
  });

  describe('calculateWeightGrams', () => {
    test('calculates grams from piece/clove standard weights', async () => {
      const garlic = await findCanonicalIngredient('Knoblauch', 'garlic', 'FRUITS_VEGETABLES', [], ['Knoblauch']);
      assert.ok(garlic);
      const weight = calculateWeightGrams(2, 'clove', garlic);
      assert.equal(weight, 6); // 2 cloves * 3g = 6g
    });

    test('calculates realistic piece weights for fish fingers, toast slices and egg yolk', async () => {
      const fishSticks = await findCanonicalIngredient('Fischstäbchen', 'fish stick', 'MEAT_FISH');
      assert.ok(fishSticks);
      assert.equal(calculateWeightGrams(16, 'Stück', fishSticks), 480); // 16 * 30g = 480g

      const toast = await findCanonicalIngredient('Toastbrotscheiben', 'toast bread', 'GRAINS_PASTA');
      assert.ok(toast);
      assert.equal(calculateWeightGrams(8, 'Stück', toast), 200); // 8 * 25g = 200g

      const yolk = await findCanonicalIngredient('Eigelb', 'egg yolk', 'DAIRY');
      assert.ok(yolk);
      assert.equal(calculateWeightGrams(4, 'Stück', yolk), 80); // 4 * 20g = 80g
    });

    test('calculates grams from volume with density', async () => {
      const oil = await findCanonicalIngredient('Olivenöl', 'olive oil', 'SPICES_OILS', [], ['Olivenöl']);
      assert.ok(oil);
      const weight = calculateWeightGrams(2, 'tablespoon', oil);
      assert.equal(weight, 24); // 2 * 12g = 24g
    });
  });

  describe('enrichRecipeWithCanonicalIngredients', () => {
    test('enriches all recipe ingredients and aggregates per-serving macros', async () => {
      const recipe: Recipe = {
        title: 'Protein-Snack',
        description: 'Test Recipe',
        prepTime: 5,
        cookTime: 0,
        servings: 2,
        ingredients: [
          {
            name: 'Zutaten',
            items: [
              { name: 'Magerquark', baseName: 'quark', amount: 200, unit: 'g', category: 'DAIRY', searchQueries: ['Magerquark', 'Speisequark mager'] },
              { name: 'Haferflocken', baseName: 'rolled oats', amount: 100, unit: 'g', category: 'GRAINS_PASTA', searchQueries: ['Haferflocken'] },
              { name: 'Geheimpulver', amount: 10, unit: 'g', calories: 40, protein: 5, carbs: 2, fat: 1 },
            ],
          },
        ],
        instructions: [{ step: 1, description: 'Mixen' }],
        equipment: ['Schüssel'],
      };

      await enrichRecipeWithCanonicalIngredients(recipe);

      const items = recipe.ingredients[0].items;
      assert.equal(items[0].isVerified, true);
      assert.ok(items[0].canonicalId);
      assert.ok((items[0].calories ?? 0) > 100);

      assert.equal(items[1].isVerified, true);
      assert.ok(items[1].canonicalId);
      assert.ok((items[1].calories ?? 0) > 300);

      assert.equal(items[2].isVerified, false);
      assert.equal(items[2].canonicalId, undefined);

      assert.ok(recipe.nutritionalValues);
      assert.ok((recipe.nutritionalValues.calories ?? 0) > 200);
      assert.ok((recipe.nutritionalValues.protein ?? 0) > 15);

      // Only the unmatched "Geheimpulver" contributes non-BLS calories.
      assert.ok((recipe.nutritionCoverage ?? 0) > 0.8);
      assert.ok((recipe.nutritionCoverage ?? 0) < 1);
    });

    test('recomputes recipe totals even when a stale value is already present', async () => {
      const recipe: Recipe = {
        title: 'Kartoffeln',
        description: 'Test Recipe',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        ingredients: [
          {
            name: 'Zutaten',
            items: [
              { name: 'Kartoffeln', baseName: 'potatoes', amount: 400, unit: 'g', category: 'FRUITS_VEGETABLES' },
            ],
          },
        ],
        instructions: [{ step: 1, description: 'Kochen' }],
        equipment: ['Topf'],
        // A bogus figure of the kind a client PATCH or an echoing remix used to leave behind.
        nutritionalValues: { calories: 9999, protein: 999, carbs: 999, fat: 999 },
      };

      await enrichRecipeWithCanonicalIngredients(recipe);

      // 400 g potatoes at 83 kcal/100 g = 332 kcal total, over 2 servings.
      assert.equal(recipe.nutritionalValues?.calories, 166);
      assert.equal(recipe.nutritionCoverage, 1);
    });

    test('preserves accurate Gemini estimates for light/zero/diet foods and rejects incompatible BLS full-fat/sugar staples', async () => {
      const recipe: Recipe = {
        title: 'High-Protein Burger',
        description: 'Fitness Burger Recipe',
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        ingredients: [
          {
            name: 'Pantry',
            items: [
              // 1. Fat-reduced brand cheese (Eat Lean: ~180 kcal, 3.6g fat per 120g) -> MUST NOT map to Gouda 48% (455 kcal)!
              {
                name: 'Käse',
                brand: 'Eat Lean',
                modifier: 'fettreduziert',
                amount: 6,
                unit: 'Scheiben',
                gramsPerUnit: 20,
                calories: 180,
                protein: 36,
                carbs: 0,
                fat: 3.6,
                category: 'DAIRY',
              },
              // 2. Zero sugar ketchup (10 kcal per 6 TL) -> MUST NOT map to full-sugar Tomatenketchup (98 kcal/100g)!
              {
                name: 'Zero Ketchup',
                modifier: 'zuckerfrei',
                amount: 6,
                unit: 'TL',
                gramsPerUnit: 5,
                calories: 10,
                protein: 0,
                carbs: 2,
                fat: 0,
                category: 'SPICES_OILS',
              },
              // 3. Light balance salad cream (Miracle Whip: 100 kcal / 90g) -> MUST NOT map to 81% full-fat Mayo (675 kcal)!
              {
                name: 'Salatcreme',
                brand: 'Miracle Whip',
                modifier: 'fettreduziert',
                amount: 6,
                unit: 'EL',
                gramsPerUnit: 15,
                calories: 100,
                protein: 1,
                carbs: 5,
                fat: 9,
                category: 'SPICES_OILS',
              },
              // 4. Standard cooking oil (2 ml = 18 kcal) -> SHOULD map to Rapsöl/Speiseöl (18 kcal)!
              {
                name: 'Öl',
                baseName: 'cooking oil',
                amount: 2,
                unit: 'ml',
                gramsPerUnit: 1,
                calories: 18,
                protein: 0,
                carbs: 0,
                fat: 2,
                category: 'SPICES_OILS',
              },
              // 5. Standard chicken breast (420 g = 458 kcal) -> SHOULD map to Hähnchen Brustfilet!
              {
                name: 'Hähnchenfilet',
                baseName: 'chicken breast',
                amount: 420,
                unit: 'g',
                gramsPerUnit: 1,
                calories: 458,
                protein: 98,
                carbs: 0,
                fat: 8,
                category: 'MEAT_FISH',
              },
            ],
          },
        ],
        instructions: [{ step: 1, description: 'Braten' }],
        equipment: ['Pfanne'],
      };

      await enrichRecipeWithCanonicalIngredients(recipe);

      const items = recipe.ingredients[0].items;

      // Eat Lean Cheese: unverified, preserves Gemini estimate 180 kcal
      assert.equal(items[0].isVerified, false);
      assert.equal(items[0].calories, 180);

      // Zero Ketchup: unverified, preserves Gemini estimate 10 kcal
      assert.equal(items[1].isVerified, false);
      assert.equal(items[1].calories, 10);

      // Miracle Whip Balance: unverified, preserves Gemini estimate 100 kcal
      assert.equal(items[2].isVerified, false);
      assert.equal(items[2].calories, 100);

      // Cooking Oil: verified with BLS Speiseöl/Rapsöl
      assert.equal(items[3].isVerified, true);
      assert.equal(items[3].calories, 18);

      // Chicken breast: verified with BLS Hähnchen
      assert.equal(items[4].isVerified, true);
      assert.ok((items[4].calories ?? 0) >= 420 && (items[4].calories ?? 0) <= 500);

      // Total calories per serving should be around (180 + 10 + 100 + 18 + 460) / 2 = ~384 kcal, NOT 1200+ kcal!
      assert.ok((recipe.nutritionalValues?.calories ?? 0) < 500);
      assert.ok((recipe.nutritionalValues?.calories ?? 0) > 300);
    });
  });

  describe('isNutritionallyPlausible', () => {
    test('accurately identifies macro-inconsistent candidates', () => {
      // Gouda 48% candidate (379 kcal, 31.6g fat)
      const goudaCandidate = {
        id: 'bls_m402600',
        bls_code: 'M402600',
        name_de: 'Gouda 48 % Fett i. Tr.',
        category: 'DAIRY',
        nutrients_per_100g: { calories: 379, protein: 22.5, carbs: 0, fat: 31.6 },
      } as any;

      // Mayonnaise candidate (750 kcal, 81.2g fat)
      const mayoCandidate = {
        id: 'bls_q991000',
        bls_code: 'Q991000',
        name_de: 'Mayonnaise (Fertigprodukt)',
        category: 'SPICES_OILS',
        nutrients_per_100g: { calories: 750, protein: 1.2, carbs: 1.5, fat: 81.2 },
      } as any;

      // Ketchup candidate (98 kcal, 21.2g carbs)
      const ketchupCandidate = {
        id: 'bls_r141100',
        bls_code: 'R141100',
        name_de: 'Tomatenketchup',
        category: 'SPICES_OILS',
        nutrients_per_100g: { calories: 98, protein: 1.8, carbs: 21.2, fat: 0.2 },
      } as any;

      // 1. Eat Lean Cheese: 180 kcal for 120g (150 kcal/100g, 3g fat) vs Gouda (379 kcal, 31.6g fat) -> MUST FAIL
      assert.equal(
        isNutritionallyPlausible(
          { name: 'Käse', amount: 6, unit: 'Scheiben', gramsPerUnit: 20, calories: 180, fat: 3.6 },
          goudaCandidate
        ),
        false
      );

      // 2. Zero Ketchup: 10 kcal for 30g (33 kcal/100g, 2g carbs) vs Ketchup (98 kcal, 21.2g carbs) -> MUST FAIL
      assert.equal(
        isNutritionallyPlausible(
          { name: 'Zero Ketchup', amount: 6, unit: 'TL', gramsPerUnit: 5, calories: 10, carbs: 2 },
          ketchupCandidate
        ),
        false
      );

      // 3. Miracle Whip Balance: 100 kcal for 90g (111 kcal/100g, 10g fat) vs Mayonnaise (750 kcal, 81.2g fat) -> MUST FAIL
      assert.equal(
        isNutritionallyPlausible(
          { name: 'Salatcreme', amount: 6, unit: 'EL', gramsPerUnit: 15, calories: 100, fat: 9 },
          mayoCandidate
        ),
        false
      );

      // 4. Regular Gouda: 450 kcal for 120g (375 kcal/100g, 31g fat) vs Gouda -> MUST PASS
      assert.equal(
        isNutritionallyPlausible(
          { name: 'Gouda', amount: 6, unit: 'Scheiben', gramsPerUnit: 20, calories: 450, fat: 38 },
          goudaCandidate
        ),
        true
      );
    });
  });

  describe('catalogueAccess (resolver tools)', () => {
    test('search finds an entry by its German name', () => {
      const hits = catalogueAccess.search('Parmesan');
      assert.ok(hits.length > 0, 'expected at least one hit for "Parmesan"');
      assert.ok(hits.some(h => h.name_de.includes('Parmesan')));
    });

    test('search returns empty for a food the BLS genuinely lacks', () => {
      // "Sriracha" has no BLS entry. Returning nothing is what lets the resolver
      // answer no_match honestly instead of settling for a wrong nearest hit.
      assert.deepEqual(catalogueAccess.search('Sriracha'), []);
    });

    test('search honours the category filter', () => {
      const hits = catalogueAccess.search('Paprika', 'SPICES_OILS');
      assert.ok(hits.length > 0);
      assert.ok(hits.every(h => h.category === 'SPICES_OILS'));
    });

    test('get resolves a code with and without the bls_ prefix', () => {
      const withPrefix = catalogueAccess.get('bls_m111300');
      const without = catalogueAccess.get('M111300');
      assert.ok(withPrefix, 'prefixed code should resolve');
      assert.ok(without, 'bare code should resolve');
      assert.equal(withPrefix!.id, without!.id);
    });

    test('get rejects a code that does not exist', () => {
      // This is the guard that stops an invented code from being stored globally.
      assert.equal(catalogueAccess.get('Z999999'), null);
      assert.equal(catalogueAccess.get(''), null);
    });

    test('listCategory returns staples before prepared variants', () => {
      const items = catalogueAccess.listCategory('DAIRY', 20);
      assert.ok(items.length > 0 && items.length <= 20);
      assert.ok(items.every(i => i.category === 'DAIRY'));
    });

    test('listCategory returns nothing for an unknown category', () => {
      assert.deepEqual(catalogueAccess.listCategory('NOT_A_CATEGORY'), []);
    });
  });
});
