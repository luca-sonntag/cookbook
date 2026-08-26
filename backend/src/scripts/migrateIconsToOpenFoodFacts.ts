import fs from 'node:fs';
import path from 'node:path';
import canonicalData from '../data/canonicalIngredientsData.json' with { type: 'json' };
import { openFoodFactsAccess } from '../matching/openFoodFactsIndex.js';
import { packIngredientIcons, getIngredientImagesDir } from '../ingredientIconPacker.js';

interface CliOptions {
  dryRun: boolean;
  limit?: number;
  keepBls: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    dryRun: false,
    keepBls: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--keep-bls') {
      options.keepBls = true;
    } else if ((arg === '--limit' || arg === '-l') && args[i + 1]) {
      options.limit = parseInt(args[++i], 10);
    }
  }

  return options;
}

function cleanBaseSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function main() {
  const options = parseArgs();
  const iconsDir = getIngredientImagesDir();

  console.log(`\n==================================================`);
  console.log(`🔄 Open Food Facts Icon Migration`);
  console.log(`==================================================`);
  console.log(`📂 Icon-Verzeichnis: ${iconsDir}`);
  if (options.dryRun) console.log(`✨ Modus:           DRY RUN (keine Dateisystem-Änderungen)`);
  console.log(`--------------------------------------------------`);

  if (!fs.existsSync(iconsDir)) {
    throw new Error(`Icon directory does not exist: ${iconsDir}`);
  }

  const allFiles = fs.readdirSync(iconsDir);
  const blsFiles = allFiles.filter(f => f.startsWith('bls_') && f.endsWith('.webp'));
  console.log(`📦 Gefundene BLS Icon-Dateien: ${blsFiles.length}`);

  const dataMap = new Map(canonicalData.map((item: any) => [item.id.toLowerCase(), item]));

  const migrationPlan: Array<{
    oldFile: string;
    oldPath: string;
    newCode: string;
    newCodeFile: string;
    newSlugFile: string;
    productName: string;
    brand?: string;
  }> = [];

  const unmatched: string[] = [];

  for (const file of blsFiles) {
    const id = file.replace(/\.webp$/i, '').toLowerCase();
    const item = dataMap.get(id);
    if (!item) {
      unmatched.push(file);
      continue;
    }

    // Try finding best matching OFF product
    const query = item.name_de.split(/[,(]/)[0].trim();
    let hits = openFoodFactsAccess.search(query, undefined, 3);
    if (hits.length === 0 && item.name_en) {
      hits = openFoodFactsAccess.search(item.name_en.split(/[,(]/)[0].trim(), undefined, 3);
    }

    if (hits.length > 0) {
      const topHit = hits[0];
      const productCode = topHit.product_code || topHit.id;
      const slug = cleanBaseSlug(query);

      migrationPlan.push({
        oldFile: file,
        oldPath: path.join(iconsDir, file),
        newCode: productCode,
        newCodeFile: `${productCode}.webp`,
        newSlugFile: slug ? `${slug}.webp` : `${productCode}.webp`,
        productName: topHit.name_de,
        brand: topHit.aliases?.[2] || undefined,
      });
    } else {
      unmatched.push(file);
    }
  }

  console.log(`✅ Erfolgreich gemappt: ${migrationPlan.length} / ${blsFiles.length}`);
  if (unmatched.length > 0) {
    console.log(`⚠️  Kein direkter OFF-Treffer für: ${unmatched.length} Dateien (bleiben unberührt)`);
  }

  if (options.dryRun) {
    console.log(`\n✨ [DRY RUN] Vorschau der ersten 20 Migrationen:`);
    console.table(migrationPlan.slice(0, 20).map(m => ({
      Alter_Name: m.oldFile,
      Neuer_OFF_Code: m.newCodeFile,
      Neuer_Slug_Name: m.newSlugFile,
      Produkt_Name: m.productName,
    })));
    return;
  }

  // Execute migration
  console.log(`\n🚀 Führe Migration aus (ausschließlich eindeutige Slugs)...`);
  let renamedCount = 0;
  const processedSlugs = new Set<string>();

  for (const item of migrationPlan) {
    const targetSlugPath = path.join(iconsDir, item.newSlugFile);

    if (!processedSlugs.has(item.newSlugFile)) {
      processedSlugs.add(item.newSlugFile);
      fs.copyFileSync(item.oldPath, targetSlugPath);
      renamedCount++;
    }

    // Delete old BLS file unless --keep-bls is set
    if (!options.keepBls && fs.existsSync(item.oldPath) && item.oldPath !== targetSlugPath) {
      fs.unlinkSync(item.oldPath);
    }
  }

  console.log(`✨ ${renamedCount} eindeutige Slug-Icons erfolgreich gespeichert.`);

  // Re-pack ingredient-icons.zip
  console.log(`\n🗜️  Packe ingredient-icons.zip neu...`);
  const zipResult = packIngredientIcons({ verbose: true });
  console.log(`📦 Zip-Archiv erfolgreich aktualisiert: ${zipResult.fileCount} Dateien (${zipResult.zipSizeMb} MB) in ${zipResult.durationMs}ms`);
}

main().catch(err => {
  console.error('Fataler Fehler bei der Icon-Migration:', err);
  process.exit(1);
});
