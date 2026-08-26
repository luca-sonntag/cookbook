import fs from 'node:fs';
import path from 'node:path';
import canonicalData from '../data/canonicalIngredientsData.json' with { type: 'json' };
import { packIngredientIcons, getIngredientImagesDir } from '../ingredientIconPacker.js';

const GERMAN_MAP: Record<string, string> = {
  'aal_gruen': 'eel_raw',
  'ananas_geduenstet': 'pineapple_steamed',
  'apfelkorn': 'apple_liqueur',
  'apfelkuechlein_gebraten': 'apple_fritter',
  'apfelnektar_mit_suessungsmitteln': 'apple_nectar_diet',
  'apfel_geduenstet': 'apple_steamed',
  'apfel_geschaelt': 'apple_peeled',
  'baerlauch_roh': 'wild_garlic',
  'banane_roh': 'banana',
  'bier_alkoholfrei': 'non_alcoholic_beer',
  'birne_geduenstet': 'pear_steamed',
  'birne_getrocknet': 'pear_dried',
  'birne_roh': 'pear',
  'blattsalat_roh': 'lettuce',
  'bleichsellerie_roh': 'celery',
  'blumenkohl_geduenstet': 'cauliflower_steamed',
  'blumenkohl_roh': 'cauliflower',
  'bohnen_brechbohnen_gruen_geduenstet': 'green_beans_steamed',
  'bohnen_brechbohnen_gruen_roh': 'green_beans',
  'bohnen_dicke_bohnen_geduenstet': 'broad_beans_steamed',
  'bohnen_dicke_bohnen_roh': 'broad_beans',
  'bohnen_wachsbohnen_gelb_geduenstet': 'yellow_wax_beans_steamed',
  'bohnen_wachsbohnen_gelb_roh': 'yellow_wax_beans',
  'brausepulver': 'sherbet_powder',
  'brechbohnen_gruen_in_salzwasser': 'green_beans_canned',
  'brennnesselblaetter_roh': 'stinging_nettle',
  'broetchen_vollkorn': 'whole_grain_roll',
  'broetchen_weizen': 'wheat_roll',
  'broetchen_weizenmisch': 'mixed_wheat_roll',
  'brokkoli_geduenstet': 'broccoli_steamed',
  'brokkoli_roh': 'broccoli',
  'brot_mischbrot': 'mixed_bread',
  'brot_roggenbrot': 'rye_bread',
  'brot_roggenvollkorn': 'whole_grain_rye_bread',
  'brot_toastbrot': 'toast_bread',
  'brot_vollkorn': 'whole_grain_bread',
  'brot_weizenbrot': 'white_bread',
  'brot_weizenvollkorn': 'whole_grain_wheat_bread',
  'brunnenkresse_roh': 'watercress',
  'chicoree_roh': 'chicory',
  'chinesische_nudeln_aus_mungbohnenstaerke_glasnudeln': 'glass_noodles',
  'chinesischer_eierkuchen_frittiert': 'chinese_fried_egg_cake',
  'chinesisches_huehnerfleisch': 'chinese_chicken',
  'dattel_getrocknet': 'date_dried',
  'dattel_frisch': 'date_fresh',
  'dinkelbrot': 'spelt_bread',
  'dinkelmehl': 'spelt_flour',
  'dinkelvollkornbrot': 'whole_grain_spelt_bread',
  'eiernudeln': 'egg_noodles',
  'eigelb': 'egg_yolk',
  'eiweiss': 'egg_white',
  'endivie_roh': 'endive',
  'erbsen_gruen_geduenstet': 'green_peas_steamed',
  'erbsen_gruen_roh': 'green_peas',
  'erdbeere_roh': 'strawberry',
  'erdbeeren_tiefgefroren': 'frozen_strawberries',
  'feldsalat_roh': 'lambs_lettuce',
  'fenchel_roh': 'fennel',
  'feige_frisch': 'fig_fresh',
  'feige_getrocknet': 'fig_dried',
  'fleischwurst': 'bologna_sausage',
  'forelle_roh': 'trout',
  'frischkaese': 'cream_cheese',
  'fruehlingszwiebel_roh': 'spring_onion',
  'garnelen_roh': 'shrimps',
  'gurke_roh': 'cucumber',
  'haferflocken': 'rolled_oat',
  'haehnchenbrust_roh': 'chicken_breast',
  'haehnchenkeule_roh': 'chicken_thigh',
  'haselnuss': 'hazelnut',
  'heidelbeere_roh': 'blueberry',
  'himbeere_roh': 'raspberry',
  'hirschfleisch_roh': 'venison',
  'ingwer_roh': 'ginger',
  'joghurt_mager': 'low_fat_yogurt',
  'joghurt_vollmilch': 'whole_milk_yogurt',
  'kabeljau_roh': 'cod_fillet',
  'kaese_gouda': 'gouda',
  'kaese_mozzarella': 'mozzarella',
  'kaese_parmesan': 'parmesan',
  'kalbfleisch_roh': 'veal',
  'karotte_roh': 'carrot',
  'kartoffel_gekocht': 'potato_boiled',
  'kartoffel_roh': 'potato',
  'kirsche_roh': 'cherry',
  'knoblauch_roh': 'garlic',
  'knoblauchzehe': 'garlic_clove',
  'kohlrabi_roh': 'kohlrabi',
  'kuerbis_roh': 'pumpkin',
  'lachs_roh': 'salmon',
  'lauch_roh': 'leek',
  'leinenoel': 'flaxseed_oil',
  'limette_roh': 'lime',
  'linsen_getrocknet': 'lentils',
  'mais_roh': 'corn',
  'mandel': 'almond',
  'mangold_roh': 'swiss_chard',
  'mango_roh': 'mango',
  'milch_fettarm': 'low_fat_milk',
  'milch_vollmilch': 'whole_milk',
  'moehre_roh': 'carrot',
  'olivenoel': 'olive_oil',
  'orange_roh': 'orange',
  'paprika_edelsuess_pulver': 'sweet_paprika_powder',
  'paprika_gruen_roh': 'green_bell_pepper',
  'paprika_rot_roh': 'red_bell_pepper',
  'petersilie_roh': 'parsley',
  'petersilie_getrocknet': 'dried_parsley',
  'pfirsich_roh': 'peach',
  'pflaume_roh': 'plum',
  'poree_roh': 'leek',
  'putenbrust_roh': 'turkey_breast',
  'quark_mager': 'low_fat_quark',
  'radieschen_roh': 'radish',
  'rapsol': 'rapeseed_oil',
  'rapsoel': 'rapeseed_oil',
  'reis_basmati': 'basmati_rice',
  'reis_jasmin': 'jasmine_rice',
  'reis_vollkorn': 'brown_rice',
  'rettich_roh': 'white_radish',
  'rhabarber_roh': 'rhubarb',
  'rinderhackfleisch': 'ground_beef',
  'rindfleisch_roh': 'beef',
  'roggenmehl': 'rye_flour',
  'rosinen': 'raisins',
  'rote_beete_roh': 'beetroot',
  'rotkohl_roh': 'red_cabbage',
  'rucola_roh': 'arugula',
  'sahne_suess': 'heavy_cream',
  'salatgurke_roh': 'cucumber',
  'salbei_roh': 'sage',
  'salz': 'salt',
  'sauerkraut': 'sauerkraut',
  'schafskaese': 'feta_cheese',
  'schnittlauch_roh': 'chives',
  'schweinefleisch_roh': 'pork',
  'schweinehackfleisch': 'ground_pork',
  'sellerie_roh': 'celery_root',
  'senf_mittelscharf': 'medium_mustard',
  'sesam': 'sesame_seeds',
  'sojasauce': 'soy_sauce',
  'sonnenblumenoel': 'sunflower_oil',
  'spargel_gruen_roh': 'green_asparagus',
  'spargel_weiss_roh': 'white_asparagus',
  'speck_durchwachsen': 'bacon',
  'spinat_roh': 'spinach',
  'thunfisch_roh': 'tuna',
  'thunfisch_in_oel': 'tuna_in_oil',
  'thunfisch_im_eigenen_saft': 'tuna_in_water',
  'tomate_getrocknet': 'sun_dried_tomato',
  'tomate_roh': 'tomato',
  'tomatenmark': 'tomato_paste',
  'traube_roh': 'grapes',
  'walnuss': 'walnut',
  'wassermelone_roh': 'watermelon',
  'weintraube_roh': 'grapes',
  'weizenmehl_type_405': 'all_purpose_flour',
  'weizenmehl_type_550': 'bread_flour',
  'weizenvollkornmehl': 'whole_wheat_flour',
  'weisskohl_roh': 'white_cabbage',
  'wirsing_roh': 'savoy_cabbage',
  'zitrone_roh': 'lemon',
  'zucchini_roh': 'zucchini',
  'zuckerruebensirup': 'sugar_beet_syrup',
  'zucker_weiss': 'white_sugar',
  'zwiebel_roh': 'onion',
};

function cleanSlug(name: string): string {
  return name
    .toLowerCase()
    .split(/[,(]/)[0]
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function main() {
  const iconsDir = getIngredientImagesDir();
  console.log(`\n==================================================`);
  console.log(`🗑️  Purge German Icon Names & Standardize English`);
  console.log(`==================================================`);
  console.log(`📂 Directory: ${iconsDir}`);

  const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.webp'));
  console.log(`📦 Found total webp files: ${files.length}`);

  // Build canonical English lookup
  const canonicalByDe = new Map<string, string>();
  for (const item of canonicalData as any[]) {
    if (item.name_de && item.name_en) {
      const deKey = cleanSlug(item.name_de);
      const enVal = cleanSlug(item.name_en);
      if (deKey && enVal && deKey !== enVal) {
        canonicalByDe.set(deKey, enVal);
      }
    }
  }

  let deletedCount = 0;
  let translatedCount = 0;

  for (const file of files) {
    const base = file.replace(/\.webp$/i, '');

    // Check if it's a known German name
    let targetEn = GERMAN_MAP[base] || canonicalByDe.get(base);

    // Also check patterns
    if (!targetEn) {
      if (base.endsWith('_roh')) {
        const root = base.replace(/_roh$/, '');
        targetEn = GERMAN_MAP[root] || canonicalByDe.get(root) || `${root}_raw`;
      } else if (base.endsWith('_geduenstet')) {
        const root = base.replace(/_geduenstet$/, '');
        targetEn = GERMAN_MAP[root] || canonicalByDe.get(root) || `${root}_steamed`;
      } else if (base.endsWith('_gebraten')) {
        const root = base.replace(/_gebraten$/, '');
        targetEn = GERMAN_MAP[root] || canonicalByDe.get(root) || `${root}_fried`;
      } else if (base.endsWith('_getrocknet')) {
        const root = base.replace(/_getrocknet$/, '');
        targetEn = GERMAN_MAP[root] || canonicalByDe.get(root) || `${root}_dried`;
      }
    }

    if (targetEn) {
      const sourcePath = path.join(iconsDir, file);
      const targetPath = path.join(iconsDir, `${targetEn}.webp`);

      // If target English file does NOT exist yet, copy it over
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        translatedCount++;
      }

      // Always remove the German named file
      if (sourcePath !== targetPath && fs.existsSync(sourcePath)) {
        fs.unlinkSync(sourcePath);
        deletedCount++;
      }
    }
  }

  // Remove any remaining German-style suffixes/prefixes that might have slipped through
  const remaining = fs.readdirSync(iconsDir).filter(f => f.endsWith('.webp'));
  for (const file of remaining) {
    if (
      file.includes('_roh.webp') ||
      file.includes('_geduenstet.webp') ||
      file.includes('_geschaelt.webp') ||
      file.includes('_gekocht.webp') ||
      file.includes('_getrocknet.webp') ||
      file.includes('_gezuckert.webp') ||
      file.includes('_gebraten.webp') ||
      file.includes('_mit_') ||
      file.startsWith('apfel') ||
      file.startsWith('erdbeer') ||
      file.startsWith('kartoffel') ||
      file.startsWith('haehnchen') ||
      file.startsWith('schwein') ||
      file.startsWith('rind') ||
      file.startsWith('milch') ||
      file.startsWith('kaese') ||
      file.startsWith('quark')
    ) {
      fs.unlinkSync(path.join(iconsDir, file));
      deletedCount++;
    }
  }

  const finalFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith('.webp'));
  console.log(`\n✨ Summary:`);
  console.log(`🗑️  Deleted German files: ${deletedCount}`);
  console.log(`🇬🇧 Translated / preserved English files: ${translatedCount}`);
  console.log(`📦 Final clean English icons count: ${finalFiles.length}`);

  // Re-pack zip
  console.log(`\n🗜️  Packing ingredient-icons.zip...`);
  const zipRes = packIngredientIcons({ verbose: true });
  console.log(`📦 Zip updated: ${zipRes.fileCount} files (${zipRes.zipSizeMb} MB) in ${zipRes.durationMs}ms`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
