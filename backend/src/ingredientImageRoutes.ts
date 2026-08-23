import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { CANONICAL_INGREDIENTS } from './data/canonicalIngredients.js';
import {
  findExistingIngredientImage,
  generateIngredientIcon,
  getIngredientImagesDir,
  ensureImageDirExists,
  getIngredientSlug,
  getGenerationCostsSummary,
} from './ingredientImageService.js';

export const ingredientImageRouter = express.Router();

// GET /api/dev/ingredients - List canonical ingredients with image status & cost summary
ingredientImageRouter.get('/api/dev/ingredients', (req: Request, res: Response) => {
  try {
    const imageDir = getIngredientImagesDir();
    ensureImageDirExists(imageDir);
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const category = ((req.query.category as string) || '').trim();
    const hasImageFilter = (req.query.hasImage as string) || 'all'; // 'all' | 'true' | 'false'
    const limit = parseInt(req.query.limit as string, 10) || 500;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    // Cache existing files map for fast O(1) lookup
    const files = fs.existsSync(imageDir) ? fs.readdirSync(imageDir) : [];
    const imageMap = new Map<string, string>();
    for (const f of files) {
      if (f.toLowerCase().endsWith('.webp')) {
        const match = f.match(/^(bls_[a-z0-9]+)/i);
        const id = match ? match[1].toLowerCase() : f.replace(/\.webp$/i, '').toLowerCase();
        imageMap.set(id, f);
      }
    }

    let generatedCount = 0;
    const allEnriched = CANONICAL_INGREDIENTS.map((item) => {
      const filename = imageMap.get(item.id.toLowerCase()) || null;
      const hasImage = !!filename;
      if (hasImage) generatedCount++;

      return {
        id: item.id,
        bls_code: item.bls_code,
        name_de: item.name_de,
        name_en: item.name_en,
        category: item.category,
        slug: getIngredientSlug(item),
        hasImage,
        filename,
        imageUrl: hasImage ? `/api/dev/ingredients/${item.id}/image?v=${encodeURIComponent(filename)}` : null,
      };
    });

    // Apply filtering
    let filtered = allEnriched;

    if (category && category !== 'ALL') {
      filtered = filtered.filter((item) => item.category === category);
    }

    if (hasImageFilter === 'true') {
      filtered = filtered.filter((item) => item.hasImage);
    } else if (hasImageFilter === 'false') {
      filtered = filtered.filter((item) => !item.hasImage);
    }

    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.name_de.toLowerCase().includes(search) ||
          item.name_en.toLowerCase().includes(search) ||
          item.id.toLowerCase().includes(search) ||
          item.bls_code.toLowerCase().includes(search)
      );
    }

    const totalFiltered = filtered.length;
    const paged = limit > 0 ? filtered.slice(offset, offset + limit) : filtered;
    const costsSummary = getGenerationCostsSummary(imageDir);

    res.json({
      success: true,
      totalTotal: CANONICAL_INGREDIENTS.length,
      totalGenerated: generatedCount,
      totalFiltered,
      costs: costsSummary,
      items: paged,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public Ingredient Icons Endpoint: GET /api/ingredient-icons/:filenameOrId
ingredientImageRouter.get(['/api/ingredient-icons/:filename', '/api/dev/ingredients/:id/image'], (req: Request, res: Response) => {
  try {
    const rawParam = req.params.filename || req.params.id || '';
    const cleanId = rawParam.replace(/\.webp$/i, '').toLowerCase().trim();
    const filename = findExistingIngredientImage(cleanId);
    if (!filename) {
      return res.status(404).send('Ingredient icon not found');
    }

    const filePath = path.join(getIngredientImagesDir(), filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Ingredient icon file missing');
    }

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(filePath);
  } catch (err: any) {
    res.status(500).send('Error serving ingredient icon');
  }
});

// Public Category Icons Endpoint: GET /api/category-icons/:filename
ingredientImageRouter.get('/api/category-icons/:filename', (req: Request, res: Response) => {
  try {
    const rawParam = req.params.filename || '';
    const cleanName = rawParam.replace(/\.webp$/i, '').toLowerCase().trim();
    const cwd = process.cwd();
    const baseDir = path.basename(cwd).toLowerCase() === 'backend'
      ? path.resolve(cwd, 'public', 'category-icons')
      : path.resolve(cwd, 'backend', 'public', 'category-icons');

    const filePath = path.join(baseDir, `${cleanName}.webp`);
    if (!fs.existsSync(filePath)) {
      const fallbackPath = path.join(baseDir, 'other.webp');
      if (fs.existsSync(fallbackPath)) {
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        return res.sendFile(fallbackPath);
      }
      return res.status(404).send('Category icon not found');
    }

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(filePath);
  } catch (err: any) {
    res.status(500).send('Error serving category icon');
  }
});

// POST /api/dev/ingredients/:id/generate - Generate or re-generate an icon
ingredientImageRouter.post('/api/dev/ingredients/:id/generate', async (req: Request, res: Response) => {
  try {
    const id = req.params.id.toLowerCase().trim();
    const item = CANONICAL_INGREDIENTS.find(
      (ing) => ing.id.toLowerCase() === id || ing.bls_code.toLowerCase() === id
    );

    if (!item) {
      return res.status(404).json({ success: false, error: `Ingredient ${id} not found` });
    }

    const result = await generateIngredientIcon(item);
    const costsSummary = getGenerationCostsSummary(getIngredientImagesDir());

    res.json({
      success: true,
      item: {
        id: item.id,
        name_de: item.name_de,
        name_en: item.name_en,
        category: item.category,
        filename: result.filename,
        imageUrl: `/api/dev/ingredients/${item.id}/image?v=${Date.now()}`,
        hasImage: true,
      },
      costs: result.costs,
      costsSummary,
      durationMs: result.durationMs,
      sizeKb: result.sizeKb,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Generation failed' });
  }
});

// GET /dev/ingredients or /ingredients-viewer - Standalone HTML One-Pager
ingredientImageRouter.get(['/dev/ingredients', '/ingredients-viewer'], (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderIngredientViewerHtml());
});

function renderIngredientViewerHtml(): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ingredient Icon Studio (Dev)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --panel-bg: #0f172a;
      --card-bg: #131d31;
      --card-selected: #172640;
      --border: #1e293b;
      --border-focus: #10b981;
      --text: #f1f5f9;
      --text-muted: #64748b;
      --text-sub: #94a3b8;
      --primary: #10b981;
      --primary-hover: #059669;
      --accent: #6366f1;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif; }
    body { background: var(--bg); color: var(--text); height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

    /* Minimal Top Dev Bar */
    header {
      height: 52px;
      background: var(--panel-bg);
      border-bottom: 1px solid var(--border);
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      gap: 12px;
    }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .logo { font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; letter-spacing: -0.3px; }
    .dev-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; background: #1e293b; color: #94a3b8; padding: 2px 6px; border-radius: 4px; border: 1px solid #334155; font-family: 'JetBrains Mono', monospace; }
    
    .header-right { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .pill-stat { background: #131d31; border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px; font-weight: 500; color: var(--text-sub); }
    .pill-stat span { color: var(--primary); font-weight: 700; }
    .pill-cost { background: #131d31; border: 1px solid #312e81; padding: 4px 10px; border-radius: 6px; font-weight: 500; color: #a5b4fc; }
    .pill-cost span { color: #818cf8; font-weight: 700; }

    /* Split Main Container - EXACT 50 / 50 Split */
    .split-layout {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 0;
      overflow: hidden;
    }
    @media (max-width: 900px) {
      .split-layout { grid-template-columns: 1fr; }
      .right-pane { display: none; }
    }

    /* Left Pane: Controls & Master Grid */
    .left-pane {
      display: flex;
      flex-direction: column;
      background: var(--panel-bg);
      border-right: 1px solid var(--border);
      min-height: 0;
      overflow: hidden;
    }

    .filter-bar {
      padding: 12px;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: var(--panel-bg);
      flex-shrink: 0;
    }
    .search-input {
      width: 100%;
      background: #090d16;
      border: 1px solid var(--border);
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s;
    }
    .search-input:focus { border-color: var(--border-focus); }

    .filter-row { display: flex; gap: 6px; }
    select, button {
      background: #090d16;
      border: 1px solid var(--border);
      color: var(--text-sub);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      outline: none;
      transition: all 0.15s;
    }
    select:focus, button:hover { border-color: var(--border-focus); color: #fff; }
    
    .btn-batch {
      background: var(--primary);
      border-color: var(--primary);
      color: #000;
      font-weight: 700;
      margin-left: auto;
      white-space: nowrap;
    }
    .btn-batch:hover { background: var(--primary-hover); }
    .btn-danger { background: var(--danger); border-color: var(--danger); color: #fff; }

    .batch-progress {
      display: none;
      padding: 10px 12px;
      background: #172640;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .batch-progress.active { display: block; }
    .progress-bar-track { width: 100%; height: 6px; background: #090d16; border-radius: 999px; overflow: hidden; margin: 6px 0; }
    .progress-bar-fill { width: 0%; height: 100%; background: var(--primary); transition: width 0.2s; }

    /* Scrollable Ingredient Grid */
    .list-container {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      grid-auto-rows: max-content;
      gap: 8px;
      align-content: start;
    }

    .grid-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.1s;
      position: relative;
      min-width: 0;
    }
    .grid-card:hover { background: #172640; border-color: #334155; }
    .grid-card.selected { background: var(--card-selected); border-color: var(--primary); }
    .grid-card.generating { border-color: var(--accent); }

    .row-thumb {
      width: 44px;
      height: 44px;
      border-radius: 6px;
      background: #ffffff;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      border: 1px solid #334155;
    }
    .row-thumb img { width: 100%; height: 100%; object-fit: contain; }
    .row-thumb .placeholder-emoji { font-size: 20px; }

    .spinner-overlay {
      position: absolute;
      inset: 0;
      background: rgba(9, 13, 22, 0.85);
      display: none;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
    }
    .grid-card.generating .spinner-overlay { display: flex; }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.2);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .row-info { flex: 1; min-width: 0; }
    .row-name-de { font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row-name-en { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
    .row-meta { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: 10px; }
    .cat-pill { color: #94a3b8; background: #090d16; padding: 1px 5px; border-radius: 4px; font-size: 9px; text-transform: uppercase; max-width: 85px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .id-text { color: #475569; font-family: 'JetBrains Mono', monospace; font-size: 9px; }

    .row-btn {
      padding: 6px 8px;
      font-size: 11px;
      border-radius: 5px;
      background: #1e293b;
      color: #94a3b8;
      border: 1px solid transparent;
      flex-shrink: 0;
    }
    .row-btn:hover { background: var(--primary); color: #000; font-weight: 600; }
    .row-btn.has-img { background: transparent; border-color: #334155; }
    .row-btn.has-img:hover { border-color: var(--primary); color: #fff; }

    /* Right Pane: Fullscreen Inspection View */
    .right-pane {
      background: var(--bg);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow-y: auto;
      padding: 24px 32px;
      align-items: center;
      justify-content: flex-start;
    }

    .detail-card {
      width: 100%;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }
    .detail-title h2 { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
    .detail-title p { font-size: 13px; color: var(--text-sub); margin-top: 2px; }
    .detail-tags { display: flex; gap: 6px; margin-top: 8px; }
    .tag-badge { background: #1e293b; color: #cbd5e1; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 5px; }
    .tag-id { background: #0f172a; color: #64748b; font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 2px 8px; border-radius: 5px; border: 1px solid #1e293b; }

    /* Big Image Container - Pure Square without extra borders/padding */
    .big-preview-wrapper {
      width: 100%;
      aspect-ratio: 1/1;
      max-width: 512px;
      max-height: 512px;
      margin: 0 auto;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: zoom-in;
    }
    .big-preview-wrapper img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .big-placeholder { text-align: center; color: #64748b; padding: 40px 0; }
    .big-placeholder .big-emoji { font-size: 64px; margin-bottom: 8px; }
    .big-placeholder p { font-size: 14px; color: #94a3b8; }

    .detail-actions {
      display: flex;
      gap: 10px;
    }
    .btn-action-primary {
      flex: 1;
      background: var(--primary);
      border-color: var(--primary);
      color: #000;
      font-weight: 700;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-action-primary:hover { background: var(--primary-hover); }
    .btn-action-secondary {
      background: #1e293b;
      border: 1px solid #334155;
      color: #cbd5e1;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
    }
    .btn-action-secondary:hover { border-color: #475569; color: #fff; }

    .meta-box {
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .meta-box-row { display: flex; justify-content: space-between; gap: 10px; color: var(--text-sub); }
    .meta-box-row strong { color: #fff; font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 11px; }

    /* Lightbox Modal */
    .lightbox-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(9, 13, 22, 0.95);
      backdrop-filter: blur(8px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      cursor: zoom-out;
    }
    .lightbox-modal.active { display: flex; }
    .lightbox-content {
      width: 90vmin;
      height: 90vmin;
      max-width: 680px;
      max-height: 680px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .lightbox-content img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .lightbox-close {
      position: absolute;
      top: -40px;
      right: 0;
      background: rgba(15, 23, 42, 0.9);
      color: #fff;
      border: 1px solid #334155;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    }

    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1e293b;
      border: 1px solid var(--primary);
      color: #fff;
      padding: 10px 18px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      z-index: 999;
      transform: translateY(80px);
      opacity: 0;
      transition: all 0.25s;
    }
    .toast.show { transform: translateY(0); opacity: 1; }
  </style>
</head>
<body>
  <!-- Header -->
  <header>
    <div class="header-left">
      <div class="logo">🥑 Icon Studio</div>
      <span class="dev-tag">dev</span>
      <div style="display: flex; gap: 8px; font-size: 11px; color: var(--text-muted); margin-left: 12px;">
        <span><kbd style="background: #131d31; padding: 2px 5px; border-radius: 4px; color: #cbd5e1; border: 1px solid #1e293b;">↓/→</kbd> Nächstes</span>
        <span><kbd style="background: #131d31; padding: 2px 5px; border-radius: 4px; color: #cbd5e1; border: 1px solid #1e293b;">↑/←</kbd> Vorheriges</span>
        <span><kbd style="background: #131d31; padding: 2px 5px; border-radius: 4px; color: #cbd5e1; border: 1px solid #1e293b;">Enter</kbd> Generieren</span>
        <span><kbd style="background: #131d31; padding: 2px 5px; border-radius: 4px; color: #cbd5e1; border: 1px solid #1e293b;">F</kbd> Vollbild</span>
      </div>
    </div>
    <div class="header-right">
      <div class="pill-stat">Icons: <span id="statCount">0</span> / <span id="statTotal">0</span> (<span id="statPercent">0%</span>)</div>
      <div class="pill-cost">💰 <span id="costTotal">$0.00</span> <span id="costEur">(~0.00 €)</span></div>
    </div>
  </header>

  <!-- Split Screen View -->
  <div class="split-layout">
    <!-- Left Pane -->
    <div class="left-pane">
      <div class="filter-bar">
        <input type="text" id="searchInput" class="search-input" placeholder="Zutat suchen (z. B. Apfel, Hafer, bls_...)" />
        <div class="filter-row">
          <select id="categorySelect" style="flex: 1;">
            <option value="ALL">Alle Kategorien</option>
            <option value="FRUITS_VEGETABLES">Obst & Gemüse</option>
            <option value="GRAINS_PASTA">Getreide & Pasta</option>
            <option value="DAIRY">Milch & Käse</option>
            <option value="MEAT_FISH">Fleisch & Fisch</option>
            <option value="SPICES_OILS">Gewürze & Öle</option>
            <option value="BREAD_BAKERY">Brot & Backwaren</option>
            <option value="BAKING_COOKING">Backen & Kochen</option>
            <option value="SWEETS_SNACKS">Süßes & Snacks</option>
            <option value="CANNED_PRESERVED">Konserven & Gläser</option>
            <option value="BEVERAGES">Getränke</option>
            <option value="FROZEN">Tiefkühl</option>
            <option value="READY_MEALS">Fertiggerichte</option>
          </select>
          <select id="statusSelect">
            <option value="all">Alle</option>
            <option value="false">Fehlend</option>
            <option value="true">Vorhanden</option>
          </select>
          <select id="concurrencySelect" title="Parallelität">
            <option value="10">⚡ 10x</option>
            <option value="5" selected>⚡ 5x</option>
            <option value="3">⚡ 3x</option>
            <option value="1">1x</option>
          </select>
          <button class="btn-batch" id="btnBatch">
            ⚡ Batch (<span id="batchTargetCount">0</span>)
          </button>
        </div>
      </div>

      <div class="batch-progress" id="batchBar">
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-sub);">
          <strong id="batchTitle">Batch läuft...</strong>
          <span id="batchProgressText">0 / 0</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" id="batchProgressFill"></div>
        </div>
        <button class="btn-danger" id="btnCancelBatch" style="padding: 4px 10px; font-size: 11px; margin-top: 2px;">
          Abbrechen
        </button>
      </div>

      <div class="list-container" id="ingredientsList"></div>
    </div>

    <!-- Right Pane: Fullscreen Inspection View -->
    <div class="right-pane" id="rightPane">
      <div class="detail-card" id="detailContainer">
        <div style="color: var(--text-muted); text-align: center; margin-top: 80px;">
          Wähle eine Zutat aus der linken Liste aus
        </div>
      </div>
    </div>
  </div>

  <!-- Lightbox Modal for Fullscreen View -->
  <div class="lightbox-modal" id="lightboxModal" onclick="closeLightbox()">
    <div class="lightbox-content" onclick="event.stopPropagation()">
      <button class="lightbox-close" onclick="closeLightbox()">✕ Schließen (ESC)</button>
      <img id="lightboxImg" src="" alt="Vollbild Vorschau" />
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    let ingredients = [];
    let selectedItem = null;
    let isBatchRunning = false;
    let cancelBatchRequested = false;

    const list = document.getElementById('ingredientsList');
    const rightPane = document.getElementById('rightPane');
    const detailContainer = document.getElementById('detailContainer');
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categorySelect');
    const statusSelect = document.getElementById('statusSelect');
    const concurrencySelect = document.getElementById('concurrencySelect');
    const statCount = document.getElementById('statCount');
    const statTotal = document.getElementById('statTotal');
    const statPercent = document.getElementById('statPercent');
    const costTotal = document.getElementById('costTotal');
    const costEur = document.getElementById('costEur');
    const btnBatch = document.getElementById('btnBatch');
    const batchTargetCount = document.getElementById('batchTargetCount');
    const batchBar = document.getElementById('batchBar');
    const batchTitle = document.getElementById('batchTitle');
    const batchProgressText = document.getElementById('batchProgressText');
    const batchProgressFill = document.getElementById('batchProgressFill');
    const btnCancelBatch = document.getElementById('btnCancelBatch');
    const toast = document.getElementById('toast');
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');

    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function updateCostsDisplay(costs) {
      if (!costs) return;
      costTotal.textContent = '$' + (costs.totalCostUsd || 0).toFixed(4);
      costEur.textContent = '(~' + (costs.approxEur || 0).toFixed(2) + ' €)';
    }

    function openLightbox(url) {
      if (!url) return;
      lightboxImg.src = url;
      lightboxModal.classList.add('active');
    }

    function closeLightbox() {
      lightboxModal.classList.remove('active');
    }

    function toggleLightbox() {
      if (lightboxModal.classList.contains('active')) {
        closeLightbox();
      } else if (selectedItem && selectedItem.hasImage && selectedItem.imageUrl) {
        openLightbox(selectedItem.imageUrl);
      }
    }

    function selectNext() {
      if (ingredients.length === 0) return;
      if (!selectedItem) {
        selectItem(ingredients[0]);
        return;
      }
      const idx = ingredients.findIndex(i => i.id === selectedItem.id);
      if (idx !== -1 && idx < ingredients.length - 1) {
        selectItem(ingredients[idx + 1]);
        scrollSelectedIntoView();
      }
    }

    function selectPrev() {
      if (ingredients.length === 0) return;
      if (!selectedItem) {
        selectItem(ingredients[0]);
        return;
      }
      const idx = ingredients.findIndex(i => i.id === selectedItem.id);
      if (idx > 0) {
        selectItem(ingredients[idx - 1]);
        scrollSelectedIntoView();
      }
    }

    function scrollSelectedIntoView() {
      if (!selectedItem) return;
      const card = document.getElementById('row-' + selectedItem.id);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    window.addEventListener('keydown', (e) => {
      const isInput = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA');

      if (e.key === 'Escape') {
        if (lightboxModal.classList.contains('active')) {
          closeLightbox();
        } else if (isInput) {
          e.target.blur();
        }
        return;
      }

      // If user is currently typing in the search input
      if (isInput) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          e.target.blur();
          selectNext();
          e.preventDefault();
        }
        return;
      }

      // Arrow Down / Arrow Right / J -> Next
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        selectNext();
      }
      // Arrow Up / Arrow Left / K -> Previous
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        selectPrev();
      }
      // Enter / Space / G / R -> Generate / Regenerate
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'g' || e.key === 'G' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (selectedItem) {
          generateSingle(selectedItem.id);
        }
      }
      // F / V -> Fullscreen Preview Lightbox
      else if (e.key === 'f' || e.key === 'F' || e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        toggleLightbox();
      }
      // / -> Focus Search Input
      else if (e.key === '/') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });

    async function loadData() {
      const q = encodeURIComponent(searchInput.value.trim());
      const cat = encodeURIComponent(categorySelect.value);
      const hasImg = encodeURIComponent(statusSelect.value);
      
      const res = await fetch('/api/dev/ingredients?search=' + q + '&category=' + cat + '&hasImage=' + hasImg + '&limit=1500');
      const data = await res.json();
      
      if (!data.success) return;

      ingredients = data.items;
      statCount.textContent = data.totalGenerated;
      statTotal.textContent = data.totalTotal;
      const pct = data.totalTotal > 0 ? Math.round((data.totalGenerated / data.totalTotal) * 100) : 0;
      statPercent.textContent = pct + '%';
      
      const missingInView = ingredients.filter(i => !i.hasImage).length;
      batchTargetCount.textContent = missingInView;

      if (data.costs) {
        updateCostsDisplay(data.costs);
      }

      renderList();

      // Keep current selection or select first item
      if (selectedItem) {
        const found = ingredients.find(i => i.id === selectedItem.id);
        selectItem(found || ingredients[0] || null);
      } else if (ingredients.length > 0) {
        selectItem(ingredients[0]);
      }
    }

    function renderList() {
      list.innerHTML = '';
      if (ingredients.length === 0) {
        list.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 40px; font-size: 13px; grid-column: 1 / -1;">Keine Zutaten gefunden.</div>';
        return;
      }

      for (const item of ingredients) {
        const row = document.createElement('div');
        const isSelected = selectedItem && selectedItem.id === item.id;
        row.className = 'grid-card' + (isSelected ? ' selected' : '');
        row.id = 'row-' + item.id;
        row.onclick = () => selectItem(item);

        const thumbImg = item.hasImage && item.imageUrl
          ? '<img src="' + item.imageUrl + '" alt="' + item.name_de + '" loading="lazy" />'
          : '<div class="placeholder-emoji">🍽️</div>';

        const btnText = item.hasImage ? '🔄' : '✨';
        const btnClass = item.hasImage ? 'row-btn has-img' : 'row-btn';

        row.innerHTML = 
          '<div class="row-thumb">' +
            '<div class="spinner-overlay"><div class="spinner"></div></div>' +
            '<div class="thumb-img-wrapper" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">' +
              thumbImg +
            '</div>' +
          '</div>' +
          '<div class="row-info">' +
            '<div class="row-name-de" title="' + item.name_de + '">' + item.name_de + '</div>' +
            '<div class="row-name-en" title="' + (item.name_en || '') + '">' + (item.name_en || '—') + '</div>' +
            '<div class="row-meta">' +
              '<span class="cat-pill">' + item.category + '</span>' +
              '<span class="id-text">' + item.id + '</span>' +
            '</div>' +
          '</div>' +
          '<button class="' + btnClass + '" onclick="event.stopPropagation(); generateSingle(\\'' + item.id + '\\')">' + btnText + '</button>';

        list.appendChild(row);
      }
    }

    function selectItem(item) {
      if (!item) {
        detailContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; margin-top: 80px;">Keine Zutat ausgewählt</div>';
        return;
      }

      selectedItem = item;

      // Update active highlight in left grid
      document.querySelectorAll('.grid-card').forEach(r => r.classList.remove('selected'));
      const activeRow = document.getElementById('row-' + item.id);
      if (activeRow) activeRow.classList.add('selected');

      renderDetailView();
    }

    function renderDetailView() {
      const item = selectedItem;
      if (!item) return;

      const hasImg = item.hasImage && item.imageUrl;
      const previewContent = hasImg
        ? '<img src="' + item.imageUrl + '" alt="' + item.name_de + '" id="detailImagePreview" />'
        : '<div class="big-placeholder"><div class="big-emoji">🍽️</div><p>Noch kein Bild generiert</p></div>';

      const publicUrl = '/api/ingredient-icons/' + item.id + '.webp';

      detailContainer.innerHTML = 
        '<div class="detail-header">' +
          '<div class="detail-title">' +
            '<h2>' + item.name_de + '</h2>' +
            '<p>' + (item.name_en || 'Kein englischer Name') + '</p>' +
            '<div class="detail-tags">' +
              '<span class="tag-badge">' + item.category + '</span>' +
              '<span class="tag-id">' + item.id + '</span>' +
            '</div>' +
          '</div>' +
          '<button class="btn-action-primary" style="flex:0; padding:8px 14px; white-space:nowrap;" id="btnDetailGen" onclick="generateSingle(\\'' + item.id + '\\')">' +
            (hasImg ? '🔄 Neu generieren' : '✨ Icon generieren') +
          '</button>' +
        '</div>' +
        '<div class="big-preview-wrapper" onclick="' + (hasImg ? 'openLightbox(\\'' + item.imageUrl + '\\')' : 'generateSingle(\\'' + item.id + '\\')') + '">' +
          previewContent +
        '</div>' +
        '<div class="detail-actions">' +
          '<button class="btn-action-secondary" style="flex:1;" onclick="copyToClipboard(\\'' + publicUrl + '\\')">📋 URL kopieren</button>' +
          (hasImg ? '<button class="btn-action-secondary" style="flex:1;" onclick="openLightbox(\\'' + item.imageUrl + '\\')">🔍 Vollbild</button>' : '') +
        '</div>' +
        '<div class="meta-box">' +
          '<div class="meta-box-row"><span>Öffentliche API:</span><strong>' + publicUrl + '</strong></div>' +
          '<div class="meta-box-row"><span>Format & Auflösung:</span><strong>512 × 512 px (WebP)</strong></div>' +
          '<div class="meta-box-row"><span>Freisteller:</span><strong>Pure Solid White Margin</strong></div>' +
        '</div>';
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(window.location.origin + text);
      showToast('📋 In Zwischenablage kopiert!');
    }

    async function generateSingle(id) {
      const row = document.getElementById('row-' + id);
      if (row) row.classList.add('generating');

      const detailBtn = document.getElementById('btnDetailGen');
      if (detailBtn && selectedItem && selectedItem.id === id) {
        detailBtn.disabled = true;
        detailBtn.textContent = '⏳ Generiere...';
      }

      try {
        const res = await fetch('/api/dev/ingredients/' + id + '/generate', { method: 'POST' });
        const data = await res.json();

        if (data.success && data.item) {
          const itemIdx = ingredients.findIndex(i => i.id === id);
          if (itemIdx !== -1) {
            ingredients[itemIdx].hasImage = true;
            ingredients[itemIdx].imageUrl = data.item.imageUrl;
            ingredients[itemIdx].filename = data.item.filename;
          }

          if (selectedItem && selectedItem.id === id) {
            selectedItem.hasImage = true;
            selectedItem.imageUrl = data.item.imageUrl;
            selectedItem.filename = data.item.filename;
            renderDetailView();
          }

          if (row) {
            row.classList.remove('generating');
            const wrapper = row.querySelector('.thumb-img-wrapper');
            if (wrapper) wrapper.innerHTML = '<img src="' + data.item.imageUrl + '" alt="' + data.item.name_de + '" />';
            const btn = row.querySelector('.row-btn');
            if (btn) {
              btn.className = 'row-btn has-img';
              btn.textContent = '🔄';
            }
          }

          const costStr = data.costs?.totalCostUsd ? ' | $' + data.costs.totalCostUsd.toFixed(5) : '';
          showToast('🎉 ' + data.item.name_de + ' generiert (' + (data.durationMs / 1000).toFixed(1) + 's' + costStr + ')');
          statCount.textContent = parseInt(statCount.textContent || 0) + 1;

          if (data.costsSummary) {
            updateCostsDisplay(data.costsSummary);
          }
        }
      } catch (err) {
        console.error('Generierungsfehler:', err);
      } finally {
        if (row) row.classList.remove('generating');
        if (detailBtn) detailBtn.disabled = false;
      }
    }

    async function startBatch() {
      const targets = ingredients.filter(i => !i.hasImage);
      if (targets.length === 0) {
        alert('Alle aktuell gefilterten Zutaten besitzen bereits ein Bild.');
        return;
      }

      const concurrency = parseInt(concurrencySelect.value, 10) || 5;
      if (!confirm('Möchtest du ' + targets.length + ' Zutaten-Icons generieren? (' + concurrency + ' parallel)')) {
        return;
      }

      isBatchRunning = true;
      cancelBatchRequested = false;
      batchBar.classList.add('active');
      batchTitle.textContent = 'Batch läuft...';
      btnCancelBatch.disabled = false;
      btnCancelBatch.textContent = 'Abbrechen';
      
      btnBatch.className = 'btn-danger';
      btnBatch.textContent = '🛑 Stop';

      let queueIndex = 0;
      let completed = 0;
      let runningCount = 0;

      function updateProgress() {
        if (cancelBatchRequested) {
          batchProgressText.textContent = 'Beenden... (' + runningCount + ' aktiv)';
        } else {
          batchProgressText.textContent = completed + ' / ' + targets.length + ' (' + runningCount + ' aktiv)';
        }
        batchProgressFill.style.width = ((completed / targets.length) * 100) + '%';
      }

      async function worker() {
        while (queueIndex < targets.length && !cancelBatchRequested) {
          const item = targets[queueIndex++];
          if (!item) break;
          runningCount++;
          updateProgress();
          try {
            await generateSingle(item.id);
          } catch (e) {
            console.error('Batch error for ' + item.id, e);
          } finally {
            runningCount--;
            completed++;
            updateProgress();
          }
        }
      }

      const workers = Array.from({ length: Math.min(concurrency, targets.length) }, () => worker());
      await Promise.all(workers);

      batchProgressFill.style.width = '100%';
      batchProgressText.textContent = cancelBatchRequested
        ? 'Abgebrochen (' + completed + ' fertig)'
        : 'Fertig (' + completed + ' fertig)';

      setTimeout(() => {
        batchBar.classList.remove('active');
        btnBatch.className = 'btn-batch';
        isBatchRunning = false;
        loadData();
      }, 1200);
    }

    function requestCancelBatch() {
      if (!isBatchRunning) return;
      cancelBatchRequested = true;
      btnCancelBatch.disabled = true;
      btnCancelBatch.textContent = 'Beenden...';
      btnBatch.textContent = 'Beenden...';
    }

    btnCancelBatch.addEventListener('click', requestCancelBatch);
    btnBatch.addEventListener('click', () => {
      if (isBatchRunning) requestCancelBatch();
      else startBatch();
    });

    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(loadData, 200);
    });

    categorySelect.addEventListener('change', loadData);
    statusSelect.addEventListener('change', loadData);

    // Initial load
    loadData();
  </script>
</body>
</html>`;
}
