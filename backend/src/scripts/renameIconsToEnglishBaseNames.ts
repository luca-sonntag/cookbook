import fs from 'node:fs';
import path from 'node:path';
import canonicalData from '../data/canonicalIngredientsData.json' with { type: 'json' };
import { BASE_NAME_TO_CANONICAL_ID } from '../matching/baseNameMap.js';
import { packIngredientIcons, getIngredientImagesDir } from '../ingredientIconPacker.js';

interface CliOptions {
  dryRun: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
  };
}

function cleanSlug(name: string): string {
  return name
    .toLowerCase()
    .split(/[,(]/)[0]
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function main() {
  const options = parseArgs();
  const iconsDir = getIngredientImagesDir();

  console.log(`\n==================================================`);
  console.log(`🇬🇧 Rename Ingredient Icons to English BaseNames`);
  console.log(`==================================================`);
  console.log(`📂 Icons Dir: ${iconsDir}`);
  if (options.dryRun) console.log(`✨ Mode:      DRY RUN (preview only)`);
  console.log(`--------------------------------------------------`);

  const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.webp'));
  console.log(`📦 Current webp files: ${files.length}`);

  // Build reverse map: canonical ID -> English baseName from BASE_NAME_TO_CANONICAL_ID
  const idToBaseName = new Map<string, string>();
  for (const [baseName, code] of Object.entries(BASE_NAME_TO_CANONICAL_ID)) {
    const canonicalId = `bls_${code.toLowerCase()}`;
    if (!idToBaseName.has(canonicalId)) {
      idToBaseName.set(canonicalId, baseName);
    }
  }

  // Build lookup map from canonicalData: German slug / English slug / ID -> CanonicalIngredient
  const lookupMap = new Map<string, any>();
  for (const item of canonicalData as any[]) {
    lookupMap.set(item.id.toLowerCase(), item);
    const deSlug = cleanSlug(item.name_de);
    if (deSlug && !lookupMap.has(deSlug)) lookupMap.set(deSlug, item);
    const enSlug = cleanSlug(item.name_en);
    if (enSlug && !lookupMap.has(enSlug)) lookupMap.set(enSlug, item);
  }

  const renamePlan: Array<{
    currentFile: string;
    currentPath: string;
    targetFile: string;
    targetPath: string;
    englishBaseName: string;
  }> = [];

  const unmatched: string[] = [];

  for (const file of files) {
    const nameWithoutExt = file.replace(/\.webp$/i, '').toLowerCase();
    const item = lookupMap.get(nameWithoutExt);

    let englishName = '';

    if (item) {
      // 1. Check if we have an authoritative English baseName in BASE_NAME_TO_CANONICAL_ID
      const mappedBaseName = idToBaseName.get(item.id.toLowerCase());
      if (mappedBaseName) {
        englishName = cleanSlug(mappedBaseName);
      } else if (item.name_en) {
        englishName = cleanSlug(item.name_en);
      } else {
        englishName = nameWithoutExt;
      }
    } else {
      // Already English or unrecognized
      englishName = cleanSlug(nameWithoutExt);
    }

    if (!englishName) {
      unmatched.push(file);
      continue;
    }

    const targetFile = `${englishName}.webp`;
    renamePlan.push({
      currentFile: file,
      currentPath: path.join(iconsDir, file),
      targetFile,
      targetPath: path.join(iconsDir, targetFile),
      englishBaseName: englishName,
    });
  }

  console.log(`✅ Planned renames: ${renamePlan.length}`);
  if (unmatched.length > 0) {
    console.log(`⚠️  Unmatched files: ${unmatched.length}`);
  }

  if (options.dryRun) {
    console.log(`\n✨ [DRY RUN] First 25 planned renames:`);
    console.table(renamePlan.slice(0, 25).map(p => ({
      Current: p.currentFile,
      Target_English_BaseName: p.targetFile,
    })));
    return;
  }

  // Execute renames
  console.log(`\n🚀 Executing renames...`);
  const uniqueTargets = new Set<string>();
  let renamedCount = 0;

  // Use a temp staging directory to avoid collision during rename
  const tempDir = path.join(iconsDir, '__temp_english__');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  for (const item of renamePlan) {
    if (!uniqueTargets.has(item.targetFile)) {
      uniqueTargets.add(item.targetFile);
      const tempTarget = path.join(tempDir, item.targetFile);
      fs.copyFileSync(item.currentPath, tempTarget);
      renamedCount++;
    }
  }

  // Clear iconsDir (except .gitkeep, .unpacked_stamp)
  for (const file of fs.readdirSync(iconsDir)) {
    if (file === '.gitkeep' || file === '.unpacked_stamp' || file === '__temp_english__') continue;
    fs.unlinkSync(path.join(iconsDir, file));
  }

  // Move files from tempDir back to iconsDir
  for (const file of fs.readdirSync(tempDir)) {
    fs.renameSync(path.join(tempDir, file), path.join(iconsDir, file));
  }
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log(`✨ Successfully renamed ${renamedCount} unique English baseName icons!`);

  // Repack zip
  console.log(`\n🗜️  Repacking ingredient-icons.zip...`);
  const zipRes = packIngredientIcons({ verbose: true });
  console.log(`📦 Zip successfully updated: ${zipRes.fileCount} files (${zipRes.zipSizeMb} MB) in ${zipRes.durationMs}ms`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
