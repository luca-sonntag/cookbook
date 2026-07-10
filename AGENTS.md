# 🚀 Projekt: Instagram Reel Rezept-Extraktor (Google Antigravityx)

> **🔁 Commit-Strategie:** Während JEDER Session musst du kontinuierlich atomic commits machen. Nach jedem abgeschlossenen logischen Änderungsblock (Feature, Fix, Refactor, Datei-Addition) sofort `git add` der betroffenen Dateien und `git commit` mit einer [Conventional Commits](https://www.conventionalcommits.org/) Nachricht (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`). Niemals `git add -A` — nur selektiv die Dateien staggen, die zum aktuellen logischen Change gehören. Siehe Skill `atomic-commits` für vollständige Regeln.
>
> **📝 AGENTS.md aktuell halten:** Diese Datei ist das zentrale Wissensdokument des Projekts. Nach JEDER relevanten Code-Änderung (neues Feature, neues Konzept, neue Technologie, Architekturänderung, Refactoring, neue Komponente, neuer Hook, neue Konvention) musst du prüfen, ob die Änderung in `AGENTS.md` dokumentiert werden muss. Ziel ist ein stets aktuelles Gesamtbild aller wichtigen Bereiche: Features, Technologien, Architektur, Konzepte, Konventionen und Komponenten. Halte dich an die bestehende Struktur und den Detaillierungsgrad. Wenn ein Bereich fehlt, lege einen neuen Abschnitt an.

Dieses Projekt ist eine hochoptimierte, automatisierte Webanwendung, die Rezept-Reels von Instagram analysiert, in ein strukturiertes JSON-Format umwandelt und in einem interaktiven, modernen Web-Dashboard anzeigt.

Durch die Kombination des Apify Instagram Scrapers, den multimodalen Fähigkeiten von Google Gemini und einer modernen React-PWA-Oberfläche werden Reels direkt via Instagram-Share-Option geladen, transkribiert und als interaktive Kochrezepte aufbereitet.

---

## 🏗️ Implementierte Technische Architektur & Tech-Stack

### 1. Scraping-Layer (Apify Provider-Chain & yt-dlp Fallback)

* **Technologie:** Apify API Client (`apify-client`).
* **Pluggable Provider-Chain (`backend/src/scrapers/providers/`):** Das Social-Media-Scraping ist als erweiterbare Provider-Kette implementiert. Jeder Provider kapselt einen Scraper über das `SocialScrapeProvider`-Interface (`name`, `scrape()`) und liefert ein normalisiertes `ScrapingResult` (`caption`, `videoUrl`, `imageUrl`, `authorHandle`). Der Orchestrator `scrapeSocialMediaVideo()` (`backend/src/scrapers/social.ts`) iteriert die in `backend/src/scrapers/providers/index.ts` registrierten Provider **der Reihe nach** (Registrierungsreihenfolge = Priorität): Jeder Provider wird bei transienten Fehlern bis zu 3-mal mit exponentiellem Backoff wiederholt; schlägt er endgültig fehl (Fehler oder kein Download-Link im Ergebnis), fällt das System automatisch auf den nächsten Provider zurück. Erst wenn **alle** Provider scheitern, wirft der Orchestrator einen aggregierten Fehler. Alle Provider teilen sich denselben `APIFY_TOKEN`.
* **Neuen Fallback-Actor hinzufügen:** Einen Provider unter `backend/src/scrapers/providers/` implementieren (Actor-spezifisches `scrape()`) und dem Array in `backend/src/scrapers/providers/index.ts` hinzufügen — kein Eingriff in die Aufruflogik oder `.env` nötig.
* **Aktiver Provider (eigener First-Party Actor):** **Social Video Downloader** (`<username>/social-video-downloader`, Quellcode in einem separaten Schwester-Repo `../apify-actor` neben diesem Projekt). Unser eigener Apify-Actor umschließt `yt-dlp` hinter Apify **Residential-Proxies** und liefert `caption` (Post-Beschreibung), `imageUrl` (Thumbnail) und `authorHandle` sowie eine gemergte MP4-Datei, die im Apify **Key-Value-Store** abgelegt und als öffentlich abrufbare `videoUrl` (Plain-GET, ohne Token/Header) zurückgegeben wird. Damit sind Caption **und** Cover-Bild wiederhergestellt (die der vorherige Drittanbieter-Actor `rover-omniscraper/media-downloader-actor` nicht lieferte). Die Actor-ID wird per `APIFY_SOCIAL_ACTOR_ID` gesetzt (nach `apify push`); ohne gesetzte ID fällt die Kette auf den lokalen yt-dlp-Fallback zurück. **Cookie-frei:** Zuverlässigkeit kommt aus Residential-Proxies + Session-Rotation (bis zu 5 Versuche), nicht aus manuellen Cookies. Siehe `docs/apify.social-downloader.md` (Contract) und das README im separaten `apify-actor`-Repo.
* **Local Fallback für YouTube/TikTok/Facebook:** Falls die gesamte Apify-Provider-Chain fehlschlägt oder blockiert wird, greift das System für YouTube Shorts, TikTok und Facebook auf das lokale Command-Line Tool `yt-dlp` als robusten Fallback zurück.
* **Ergebnis:** Die Scraper-Pipeline liefert ein standardisiertes `ScrapingResult`-Objekt mit einer Caption, der Bild-Cover-URL (`imageUrl`) und einem direkt abspielbaren Medien-Link (`audioUrl` / `videoUrl`) für die Transkription und Frame-Extraktion.
* **Benutzername/Handle-Extraktion & Link-Fallback:** Um fehlerhafte, unbrauchbare Creator-Profillinks zu vermeiden (wenn Scraper nur den Anzeigenamen wie "Ashley Markle" statt des technischen Usernames zurückgeben), extrahiert das Backend bevorzugt den technischen Usernamen aus dem Feld `owner.username` des RapidAPI-Ergebnisses (fällt bei Fehlen auf `author` zurück). Im Frontend validiert die Profil-Link-Generierung den extrahierten Handle über eine Regex (keine Leerzeichen, etc.). Falls der Handle ungültig bzw. ein reiner Anzeigename ist, wird statt eines defekten Profil-Links direkt die `reelUrl` (das Originalvideo) verlinkt, wo der Benutzer den Creator leicht finden kann.

### 2. Processing- & Database-Layer (Node.js & Supabase Postgres)

* **Technologie:** Express.js, TypeScript (ausgeführt über `tsx` / Direct-Node execution), native Node.js 18+ `fetch` API.
* **Datenbank:** Supabase Postgres (`backend/src/db.ts`) mit Row-Level Security (RLS) über `@supabase/supabase-js`. Alle benutzerbezogenen Queries filtern mit `.eq('user_id', userId)`, um mandantenfähige Isolation zu gewährleisten. Interne Queue-Operationen (`getNextPendingJob`, `updateJob`) arbeiten ohne User-Scoping.
* **Authentifizierung:** Supabase Auth JWT-Verifikation (`backend/src/auth.ts`). Die Middleware `requireAuth` validiert den `Authorization: Bearer <token>` Header, extrahiert die User-ID via `auth.getUser(token)` und reicht sie als `req.userId` an alle Route-Handler weiter. Der statische `x-api-key` Header wurde vollständig entfernt. Unterstützt sowohl E-Mail/Passwort- als auch Google OAuth-Authentifizierung nahtlos, da beide über standardmäßige Supabase JWTs verifiziert werden.
* **RLS-Policies:** Die `jobs`-Tabelle ist mit vier RLS-Policies abgesichert: `SELECT`/`INSERT`/`UPDATE`/`DELETE` – alle an `auth.uid() = user_id` gebunden. Der `user_id`-Fremdschlüssel referenziert `auth.users.id`.
* **Funktion:** Das Backend dient als asynchroner Job-Orchestrator, verwaltet Jobs und lädt Audiodateien temporär herunter.
* **History, ID-Vergabe & Verwaltung:**
  * Bietet Helper-Funktionen (`getAllJobs(userId)` und `deleteJob(id, userId)`) zur persistenten Abfrage und Bereinigung von Extraktionen – stets benutzerbezogen.
  * Stellt REST-Endpunkte bereit: `GET /api/jobs` (liefert den Extraktionsverlauf des authentifizierten Users), `DELETE /api/jobs/:id` (löscht ein bestimmtes Rezept des Users) und `DELETE /api/users/me` (löscht das Benutzerkonto über die Supabase Admin API).
  * **Eindeutige Identifikation:** Normalisiert Rezepte bei Abfragen und versieht sie mit einer eindeutigen `id` (entspricht der `jobId`), um Kollisionen zwischen Rezepten mit gleichem Titel zu unterbinden.
  * **Caching-Deaktivierung:** Setzt explizit `Cache-Control` Header (`no-store, no-cache, must-revalidate, proxy-revalidate`) für dynamic endpoints (`/api/jobs` und `/api/jobs/:id`), um zu verhindern, dass Browser veraltete/gecachte Job-Zustände ausliefern.
* **Frontend-Hosting:** Express dient gleichzeitig als Webserver für die React-Frontend-Assets (`frontend/dist`) und leitet alle Nicht-API-Routen (`*`) zwecks SPA-Routing an die `index.html` weiter.
* **Sicherheits-Hardening (`backend/src/index.ts`):**
  * **`helmet`:** Setzt standardmäßige Security-Header (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, etc.). `crossOriginResourcePolicy` ist auf `cross-origin` gesetzt, damit `recipe-images` aus anderen Origins geladen werden können. CSP wird nur in Production aktiviert.
  * **`express-rate-limit`:** Limitiert `/api/*`-Endpunkte auf 100 Requests pro 15-Minuten-Fenster pro IP. Verwendet `standardHeaders: true` für moderne Rate-Limit-Header.
  * **CORS-Hardening:** In Development permissiv (`http://localhost:5173`), in Production restriktiv über `CORS_ORIGIN` Umgebungsvariable konfigurierbar. Nur `GET`, `POST`, `DELETE` Methoden erlaubt.
  * **`trust proxy`:** Auf `1` gesetzt für korrekte Rate-Limiting-Erkennung hinter Reverse-Proxies (nginx, Railway, etc.).
  * **Body-Limit:** `express.json({ limit: '1mb' })` schützt vor Memory-Exhaustion durch große Payloads.
* **Health-Check (`/health`):** Erweiterter Endpunkt prüft Supabase-Datenbankverbindung via `checkDbHealth()` (HEAD-Request auf `jobs`-Tabelle). Antwortet `200 OK` bei gesunder DB, `503 Service Unavailable` bei Problemen. Liefert `uptime`, `nodeEnv` und `dbConnected`-Status.
* **Rolling Timeframe Rate Limiting (Extraktionsbegrenzung):**
  * Um Missbrauch und API-Kosten (Apify & Gemini) zu begrenzen, verfügt die Anwendung über ein rollierendes Ratenlimit für Rezept-Extraktionen.
  * **Globale Limits:** Gesteuert über `.env`-Umgebungsvariablen:
    * `EXTRACTION_LIMIT_WINDOW_DAYS` (Default: `1`): Größe des rollierenden Fensters in Tagen.
    * `FREE_MAX_EXTRACTIONS_PER_WINDOW` (Default: `3`): Maximale Anzahl an Extraktionen für Free-User.
    * `PREMIUM_MAX_EXTRACTIONS_PER_WINDOW` (Default: `50`): Maximale Anzahl an Extraktionen für Premium-User.
  * **Subscription Tiers:** Benutzer befinden sich standardmäßig im `free` Tier. Sobald sie Premium kaufen, wird ihr Tier auf `premium` gesetzt (gesichert in `app_metadata.tier`).
  * **Benutzerbezogene Limits (Overrides):** Werden über Supabase Auth `app_metadata` individuell gesteuert:
    * `custom_extraction_limit` bzw. `max_extractions_per_window` gibt die maximale Anzahl frei (z. B. `-1` für unbegrenzt).
  * **Nutzererfahrung:** Wenn das Limit erreicht ist, ermittelt das Backend die älteste Extraktion im Fenster und berechnet die verbleibende Wartezeit minutengenau. Das Frontend übersetzt diese Fehlermeldung dynamisch im `translateApiError`-Helper und zeigt dem Nutzer die genaue Restdauer an.

### 3. KI-Layer (Google Gemini)

* **Technologie:** `@google/generative-ai` SDK (Gemini 1.5/2.5/3.1/3.5 Flash).
* **Funktion:** Die Audiodatei wird über die Google AI File API hochgeladen. Gemini verarbeitet Audio und Text (`caption`) in einem einzigen multimodalen Aufruf.
* **Structured Outputs & Clean Parsing:** Gemini wird durch ein strenges JSON-Schema gezwungen, das Rezept exakt nach einem detaillierten Schema (Titel, Beschreibung, Zutaten mit Mengen/Einheiten, Schritte, Ausrüstung, Nährwertschätzungen, Kochtipps und Alternativzutaten) zu strukturieren.
  * **Kategorisierung & Standardisierung:** Das Schema erzwingt die Zuordnung von Zutaten in feste englische Enum-Supermarktkategorien (z.B. `PRODUCE`, `DAIRY_EGGS`) und generiert pro Zutat einen `baseName` (z.B. "Zwiebel" statt "rote Zwiebeln") für eine deterministische Gruppierung in der Einkaufsliste.
  * **Bereinigung der Zutatennamen:** Zutatennamen (`name`) werden im Prompt explizit von Mengen, Zahlen, Maßeinheiten und Modifizierern/Eigenschaften (wie "leicht", "mager", "gerieben") gesäubert; diese Daten fließen sauber in die dedizierten Felder `amount`, `unit` und das neue `modifier`-Feld.
  * **Nährwerte pro Zutat:** Das Schema erzwingt für jede Zutat Nährwertangaben (`calories`, `protein`, `carbs`, `fat`) bezogen auf die konkrete Zutat und die gesamte angegebene Menge (nicht pro 100g oder pro Einzelstück). Falls nicht ermittelbar, wird standardmäßig 0 ausgegeben.
  * **Dekomposition von Verbundzutaten:** Im Prompt ist geregelt, dass während des Rezept-Videos zubereitete Verbundkomponenten (wie "Smash Burger Patties" oder "selbstgemachtes Pesto") in ihre atomaren Rohbestandteile zersetzt werden müssen (z. B. Rinderhack, Chesterkäse, Basilikum, Olivenöl), anstatt das fertige Zwischenprodukt als Zutat aufzuführen.
  * **Erzwingung von Portions-bezogenen Nährwerten:** Das Schema und der Prompt instruieren Gemini, die Rezept-Nährwerte (`nutritionalValues`) stets auf eine einzelne Portion/Servierung normiert zu extrahieren. Falls das Quellmaterial nur Gesamtnährwerte angibt, teilt Gemini diese durch die Portionenanzahl.
  * **Vermeidung von Gesamtnährwert-Halluzinationen:** Ein explizites `hasExplicitNutritionalValues` Boolean-Flag im Schema zwingt Gemini zur Angabe, ob die Gesamtnährwerte im Quellmaterial explizit genannt wurden. Wenn nicht (`false`), löscht das Backend eventuell generierte Werte proaktiv, um Halluzinationen zu verhindern.
  * **Rekonstruktion fehlender Zutaten:** Falls Zutaten im Videotitel oder in den extrahierten Frames visuell auftauchen (z. B. Brokkolini), aber in der Videobeschreibung vergessen wurden, rekonstruiert Gemini diese mit geschätzten Mengen und passenden Arbeitsschritten.
  * **Portions- und Nährwertoptimierung:** Verbessertes Schätzen der Portionen anhand der Gesamtmengen (statt pauschalem Servings-Default von 1). Gewürze werden mit Kleinstwerten (z. B. 5 kcal) versehen, während Wasser, Eis oder Salz zwingend auf 0 Kalorien/Makronährstoffe gesetzt werden.
  * **Optimierung von gekochten/ungekochten Zuständen:** Erkennt, ob die Mengenangaben von quellenden/quellfähigen Zutaten (z. B. Reis, Nudeln, Linsen) sich auf den rohen/trockenen oder gekochten Zustand beziehen (z. B. 250g gekochter Reis vs. 250g ungekochter Reis). Nutzt die korrekte kalorische Dichte des jeweiligen Zustands zur Zutatennährwertberechnung und löst Unklarheiten anhand der Zubereitungsschritte oder Plausibilität (Portionsmenge) auf.
  * **Bevorzugte Einheiten, Sprach- & Unit-System-Steuerung:** Die bevorzugte Rezeptsprache, Temperatureinheit (Celsius, Fahrenheit oder beides) und das Maßsystem (metrisch oder imperial) werden primär per-Benutzer im Profil/Settings-Tab konfiguriert und in den Supabase Auth `user_metadata` gespeichert. Der asynchrone Backend-Worker ruft diese Präferenzen über die Admin Auth API (`auth.admin.getUserById`) für den ausführenden Nutzer ab und weist Gemini an, das Rezept entsprechend zu übersetzen, umzurechnen und zu formatieren. Die Werte in `.env` (`RECIPE_LANGUAGE`, `PREFERRED_TEMPERATURE_UNIT`, `PREFERRED_UNIT_SYSTEM`) dienen als serverweite Fallbacks.
* **Auto-Cleanup:** Lokale Audiodateien und Google-API-Dateien werden nach der Verarbeitung sofort gelöscht.

### 4. Frontend- & PWA-Layer (React & HeroUI)

* **Technologie:** React 19, Vite, TypeScript, HeroUI v3 (React Aria-basiert), Tailwind CSS v4, `vite-plugin-pwa` (Service Worker & Manifest).
  * **Architektur & Modul-Struktur (React Best Practices):**
    * **Schlanker App-Shell (`App.tsx`):** Die Hauptkomponente ist modular gestaltet und delegiert komplexe Zustände an spezialisierte Custom Hooks. Zeigt eine Auth-Gate (`AuthForm`) bei fehlender Session und einen Spinner während des Auth-Ladens. Ohne gültige Supabase-Session ist die gesamte App gesperrt.
    * **Zentralisierte Kontexte (`frontend/src/context/`):**
    * **`AuthContext.tsx`:** Verwaltet die Supabase Auth Session (`useAuth()`). Stellt `signIn`, `signUp`, `signInWithGoogle`, `signOut` und `getAccessToken()` bereit. Lauscht auf `onAuthStateChange`-Events und persistiert die Session automatisch im Supabase-Client. Wrappt die gesamte App.
      * **`DialogContext.tsx`:** Stellt einen globalen Dialog-Service (`useDialog()`) bereit, um native Browser-Dialoge (`confirm` / `alert`) durch moderne, nicht-blockierende HeroUI-Dialoge mit wählbaren Status (z. B. `danger`, `warning`) zu ersetzen.
      * **`I18nContext.tsx`:** Verwaltet den globalen Internationalisierungs-Zustand (Deutsch und Englisch), persistiert die Nutzerwahl im `localStorage` und ermittelt die Standardeinstellung anhand der Browsersprache (`navigator.language`). Stellt die Hook `useI18n()` für dot-notation basierte UI-Übersetzungen (`t()`) mit Variablen-Ersetzung bereit.
    * **Lokalisierung & Übersetzung (`frontend/src/i18n.ts`):**
      * Verwaltet das Übersetzungsmapping für Supermarktabteilungen (`IngredientCategory`).
      * Ordnet den Kategorien passende Emojis/Icons zu.
      * Definiert die Supermarkt-Laufrichtung zur Sortierung von Zutaten.
      * Mappt über `legacyCategoryMap` alte Rezeptkategorien transparent auf das neue Schema, um Abwärtskompatibilität zu sichern.
      * Definiert das globale Übersetzungs-Wörterbuch (`uiTranslations`) und stellt die Funktion `getTranslation` zur rekursiven Schlüssel-Pfad-Auflösung bereit.
      * **Auth-Übersetzungen:** Enthält Texte für Login, Registrierung, E-Mail-Bestätigung, Abmeldung und Fehlerzustände (DE & EN).
      * **API-Fehler-Übersetzung:** Stellt die Funktion `translateApiError` bereit, die technische API-, Scraping- und Job-Fehler (z.B. 429 Too Many Requests oder Quoten-Überschreitungen) zur Laufzeit in die ausgewählte Sprache (DE/EN) übersetzt.
    * **Supabase Client (`frontend/src/supabase.ts`):** Konfiguriert den Supabase-Client mit der Publishable Key (aus `VITE_SUPABASE_PUBLISHABLE_KEY`). Wirft einen Build-Time-Fehler, wenn `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` fehlen — verhindert silent-failure Deployments. Die Service-Role-Key verlässt niemals das Backend.
    * **Zentralisierte Hooks (`frontend/src/hooks/`):**
      * **`useTheme.ts`:** Steuert das clientseitige Umschalten des Hell- und Dunkelmodus und persistiert die Einstellung im `localStorage`.
      * **`usePwaInstall.ts`:** Kapselt das Abfangen des `beforeinstallprompt`-Events und steuert die Installationslogik.
      * **`useRecipeExtraction.ts`:** Orchestriert die Validierung der URLs, die Job-Übermittlung und das asynchrone Polling des Queue-Status, gekoppelt mit dynamischen Lade-Animationen und Echtzeit-Fortschrittsdaten. Autorisiert alle API-Calls mit `Authorization: Bearer <jwt>`. Übersetzt API- und Worker-Fehlermeldungen zur Laufzeit über `translateApiError`.
      * **`useRecipeNutrition.ts`:** Liefert die Nährwerte normiert pro Portion. Falls keine expliziten Werte aus dem Quellmaterial von der KI extrahiert wurden, werden die Nährwerte der Einzelzutaten aufsummiert und durch die Basis-Portionsanzahl geteilt, um die Nährwerte pro Portion zu berechnen.
      * **`useRecipeScaling.ts`:** Berechnet Skalierungsfaktoren für Zutaten und Nährwerte. Discrete Einheiten (z.B. Stück, Zehen, EL, TL) werden in küchenübliche gemischte Brüche (z.B. `1 ½`) formatiert, während kontinuierliche Gewichte/Volumina als Ganz- oder Dezimalzahlen gerendert werden. Die ausgewählte Portionsgröße wird persistent im `localStorage` unter Verwendung des ID-basierten Schlüssels gespeichert.
      * **`useRecipeProgress.ts`:** Persistiert den Abhakk-Zustand (Checklisten-Fortschritt) von Zutaten und Zubereitungsschritten im `localStorage` basierend auf der eindeutigen Rezept-ID.
      * **`useShoppingList.ts`:** Verwaltet den Zustand der Einkaufsliste im `localStorage` (`recipe_shopping_list`), führt neue Rezepte rezept- und portionsgenau ein, filtert abgehakte Zutaten heraus und gruppiert/aggregiert gleiche Artikel rezeptübergreifend. Die Gruppierung erfolgt intelligent auf Basis des von der KI generierten `baseName` und des `modifier` Felds.
      * **`useHashRouter.ts`:** Leichtgewichtiger Hash-Router ohne externe Abhängigkeiten. Liest `window.location.hash` beim Laden und reagiert auf `hashchange`-Events. Leitet den aktiven Tab (`extract`, `history`, `shopping-list`, `settings`) und optionale Sub-Pfade (z. B. `:jobId` für `/#/history/:jobId`) ab. Stellt `navigate(tab, subPath?)` (fügt History-Eintrag hinzu) und `replace(tab, subPath?)` (ersetzt aktuellen Eintrag) bereit. Standard-Tab ist `history`. URL-Schema: `/#/extract`, `/#/extract/recipe`, `/#/history`, `/#/history/:jobId`, `/#/shopping-list`, `/#/settings`. `selectedJob` in `App.tsx` wird direkt aus dem URL-Sub-Pfad abgeleitet (nach Laden der History).
      * **`useMobileNavigationBack.ts`:** Kapselt die native Browser-Verlaufssteuerung (`pushState`/`popstate`-Event-Listener) und mobile Wischgesten (Swipe-to-Go-Back), um eine native Mobile-Erfahrung beim Schließen der Detailansicht zu gewährleisten.
      * **Google Play Billing via RevenueCat:** Das Projekt nutzt den `@revenuecat/purchases-capacitor` Plugin-Wrapper zur Zahlungsabwicklung für den Premium-Zugang auf Android. Initialisiert im App-Lifecycle und gekoppelt mit dem dynamic utility in `frontend/src/utils/purchase.ts`.
      * **Automatisches Live-Reload Port-Forwarding (Gradle):** In `frontend/android/app/build.gradle` wurde ein benutzerdefinierter Gradle-Task `reversePorts` implementiert, der vor jedem Build-Vorgang (`preBuild.dependsOn reversePorts`) automatisch `adb reverse tcp:5173 tcp:5173` ausführt. Dies stellt sicher, dass der Android Emulator/das Testgerät beim Starten im Live-Reload-Modus immer eine funktionierende Verbindung zum Vite-Dev-Server auf dem Host-Rechner hat, ohne dass der Entwickler dies manuell tun muss oder an einem dauerhaften Splashscreen-Hang scheitert (da die Splashscreen-Ausblendung auf den erfolgreichen React-Mount wartet). Der Task ermittelt den SDK-Pfad dynamisch und ignoriert eventuelle adb-Fehlermeldungen, wenn kein Gerät angeschlossen ist.

      * **`useImageGallery.ts`:** Übernimmt die komplexe Pointer-Mathematik für das horizontale Scrollen, Swipen, Double-Tap-to-Zoom und das freie Panning der Galeriebilder im Vollbildmodus.
      * **`useSavedCatalog.ts`:** Verwaltet die Rezept-Historie inklusive Massenauswahl, Bulk-Delete (mit JWT-Autorisierung), Suchfilter, Tags und Sortierung. Löscht bei Bulk-Delete auch die zugehörigen gecachten Bilder aus IndexedDB.
      * **`useCachedImage.ts`:** Hook für den vollständigen clientseitigen Image-Caching-Lifecycle. Prüft IndexedDB auf vorhandene Base64-Daten, lädt bei Cache-Miss das Bild über den `/api/image`-Proxy, komprimiert es via HTML5 Canvas (max. 400px, JPEG Quality 75%) und speichert das Resultat in IndexedDB. Gibt bei Fehlern die Proxy-URL als Fallback zurück.
    * **Komponententrennung (`frontend/src/components/`):**
      * **`AuthForm.tsx`:** Vollbild-Loginformular mit exklusivem Google OAuth-Login (E-Mail/Passwort-Optionen wurden entfernt). Bietet ein elegantes, visuell ansprechendes Design mit ambienten Farbglow-Effekten (blur), einem pulsierenden Logo-Rahmen und einer hochwertigen Google-Schaltfläche. Zeigt auftretende Anmeldefehler inline an.
      * **`ThemeToggle.tsx`:** Kontrolliert den clientseitigen Hell- und Dunkelmodus.
      * **`InstallBanner.tsx`:** Kapselt den PWA-Installationshinweis.
      * **`ExtractForm.tsx`**: Ein komplett neu gestaltetes, modernes Importformular zur Eingabe und Validierung der Rezept-URLs. Unterstützt Ein-Klick-Einfügen aus der Zwischenablage (verwendet `@capacitor/clipboard` auf nativen Plattformen und fällt im Web auf die standardmäßige Clipboard API zurück, mit verständlicher Fehlermeldung bei blockiertem Zugriff), zeigt Badges für unterstützte Plattformen (Instagram, TikTok, YouTube Shorts, Websites), bietet anklickbare Demo-Rezepte zum schnellen Testen und enthält eine ausklappbare Schritt-für-Schritt-Hilfe (HeroUI Accordion) zum Kopieren von Links sowie eine bebilderte Anleitung mit interaktiven Mockups zur Nutzung der Direkt-teilen-Funktion (PWA Web Share Target).
      * **`ProgressTracker.tsx`:** Visualisiert den Extraktions-Fortschritt in Echtzeit über einen flüssig animierten Fortschrittsbalken (0-100%) sowie eine dynamische Checklist der Milestones (Warteschlange, Scraping, Downloads, Bild-Analyse, KI-Verarbeitung, Speichern). Untermalt durch rotierende, kontextsensitive Ladebotschaften.
      * **`ErrorBanner.tsx`:** Zeigt detaillierte Fehler und ermöglicht erneutes Ausführen.
      * **`AiNotice.tsx`:** Eine wiederverwendbare Badge- oder Inline-Komponente, die geschätzte Nährwertangaben visualisiert und über ein Smartphone-freundliches HeroUI-Popover (klickbar) nähere Details anzeigt.
      * **`RecipeDetails/`:** Ein modularisiertes Verzeichnis für die Rezept-Interaktionsansichten:
        * `index.tsx`: Haupt-Orchestrator, der Hooks, Berechnungen und Zustände verwaltet.
        * `RecipeHeader.tsx`: Rendert die Kopfzeile, die Bildgalerie und das Popover-Optionsmenü.
        * `RecipeStats.tsx`: Rendert Vorbereitungszeit, Kochzeit und Portions-Skalierer.
        * `RecipeNutrition.tsx`: Rendert die Nährwerttabelle mit Umschaltung zwischen portionierter und totaler Ansicht.
        * `RecipeIngredients.tsx`: Rendert die Zutatenliste (nach Supermarktabteilungen sortiert) und alternative Zutaten.
        * `RecipeInstructions.tsx`: Rendert Koch-Equipment, die Schritt-für-Schritt-Anleitung, Fortschrittsbalken und Profi-Tipps.
        * `RecipeActionDock.tsx`: Rendert die schwebende Navigations- und Startleiste am unteren Bildschirmrand.
      * **`SavedCatalog/`:** Grid- und Listen-Layout der Rezept-Historie inklusive Suchfilterung, Bulk-Select-Modus (aktivierbar über einen sichtbaren Checkbox-Toggle-Button in den Filtern oder via Long-Press), Massenlöschung und Weiterleitung von Einkaufslisten-Befehlen.
      * **`ShoppingList/`:** Ein modularisiertes Verzeichnis für die Verwaltung der Einkaufsliste:
        * `index.tsx`: Haupt-Orchestrator der Einkaufsliste.
        * `CustomItemForm.tsx`: Card-Formular zur manuellen Artikeleingabe mit Einheitenvorschlägen.
        * `ShoppingListGroup.tsx`: Gruppiert unvollständige Einkäufe nach Abteilung und listet Artikel im Einkaufswagen gesondert auf.
        * `ShoppingListItem.tsx`: Einzelne Zeile eines Einkaufsartikels inklusive Checkboxen, Rezeptquellennachweis und Lösch-Buttons.
        * `ShoppingCheckedDrawer.tsx`: Einklappbarer Bereich für bereits abgehakte/erledigte Einkäufe.
        * `ShoppingEmptyState.tsx`: Ausführlicher Willkommens- und Erklärungsbildschirm für leere Einkaufslisten mit bebilderten Anleitungen.
        * `ShoppingAllDoneState.tsx`: Premium-Erfolgsbildschirm bei vollständig abgehakter Einkaufsliste mit einer interaktiven, animierten SVG-Umrisszeichnung einer edlen Servierglocke (Cloche) auf einem Teller und flüssigen CSS-Dampf- und Häkchen-Animationen.
      * **`CachedImage.tsx`:** Drop-in-Ersatz für native `<img>`-Tags mit automatischem clientseitigen Image-Caching. Nutzt `useCachedImage`, zeigt während des Ladens einen animierten Spinner und rendert das komprimierte Base64-Bild. Akzeptiert alle nativen `<img>`-Attribute sowie ein optionales `fallbackComponent`-Prop.
    * **Clientseitige Utilities (`frontend/src/utils/`):**
      * **`imageStore.ts`:** Leichtgewichtiger IndexedDB-Wrapper für den Rezeptbild-Cache. Datenbank `recipe-image-cache` v1 mit Object Store `images`, indiziert nach Original-URL. Bietet `getCachedImage(url)`, `setCachedImage(url, base64Data)`, `deleteCachedImage(url)` und `clearImageCache()`.
    * **Clientseitiges Image-Caching (Architektur & Designentscheidungen):**
      * **100% Client-seitig:** Keinerlei Bilddaten (Base64 oder komprimiert) werden auf dem Server oder in Supabase gespeichert. Die Original-Bild-URLs verbleiben als Metadaten im Rezept-JSON.
      * **Rechtliche Compliance:** Durch die rein clientseitige Verarbeitung (Canvas-Kompression im Browser des Nutzers) wird kein urheberrechtlich geschütztes Bildmaterial auf fremden Servern gespeichert oder redistribuiert.
      * **Proxy-Nutzung:** Der bestehende `/api/image`-Proxy-Endpunkt dient als CORS/CORP-Bypass für Instagram-Bilder. `CachedImage` ruft Bilder ausschließlich über diesen Proxy ab.
      * **Kompression:** HTML5 Canvas `drawImage()` + `toBlob('image/jpeg', 0.75)` mit maximal 400px Kantenlänge (Seitenverhältnis bleibt erhalten). Reduziert typische Instagram-Bilder von mehreren MB auf ~15–40 KB.
      * **Cache-Invalidierung:** Bei Löschung eines Rezepts (Einzellöschung in `App.tsx` oder Bulk-Delete in `useSavedCatalog.ts`) werden die zugehörigen IndexedDB-Einträge automatisch mitgelöscht.
      * **Fallback:** Bei Canvas-Fehlern (CORS, corrupt images) wird direkt die Proxy-URL als `src` verwendet — der Nutzer sieht das Bild in Originalqualität, nur ohne Caching.
    * **Typensicherheit (`backend/src/types.ts` & `frontend/src/types.ts`):** Zentralisierte TypeScript-Modelle für Rezepte, Zutaten, Nährwerte und API-Jobs. Nutzung von `type`-only Imports zur Einhaltung von Compiler-Richtlinien (wie `verbatimModuleSyntax`).
* **Visuelles Design:** Theme-gesteuert (Hell- & Dunkelmodus) mit modernem Glassmorphismus und harmonischen Akzenten (Smaragdgrün). Optimiert für mobile Displays mit flüssigen Übergängen.
* **Strikte Mobile-First & Header-Architektur:**
  * Die Webanwendung fokussiert sich zu 100% auf ein Smartphone-Erlebnis, unabhängig vom Endgerät. Das Design erzwingt global ein `max-w-md` Container-Layout, sodass die App auch auf Desktop-Bildschirmen wie eine native Smartphone-Applikation wirkt.
  * **Header:** Der Header ist maximal minimalistisch und clean. Er zeigt lediglich das zentrierte Logo und den App-Titel. Die früher im Header platzierten "Settings"-Optionen wurden komplett entfernt.
  * **Bottom Navigation Bar:** Die fixierte untere Navigationsleiste ist das primäre und einzige Navigationswerkzeug (sichtbar auf Mobile und Desktop). Sie enthält nun einen vierten Tab ("Profil" / "Settings").
  * **SettingsView:** Alle Konfigurationsoptionen (Sprachwechsel, Hell-/Dunkelmodus, Logout und PWA-Installationshinweise) sind in den neuen "Profil"-Tab ausgelagert, um den Header sauber zu halten.
  * **Smarte Badges:** Die Einkaufsliste verfügt über eine mit `animate-pulse-slow` atmende, kreisförmige Benachrichtigungsplakette über dem Shopping-List-Icon.
  * **Distraction-Free Mode & Persistent Navigation:** Die mobile Bottom Navigation bleibt auch auf der aktiven Rezept-Detailansicht (sowohl aus der Historie als auch direkt nach der Extraktion) voll sichtbar, um dem Nutzer schnellen Zugriff auf andere App-Bereiche (wie die Einkaufsliste) zu ermöglichen. Der schwebende Rezept-Aktionsbereich (Unified Action Dock) wird stattdessen nach oben verschoben (`bottom-32`), um Überlagerungen zu verhindern.
  * **Erweiterter Back-Workflow:** Durch Einbindung des `useMobileNavigationBack`-Hooks in den Extraktions-Tab wird der Zurück-Gesten- und Back-Button-Workflow auch für neu extrahierte Rezepte bereitgestellt.
  * **Optimierte Touch-Targets & iOS-Zoom-Schutz:** Alle interaktiven Elemente (Portionsstepper, Checkboxen, Navigations-Tabs, Filter-Chips und Options-Trigger) sind für eine native mobile Bedienung auf mindestens 44x44px skaliert (oder vergrößert worden). Um das unerwünschte automatische Heranzoomen bei Eingabefeldern unter iOS Safari zu unterbinden, wurden die Schriftgrößen von Suchfeldern, Extraktionsfeldern und Einkaufslisten-Eingaben auf mindestens `text-base` (16px) angehoben. Zudem verhindern `pointer-events-none` auf Thumbnail-Bildern sowie global `select-none` und ein `contextmenu`-Event-Interceptor unerwünschte native Kontextmenüs und Textauswahl-Dialoge während des Long-Press-Gestenflusses (z. B. zur Aktivierung des Multi-Select-Modus).
* **Sprach- und Theme-Steuerung:**
  * Bietet einen Header-Schalter (Sonne/Mond) für den Hell- und Dunkelmodus. Die Auswahl wird im `localStorage` persistiert.
  * **Standard-Theme:** `light` — neue Besucher ohne gespeicherte Präferenz erhalten automatisch den hellen Modus. Der Fallback in `useTheme.ts` und das initiale `<html>`-Tag in `index.html` (ohne `class="dark"`) sind auf `light` ausgerichtet.
  * Bietet einen Header-Sprachwähler (Pill-Button `DE` / `EN`) zur Echtzeit-Umschaltung aller UI-Texte, Fehlermeldungen, Lade-Fakten und Maßeinheit-Vorschläge.
  * Ein Inline-Interceptor im `<head>` der `index.html` liest `localStorage.theme` und wendet die `dark`-Klasse synchron vor dem ersten Paint an, um ein Aufblitzen des falschen Designs (FOUC) zu verhindern.
* **PWA & Share Target Integration:**
  * Die Webanwendung ist über den Browser direkt als PWA (Progressive Web App) installierbar.
  * Registriert die **Web Share Target API**, sodass unterstützte Medien-Links (Instagram Reels, TikTok Videos, YouTube Shorts oder Web-Rezepte) direkt aus der jeweiligen App an die PWA geteilt werden können. Der geteilte Text wird beim Start der PWA automatisch ausgewertet, die URL per allgemeiner Regex extrahiert, bereinigt, die Query-Parameter und der `/share`-Pfad im Router zurückgesetzt und die Extraktion gestartet. Um die Hürde für neue Nutzer zu senken, bietet das Import-Formular (`ExtractForm.tsx`) eine integrierte Schritt-für-Schritt-Anleitung mit visuellen, responsive SVG-Mockups, die den Share-Menü-Klick, den Instagram-Teilen-Zwischenschritt und die Snagbite-Auswahl verdeutlichen.
  * **Native Android Share Intents (Capacitor):** Unterstützt native Teilen-Intents über das `send-intent` Plugin. Um das ungewollte Schließen der App (`MainActivity`) zu verhindern, wird auf den nativen Aufruf von `SendIntent.finish()` verzichtet. Stattdessen wird der Zustand des zuletzt verarbeiteten Intents über das JS-Modul-Flag `lastProcessedPayload` verwaltet. Dies verhindert, dass derselbe Intent erneut ausgewertet wird, wenn sich der App-Zustand re-evaluiert (z. B. bei Einstellungsänderungen des `user`-Objekts), erlaubt jedoch die Verarbeitung neuer Intents bei warmen Shares (über das `sendIntentReceived`-Event). Auf Web-Ebene stellt das Modul-Flag `isWebShareProcessed` sicher, dass der Interceptor nur einmal pro Ladevorgang ausgeführt wird.
* **Rezeptverlauf & Interaktion:**
  * **Saved Recipes:** Ermöglicht das Durchsuchen aller erfolgreich verarbeiteten Rezepte in einer Grid- oder Listen-Ansicht mit Filter- (z.B. Zeitlimit- und Tag-Filter) und Löschoptionen. Die Suchleiste ist standardmäßig ausgeblendet, um Platz zu sparen und eine saubere Übersicht zu bieten. Sie lässt sich über ein Lupen-Icon einblenden und nimmt dann die volle Breite ein, während ein Zurück-Pfeil das Schließen und Zurücksetzen ermöglicht. Standalone-Seitenüberschriften wurden zugunsten eines cleanen, konsistenten UI-Aufbaus entfernt.
  * **Detailansicht:** Das Laden eines archivierten Rezepts integriert sich nahtlos in die interaktive Checklisten-Oberfläche (Zutaten- und Schritt-Abhaken).
  * **Navigationshilfen:** Bietet responsive Zurück-Buttons und Edge-Swipe-Navigation für komfortable Bedienung auf Smartphones.
  * Bietet interaktive Checklisten zum Abhaken von Zutaten und Zubereitungsschritten während des Kochens.
  * **Interaktive Text-Hervorhebungen:** Hebt Temperaturen (z. B. "200°C", "180 Grad") und Zeitspannen (z. B. "20-22 Minuten", "5 Min.") in den Zubereitungsschritten und Kochtipps automatisch hervor und rendert sie als stilvolle, farblich codierte Badges mit passenden Icons (Thermometer & Uhr). Unterstützt vollautomatisch mehrere Sprachen (DE, EN, ES, FR, IT, PT, NL, TR, PL) samt deren gängigen Abkürzungen und Deklinationen. Zutaten und Kochutensilien werden in diesen Texten ebenfalls interaktiv verlinkt.
  * **In-App Koch-Timer (`TimerContext`, `TimerBanner`, `TimerConfirmSheet`):**
    * Blaue Zeit-Badges (z.B. „15 Minuten") in `RecipeInstructionText` sind klickbar (unterstrichen, `cursor-pointer`). **Premium-Gate:** Für Free-User öffnet ein Klick die `PremiumModal` statt des `TimerConfirmSheet` (In-App-Timer sind Teil des „Koch-Timer & Modus"-Premium-Features). Da der Kochmodus selbst premium-gated ist, funktionieren Timer für Premium-User sowohl im Instructions-Tab als auch im Kochmodus.
    * **Confirm-Sheet:** Tippt der Nutzer auf einen Zeit-Badge, öffnet sich ein Bottom-Sheet (`TimerConfirmSheet.tsx`) mit dem erkannten Label, einem Schieberegler zur Feineinstellung (±50% der Originalzeit, Schritt 15s/1min/5min je nach Dauer) und einem „Timer starten"-Button.
    * **Globaler Zustand (`TimerContext.tsx`, `frontend/src/context/`):** Verwaltet alle aktiven Timer als `TimerEntry[]`. Ein globales `setInterval` (500ms) aktualisiert den Countdown. Mehrere parallele Timer sind unterstützt. State überlebt Tab-Navigation.
    * **Alarm:** Bei Ablauf: 3× synthetischer Beep-Ton via Web Audio API (880 Hz, 150ms) + `navigator.vibrate()` + `Notification`-Push (falls Permission erteilt).
    * **Notification Permission:** Wird lazily beim ersten Timer-Start via `Notification.requestPermission()` angefragt – kein vorzeitiger Popup beim App-Start.
    * **Timer-Banner (`TimerBanner.tsx`):** Sticky unterhalb des App-Headers. Zeigt alle aktiven Timer als blaue Karten mit Countdown (mm:ss) und Fortschrittsbalken. Bei Ablauf: pulsiert rot mit Glocken-Icon. Dismiss-Button (×) entfernt den Timer.
    * **Zeitparser (`parseTimeToSeconds`):** Konvertiert gematchte Zeit-Strings (Sekunden, Minuten, Stunden) aller unterstützten Sprachen in Sekunden.
    * **Hook (`useTimerManager.ts`):** Thin re-export von `useTimerContext` für ergonomische Imports in Komponenten.
    * **Navigation per Klick:** Ein Klick auf eine laufende oder abgelaufene Timer-Karte im Banner oder im Kochmodus navigiert den Benutzer vollautomatisch zum Herkunftsrezept (wechselt ggf. den Tab) und öffnet direkt den Vollbild-Kochmodus (`CookingMode.tsx`) am entsprechenden Zubereitungsschritt, an dem der Timer gestartet wurde. Gesteuert wird dies über ein entkoppeltes Custom-Event-System (`app:navigate-to-timer-step`).
  * Unterstützt das Kopieren des Rezepts als formatiertes Markdown.


---

## 🔄 Workflow im Detail

1. **Medien-Sharing / Eingabe:** Der Nutzer teilt einen unterstützten Rezept-Link (Instagram Reel, TikTok Video, YouTube Short, Website) direkt über die Teilen-Schaltfläche an die installierte PWA oder fügt die URL manuell im Dashboard ein. **Hinweis:** Bei YouTube sind ausschließlich YouTube Shorts (URLs mit `/shorts/`-Pfad) erlaubt, um den Download extrem langer Standardvideos zu verhindern. Andere YouTube-Videos werden per Frontend/Backend-Validierung abgewiesen.
2. **Parsing & Navigation:** Das Frontend empfängt die geteilten Parameter (`/share?text=...`), filtert die URL per allgemeiner Regex, säubert etwaige Interpunktionszeichen am URL-Ende, bereinigt den Pfad und die Suchparameter im Router und navigiert direkt zur "Extract"-Ansicht (`#/extract`).
3. **Authentifizierung:** Alle API-Calls verwenden `Authorization: Bearer <supabase_jwt>` im Header. Der Benutzer muss sich zuerst via Google anmelden (Supabase Auth). Ohne gültige Session ist die App vollständig gesperrt.
4. **Anfrage:** Der React-Client sendet eine `POST /api/extract-recipe` Anfrage (mit JWT-Token) an den Server.
5. **Erstellung:** Der Server validiert das JWT (`requireAuth`-Middleware), extrahiert die `userId`, legt einen Job mit Status `pending` und `user_id` an, startet die Queue und antwortet sofort mit der `jobId` (202 Accepted).
6. **Polling:** Das Frontend wechselt in den Ladezustand und fragt per Polling (`GET /api/jobs/:id` alle 2 Sekunden) den Status ab – stets mit JWT-Autorisierung.
7. **Verarbeitung:** Der Server aktualisiert den Status (`scraping` -> `processing`), lädt die Tonspur herunter und lässt Gemini das Rezept analysieren. Die Queue arbeitet mit der Service-Role-Key (ohne User-Bezug).
8. **Fertigstellung & Speicherung:** Sobald der Job den Status `completed` erreicht, stoppt das Polling. Das fertige JSON-Rezept wird an das Frontend übergeben und dauerhaft in der Supabase-Datenbank als Teil der Recipe History des Users gespeichert.
9. **Interaktion & Verlauf:**
   * Das Frontend renders das Rezept mit interaktiven Checklisten für Zutaten und Anleitungen.
   * Über das Tab-Menü "Saved Recipes" kann der Nutzer jederzeit auf den Verlauf zugreifen, alte Rezepte öffnen, kochen oder Rezepte dauerhaft löschen.
10. **Smarte Einkaufsliste:**
   * Über den Button *"Zur Einkaufsliste hinzufügen"* im Rezept werden alle aktuell nicht abgehakten Zutaten skaliert in den `localStorage` geladen.
   * Der Tab *"Einkaufsliste"* fasst Artikel mit identischen Einheiten und KI-standardisierten Namen (`baseName`) summiert zusammen, weist deren Herkunftsrezepte sowie Mengen-Teile aus und erlaubt eigene freie Zettel-Einträge. Offene Einkäufe werden als Badge-Zahl in der Hauptnavigation visualisiert.
    * **Kategorie-Abhaken:** Unterstützt das Abhaken aller Artikel einer Supermarktkategorie auf einmal über ein Gruppen-Checkbox-Element direkt links neben dem Kategorienamen. Der Gruppen-Checkbox-Zustand spiegelt die Artikelauswahl wider (Leer = keine Artikel abgehakt, Minus = einige Artikel abgehakt [Indeterminate], Check = alle Artikel abgehakt). Das Abhaken erfolgt sofort, und fertig abgehakte Kategorien werden automatisch ans Ende der Liste verschoben, um die Übersichtlichkeit zu wahren.
11. **Recipe Remix (KI-Anpassung):**
   * Über den Remix-Button auf der Rezept-Detailseite (oder aus der Historie) öffnet sich ein Modal mit Quick-Prompts (z.B. "Vegan", "High Protein", "Kalorienarm") und einem Freitextfeld.
   * **i18n & UX-Polishing:** Das Modal und die Quick-Chips sind vollständig lokalisiert (Deutsch und Englisch). Die Quick-Chips zeigen einen aktiven Zustand, wenn sie ausgewählt sind, und lassen sich durch erneutes Klicken abwählen (Toggle). Die Textarea besitzt Autofocus und reagiert auf Tastatureingaben wie `Ctrl+Enter` (Absenden) sowie `Escape` (Schließen des Modals, sofern kein Hintergrundprozess läuft).
   * Ein neuer `POST /api/jobs/:id/remix` Aufruf legt einen Job mit der `parent_job_id` an.
   * Die Queue überspringt das Apify-Scraping und den Audio-Download, lädt direkt das Parent-Rezept aus der DB und sendet es mit dem Prompt an Gemini.
   * Gemini passt Zutaten und Instruktionen an, fügt bei ersetzten Zutaten das `replacedOriginal` Feld hinzu (wird im UI durchgestrichen dargestellt) und ändert den Rezepttitel (z.B. "(Vegan Remix)").
   * Das Remix-Ergebnis wird als eigenständiger Eintrag in die Recipe History des Users aufgenommen.
   * **Parent-Referenzierung & Navigation:** Remixed-Rezepte referenzieren ihr Original-Rezept direkt unter dem Titel im Header (inkl. des genutzten Remix-Wunsches). Ein Klick auf den Link leitet den Nutzer direkt zum Original-Rezept weiter; falls das Original-Rezept gelöscht wurde, wird der Link deaktiviert und als plain text mit der Kennzeichnung `[gelöscht]` dargestellt.

---

## 🎯 Mehrwert & Skalierbarkeit

* **Höchste Datenqualität:** Multimodale Erfassung löst Diskrepanzen zwischen geschriebener Bildunterschrift und gesprochenem Audio logisch auf.
* **Mandantenfähige Isolation:** Supabase RLS-Policies + JWT-Auth garantieren, dass Nutzer ausschließlich ihre eigenen Rezepte und Jobs sehen und bearbeiten können. Jeder API-Call ist an die `auth.uid()` gebunden.
* **Modernes Identitätsmanagement:** Supabase Auth (E-Mail/Passwort) ersetzt statische API-Keys. Token-Refresh erfolgt transparent via `onAuthStateChange`.
* **Native-artiges Mobile-Erlebnis:** Kein manuelles Kopieren/Einfügen von Links dank Web-Share-Target-Integration unter Android.
* **Serverless Ready:** Keine Abhängigkeit von Binär-Tools wie FFmpeg. Geringer Memory-Footprint. Supabase Postgres statt lokaler JSON-Datei.
* **Einfache Validierung:** Automatisierte Testläufe ermöglichen einfache Systemprüfung.
* **Windows-Kompatibel:** Kompilierungsfreie Node.js-Architektur ohne native Addons.

---

## 🐳 Deployment & Containerization

* **Multi-Stage Dockerfile:** Zwei-Stufen-Build für minimale Image-Größe. Builder-Stage kompiliert TypeScript (`tsc`) und baut das React-Frontend (`vite build`). Production-Stage kopiert nur `node_modules`, `dist/` und `frontend/dist/` und startet via `node dist/index.js` mit `NODE_ENV=production`.
* **`.dockerignore`:** Schließt `node_modules`, `dist`, `logs`, `temp-downloads`, `.env`, `.git` und `*.md` vom Build-Kontext aus, um Image-Größe und Build-Zeit zu minimieren.
* **Build- & Dev-Skripte (`package.json`):**
  * `npm run dev` — Startet den Express-Server und das React-Frontend parallel im Entwicklungsmodus.
  * `npm run build` — Baut das Frontend und das Backend nacheinander.
  * `npm start` — Startet die Anwendung im Produktionsmodus.
* **Umgebungsvariablen (`.env.example`):**
  * `SUPABASE_SECRET_KEY` ersetzt die alte `API_KEY` für den Service-Role-Zugriff im Backend.
  * `CORS_ORIGIN` (Production) konfiguriert erlaubte Origins für CORS.
  * `NODE_ENV=production` aktiviert CSP via `helmet` und restriktive CORS-Regeln.

---

## 💎 Freemium Gating System

Die App unterscheidet zwischen **Free**- und **Premium**-Nutzern. Premium-Status wird aus `user.app_metadata.tier === 'premium'` abgeleitet und ist in `AuthContext` als `isPremium` boolean verfügbar.

### Tier-Erkennung & Dev-Override
* **`AuthContext.tsx`:** Stellt `isPremium` (computed) und `setIsPremiumOverride(value: boolean)` bereit.
* **Dev-Override:** Nur wenn `import.meta.env.DEV === true` wird ein `localStorage`-Key (`kb_simulate_premium`) gelesen/geschrieben, um den Premium-Status zu simulieren. In Production hat dies keine Wirkung.
* **SettingsView:** Zeigt einen violetten "Simulate Premium"-Toggle (dashed border, Kolben-Icon) ausschließlich im Dev-Modus.

### Gating-Punkte

| Feature | Free | Premium |
|---|---|---|
| Rezept-Extraktionen | 3/Tag (konfigurierbar via `.env`) | 50/Tag (konfigurierbar via `.env`) |
| Kochbuch (History) | max. 5 Rezepte — Banner ab 4 | Unbegrenzt |
| Einkaufsliste | max. 1 Rezept gleichzeitig | Unbegrenzt |
| Nährwerte-Detail-Card | Blur-Overlay + Lock | Vollständig sichtbar |
| Nährwerte pro Zutat (Toggle) | Lock-Badge, öffnet PremiumModal | Aktiviert |
| Kochmodus (Cooking Mode) | Lock-Badge an **beiden** Startbuttons (Action-Dock **und** Instructions-Tab), öffnet PremiumModal | Aktiviert |
| In-App Koch-Timer (Zeit-Badges) | Klick auf ein Zeit-Badge öffnet PremiumModal statt des Timer-Sheets | Aktiviert |
| Rezept-Remix | Lock-Badge (Frontend) + 403 (Backend) | Aktiviert |

> **Einheitliche Premium-Marker-Optik (Crown = Premium):** Gated Buttons zeigen den `PremiumCrownBadge` — ein kleines gefülltes Amber-Crown-Siegel (weißer Kreis) oben rechts in der Ecke (Kochmodus-Startbuttons im Action-Dock **und** Instructions-Tab, Remix-Icon; Parent muss `relative` sein). Der Nährwerte-pro-Zutat-Toggle nutzt dieselbe Sprache inline (`Crown className="w-3 h-3 text-amber-500 fill-amber-500"`). Das Schloss-Icon wurde bewusst durch die Crown ersetzt, um mit dem restlichen Premium-Branding (PremiumModal, Settings-Karte, PremiumHint) konsistent zu sein.

### Backend-Gating
* **`POST /api/jobs/:id/remix`:** Prüft den Premium-Status des Nutzers via Supabase Admin API (`auth.admin.getUserById`). Gibt `403 Forbidden` zurück, wenn `tier !== 'premium'`.
* **`POST /api/extract-recipe` (Kochbuch-Cap):** Free-Accounts dürfen maximal `FREE_MAX_SAVED_RECIPES` (Default `5`, via `.env`) gespeicherte Rezepte im Kochbuch behalten. Vor dem Einreihen eines neuen Jobs zählt das Backend die abgeschlossenen Rezepte des Nutzers (`countCompletedRecipesForUser`, inkl. Remixes) und gibt bei Erreichen des Limits `403 Forbidden` mit `code: 'COOKBOOK_FULL'` und der Meldung `Cookbook full (n/limit) …` zurück. Bestehende Rezepte bleiben erhalten/sichtbar — der Nutzer muss ein Rezept löschen oder upgraden. Premium/Unlimited-Nutzer (`tier === 'premium'` oder `-1`-Override) sind ausgenommen. Das Frontend übersetzt die Meldung in `translateApiError` (DE/EN). Der Premium-Status wird über den Helper `isPremiumUser` ermittelt; der User wird pro Request **einmal** geladen und für Cap **und** rollierendes Extraktionslimit wiederverwendet.
* **`GET /api/extractions/limit` (proaktiver Status):** Liefert zusätzlich zum Extraktionslimit die Kochbuch-Cap-Felder `savedRecipes`, `maxSavedRecipes` (`-1` = unbegrenzt für Premium) und `cookbookFull`. `ExtractForm` liest diese über `useRecipeExtraction.limitStatus` und zeigt bei vollem Kochbuch **proaktiv** einen `PremiumHint`-Banner statt des Extraktionszählers und deaktiviert den „Rezept erstellen"-Button (Fallback bleibt das serverseitige `403`). Der Status wird beim Betreten des Extract-Tabs neu geladen.

### UI-Komponenten
* **`PremiumModal.tsx`:** Glassmorphischer Upsell-Dialog. Wird über `createPortal(document.body)` gerendert, damit `fixed inset-0` immer gegen den Viewport (Vollbild) auflöst und nicht gegen einen Vorfahren mit `transform`/`filter` (z. B. animierte Cards) geclippt wird. Listet alle Premium-Features auf, löst beim Klick auf CTA `buyPremium()` aus (RevenueCat). Zeigt "Du hast Premium"-State wenn bereits aktiv.
* **`PremiumModal`** wird in folgenden Komponenten verwendet: `ExtractForm.tsx`, `SavedCatalog/index.tsx`, `SettingsView.tsx`, `RecipeDetails/index.tsx`, `RecipeDetails/RecipeNutrition.tsx`.
* **`PremiumHint.tsx`:** Zentrale, wiederverwendbare Upsell-Hint-Komponente und **Single Source of Truth** für den einheitlichen Premium-Hint-Stil ("goldene Crown auf Emerald-Fläche", passend zu `PremiumModal` und der Settings-Upgrade-Karte). Zwei Varianten: `banner` (volle Breite, Emerald-Tint-Fläche + goldener Crown-Chip + optionaler `cta`) und `inline` (kompakter Crown-Text-Link). Die Hint-Texte liegen unter `premium.hint.*` in `i18n.ts` (DE/EN). Genutzt in `SavedCatalog/index.tsx` (banner) und `ExtractForm.tsx` (inline).
* **`PremiumCrownBadge.tsx`:** Kleines Amber-Crown-Siegel (Corner-Badge) as **Single Source of Truth** für den Premium-Marker auf gated Buttons/Icons (Kochmodus-Startbuttons, Remix). Absolut positioniert → Parent muss `relative` sein.
* **`CatalogEmptyState.tsx`:** Visueller und interaktiver Step-by-Step Onboarding-Guide, der angezeigt wird, wenn das Rezept-Kochbuch leer ist. Bietet einen Tab-Switcher für zwei Workflows: den empfohlenen **Direct Share**-Weg (Teilen über die Systemfreigabe direkt an Snagbite) und den klassischen **Copy & Paste**-Weg. Führt den Nutzer mit passenden, responsive animierten Mockups durch die Schritte und bietet einen prominenten CTA zur Navigation.
* **`ShareMockups.tsx`:** [NEW] Enthält die geteilten SVG/HTML Mockups (`ShareStep1Mockup`, `ShareStep2Mockup`, `ShareStep3Mockup`) für den Direct-Share-Onboarding-Prozess. Diese werden sowohl in `ExtractForm.tsx` (Schritt-für-Schritt-Hilfe) als auch in `CatalogEmptyState.tsx` (Onboarding-Guide) wiederverwendet. Der dritte Schritt nutzt das Snagbite-Markenlogo (`/icon-192.png`) sowie lokalisierte Beschriftungen für eine einheitliche UX.

### Upsell-Touchpoints
* **ExtractForm:** Unter dem Extraktionszähler erscheint für Free-User ein `PremiumHint` (inline) zur PremiumModal. Ist das Kochbuch voll (`limitStatus.cookbookFull`), wird stattdessen ein `PremiumHint` (banner) angezeigt und der Extrahieren-Button deaktiviert.
* **SavedCatalog:** `PremiumHint` (banner) erscheint ab dem 4. Rezept (fast voll) und ab dem 5. (voll) mit Upgrade-Aufforderung.
* **RecipeNutrition:** Blur-Overlay über der Nährwert-Card mit einer Emerald-Lock-Pille ("Nährwerte freischalten"); öffnet die PremiumModal.
* **SettingsView:** Free-User sehen eine anklickbare Upgrade-Karte (Emerald-Gradient); Premium-User sehen stattdessen eine goldene Status-Card ("Aktiv ✓").

