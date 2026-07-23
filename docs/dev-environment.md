# Dev-Environment & Mobile-Preview-Loop

Ziel: **Unterwegs per Claude Code ein Feature entwickeln → das Ergebnis direkt am Smartphone
testen → bei Erfolg den PR mergen.**

Dafür gibt es eine geteilte **Dev-Umgebung** (Dev-Backend + Dev-Supabase mit echten Seed-Daten)
und ein **statisches Web-Preview** des Frontends, das im Handy-Browser geöffnet wird. Ein
Test-User-Auto-Login überspringt den Login-Screen, sodass die App sofort mit echten Daten
gerendert wird.

```
Claude pusht Branch/PR
        │
        ▼
Railway baut  ──►  Dev-Backend (API)          ─┐
              └►  statisches Frontend-Preview  ─┤──►  Dev-Supabase (self-hosted, geteilt)
        │                                        │        (Seed-Daten + Test-User)
        ▼                                        │
Preview-URL am PR  ──►  am Handy öffnen  ──►  Test-User bereits eingeloggt  ──►  testen  ──►  mergen
```

Der native Android-Build (Play Store) ist davon **unberührt** — der Web-Preview ist nur der
schnelle Test-Loop. Native-only Funktionen (nativer Google-Login, RevenueCat-Kauf, lokale
Notifications) laufen im Browser nicht; der Test-User-Login und der `kb_simulate_premium`-Dev-
Override decken das für Feature-Tests ab.

---

## Repo-Bausteine (bereits im Code)

| Baustein | Datei | Zweck |
|----------|-------|-------|
| Env-Flags | `frontend/src/env.ts` | `VITE_TEST_LOGIN` + Test-User-Creds, ein Ort für den Auth-Bypass |
| Auto-Login | `frontend/src/context/AuthContext.tsx` | Bei `TEST_LOGIN_ENABLED` automatischer `signInWithPassword` → echtes JWT |
| Dev-Env | `frontend/.env.development` | Nicht-geheime Flags (`VITE_TEST_LOGIN=true`); URLs/Keys via Railway/`.local` |
| Web-Serve | `frontend/railway.json`, Script `build:dev` / `serve:dev`, Dev-Dep `serve` | Statisches Hosting des `dist` (`serve -s dist -l $PORT`) |
| Seed | `backend/src/scripts/seedDev.ts`, Script `seed:dev` | Test-User + Beispielrezepte/Collection in Dev-Supabase |

**Sicherheit:** Der Auto-Login ist hart hinter `VITE_TEST_LOGIN` — im Prod/Play-Store-Build ist die
Flag ungesetzt und der Code inaktiv. Test-Credentials stehen **nie** im Repo, sondern nur in
Railway-Build-Variablen bzw. in `frontend/.env.development.local` (git-ignored via `.env*.local`).

---

## Einmalige Einrichtung (Dashboards)

### 1. Vollständiges DB-Schema beschaffen (Voraussetzung)

`backend/supabase_schema.sql` enthält **nicht** die Kern-Tabelle `public.jobs` (nur `ALTER`s darauf
plus `collections`, `recipe_collections`, `feedback`, `global_settings`). Exportiere das komplette
Schema aus der bestehenden Supabase (Dashboard → Database → Schema, oder `pg_dump --schema-only`)
inkl. `jobs` und der RPC `claim_next_job`, und lege es als `backend/db/schema.sql` ab. Ohne dieses
Schema können weder self-host noch Seed die `jobs`-Tabelle befüllen.

### 2. Dev-Supabase self-hosted auf Railway

- Neues Railway-**Dev-Environment** (getrennt von Prod) anlegen.
- Supabase über das **offizielle Supabase-Railway-Template** deployen (Postgres, GoTrue, PostgREST,
  Storage, Kong) — den Stack nicht von Hand zusammenbauen.
- Schema einspielen: zuerst `backend/db/schema.sql` (Schritt 1), dann `backend/supabase_schema.sql`
  (Migrationen/Settings/Buckets).
- *Fallback, falls self-host zu fummelig wird:* ein managed **supabase.com Dev-Projekt** — identische
  Env-Vars, deutlich weniger Betrieb. GoTrue/JWKS funktionieren dort out-of-the-box.

### 3. Dev-Backend auf Railway

Reuse des vorhandenen root-`Dockerfile` (kein eigenes `backend/railway.json` nötig): neuen Railway-
Service im Dev-Environment mit Repo-Root als Build-Context anlegen. Env-Vars:

- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` → Dev-Supabase
- `GEMINI_API_KEY`, `APIFY_TOKEN` → müssen **gesetzt** sein, damit der Prozess bootet
  (`backend/src/config.ts` wirft sonst). Dummy-Werte reichen, solange keine echte Extraction im Dev
  gebraucht wird.
- `ROLE=web` (zum Ansehen/Testen genügt der Web-Teil; Worker optional).
- `CORS_ORIGIN` auf die Preview-Domain(s) setzen.

### 4. Frontend-Preview auf Railway

- Service mit Root-Directory `frontend` (nutzt `frontend/railway.json`: NIXPACKS, `build:dev`,
  `serve -s dist -l $PORT`).
- Build-Variablen: `VITE_API_BASE_URL` = Dev-Backend-URL, `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_PUBLISHABLE_KEY` = Dev-Supabase, `VITE_TEST_LOGIN=true`,
  `VITE_TEST_USER_EMAIL` / `VITE_TEST_USER_PASSWORD` = Seed-Test-User.

### 5. Seed ausführen

```bash
cd backend
SUPABASE_URL=<dev> SUPABASE_SECRET_KEY=<dev-service-key> \
SEED_TEST_USER_EMAIL=test@dev.snagbite.local SEED_TEST_USER_PASSWORD=<pw> \
npm run seed:dev
```

Legt den Test-User (email-confirmed) an und schreibt 3 fertige Rezepte + 1 Collection. Idempotent
(feste IDs, Upsert). Verweigert die Ausführung, wenn `SUPABASE_URL` nach Produktion aussieht.

### 6. Pro-PR-Previews (der eigentliche Loop)

Railway↔GitHub-Integration mit **PR-Environments** aktivieren: pro PR werden Dev-Backend + Frontend
ephemer deployt, alle gegen die geteilte Dev-Supabase, und Railway postet die Preview-URL am PR. Du
öffnest die URL am Handy, testest, mergst.

---

## Lokal testen (ohne Railway)

```bash
# 1. Secrets für den lokalen Lauf (git-ignored)
cat > frontend/.env.development.local <<'EOF'
VITE_SUPABASE_URL=<dev-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<dev-anon-key>
VITE_API_BASE_URL=<dev-backend-url-oder-leer-für-proxy>
VITE_TEST_USER_EMAIL=test@dev.snagbite.local
VITE_TEST_USER_PASSWORD=<pw>
EOF

# 2. Dev-Server (auto-login als Test-User)
npm run dev -w frontend

# 3. Oder den Preview-Build wie in Prod servieren
npm run build:dev -w frontend
npm run serve:dev -w frontend   # http://localhost:4173
```

Erwartung: Die App landet **direkt in der Haupt-UI** (Katalog mit Seed-Rezepten), nicht auf dem
Login-Screen.

## Regression / Sicherheit prüfen

- `npm run build -w frontend` (ohne `VITE_TEST_LOGIN`) baut unverändert; der Auto-Login-Code ist
  inaktiv → Play-Store-Build ist nicht betroffen.
- Test-Credentials tauchen nie im Repo auf (nur `.env*.local` / Railway-Variablen).
