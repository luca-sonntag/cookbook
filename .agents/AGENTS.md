# 🚀 Projekt: Instagram Reel Rezept-Extraktor (Google Antigravityx)

Dieses Projekt ist eine hochoptimierte, automatisierte Node.js-Anwendung in TypeScript, die Rezept-Reels von Instagram analysiert und in ein strukturiertes, maschinenlesbares JSON-Format umwandelt.

Durch die Kombination des Apify Instagram Scrapers und den multimodalen Fähigkeiten von Google Gemini 1.5 werden geschriebene Bildunterschriften (`caption`) und die gesprochene Tonspur (`audioUrl`) direkt zusammengeführt und von der KI in ein fertiges Rezept übersetzt.

---

## 🏗️ Implementierte Technische Architektur & Tech-Stack

### 1. Scraping-Layer (Apify)

* **Technologie:** Apify API Client (`apify-client`).
* **Funktion:** Instagrams Anti-Bot-Maßnahmen werden vollständig umgangen. Die Reel-URLs werden im Feld `username` als Array übergeben.
* **Ergebnis:** Die API-Antwort liefert neben der `caption` direkte, abrufbare Links für die **`audioUrl`** (in der Regel eine MP4/M4A-Audiodatei).

### 2. Processing- & Database-Layer (Node.js & JSON-DB)

* **Technologie:** Express.js, TypeScript (ausgeführt über `tsx` / Direct-Node execution), native Node.js 18+ `fetch` API.
* **Datenbank:** Eine thread-sichere, dateibasierte JSON-Datenbank (`src/db.ts`) mit Schreibsperren (Locks) und atomaren Dateioperationen. Dies wurde als robuster Ersatz für SQLite implementiert, da native Build-Tools auf Windows-Systemen häufig Kompilierungsfehler verursachen.
* **Funktion:** Das Backend dient als asynchroner Job-Orchestrator. Es nimmt Anfragen an, verwaltet Jobs und lädt die reine Audiodatei temporär auf die Festplatte herunter, ohne schwerfällige Software wie FFmpeg zu benötigen.

### 3. KI-Layer (Google Gemini 1.5)

* **Technologie:** `@google/generative-ai` SDK (Gemini 1.5 Flash).
* **Funktion:** Die Audiodatei wird über die Google AI File API hochgeladen. Gemini 1.5 verarbeitet Audio und Text (`caption`) in einem einzigen multimodalen Aufruf.
* **Structured Outputs:** Gemini wird durch ein strenges JSON-Schema gezwungen, das Rezept exakt nach einem detaillierten Schema (Titel, Beschreibung, Zutaten mit Mengen/Einheiten, Schritte, Ausrüstung, Nährwertschätzungen, Kochtipps und Alternativzutaten) zu strukturieren.
* **Auto-Cleanup:** Sowohl die lokale Audiodatei als auch die Datei auf der Google AI File API werden unmittelbar nach der Verarbeitung gelöscht (auch im Fehlerfall).

---

## 🔄 Workflow im Detail

1. Der Client sendet eine Reel-URL per `POST /api/extract-recipe`.
2. Der Server legt einen Job mit Status `pending` an und antwortet sofort mit einer `jobId` (202 Accepted).
3. Der Background-Worker setzt den Status auf `scraping`, ruft die Modelldaten von Apify ab und aktualisiert den Status auf `processing`.
4. Der Worker lädt die Audiodatei herunter, lädt sie zu Gemini hoch, führt die Extraktion aus und speichert das Ergebnis in der JSON-Datenbank mit Status `completed`.
5. Der Client fragt den Status über `GET /api/jobs/:id` ab, um das fertige JSON-Rezept abzurufen.

---

## 🎯 Mehrwert & Skalierbarkeit

* **Höchste Datenqualität:** Da Gemini Sprache und Text gleichzeitig versteht, werden Unstimmigkeiten zwischen Tonspur und Beschreibungstext logisch aufgelöst.
* **Serverless Ready:**FFmpeg-Binaries entfallen komplett. Die Anwendung läuft mit minimalem Memory-Footprint und ist bereit für Serverless-Plattformen (wie Google Cloud Functions oder AWS Lambda).
* **Windows-Kompatibel:** Bietet durch Bypassing-Skripte für package-cmd-Wrapper eine reibungslose Entwicklung auf Windows-Systemen.
* **E2E-Tests:** Inklusive eines CLI-Testclients (`test-client.ts`), um den gesamten Workflow zu simulieren und zu prüfen.
