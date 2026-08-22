import path from 'path';
import { CANONICAL_INGREDIENTS, type CanonicalIngredient } from '../data/canonicalIngredients.js';
import {
  generateIngredientIcon,
  findExistingIngredientImage,
  buildIngredientPrompt,
  INGREDIENT_IMAGES_DIR,
} from '../ingredientImageService.js';

interface CliOptions {
  id?: string;
  search?: string;
  outDir: string;
  steps: number;
  promptOverride?: string;
  dryRun: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    outDir: INGREDIENT_IMAGES_DIR,
    steps: 4,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
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
      (item) => item.id.toLowerCase() === targetId || item.bls_code.toLowerCase() === targetId
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

async function main(): Promise<void> {
  const options = parseArgs();

  if (!options.id && !options.search) {
    console.error('❌ Fehler: Bitte gib eine Zutat-ID oder einen Suchbegriff an.');
    console.log('\nVerwendung:');
    console.log('  npx tsx src/scripts/generateIngredientImage.ts bls_c133000');
    console.log('  npx tsx src/scripts/generateIngredientImage.ts --search "Haferflocken"');
    console.log('  npx tsx src/scripts/generateIngredientImage.ts bls_c133000 --dry-run');
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
  console.log(`🆔 ID:          ${ingredient.id} (BLS: ${ingredient.bls_code})`);
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
