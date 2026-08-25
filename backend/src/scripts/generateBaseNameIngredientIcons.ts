import path from 'path';
import { BASE_NAME_TO_CANONICAL_ID } from '../matching/baseNameMap.js';
import { CANONICAL_INGREDIENTS, type CanonicalIngredient } from '../data/canonicalIngredients.js';
import {
  generateIngredientIcon,
  findExistingIngredientImage,
  getIngredientImagesDir,
  getGenerationCostsSummary,
} from '../ingredientImageService.js';
import { packIngredientIcons } from '../ingredientIconPacker.js';

interface CliOptions {
  concurrency: number;
  missingOnly: boolean;
  dryRun: boolean;
  autoZip: boolean;
  limit?: number;
  outDir: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    concurrency: 5,
    missingOnly: true, // Default to missing only to avoid wasteful re-generation
    dryRun: false,
    autoZip: true,
    outDir: getIngredientImagesDir(),
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all' || arg === '--force') {
      options.missingOnly = false;
    } else if (arg === '--missing-only' || arg === '--missing') {
      options.missingOnly = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if ((arg === '--concurrency' || arg === '-c') && args[i + 1]) {
      options.concurrency = Math.max(1, Math.min(20, parseInt(args[++i], 10) || 5));
    } else if ((arg === '--limit' || arg === '-l') && args[i + 1]) {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === '--no-zip') {
      options.autoZip = false;
    } else if (arg === '--zip') {
      options.autoZip = true;
    } else if ((arg === '--out-dir' || arg === '-o') && args[i + 1]) {
      options.outDir = path.resolve(process.cwd(), args[++i]);
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  console.log(`\n==================================================`);
  console.log(`🍳 BaseNameMap Ingredient Icon Generator`);
  console.log(`==================================================`);
  console.log(`📂 Zielverzeichnis: ${options.outDir}`);
  console.log(`⚡ Parallelität:    ${options.concurrency} Worker`);
  console.log(`🔍 Modus:           ${options.missingOnly ? 'Nur fehlende Icons generieren' : 'Alle neu generieren (--force)'}`);
  if (options.dryRun) console.log(`✨ Dry-Run Modus:   Aktiv (keine API-Aufrufe)`);
  if (options.limit) console.log(`🔢 Limit:           Maximal ${options.limit} Einträge`);
  console.log(`--------------------------------------------------`);

  // 1. Sammle alle eindeutigen BLS-Codes aus der BASE_NAME_TO_CANONICAL_ID Map
  const uniqueBlsCodes = Array.from(new Set(Object.values(BASE_NAME_TO_CANONICAL_ID).map(c => c.toUpperCase())));
  console.log(`📊 BaseNameMap enthält ${Object.keys(BASE_NAME_TO_CANONICAL_ID).length} Einträge mit ${uniqueBlsCodes.length} eindeutigen BLS-Codes.`);

  // 2. Finde passende CanonicalIngredient-Objekte im Datenbestand
  const matchedTargets: CanonicalIngredient[] = [];
  const unmatchedCodes: string[] = [];

  for (const blsCode of uniqueBlsCodes) {
    const canonicalId = `bls_${blsCode.toLowerCase()}`;
    const found = CANONICAL_INGREDIENTS.find(
      (ing) => ing.id.toLowerCase() === canonicalId || ing.bls_code.toUpperCase() === blsCode
    );

    if (found) {
      matchedTargets.push(found);
    } else {
      unmatchedCodes.push(blsCode);
    }
  }

  if (unmatchedCodes.length > 0) {
    console.warn(`⚠️  ${unmatchedCodes.length} BLS-Codes wurden nicht im CANONICAL_INGREDIENTS Katalog gefunden:`, unmatchedCodes);
  }

  // 3. Filtere nach fehlenden Bildern (falls missingOnly aktiv)
  let queue = matchedTargets;
  if (options.missingOnly) {
    queue = matchedTargets.filter((item) => !findExistingIngredientImage(item.id, options.outDir));
  }

  if (options.limit && options.limit > 0) {
    queue = queue.slice(0, options.limit);
  }

  const existingCount = matchedTargets.length - queue.length;
  console.log(`📦 Status: ${existingCount}/${matchedTargets.length} Icons bereits vorhanden. Zu generieren: ${queue.length}\n`);

  if (queue.length === 0) {
    console.log('✅ Alle Icons für die BaseNameMap sind bereits vorhanden! Nichts zu tun.');
    return;
  }

  if (options.dryRun) {
    console.log('✨ [DRY RUN] Folgende Icons würden generiert werden:');
    queue.forEach((item, idx) => {
      console.log(`  ${idx + 1}. [${item.id}] ${item.name_de} (${item.name_en}) [${item.category}]`);
    });
    const estCost = (queue.length * 0.00352).toFixed(4);
    console.log(`\n💰 Geschätzte Gesamtkosten: ~$${estCost} USD (${queue.length} Bilder)`);
    return;
  }

  // 4. Parallele Batch-Generierung mit Concurrency Worker Pool
  let completed = 0;
  let succeeded = 0;
  let failed = 0;
  let queueIndex = 0;
  const total = queue.length;
  const startTime = Date.now();

  const worker = async (workerId: number) => {
    while (true) {
      let currentIndex: number;
      currentIndex = queueIndex++;
      if (currentIndex >= total) break;

      const item = queue[currentIndex];
      const prefix = `[Worker ${workerId}][${currentIndex + 1}/${total}]`;

      try {
        console.log(`${prefix} 🎨 Generiere: ${item.name_de} (${item.name_en || item.id})...`);
        const result = await generateIngredientIcon(item, { outDir: options.outDir });
        succeeded++;
        completed++;
        console.log(
          `${prefix} ✅ ${item.id} -> ${result.filename} (${result.durationMs}ms, ${result.sizeKb} KB, $${result.costs.totalCostUsd.toFixed(5)})`
        );
      } catch (err: any) {
        failed++;
        completed++;
        console.error(`${prefix} ❌ Fehler bei ${item.id} (${item.name_de}): ${err.message}`);
      }
    }
  };

  const pool = Array.from({ length: options.concurrency }, (_, i) => worker(i + 1));
  await Promise.all(pool);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const costSummary = getGenerationCostsSummary(options.outDir);

  console.log(`\n==================================================`);
  console.log(`🎉 Batch-Generierung abgeschlossen in ${durationSec}s`);
  console.log(`==================================================`);
  console.log(`✅ Erfolgreich: ${succeeded}`);
  console.log(`❌ Fehlgeschlagen: ${failed}`);
  console.log(`💰 Gesamtkosten-Historie: $${costSummary.totalCostUsd.toFixed(4)} (~${costSummary.approxEur.toFixed(2)} €) für ${costSummary.totalGenerations} Bilder`);
  console.log(`📂 Gespeichert in: ${options.outDir}`);

  if (succeeded > 0 && options.autoZip) {
    console.log(`\n🗜️  Aktualisiere ingredient-icons.zip Archiv...`);
    try {
      const zipRes = packIngredientIcons({ verbose: true });
      console.log(`📦 Zip-Archiv erfolgreich aktualisiert (${zipRes.fileCount} Dateien, ${zipRes.zipSizeMb} MB).`);
    } catch (err: any) {
      console.warn(`⚠️  Warnung beim Packen des Zip-Archivs: ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error('Fataler Fehler:', err);
  process.exit(1);
});
