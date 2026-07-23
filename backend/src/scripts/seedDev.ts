/**
 * Seed a DEV Supabase project with a test user and a handful of realistic,
 * completed recipes so the frontend preview shows real data (catalog, recipe
 * details, a collection) without running the extraction pipeline.
 *
 * SAFETY: run this ONLY against a dev/self-hosted Supabase — never production.
 * It creates its own service-role client from env (it does not import the app
 * config, so Gemini/Apify keys are not required just to seed).
 *
 * Prerequisites:
 *   - The dev Supabase schema is already applied (jobs, collections,
 *     recipe_collections, global_settings, feedback). The core `jobs` table DDL
 *     is not in this repo — export it from the existing Supabase first
 *     (see docs/dev-environment.md).
 *
 * Required env (e.g. in backend/.env or the shell):
 *   SUPABASE_URL, SUPABASE_SECRET_KEY   — dev project + service-role key
 *   SEED_TEST_USER_EMAIL                — test user email (default test@dev.snagbite.local)
 *   SEED_TEST_USER_PASSWORD             — test user password (required)
 *
 * Usage:
 *   cd backend && SEED_TEST_USER_PASSWORD=... npm run seed:dev
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const TEST_USER_EMAIL = process.env.SEED_TEST_USER_EMAIL || 'test@dev.snagbite.local';
const TEST_USER_PASSWORD = process.env.SEED_TEST_USER_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Point them at your DEV project.');
  process.exit(1);
}
if (!TEST_USER_PASSWORD) {
  console.error('Missing SEED_TEST_USER_PASSWORD. Set a password for the seeded test user.');
  process.exit(1);
}

// Refuse to run against anything that looks like the production host, as a guard.
if (/\bprod\b|production/i.test(SUPABASE_URL)) {
  console.error(`Refusing to seed: SUPABASE_URL "${SUPABASE_URL}" looks like production.`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Stable IDs so re-running the seed upserts instead of duplicating. */
const RECIPE_ONE_ID = '11111111-1111-4111-8111-111111111111';
const RECIPE_TWO_ID = '22222222-2222-4222-8222-222222222222';
const RECIPE_THREE_ID = '33333333-3333-4333-8333-333333333333';
const COLLECTION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

interface SeedRecipe {
  id: string;
  url: string;
  isFavorite: boolean;
  recipe: Record<string, unknown>;
}

const recipes: SeedRecipe[] = [
  {
    id: RECIPE_ONE_ID,
    url: 'https://www.instagram.com/reel/seed-tuscan-chicken/',
    isFavorite: true,
    recipe: {
      title: 'Creamy Tuscan Chicken',
      description: 'Saftige Hähnchenbrust in einer cremigen Sauce mit Spinat und getrockneten Tomaten.',
      emoji: '🍗',
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      ingredients: [
        {
          name: 'Hauptzutaten',
          items: [
            { name: 'Hähnchenbrust', amount: 4, unit: 'Stück', notes: 'in Scheiben' },
            { name: 'Sahne', amount: 250, unit: 'ml' },
            { name: 'Getrocknete Tomaten', amount: 100, unit: 'g', notes: 'in Öl' },
            { name: 'Babyspinat', amount: 150, unit: 'g' },
            { name: 'Knoblauch', amount: 3, unit: 'Zehen', notes: 'gehackt' },
            { name: 'Parmesan', amount: 50, unit: 'g', notes: 'gerieben' },
          ],
        },
      ],
      instructions: [
        { step: 1, description: 'Hähnchen mit Salz und Pfeffer würzen und goldbraun anbraten. Herausnehmen.' },
        { step: 2, description: 'Knoblauch und getrocknete Tomaten kurz anbraten, dann Sahne einrühren.' },
        { step: 3, description: 'Parmesan und Spinat unterrühren, bis der Spinat zusammenfällt.' },
        { step: 4, description: 'Hähnchen zurück in die Pfanne geben und in der Sauce erwärmen.' },
      ],
      equipment: ['Große Pfanne', 'Kochlöffel'],
      tags: ['Hauptgericht', 'Cremig', 'Schnell'],
    },
  },
  {
    id: RECIPE_TWO_ID,
    url: 'https://www.instagram.com/reel/seed-veggie-curry/',
    isFavorite: false,
    recipe: {
      title: 'Schnelles Kichererbsen-Curry',
      description: 'Ein wärmendes veganes Curry mit Kokosmilch, in 25 Minuten fertig.',
      emoji: '🍛',
      prepTime: 5,
      cookTime: 20,
      servings: 3,
      ingredients: [
        {
          name: 'Curry',
          items: [
            { name: 'Kichererbsen', amount: 400, unit: 'g', notes: 'aus der Dose, abgetropft' },
            { name: 'Kokosmilch', amount: 400, unit: 'ml' },
            { name: 'Currypaste', amount: 2, unit: 'EL' },
            { name: 'Zwiebel', amount: 1, unit: 'Stück', notes: 'gewürfelt' },
            { name: 'Spinat', amount: 100, unit: 'g' },
          ],
        },
      ],
      instructions: [
        { step: 1, description: 'Zwiebel glasig dünsten, Currypaste zugeben und kurz mitrösten.' },
        { step: 2, description: 'Kokosmilch und Kichererbsen zugeben, 15 Minuten köcheln lassen.' },
        { step: 3, description: 'Spinat unterrühren und mit Reis servieren.' },
      ],
      equipment: ['Topf'],
      tags: ['Vegan', 'Curry', 'One-Pot'],
    },
  },
  {
    id: RECIPE_THREE_ID,
    url: 'https://www.instagram.com/reel/seed-banana-pancakes/',
    isFavorite: false,
    recipe: {
      title: 'Fluffige Bananen-Pancakes',
      description: 'Drei-Zutaten-Pancakes für ein schnelles Frühstück.',
      emoji: '🥞',
      prepTime: 5,
      cookTime: 10,
      servings: 2,
      ingredients: [
        {
          name: 'Teig',
          items: [
            { name: 'Reife Banane', amount: 2, unit: 'Stück' },
            { name: 'Eier', amount: 2, unit: 'Stück' },
            { name: 'Haferflocken', amount: 60, unit: 'g' },
          ],
        },
      ],
      instructions: [
        { step: 1, description: 'Alle Zutaten zu einem glatten Teig pürieren.' },
        { step: 2, description: 'Kleine Pancakes in einer beschichteten Pfanne von beiden Seiten backen.' },
      ],
      equipment: ['Pürierstab', 'Pfanne'],
      tags: ['Frühstück', 'Süß'],
    },
  },
];

async function getOrCreateTestUser(): Promise<string> {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    email_confirm: true,
  });

  if (!error && created.user) {
    console.log(`Created test user ${TEST_USER_EMAIL}`);
    return created.user.id;
  }

  // Already exists → find its id via the admin list.
  console.log(`Test user ${TEST_USER_EMAIL} already exists, looking it up…`);
  let page = 1;
  // Paginate defensively in case the dev project has many users.
  for (; page <= 20; page++) {
    const { data, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (listErr) throw new Error(`Failed to list users: ${listErr.message}`);
    const match = data.users.find(u => u.email?.toLowerCase() === TEST_USER_EMAIL.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  throw new Error(`Could not create or find test user ${TEST_USER_EMAIL} (createUser error: ${error?.message})`);
}

function normalizeUrl(urlStr: string): string {
  let clean = urlStr.replace(/^(https?:\/\/)?(www\.)?/i, '');
  clean = clean.split('?')[0];
  clean = clean.endsWith('/') ? clean.slice(0, -1) : clean;
  return clean.toLowerCase();
}

async function main() {
  const userId = await getOrCreateTestUser();
  const now = new Date().toISOString();

  // Recipes (completed jobs).
  const jobRows = recipes.map(r => ({
    id: r.id,
    url: r.url,
    url_normalized: normalizeUrl(r.url),
    status: 'completed',
    error: null,
    recipe: { ...r.recipe, id: r.id },
    user_id: userId,
    is_favorite: r.isFavorite,
    flags: [] as string[],
    media_bytes: 0,
    created_at: now,
    updated_at: now,
  }));

  const { error: jobsErr } = await supabase.from('jobs').upsert(jobRows, { onConflict: 'id' });
  if (jobsErr) throw new Error(`Failed to seed jobs: ${jobsErr.message}`);
  console.log(`Seeded ${jobRows.length} recipes.`);

  // A collection with two of the recipes in it.
  const { error: colErr } = await supabase.from('collections').upsert(
    {
      id: COLLECTION_ID,
      user_id: userId,
      name: 'Wochenküche',
      emoji: '📅',
      position: 0,
      created_at: now,
      updated_at: now,
    },
    { onConflict: 'id' },
  );
  if (colErr) throw new Error(`Failed to seed collection: ${colErr.message}`);

  const { error: memErr } = await supabase.from('recipe_collections').upsert(
    [
      { collection_id: COLLECTION_ID, job_id: RECIPE_ONE_ID, user_id: userId },
      { collection_id: COLLECTION_ID, job_id: RECIPE_TWO_ID, user_id: userId },
    ],
    { onConflict: 'collection_id,job_id' },
  );
  if (memErr) throw new Error(`Failed to seed recipe_collections: ${memErr.message}`);
  console.log('Seeded 1 collection with 2 recipes.');

  console.log('\n✅ Dev seed complete.');
  console.log(`   User:     ${TEST_USER_EMAIL}`);
  console.log(`   User ID:  ${userId}`);
  console.log('   Set VITE_TEST_USER_EMAIL / VITE_TEST_USER_PASSWORD in the frontend preview to auto-login as this user.');
}

main().catch(err => {
  console.error('Seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
