"use strict";
/* ===== TILEMAP MODULE ===== */
const TM = (() => {
  let active = false;     /* TileMap mode on/off */
  let paintMode = false;  /* tile painting on/off */
  let findMode = false;   /* find tile on click */
  let tiles = [];         /* tile library: [{ id, name, canvas, ctx }] */
  let map = null;         /* 2D array [row][col] = tileId or -1 */
  let selectedTile = -1;  /* index in tiles[] */
  let tileW = 8, tileH = 8;
  let nextId = 1;
  let _dirty = false;
  let _dragPanel = false, _dpX = 0, _dpY = 0;

  const panel = () => document.getElementById('tmp');
  const lib = () => document.getElementById('tm_lib');
  const info = () => document.getElementById('tm_info');

  /* ===== Helpers ===== */
  function _mapCols() { return Math.ceil(C.W / tileW); }
  function _mapRows() { return Math.ceil(C.H / tileH); }

  function _initMap() {
    const rows = _mapRows(), cols = _mapCols();
    map = [];
    for (let r = 0; r < rows; r++) {
      map[r] = [];
      for (let c = 0; c < cols; c++) map[r][c] = -1;
    }
  }

  function _tileById(id) {
    return tiles.find(t => t.id === id) || null;
  }


  /* ===== UI ===== */
  function _updateLib() {
    const el = lib(); if (!el) return;
    el.innerHTML = '';
    const sz = Math.max(tileW, tileH, 24);
    tiles.forEach((t, i) => {
      const wrap = document.createElement('div');
      wrap.style.cssText = `width:${sz + 4}px;height:${sz + 16}px;display:flex;flex-direction:column;align-items:center;cursor:pointer;border:2px solid ${i === selectedTile ? 'var(--acc)' : 'transparent'};border-radius:3px;padding:1px`;
      wrap.title = t.name;
      const cv = document.createElement('canvas');
      cv.width = sz; cv.height = sz;
      cv.style.cssText = `image-rendering:pixelated;width:${sz}px;height:${sz}px;background:var(--bg0)`;
      const cx = cv.getContext('2d');
      cx.imageSmoothingEnabled = false;
      cx.drawImage(t.canvas, 0, 0, tileW, tileH, 0, 0, sz, sz);
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size:7px;color:var(--txd);overflow:hidden;text-overflow:ellipsis;width:100%;text-align:center';
      lbl.textContent = t.name;
      wrap.append(cv, lbl);
      wrap.onclick = () => { selectedTile = i; _updateLib(); };
      wrap.ondblclick = () => editTile();
      el.append(wrap);
    });
    const infoEl = info();
    if (infoEl) infoEl.textContent = tiles.length + ' tile' + (tiles.length !== 1 ? 's' : '') +
      (paintMode ? ' · 🖌 PAINT MODE' : '');
  }

  function _updateModeLabel() {
    const lbl = document.getElementById('tm_mode_lbl');
    if (lbl) lbl.textContent = active
      ? (findMode ? 'FIND' : paintMode ? 'PAINT' : 'ON')
      : 'OFF';
    const btn = document.getElementById('tm_paint_btn');
    if (btn) {
      if (paintMode) {
        btn.style.borderColor = '#dc2626';
        btn.style.background = 'rgba(220,38,38,.15)';
        btn.style.color = '#dc2626';
      } else {
        btn.style.borderColor = 'var(--bd)';
        btn.style.background = 'var(--bg3)';
        btn.style.color = 'var(--tx)';
      }
    }
    const fbtn = document.getElementById('tm_find_btn');
    if (fbtn) fbtn.style.borderColor = findMode ? 'var(--acc)' : 'var(--bd)';
  }

  /* ===== Open / Close ===== */
  function open() {
    tileW = Math.max(1, C.gsz);
    tileH = Math.max(1, C.gszH);
    if (!map) _initMap();
    active = true;
    panel().style.display = '';
    _updateModeLabel();
    _updateLib();
  }

  function close() {
    if (!active) { panel().style.display = 'none'; return; }
    if (_dirty) {
      U.sMo(`<h3>Close TileMap</h3>
<p style="font-size:10px;color:var(--txd);margin-bottom:8px">Choose how to exit TileMap Mode:</p>
<div class="mb" style="flex-wrap:wrap;gap:4px">
  <button class="bp" onclick="TM._exitKeep()">Keep as TileMap</button>
  <button class="bp" onclick="TM._exitBake()">Bake to Pixels</button>
  <button class="bsc" onclick="TM._exitDiscard()">Discard</button>
  <button class="bsc" onclick="U.cMo()">Cancel</button>
</div>`);
      return;
    }
    _exitKeep();
  }

  function _exitKeep() {
    active = false; paintMode = false;
    panel().style.display = 'none';
    _updateModeLabel();
    U.cMo();
  }

  function _exitBake() {
    if (!confirm('Bake tiles to pixels? This breaks live tile references.')) return;
    _bakeToCanvas();
    active = false; paintMode = false; _dirty = false;
    tiles = []; map = null; selectedTile = -1;
    panel().style.display = 'none';
    _updateModeLabel();
    U.cMo();
    C.render(); Ly.ui();
  }

  function _exitDiscard() {
    active = false; paintMode = false; _dirty = false;
    panel().style.display = 'none';
    _updateModeLabel();
    U.cMo();
  }

  function _bakeToCanvas() {
    if (!map || !tiles.length) return;
    const la = T.activeLayer(); if (!la) return;
    Hi.push();
    const rows = map.length, cols = map[0] ? map[0].length : 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tid = map[r][c];
        if (tid < 0) continue;
        const t = _tileById(tid);
        if (!t) continue;
        la.ctx.drawImage(t.canvas, c * tileW, r * tileH);
      }
    }
    C.render(); Ly.ui();
  }

  /* ===== Tile Management ===== */
  function addTile() {
    if (!active) { open(); }
    const cv = document.createElement('canvas');
    cv.width = tileW; cv.height = tileH;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    const t = { id: nextId++, name: 'Tile ' + tiles.length, canvas: cv, ctx };
    tiles.push(t);
    selectedTile = tiles.length - 1;
    _dirty = true;
    _updateLib();
  }

  function removeTile() {
    if (selectedTile < 0 || selectedTile >= tiles.length) {
      alert('Select a tile first.');
      return;
    }
    const t = tiles[selectedTile];

    /* Count how many times this tile is placed on the canvas */
    let usageCount = 0;
    if (map) {
      for (let r = 0; r < map.length; r++)
        for (let c = 0; c < map[r].length; c++)
          if (map[r][c] === t.id) usageCount++;
    }

    U.sMo(`<h3>Remove Tile</h3>
<p style="font-size:10px;color:var(--tx);margin-bottom:8px">
  Remove <b>${t.name}</b> from the tile library?
</p>
${usageCount > 0 ? `
<p style="font-size:9px;color:var(--acc);margin-bottom:6px">
  This tile is placed <b>${usageCount}</b> time${usageCount !== 1 ? 's' : ''} on the canvas.
</p>
<label style="justify-content:flex-start;gap:8px">
  <input type="checkbox" id="tm_rm_clear" checked>
  Also clear placed instances from canvas
</label>
` : `
<p style="font-size:9px;color:var(--txd);margin-bottom:6px">
  This tile is not placed on the canvas.
</p>
`}
<div class="mb">
  <button class="bsc" onclick="U.cMo()">Cancel</button>
  <button class="bp" id="tm_rm_ok">Remove</button>
</div>`);

    document.getElementById('tm_rm_ok').onclick = () => {
      const clearEl = document.getElementById('tm_rm_clear');
      const clearInstances = clearEl ? clearEl.checked : false;

      if (clearInstances && map) {
        const la = T.activeLayer();
        Hi.push();
        for (let r = 0; r < map.length; r++) {
          for (let c = 0; c < map[r].length; c++) {
            if (map[r][c] === t.id) {
              map[r][c] = -1;
              /* Also clear the actual pixels from the canvas */
              if (la) la.ctx.clearRect(c * tileW, r * tileH, tileW, tileH);
            }
          }
        }
      }

      tiles.splice(selectedTile, 1);
      selectedTile = Math.min(selectedTile, tiles.length - 1);
      _dirty = true;
      U.cMo();
      _updateLib();
      C.render();
      Ly.ui();
    };
  }

  function removeAllTiles() {
    if (!tiles.length) { alert('No tiles to remove.'); return; }

    /* Count total canvas placements */
    let usageCount = 0;
    if (map) {
      for (let r = 0; r < map.length; r++)
        for (let c = 0; c < map[r].length; c++)
          if (map[r][c] >= 0) usageCount++;
    }

    U.sMo(`<h3>Remove All Tiles</h3>
<p style="font-size:10px;color:var(--tx);margin-bottom:8px">
  Remove all <b>${tiles.length}</b> tile${tiles.length !== 1 ? 's' : ''} from the library?
</p>
${usageCount > 0 ? `
<p style="font-size:9px;color:var(--acc);margin-bottom:6px">
  <b>${usageCount}</b> tile instance${usageCount !== 1 ? 's' : ''} placed on the canvas.
</p>
<label style="justify-content:flex-start;gap:8px">
  <input type="checkbox" id="tm_rma_clear" checked>
  Also clear all placed tiles from canvas
</label>
` : ''}
<div class="mb">
  <button class="bsc" onclick="U.cMo()">Cancel</button>
  <button class="bp" id="tm_rma_ok">Remove All</button>
</div>`);

    document.getElementById('tm_rma_ok').onclick = () => {
      const clearEl = document.getElementById('tm_rma_clear');
      const clearCanvas = clearEl ? clearEl.checked : false;

      if (clearCanvas && map) {
        const la = T.activeLayer();
        Hi.push();
        for (let r = 0; r < map.length; r++)
          for (let c = 0; c < map[r].length; c++) {
            if (map[r][c] >= 0) {
              if (la) la.ctx.clearRect(c * tileW, r * tileH, tileW, tileH);
              map[r][c] = -1;
            }
          }
      }

      tiles = [];
      selectedTile = -1;
      nextId = 1;
      _dirty = true;
      U.cMo();
      _updateLib();
      C.render();
      Ly.ui();
    };
  }

  /* State saved during "Edit on Canvas" mode */
  let _editState = null;

  function editTile() {
    if (selectedTile < 0 || selectedTile >= tiles.length) {
      alert('Select a tile first.');
      return;
    }
    const t = tiles[selectedTile];

    /* Save the ENTIRE current project state so we can restore it on Cancel */
    _editState = {
      tileIndex: selectedTile,
      tileId: t.id,
      origW: C.W,
      origH: C.H,
      origBg: C.bg,
      origZoom: C.zm,
      origPanX: C.px,
      origPanY: C.py,
      origFrames: [],
      origCf: An.cf,
      wasPaintMode: paintMode
    };

    /* Snapshot every layer of every frame */
    for (const f of An.frames) {
      const fl = { al: f.activeLayer, dur: f.duration, layers: [] };
      for (const ly of f.layers) {
        const cv = document.createElement('canvas');
        cv.width = C.W; cv.height = C.H;
        cv.getContext('2d').drawImage(ly.canvas, 0, 0);
        let m = null;
        if (ly.mask) {
          const mc = document.createElement('canvas');
          mc.width = C.W; mc.height = C.H;
          mc.getContext('2d').drawImage(ly.mask.canvas, 0, 0);
          m = { c: mc, e: ly.mask.enabled, x: ly.mask.editing };
        }
        fl.layers.push({
          n: ly.name, o: ly.opacity, v: ly.visible,
          k: ly.locked, b: ly.blendMode, c: cv, m
        });
      }
      _editState.origFrames.push(fl);
    }

    /* Turn off paint mode while editing */
    paintMode = false;
    _updateModeLabel();

    /* Set canvas to tile dimensions */
    C.init(tileW, tileH, 'transparent');

    /* Create a single frame with a single layer containing the tile */
    An.frames = [{
      layers: [Ly.mk('Tile: ' + t.name)],
      activeLayer: 0,
      duration: 100
    }];
    An.cf = 0;

    /* Draw tile content onto the layer */
    const la = An.frames[0].layers[0];
    la.ctx.imageSmoothingEnabled = false;
    la.ctx.drawImage(t.canvas, 0, 0);

    /* Zoom to fit and update UI */
    C.zFit();
    Ly.ui();
    An.uStrip();
    C.render();

    /* Show the floating edit bar */
    const bar = document.getElementById('tm_editbar');
    if (bar) {
      bar.style.display = 'flex';
      const lbl = document.getElementById('tm_editbar_lbl');
      if (lbl) lbl.textContent = '✎ Editing Tile: ' + t.name;
    }

    /* Hide the TileMap panel so it doesn't overlap */
    panel().style.display = 'none';
  }

  function _saveEditOnCanvas() {
    if (!_editState) return;
    const t = tiles[_editState.tileIndex];
    if (!t) { _cancelEditOnCanvas(); return; }

    /* Capture the current canvas pixels into the tile */
    const la = An.frames[0] ? An.frames[0].layers[0] : null;
    if (la) {
      t.ctx.clearRect(0, 0, tileW, tileH);
      t.ctx.imageSmoothingEnabled = false;
      t.ctx.drawImage(la.canvas, 0, 0, tileW, tileH);
    }

    /* Restore the original project */
    _restoreFromEditState();

    /* Now update ALL placed instances of this tile on the canvas */
    if (map) {
      const activeLa = T.activeLayer();
      if (activeLa) {
        for (let r = 0; r < map.length; r++) {
          for (let c = 0; c < map[r].length; c++) {
            if (map[r][c] === t.id) {
              activeLa.ctx.clearRect(c * tileW, r * tileH, tileW, tileH);
              activeLa.ctx.drawImage(t.canvas, c * tileW, r * tileH);
            }
          }
        }
      }
    }

    _dirty = true;
    _updateLib();
    C.render();
    Ly.ui();
  }

  function _cancelEditOnCanvas() {
    if (!_editState) return;
    _restoreFromEditState();
    C.render();
    Ly.ui();
  }

  function _paintFromEdit() {
    if (!_editState) return;
    /* Save tile first (same as Save) */
    const t = tiles[_editState.tileIndex];
    if (!t) return;
    const la = An.frames[0] ? An.frames[0].layers[0] : null;
    if (la) {
      t.ctx.clearRect(0, 0, tileW, tileH);
      t.ctx.imageSmoothingEnabled = false;
      t.ctx.drawImage(la.canvas, 0, 0, tileW, tileH);
    }
    /* Restore project */
    _restoreFromEditState();
    /* Update all placed instances */
    if (map) {
      const activeLa = T.activeLayer();
      if (activeLa) {
        for (let r = 0; r < map.length; r++)
          for (let c = 0; c < map[r].length; c++)
            if (map[r][c] === t.id) {
              activeLa.ctx.clearRect(c * tileW, r * tileH, tileW, tileH);
              activeLa.ctx.drawImage(t.canvas, c * tileW, r * tileH);
            }
      }
    }
    _dirty = true;
    _updateLib();
    C.render(); Ly.ui();
    /* Go directly to Paint mode */
    const idx = tiles.findIndex(ti => ti.id === t.id);
    if (idx >= 0) selectedTile = idx;
    paintMode = true;
    findMode = false;
    _updateModeLabel();
    _updateLib();
  }

  function _restoreFromEditState() {
    if (!_editState) return;
    const s = _editState;

    /* Restore canvas dimensions */
    C.init(s.origW, s.origH, s.origBg);

    /* Restore all frames */
    An.frames = [];
    for (const fs of s.origFrames) {
      const fr = { layers: [], activeLayer: fs.al, duration: fs.dur || 100 };
      for (const ls of fs.layers) {
        const ly = Ly.mk(ls.n);
        ly.canvas.width = s.origW; ly.canvas.height = s.origH;
        ly.ctx.imageSmoothingEnabled = false;
        ly.opacity = ls.o; ly.visible = ls.v; ly.locked = ls.k;
        ly.blendMode = ls.b || 'normal';
        ly.ctx.drawImage(ls.c, 0, 0);
        if (ls.m) {
          ly.mask = Ly.ensureMask(ly);
          ly.mask.canvas.width = s.origW; ly.mask.canvas.height = s.origH;
          ly.mask.ctx = ly.mask.canvas.getContext('2d', { willReadFrequently: true });
          ly.mask.ctx.imageSmoothingEnabled = false;
          ly.mask.ctx.drawImage(ls.m.c, 0, 0);
          ly.mask.enabled = !!ls.m.e;
          ly.mask.editing = !!ls.m.x;
        }
        fr.layers.push(ly);
      }
      An.frames.push(fr);
    }
    An.cf = Math.min(s.origCf, An.frames.length - 1);

    /* Restore view */
    C.zm = s.origZoom;
    C.px = s.origPanX;
    C.py = s.origPanY;

    /* Hide edit bar, show panel */
    const bar = document.getElementById('tm_editbar');
    if (bar) bar.style.display = 'none';
    if (active) panel().style.display = '';

    /* Restore paint mode */
    paintMode = s.wasPaintMode;
    _updateModeLabel();

    Ly.ui();
    An.uStrip();

    _editState = null;
  }

  /* ===== Extract from Grid ===== */
  function extractFromGrid() {
    if (!active) open();
    const la = T.activeLayer();
    if (!la) { alert('No active layer.'); return; }
    const w = C.W, h = C.H;
    const cols = _mapCols(), rows = _mapRows();
    const hashes = new Map();
    let added = 0, merged = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const sx = c * tileW, sy = r * tileH;
        const sw = Math.min(tileW, w - sx), sh = Math.min(tileH, h - sy);
        if (sw <= 0 || sh <= 0) continue;

        const id = la.ctx.getImageData(sx, sy, sw, sh);
        /* Check empty */
        let empty = true;
        for (let i = 3; i < id.data.length; i += 4) {
          if (id.data[i] > 0) { empty = false; break; }
        }
        if (empty) continue;

        /* Hash for dedup */
        let hash = 0;
        const d = id.data;
        for (let i = 0; i < d.length; i += 4)
          hash = ((hash << 5) - hash + d[i] + d[i+1] + d[i+2] + d[i+3]) | 0;
        const key = sw + 'x' + sh + ':' + hash;

        if (hashes.has(key)) {
          /* Duplicate — reuse existing tile */
          if (map) map[r][c] = hashes.get(key);
          merged++;
        } else {
          const cv = document.createElement('canvas');
          cv.width = tileW; cv.height = tileH;
          const ctx = cv.getContext('2d', { willReadFrequently: true });
          ctx.imageSmoothingEnabled = false;
          ctx.putImageData(id, 0, 0);
          const t = { id: nextId++, name: 'Tile ' + tiles.length, canvas: cv, ctx };
          tiles.push(t);
          hashes.set(key, t.id);
          if (map) map[r][c] = t.id;
          added++;
        }
      }
    }

    selectedTile = tiles.length > 0 ? 0 : -1;
    _dirty = true;
    _updateLib();
    alert(`Extracted: ${added} unique tiles, ${merged} duplicates merged.`);
  }

  /* ===== Change Grid / Re-slice ===== */
  function changeGrid() {
    U.sMo(`<h3>Change TileMap Grid</h3>
<p style="font-size:9px;color:var(--txd);margin-bottom:6px">
  Current: ${tileW}×${tileH}px<br>
  ⚠️ Changing the grid will clear the tile map and re-extract.
</p>
<label>Width<input type="number" id="tmg_w" value="${C.gsz}" min="1" max="256" style="width:60px"></label>
<label>Height<input type="number" id="tmg_h" value="${C.gszH}" min="1" max="256" style="width:60px"></label>
<div class="mb">
  <button class="bsc" onclick="U.cMo()">Cancel</button>
  <button class="bp" id="tmg_ok">Apply & Re-extract</button>
</div>`);
    document.getElementById('tmg_ok').onclick = () => {
      tileW = Math.max(1, +document.getElementById('tmg_w').value || 8);
      tileH = Math.max(1, +document.getElementById('tmg_h').value || 8);
      C.gsz = tileW; C.gszH = tileH;
      tiles = []; selectedTile = -1; nextId = 1;
      _initMap();
      U.cMo();
      extractFromGrid();
      C.render();
    };
  }

  /* ===== Paint Mode ===== */
  function togPaintMode() {
    if (!active) { alert('Open TileMap Mode first.'); return; }
    paintMode = !paintMode;
    if (paintMode) findMode = false;
    _updateModeLabel();
    _updateLib();
  }

  function togFindMode() {
    if (!active) { alert('Open TileMap Mode first.'); return; }
    findMode = !findMode;
    if (findMode) paintMode = false; /* disable paint while finding */
    _updateModeLabel();
    _updateLib();
    const btn = document.getElementById('tm_find_btn');
    if (btn) btn.style.borderColor = findMode ? 'var(--acc)' : 'var(--bd)';
  }

  /* Handle canvas click in paint mode or find mode */
  function _onCanvasClick(e) {
    /* Middle button = always PAN, never intercept */
    if (e.button === 1) return false;
    if (!active) return false;

    const pos = C.s2c(e.clientX, e.clientY);
    const col = Math.floor(pos.x / tileW);
    const row = Math.floor(pos.y / tileH);
    if (!map || row < 0 || row >= map.length || col < 0 || col >= map[0].length) return false;

    /* FIND MODE: left-click identifies the tile */
    if (findMode && e.button === 0) {
      const tid = map[row][col];
      if (tid < 0) {
        /* Empty cell */
        const infoEl = info();
        if (infoEl) infoEl.textContent = 'Empty cell at row ' + row + ', col ' + col;
        return true;
      }
      const idx = tiles.findIndex(t => t.id === tid);
      if (idx >= 0) {
        selectedTile = idx;
        _updateLib();
        const infoEl = info();
        if (infoEl) infoEl.textContent = '🔍 Found: ' + tiles[idx].name + ' at row ' + row + ', col ' + col;
      }
      return true;
    }

    /* PAINT MODE: Ctrl+Click also finds tile (alternative shortcut) */
    if (paintMode && e.ctrlKey && e.button === 0) {
      const tid = map[row][col];
      if (tid >= 0) {
        const idx = tiles.findIndex(t => t.id === tid);
        if (idx >= 0) {
          selectedTile = idx;
          _updateLib();
          const infoEl = info();
          if (infoEl) infoEl.textContent = '🔍 Found: ' + tiles[idx].name;
        }
      }
      return true;
    }

    /* PAINT MODE: normal paint/erase */
    if (!paintMode) return false;
    if (selectedTile < 0 || selectedTile >= tiles.length) return false;

    const t = tiles[selectedTile];
    const la = T.activeLayer();
    if (!la) return false;

    if (e.button === 2) {
      /* Right click: erase tile from cell */
      Hi.push();
      map[row][col] = -1;
      la.ctx.clearRect(col * tileW, row * tileH, tileW, tileH);
    } else {
      /* Left click: paint tile */
      Hi.push();
      map[row][col] = t.id;
      la.ctx.clearRect(col * tileW, row * tileH, tileW, tileH);
      la.ctx.drawImage(t.canvas, col * tileW, row * tileH);
    }
    _dirty = true;
    C.render(); Ly.ui();
    return true;
  }

  /* ===== Find Tile Usage ===== */
  function findTileUsage() {
    if (!active) { alert('Open TileMap Mode first.'); return; }
    alert('Right-click a grid cell on the canvas while in TileMap Paint Mode to identify the tile.');
  }


  /* ===== Export / Import ===== */
  function exportTileset() {
    if (!tiles.length) { alert('No tiles to export.'); return; }
    const cols = Math.min(tiles.length, 16);
    const rows = Math.ceil(tiles.length / cols);
    const cv = document.createElement('canvas');
    cv.width = cols * tileW; cv.height = rows * tileH;
    const cx = cv.getContext('2d');
    cx.imageSmoothingEnabled = false;
    tiles.forEach((t, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      cx.drawImage(t.canvas, c * tileW, r * tileH);
    });
    cv.toBlob(b => {
      if (!b) return;
      const url = BlobURLs.create(b);
      const a = document.createElement('a');
      a.href = url; a.download = 'tileset.png'; a.click();
      setTimeout(() => BlobURLs.revoke(url), 2000);
    }, 'image/png');
  }

  function importTileset() {
    if (!active) open();
    U.sMo(`<h3>Import Tileset</h3>
<p style="font-size:9px;color:var(--txd);margin-bottom:6px">
  Select a tileset image. It will be sliced using the current grid size (${tileW}×${tileH}px).
</p>
<div class="mb">
  <button class="bsc" onclick="U.cMo()">Cancel</button>
  <button class="bp" id="tm_imp_btn">Choose File</button>
</div>`);
    document.getElementById('tm_imp_btn').onclick = () => {
      U.cMo();
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = () => {
        const f = inp.files[0]; if (!f) return;
        const img = new Image();
        const url = BlobURLs.create(f);
        img.onload = () => {
          const cols = Math.floor(img.width / tileW);
          const rows = Math.floor(img.height / tileH);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const cv = document.createElement('canvas');
              cv.width = tileW; cv.height = tileH;
              const ctx = cv.getContext('2d', { willReadFrequently: true });
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(img, c * tileW, r * tileH, tileW, tileH, 0, 0, tileW, tileH);
              /* Check empty */
              const d = ctx.getImageData(0, 0, tileW, tileH).data;
              let empty = true;
              for (let i = 3; i < d.length; i += 4) { if (d[i] > 0) { empty = false; break; } }
              if (empty) continue;
              tiles.push({ id: nextId++, name: 'Imp ' + tiles.length, canvas: cv, ctx });
            }
          }
          BlobURLs.revoke(url);
          selectedTile = 0;
          _dirty = true;
          _updateLib();
        };
        img.onerror = () => { BlobURLs.revoke(url); alert('Failed to load image.'); };
        img.src = url;
      };
      inp.click();
    };
  }

  function exportMapData() {
    if (!map) { alert('No map data.'); return; }
    const data = {
      tileWidth: tileW, tileHeight: tileH,
      rows: map.length, columns: map[0] ? map[0].length : 0,
      tiles: tiles.map(t => ({ id: t.id, name: t.name })),
      map: map.map(row => row.map(id => id))
    };
    const bl = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = BlobURLs.create(bl);
    const a = document.createElement('a');
    a.href = url; a.download = 'tilemap.json'; a.click();
    setTimeout(() => BlobURLs.revoke(url), 2000);
  }

  /* ===== Panel dragging ===== */
  document.addEventListener('mousedown', e => {
    if (e.target.id === 'tmhdr' || e.target.parentElement?.id === 'tmhdr') {
      if (e.target.tagName === 'BUTTON') return;
      _dragPanel = true;
      const p = panel();
      _dpX = e.clientX - p.offsetLeft;
      _dpY = e.clientY - p.offsetTop;
      e.preventDefault();
    }
  });
  window.addEventListener('mousemove', e => {
    if (!_dragPanel) return;
    const p = panel();
    const pw = p.offsetWidth || 100;
    const minL = -(pw - 40);
    const maxL = window.innerWidth - 40;
    const maxT = window.innerHeight - 20;
    const nx = Math.max(minL, Math.min(maxL, e.clientX - _dpX));
    const ny = Math.max(0, Math.min(maxT, e.clientY - _dpY));
    p.style.left = nx + 'px';
    p.style.top = ny + 'px';
    p.style.right = 'auto';
  });
  window.addEventListener('mouseup', () => { _dragPanel = false; });

  /* ===== Hook into canvas events ===== */
  /* We intercept the mousedown on the canvas area.
     This must be called AFTER the main app initializes. */
  window.addEventListener('load', () => {
    const ca = document.getElementById('ca');
    if (!ca) return;
    ca.addEventListener('mousedown', e => {
      if (_onCanvasClick(e)) { e.stopPropagation(); e.preventDefault(); }
    }, true); /* capture phase so we intercept before T.onDown */
    ca.addEventListener('contextmenu', e => {
      if (active && (paintMode || findMode)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  });

  return {
    get active() { return active; },
    get paintMode() { return paintMode; },
    get tiles() { return tiles; },
    open, close, addTile, removeTile, removeAllTiles, editTile,
    extractFromGrid, changeGrid, togPaintMode,
    findTileUsage, togFindMode, exportTileset, importTileset, exportMapData,
    _exitKeep, _exitBake, _exitDiscard, _onCanvasClick,
    _saveEditOnCanvas, _cancelEditOnCanvas, _paintFromEdit
  };
})();
