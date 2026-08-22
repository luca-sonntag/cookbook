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
} from './ingredientImageService.js';

export const ingredientImageRouter = express.Router();

// GET /api/dev/ingredients - List canonical ingredients with image status
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

    res.json({
      success: true,
      totalTotal: CANONICAL_INGREDIENTS.length,
      totalGenerated: generatedCount,
      totalFiltered,
      items: paged,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dev/ingredients/:id/image - Serve the webp icon
ingredientImageRouter.get('/api/dev/ingredients/:id/image', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const filename = findExistingIngredientImage(id);
    if (!filename) {
      return res.status(404).send('Image not found');
    }

    const filePath = path.join(getIngredientImagesDir(), filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Image file missing');
    }

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.sendFile(filePath);
  } catch (err: any) {
    res.status(500).send('Error serving image');
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
  <title>Zutaten Icon Studio (FLUX)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #10b981;
      --primary-hover: #059669;
      --accent: #6366f1;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; padding: 24px 20px; }
    
    .container { max-width: 1400px; margin: 0 auto; }
    
    header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; }
    .title-area h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
    .title-area p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
    
    .stats-badge { background: #1e293b; border: 1px solid var(--card-border); padding: 8px 16px; border-radius: 9999px; font-size: 14px; font-weight: 600; }
    .stats-badge span { color: var(--primary); }
    
    .controls { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; background: var(--card-bg); padding: 16px; border-radius: 12px; border: 1px solid var(--card-border); align-items: center; }
    .search-box { flex: 1; min-width: 250px; position: relative; }
    .search-box input { width: 100%; background: #0f172a; border: 1px solid var(--card-border); color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 14px; outline: none; }
    .search-box input:focus { border-color: var(--primary); }
    
    select, button { background: #0f172a; border: 1px solid var(--card-border); color: #fff; padding: 10px 16px; border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.15s; outline: none; }
    select:focus, button:hover { border-color: var(--primary); }
    
    button.btn-primary { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    button.btn-primary:hover { background: var(--primary-hover); }
    button.btn-danger { background: var(--danger); border-color: var(--danger); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    .batch-bar { display: none; background: #1e293b; border: 1px solid var(--primary); border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .batch-bar.active { display: block; }
    .progress-track { width: 100%; height: 8px; background: #0f172a; border-radius: 9999px; overflow: hidden; margin: 12px 0; }
    .progress-fill { height: 100%; width: 0%; background: var(--primary); transition: width 0.3s; }
    .batch-status { font-size: 14px; display: flex; justify-content: space-between; color: var(--text-muted); }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    
    .card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 14px; display: flex; align-items: center; gap: 14px; transition: border-color 0.15s, transform 0.15s; position: relative; }
    .card:hover { border-color: #475569; }
    .card.has-image { border-left: 3px solid var(--primary); }
    .card.generating { border-color: var(--accent); }
    
    .thumbnail { width: 64px; height: 64px; border-radius: 10px; background: #ffffff; border: 1px solid #334155; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
    .thumbnail img { width: 100%; height: 100%; object-fit: contain; }
    .thumbnail .placeholder { color: #94a3b8; font-size: 24px; }
    
    .spinner-overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.85); display: none; align-items: center; justify-content: center; z-index: 2; border-radius: 10px; }
    .card.generating .spinner-overlay { display: flex; }
    
    .spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .info { flex: 1; min-width: 0; }
    .name-de { font-weight: 600; font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .name-en { font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
    
    .meta { display: flex; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
    .category-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 6px; background: #334155; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px; }
    .id-pill { font-size: 10px; color: #64748b; font-family: monospace; }
    
    .actions { flex-shrink: 0; }
    .btn-gen { padding: 8px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; background: #334155; color: #fff; border: 1px solid transparent; }
    .btn-gen:hover { background: var(--primary); border-color: var(--primary); }
    .btn-gen.re-gen { background: transparent; border-color: #475569; color: var(--text-muted); }
    .btn-gen.re-gen:hover { border-color: var(--primary); color: #fff; }

    .toast { position: fixed; bottom: 24px; right: 24px; background: #1e293b; border: 1px solid var(--primary); color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 999; transform: translateY(100px); opacity: 0; transition: all 0.3s; }
    .toast.show { transform: translateY(0); opacity: 1; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="title-area">
        <h1>🥑 Zutaten Icon Studio <span style="font-size: 14px; font-weight: normal; color: var(--text-muted);">(FLUX.1 schnell)</span></h1>
        <p>Erstelle und verwalte freigestellte Zutaten-Icons auf reinweißem Studio-Hintergrund</p>
      </div>
      <div class="stats-badge" id="statsDisplay">
        Generiert: <span id="statCount">0</span> / <span id="statTotal">0</span> (<span id="statPercent">0%</span>)
      </div>
    </header>

    <div class="controls">
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="Suche nach Zutat (z. B. Apfel, Hafer, Barilla, bls_...)" />
      </div>
      <select id="categorySelect">
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
        <option value="all">Alle Einträge</option>
        <option value="false">Nur ohne Icon</option>
        <option value="true">Nur mit Icon</option>
      </select>
      <button class="btn-primary" id="btnBatch">
        ⚡ Batch generieren (<span id="batchTargetCount">0</span>)
      </button>
    </div>

    <div class="batch-bar" id="batchBar">
      <div class="batch-status">
        <strong id="batchTitle">Batch-Generierung läuft...</strong>
        <span id="batchProgressText">0 / 0</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" id="batchProgressFill"></div>
      </div>
      <button class="btn-danger" id="btnCancelBatch" style="padding: 6px 14px; font-size: 12px; margin-top: 4px;">
        Abbrechen
      </button>
    </div>

    <div class="grid" id="ingredientsGrid"></div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    let ingredients = [];
    let isBatchRunning = false;
    let cancelBatchRequested = false;

    const grid = document.getElementById('ingredientsGrid');
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categorySelect');
    const statusSelect = document.getElementById('statusSelect');
    const statCount = document.getElementById('statCount');
    const statTotal = document.getElementById('statTotal');
    const statPercent = document.getElementById('statPercent');
    const btnBatch = document.getElementById('btnBatch');
    const batchTargetCount = document.getElementById('batchTargetCount');
    const batchBar = document.getElementById('batchBar');
    const batchProgressText = document.getElementById('batchProgressText');
    const batchProgressFill = document.getElementById('batchProgressFill');
    const btnCancelBatch = document.getElementById('btnCancelBatch');
    const toast = document.getElementById('toast');

    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3500);
    }

    async function loadData() {
      const q = encodeURIComponent(searchInput.value.trim());
      const cat = encodeURIComponent(categorySelect.value);
      const hasImg = encodeURIComponent(statusSelect.value);
      
      const res = await fetch(\`/api/dev/ingredients?search=\${q}&category=\${cat}&hasImage=\${hasImg}&limit=1000\`);
      const data = await res.json();
      
      if (!data.success) return;

      ingredients = data.items;
      statCount.textContent = data.totalGenerated;
      statTotal.textContent = data.totalTotal;
      const pct = data.totalTotal > 0 ? Math.round((data.totalGenerated / data.totalTotal) * 100) : 0;
      statPercent.textContent = pct + '%';
      
      const missingInView = ingredients.filter(i => !i.hasImage).length;
      batchTargetCount.textContent = missingInView;

      renderGrid();
    }

    function renderGrid() {
      grid.innerHTML = '';
      if (ingredients.length === 0) {
        grid.innerHTML = '<div style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 40px;">Keine Zutaten gefunden.</div>';
        return;
      }

      for (const item of ingredients) {
        const card = document.createElement('div');
        card.className = 'card' + (item.hasImage ? ' has-image' : '');
        card.id = 'card-' + item.id;

        const thumbContent = item.hasImage && item.imageUrl
          ? \`<img src="\${item.imageUrl}" alt="\${item.name_de}" loading="lazy" />\`
          : \`<div class="placeholder">🍽️</div>\`;

        const btnText = item.hasImage ? '🔄 Neu' : '✨ Generieren';
        const btnClass = item.hasImage ? 'btn-gen re-gen' : 'btn-gen';

        card.innerHTML = \`
          <div class="thumbnail">
            <div class="spinner-overlay"><div class="spinner"></div></div>
            <div class="thumb-img-wrapper" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
              \${thumbContent}
            </div>
          </div>
          <div class="info">
            <div class="name-de" title="\${item.name_de}">\${item.name_de}</div>
            <div class="name-en" title="\${item.name_en}">\${item.name_en || '—'}</div>
            <div class="meta">
              <span class="category-badge">\${item.category}</span>
              <span class="id-pill">\${item.id}</span>
            </div>
          </div>
          <div class="actions">
            <button class="\${btnClass}" onclick="generateSingle('\${item.id}')">\${btnText}</button>
          </div>
        \`;

        grid.appendChild(card);
      }
    }

    async function generateSingle(id) {
      const card = document.getElementById('card-' + id);
      if (card) card.classList.add('generating');

      try {
        const res = await fetch(\`/api/dev/ingredients/\${id}/generate\`, { method: 'POST' });
        const data = await res.json();

        if (data.success && data.item) {
          const itemIdx = ingredients.findIndex(i => i.id === id);
          if (itemIdx !== -1) {
            ingredients[itemIdx].hasImage = true;
            ingredients[itemIdx].imageUrl = data.item.imageUrl;
            ingredients[itemIdx].filename = data.item.filename;
          }

          if (card) {
            card.classList.remove('generating');
            card.classList.add('has-image');
            const wrapper = card.querySelector('.thumb-img-wrapper');
            if (wrapper) wrapper.innerHTML = \`<img src="\${data.item.imageUrl}" alt="\${data.item.name_de}" />\`;
            const btn = card.querySelector('.btn-gen');
            if (btn) {
              btn.className = 'btn-gen re-gen';
              btn.textContent = '🔄 Neu';
            }
          }
          showToast(\`🎉 \${data.item.name_de} generiert (\${(data.durationMs / 1000).toFixed(1)}s, \${data.sizeKb} KB)\`);
          statCount.textContent = parseInt(statCount.textContent || 0) + 1;
        } else {
          alert('Fehler: ' + (data.error || 'Generierung fehlgeschlagen'));
        }
      } catch (err) {
        alert('Netzwerkfehler: ' + err.message);
      } finally {
        if (card) card.classList.remove('generating');
      }
    }

    async function startBatch() {
      const targets = ingredients.filter(i => !i.hasImage);
      if (targets.length === 0) {
        alert('Alle aktuell angezeigten Zutaten besitzen bereits ein generiertes Bild.');
        return;
      }

      if (!confirm(\`Möchtest du \${targets.length} Zutaten-Icons via FLUX.1 generieren? (Dauer ca. \${Math.round(targets.length * 3.2)} Sekunden)\`)) {
        return;
      }

      isBatchRunning = true;
      cancelBatchRequested = false;
      batchBar.classList.add('active');
      btnBatch.disabled = true;

      let completed = 0;
      for (const item of targets) {
        if (cancelBatchRequested) break;

        batchProgressText.textContent = \`\${completed + 1} / \${targets.length} (\${item.name_de})\`;
        batchProgressFill.style.width = ((completed / targets.length) * 100) + '%';

        await generateSingle(item.id);
        completed++;
      }

      batchProgressFill.style.width = '100%';
      batchProgressText.textContent = \`Fertig! \${completed} Icons generiert.\`;
      setTimeout(() => {
        batchBar.classList.remove('active');
        btnBatch.disabled = false;
        isBatchRunning = false;
      }, 2000);
    }

    btnCancelBatch.addEventListener('click', () => {
      cancelBatchRequested = true;
    });

    btnBatch.addEventListener('click', startBatch);

    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(loadData, 250);
    });

    categorySelect.addEventListener('change', loadData);
    statusSelect.addEventListener('change', loadData);

    // Initial load
    loadData();
  </script>
</body>
</html>`;
}
