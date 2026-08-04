# 🗑️ Obsolete Code & Deprecated References Tracking

Dieses Dokument protokolliert veralteten Code, ersetzte Heuristiken, alte Hilfsfunktionen und ausgemusterte Architekturen im Projekt. Es dient als Referenz, um Wieder-Einführungen alter Anti-Pattern zu verhindern.

---

## 📜 Chronologische Übersicht

### 2026-08-04: FCM Push-Benachrichtigung BigPictureStyle-Banner durch quadratisches Emoji-Icon ersetzt

* **Ersetzter Code / Anti-Pattern:**
  - Standard Android `NotificationCompat.BigPictureStyle` mit großem 800x400 PNG Banner (`/api/push-banner`).
* **Ersetzt durch:**
  - Quadratisches 256x256 `setLargeIcon()` PNG mit Theme-Farbverlauf und centered Google Noto Color Emoji (`/api/push-icon`) für sauberes, konsistentes Inline-Layout auf mobilen Geräten.
* **Betroffene Dateien:** `backend/src/notifications/worker.ts`, `frontend/android/app/src/main/java/at/snagbite/app/MyFirebaseMessagingService.java`.

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
