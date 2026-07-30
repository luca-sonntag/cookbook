# 🗑️ Obsolete Code & Deprecated References Tracking

Dieses Dokument protokolliert veralteten Code, ersetzte Heuristiken, alte Hilfsfunktionen und ausgemusterte Architekturen im Projekt. Es dient als Referenz, um Wieder-Einführungen alter Anti-Pattern zu verhindern.

---

## 📜 Chronologische Übersicht

### 2026-07-30: Rollback-basierte Optimistic Updates & cache-loser History-Fetch

* **Ersetzter Code / Anti-Pattern:**
  - Direkte `fetch()`-Mutationen mit *Rollback bei Fehler* in `useSavedCatalog.ts` (`toggleFavorite`/`toggleFlag`/`setRecipeFlags`/`assignCollections` sowie der DELETE-Loop in `handleBulkDelete`): Offline-Änderungen gingen verloren, ein Netzfehler rollte die Optimistic-State zurück.
  - `handleDeleteJob` in `App.tsx` als blockierender DELETE-Request mit Fehler-Dialog.
  - `fetchHistory` als einzige Quelle des Katalogs *ohne* lokalen Cache — bei Kaltstart ohne Netz (`token === null`) blieb das Kochbuch leer.
* **Ersetzt durch:**
  - Durable **Write-Outbox** (`utils/outbox.ts` + reine `utils/reconcile.ts`): Job-Level-Ops werden eingereiht, lokal angewandt und bei Reconnect gedrained (LWW, Backoff-Retry). Optimistic-Maps bleiben nur für sofortiges In-Session-Feedback (kein Rollback mehr).
  - **Read-Cache** (`utils/recipeStore.ts`) + Pending-Overlay (`reconcileHistory`) bei Hydrate/`fetchHistory` → Sofort-Start und Offline-Lesbarkeit.
  - Flush-Trigger via `hooks/useOfflineSync.ts` (Start/`online`/App-Resume).
* **Betroffene Dateien:** `frontend/src/App.tsx`, `frontend/src/hooks/useSavedCatalog.ts`, `frontend/src/utils/recipeStore.ts`, `frontend/src/utils/outbox.ts`, `frontend/src/utils/reconcile.ts`, `frontend/src/hooks/useOfflineSync.ts`.

---

### 2026-07-29: Zutaten-Koch-Checkliste & Auto-Check von Vorratsartikeln (Staples)

* **Ersetzter Code / Anti-Pattern:**
  - `checkedIngredients` und `toggleIngredient` zur Nachverfolgung abgehakter Zutaten direkt in der Rezeptansicht.
  - Voreinstellungen für Vorratsartikel (wie Salz, Öl, Pfeffer) über `buildStapleDefaults` in `useRecipeProgress.ts` (führte beim ersten Öffnen zu bereits durchgestrichenen Zutaten und Verwirrung).
* **Ersetzt durch:**
  - Rein informative Zutaten-Listenansicht (ohne Checkboxen, Klick-Trigger oder Durchstreichungen) in `RecipeIngredients.tsx`.
  - Dediziertes `ShoppingConfirmSheet.tsx` beim Klick auf „Zur Einkaufsliste hinzufügen“, in dem Vorratsartikel vorausgefüllt abgewählt, aber manuell steuerbar sind.
* **Betroffene Dateien:** `frontend/src/hooks/useRecipeProgress.ts`, `frontend/src/components/RecipeDetails/RecipeIngredients.tsx`, `frontend/src/components/RecipeDetails/index.tsx`.

---

### 2026-07-27: LLM-basiertes Inline-Tagging & Refactoring der Zeit- Parsing-Heuristik

* **Ersetzter Code / Anti-Pattern:**
  - `parseTimeToSeconds` in `RecipeInstructionText.tsx` (25-zeiliges Regex-Hilfsmittel für 15+ Sprachen).
  - `timePattern` Regex-String in `RecipeInstructionText.tsx` für Zeitwörter (`Minuten`, `hours`, `godziny`, `dakika`, etc.).
  - Naives String-Matching (`includes()`) & sprachspezifische Suffix-Toleranz (`[\p{L}]{0,2}`) für deutsche Endungen (`Zwiebel` $\rightarrow$ `Zwiebeln`) in `ingredientMatch.ts`.
* **Ersetzt durch:**
  - Gemini Inline-Tagging: `[Wort](ing:baseName)` für Zutaten und `[Zeit](timer:seconds)` für Zeitangaben direkt aus dem KI-Layer.
  - Universelles `extractInlineIngredientTags` & `extractInlineTimerTags` in `frontend/src/utils/ingredientMatch.ts`.
* **Betroffene Dateien:** `frontend/src/components/RecipeInstructionText.tsx`, `frontend/src/utils/ingredientMatch.ts`, `backend/src/gemini.ts`.

---

### Prior: Apify Media Downloader Actor Migration

* **Ersetzter Code:**
  - Drittanbieter-Actor `rover-omniscraper/media-downloader-actor`.
* **Ersetzt durch:**
  - Eigener Apify-Actor `social-video-downloader` (Quellcode im Nachbar-Repo `../apify-actor`) basierend auf `yt-dlp` mit Residential Proxies.
* **Betroffene Dateien:** `backend/src/scrapers/providers/index.ts`.
