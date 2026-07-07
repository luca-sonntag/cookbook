# 🍳 Instagram Reel Recipe Extractor (Express + TypeScript)

This repository contains a Node.js Express service built with TypeScript to automatically scrape Instagram recipe Reels and extract them into highly detailed structured JSON recipes. 

It uses the **Apify Instagram Reel Scraper** actor to fetch video metadata, descriptions, and audio track URLs without needing complex browser scrapers or being blocked by Instagram. It then downloads the audio track and submits it alongside the caption to **Google Gemini 1.5 Flash** using Structured Outputs (JSON schema) to extract a complete, rich, culinary-correct recipe.

---

## 🛠️ Architecture & Workflow

1. **Client Submission:** Client submits an Instagram Reel URL (`https://www.instagram.com/reel/...`) to the Express API.
2. **Immediate Acknowledgment:** The API creates a background job with `pending` status in a local JSON database and returns a `jobId`.
3. **Background Scraping (Apify):** The worker picks up the job and triggers the Apify scraper to retrieve the post `caption` and `audioUrl`.
4. **Background AI Processing (Gemini):**
   * The server downloads the audio file temporarily.
   * The audio track is uploaded to the Google AI File API.
   * Gemini 1.5 Flash is invoked with the file and caption, structured by a strict JSON schema.
   * Discrepancies between spoken instructions (audio) and descriptions (caption) are resolved.
5. **Auto-Cleanup:** The audio file is deleted from local disk and the Gemini File API.
6. **Result Polling:** The client polls the job endpoint to retrieve status changes and the final JSON recipe structure.

---

## 🚀 Getting Started

### Prerequisites
* Node.js v18 or higher (which includes native `fetch` support).
* An [Apify Account & API Token](https://apify.com/).
* A [Google Gemini API Key](https://aistudio.google.com/).

### Installation

1. Clone the repository and navigate into the project directory:
   ```powershell
   npm install --ignore-scripts
   ```
   *(Using `--ignore-scripts` is recommended on Windows to bypass native compilation script errors for build packages like `esbuild` and SQLite.)*

2. Create a `.env` file from the example:
   ```powershell
   Copy-Item .env.example .env
   ```

3. Open `.env` and configure your API tokens:
   ```env
   PORT=3000
   APIFY_TOKEN=your_real_apify_token
   GEMINI_API_KEY=your_real_gemini_api_key
   DATABASE_PATH=database.json
   GEMINI_MODEL=gemini-1.5-flash
   RECIPE_LANGUAGE=German
   PREFERRED_TEMPERATURE_UNIT=Celsius
   PREFERRED_UNIT_SYSTEM=metric
   ```

---

## 💻 Running the Application

### 1. Start the Express API Server (Dev mode)
Runs the server with hot-reloading:
```powershell
npm run dev
```

---

## 📡 API Reference

### 1. Submit Recipe Extraction Job
* **Endpoint:** `POST /api/extract-recipe`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "url": "https://www.instagram.com/reel/C8C_jApt_2j/"
  }
  ```
* **Response (202 Accepted):**
  ```json
  {
    "success": true,
    "jobId": "q8z46p9u8",
    "status": "pending",
    "message": "Recipe extraction job successfully queued."
  }
  ```

### 2. Get Job Status and Extracted Recipe
* **Endpoint:** `GET /api/jobs/:id`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "job": {
      "id": "q8z46p9u8",
      "url": "https://www.instagram.com/reel/C8C_jApt_2j/",
      "status": "completed",
      "error": null,
      "recipe": {
        "title": "Creamy Tuscan Chicken Pasta",
        "description": "A delicious, easy-to-make pasta recipe with chicken, sun-dried tomatoes, and spinach in a rich garlic cream sauce.",
        "prepTime": "15 mins",
        "cookTime": "20 mins",
        "servings": 4,
        "ingredients": [
          { "name": "chicken breast", "amount": 2, "unit": "pieces", "notes": "sliced" },
          { "name": "penne pasta", "amount": 300, "unit": "g" }
        ],
        "instructions": [
          { "step": 1, "description": "Boil the pasta in salted water until al dente." },
          { "step": 2, "description": "Sear the sliced chicken breast in olive oil until golden brown." }
        ],
        "equipment": ["Large skillet", "Pasta pot", "Chef knife"],
        "nutritionalEstimates": {
          "calories": 620,
          "protein": "42g",
          "carbs": "58g",
          "fat": "24g"
        },
        "tips": [
          "Deglaze the skillet with a splash of white wine before adding cream for extra depth."
        ],
        "alternativeIngredients": [
          { "original": "penne pasta", "substitute": "gluten-free pasta", "notes": "or zucchini noodles" }
        ]
      },
      "createdAt": "2026-06-19T19:35:00.000Z",
      "updatedAt": "2026-06-19T19:36:00.000Z"
    }
  }
  ```
