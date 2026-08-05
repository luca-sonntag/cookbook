# 🎮 Gamification (Koch-Belohnungen, XP, Streaks)

Erster Wurf: Nutzer verdienen **XP** und **Coins** fürs Nachkochen von Rezepten,
steigen im **Level** auf, halten **Streaks** und schalten **Abzeichen** frei. Ziel
ist mehr Kochen — bewusst als Single-Player-Loop, mit freigehaltenen Andockpunkten
für Social/Shop/AI-Verifizierung.

## 1. Leitprinzipien

* **Trust ist ein Bonus, keine Strafe.** Jeder ehrliche Cook bekommt die volle
  Basis — auch wer nicht im (Premium-)Kochmodus kocht und keine App-Timer nutzt.
  Ein **Ergebnis-Foto** (optional) gibt +50 % und macht den Cook
  *leaderboard-fähig*. Die „Ich hab gekocht"-Aktion ist **nicht** premium-gated.
* **Anti-Grind über Diminishing Returns**, nicht über Misstrauen: Wiederholungen
  desselben Rezepts fallen schnell ab, plus ein Tages-Softcap.
* **Server-autoritativ.** Punkte werden ausschließlich im Backend (service-role)
  vergeben; das Frontend rechnet nichts an.
* **Config statt Redeploy.** Die Formel liegt als JSON-Zeile in `global_settings`.

## 2. Datenmodell (`backend/supabase_schema.sql`)

Alles additiv, RLS aktiv (`SELECT`-own als Defense-in-Depth; Writes nur service-role):

* **`cook_events`** — append-only Ereignis (User, Rezept, XP/Coins, `has_photo`,
  `verified`, `leaderboard_eligible`, `trust_score`, `via_cooking_mode`,
  `timer_elapsed`). Die letzten Felder werden schon geschrieben, aber noch nicht
  bepunktet — Andockpunkt für spätere Trust-Signale.
* **`point_ledger`** — append-only, eine Zeile pro Gutschrift (ermöglicht spätere
  zeitfenster-basierte Leaderboards, Undo, Audit).
* **`user_stats`** — Aggregat pro User (xp, level, coins, current/longest streak,
  last_cook_date, total_cooks) für schnelle Reads im Fortschritt-Tab.
* **`user_badges`** — freigeschaltete Abzeichen (additiv).
* **Storage-Bucket `cook-photos`** (privat), Muster wie `feedback-screenshots`.
* **`global_settings.gamification_config`** — die tunebare Formel als JSON.

## 3. Punkte-Engine (`backend/src/gamification*.ts`)

* **`gamificationFormula.ts`** — reine, hermetisch getestete Formel
  (`computeAward`, `softcapFactor`, `streakMultiplier`, `levelForXp`). Tests:
  `gamificationFormula.test.ts` (`node --import tsx --test`).
* **`gamification.ts`** — `recordCook()` orchestriert: lädt Config/Aggregate,
  Duplikat-/Velocity-Guard, Streak-Fortschreibung (UTC-Tage), Level, Badges,
  schreibt `cook_events` + `point_ledger` + `user_stats`.

Formel: `XP = 100 × Schwierigkeit × Wiederholung + Neuheit`, dann `× Streak`;
`Coins = ⌊XP × 0.1⌋`. Schwierigkeit ist zum Start flach ×1 (kein `difficulty`-Feld
im Recipe/Gemini-Schema); Cuisine-Neuheit ist als Config-Wert vorhanden, aber
inaktiv (kein Cuisine-Signal).

## 4. Endpoints (`backend/src/routes.ts`)

* `POST /api/jobs/:id/cooked` — verbucht einen Cook (alle User; optionales
  `photoBase64` → Bonus + leaderboard-fähig). Antwort enthält `stats`, `earned`,
  `newBadges`, `previousXp/previousLevel/leveledUp` für die Overlay-Animation.
* `GET /api/me/gamification` — `stats` + `badges` + `levelThresholds` für den Tab.

## 5. Frontend

* **`context/GamificationContext.tsx`** — `markCooked()` + gecachte Stats/Badges;
  rendert am App-Root das **`RewardOverlay`** (geblurrtes Vollbild, animiert
  füllender XP-Balken, Level-Up-Sequenz + CSS-Konfetti, `prefers-reduced-motion`).
* **`components/CookedButton.tsx`** — die CTA in `RecipeDetails` (optionales Foto,
  client-komprimiert via `utils/imageCompression`).
* **`components/ProgressView/`** — der Tab **„Fortschritt"** (`progress`-Route in
  `useHashRouter`, Nav-Button in `App.tsx`): Level/XP-Balken, Streak/Coins/Cooks,
  Badge-Gitter. Coins werden angezeigt, **kein Shop** (erster Wurf).
* **`utils/streakReminder.ts`** — best-effort lokale Notification (Streak-Erinnerung)
  über `@capacitor/local-notifications`; no-op auf Web / ohne Permission.

## 6. Für später freigehalten

Leaderboard (Query über `point_ledger`, `leaderboard_eligible` steht schon),
Coin-Shop (`coins` akkumulieren bereits), Foto-KI-/Peer-Verifizierung (hebt
`trust_score`), Challenges/Seasonal, Schwierigkeits-/Cuisine-Tuning
(Config-Werte vorhanden) — alles ohne Schema-Änderung andockbar.
