# 🎨 Frontend-Layer (React 19 & HeroUI v3)

## 1. Stack & Modul-Struktur

* **Technologie:** React 19, Vite, TypeScript, HeroUI v3 (React Aria-basiert), Tailwind CSS v4. Als native Android-App über **Capacitor** gebaut und im **Google Play Store** ausgeliefert.
* **App-Shell (`App.tsx`):**
  * Modular gestaltet, delegiert komplexe Zustände an Custom Hooks.
  * Zeigt ein Auth-Gate (`AuthForm`) bei fehlender Session.
  * **`--app-sticky-top` (Sticky-Offset):** Die Sticky-Kopfregion (Safe-Area-Filler + `TimerBanner`) misst ihre Höhe per `ResizeObserver` und schreibt die Höhe als globale CSS-Variable `--app-sticky-top` auf `document.documentElement`. Views nutzen `sticky top-[var(--app-sticky-top)]`.
  * **`RecipeDetails` Single-Page Scroll-Layout & `RecipeStickyBar`**: Rezept-Detailansicht als einzelne, fließende Scroll-Seite ohne Tabs (Details `RecipeInfoSection`, Zutaten `RecipeIngredients`, Zubereitung `RecipeInstructions`). `RecipeStickyBar` heftet sich an `top-[var(--app-sticky-top)]` und markiert dynamisch per Scroll-Spy die gerade sichtbare Sektion.

### Zentralisierte Kontexte (`frontend/src/context/`)
* **`AuthContext.tsx`:** Verwaltet Supabase Auth Session (`signIn`, `signUp`, `signInWithGoogle`, `signOut`, `getAccessToken`, `isPremium`).
* **`DialogContext.tsx`:** Stellt globalen Dialog-Service (`useDialog()`) bereit, um native Browser-Dialoge durch moderne HeroUI-Dialoge zu ersetzen.
* **`I18nContext.tsx`:** Verwaltet Internationalisierung (Deutsch/Englisch) mit `localStorage`-Persistenz und Browsersprachen-Erkennung.

### Lokalisierung & Error-Code System
* **Lokalisierung (`frontend/src/i18n.ts`):** Übersetzungen für Supermarktabteilungen, Emojis, Sortierung, UI-Texte und Auth.
* **Error-Code-System (`frontend/src/errorCodes.ts` ↔ `backend/src/errors.ts`):**
  * Das Backend liefert maschinenlesbare Codes (`AppErrorCode` + `AppError`-Klasse mit `code`, `params`, `httpStatus`).
  * Asynchrone Fehler werden als JSON-Envelope `{"code","params"}` in `jobs.error` persistiert.
  * `frontend/src/errorCodes.ts` ist eine meldungsfreie Registry (`AppErrorCode`, `ALL_ERROR_CODES`, `isKnownErrorCode`, `parseSerializedError`).
  * Lokalisierte DE/EN-Texte leben in `uiTranslations` unter `error.codes.<CODE>`. `messageForCode(code, params, lang)` löst dynamische Variablen auf.
  * Legacy-Fallback `translateApiError` sichert die Kompatibilität für ungecodete Alt-Meldungen.

---

## 2. 📚 3-Ebenen-Katalog (SavedCatalog)

Der Rezept-Katalog ist als **Kochbuch mit drei Ebenen** aufgebaut:
1. **Kochbuch-Home (`#/history`, `CookbookHome.tsx`):** Browsebare Startseite. Sucheinstieg, Sammlungs-Karussell (`CollectionTile`), Regale (`RecipeShelf.tsx`, `RecipePosterCard` für "Zuletzt geöffnet", "Favoriten", "Schnell gekocht", "Zuletzt gespeichert"), Label-Chips und "Alle N Rezepte ansehen".
2. **Listen-Ebene (`#/history/list...`, `SavedCatalog/index.tsx`):** Vollständige, filter-/sortierbare Liste mit `CatalogFilters.tsx` als Sticky-Header, `FilterSheet` und wahlweise 2-Spalten-Poster-Grid (`viewMode: 'card'`) oder dichten Zeilen (`viewMode: 'compact'`). Nur hier existieren Multi-Select und `BulkActionBar`.
3. **Detailansicht (`#/history/<jobId>`):** `RecipeDetails`.

### Katalog-Features
* **Routing (`SavedCatalog/catalogRoutes.ts`):** `subPath` unterscheidet zwischen List-Routen (`list...`) und `jobId`s (UUIDs).
* **Kombinierbare Filter (`FilterSheet.tsx` + `useSavedCatalog.ts`):** Facetten-Objekt `CatalogFilterState` (`favoritesOnly`, `maxTime`, `collectionIds[]`, `flags[]`). Semantik: OR innerhalb einer Facette, AND zwischen Facetten.
* **Zuletzt geöffnet (`utils/recentRecipes.ts`):** Clientseitiges Recency-Tracking in `localStorage` (`recipe_recent_opened`).
* **Sammlungen (`useCollections.ts`, `CollectionSheet.tsx`):** Benannte Rezept-Gruppen mit 2×2 Mosaik-Cover.
* **Freitext-Labels/Flags (`FlagSheet.tsx`):** Eigene Tags pro Rezept (`job.flags`).

---

## 3. 🖼️ Clientseitiges Image-Caching

* **100% Client-seitig:** Keine Bilddaten werden auf dem Server oder Supabase gespeichert. Original-URLs verbleiben als Metadaten im Rezept-JSON.
* **IndexedDB Store (`frontend/src/utils/imageStore.ts`):** Datenbank `recipe-image-cache` v1, Object Store `images`.
* **Kompression (`useCachedImage.ts`):** HTML5 Canvas `drawImage()` + `toBlob('image/jpeg', 0.75)` mit max. 400px Kantenlänge (~15–40 KB pro Bild).
* **CORS Proxy:** Bilder werden über den `/api/image`-Proxy geladen.
* **Cache-Invalidierung:** Bei Rezept-Löschung werden IndexedDB-Einträge automatisch entfernt.

---

## 4. ⏱️ In-App Koch-Timer (`TimerContext`)

* **Interaktive Badges:** Zeit-Angaben in Zubereitungsschritten sind klickbar (blau unterstrichen).
* **Confirm-Sheet (`TimerConfirmSheet.tsx`):** Schieberegler zur Feineinstellung (±50% der Originalzeit) & Start-Button.
* **Globaler Zustand (`TimerContext.tsx`):** Parallele Countdown-Timer, 500ms Intervall, überleben Tab-Navigation.
* **Alarm:** 3× Beep-Ton via Web Audio API (880 Hz) + Vibration + Native Notification Push.
* **Timer-Banner (`TimerBanner.tsx`):** Sticky unter App-Header. Zeigt Countdown & Fortschrittsbalken. Klick navigiert automatisch zum Herkunftsrezept & Schritt.

---

## 5. 🛒 Smarte Einkaufsliste & Zutat-Taxonomie (`useShoppingList.ts` & `ingredientTaxonomy.ts`)

* **Generische Rohstoff-Konsolidierung (Parent Ingredients):**
  * Rezepte behalten ihre präzisen Zubereitungszutaten (z. B. *2 Eigelb*, *1 TL Zitronenabrieb*, *3 Knoblauchzehen*).
  * **Taxonomie-Engine (`ingredientTaxonomy.ts`):** Mapped Teilzutaten und Derivate automatisch auf übergeordnete Rohstoff-Einkaufsartikel (z. B. *Eigelb / Eiweiß ➔ Ei*, *Zitronenabrieb / Zitronensaft ➔ Zitrone*, *Knoblauchzehe ➔ Knoblauch*).
  * **Aggregations-Logik (`useShoppingList.ts`):** Fasst Zutaten desselben Rohstoffs auf der Einkaufsliste zusammen (z. B. 2 Stück Eigelb + 1 Stück Ei = **3 Stück Ei**).
  * **Sub-Item Breakdown UI (`ShoppingListItem.tsx`):** Blendet unter der aggregierten Hauptzeile die Zusammensetzung der Originalzutaten (z. B. *„(2 Stück Eigelb, 1 Stück Ei)“*) transparent ein.

---

## 5. 💎 Freemium Gating System

* **Tiers:** Free, Alpha, Premium (`user.app_metadata.tier`).
* **Dev-Override:** `localStorage['kb_simulate_premium']` steuert Dev-Modus-Simulation (nur `import.meta.env.DEV`).
* **Gating-Punkte:**
  * **Free:** 3 Extraktionen/Tag, max. 5 gespeicherte Rezepte, max. 1 Rezept auf Einkaufsliste, Nährwerte geblurt, Timer/Kochmodus/Copilot/Sammlungen/Labels gesperrt.
  * **Alpha:** 10 Extraktionen/Tag, max. 20 gespeicherte Rezepte, alle Features freigeschaltet.
  * **Premium:** 50 Extraktionen/Tag, unbegrenztes Kochbuch, alle Features freigeschaltet.
* **Gating-Komponenten:** `PremiumModal.tsx` (Upsell-Dialog), `PremiumHint.tsx` (Goldene Crown auf Emerald-Fläche), `PremiumCrownBadge.tsx` (Crown-Marker auf Gated Buttons), `PremiumUpgradeCard.tsx` (Werbekarte).

---

## 6. 🐛 In-App Feedback & Bug-Reports

* **Accessibility:** Erreichbar über SettingsView ("Hilfe" -> `FeedbackDrawer.tsx`).
* **`FeedbackDrawer.tsx`:** Bug/Idee-Toggle, Textarea (max. 4000 Zeichen), Multi-Screenshot-Anhang (max. 6 Bilder).
* **Kontext-Erfassung (`feedbackContext.ts`):** Hängt App-Version, Plattform, UserAgent, Route, UserId, Tier und Konsolen-Logs an.
* **Console-Ring-Buffer (`consoleBuffer.ts`):** Hält die letzten ~50 Konsolen-Einträge im Speicher.
* **Backend (`POST /api/feedback`):** Lädt Screenshots in privaten Supabase Bucket `feedback-screenshots` (10-Jahres Signed URLs) und speichert Report in `feedback`-Tabelle.
