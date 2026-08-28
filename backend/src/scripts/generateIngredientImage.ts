import path from 'path';
import { CANONICAL_INGREDIENTS, type CanonicalIngredient } from '../data/canonicalIngredients.js';
import {
  generateIngredientIcon,
  findExistingIngredientImage,
  buildIngredientPrompt,
  getIngredientImagesDir,
} from '../ingredientImageService.js';

interface CliOptions {
  id?: string;
  search?: string;
  category?: string;
  batch?: number;
  concurrency: number;
  missingOnly: boolean;
  outDir: string;
  steps: number;
  promptOverride?: string;
  dryRun: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    outDir: getIngredientImagesDir(),
    steps: 4,
    concurrency: 5,
    missingOnly: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--missing' || arg === '--missing-only') {
      options.missingOnly = true;
    } else if (arg === '--batch' && args[i + 1]) {
      options.batch = parseInt(args[++i], 10) || 10;
    } else if ((arg === '--concurrency' || arg === '-c') && args[i + 1]) {
      options.concurrency = Math.max(1, Math.min(20, parseInt(args[++i], 10) || 5));
    } else if ((arg === '--category' || arg === '-cat') && args[i + 1]) {
      options.category = args[++i].toUpperCase();
    } else if (arg === '--id' && args[i + 1]) {
      options.id = args[++i];
    } else if ((arg === '--search' || arg === '--query' || arg === '-q') && args[i + 1]) {
      options.search = args[++i];
    } else if ((arg === '--out-dir' || arg === '--out' || arg === '-o') && args[i + 1]) {
      options.outDir = path.resolve(process.cwd(), args[++i]);
    } else if (arg === '--steps' && args[i + 1]) {
      options.steps = parseInt(args[++i], 10) || 4;
    } else if (arg === '--prompt' && args[i + 1]) {
      options.promptOverride = args[++i];
    } else if (!arg.startsWith('-') && !options.id) {
      if (arg.startsWith('bls_')) {
        options.id = arg;
      } else {
        options.search = arg;
      }
    }
  }

  return options;
}

function findIngredient(options: CliOptions): CanonicalIngredient | null {
  if (options.id) {
    const targetId = options.id.toLowerCase().trim();
    const found = CANONICAL_INGREDIENTS.find(
      (item) => item.id.toLowerCase() === targetId || item.product_code?.toLowerCase() === targetId
    );
    if (found) return found;
  }

  if (options.search) {
    const q = options.search.toLowerCase().trim();
    const found = CANONICAL_INGREDIENTS.find(
      (item) =>
        item.name_de.toLowerCase().includes(q) ||
        item.name_en.toLowerCase().includes(q) ||
        item.aliases.some((alias) => alias.toLowerCase().includes(q))
    );
    if (found) return found;
  }

  return null;
}

async function runBatch(targets: CanonicalIngredient[], options: CliOptions): Promise<void> {
  console.log(`\n🚀 Starte Batch-Generierung für ${targets.length} Zutaten (${options.concurrency} parallel)...`);
  if (options.dryRun) {
    console.log('✨ [DRY RUN] Keine API-Anfragen gesendet.');
    for (const t of targets) {
      console.log(`  - [${t.id}] ${t.name_de} (${t.name_en}) [${t.category}]`);
    }
    return;
  }

  let queueIndex = 0;
  let completed = 0;
  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  async function worker(workerId: number) {
    while (queueIndex < targets.length) {
      const item = targets[queueIndex++];
      const currentNum = ++completed;
      console.log(`[Worker ${workerId}] [${currentNum}/${targets.length}] Starte: ${item.name_de} (${item.id})...`);

      try {
        const result = await generateIngredientIcon(item, {
          outDir: options.outDir,
          steps: options.steps,
        });
        successCount++;
        console.log(`[Worker ${workerId}] ✅ ${item.name_de} fertig in ${(result.durationMs / 1000).toFixed(1)}s (${result.sizeKb} KB)`);
      } catch (err: any) {
        errorCount++;
        console.error(`[Worker ${workerId}] ❌ Fehler bei ${item.name_de} (${item.id}):`, err.message);
      }
    }
  }

  const workerCount = Math.min(options.concurrency, targets.length);
  const workers = Array.from({ length: workerCount }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n======================================================`);
  console.log(`🎉 Batch abgeschlossen in ${totalDuration}s!`);
  console.log(`  ✅ Erfolgreich: ${successCount}`);
  console.log(`  ❌ Fehler:      ${errorCount}`);
  console.log(`  📂 Zielordner:  ${options.outDir}`);
  console.log(`======================================================\n`);
}

async function main(): Promise<void> {
  const options = parseArgs();

  // Batch mode
  if (options.batch || options.missingOnly || (options.category && !options.id && !options.search)) {
    let targets = CANONICAL_INGREDIENTS;

    if (options.category) {
      targets = targets.filter((i) => i.category.toUpperCase() === options.category);
    }

    if (options.missingOnly) {
      targets = targets.filter((i) => !findExistingIngredientImage(i.id, options.outDir));
    }

    if (options.batch && options.batch > 0) {
      targets = targets.slice(0, options.batch);
    }

    if (targets.length === 0) {
      console.log('ℹ️ Keine passenden Zutaten für Batch gefunden.');
      return;
    }

    await runBatch(targets, options);
    return;
  }

  if (!options.id && !options.search) {
    console.error('❌ Fehler: Bitte gib eine Zutat-ID oder einen Suchbegriff an (oder nutze --batch).');
    console.log('\nVerwendung:');
    console.log('  npx tsx src/scripts/generateIngredientImage.ts bls_c133000');
    console.log('  npx tsx src/scripts/generateIngredientImage.ts --search "Haferflocken"');
    console.log('  npx tsx src/scripts/generateIngredientImage.ts --batch 10 --missing --concurrency 5');
    console.log('  npx tsx src/scripts/generateIngredientImage.ts --category FRUITS_VEGETABLES --batch 5');
    process.exit(1);
  }

  const ingredient = findIngredient(options);
  if (!ingredient) {
    console.error(`❌ Zutat nicht gefunden für ID="${options.id || ''}" / Suchbegriff="${options.search || ''}"`);
    process.exit(1);
  }

  const prompt = await buildIngredientPrompt(ingredient, { promptOverride: options.promptOverride });
  const existing = findExistingIngredientImage(ingredient.id, options.outDir);

  console.log('\n======================================================');
  console.log(`🥑 Zutat:       ${ingredient.name_de} (${ingredient.name_en})`);
  console.log(`🆔 ID:          ${ingredient.id} (Code: ${ingredient.product_code || '-'})`);
  console.log(`📁 Kategorie:   ${ingredient.category}`);
  console.log(`🎯 Prompt:      "${prompt}"`);
  console.log(`📂 Zielordner:  ${options.outDir}`);
  if (existing) {
    console.log(`ℹ️  Vorhandenes Bild: ${existing} (wird überschrieben)`);
  }
  console.log('======================================================\n');

  if (options.dryRun) {
    console.log('✨ [DRY RUN] Keine API-Anfrage gesendet.');
    return;
  }

  const result = await generateIngredientIcon(ingredient, {
    outDir: options.outDir,
    promptOverride: options.promptOverride,
    steps: options.steps,
  });

  console.log(`\n🎉 Erfolgreich generiert in ${result.durationMs}ms (~$0.0035 USD):`);
  console.log(`  💾 ${result.filePath} (${result.sizeKb} KB)`);
  console.log('');
}

main().catch((err) => {
  console.error('❌ Fehler bei der Generierung:', err);
  process.exit(1);
});
