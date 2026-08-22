import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { config } from '../config.js';
import { CANONICAL_INGREDIENTS, type CanonicalIngredient } from '../data/canonicalIngredients.js';

interface CliOptions {
  id?: string;
  search?: string;
  outDir: string;
  size: 'square_hd' | 'square' | 'landscape_4_3';
  format: 'webp' | 'jpeg' | 'both';
  steps: number;
  promptOverride?: string;
  dryRun: boolean;
}

const FAL_FLUX_ENDPOINT = 'https://fal.run/fal-ai/flux-1/schnell';

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    outDir: path.resolve(process.cwd(), 'generated-ingredient-images'),
    size: 'square_hd',
    format: 'both',
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
    } else if (arg === '--format' && args[i + 1]) {
      const fmt = args[++i].toLowerCase();
      if (fmt === 'webp' || fmt === 'jpeg' || fmt === 'both') {
        options.format = fmt;
      }
    } else if (arg === '--size' && args[i + 1]) {
      options.size = args[++i] as any;
    } else if (arg === '--steps' && args[i + 1]) {
      options.steps = parseInt(args[++i], 10) || 4;
    } else if (arg === '--prompt' && args[i + 1]) {
      options.promptOverride = args[++i];
    } else if (!arg.startsWith('-') && !options.id) {
      // Positional argument interpreted as ID or search query
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

function buildPrompt(item: CanonicalIngredient, promptOverride?: string): string {
  if (promptOverride && promptOverride.trim()) {
    return promptOverride.trim();
  }

  // Clean English name for prompt (e.g., remove "raw", "fresh", "cooked", etc.)
  const rawName = item.name_en || item.name_de;
  const cleanName = rawName
    .replace(/,\s*raw/gi, '')
    .replace(/\s*raw\b/gi, '')
    .replace(/,\s*cooked/gi, '')
    .replace(/\s*cooked\b/gi, '')
    .replace(/,\s*fresh/gi, '')
    .replace(/\s*fresh\b/gi, '')
    .replace(/,\s*dried/gi, ' dried')
    .replace(/\s+/g, ' ')
    .trim();

  return `Close-up studio icon photograph of a single fresh ${cleanName}, filling the frame, floating in the exact center of the canvas, perfectly centered horizontally and vertically, symmetrical, isolated on solid pure bright white background #ffffff, soft even studio lighting from all angles, no table, no ground, no shadows, clean minimal food asset, sharp focus`;
}

async function fetchFluxImage(prompt: string, size: string, steps: number): Promise<Buffer> {
  const apiKey = config.FAL_KEY;
  if (!apiKey) {
    throw new Error('FAL_KEY (or FLUX_API_KEY) is not configured in .env');
  }

  const authHeader = apiKey.startsWith('Key ') ? apiKey : `Key ${apiKey}`;

  console.log(`[fal.ai] Calling FLUX.1 [schnell] (size: ${size}, steps: ${steps})...`);

  const response = await fetch(FAL_FLUX_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: size,
      num_inference_steps: steps,
      output_format: 'jpeg',
      enable_safety_checker: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`fal.ai FLUX generation failed (${response.status}): ${errText}`);
  }

  const data: any = await response.json();
  const imageUrl = data.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error('fal.ai response did not contain an image URL');
  }

  console.log(`[fal.ai] Image generated: ${imageUrl}`);
  console.log(`[fal.ai] Downloading image buffer...`);

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed to download image from CDN (${imgRes.status})`);
  }

  const arrayBuffer = await imgRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (!options.id && !options.search) {
    console.error('❌ Fehler: Bitte gib eine Zutat-ID oder einen Suchbegriff an.');
    console.log('\nVerwendung:');
    console.log('  npx tsx src/scripts/generateIngredientImage.ts bls_c133000');
    console.log('  npx tsx src/scripts/generateIngredientImage.ts --id bls_c133000 --format webp');
    console.log('  npx tsx src/scripts/generateIngredientImage.ts --search "Haferflocken"');
    console.log('  npx tsx src/scripts/generateIngredientImage.ts bls_c133000 --dry-run');
    process.exit(1);
  }

  const ingredient = findIngredient(options);
  if (!ingredient) {
    console.error(`❌ Zutat nicht gefunden für ID="${options.id || ''}" / Suchbegriff="${options.search || ''}"`);
    process.exit(1);
  }

  const prompt = buildPrompt(ingredient, options.promptOverride);

  console.log('\n======================================================');
  console.log(`🥑 Zutat:       ${ingredient.name_de} (${ingredient.name_en})`);
  console.log(`🆔 ID:          ${ingredient.id} (BLS: ${ingredient.bls_code})`);
  console.log(`📁 Kategorie:   ${ingredient.category}`);
  console.log(`🎯 Prompt:      "${prompt}"`);
  console.log(`📐 Format/Size: ${options.format} | ${options.size} (${options.steps} steps)`);
  console.log(`📂 Zielordner:  ${options.outDir}`);
  console.log('======================================================\n');

  if (options.dryRun) {
    console.log('✨ [DRY RUN] Keine API-Anfrage gesendet.');
    return;
  }

  if (!fs.existsSync(options.outDir)) {
    fs.mkdirSync(options.outDir, { recursive: true });
  }

  const startTime = Date.now();
  const rawJpegBuffer = await fetchFluxImage(prompt, options.size, options.steps);
  const elapsedMs = Date.now() - startTime;

  const savedFiles: string[] = [];

  // Save JPEG if requested
  if (options.format === 'jpeg' || options.format === 'both') {
    const jpegPath = path.join(options.outDir, `${ingredient.id}.jpg`);
    fs.writeFileSync(jpegPath, rawJpegBuffer);
    savedFiles.push(jpegPath);
  }

  // Save optimized WebP (512x512 icon size) if requested
  if (options.format === 'webp' || options.format === 'both') {
    const webpPath = path.join(options.outDir, `${ingredient.id}.webp`);
    await sharp(rawJpegBuffer)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .webp({ quality: 90, effort: 6 })
      .toFile(webpPath);
    savedFiles.push(webpPath);
  }

  console.log(`\n🎉 Erfolgreich generiert in ${elapsedMs}ms (~$0.0035 USD):`);
  for (const filePath of savedFiles) {
    const stats = fs.statSync(filePath);
    const kb = (stats.size / 1024).toFixed(1);
    console.log(`  💾 ${filePath} (${kb} KB)`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('❌ Fehler bei der Generierung:', err);
  process.exit(1);
});
