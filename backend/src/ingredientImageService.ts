import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';
import { CANONICAL_INGREDIENTS, type CanonicalIngredient } from './data/canonicalIngredients.js';

const FAL_FLUX_ENDPOINT = 'https://fal.run/fal-ai/flux-1/schnell';
const FLUX_COST_PER_IMAGE_USD = 0.0035; // fal.ai flux-1/schnell square_hd standard rate

let geminiClient: GoogleGenerativeAI | null = null;
function getGeminiClient(): GoogleGenerativeAI | null {
  if (!geminiClient && config.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }
  return geminiClient;
}

export function getIngredientImagesDir(): string {
  const cwd = process.cwd();
  if (path.basename(cwd).toLowerCase() === 'backend') {
    return path.resolve(cwd, 'generated-ingredient-images');
  }
  return path.resolve(cwd, 'backend', 'generated-ingredient-images');
}

export const INGREDIENT_IMAGES_DIR = getIngredientImagesDir();

// Ensure output directory exists
export function ensureImageDirExists(dirPath: string = INGREDIENT_IMAGES_DIR): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getCostLogFilePath(dirPath: string = getIngredientImagesDir()): string {
  return path.join(dirPath, 'generation_costs.jsonl');
}

export interface GeminiCostDetails {
  model: string;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface FluxCostDetails {
  model: string;
  steps: number;
  size: string;
  costUsd: number;
}

export interface GenerationCostEntry {
  timestamp: string;
  ingredientId: string;
  name_de: string;
  name_en: string;
  category: string;
  filename: string;
  prompt: string;
  gemini: GeminiCostDetails;
  flux: FluxCostDetails;
  totalCostUsd: number;
  durationMs: number;
}

export interface CostsSummary {
  totalGenerations: number;
  totalCostUsd: number;
  totalGeminiCostUsd: number;
  totalFluxCostUsd: number;
  totalTokens: number;
  approxEur: number;
}

export function appendCostLog(entry: GenerationCostEntry, outDir: string = getIngredientImagesDir()): void {
  try {
    ensureImageDirExists(outDir);
    const logPath = getCostLogFilePath(outDir);
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(logPath, line, 'utf-8');
  } catch (err: any) {
    console.error('[ingredientImageService] Failed to write cost log:', err.message);
  }
}

export function getGenerationCostsSummary(outDir: string = getIngredientImagesDir()): CostsSummary {
  const logPath = getCostLogFilePath(outDir);
  const summary: CostsSummary = {
    totalGenerations: 0,
    totalCostUsd: 0,
    totalGeminiCostUsd: 0,
    totalFluxCostUsd: 0,
    totalTokens: 0,
    approxEur: 0,
  };

  if (!fs.existsSync(logPath)) {
    return summary;
  }

  try {
    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry: GenerationCostEntry = JSON.parse(line);
        summary.totalGenerations++;
        summary.totalCostUsd += entry.totalCostUsd || 0;
        summary.totalGeminiCostUsd += entry.gemini?.costUsd || 0;
        summary.totalFluxCostUsd += entry.flux?.costUsd || 0;
        summary.totalTokens += entry.gemini?.totalTokens || 0;
      } catch {
        // Skip corrupted line
      }
    }
  } catch (err: any) {
    console.error('[ingredientImageService] Failed to read cost log:', err.message);
  }

  summary.totalCostUsd = Number(summary.totalCostUsd.toFixed(5));
  summary.totalGeminiCostUsd = Number(summary.totalGeminiCostUsd.toFixed(5));
  summary.totalFluxCostUsd = Number(summary.totalFluxCostUsd.toFixed(5));
  summary.approxEur = Number((summary.totalCostUsd * 0.93).toFixed(4));

  return summary;
}

export function cleanIngredientName(rawName: string): string {
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

export function getFallbackCategoryTags(category: string, cleanName: string, nameDe: string): string {
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
        return 'single neat compact cluster of fresh ripe berries in the center, glistening skin, rich vibrant color';
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

export interface GeminiVisualDescriptionResult {
  visualTags: string;
  geminiCost: GeminiCostDetails;
}

/**
 * Uses Gemini Flash Lite to craft a dense, accurate physical description of the specific ingredient.
 */
export async function describeIngredientVisuallyWithGemini(item: CanonicalIngredient): Promise<GeminiVisualDescriptionResult> {
  const client = getGeminiClient();
  const modelName = config.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  const fallbackTags = getFallbackCategoryTags(item.category, cleanIngredientName(item.name_en || item.name_de), item.name_de);

  const defaultCost: GeminiCostDetails = {
    model: modelName,
    promptTokens: 0,
    candidatesTokens: 0,
    totalTokens: 0,
    costUsd: 0,
  };

  if (!client) {
    return { visualTags: fallbackTags, geminiCost: defaultCost };
  }

  try {
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 60,
      },
      systemInstruction:
        'You are an expert food photography art director. Given a food ingredient name in German/English and its category, output a dense, compact English visual subject description (8 to 15 words max) for an isolated studio food icon asset. ' +
        'Rules: ' +
        '- Output ONLY the comma-separated visual tags/description, no introductory text, no sentences, no quotes, no markdown. ' +
        '- Describe ONE single primary item or ONE single tight compact cluster in the exact center. ' +
        '- Never include multiple scattered items spread across the canvas. ' +
        '- Describe authentic real-world shape, best culinary container/presentation (e.g. glass bottle for oils, white ceramic pinch bowl for spices/powders/quark, whole produce with stem, clean butchered cut, or raw dough/pasta), and natural textures/colors. ' +
        '- Do NOT mention background, lighting, or camera angle (handled by the template). ' +
        '- Keep it compact and dense.',
    });

    const userPrompt = `Ingredient: "${item.name_de}" (English: "${item.name_en}", Category: ${item.category})`;
    const res = await model.generateContent(userPrompt);
    const text = res.response.text().trim().replace(/^["']|["']$/g, '').replace(/\.$/, '');

    // Extract exact token usage metadata from Gemini response
    const usage = (res.response as any).usageMetadata;
    const promptTokens = usage?.promptTokenCount || 85;
    const candidatesTokens = usage?.candidatesTokenCount || 25;
    const totalTokens = usage?.totalTokenCount || promptTokens + candidatesTokens;

    // Pricing for Gemini 3.1 Flash Lite ($0.075 / 1M input, $0.30 / 1M output)
    const costUsd = Number(((promptTokens * 0.075) / 1_000_000 + (candidatesTokens * 0.30) / 1_000_000).toFixed(7));

    const geminiCost: GeminiCostDetails = {
      model: modelName,
      promptTokens,
      candidatesTokens,
      totalTokens,
      costUsd,
    };

    if (text && text.length > 5) {
      return { visualTags: text, geminiCost };
    }
  } catch (err: any) {
    console.warn(`[ingredientImageService] Gemini visual description failed for ${item.id}: ${err.message}`);
  }

  return { visualTags: fallbackTags, geminiCost: defaultCost };
}

export interface PromptBuildResult {
  prompt: string;
  geminiCost: GeminiCostDetails;
}

export async function buildIngredientPrompt(
  item: CanonicalIngredient,
  options: {
    promptOverride?: string;
    useGemini?: boolean;
  } = {}
): Promise<PromptBuildResult> {
  const modelName = config.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  const defaultCost: GeminiCostDetails = {
    model: modelName,
    promptTokens: 0,
    candidatesTokens: 0,
    totalTokens: 0,
    costUsd: 0,
  };

  if (options.promptOverride && options.promptOverride.trim()) {
    return {
      prompt: options.promptOverride.trim(),
      geminiCost: defaultCost,
    };
  }

  const rawName = item.name_en || item.name_de;
  const cleanName = cleanIngredientName(rawName);

  let visualTags: string;
  let geminiCost = defaultCost;

  if (options.useGemini !== false && config.GEMINI_API_KEY) {
    const result = await describeIngredientVisuallyWithGemini(item);
    visualTags = result.visualTags;
    geminiCost = result.geminiCost;
  } else {
    visualTags = getFallbackCategoryTags(item.category, cleanName, item.name_de);
  }

  const prompt = `${cleanName}, isolated on pure solid white background, dead center, 1:1 square icon, fully contained within frame with generous white margin on all sides, complete object visible, ${visualTags}, symmetrical softbox studio lighting, sharp focus, vibrant natural colors, zero shadows, no floor shadow, no edge cutoff, not cropped, nothing touching the frame edges, no text, no labels, no watermark`;

  return { prompt, geminiCost };
}

export function getIngredientSlug(item: CanonicalIngredient): string {
  return (item.name_en || item.name_de || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getIngredientFileBaseName(item: CanonicalIngredient): string {
  const slug = getIngredientSlug(item);
  return slug ? `${item.id}_${slug}` : item.id;
}

export function findExistingIngredientImage(ingredientId: string, outDir?: string): string | null {
  const dir = outDir || getIngredientImagesDir();
  if (!fs.existsSync(dir)) return null;

  const targetPrefix = `${ingredientId.toLowerCase()}`;
  const files = fs.readdirSync(dir);
  const matched = files.find(
    (f) =>
      f.toLowerCase().endsWith('.webp') &&
      (f.toLowerCase() === `${targetPrefix}.webp` || f.toLowerCase().startsWith(`${targetPrefix}_`))
  );

  return matched || null;
}

export async function fetchFluxImageBuffer(prompt: string, size: string = 'square_hd', steps: number = 4): Promise<Buffer> {
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

export interface GenerateIconResult {
  ingredientId: string;
  filename: string;
  filePath: string;
  prompt: string;
  durationMs: number;
  sizeKb: number;
  costs: {
    gemini: GeminiCostDetails;
    flux: FluxCostDetails;
    totalCostUsd: number;
  };
}

export async function generateIngredientIcon(
  item: CanonicalIngredient,
  options: {
    outDir?: string;
    promptOverride?: string;
    steps?: number;
    useGemini?: boolean;
  } = {}
): Promise<GenerateIconResult> {
  const outDir = options.outDir || getIngredientImagesDir();
  ensureImageDirExists(outDir);

  const startTime = Date.now();
  const { prompt, geminiCost } = await buildIngredientPrompt(item, {
    promptOverride: options.promptOverride,
    useGemini: options.useGemini,
  });

  const steps = options.steps || 4;
  const size = 'square_hd';
  const rawJpegBuffer = await fetchFluxImageBuffer(prompt, size, steps);
  const fileBaseName = getIngredientFileBaseName(item);
  const filename = `${fileBaseName}.webp`;
  const filePath = path.join(outDir, filename);

  await sharp(rawJpegBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .webp({ quality: 90, effort: 6 })
    .toFile(filePath);

  const durationMs = Date.now() - startTime;
  const stats = fs.statSync(filePath);
  const sizeKb = Number((stats.size / 1024).toFixed(1));

  const fluxCost: FluxCostDetails = {
    model: 'flux-1/schnell',
    steps,
    size,
    costUsd: FLUX_COST_PER_IMAGE_USD,
  };

  const totalCostUsd = Number((geminiCost.costUsd + fluxCost.costUsd).toFixed(6));

  const costEntry: GenerationCostEntry = {
    timestamp: new Date().toISOString(),
    ingredientId: item.id,
    name_de: item.name_de,
    name_en: item.name_en,
    category: item.category,
    filename,
    prompt,
    gemini: geminiCost,
    flux: fluxCost,
    totalCostUsd,
    durationMs,
  };

  // Write log to generation_costs.jsonl in the images directory
  appendCostLog(costEntry, outDir);

  return {
    ingredientId: item.id,
    filename,
    filePath,
    prompt,
    durationMs,
    sizeKb,
    costs: {
      gemini: geminiCost,
      flux: fluxCost,
      totalCostUsd,
    },
  };
}
