import { test, describe } from 'node:test';
import assert from 'node:assert';
import { openFoodFactsAccess } from './openFoodFactsIndex.js';

describe('Open Food Facts Local SQLite Catalogue', () => {
  test('searches staples accurately with Purity-Boost ranking', () => {
    const hits = openFoodFactsAccess.search('Kartoffeln', undefined, 3);
    assert.ok(hits.length > 0, 'Should find hits for Kartoffeln');
    assert.ok(hits[0].name_de.toLowerCase().includes('kartoffel'), 'Top hit should be Kartoffel');
    assert.ok(hits[0].nutrients_per_100g.calories > 0, 'Should have positive calories');
    assert.ok(hits[0].nutrients_per_100g.calories < 120, 'Raw potato should be ~75 kcal, not chips');
  });

  test('finds branded trend items that were missing in BLS', () => {
    const hits = openFoodFactsAccess.search('Eatlean', undefined, 3);
    assert.ok(hits.length > 0, 'Should find Eatlean');
    assert.ok(hits[0].name_de.toLowerCase().includes('eatlean'), 'Should contain brand Eatlean');
    assert.ok(hits[0].nutrients_per_100g.protein > 30, 'Eatlean should have >30g protein');
    assert.ok(hits[0].nutrients_per_100g.fat < 5, 'Eatlean should be low fat (<5g)');
  });

  test('finds Asian trend items like Reispapier', () => {
    const hits = openFoodFactsAccess.search('Reispapier', undefined, 3);
    assert.ok(hits.length > 0, 'Should find Reispapier');
    assert.ok(hits[0].nutrients_per_100g.carbs > 70, 'Reispapier should be carbohydrate dense');
  });

  test('get resolves a product by its code/barcode', () => {
    const hits = openFoodFactsAccess.search('Butter', undefined, 1);
    assert.ok(hits.length > 0);
    const code = hits[0].product_code || hits[0].id;
    const direct = openFoodFactsAccess.get(code);
    assert.ok(direct !== null, 'Direct lookup by code should succeed');
    assert.strictEqual(direct?.id, code);
  });

  test('returns empty array gracefully for complete fantasy terms', () => {
    const hits = openFoodFactsAccess.search('XylophoniumFantasyUnobtainium999', undefined, 3);
    assert.strictEqual(hits.length, 0);
  });
});
