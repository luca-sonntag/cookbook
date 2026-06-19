# Agent Knowledge Guide: Instagram Reel Recipe Extractor

This guide provides critical context, architectural choices, and execution instructions for agents working on this repository to avoid redundant research or compiling errors.

---

## 🏗️ Project Architecture & Workflow

The application is a TypeScript Express.js API designed to run as an asynchronous job queue:

1. **Client Submission:** Client submits a Reel URL to `POST /api/extract-recipe`.
2. **Database Job Creation:** A `pending` job is created in `database.json`.
3. **Scraping (Apify):** The background queue worker picks up the job and calls Apify's `apify/instagram-reel-scraper` actor to scrape the caption and CDN `audioUrl`.
4. **Processing (Gemini):**
   * The worker downloads the audio track directly via Node's native `fetch` API.
   * The audio file is uploaded to the Google AI File API.
   * Gemini 1.5 Flash is invoked with a detailed structured JSON schema to parse and combine both the spoken audio and the written description/caption.
5. **Auto-Cleanup:** The audio file is deleted locally and from the Gemini File API.
6. **Polling:** The client fetches status updates from `GET /api/jobs/:id`.

---

## ⚠️ Important Environment & Workspace Constraints

### 1. Windows Execution & Path Issues

On this system, running scripts via `npx` or `npm run` (e.g., `npx tsx` or `npm run dev`) fails with:
`Das System kann den angegebenen Pfad nicht finden.`

* **Rule for running TS scripts:** Always invoke TS files directly using the local node runner path:
  `node node_modules/tsx/dist/cli.mjs <file.ts>`
* **Rule for building TS:** Run the local TypeScript compiler directly:
  `node node_modules/typescript/bin/tsc`
* **Rule for dependencies installation:** Always add `--ignore-scripts` during installation (`npm install --ignore-scripts`) to bypass native compile script failures during npm postinstalls.

### 2. Database Fallback (JSON Storage)

* **Problem:** SQLite compiler modules (`sqlite3` and `better-sqlite3`) fail to build on this Windows host due to missing native compilation build tools.
* **Solution:** The database uses a custom JSON-file-based storage implementation in `src/db.ts`.
* **Details:** It features serializing in-memory locks and atomic temp-write-and-rename cycles (`database.json`) to prevent race conditions during parallel client-server queries. Do not try to re-install or replace this with SQLite unless native compilation is resolved.

### 3. Gemini SDK Type Casting Workaround

* **Problem:** The installed `@google/generative-ai` SDK (`^0.11.0`) contains TypeScript type declarations for `GenerationConfig` that do not recognize the `responseSchema` property.
* **Solution:** To pass typescript checks successfully, the config object in `getGenerativeModel` must be cast to `any`:

  ```typescript
  const model = genAI.getGenerativeModel({
    model: config.GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: recipeSchema,
    } as any,
  });
  ```

* **Files API:** Import the file manager from the subpath `@google/generative-ai/files`:

  ```typescript
  import { GoogleAIFileManager } from '@google/generative-ai/files';
  ```

---

## 📂 Codebase File Map

* `src/types.ts`: Typings for recipes and job metadata.
* `src/config.ts`: Environment validation.
* `src/db.ts`: Local JSON database.
* `src/apify.ts`: Apify scraper call.
* `src/gemini.ts`: Audio uploading and LLM processing.
* `src/queue.ts`: Background job worker loop.
* `src/routes.ts`: Express routes.
* `src/index.ts`: Server bootstrapper.
* `test-client.ts`: E2E verification client.
