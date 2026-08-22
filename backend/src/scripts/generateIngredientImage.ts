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
    format: 'webp',
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

function cleanIngredientName(rawName: string): string {
  return rawName
    .replace(/,\s*raw\b/gi, '')
    .replace(/\s*raw\b/gi, '')
    .replace(/,\s*cooked\b/gi, '')
    .replace(/\s*cooked\b/gi, '')
    .replace(/,\s*fresh\b/gi, '')
    .replace(/\s*fresh\b/gi, '')
    .replace(/,\s*dried\b/gi, ' dried')
    .replace(/,\s*prepared\b/gi, '')
    .replace(/,\s*canned\b/gi, ' canned')
    .replace(/,\s*frozen\b/gi, ' frozen')
    .replace(/min\.\s*\d+\s*%\s*fat.*$/gi, '')
    .replace(/\d+\s*%\s*fat.*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCategoryTags(category: string, cleanName: string, nameDe: string): string {
  const lowerEn = cleanName.toLowerCase();
  const lowerDe = nameDe.toLowerCase();

  switch (category) {
    case 'FRUITS_VEGETABLES':
      if (
        lowerEn.includes('herb') ||
        lowerEn.includes('basil') ||
        lowerEn.includes('parsley') ||
        lowerEn.includes('mint') ||
        lowerEn.includes('thyme') ||
        lowerEn.includes('rosemary') ||
        lowerDe.includes('kraut') ||
        lowerDe.includes('basilikum') ||
        lowerDe.includes('petersilie')
      ) {
        return 'fresh vibrant green herb sprig, crisp aromatic leaves, dewy organic leaf texture, lush vivid green';
      }
      if (lowerEn.includes('berry') || lowerEn.includes('berries') || lowerDe.includes('beere')) {
        return 'plump ripe fresh berries cluster, juicy glistening skin, morning dew drops, rich vibrant color';
      }
      return 'single whole pristine fresh fruit, intact natural stem, crisp dewy skin texture, farm-fresh, organic vibrancy';

    case 'SPICES_OILS':
      if (lowerEn.includes('oil') || lowerEn.includes('vinegar') || lowerDe.includes('öl') || lowerDe.includes('essig')) {
        return 'clear minimalist luxury glass cruet bottle, glowing golden translucent liquid, clean glass reflections, liquid food asset';
      }
      if (lowerEn.includes('sauce') || lowerEn.includes('paste') || lowerEn.includes('mustard') || lowerDe.includes('soße') || lowerDe.includes('senf')) {
        return 'small modern white ceramic dipping bowl, rich glossy sauce texture, appetizing culinary sheen';
      }
      return 'tiny minimalist white porcelain spice bowl, finely ground aromatic spice powder, vivid saturation, organic grains';

    case 'GRAINS_PASTA':
      if (lowerEn.includes('pasta') || lowerEn.includes('spaghetti') || lowerEn.includes('noodle') || lowerDe.includes('nudel') || lowerDe.includes('pasta')) {
        return 'neat bundle of raw dry artisanal pasta shapes, authentic golden durum semolina matte texture, crisp edges';
      }
      if (lowerEn.includes('flake') || lowerEn.includes('oat') || lowerEn.includes('cereal') || lowerDe.includes('flocken')) {
        return 'neat clean mound of whole wholesome rolled flakes, toasted golden organic grain texture';
      }
      return 'clean neat mound of raw polished grains, minimalist white ceramic scoop, organic grain texture';

    case 'DAIRY':
      if (lowerEn.includes('cheese') || lowerEn.includes('parmesan') || lowerEn.includes('mozzarella') || lowerDe.includes('käse')) {
        return 'gourmet artisanal cheese wedge, creamy matte texture, natural rustic rind, fine crystallization';
      }
      if (lowerEn.includes('butter') || lowerDe.includes('butter')) {
        return 'clean geometric block of golden farm butter, smooth clean cut edges, silky dairy sheen';
      }
      return 'pure fresh white dairy in minimalist clear glass bottle, velvety smooth consistency, clean dairy white';

    case 'MEAT_FISH':
      if (
        lowerEn.includes('salmon') ||
        lowerEn.includes('fish') ||
        lowerEn.includes('shrimp') ||
        lowerEn.includes('tuna') ||
        lowerDe.includes('fisch') ||
        lowerDe.includes('lachs') ||
        lowerDe.includes('garnele')
      ) {
        return 'prime sashimi-grade raw fish fillet, fresh ocean sheen, delicate flake marbling, coral-pink color';
      }
      return 'prime butcher-grade artisanal raw cut, succulent meat fibers, delicate fine marbling, fresh butcher sheen';

    case 'BREAD_BAKERY':
      return 'freshly baked artisan bakery piece, golden-brown blistered crust, flour dusting, airy crisp crumb texture';

    case 'BAKING_COOKING':
      return 'pure gourmet baking ingredient, minimalist white ceramic pinch bowl, ultra-fine consistency, pristine culinary grade';

    case 'CANNED_PRESERVED':
      return 'modern unlabeled transparent glass preserving jar, rich preserved culinary texture, vivid authentic food color';

    case 'BEVERAGES':
      return 'crystal-clear minimalist glass tumbler, clear ice cubes, subtle condensation droplets, vibrant refreshing liquid';

    case 'SWEETS_SNACKS':
      if (lowerEn.includes('chocolate') || lowerDe.includes('schokolade')) {
        return 'broken rustic chunks of rich dark gourmet chocolate, sharp snap fracture edges, silky matte-gloss cocoa richness';
      }
      if (lowerEn.includes('nut') || lowerEn.includes('walnut') || lowerEn.includes('almond') || lowerDe.includes('nuss')) {
        return 'neat cluster of whole raw shelled gourmet nuts, textured ridged kernels, warm earthy organic tones';
      }
      return 'single premium gourmet confectionery treat, artisanal texture, indulgent finish';

    case 'FROZEN':
      return 'crisp frosty frozen whole pieces, glistening delicate ice crystals, vibrant cold freshness';

    case 'REFRIGERATED_CONVENIENCE':
    case 'READY_MEALS':
    default:
      return 'gourmet culinary portion, chef-level minimalist presentation, fresh authentic food textures, vibrant colors';
  }
}

function buildPrompt(item: CanonicalIngredient, promptOverride?: string): string {
  if (promptOverride && promptOverride.trim()) {
    return promptOverride.trim();
  }

  const rawName = item.name_en || item.name_de;
  const cleanName = cleanIngredientName(rawName);
  const categoryTags = getCategoryTags(item.category, cleanName, item.name_de);

  return `${cleanName}, isolated on pure solid white background, dead center, 1:1 square icon, ${categoryTags}, symmetrical softbox studio lighting, sharp focus, vibrant natural colors, zero shadows, no floor shadow, no text, no labels, no watermark`;
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

  const rawSlug = (ingredient.name_en || ingredient.name_de || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const fileBaseName = rawSlug ? `${ingredient.id}_${rawSlug}` : ingredient.id;

  // Save JPEG if requested
  if (options.format === 'jpeg' || options.format === 'both') {
    const jpegPath = path.join(options.outDir, `${fileBaseName}.jpg`);
    fs.writeFileSync(jpegPath, rawJpegBuffer);
    savedFiles.push(jpegPath);
  }

  // Save optimized WebP (512x512 icon size) if requested
  if (options.format === 'webp' || options.format === 'both') {
    const webpPath = path.join(options.outDir, `${fileBaseName}.webp`);
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
