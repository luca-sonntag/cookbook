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
* **History & Verwaltung:**
  * Bietet Helper-Funktionen (`getAllJobs()` und `deleteJob(id)`) zur persistenten Abfrage und Bereinigung von Extraktionen.
  * Stellt REST-Endpunkte bereit: `GET /api/jobs` (liefert den Extraktionsverlauf sortiert nach Erstellungsdatum) und `DELETE /api/jobs/:id` (löscht ein bestimmtes Rezept).
* **Frontend-Hosting:** Express dient gleichzeitig als Webserver für die React-Frontend-Assets (`frontend/dist`) und leitet alle Nicht-API-Routen (`*`) zwecks SPA-Routing an die `index.html` weiter.

### 3. KI-Layer (Google Gemini)

* **Technologie:** `@google/generative-ai` SDK (Gemini 1.5/2.5/3.1 Flash).
* **Funktion:** Die Audiodatei wird über die Google AI File API hochgeladen. Gemini verarbeitet Audio und Text (`caption`) in einem einzigen multimodalen Aufruf.
* **Structured Outputs:** Gemini wird durch ein strenges JSON-Schema gezwungen, das Rezept exakt nach einem detaillierten Schema (Titel, Beschreibung, Zutaten mit Mengen/Einheiten, Schritte, Ausrüstung, Nährwertschätzungen, Kochtipps und Alternativzutaten) zu strukturieren.
* **Auto-Cleanup:** Lokale Audiodateien und Google-API-Dateien werden nach der Verarbeitung sofort gelöscht.

### 4. Frontend- & PWA-Layer (React & HeroUI)

* **Technologie:** React 19, Vite, TypeScript, HeroUI v3 (React Aria-basiert), Tailwind CSS v4, `vite-plugin-pwa` (Service Worker & Manifest).
* **Architektur & Modul-Struktur (React Best Practices):**
  * **Schlanker App-Shell (`App.tsx`):** Die Hauptkomponente verwaltet primär den globalen Zustand, die API-Kommunikation (Polling-Mechanismus für die Queue, API-Key-Validierung) und das Routing/Umschalten zwischen den Hauptansichten.
  * **Komponententrennung (`frontend/src/components/`):**
    * **`ThemeToggle.tsx`:** Kontrolliert den clientseitigen Hell- und Dunkelmodus.
    * **`ApiConfig.tsx`:** Modularisiertes Einstellungen-Panel zur Verwaltung des API-Keys.
    * **`InstallBanner.tsx`:** Kapselt den PWA-Installationshinweis.
    * **`ExtractForm.tsx`:** Formular zur Eingabe und automatischen Validierung der Instagram-Reels-URLs.
    * **`ProgressTracker.tsx`:** Visualisiert den aktuellen Status des Extraktionsprozesses in Echtzeit.
    * **`ErrorBanner.tsx`:** Zeigt detaillierte Fehler und ermöglicht erneutes Ausführen.
    * **`RecipeDetails.tsx`:** Bildet das Herzstück für Kochinteraktionen ab (Zutaten- und Zubereitungs-Checklisten, Portionsrechner, Meta-Statistiken, Nährwerttabellen und Markdown-Kopierfunktion).
    * **`SavedCatalog.tsx`:** Verwaltet das Grid-Layout der Rezept-Historie inklusive Suchfilterung und Löschvorgängen.
  * **Typensicherheit (`src/types.ts`):** Zentralisierte TypeScript-Modelle für Rezepte, Zutaten, Nährwerte und API-Jobs. Nutzung von `type`-only Imports zur Einhaltung von Compiler-Richtlinien (wie `verbatimModuleSyntax`).
* **Visuelles Design:** Theme-gesteuert (Hell- & Dunkelmodus) mit modernem Glassmorphismus und harmonischen Akzentfarben (Smaragdgrün/Emerald-Grün). Optimiert für mobile Displays mit flüssigen Übergängen.
* **Theme-Steuerung:** Bietet einen Header-Schalter (Sonne/Mond), um das Erscheinungsbild umzuschalten. Die Auswahl wird im `localStorage` persistiert und ein Inline-Interceptor im `<head>` der `index.html` verhindert das Aufblitzen des hellen Designs beim App-Start.
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
   * Das Frontend rendert das Rezept mit interaktiven Checklisten für Zutaten und Anleitungen.
   * Über das Tab-Menü "Saved Recipes" kann der Nutzer jederzeit auf den Verlauf zugreifen, alte Rezepte öffnen, kochen oder Rezepte dauerhaft löschen.

---

## 🎯 Mehrwert & Skalierbarkeit

* **Höchste Datenqualität:** Multimodale Erfassung löst Diskrepanzen zwischen geschriebener Bildunterschrift und gesprochenem Audio logisch auf.
* **Native-artiges Mobile-Erlebnis:** Kein manuelles Kopieren/Einfügen von Links dank Web-Share-Target-Integration unter Android.
* **Serverless Ready:** Keine Abhängigkeit von Binär-Tools wie FFmpeg. Geringer Memory-Footprint.
* **Einfache Validierung:** Lokaler HTTP-Shortcut-Import (`/shortcuts`) sowie automatisierte Testläufe ermöglichen einfache Systemprüfung.
* **Windows-Kompatibel:** Kompilierungsfreie JSON-DB verhindert Node-gyp-Fehler bei Windows-Systemen.

