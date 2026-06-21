# 🚀 Projekt: Instagram Reel Rezept-Extraktor (Google Antigravityx)

Dieses Projekt ist eine hochoptimierte, automatisierte Webanwendung, die Rezept-Reels von Instagram analysiert, in ein strukturiertes JSON-Format umwandelt und in einem interaktiven, modernen Web-Dashboard anzeigt.

Durch die Kombination des Apify Instagram Scrapers, den multimodalen Fähigkeiten von Google Gemini und einer modernen React-PWA-Oberfläche werden Reels direkt via Instagram-Share-Option geladen, transkribiert und als interaktive Kochrezepte aufbereitet.

---

## 🏗️ Implementierte Technische Architektur & Tech-Stack

### 1. Scraping-Layer (Apify)

* **Technologie:** Apify API Client (`apify-client`).
* **Funktion:** Instagrams Anti-Bot-Maßnahmen werden vollständig umgangen. Die Reel-URLs werden im Feld `username` als Array übergeben.
* **Ergebnis:** Die API-Antwort liefert neben der `caption` direkte, abrufbare Links für die **`audioUrl`** (in der Regel eine MP4/M4A-Audiodatei).

### 2. Processing- & Database-Layer (Node.js & JSON-DB)

* **Technologie:** Express.js, TypeScript (ausgeführt über `tsx` / Direct-Node execution), native Node.js 18+ `fetch` API.
* **Datenbank:** Eine thread-sichere, dateibasierte JSON-Datenbank (`src/db.ts`) mit Schreibsperren (Locks) und atomaren Dateioperationen.
* **Funktion:** Das Backend dient als asynchroner Job-Orchestrator, verwaltet Jobs und lädt Audiodateien temporär herunter.
* **History, ID-Vergabe & Verwaltung:**
  * Bietet Helper-Funktionen (`getAllJobs()` und `deleteJob(id)`) zur persistenten Abfrage und Bereinigung von Extraktionen.
  * Stellt REST-Endpunkte bereit: `GET /api/jobs` (liefert den Extraktionsverlauf sortiert nach Erstellungsdatum) und `DELETE /api/jobs/:id` (löscht ein bestimmtes Rezept).
  * **Eindeutige Identifikation:** Normalisiert Rezepte bei Abfragen und versieht sie mit einer eindeutigen `id` (entspricht der `jobId`), um Kollisionen zwischen Rezepten mit gleichem Titel zu unterbinden.
* **Frontend-Hosting:** Express dient gleichzeitig als Webserver für die React-Frontend-Assets (`frontend/dist`) und leitet alle Nicht-API-Routen (`*`) zwecks SPA-Routing an die `index.html` weiter.

### 3. KI-Layer (Google Gemini)

* **Technologie:** `@google/generative-ai` SDK (Gemini 1.5/2.5/3.1/3.5 Flash).
* **Funktion:** Die Audiodatei wird über die Google AI File API hochgeladen. Gemini verarbeitet Audio und Text (`caption`) in einem einzigen multimodalen Aufruf.
* **Structured Outputs & Clean Parsing:** Gemini wird durch ein strenges JSON-Schema gezwungen, das Rezept exakt nach einem detaillierten Schema (Titel, Beschreibung, Zutaten mit Mengen/Einheiten, Schritte, Ausrüstung, Nährwertschätzungen, Kochtipps und Alternativzutaten) zu strukturieren.
  * **Kategorisierung & Standardisierung:** Das Schema erzwingt die Zuordnung von Zutaten in feste englische Enum-Supermarktkategorien (z.B. `PRODUCE`, `DAIRY_EGGS`) und generiert pro Zutat einen `baseName` (z.B. "Zwiebel" statt "rote Zwiebeln") für eine deterministische Gruppierung in der Einkaufsliste.
  * **Bereinigung der Zutatennamen:** Zutatennamen (`name`) werden im Prompt explizit von Mengen, Zahlen und Maßeinheiten gesäubert; diese Daten fließen sauber in die dedizierten Felder `amount` und `unit`.
  * **Dekomposition von Verbundzutaten:** Im Prompt ist geregelt, dass während des Rezept-Videos zubereitete Verbundkomponenten (wie "Smash Burger Patties" oder "selbstgemachtes Pesto") in ihre atomaren Rohbestandteile zersetzt werden müssen (z. B. Rinderhack, Chesterkäse, Basilikum, Olivenöl), anstatt das fertige Zwischenprodukt als Zutat aufzuführen.
  * **Bevorzugte Einheiten & Unit-System-Steuerung:** Über die Umgebungsvariablen `PREFERRED_TEMPERATURE_UNIT` (z. B. `Celsius`, `Fahrenheit` oder `both`) und `PREFERRED_UNIT_SYSTEM` (z. B. `metric` oder `imperial`) in der `.env`-Datei kann die gewünschte Formatierung für Temperaturen und Zutateneinheiten konfiguriert werden. Der Prompt instruiert Gemini, alle extrahierten Werte entsprechend umzurechnen und zu formatieren.
* **Auto-Cleanup:** Lokale Audiodateien und Google-API-Dateien werden nach der Verarbeitung sofort gelöscht.

### 4. Frontend- & PWA-Layer (React & HeroUI)

* **Technologie:** React 19, Vite, TypeScript, HeroUI v3 (React Aria-basiert), Tailwind CSS v4, `vite-plugin-pwa` (Service Worker & Manifest).
  * **Architektur & Modul-Struktur (React Best Practices):**
    * **Schlanker App-Shell (`App.tsx`):** Die Hauptkomponente ist modular gestaltet und delegiert komplexe Zustände an spezialisierte Custom Hooks.
    * **Zentralisierte Kontexte (`frontend/src/context/`):**
      * **`DialogContext.tsx`:** Stellt einen globalen Dialog-Service (`useDialog()`) bereit, um native Browser-Dialoge (`confirm` / `alert`) durch moderne, nicht-blockierende HeroUI-Dialoge mit wählbaren Status (z. B. `danger`, `warning`) zu ersetzen.
      * **`I18nContext.tsx`:** Verwaltet den globalen Internationalisierungs-Zustand (Deutsch und Englisch), persistiert die Nutzerwahl im `localStorage` und ermittelt die Standardeinstellung anhand der Browsersprache (`navigator.language`). Stellt die Hook `useI18n()` für dot-notation basierte UI-Übersetzungen (`t()`) mit Variablen-Ersetzung bereit.
    * **Lokalisierung & Übersetzung (`frontend/src/i18n.ts`):**
      * Verwaltet das Übersetzungsmapping für Supermarktabteilungen (`IngredientCategory`).
      * Ordnet den Kategorien passende Emojis/Icons zu.
      * Definiert die Supermarkt-Laufrichtung zur Sortierung von Zutaten.
      * Mappt über `legacyCategoryMap` alte Rezeptkategorien transparent auf das neue Schema, um Abwärtskompatibilität zu sichern.
      * Definiert das globale Übersetzungs-Wörterbuch (`uiTranslations`) und stellt die Funktion `getTranslation` zur rekursiven Schlüssel-Pfad-Auflösung bereit.
    * **Zentralisierte Hooks (`frontend/src/hooks/`):**
      * **`useTheme.ts`:** Steuert das clientseitige Umschalten des Hell- und Dunkelmodus und persistiert die Einstellung im `localStorage`.
      * **`usePwaInstall.ts`:** Kapselt das Abfangen des `beforeinstallprompt`-Events und steuert die Installationslogik.
      * **`useRecipeExtraction.ts`:** Orchestriert die Validierung der URLs, die Job-Übermittlung und das asynchrone Polling des Queue-Status, gekoppelt mit dynamischen Lade-Animationen.
      * **`useRecipeScaling.ts`:** Berechnet Skalierungsfaktoren für Zutaten und Nährwerte. Discrete Einheiten (z.B. Stück, Zehen, EL, TL) werden in küchenübliche gemischte Brüche (z.B. `1 ½`) formatiert, während kontinuierliche Gewichte/Volumina als Ganz- oder Dezimalzahlen gerendert werden. Die ausgewählte Portionsgröße wird persistent im `localStorage` unter Verwendung des ID-basierten Schlüssels gespeichert.
      * **`useRecipeProgress.ts`:** Persistiert den Abhakk-Zustand (Checklisten-Fortschritt) von Zutaten und Zubereitungsschritten im `localStorage` basierend auf der eindeutigen Rezept-ID.
      * **`useShoppingList.ts`:** Verwaltet den Zustand der Einkaufsliste im `localStorage` (`recipe_shopping_list`), führt neue Rezepte rezept- und portionsgenau ein, filtert abgehakte Zutaten heraus und gruppiert/aggregiert gleiche Artikel rezeptübergreifend. Die Gruppierung erfolgt intelligent auf Basis des von der KI generierten `baseName`.
      * **`useMobileNavigationBack.ts`:** Kapselt die native Browser-Verlaufssteuerung (`pushState`/`popstate`-Event-Listener) und mobile Wischgesten (Swipe-to-Go-Back), um eine native Mobile-Erfahrung beim Schließen der Detailansicht zu gewährleisten.
      * **`useImageGallery.ts`:** Übernimmt die komplexe Pointer-Mathematik für das horizontale Scrollen, Swipen, Double-Tap-to-Zoom und das freie Panning der Galeriebilder im Vollbildmodus.
    * **Komponententrennung (`frontend/src/components/`):**
      * **`ThemeToggle.tsx`:** Kontrolliert den clientseitigen Hell- und Dunkelmodus.
      * **`ApiConfig.tsx`:** Settings-Panel zur API-Key-Verwaltung.
      * **`InstallBanner.tsx`:** Kapselt den PWA-Installationshinweis.
      * **`ExtractForm.tsx`:** Formular zur Eingabe und Validierung der Reels-URLs.
      * **`ProgressTracker.tsx`:** Visualisiert den aktuellen Job-Status in Echtzeit, untermalt durch dynamische Cooking-Fun-Facts, Fortschrittsbalken und humorvolle Ladebotschaften.
      * **`ErrorBanner.tsx`:** Zeigt detaillierte Fehler und ermöglicht erneutes Ausführen.
      * **`RecipeDetails.tsx`:** Herzstück für Kochinteraktionen (Zutaten- und Zubereitungs-Checklisten, Portionsrechner, Meta-Statistiken, Nährwerttabellen, Markdown-Kopierfunktion sowie der *"Zur Einkaufsliste hinzufügen"*-Button). Die Zutatengruppen werden hierbei sortiert nach Supermarktlaufrichtung samt Übersetzung und passenden Icons gerendert. Haken-Zustände bleiben dank stabiler `originalIdx`-IDs von Sortierungen unberührt.
      * **`SavedCatalog.tsx`:** Grid-Layout der Rezept-Historie inklusive Suchfilterung, Löschvorgängen und Weiterleitung von Einkaufslisten-Befehlen.
      * **`ShoppingList.tsx`:** Anzeige und Interaktions-Panel der smarten Einkaufsliste. Beinhaltet ein Zettelformular für manuelle freie Einkäufe, Vorschlagsbuttons für Einheiten und getrennte Listen für noch zu kaufende und im Korb befindliche Artikel. Die noch zu kaufenden Artikel werden nach Supermarkt-Kategorien gruppiert und sortiert angezeigt.
    * **Typensicherheit (`src/types.ts` & `frontend/src/types.ts`):** Zentralisierte TypeScript-Modelle für Rezepte, Zutaten, Nährwerte und API-Jobs. Nutzung von `type`-only Imports zur Einhaltung von Compiler-Richtlinien (wie `verbatimModuleSyntax`).
* **Visuelles Design:** Theme-gesteuert (Hell- & Dunkelmodus) mit modernem Glassmorphismus und harmonischen Akzentfarben (Smaragdgrün/Emerald-Grün). Optimiert für mobile Displays mit flüssigen Übergängen.
* **Sprach- und Theme-Steuerung:**
  * Bietet einen Header-Schalter (Sonne/Mond) für den Hell- und Dunkelmodus. Die Auswahl wird im `localStorage` persistiert.
  * Bietet einen Header-Sprachwähler (Pill-Button `DE` / `EN`) zur Echtzeit-Umschaltung aller UI-Texte, Fehlermeldungen, Lade-Fakten und Maßeinheit-Vorschläge.
  * Ein Inline-Interceptor im `<head>` der `index.html` verhindert das Aufblitzen des hellen Designs beim App-Start.
* **PWA & Share Target Integration:**
  * Die Webanwendung ist über den Browser direkt als PWA (Progressive Web App) installierbar.
  * Registriert die **Web Share Target API**, sodass Instagram Reels direkt aus der Instagram-App an die PWA geteilt werden können. Der URL-Parameter wird beim Start der PWA automatisch ausgewertet, bereinigt und an den Extraktor gesendet.
* **Rezeptverlauf & Interaktion:**
  * **Saved Recipes:** Ermöglicht das Durchsuchen aller erfolgreich verarbeiteten Rezepte in einer Grid-Ansicht mit Filter- und Löschoptionen.
  * **Detailansicht:** Das Laden eines archivierten Rezepts integriert sich nahtlos in die interaktive Checklisten-Oberfläche (Zutaten- und Schritt-Abhaken).
  * **Navigationshilfen:** Bietet responsive Zurück-Buttons für komfortable Navigation auf Smartphones.
  * Bietet interaktive Checklisten zum Abhaken von Zutaten und Zubereitungsschritten während des Kochens.
  * Unterstützt das Kopieren des Rezepts als formatiertes Markdown.

---

## 🔄 Workflow im Detail

1. **Reel-Sharing / Eingabe:** Der Nutzer teilt ein Reel direkt über die Instagram-Teilen-Schaltfläche an die installierte PWA oder fügt die Reel-URL manuell im Dashboard ein.
2. **Parsing:** Das Frontend empfängt die geteilten Parameter (`/share?text=...`), filtert die Reel-URL per Regex und bereinigt sie.
3. **Anfrage:** Der React-Client sendet eine `POST /api/extract-recipe` Anfrage (unter Verwendung des lokal hinterlegten API-Schlüssels) an den Server.
4. **Erstellung:** Der Server legt einen Job mit Status `pending` an, startet die Queue und antwortet sofort mit der `jobId` (202 Accepted).
5. **Polling:** Das Frontend wechselt in den Ladezustand und fragt per Polling (`GET /api/jobs/:id` alle 2 Sekunden) den Status ab.
6. **Verarbeitung:** Der Server aktualisiert den Status (`scraping` -> `processing`), lädt die Tonspur herunter und lässt Gemini das Rezept analysieren.
7. **Fertigstellung & Speicherung:** Sobald der Job den Status `completed` erreicht, stoppt das Polling. Das fertige JSON-Rezept wird an das Frontend übergeben und dauerhaft in der JSON-Datenbank als Teil der Recipe History gespeichert.
8. **Interaktion & Verlauf:**
   * Das Frontend renders das Rezept mit interaktiven Checklisten für Zutaten und Anleitungen.
   * Über das Tab-Menü "Saved Recipes" kann der Nutzer jederzeit auf den Verlauf zugreifen, alte Rezepte öffnen, kochen oder Rezepte dauerhaft löschen.
9. **Smarte Einkaufsliste:**
   * Über den Button *"Zur Einkaufsliste hinzufügen"* im Rezept werden alle aktuell nicht abgehakten Zutaten skaliert in den `localStorage` geladen.
   * Der Tab *"Einkaufsliste"* fasst Artikel mit identischen Einheiten und KI-standardisierten Namen (`baseName`) summiert zusammen, weist deren Herkunftsrezepte sowie Mengen-Teile aus und erlaubt eigene freie Zettel-Einträge. Offene Einkäufe werden als Badge-Zahl in der Hauptnavigation visualisiert.

---

## 🎯 Mehrwert & Skalierbarkeit

* **Höchste Datenqualität:** Multimodale Erfassung löst Diskrepanzen zwischen geschriebener Bildunterschrift und gesprochenem Audio logisch auf.
* **Native-artiges Mobile-Erlebnis:** Kein manuelles Kopieren/Einfügen von Links dank Web-Share-Target-Integration unter Android.
* **Serverless Ready:** Keine Abhängigkeit von Binär-Tools wie FFmpeg. Geringer Memory-Footprint.
* **Einfache Validierung:** Automatisierte Testläufe ermöglichen einfache Systemprüfung.
* **Windows-Kompatibel:** Kompilierungsfreie JSON-DB verhindert Node-gyp-Fehler bei Windows-Systemen.

