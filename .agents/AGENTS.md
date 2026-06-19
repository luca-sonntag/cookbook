# 🚀 Projektidee: Instagram Reel Rezept-Extraktor (Google Antigravityx)

## 📌 Zusammenfassung (Elevator Pitch)

Dieses Projekt ist eine hochoptimierte, automatisierte Node.js-Anwendung, die Rezept-Reels von Instagram analysiert und in ein strukturiertes, maschinenlesbares JSON-Format umwandelt. Durch die Kombination des Apify Instagram Scrapers und den multimodalen Fähigkeiten von Google Gemini 1.5 werden geschriebene Bildunterschriften (`caption`) und die gesprochene Tonspur (`audioUrl`) direkt zusammengeführt und von der KI in ein fertiges Rezept übersetzt.

## 🛑 Das Problem

Viele Content-Creator auf Instagram teilen großartige Rezepte in Form von Reels. Für Nutzer ist es jedoch extrem unpraktisch, diese nachzukochen:

* Zutaten und Schritte sind oft nur im Video gesprochen, stehen unstrukturiert in der Beschreibung oder fehlen teilweise.
* Meta (Instagram) macht das automatisierte Auslesen (Scraping) von Inhalten extrem schwer und blockiert IPs sehr schnell.
* Ein reiner Text-Scraper reicht nicht aus, da essenzielle Rezeptschritte oft nur in der Tonspur vorkommen.

## 💡 Die Lösung

Eine extrem schlanke Backend-Pipeline (Node.js), die den Prozess von der URL bis zum fertigen JSON automatisiert. Apify übernimmt das Scraping der Metadaten und extrahiert direkte CDN-Links für Audio und Video. Google Gemini 1.5 übernimmt als multimodale KI die intelligente Extraktion und kombiniert die Audiospur und den Beschreibungstext zu einem validierten Rezept-JSON.

## 🏗️ Technische Architektur & Tech-Stack

### 1. Scraping-Layer (Apify)

* **Technologie:** Apify API (`apify~instagram-reel-scraper`).
* **Funktion:** Wir umgehen Instagrams Anti-Bot-Maßnahmen vollständig. Die Reel-URLs werden einfach im Feld `username` als Array übergeben.
* **Der Clou:** Anstatt komplexe Video-Downloads durchzuführen, liefert die API-Antwort neben der `caption` bereits direkte, abrufbare Links für die `videoUrl` und ganz entscheidend die **`audioUrl`**.

### 2. Processing-Layer (Node.js)

* **Technologie:** Node.js, `axios` oder `fetch`.
* **Funktion:** Das Backend dient nur noch als leichter Orchestrator. Es triggert den Apify Actor und lädt anschließend über die von Apify bereitgestellte `audioUrl` direkt die reine Audiodatei (z.B. MP4-Audio) herunter. Aufwendige Videoverarbeitung (wie `fluent-ffmpeg`) entfällt komplett.

### 3. KI-Layer (Google Gemini 1.5)

* **Technologie:** `@google/generative-ai` SDK (Gemini 1.5 Flash/Pro).
* **Funktion:** Die heruntergeladene Audiodatei wird über die Google AI File API hochgeladen. Die Gemini-Modelle sind von Grund auf multimodal, wodurch eine separate Speech-to-Text-API komplett entfällt.
* **Prompting & Output:** Gemini erhält die Audiodatei plus den Text der Instagram-Beschreibung (`caption`). Über die "Structured Outputs" (JSON Mode) wird Gemini gezwungen, das extrahierte Rezept exakt nach einem vordefinierten Schema (Zutaten, Mengen, Schritte) zurückzugeben.

## 🔄 Workflow im Detail

1. Der Nutzer sendet eine Instagram Reel-URL an den Node.js-Endpunkt.
2. Der Node-Server triggert den Apify Actor und ruft das JSON mit `caption` und `audioUrl` ab.
3. Node.js lädt die Audiodatei über die `audioUrl` temporär herunter.
4. Die Audiodatei und der Text (`caption`) werden in einem Aufruf an Gemini 1.5 gesendet.
5. Gemini verarbeitet beides gleichzeitig und antwortet mit dem fertigen Rezept als strukturiertes JSON.

## 🎯 Mehrwert & Skalierbarkeit

* **Höchste Datenqualität:** Da Gemini Sprache und Text gleichzeitig versteht, werden Unstimmigkeiten (z.B. Creator sagt im Audio "1/2 cup mozzarella", schreibt aber etwas anderes in die Caption) von der KI erkannt und logisch aufgelöst.
* **Serverless Ready:** Da wir keine schwerfälligen Binaries wie FFmpeg mehr benötigen, kann dieses Node.js-Backend problemlos und extrem günstig auf Serverless-Plattformen (wie Vercel, AWS Lambda oder Google Cloud Functions) betrieben werden.
* **Alles aus einer Hand:** Keine Fragmentierung der KI-Dienste. Audio-Verständnis, Text-Extraktion und JSON-Formatierung passieren in einem einzigen Gemini-Call.
