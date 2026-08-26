/**
 * Seeds the learned mapping store from the hand-maintained baseName dictionary.
 *
 * `BASE_NAME_TO_CANONICAL_ID` carries 300+ verified mappings that already answer
 * the bulk of everyday ingredients. Importing them means the store starts warm
 * instead of paying the resolver for "butter" and "egg" on day one.
 *
 * Rows land with source='static'. They are overwritable by the resolver and by
 * hand corrections, so this can be re-run safely: existing human corrections are
 * left alone, everything else is refreshed.
 *
 * Usage: npm run seed:mappings
 */

import { BASE_NAME_TO_CANONICAL_ID } from '../matching/baseNameMap.js';
import { canonicalizeBaseName } from '../matching/baseNameCanonical.js';
import { CANONICAL_INGREDIENTS } from '../data/canonicalIngredients.js';
import { getClient } from '../db.js';

interface SeedRow {
  mapping_key: string;
  category: string;
  product_code: string;
  resolution: 'matched';
  source: 'static';
  confidence: number;
  model: null;
  reasoning: string;
}

async function main(): Promise<void> {
  const byCode = new Map<string, (typeof CANONICAL_INGREDIENTS)[number]>();
  for (const item of CANONICAL_INGREDIENTS) {
    if (item.bls_code) byCode.set(item.bls_code.toUpperCase().trim(), item);
    byCode.set(item.id.toLowerCase().trim(), item);
  }

  const entries = Object.entries(BASE_NAME_TO_CANONICAL_ID);
  console.log(`Seeding ${entries.length} static baseName mappings...\n`);

  // Several base names canonicalize to the same key ("whole milk" and "milk" both
  // become "milk"). The first entry wins; a later, conflicting one is reported
  // rather than silently overwriting, because it usually means the dictionary
  // disagrees with itself.
  const rows = new Map<string, SeedRow>();
  const missing: string[] = [];
  const conflicts: string[] = [];

  for (const [baseName, code] of entries) {
    const item = byCode.get(code.toUpperCase().trim()) || byCode.get(('bls_' + code).toLowerCase().trim());
    if (!item) {
      missing.push(`${baseName} -> ${code}`);
      continue;
    }

    const key = canonicalizeBaseName(baseName);
    if (!key || key.length < 2) continue;

    const productCode = item.product_code || item.id;
    const existing = rows.get(key);
    if (existing) {
      if (existing.product_code !== productCode) {
        conflicts.push(`${key}: ${existing.product_code} (kept) vs ${productCode} (from "${baseName}")`);
      }
      continue;
    }

    rows.set(key, {
      mapping_key: key,
      category: '',
      product_code: productCode,
      resolution: 'matched',
      source: 'static',
      confidence: 1,
      model: null,
      reasoning: `Seeded from BASE_NAME_TO_CANONICAL_ID ("${baseName}")`,
    });
  }

  const payload = Array.from(rows.values());

  // Do not clobber hand corrections: whoever fixed a mapping by hand outranks the
  // dictionary this script reads from.
  const { data: humanRows, error: humanError } = await getClient()
    .from('ingredient_mappings')
    .select('mapping_key')
    .eq('source', 'human');
  if (humanError) throw new Error(`Failed to read human mappings: ${humanError.message}`);

  const protectedKeys = new Set((humanRows ?? []).map((r: { mapping_key: string }) => r.mapping_key));
  const writable = payload.filter(r => !protectedKeys.has(r.mapping_key));

  const CHUNK = 200;
  let written = 0;
  for (let i = 0; i < writable.length; i += CHUNK) {
    const chunk = writable.slice(i, i + CHUNK);
    const { error } = await getClient()
      .from('ingredient_mappings')
      .upsert(chunk, { onConflict: 'mapping_key,category', ignoreDuplicates: false });
    if (error) throw new Error(`Upsert failed at offset ${i}: ${error.message}`);
    written += chunk.length;
    console.log(`  wrote ${written}/${writable.length}`);
  }

  console.log(`\nSeeded ${written} mappings.`);
  if (protectedKeys.size > 0) {
    console.log(`Skipped ${payload.length - writable.length} key(s) already corrected by hand.`);
  }
  if (conflicts.length > 0) {
    console.log(`\n${conflicts.length} key collision(s) in the source dictionary:`);
    for (const line of conflicts) console.log(`  ${line}`);
  }
  if (missing.length > 0) {
    console.log(`\n${missing.length} dictionary entr(ies) point at a code not in BLS 4.0:`);
    for (const line of missing) console.log(`  ${line}`);
  }
}

main().catch(err => {
  console.error('Seeding failed:', err?.message || err);
  process.exit(1);
});
