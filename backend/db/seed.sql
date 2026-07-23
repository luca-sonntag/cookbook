-- Sample dev data (recipes + a collection) for the seeded test user.
--
-- This is the SQL equivalent of the data step in backend/src/scripts/seedDev.ts,
-- for when you'd rather paste into the Supabase Studio SQL editor than run node.
-- It does NOT create the auth user — create that first via seedDev.ts (GoTrue
-- Admin API) or Studio → Authentication → Add user, then set the email below.
--
-- Idempotent: fixed IDs + ON CONFLICT upserts. Re-running is safe.
-- Prerequisite: backend/db/schema.sql and backend/supabase_schema.sql applied.

do $$
declare
  v_email text := 'test@dev.snagbite.local';   -- keep in sync with SEED_TEST_USER_EMAIL / VITE_TEST_USER_EMAIL
  v_user  uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(v_email) limit 1;
  if v_user is null then
    raise exception 'Seed user % not found — create it first (seedDev.ts or Studio).', v_email;
  end if;

  insert into public.jobs (id, url, url_normalized, status, recipe, user_id, is_favorite, created_at, updated_at)
  values
    ('11111111-1111-4111-8111-111111111111',
     'https://www.instagram.com/reel/seed-tuscan-chicken/', 'instagram.com/reel/seed-tuscan-chicken',
     'completed',
     jsonb_build_object(
       'id','11111111-1111-4111-8111-111111111111','title','Creamy Tuscan Chicken',
       'description','Saftige Hähnchenbrust in cremiger Sauce mit Spinat und getrockneten Tomaten.',
       'emoji','🍗','prepTime',10,'cookTime',20,'servings',4,
       'ingredients', jsonb_build_array(jsonb_build_object('name','Hauptzutaten','items', jsonb_build_array(
         jsonb_build_object('name','Hähnchenbrust','amount',4,'unit','Stück','notes','in Scheiben'),
         jsonb_build_object('name','Sahne','amount',250,'unit','ml'),
         jsonb_build_object('name','Getrocknete Tomaten','amount',100,'unit','g'),
         jsonb_build_object('name','Babyspinat','amount',150,'unit','g'),
         jsonb_build_object('name','Parmesan','amount',50,'unit','g','notes','gerieben')))),
       'instructions', jsonb_build_array(
         jsonb_build_object('step',1,'description','Hähnchen würzen und goldbraun anbraten, herausnehmen.'),
         jsonb_build_object('step',2,'description','Knoblauch und Tomaten anbraten, Sahne einrühren.'),
         jsonb_build_object('step',3,'description','Parmesan und Spinat unterrühren.'),
         jsonb_build_object('step',4,'description','Hähnchen zurück in die Sauce geben und erwärmen.')),
       'equipment', jsonb_build_array('Große Pfanne'), 'tags', jsonb_build_array('Hauptgericht','Cremig')),
     v_user, true, now(), now()),
    ('22222222-2222-4222-8222-222222222222',
     'https://www.instagram.com/reel/seed-veggie-curry/', 'instagram.com/reel/seed-veggie-curry',
     'completed',
     jsonb_build_object(
       'id','22222222-2222-4222-8222-222222222222','title','Schnelles Kichererbsen-Curry',
       'description','Wärmendes veganes Curry mit Kokosmilch, in 25 Minuten fertig.',
       'emoji','🍛','prepTime',5,'cookTime',20,'servings',3,
       'ingredients', jsonb_build_array(jsonb_build_object('name','Curry','items', jsonb_build_array(
         jsonb_build_object('name','Kichererbsen','amount',400,'unit','g','notes','abgetropft'),
         jsonb_build_object('name','Kokosmilch','amount',400,'unit','ml'),
         jsonb_build_object('name','Currypaste','amount',2,'unit','EL'),
         jsonb_build_object('name','Zwiebel','amount',1,'unit','Stück','notes','gewürfelt'),
         jsonb_build_object('name','Spinat','amount',100,'unit','g')))),
       'instructions', jsonb_build_array(
         jsonb_build_object('step',1,'description','Zwiebel dünsten, Currypaste mitrösten.'),
         jsonb_build_object('step',2,'description','Kokosmilch + Kichererbsen 15 Min köcheln.'),
         jsonb_build_object('step',3,'description','Spinat unterrühren, mit Reis servieren.')),
       'equipment', jsonb_build_array('Topf'), 'tags', jsonb_build_array('Vegan','One-Pot')),
     v_user, false, now(), now()),
    ('33333333-3333-4333-8333-333333333333',
     'https://www.instagram.com/reel/seed-banana-pancakes/', 'instagram.com/reel/seed-banana-pancakes',
     'completed',
     jsonb_build_object(
       'id','33333333-3333-4333-8333-333333333333','title','Fluffige Bananen-Pancakes',
       'description','Drei-Zutaten-Pancakes fürs schnelle Frühstück.',
       'emoji','🥞','prepTime',5,'cookTime',10,'servings',2,
       'ingredients', jsonb_build_array(jsonb_build_object('name','Teig','items', jsonb_build_array(
         jsonb_build_object('name','Reife Banane','amount',2,'unit','Stück'),
         jsonb_build_object('name','Eier','amount',2,'unit','Stück'),
         jsonb_build_object('name','Haferflocken','amount',60,'unit','g')))),
       'instructions', jsonb_build_array(
         jsonb_build_object('step',1,'description','Alle Zutaten glatt pürieren.'),
         jsonb_build_object('step',2,'description','Kleine Pancakes beidseitig backen.')),
       'equipment', jsonb_build_array('Pfanne'), 'tags', jsonb_build_array('Frühstück','Süß')),
     v_user, false, now(), now())
  on conflict (id) do update set recipe = excluded.recipe, updated_at = now();

  insert into public.collections (id, user_id, name, emoji, position, created_at, updated_at)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', v_user, 'Wochenküche', '📅', 0, now(), now())
  on conflict (id) do nothing;

  insert into public.recipe_collections (collection_id, job_id, user_id) values
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111', v_user),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222', v_user)
  on conflict (collection_id, job_id) do nothing;
end $$;
