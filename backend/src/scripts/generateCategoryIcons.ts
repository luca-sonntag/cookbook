import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fetchFluxImageBuffer } from '../ingredientImageService.js';

interface CategoryIconDefinition {
  id: string;
  nameDe: string;
  filename: string;
  aliases?: string[];
  threeIngredients: string;
  prompt: string;
}

const CATEGORY_DEFINITIONS: CategoryIconDefinition[] = [
  {
    id: 'VEGETABLES',
    nameDe: 'Gemüse',
    filename: 'vegetables.webp',
    aliases: ['produce.webp'],
    threeIngredients: 'Tomate, Zwiebel, Knoblauch',
    prompt:
      'Neat harmonious trio cluster of fresh raw culinary vegetables: a whole ripe red vine tomato with green stem, a golden yellow onion with papery skin, and an intact fresh white garlic bulb, placed together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, vibrant natural produce colors, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'FRUITS',
    nameDe: 'Obst & Früchte',
    filename: 'fruits.webp',
    threeIngredients: 'Apfel, Banane, Zitrone',
    prompt:
      'Neat harmonious trio cluster of fresh raw fruits: a crisp whole red apple with stem, a ripe yellow banana, and a vibrant yellow whole lemon, placed together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, vibrant natural fruit colors, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'DAIRY_EGGS',
    nameDe: 'Milchprodukte & Eier',
    filename: 'dairy_eggs.webp',
    threeIngredients: 'Käse, Ei, Butter',
    prompt:
      'Neat harmonious trio cluster of fresh farm dairy essentials: an artisanal gourmet cheese wedge with rustic rind, a pristine single raw brown egg, and a clean geometric block of golden butter, placed together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, velvety dairy textures, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'MEAT_POULTRY',
    nameDe: 'Fleisch & Geflügel',
    filename: 'meat_poultry.webp',
    threeIngredients: 'Hähnchenbrust, Steak, Schinken',
    prompt:
      'Neat harmonious trio cluster of prime raw butcher meats: a fresh raw chicken breast fillet, a succulent marbled raw beef steak cut, and a neat rolled slice of cured ham, placed together in the center without plate or tray, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, fresh butcher sheen, vibrant red and coral tones, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'SEAFOOD',
    nameDe: 'Fisch & Meeresfrüchte',
    filename: 'seafood.webp',
    threeIngredients: 'Lachs, Garnele, Zitrone',
    prompt:
      'Neat harmonious trio cluster of prime ocean seafood: a fresh raw salmon fillet cut with delicate marbling, a succulent curved pink king prawn, and a fresh juicy yellow lemon wedge, placed together in the center without plate or ice, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, fresh ocean sheen, vibrant coral-pink colors, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'GRAINS_PASTA',
    nameDe: 'Getreide, Nudeln & Backwaren',
    filename: 'grains_pasta.webp',
    aliases: ['bakery.webp'],
    threeIngredients: 'Pasta, Reis, Sauerteigbrot',
    prompt:
      'Neat harmonious trio cluster of pantry grains and bakery staples: raw golden durum semolina pasta shapes, a neat compact mound of raw white rice grains, and a rustic slice of crusty artisan sourdough bread, placed together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, golden toasted and durum textures, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'OILS_CONDIMENTS',
    nameDe: 'Öle, Saucen & Dressings',
    filename: 'oils_condiments.webp',
    aliases: ['condiments_oils.webp'],
    threeIngredients: 'Olivenöl, Tomatensauce/Dip, Balsamico',
    prompt:
      'Neat harmonious trio cluster of gourmet culinary condiments: a minimalist clear cylindrical glass cruet bottle of glowing golden olive oil with cork stopper, a small minimalist matte-white ceramic dipping bowl with smooth rounded rim filled with rich tomato sauce, and dark aged balsamic vinegar, placed together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, glowing translucent liquids and glossy sauce, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'SPICES_HERBS',
    nameDe: 'Gewürze & Kräuter',
    filename: 'spices_herbs.webp',
    threeIngredients: 'Paprikapulver, Pfefferkörner/Salz, Basilikum',
    prompt:
      'Neat harmonious trio cluster of aromatic kitchen seasonings: a tiny minimalist shallow white porcelain pinch bowl filled with vibrant red paprika spice powder, a small scatter of whole black peppercorns and coarse sea salt crystals, and a fresh crisp green basil sprig, placed together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, vivid spice colors and dewy green herb texture, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'NUTS_SEEDS',
    nameDe: 'Nüsse & Samen',
    filename: 'nuts_seeds.webp',
    threeIngredients: 'Walnuss, Mandel, Kürbiskerne',
    prompt:
      'Neat harmonious trio cluster of raw gourmet nuts and seeds: whole textured walnuts with shell halves, whole raw golden almonds, and a neat compact mound of green pumpkin seeds, placed together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, earthy organic textures and warm tones, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'SWEETS_SNACKS',
    nameDe: 'Süßes & Snacks',
    filename: 'sweets_snacks.webp',
    threeIngredients: 'Dunkle Schokolade, Honig, Keks',
    prompt:
      'Neat harmonious trio cluster of gourmet sweet treats: broken chunks of rich dark chocolate with sharp snap edges, a small minimalist clear glass pot of glowing golden honey, and a crisp round artisan cookie, placed together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, glossy cocoa and golden amber tones, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'BEVERAGES',
    nameDe: 'Getränke',
    filename: 'beverages.webp',
    threeIngredients: 'Eiswasser, Kaffeebohnen, Orangenscheibe',
    prompt:
      'Neat harmonious trio cluster of refreshing beverage essentials: a crystal-clear straight glass tumbler filled with chilled sparkling water and clear ice cubes, a small compact mound of aromatic dark roasted whole coffee beans beside it, and a vibrant fresh round orange citrus wheel slice, tightly grouped together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 25% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, sparkling liquid and fresh textures, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'PANTRY_BAKING',
    nameDe: 'Backen & Vorrat',
    filename: 'pantry_baking.webp',
    aliases: ['baking.webp', 'pantry.webp'],
    threeIngredients: 'Mehl, Backpulver, Hefe',
    prompt:
      'Neat harmonious trio cluster of essential home baking ingredients: a neat compact mound of silky white wheat flour, a tiny minimalist white porcelain pinch bowl of baking powder, and a fresh compact block of baker\'s yeast, placed together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, pure powdery textures, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'PREPARED_DISHES',
    nameDe: 'Fertiggerichte & Snacks',
    filename: 'prepared_dishes.webp',
    threeIngredients: 'Pizza-Stück, Wrap, Suppenschale',
    prompt:
      'Neat harmonious trio cluster of prepared meal favorites: a small triangular slice of artisan cheese pizza, a freshly folded tortilla wrap half showing delicious colorful filling, and a small minimalist white ceramic bowl of soup, placed together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, appetizing golden-brown crusts and fresh fillings, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'FROZEN',
    nameDe: 'Tiefkühlware',
    filename: 'frozen.webp',
    threeIngredients: 'TK-Beeren, TK-Erbsen, Eiscreme',
    prompt:
      'Neat harmonious trio cluster of frozen food staples: frosty frozen raspberries and blueberries with delicate glistening ice crystals, a small cluster of bright green frozen peas, and a scoop of creamy vanilla ice cream, placed together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, vibrant cold freshness and frosted textures, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
  {
    id: 'OTHER',
    nameDe: 'Allgemein / Sonstiges',
    filename: 'other.webp',
    threeIngredients: 'Apfel, Olivenöl, Basilikum',
    prompt:
      'Neat harmonious signature trio cluster of universal cooking ingredients: a crisp fresh red apple with stem, a minimalist clear glass cruet bottle of glowing golden olive oil with cork stopper, and a fresh vibrant green basil sprig with aromatic leaves, placed together in the center, isolated on pure solid white background, 45-degree three-quarter perspective view, generous 20% white padding on all sides, complete objects fully contained in frame without edge clipping, professional commercial culinary studio lighting, soft symmetrical fill light, crisp sharp focus, farm-fresh vibrancy and radiant colors, zero shadows, no floor shadow, no drop shadow, not cropped, no text, no watermark',
  },
];

async function generateSingleCategory(def: CategoryIconDefinition, backendDir: string, frontendDir: string) {
  console.log(`\n🎨 [${def.id}] Generating 3-ingredient fallback icon: ${def.nameDe} (${def.threeIngredients})...`);
  const startTime = Date.now();

  const rawJpeg = await fetchFluxImageBuffer(def.prompt, 'square_hd', 4);
  const webpBuffer = await sharp(rawJpeg)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .webp({ quality: 90, effort: 6 })
    .toBuffer();

  const backendTarget = path.join(backendDir, def.filename);
  const frontendTarget = path.join(frontendDir, def.filename);

  fs.writeFileSync(backendTarget, webpBuffer);
  fs.writeFileSync(frontendTarget, webpBuffer);
  console.log(`   ✅ Saved ${def.filename} (${(webpBuffer.length / 1024).toFixed(1)} KB) in ${(Date.now() - startTime)}ms`);

  if (def.aliases && def.aliases.length > 0) {
    for (const alias of def.aliases) {
      fs.copyFileSync(backendTarget, path.join(backendDir, alias));
      fs.copyFileSync(frontendTarget, path.join(frontendDir, alias));
      console.log(`   📋 Copied alias -> ${alias}`);
    }
  }
}

async function main() {
  console.log('====================================================');
  console.log('🌟 Category Fallback Icon Generator (3 Ingredients Trio)');
  console.log('====================================================');

  const cwd = process.cwd();
  const rootDir = path.basename(cwd).toLowerCase() === 'backend' ? path.resolve(cwd, '..') : cwd;
  const backendDir = path.resolve(rootDir, 'backend', 'public', 'category-icons');
  const frontendDir = path.resolve(rootDir, 'frontend', 'public', 'category-icons');

  fs.mkdirSync(backendDir, { recursive: true });
  fs.mkdirSync(frontendDir, { recursive: true });

  const targetCategory = process.argv[2]?.toUpperCase();
  const defs = targetCategory
    ? CATEGORY_DEFINITIONS.filter(d => d.id === targetCategory || d.filename.toLowerCase().includes(targetCategory.toLowerCase()))
    : CATEGORY_DEFINITIONS;

  if (defs.length === 0) {
    console.error(`❌ No category matched for "${process.argv[2]}". Available: ${CATEGORY_DEFINITIONS.map(d => d.id).join(', ')}`);
    process.exit(1);
  }

  console.log(`🚀 Processing ${defs.length} category icons via FLUX.1 [schnell]...`);

  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    try {
      console.log(`\n[${i + 1}/${defs.length}]`);
      await generateSingleCategory(def, backendDir, frontendDir);
    } catch (err: any) {
      console.error(`❌ Failed generating ${def.id}:`, err.message);
    }
  }

  console.log('\n====================================================');
  console.log('✨ All Category Fallback Icons successfully generated!');
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('Fatal generator error:', err);
  process.exit(1);
});
