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

function getCategoryDirectives(category: string, cleanName: string, nameDe: string): { presentation: string; texture: string } {
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
        return {
          presentation: 'a fresh vibrant aromatic herb sprig with crisp leaves',
          texture: 'natural dewy organic leaf texture, lush vibrant green tones',
        };
      }
      if (lowerEn.includes('berry') || lowerEn.includes('berries') || lowerDe.includes('beere')) {
        return {
          presentation: 'a small neat cluster of plump ripe fresh berries',
          texture: 'glistening rich natural colors, subtle morning dew drops, juicy organic skin',
        };
      }
      return {
        presentation: 'a single whole pristine fresh produce item with natural stem',
        texture: 'crisp vibrant natural skin texture, subtle micro-dew drops, authentic farm-fresh appearance',
      };

    case 'SPICES_OILS':
      if (lowerEn.includes('oil') || lowerEn.includes('vinegar') || lowerDe.includes('öl') || lowerDe.includes('essig')) {
        return {
          presentation: 'in a modern minimalist clear glass cruet bottle',
          texture: 'glowing liquid with warm translucent amber-gold tones, crystal clear glass reflection',
        };
      }
      if (lowerEn.includes('sauce') || lowerEn.includes('paste') || lowerEn.includes('mustard') || lowerDe.includes('soße') || lowerDe.includes('senf')) {
        return {
          presentation: 'neatly presented in a small modern white ceramic dipping bowl',
          texture: 'smooth rich glossy texture, vibrant culinary sheen',
        };
      }
      return {
        presentation: 'in a tiny minimalist white porcelain spice pinch bowl alongside whole natural spice pieces',
        texture: 'finely textured ground spice powder with rich aromatic saturation and organic grains',
      };

    case 'GRAINS_PASTA':
      if (lowerEn.includes('pasta') || lowerEn.includes('spaghetti') || lowerEn.includes('noodle') || lowerDe.includes('nudel') || lowerDe.includes('pasta')) {
        return {
          presentation: 'an artfully arranged neat bundle of raw dry artisanal pasta shapes',
          texture: 'authentic golden semolina matte surface texture, crisp edges',
        };
      }
      if (lowerEn.includes('flake') || lowerEn.includes('oat') || lowerEn.includes('cereal') || lowerDe.includes('flocken')) {
        return {
          presentation: 'a neat clean cluster of whole wholesome rolled flakes',
          texture: 'toasted golden organic grain texture, rustic wholesome flakes',
        };
      }
      return {
        presentation: 'a clean neat mound of raw grains in a minimalist white ceramic scoop',
        texture: 'glistening individual raw polished grains, organic natural texture',
      };

    case 'DAIRY':
      if (lowerEn.includes('cheese') || lowerEn.includes('parmesan') || lowerEn.includes('mozzarella') || lowerDe.includes('käse')) {
        return {
          presentation: 'a gourmet artisanal wedge or ball of authentic cheese',
          texture: 'rich creamy matte cheese texture with subtle natural crystallization and rustic rind',
        };
      }
      if (lowerEn.includes('butter') || lowerDe.includes('butter')) {
        return {
          presentation: 'a neat geometric block of creamy golden farm butter with clean cut edges',
          texture: 'silky smooth golden dairy sheen, appetizing gourmet quality',
        };
      }
      return {
        presentation: 'pure fresh white dairy in a minimalist clear glass bottle or white porcelain bowl',
        texture: 'creamy velvety smooth consistency, pure clean dairy white',
      };

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
        return {
          presentation: 'a prime sashimi-grade raw fish fillet or cleaned prawns',
          texture: 'fresh ocean sheen, delicate natural flake marbling, vibrant coral-pink color',
        };
      }
      return {
        presentation: 'a prime butcher-grade artisanal raw cut or clean poultry breast',
        texture: 'succulent tender meat fibers, delicate fine marbling, fresh butcher-shop sheen',
      };

    case 'BREAD_BAKERY':
      return {
        presentation: 'an artisanal freshly baked bakery piece with golden-brown crust',
        texture: 'crispy blistered crust with subtle flour dusting, airy comforting baked crumb texture',
      };

    case 'BAKING_COOKING':
      return {
        presentation: 'a pure gourmet baking ingredient presented in a minimalist white ceramic baker\'s dish or whole natural form',
        texture: 'ultra-fine pure consistency, clean and pristine culinary grade',
      };

    case 'CANNED_PRESERVED':
      return {
        presentation: 'in a modern unlabeled crystal-clear glass preserving jar',
        texture: 'rich preserved culinary texture, vibrant authentic color seen through clear glass',
      };

    case 'BEVERAGES':
      return {
        presentation: 'in an elegant minimalist crystal-clear glass tumbler with crisp clear ice cubes',
        texture: 'sparkling refreshing liquid with subtle cool glass condensation, vibrant pure color',
      };

    case 'SWEETS_SNACKS':
      if (lowerEn.includes('chocolate') || lowerDe.includes('schokolade')) {
        return {
          presentation: 'broken artisanal chunks of rich dark gourmet chocolate with clean snap fractures',
          texture: 'silky matte-gloss finish, fine cocoa richness, crisp fractured edges',
        };
      }
      if (lowerEn.includes('nut') || lowerEn.includes('walnut') || lowerEn.includes('almond') || lowerDe.includes('nuss')) {
        return {
          presentation: 'a small neat group of whole raw shelled gourmet nuts',
          texture: 'intricate natural ridged nut kernels, warm earthy organic tones',
        };
      }
      return {
        presentation: 'a single premium gourmet confection or snack',
        texture: 'appetizing artisanal texture, indulgent culinary finish',
      };

    case 'FROZEN':
      return {
        presentation: 'crisp frosty frozen whole pieces',
        texture: 'glistening delicate ice crystals, vibrant frozen freshness, crisp cold look',
      };

    case 'REFRIGERATED_CONVENIENCE':
    case 'READY_MEALS':
    default:
      return {
        presentation: 'a neat gourmet culinary portion arranged with chef-level minimalism',
        texture: 'fresh authentic food textures, vibrant appetizing culinary colors',
      };
  }
}

function buildPrompt(item: CanonicalIngredient, promptOverride?: string): string {
  if (promptOverride && promptOverride.trim()) {
    return promptOverride.trim();
  }

  const rawName = item.name_en || item.name_de;
  const cleanName = cleanIngredientName(rawName);
  const { presentation, texture } = getCategoryDirectives(item.category, cleanName, item.name_de);

  return `Close-up studio icon photograph of fresh ${cleanName}, presented as ${presentation}, ${texture}, filling the frame, floating in the exact center of the 1:1 canvas, perfectly centered horizontally and vertically, symmetrical composition, isolated on solid pure bright white background #ffffff, soft even studio softbox lighting from all angles, no table, no ground, no shadows, clean minimal food asset, ultra sharp focus, 8k commercial quality, no text, no labels, no watermark`;
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
