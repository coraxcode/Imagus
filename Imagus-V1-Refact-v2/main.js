"use strict";
/* ===== UI MODULE ===== */
const U = (() => {
  const TD = [
    { id: 'brush', l: 'Brush', k: 'B', i: '<line x1="3" y1="18" x2="18" y2="3"/><circle cx="18" cy="3" r="2"/>' },
    { id: 'eraser', l: 'Eraser', k: 'E', i: '<rect x="4" y="8" width="13" height="10" rx="2"/><line x1="4" y1="12" x2="17" y2="12"/>' },
    { id: 'airbrush', l: 'Airbrush', k: 'A', i: '<circle cx="10" cy="10" r="6" stroke-dasharray="2 2"/><line x1="16" y1="16" x2="19" y2="19"/>' },
    { id: 'jumble', l: 'Jumble', k: 'J', i: '<path d="M4 6h4M14 6h4M6 11h3M13 11h4M4 16h5M12 16h6"/><circle cx="11" cy="6" r="1"/><circle cx="9" cy="11" r="1"/><circle cx="10" cy="16" r="1"/>' },
    { s: 1 },
    { id: 'line', l: 'Line', k: 'L', i: '<line x1="4" y1="18" x2="18" y2="4"/>' },
    { id: 'rect', l: 'Rect', k: 'R', i: '<rect x="4" y="5" width="14" height="12" rx="1"/>' },
    { id: 'circle', l: 'Ellipse', k: 'C', i: '<ellipse cx="11" cy="11" rx="8" ry="6"/>' },
    { id: 'contour', l: 'Contour', k: 'O', i: '<path d="M4 14C4 7 8 4 13 5c4 1 6 4 5 8-1 3-4 5-8 5-4 0-6-2-6-4z"/>' },
    { s: 1 },
    { id: 'bucket', l: 'Fill', k: 'G', i: '<path d="M6 18l-2-2 9-9 4 4-9 9z"/><path d="M15 7l2-2"/>' },
    { id: 'gradient', l: 'Gradient', k: 'D', i: '<rect x="4" y="4" width="14" height="14" rx="1"/><line x1="4" y1="18" x2="18" y2="4" stroke-dasharray="2"/>' },
    { id: 'picker', l: 'Picker', k: 'I', i: '<path d="M4 18l4-12 10 10-12 4z"/><circle cx="8" cy="14" r="1"/>' },
    { s: 1 },
    { id: 'smooth', l: 'Smooth', k: 'S', i: '<path d="M4 14c4-8 10-8 14 0"/><circle cx="11" cy="8" r="2" stroke-dasharray="1 1"/>' },
    { id: 'lightdark', l: 'Light/Dark', k: 'K', i: '<circle cx="8" cy="11" r="4"/><path d="M8 7a4 4 0 0 0 0 8" /><line x1="14" y1="11" x2="19" y2="11"/><line x1="16.5" y1="8.5" x2="16.5" y2="13.5"/>' },
    { s: 1 },
    { id: 'rect-select', l: 'Select', k: 'M', i: '<rect x="4" y="4" width="14" height="14" stroke-dasharray="3 2" fill="none"/>' },
    { id: 'freehand-select', l: 'Free', k: '', i: '<path d="M5 15C5 5 18 5 18 15" stroke-dasharray="3 2" fill="none"/>' },
    { id: 'magic-wand', l: 'Wand', k: 'W', i: '<path d="M4 18L18 4"/><path d="M15 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="currentColor" stroke="none"/>' },
    { id: 'brush-select', l: 'BrSel', k: '', i: '<rect x="3" y="3" width="10" height="10" stroke-dasharray="2 2" fill="none"/><circle cx="16" cy="13" r="2"/>' },
    { s: 1 },
    { id: 'move', l: 'Move', k: 'V', i: '<path d="M11 3v18M3 11h18M7 7l4-4 4 4M7 15l4 4 4-4"/>' },
    { id: 'text', l: 'Text', k: 'T', i: '<text x="5" y="17" font-size="16" font-weight="bold" fill="currentColor" stroke="none">T</text>' },
    { s: 1 },
    { id: 'magnifier', l: 'Zoom', k: 'Z', i: '<circle cx="10" cy="10" r="6"/><line x1="14.5" y1="14.5" x2="19" y2="19"/>' },
    { id: 'pixel-mask', l: 'Mask', k: 'Q', i: '<rect x="4" y="4" width="14" height="14" rx="2" fill="none" stroke-dasharray="2 1"/><circle cx="11" cy="11" r="3" fill="currentColor" stroke="none"/>' },
    { s: 1 },
    { id: 'pan', l: 'Pan', k: 'H', i: '<circle cx="11" cy="11" r="3"/><path d="M11 3v5M11 15v5M3 11h5M15 11h5"/>' },
  ];

  function bTB() {
    const tb = document.getElementById('toolbar');
    tb.innerHTML = '';
    for (const t of TD) {
      if (t.s) { tb.append(Object.assign(document.createElement('div'), { className: 'tsep' })); continue; }
      const b = document.createElement('div');
      b.className = 'tb' + (t.id === T.current ? ' on' : '');
      b.dataset.tool = t.id;
      b.title = t.l + (t.k ? ` (${t.k})` : '');
      b.innerHTML = `<svg viewBox="0 0 22 22">${t.i}</svg>`;
      if (t.id === 'pixel-mask' && _pxMaskMode) b.classList.add('mask-on');
      b.onclick = () => { if (t.id === 'pixel-mask') { togglePxMask(); return; } T.set(t.id); };
      tb.append(b);
    }
  }

  function uTopt() {
    const b = document.getElementById('topts');
    b.innerHTML = '';
    const t = T.current;

    if (['brush', 'eraser', 'airbrush'].includes(t)) {
      let h = `<label>Sz<input type="range" min="1" max="64" value="${T.brushSize}" oninput="T.brushSize=+this.value;this.nextElementSibling.value=this.value"><input type="number" min="1" max="64" value="${T.brushSize}" style="width:28px;background:var(--bg1);border:1px solid var(--bd);color:var(--tx);font-size:9px;text-align:center;border-radius:2px;padding:0" oninput="T.brushSize=+this.value;this.previousElementSibling.value=this.value"></label><label>Op<input type="range" min="1" max="100" value="${T.brushOpacity}" oninput="T.brushOpacity=+this.value;this.nextElementSibling.value=this.value"><input type="number" min="1" max="100" value="${T.brushOpacity}" style="width:28px;background:var(--bg1);border:1px solid var(--bd);color:var(--tx);font-size:9px;text-align:center;border-radius:2px;padding:0" oninput="T.brushOpacity=+this.value;this.previousElementSibling.value=this.value"></label><label>Soft<input type="range" min="0" max="10" value="${T.hardness}" oninput="T.hardness=+this.value;this.nextElementSibling.value=this.value"><input type="number" min="0" max="10" value="${T.hardness}" style="width:24px;background:var(--bg1);border:1px solid var(--bd);color:var(--tx);font-size:9px;text-align:center;border-radius:2px;padding:0" oninput="T.hardness=+this.value;this.previousElementSibling.value=this.value"></label>`;
      if (t === 'brush') h += `<label>PP<input type="checkbox" ${T.pixelPerfect ? 'checked' : ''} onchange="T.pixelPerfect=this.checked"></label><label>LkA<input type="checkbox" ${T.lockAlpha ? 'checked' : ''} onchange="T.lockAlpha=this.checked" title="Lock Alpha: paint only on existing pixels"></label><label><select onchange="T.brushShape=this.value"><option value="circle"${T.brushShape === 'circle' ? ' selected' : ''}>●</option><option value="square"${T.brushShape === 'square' ? ' selected' : ''}>■</option><option value="custom"${T.brushShape === 'custom' ? ' selected' : ''}>C</option></select></label>`;
      h += `<label>SymH<input type="checkbox" ${T.symH ? 'checked' : ''} onchange="T.symH=this.checked;U.uTopt()"></label><label>SymV<input type="checkbox" ${T.symV ? 'checked' : ''} onchange="T.symV=this.checked;U.uTopt()"></label><label>45°<input type="checkbox" ${T.sym45 ? 'checked' : ''} onchange="T.sym45=this.checked"></label><label>-45°<input type="checkbox" ${T.sym45n ? 'checked' : ''} onchange="T.sym45n=this.checked"></label>`;
      if (T.symH || T.symV) h += `<label><button class="bsc" style="padding:0 4px;font-size:8px" onclick="C.symHP=0.5;C.symVP=0.5;C.render();U.uTopt()">↻</button></label><label style="color:var(--txd)">Alt+drag=move axis | </label>`;
      h += `<label>LkH<input type="checkbox" ${T.lockX ? 'checked' : ''} onchange="T.lockX=this.checked;U.uTopt()"></label><label>LkV<input type="checkbox" ${T.lockY ? 'checked' : ''} onchange="T.lockY=this.checked;U.uTopt()"></label>`;
            if (T.customBrush) h += `<label style="color:var(--acc)">⬦Cust</label><label>Src<input type="checkbox" ${T.patMode==='source'?'checked':''} onchange="T.patMode=this.checked?'source':'none';U.uTopt()" title="Pattern aligned to source"></label><label>Dst<input type="checkbox" ${T.patMode==='dest'?'checked':''} onchange="T.patMode=this.checked?'dest':'none';U.uTopt()" title="Pattern aligned to destination"></label>`;
      h += `<label><button class="bsc" style="padding:0 4px;font-size:10px" onclick="T.brushSize=1;T.hardness=0;T.brushOpacity=100;T.clearCB();U.uTopt()" title="Reset brush">•</button></label>`;
      b.innerHTML = h;
    }
    else if (t === 'jumble') {
      b.innerHTML = `
        <label>Sz
          <input type="range" min="1" max="64" value="${T.brushSize}"
            oninput="T.brushSize=+this.value;this.nextElementSibling.textContent=this.value">
          <span>${T.brushSize}</span>
        </label>
        <label>Int
          <input type="range" min="1" max="100" value="${T.jumbleIntensity}"
            oninput="T.jumbleIntensity=+this.value;this.nextElementSibling.textContent=this.value">
          <span>${T.jumbleIntensity}</span>
        </label>
        <label>
          <select onchange="T.brushShape=this.value">
            <option value="circle"${T.brushShape === 'circle' ? ' selected' : ''}>●</option>
            <option value="square"${T.brushShape === 'square' ? ' selected' : ''}>■</option>
          </select>
        </label>
        <label style="color:var(--txd)">Shuffle existing pixels only</label>
      `;
    }
    else if (t === 'smooth') b.innerHTML = `<label>R<input type="range" min="1" max="16" value="${Math.min(T.brushSize,16)}" oninput="T.brushSize=+this.value;this.nextElementSibling.textContent=this.value"><span>${T.brushSize}</span></label><label>Int<input type="range" min="1" max="10" value="${T.smoothInt}" oninput="T.smoothInt=+this.value;this.nextElementSibling.textContent=this.value"><span>${T.smoothInt}</span></label>`;
    else if (t === 'lightdark') {
      b.innerHTML = `
        <label>Size
          <input type="range" min="1" max="128" value="${T.ldSize}"
            oninput="T.ldSize=+this.value;this.nextElementSibling.textContent=this.value">
          <span>${T.ldSize}</span>
        </label>
        <label>Strength
          <input type="range" min="1" max="100" value="${T.ldStrength}"
            oninput="T.ldStrength=+this.value;this.nextElementSibling.textContent=this.value">
          <span>${T.ldStrength}</span>
        </label>
        <label>Invert
          <input type="checkbox" ${T.ldInvert ? 'checked' : ''} onchange="T.ldInvert=this.checked;U.uTopt()">
        </label>
        <label style="color:var(--txd)">
          ${T.ldInvert ? 'L=lighten · R=darken' : 'L=darken · R=lighten'}
        </label>
      `;
    }
    else if (t === 'gradient') {
      let gh = `<label>Type<select onchange="T.gradType=this.value">
        <option value="linear"${T.gradType === 'linear' ? ' selected' : ''}>Linear</option>
        <option value="radial"${T.gradType === 'radial' ? ' selected' : ''}>Radial</option>
      </select></label>`;

      gh += `<label>Op<input type="range" min="1" max="100" value="${T.brushOpacity}" oninput="T.brushOpacity=+this.value;this.nextElementSibling.textContent=this.value"><span>${T.brushOpacity}</span></label>`;

      gh += `<label>2nd Transparent<input type="checkbox" ${T.gradTransparentSecondary ? 'checked' : ''} onchange="T.gradTransparentSecondary=this.checked"></label>`;

      gh += `<label>Dither<input type="checkbox" ${T.gradDither ? 'checked' : ''} onchange="T.gradDither=this.checked;U.uTopt()"></label>`;

      if (T.gradDither) {
        gh += `<label>Lvl<input type="range" min="2" max="16" value="${T.gradDitherLv}" oninput="T.gradDitherLv=+this.value;this.nextElementSibling.textContent=this.value" title="Color levels (fewer = more retro)"><span>${T.gradDitherLv}</span></label>`;
        gh += `<label><select onchange="T.gradDitherSt=this.value">
          <option value="bayer"${T.gradDitherSt === 'bayer' ? ' selected' : ''}>Bayer</option>
          <option value="noise"${T.gradDitherSt === 'noise' ? ' selected' : ''}>Noise</option>
          <option value="halftone"${T.gradDitherSt === 'halftone' ? ' selected' : ''}>Halftone</option>
          <option value="diamond"${T.gradDitherSt === 'diamond' ? ' selected' : ''}>Diamond</option>
          <option value="cross"${T.gradDitherSt === 'cross' ? ' selected' : ''}>Cross</option>
          <option value="lines"${T.gradDitherSt === 'lines' ? ' selected' : ''}>Lines</option>
        </select></label>`;
      }

      gh += `<label style="color:var(--txd)">Start = primary • End = ${T.gradTransparentSecondary ? 'transparent secondary' : 'secondary'}</label>`;

      b.innerHTML = gh;
    }
    else if (['rect', 'circle'].includes(t)) b.innerHTML = `<label>W<input type="range" min="1" max="32" value="${T.brushSize}" oninput="T.brushSize=+this.value;this.nextElementSibling.textContent=this.value"><span>${T.brushSize}</span></label><label>Mode<select onchange="T.shapeMode=this.value"><option value="outline"${T.shapeMode === 'outline' ? ' selected' : ''}>Outline</option><option value="filled"${T.shapeMode === 'filled' ? ' selected' : ''}>Filled</option></select></label>`;
    else if (t === 'line') b.innerHTML = `<label>W<input type="range" min="1" max="32" value="${T.brushSize}" oninput="T.brushSize=+this.value;this.nextElementSibling.textContent=this.value"><span>${T.brushSize}</span></label>`;
    else if (t === 'contour') b.innerHTML = `<label>Op<input type="range" min="1" max="100" value="${T.brushOpacity}" oninput="T.brushOpacity=+this.value;this.nextElementSibling.textContent=this.value"><span>${T.brushOpacity}</span></label><label style="color:var(--txd)">Drag and release = close + fill</label>`;
    else if (t === 'bucket') b.innerHTML = `<label>Tol<input type="range" min="0" max="128" value="${T.tolerance}" oninput="T.tolerance=+this.value;this.nextElementSibling.textContent=this.value"><span>${T.tolerance}</span></label><label>Contig<input type="checkbox" ${T.fillContig ? 'checked' : ''} onchange="T.fillContig=this.checked" title="Contiguous: fill connected pixels only"></label>`;
    else if (['rect-select', 'freehand-select', 'magic-wand'].includes(t)) {
      let h = '';
      if (t === 'magic-wand') h += `<label>Tol<input type="range" min="0" max="128" value="${T.tolerance}" oninput="T.tolerance=+this.value;this.nextElementSibling.textContent=this.value"><span>${T.tolerance}</span></label>`;
      h += `<label>Tf<input type="checkbox" ${T.tfMode ? 'checked' : ''} onchange="T.toggleTf(this.checked)"></label>`;
      if (T.tfMode) {
        h += `<label>Px<input type="checkbox" ${T.tfPixel ? 'checked' : ''} onchange="T.tfPixel=this.checked" title="Pixel-perfect (no blur)"></label>`;
        h += `<label><select onchange="T.tfAction=this.value" style="background:var(--bg1);border:1px solid var(--bd);color:var(--tx);font-size:9px;padding:1px 2px;border-radius:2px">`;
        h += `<option value="auto"${T.tfAction==='auto'?' selected':''}>Auto</option>`;
        h += `<option value="move"${T.tfAction==='move'?' selected':''}>Move</option>`;
        h += `<option value="rotate"${T.tfAction==='rotate'?' selected':''}>Rotate</option>`;
        h += `<option value="resize"${T.tfAction==='resize'?' selected':''}>Resize</option>`;
        h += `</select></label>`;
      }
      h += `<label style="color:var(--txd)">Shift=move · Enter=apply</label>`;
      b.innerHTML = h;
    }
    else if (t === 'move') b.innerHTML = `<label>All Frames<input type="checkbox" ${T.moveAllFrames ? 'checked' : ''} onchange="T.moveAllFrames=this.checked" title="Move this layer in all frames that contain it"></label>`;
    else if (t === 'magnifier') b.innerHTML = `<label style="color:var(--txd)">Click=in · Right=out</label>`;
        else if (t === 'brush-select') b.innerHTML = `<label style="color:var(--txd)">Drag to capture brush</label>`;
  }

  /* Color helpers */
  function h2r(h) {
    return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
  }
  function r2h(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, Math.round(l * 100)];
    const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h = 0;
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }
  function h2x(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      return Math.round((l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)) * 255);
    };
    return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function uCol() {
    document.getElementById('pc').style.background = C.pc;
    document.getElementById('sc2').style.background = C.sc;
    document.getElementById('chx').value = C.pc;
    const rgb = h2r(C.pc), hsl = r2h(rgb.r, rgb.g, rgb.b);
    document.getElementById('hs').value = hsl[0];
    document.getElementById('ss').value = hsl[1];
    document.getElementById('ls').value = hsl[2];
    document.getElementById('ss').style.background =
      `linear-gradient(to right,hsl(${hsl[0]},0%,${hsl[2]}%),hsl(${hsl[0]},100%,${hsl[2]}%))`;
    document.getElementById('ls').style.background =
      `linear-gradient(to right,hsl(${hsl[0]},${hsl[1]}%,0%),hsl(${hsl[0]},${hsl[1]}%,50%),hsl(${hsl[0]},${hsl[1]}%,100%))`;
  }

  function iCol() {
    document.getElementById('csw').onclick = document.getElementById('sc2').onclick = () => {
      [C.pc, C.sc] = [C.sc, C.pc]; uCol();
    };
    document.getElementById('chx').addEventListener('change', function () {
      if (/^#[0-9a-fA-F]{6}$/.test(this.value)) { C.pc = this.value; uCol(); }
    });
    ['hs', 'ss', 'ls'].forEach(id =>
      document.getElementById(id).addEventListener('input', () => {
        C.pc = h2x(+document.getElementById('hs').value,
                    +document.getElementById('ss').value,
                    +document.getElementById('ls').value);
        uCol();
      })
    );
    document.getElementById('addToPal').onclick = () => {
      if (!userPalette.includes(C.pc)) userPalette.push(C.pc);
      lPal(userPalette);
    };
  }

  function lPal(cc) {
    userPalette = [...cc];
    const g = document.getElementById('pg');
    g.innerHTML = '';
    for (const c2 of cc) {
      const s = document.createElement('div');
      s.className = 'pw';
      s.style.background = c2;
      s.style.width = palSwatchSize + 'px';
      s.style.height = palSwatchSize + 'px';
      s.onclick = () => { C.pc = c2; uCol(); };
      s.oncontextmenu = e => { e.preventDefault(); C.sc = c2; uCol(); };
      g.append(s);
    }
  }

  function palReset() { lPal([...PAL256]); }
  function palClear() { lPal([]); }

  function palSort() {
    if (!userPalette.length) return;
    function hslKey(hex) {
      const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
      const mx = Math.max(r,g,b), mn = Math.min(r,g,b), l = (mx+mn)/2;
      if (mx === mn) return [1000, 0, l];
      const d = mx - mn, s = l > .5 ? d/(2-mx-mn) : d/(mx+mn);
      let h;
      if (mx === r) h = ((g-b)/d + (g<b?6:0))/6;
      else if (mx === g) h = ((b-r)/d + 2)/6;
      else h = ((r-g)/d + 4)/6;
      const hueBand = Math.floor(h * 12);
      return [hueBand, l, s];
    }
    lPal([...userPalette].sort((a, b) => {
      const ka = hslKey(a), kb = hslKey(b);
      if (ka[0] !== kb[0]) return ka[0] - kb[0];
      return ka[1] - kb[1];
    }));
  }

  function palExport() {
    if (!userPalette.length) return;
    const cols = userPalette.length;
    const w = Math.min(cols, 16), h = Math.ceil(cols / 16), sz = 16;
    const cv = document.createElement('canvas');
    cv.width = w * sz; cv.height = h * sz;
    const cx = cv.getContext('2d');
    for (let i = 0; i < cols; i++) {
      cx.fillStyle = userPalette[i];
      cx.fillRect((i % 16) * sz, Math.floor(i / 16) * sz, sz, sz);
    }
    cv.toBlob(bl => {
      if (!bl) return;
      const url = BlobURLs.create(bl);
      const a = document.createElement('a');
      a.href = url; a.download = 'palette.png'; a.click();
      setTimeout(() => BlobURLs.revoke(url), 1000);
    }, 'image/png');
  }

  function palPNG() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/png';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const img = new Image();
      const url = BlobURLs.create(f);
      img.onload = () => {
        const c2 = document.createElement('canvas');
        c2.width = img.width; c2.height = img.height;
        const cx = c2.getContext('2d');
        cx.drawImage(img, 0, 0);
        const d = cx.getImageData(0, 0, c2.width, c2.height).data;
        const colors = new Set();
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 128) continue;
          colors.add('#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''));
        }
        if (colors.size > 0) lPal([...colors].slice(0, 512));
        BlobURLs.revoke(url);
      };
      img.onerror = () => BlobURLs.revoke(url);
      img.src = url;
    };
    inp.click();
  }
  
  function palSzUp() { palSwatchSize = Math.min(32, palSwatchSize + 2); lPal(userPalette); }
  function palSzDn() { palSwatchSize = Math.max(6, palSwatchSize - 2); lPal(userPalette); }

  function palImportFile() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.pal,.gpl,.txt';
    inp.onchange = function() {
      var f = inp.files[0]; if (!f) return;
      var reader = new FileReader();
      reader.onload = function() {
        var text = reader.result;
        var colors = null;
        var lines = text.split(/\r?\n/);

        /* Detect JASC-PAL */
        if (lines[0] && lines[0].trim() === 'JASC-PAL') {
          colors = [];
          var count = parseInt((lines[2] || '').trim(), 10) || 9999;
          for (var i = 3; i < lines.length && colors.length < count; i++) {
            var p = lines[i].trim().split(/\s+/);
            if (p.length < 3) continue;
            var r = parseInt(p[0], 10), g = parseInt(p[1], 10), b = parseInt(p[2], 10);
            if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
              colors.push('#' + [r, g, b].map(function(v) { return v.toString(16).padStart(2, '0'); }).join(''));
            }
          }
        }
        /* Detect GIMP GPL */
        else if (lines[0] && lines[0].trim() === 'GIMP Palette') {
          colors = [];
          for (var i = 1; i < lines.length; i++) {
            var l = lines[i].trim();
            if (!l || l[0] === '#' || l.startsWith('Name:') || l.startsWith('Columns:')) continue;
            var m = l.match(/^\s*(\d+)\s+(\d+)\s+(\d+)/);
            if (!m) continue;
            var r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
            if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
              colors.push('#' + [r, g, b].map(function(v) { return v.toString(16).padStart(2, '0'); }).join(''));
            }
          }
        }
        /* Plain TXT: hex colors, one per line */
        else {
          colors = [];
          for (var i = 0; i < lines.length; i++) {
            var h = lines[i].trim().replace(/^#/, '');
            if (/^[0-9a-fA-F]{6}$/.test(h)) {
              colors.push('#' + h.toLowerCase());
            } else if (/^[0-9a-fA-F]{8}$/.test(h)) {
              colors.push('#' + h.slice(0, 6).toLowerCase());
            }
          }
        }

        if (colors && colors.length > 0) {
          lPal(colors.slice(0, 512));
        } else {
          alert('No valid colors found in file.');
        }
      };
      reader.onerror = function() { alert('Failed to read file.'); };
      reader.readAsText(f);
    };
    inp.click();
  }

  function palExpPAL() {
    if (!userPalette.length) return;
    var lines = ['JASC-PAL', '0100', String(userPalette.length)];
    for (var i = 0; i < userPalette.length; i++) {
      var h = userPalette[i];
      lines.push(parseInt(h.slice(1, 3), 16) + ' ' + parseInt(h.slice(3, 5), 16) + ' ' + parseInt(h.slice(5, 7), 16));
    }
    var bl = new Blob([lines.join('\n') + '\n'], { type: 'text/plain' });
    var url = BlobURLs.create(bl);
    var a = document.createElement('a');
    a.href = url; a.download = 'palette.pal'; a.click();
    setTimeout(function() { BlobURLs.revoke(url); }, 1000);
  }

  function palExpGPL() {
    if (!userPalette.length) return;
    var lines = ['GIMP Palette', 'Name: Imagus', 'Columns: 16', '#'];
    for (var i = 0; i < userPalette.length; i++) {
      var h = userPalette[i];
      var r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
      var pad = function(n) { var s = String(n); while (s.length < 3) s = ' ' + s; return s; };
      lines.push(pad(r) + ' ' + pad(g) + ' ' + pad(b) + '\t' + h.toUpperCase());
    }
    var bl = new Blob([lines.join('\n') + '\n'], { type: 'text/plain' });
    var url = BlobURLs.create(bl);
    var a = document.createElement('a');
    a.href = url; a.download = 'palette.gpl'; a.click();
    setTimeout(function() { BlobURLs.revoke(url); }, 1000);
  }

  /* Modal helpers */
  function sMo(h) {
    document.getElementById('mr').innerHTML =
      `<div class="mov" onclick="if(event.target===this)U.cMo()"><div class="mo">${h}</div></div>`;
  }
  function cMo() {
    if (_adjBk) { _adjRe(); _adjBk = null; }
    document.getElementById('mr').innerHTML = '';
  }

  function newFile() {
    sMo(`<h3>New</h3><label>Width<input type="number" id="nw" value="320" min="1" max="4096"></label><label>Height<input type="number" id="nh" value="240" min="1" max="4096"></label><label>Bg<select id="nbg"><option value="transparent">Transparent</option><option value="white">White</option></select></label><div class="mb"><button class="bsc" onclick="U.cMo()">Cancel</button><button class="bp" onclick="U.mkNew()">Create</button></div>`);
  }

  function mkNew() {
    const w = Math.max(1, Math.min(4096, +document.getElementById('nw').value || 320));
    const h = Math.max(1, Math.min(4096, +document.getElementById('nh').value || 240));
    const b2 = document.getElementById('nbg').value;
    cMo(); Hi.clear(); C.init(w, h, b2); An.init();
    if (b2 === 'white') {
      An.frames[0].layers[0].ctx.fillStyle = '#fff';
      An.frames[0].layers[0].ctx.fillRect(0, 0, w, h);
    }
    requestAnimationFrame(() => { C.zFit(); Ly.ui(); uCol(); });
  }

  function imgSize() {
    const ar = C.W / C.H;
    sMo(`<h3>Image Size</h3><p style="font-size:9px;color:var(--txd);margin-bottom:6px">Current: ${C.W} × ${C.H}</p><label>Width<input type="number" id="iw" value="${C.W}" min="1" max="8192"></label><label>Height<input type="number" id="ih" value="${C.H}" min="1" max="8192"></label><label>Lock Ratio<input type="checkbox" id="iar" checked></label><label>Resample<select id="irs"><option value="nearest">Nearest (Pixel Art)</option><option value="bilinear">Bilinear</option></select></label><div class="mb"><button class="bsc" onclick="U.cMo()">Cancel</button><button class="bp" onclick="U.aRsz()">Apply</button></div>`);
    document.getElementById('iw').oninput = function () {
      if (document.getElementById('iar').checked)
        document.getElementById('ih').value = Math.max(1, Math.round(+this.value / ar));
    };
    document.getElementById('ih').oninput = function () {
      if (document.getElementById('iar').checked)
        document.getElementById('iw').value = Math.max(1, Math.round(+this.value * ar));
    };
  }

  function aRsz() {
    const w = Math.max(1, Math.min(8192, +document.getElementById('iw').value));
    const h = Math.max(1, Math.min(8192, +document.getElementById('ih').value));
    if (w > 0 && h > 0) C.resize(w, h);
    cMo();
  }

  function crop() {
    const s = T.selection;
    if (!s || s.w < 1 || s.h < 1) { alert('Select first.'); return; }
    Hi.push();
    const sx = Math.max(0, Math.round(s.x));
    const sy = Math.max(0, Math.round(s.y));
    const sw = Math.min(Math.round(s.w), C.W - sx);
    const sh = Math.min(Math.round(s.h), C.H - sy);
    if (sw < 1 || sh < 1) { alert('Selection out of bounds.'); return; }
    for (const fr of An.frames) {
      for (const ly of fr.layers) {
        const id = ly.ctx.getImageData(sx, sy, sw, sh);
        ly.canvas.width = sw;
        ly.canvas.height = sh;
        ly.ctx.putImageData(id, 0, 0);

        if (ly.mask) {
          const mid = ly.mask.ctx.getImageData(sx, sy, sw, sh);
          ly.mask.canvas.width = sw;
          ly.mask.canvas.height = sh;
          ly.mask.ctx = ly.mask.canvas.getContext('2d', { willReadFrequently: true });
          ly.mask.ctx.imageSmoothingEnabled = false;
          ly.mask.ctx.putImageData(mid, 0, 0);
        }
      }
    }
    C.init(sw, sh, C.bg); T.selection = null;
    requestAnimationFrame(() => { C.zFit(); Ly.ui(); });
  }

  function trim() {
    let x0 = C.W, y0 = C.H, x1 = 0, y1 = 0, found = false;
    const fr = An.frames[An.cf];
    for (const ly of fr.layers) {
      const d = ly.ctx.getImageData(0, 0, C.W, C.H).data;
      for (let y = 0; y < C.H; y++) {
        for (let x = 0; x < C.W; x++) {
          if (d[(y * C.W + x) * 4 + 3] > 0) {
            found = true;
            if (x < x0) x0 = x; if (y < y0) y0 = y;
            if (x > x1) x1 = x; if (y > y1) y1 = y;
          }
        }
      }
    }
    if (!found) { alert('Fully transparent.'); return; }
    const nw = x1 - x0 + 1, nh = y1 - y0 + 1;
    if (nw === C.W && nh === C.H) { alert('Nothing to trim.'); return; }
    Hi.push();
    for (const frm of An.frames) {
      for (const ly of frm.layers) {
        const id = ly.ctx.getImageData(x0, y0, nw, nh);
        ly.canvas.width = nw;
        ly.canvas.height = nh;
        ly.ctx.putImageData(id, 0, 0);

        if (ly.mask) {
          const mid = ly.mask.ctx.getImageData(x0, y0, nw, nh);
          ly.mask.canvas.width = nw;
          ly.mask.canvas.height = nh;
          ly.mask.ctx = ly.mask.canvas.getContext('2d', { willReadFrequently: true });
          ly.mask.ctx.imageSmoothingEnabled = false;
          ly.mask.ctx.putImageData(mid, 0, 0);
            }
        }
    }
    C.init(nw, nh, C.bg); T.selection = null;
    requestAnimationFrame(() => { C.zFit(); Ly.ui(); });
  }

  function shiftPx(dx, dy) {
    const la = T.activeLayer(); if (!la) return;
    Hi.push();
    const id = la.ctx.getImageData(0, 0, C.W, C.H);
    la.ctx.clearRect(0, 0, C.W, C.H);
    la.ctx.putImageData(id, dx, dy);
    C.render(); Ly.ui();
  }

  function gridCfg() {
    sMo(`<h3>Grid</h3><label>Size<input type="number" id="gss" value="${C.gsz}" min="1" max="256"></label><label>Color<input type="color" id="gcol" value="${C.gridColor}" style="width:40px;height:22px;padding:0;border:none"></label><label>Opacity%<input type="range" id="gopa" min="5" max="100" value="${Math.round(C.gridAlpha * 100)}" style="width:70px" oninput="this.nextElementSibling.textContent=this.value"><span>${Math.round(C.gridAlpha * 100)}</span></label><label>Thick<input type="range" id="gthk" min="1" max="5" value="${C.gridThick}" style="width:50px" oninput="this.nextElementSibling.textContent=this.value"><span>${C.gridThick}</span></label><div class="sep"></div><label>Guide H<input type="checkbox" id="ggh" ${C.guideH ? 'checked' : ''}></label><label>Guide V<input type="checkbox" id="ggv" ${C.guideV ? 'checked' : ''}></label><label>GH pos<input type="range" id="ghy" min="0" max="100" value="${Math.round(C.guideHY * 100)}" style="width:70px"></label><label>GV pos<input type="range" id="gvx" min="0" max="100" value="${Math.round(C.guideVX * 100)}" style="width:70px"></label><div class="mb"><button class="bsc" onclick="U.cMo()">Cancel</button><button class="bp" onclick="U.applyGrid()">OK</button></div>`);
  }

  function applyGrid() {
    C.gsz = +document.getElementById('gss').value || 8;
    C.gridColor = document.getElementById('gcol').value;
    C.gridAlpha = (+document.getElementById('gopa').value) / 100;
    C.gridThick = +document.getElementById('gthk').value;
    C.guideH = document.getElementById('ggh').checked;
    C.guideV = document.getElementById('ggv').checked;
    C.guideHY = (+document.getElementById('ghy').value) / 100;
    C.guideVX = (+document.getElementById('gvx').value) / 100;
    C.render(); cMo();
  }

  function checkerCfg() {
    sMo(`<h3>Checker</h3><label>Size<input type="number" id="cksz" value="${C.ckSize}" min="1" max="64"></label><label>Color 1<input type="color" id="ckc1" value="${C.ckCol1 || '#606070'}" style="width:40px;height:20px;padding:0"></label><label>Color 2<input type="color" id="ckc2" value="${C.ckCol2 || '#505060'}" style="width:40px;height:20px;padding:0"></label><label><button class="bsc" style="font-size:8px;padding:1px 4px" onclick="document.getElementById('ckc1').value='';document.getElementById('ckc2').value=''">Reset to Theme</button></label><div class="mb"><button class="bsc" onclick="U.cMo()">Cancel</button><button class="bp" onclick="C.ckSize=Math.max(1,+document.getElementById('cksz').value||8);C.ckCol1=document.getElementById('ckc1').value;C.ckCol2=document.getElementById('ckc2').value;U.cMo()">OK</button></div>`);
  }

  function tiledCfg() {
    sMo(`<h3>Tiled Mode</h3><label>Mode<select id="tm_mode"><option value="off"${C.tiledMode === 'off' ? ' selected' : ''}>Off</option><option value="x"${C.tiledMode === 'x' ? ' selected' : ''}>X</option><option value="y"${C.tiledMode === 'y' ? ' selected' : ''}>Y</option><option value="both"${C.tiledMode === 'both' ? ' selected' : ''}>Both</option></select></label><div class="mb"><button class="bsc" onclick="U.cMo()">Cancel</button><button class="bp" onclick="C.tiledMode=document.getElementById('tm_mode').value;U.cMo()">OK</button></div>`);
  }

  function textDlg(x, y) {
    sMo(`<h3>Text</h3><label>Text<input type="text" id="tt" value="Hello" style="width:120px"></label><label>Size<input type="number" id="tsz" value="16" min="4" max="256"></label><label>Font<select id="tf"><option>monospace</option><option>serif</option><option>sans-serif</option><option>cursive</option></select></label><label>Bold<input type="checkbox" id="tbb"></label><label>Outline<input type="checkbox" id="tol"></label><label>Outline W<input type="number" id="tolw" value="2" min="1" max="16" style="width:40px"></label><div class="mb"><button class="bsc" onclick="U.cMo()">Cancel</button><button class="bp" onclick="U.aTxt(${x},${y})">Add</button></div>`);
  }

  function aTxt(x, y) {
    const la = T.activeLayer(); if (!la) return;
    Hi.push();
    const txt = document.getElementById('tt').value;
    const font = `${document.getElementById('tbb').checked ? 'bold ' : ''}${+document.getElementById('tsz').value}px ${document.getElementById('tf').value}`;
    T.runSelectedEdit(la, ctx => {
      ctx.font = font;
      ctx.textBaseline = 'top';

      if (document.getElementById('tol').checked) {
        ctx.strokeStyle = C.sc;
        ctx.lineWidth = +document.getElementById('tolw').value;
        ctx.lineJoin = 'round';
        ctx.strokeText(txt, x, y);
      }

      ctx.fillStyle = C.pc;
      ctx.fillText(txt, x, y);
    });
    cMo(); C.render(); Ly.ui();
  }

  function brushCfg() {
    sMo(`<h3>Custom Brush Settings (C)</h3>
<p style="font-size:9px;color:var(--acc);margin-bottom:8px;font-weight:600">Active only when shape = <b>C</b>. Select ● or ■ for normal brush.</p>
<label>Spacing (px)<input type="range" id="bs_sp" min="0" max="50" value="${T.bSpacing}" style="width:100px" oninput="this.nextElementSibling.textContent=this.value"><span>${T.bSpacing}</span></label>
<p style="font-size:8px;color:var(--txd)">0=continuous. Higher=dots further apart.</p>
<label>Min Diameter<input type="range" id="bs_md" min="1" max="32" value="${T.bMinDiam}" style="width:100px" oninput="this.nextElementSibling.textContent=this.value"><span>${T.bMinDiam}</span></label>
<p style="font-size:8px;color:var(--txd)">Minimum brush size for tapering effects.</p>
<label>Scatter<input type="range" id="bs_sc" min="0" max="20" value="${T.bScatter}" style="width:100px" oninput="this.nextElementSibling.textContent=this.value"><span>${T.bScatter}</span></label>
<p style="font-size:8px;color:var(--txd)">Random offset for spray/texture effects.</p>
<div class="mb"><button class="bsc" onclick="U.cMo()">Cancel</button><button class="bp" onclick="T.bSpacing=+document.getElementById('bs_sp').value;T.bMinDiam=+document.getElementById('bs_md').value;T.bScatter=+document.getElementById('bs_sc').value;U.cMo()">OK</button></div>`);
  }

  function curves() {
    if (!_adjSv()) return;
    sMo(`<h3>Curves</h3>
<canvas id="cv_crv" width="256" height="256" style="background:#111;border:1px solid var(--bd);cursor:crosshair;display:block;margin:0 auto 8px"></canvas>
<p style="font-size:8px;color:var(--txd);text-align:center">Click to add points. Drag to adjust. Right-click to remove.</p>
<label>Channel<select id="cv_ch"><option value="rgb">RGB</option><option value="r">Red</option><option value="g">Green</option><option value="b">Blue</option></select></label>
<div class="mb"><button class="bsc" onclick="U._adjCancel()">Cancel</button><button class="bp" onclick="U.apCurves()">Apply</button></div>`);
    /* Initialize curves state */
    const cvs = document.getElementById('cv_crv');
    const cx = cvs.getContext('2d');
    const pts = { rgb: [{x:0,y:0},{x:255,y:255}], r: [{x:0,y:0},{x:255,y:255}], g: [{x:0,y:0},{x:255,y:255}], b: [{x:0,y:0},{x:255,y:255}] };
    let dragPt = null, curCh = 'rgb';
    window._cvPts = pts;
    window._cvCh = () => curCh;
    function drawCurve() {
      cx.clearRect(0, 0, 256, 256);
      cx.strokeStyle = '#333'; cx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) { const p = i * 64; cx.beginPath(); cx.moveTo(p,0); cx.lineTo(p,256); cx.stroke(); cx.beginPath(); cx.moveTo(0,p); cx.lineTo(256,p); cx.stroke(); }
      cx.strokeStyle = '#555'; cx.setLineDash([2,2]); cx.beginPath(); cx.moveTo(0,256); cx.lineTo(256,0); cx.stroke(); cx.setLineDash([]);
      const lut = buildLUT(pts[curCh]);
      const col = curCh === 'r' ? '#f44' : curCh === 'g' ? '#4f4' : curCh === 'b' ? '#44f' : '#fff';
      cx.strokeStyle = col; cx.lineWidth = 2; cx.beginPath();
      for (let i = 0; i < 256; i++) { const y = 255 - lut[i]; if (i === 0) cx.moveTo(i, y); else cx.lineTo(i, y); }
      cx.stroke();
      for (const p of pts[curCh]) { cx.fillStyle = col; cx.beginPath(); cx.arc(p.x, 255 - p.y, 5, 0, Math.PI * 2); cx.fill(); cx.strokeStyle = '#000'; cx.lineWidth = 1; cx.stroke(); }
      applyCurvesPreview();
    }
    function buildLUT(points) {
      const sorted = [...points].sort((a, b) => a.x - b.x);
      const lut = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        let lo = sorted[0], hi = sorted[sorted.length - 1];
        for (let j = 0; j < sorted.length - 1; j++) { if (sorted[j].x <= i && sorted[j+1].x >= i) { lo = sorted[j]; hi = sorted[j+1]; break; } }
        const range = hi.x - lo.x;
        const t = range > 0 ? (i - lo.x) / range : 0;
        const st = t * t * (3 - 2 * t);
        lut[i] = Math.max(0, Math.min(255, Math.round(lo.y + (hi.y - lo.y) * st)));
      }
      return lut;
    }
    function applyCurvesPreview() {
      const la = T.activeLayer(); if (!la || !_adjBk) return;
      const src = _adjBk.data;
      const id = la.ctx.createImageData(C.W, C.H), d = id.data;
      const lutR = buildLUT(pts.r), lutG = buildLUT(pts.g), lutB = buildLUT(pts.b), lutRGB = buildLUT(pts.rgb);
      for (let i = 0; i < src.length; i += 4) {
        d[i + 3] = src[i + 3];
        if (!src[i + 3]) continue;
        d[i] = lutR[lutRGB[src[i]]]; d[i+1] = lutG[lutRGB[src[i+1]]]; d[i+2] = lutB[lutRGB[src[i+2]]];
      }
      _putWithSelection(la, id, _adjBk);
      C.render();
    }
    window._cvBuildLUT = buildLUT;
    cvs.onmousedown = e => {
      const r = cvs.getBoundingClientRect();
      const mx = Math.round(e.clientX - r.left), my = Math.round(255 - (e.clientY - r.top));
      if (e.button === 2) { const cp = pts[curCh]; if (cp.length > 2) { let best = -1, bd = 1e9; for (let i = 1; i < cp.length - 1; i++) { const d = Math.abs(cp[i].x - mx) + Math.abs(cp[i].y - my); if (d < bd) { bd = d; best = i; } } if (best > 0 && bd < 20) cp.splice(best, 1); } drawCurve(); return; }
      let found = -1;
      for (let i = 0; i < pts[curCh].length; i++) { if (Math.abs(pts[curCh][i].x - mx) < 10 && Math.abs(pts[curCh][i].y - my) < 10) { found = i; break; } }
      if (found >= 0) { dragPt = found; } else { pts[curCh].push({x: mx, y: my}); pts[curCh].sort((a,b) => a.x - b.x); dragPt = pts[curCh].findIndex(p => p.x === mx && p.y === my); }
      drawCurve();
    };
    cvs.onmousemove = e => { if (dragPt === null) return; const r = cvs.getBoundingClientRect(); const p = pts[curCh][dragPt]; if (dragPt > 0 && dragPt < pts[curCh].length - 1) p.x = Math.max(1, Math.min(254, Math.round(e.clientX - r.left))); p.y = Math.max(0, Math.min(255, Math.round(255 - (e.clientY - r.top)))); drawCurve(); };
    cvs.onmouseup = () => { dragPt = null; };
    cvs.oncontextmenu = e => e.preventDefault();
    document.getElementById('cv_ch').onchange = function() { curCh = this.value; drawCurve(); };
    drawCurve();
  }

  function effectsPanel() {
    if (!_adjSv()) return;
    sMo(`<h3>Effects Panel</h3>
<label>Effect<select id="fx_type" onchange="U.prevFx()">
<option value="bayer_dither">Bayer Dither</option>
<option value="floyd_dither">Floyd-Steinberg Dither</option>
<option value="atkinson_dither">Atkinson Dither</option>
<option value="golden_dither">Golden Ratio Dither</option>
<option value="ordered_dots">Ordered Dots</option>
<option value="pixelate">Pixelate</option>
<option value="posterize">Posterize</option>
<option value="vhs_glitch">VHS Glitch</option>
<option value="chromatic">Chromatic Aberration</option>
<option value="scanlines">CRT Scanlines</option>
</select></label>
<label>Intensity<input type="range" id="fx_int" min="1" max="100" value="50" style="width:120px" oninput="this.nextElementSibling.textContent=this.value;U.prevFx()"><span>50</span></label>
<label>Levels<input type="range" id="fx_lv" min="2" max="32" value="4" style="width:100px" oninput="this.nextElementSibling.textContent=this.value;U.prevFx()"><span>4</span></label>
<label>Scale<input type="range" id="fx_sc" min="1" max="32" value="4" style="width:100px" oninput="this.nextElementSibling.textContent=this.value;U.prevFx()"><span>4</span></label>
<label>Offset<input type="range" id="fx_off" min="0" max="50" value="5" style="width:100px" oninput="this.nextElementSibling.textContent=this.value;U.prevFx()"><span>5</span></label>
<label>Golden φ<input type="checkbox" id="fx_phi" onchange="U.prevFx()"></label>
<div class="mb"><button class="bsc" onclick="U._adjCancel()">Cancel</button><button class="bsc" onclick="U.prevFx()">Preview</button><button class="bp" onclick="U.apEffect()">Apply</button></div>`);
    setTimeout(() => prevFx(), 50);
  }

  function prevFx() {
    const la = T.activeLayer(); if (!la || !_adjBk) return;
    const fx = document.getElementById('fx_type').value;
    const intensity = +document.getElementById('fx_int').value / 100;
    const levels = +document.getElementById('fx_lv').value;
    const scale = +document.getElementById('fx_sc').value;
    const offset = +document.getElementById('fx_off').value;
    const usePhi = document.getElementById('fx_phi').checked;
    const PHI = 1.6180339887;
    const w = C.W, h = C.H, src = _adjBk.data;
    const id = la.ctx.createImageData(w, h), d = id.data;
    for (let i = 0; i < src.length; i++) d[i] = src[i];

    const step = levels > 1 ? 255 / (levels - 1) : 255;
    const B8 = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];

    if (fx === 'bayer_dither') {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4; if (!d[i+3]) continue;
        const thr = (B8[(y & 7) * 8 + (x & 7)] / 64 - 0.5) * step * intensity;
        for (let ch = 0; ch < 3; ch++) d[i+ch] = Math.max(0, Math.min(255, Math.round((d[i+ch] + thr) / step) * step));
      }
    } else if (fx === 'floyd_dither') {
      const buf = new Float32Array(w * h * 3);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y*w+x); const si = i*4; buf[i*3]=d[si]; buf[i*3+1]=d[si+1]; buf[i*3+2]=d[si+2]; }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y*w+x, si = i*4; if (!d[si+3]) continue;
        for (let ch = 0; ch < 3; ch++) {
          const old = buf[i*3+ch]; const nv = Math.round(old / step) * step;
          buf[i*3+ch] = nv; const err = (old - nv) * intensity;
          if (x+1<w) buf[(i+1)*3+ch]+=err*7/16;
          if (y+1<h) { if (x>0) buf[(i+w-1)*3+ch]+=err*3/16; buf[(i+w)*3+ch]+=err*5/16; if (x+1<w) buf[(i+w+1)*3+ch]+=err*1/16; }
        }
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i=y*w+x,si=i*4; if(!d[si+3])continue; d[si]=Math.max(0,Math.min(255,Math.round(buf[i*3]))); d[si+1]=Math.max(0,Math.min(255,Math.round(buf[i*3+1]))); d[si+2]=Math.max(0,Math.min(255,Math.round(buf[i*3+2]))); }
    } else if (fx === 'atkinson_dither') {
      const buf = new Float32Array(w * h * 3);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i=y*w+x,si=i*4; buf[i*3]=d[si]; buf[i*3+1]=d[si+1]; buf[i*3+2]=d[si+2]; }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i=y*w+x,si=i*4; if(!d[si+3])continue;
        for (let ch = 0; ch < 3; ch++) {
          const old=buf[i*3+ch]; const nv=Math.round(old/step)*step; buf[i*3+ch]=nv;
          const err=(old-nv)*intensity/8;
          const nb=[[1,0],[2,0],[-1,1],[0,1],[1,1],[0,2]];
          for (const [dx,dy] of nb) { const nx=x+dx,ny=y+dy; if(nx>=0&&nx<w&&ny>=0&&ny<h) buf[(ny*w+nx)*3+ch]+=err; }
        }
      }
      for (let y=0;y<h;y++) for (let x=0;x<w;x++) { const i=y*w+x,si=i*4; if(!d[si+3])continue; for(let ch=0;ch<3;ch++) d[si+ch]=Math.max(0,Math.min(255,Math.round(buf[i*3+ch]))); }
    } else if (fx === 'golden_dither') {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i=(y*w+x)*4; if(!d[i+3])continue;
        const gx = (x * PHI) % 1, gy = (y * PHI) % 1;
        const thr = (((gx + gy * PHI) % 1) - 0.5) * step * intensity;
        for (let ch=0;ch<3;ch++) d[i+ch]=Math.max(0,Math.min(255,Math.round((d[i+ch]+thr)/step)*step));
      }
    } else if (fx === 'ordered_dots') {
      const sz = Math.max(2, scale);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i=(y*w+x)*4; if(!d[i+3])continue;
        const cx2=(x%sz)-sz/2+0.5, cy2=(y%sz)-sz/2+0.5;
        const dist=Math.sqrt(cx2*cx2+cy2*cy2)/(sz*0.707);
        const thr=(dist-0.5)*step*intensity;
        for (let ch=0;ch<3;ch++) d[i+ch]=Math.max(0,Math.min(255,Math.round((d[i+ch]+thr)/step)*step));
      }
    } else if (fx === 'pixelate') {
      const sz = Math.max(2, scale);
      for (let by = 0; by < h; by += sz) for (let bx = 0; bx < w; bx += sz) {
        let sr=0,sg=0,sb=0,cnt=0;
        for (let dy=0;dy<sz&&by+dy<h;dy++) for (let dx=0;dx<sz&&bx+dx<w;dx++) { const i=((by+dy)*w+(bx+dx))*4; if(d[i+3]) { sr+=d[i]; sg+=d[i+1]; sb+=d[i+2]; cnt++; } }
        if (!cnt) continue;
        sr=Math.round(sr/cnt); sg=Math.round(sg/cnt); sb=Math.round(sb/cnt);
        for (let dy=0;dy<sz&&by+dy<h;dy++) for (let dx=0;dx<sz&&bx+dx<w;dx++) { const i=((by+dy)*w+(bx+dx))*4; if(d[i+3]) { d[i]=sr; d[i+1]=sg; d[i+2]=sb; } }
      }
    } else if (fx === 'posterize') {
      for (let i=0;i<d.length;i+=4) { if(!d[i+3])continue; for(let ch=0;ch<3;ch++) d[i+ch]=Math.round(d[i+ch]/step)*step; }
    } else if (fx === 'vhs_glitch') {
      for (let y=0;y<h;y++) { const shift=Math.round((Math.random()-0.5)*offset*intensity*2);
        for (let x=0;x<w;x++) { const si=(y*w+x)*4, sx=Math.max(0,Math.min(w-1,x+shift)); const gi=(y*w+sx)*4;
          d[si]=src[gi]; d[si+1]=src[Math.max(0,(y*w+Math.min(w-1,x+shift+Math.round(offset/2)))*4+1)]; d[si+2]=src[Math.max(0,(y*w+Math.max(0,x+shift-Math.round(offset/2)))*4+2)]; d[si+3]=src[si+3];
        }
      }
    } else if (fx === 'chromatic') {
      const off = Math.round(offset * intensity);
      for (let y=0;y<h;y++) for (let x=0;x<w;x++) { const i=(y*w+x)*4;
        d[i]=src[(y*w+Math.min(w-1,x+off))*4]||0; d[i+1]=src[i+1]; d[i+2]=src[(y*w+Math.max(0,x-off))*4+2]||0; d[i+3]=src[i+3];
      }
    } else if (fx === 'scanlines') {
      const gap = Math.max(2, scale);
      for (let y=0;y<h;y++) { const dark=y%gap===0?intensity:0;
        for (let x=0;x<w;x++) { const i=(y*w+x)*4; if(!d[i+3])continue;
          d[i]=Math.max(0,Math.round(d[i]*(1-dark))); d[i+1]=Math.max(0,Math.round(d[i+1]*(1-dark))); d[i+2]=Math.max(0,Math.round(d[i+2]*(1-dark)));
        }
      }
    }
    if (usePhi && !['golden_dither','vhs_glitch','chromatic'].includes(fx)) {
      for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
        const i=(y*w+x)*4; if(!d[i+3])continue;
        const keep=((Math.floor(x/PHI)+Math.floor(y/PHI))%2===0);
        if (!keep) { const blend=0.5; for(let ch=0;ch<3;ch++) d[i+ch]=Math.round(d[i+ch]*blend+src[i+ch]*(1-blend)); }
      }
    }
    _putWithSelection(la, id, _adjBk);
    C.render();
  }

  function apEffect() {
    const la = T.activeLayer();
    if (!la || !_adjBk) { _adjBk = null; cMo(); return; }
    la.ctx.putImageData(_adjBk, 0, 0);
    Hi.push(); prevFx();
    _adjBk = null; cMo(); Ly.ui();
  }

  function apCurves() {
    const la = T.activeLayer();
    if (!la || !_adjBk) { _adjBk = null; cMo(); return; }
    la.ctx.putImageData(_adjBk, 0, 0);
    Hi.push();
    /* Re-apply the curves */
    const pts = window._cvPts;
    const buildLUT = window._cvBuildLUT;
    const src = la.ctx.getImageData(0, 0, C.W, C.H);
    const d = src.data;
    const lutR = buildLUT(pts.r), lutG = buildLUT(pts.g), lutB = buildLUT(pts.b), lutRGB = buildLUT(pts.rgb);
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      d[i] = lutR[lutRGB[d[i]]]; d[i+1] = lutG[lutRGB[d[i+1]]]; d[i+2] = lutB[lutRGB[d[i+2]]];
    }
    _putWithSelection(la, src, _adjBk);
    _adjBk = null; cMo(); C.render(); Ly.ui();
  }

  function togTheme() {
    const h = document.documentElement;
    h.dataset.theme = h.dataset.theme === 'light' ? '' : 'light';
    setTimeout(() => C.mkCk(), 50);
    setTimeout(() => C.render(), 100);
  }

  function togCvOnly() {
    document.getElementById('app').classList.toggle('cv-only');
    setTimeout(() => C.zFit(), 50);
  }

  function pxCount() {
    const la = T.activeLayer(); let cnt = 0;
    if (la) {
      const d = la.ctx.getImageData(0, 0, C.W, C.H).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) cnt++;
    }
    sMo(`<h3>Pixel Count</h3><p style="font-size:11px">Layer: <b>${cnt}</b> · Canvas: ${C.W}×${C.H} = ${C.W * C.H}</p><div class="mb"><button class="bp" onclick="U.cMo()">OK</button></div>`);
  }

  function showKeys() {
      sMo(`<h3>Shortcuts</h3><div style="font-size:9px;line-height:1.7;max-height:140px;overflow-y:auto;margin-bottom:8px">B Brush · E Eraser · A Airbrush · J Jumble · K Light/Dark · D Gradient · G Fill<br>I Picker · V Move · H Pan · Z Zoom · S Smooth · T Text<br>M Select · O Contour · W Wand · L Line · R Rect · C Ellipse<br>1 Prev · 2 Next · 3 GoTo · 4 Play · 5 Onion · 0 All Frames<br>SymH & SymV (Alt+Drag – Move axis)<br>Arrow Keys = Shift 1px · = Brush Size Up · - Brush Size Down · X Swap<br>Ctrl+Z/Y · Ctrl+C/V/X · Ctrl+A · Ctrl+S<br>Space=Pan · Alt=Picker · Enter=Apply · Esc=Deselect · F11<br>Ctrl+Click=Select Layer · Ctrl+Right-Drag=Move Layer</div><label>Edit (JSON):</label><textarea id="keyjson">${JSON.stringify(KEYS, null, 2)}</textarea><div class="mb"><button class="bsc" onclick="U.cMo()">Cancel</button><button class="bp" onclick="U.apK()">Apply</button></div>`);
    }

  function apK() {
    try { KEYS = JSON.parse(document.getElementById('keyjson').value); cMo(); }
    catch (e2) { alert('Invalid JSON'); }
  }

  function svKF() {
    const b = new Blob([JSON.stringify(KEYS, null, 2)], { type: 'application/json' });
    const url = BlobURLs.create(b);
    const a = document.createElement('a');
    a.href = url; a.download = 'imagus-keys.json'; a.click();
    setTimeout(() => BlobURLs.revoke(url), 1000);
  }

  function ldKF() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.onchange = async () => {
      try { KEYS = JSON.parse(await inp.files[0].text()); cMo(); }
      catch (e2) { alert('Bad JSON'); }
    };
    inp.click();
  }

  /* Adjustment preview system */
  let _adjBk = null;

  function _adjSv() {
    const la = T.activeLayer(); if (!la) return null;
    if (la.locked) { alert('Layer is locked.'); return null; }
    _adjBk = la.ctx.getImageData(0, 0, C.W, C.H);
    return la;
  }

  function _adjRe() {
    const la = T.activeLayer();
    if (!la || !_adjBk) return;
    la.ctx.putImageData(_adjBk, 0, 0);
    C.render();
  }

  function _adjCancel() { _adjRe(); _adjBk = null; cMo(); }

  function _putWithSelection(la, id, backup = null) {
    if (!la) return;
    if (backup) la.ctx.putImageData(backup, 0, 0);
    T.runSelectedEdit(la, ctx => ctx.putImageData(id, 0, 0));
  }

  /* Brightness/Contrast */
  function briCon() {
    if (!_adjSv()) return;
    sMo(`<h3>Brightness/Contrast</h3><label>Brightness<input type="range" id="adj_bri" min="-100" max="100" value="0" style="width:120px" oninput="this.nextElementSibling.textContent=this.value;U.prevBC()"><span>0</span></label><label>Contrast<input type="range" id="adj_con" min="-100" max="100" value="0" style="width:120px" oninput="this.nextElementSibling.textContent=this.value;U.prevBC()"><span>0</span></label><div class="mb"><button class="bsc" onclick="U._adjCancel()">Cancel</button><button class="bp" onclick="U.apBC()">Apply</button></div>`);
  }

  function prevBC() {
    const la = T.activeLayer(); if (!la || !_adjBk) return;
    const bri = +document.getElementById('adj_bri').value;
    const con = +document.getElementById('adj_con').value;
    const src = _adjBk.data;
    const id = la.ctx.createImageData(C.W, C.H), d = id.data;
    const cf2 = (259 * (con + 255)) / (255 * (259 - con));
    for (let i = 0; i < src.length; i += 4) {
      d[i + 3] = src[i + 3];
      if (!src[i + 3]) { d[i] = d[i + 1] = d[i + 2] = 0; continue; }
      for (let ch = 0; ch < 3; ch++) {
        let v = src[i + ch] + bri;
        v = cf2 * (v - 128) + 128;
        d[i + ch] = Math.max(0, Math.min(255, Math.round(v)));
      }
    }
    _putWithSelection(la, id, _adjBk);
    C.render();
  }

  function apBC() {
    const la = T.activeLayer();
    if (!la || !_adjBk) { _adjBk = null; cMo(); return; }
    la.ctx.putImageData(_adjBk, 0, 0);
    Hi.push(); prevBC();
    _adjBk = null; cMo(); Ly.ui();
  }

  /* Desaturate */
  function desat() {
    const la = T.activeLayer(); if (!la) return;
    Hi.push();
    const id = la.ctx.getImageData(0, 0, C.W, C.H), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const g = Math.round(d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114);
      d[i] = d[i + 1] = d[i + 2] = g;
    }
    _putWithSelection(la, id);
    C.render(); Ly.ui();
  }

  /* Invert */
  function invertCol() {
    const la = T.activeLayer(); if (!la) return;
    Hi.push();
    const sel2 = T.selection;
    const id = la.ctx.getImageData(0, 0, C.W, C.H), d = id.data;
    const sx = sel2 ? Math.max(0, Math.round(sel2.x)) : 0;
    const sy = sel2 ? Math.max(0, Math.round(sel2.y)) : 0;
    const sx2 = sel2 ? Math.min(C.W, sx + Math.round(sel2.w)) : C.W;
    const sy2 = sel2 ? Math.min(C.H, sy + Math.round(sel2.h)) : C.H;
    for (let y = sy; y < sy2; y++) {
       for (let x = sx; x < sx2; x++) {
        if (sel2 && sel2.mask && !T.selectionHit(x, y)) continue;
        const i = (y * C.W + x) * 4;
        if (!d[i + 3]) continue;
        d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2];
      }
    }
    la.ctx.putImageData(id, 0, 0); C.render(); Ly.ui();
  }

  /* Levels */
  function levels() {
    if (!_adjSv()) return;
    sMo(`<h3>Levels</h3><label>Black<input type="range" id="lv_bi" min="0" max="254" value="0" style="width:100px" oninput="this.nextElementSibling.textContent=this.value;U.prevLv()"><span>0</span></label><label>White<input type="range" id="lv_wi" min="1" max="255" value="255" style="width:100px" oninput="this.nextElementSibling.textContent=this.value;U.prevLv()"><span>255</span></label><label>Gamma<input type="range" id="lv_gm" min="10" max="300" value="100" style="width:100px" oninput="this.nextElementSibling.textContent=(this.value/100).toFixed(2);U.prevLv()"><span>1.00</span></label><label>Out B<input type="range" id="lv_ob" min="0" max="254" value="0" style="width:100px" oninput="this.nextElementSibling.textContent=this.value;U.prevLv()"><span>0</span></label><label>Out W<input type="range" id="lv_ow" min="1" max="255" value="255" style="width:100px" oninput="this.nextElementSibling.textContent=this.value;U.prevLv()"><span>255</span></label><div class="mb"><button class="bsc" onclick="U._adjCancel()">Cancel</button><button class="bp" onclick="U.apLv()">Apply</button></div>`);
  }

  function prevLv() {
    const la = T.activeLayer(); if (!la || !_adjBk) return;
    const bi = +document.getElementById('lv_bi').value;
    const wi = Math.max(bi + 1, +document.getElementById('lv_wi').value);
    const gm = (+document.getElementById('lv_gm').value) / 100;
    const ob = +document.getElementById('lv_ob').value;
    const ow = +document.getElementById('lv_ow').value;
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      let v = (i - bi) / (wi - bi);
      v = Math.max(0, Math.min(1, v));
      v = Math.pow(v, 1 / gm);
      lut[i] = Math.max(0, Math.min(255, Math.round(ob + v * (ow - ob))));
    }
    const src = _adjBk.data, id = la.ctx.createImageData(C.W, C.H), d = id.data;
    for (let i = 0; i < src.length; i += 4) {
      d[i + 3] = src[i + 3];
      if (!src[i + 3]) { d[i] = d[i + 1] = d[i + 2] = 0; continue; }
      d[i] = lut[src[i]]; d[i + 1] = lut[src[i + 1]]; d[i + 2] = lut[src[i + 2]];
    }
    _putWithSelection(la, id, _adjBk);
    C.render();
  }

  function apLv() {
    const la = T.activeLayer();
    if (!la || !_adjBk) { _adjBk = null; cMo(); return; }
    la.ctx.putImageData(_adjBk, 0, 0);
    Hi.push(); prevLv();
    _adjBk = null; cMo(); Ly.ui();
  }

  /* HSL helpers for Hue/Saturation */
  function _r2h(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h;
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return [h, s, l];
  }

  function _h2r(h, s, l) {
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < .5) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [
      Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
    ];
  }

  /* Hue/Saturation */
  function hueSat() {
    if (!_adjSv()) return;
    sMo(`<h3>Hue/Saturation</h3><label>Hue<input type="range" id="adj_hue" min="-180" max="180" value="0" style="width:120px" oninput="this.nextElementSibling.textContent=this.value;U.prevHS()"><span>0</span></label><label>Sat<input type="range" id="adj_sat" min="-100" max="100" value="0" style="width:120px" oninput="this.nextElementSibling.textContent=this.value;U.prevHS()"><span>0</span></label><label>Light<input type="range" id="adj_lit" min="-100" max="100" value="0" style="width:120px" oninput="this.nextElementSibling.textContent=this.value;U.prevHS()"><span>0</span></label><div class="mb"><button class="bsc" onclick="U._adjCancel()">Cancel</button><button class="bp" onclick="U.apHS()">Apply</button></div>`);
  }

  function prevHS() {
    const la = T.activeLayer(); if (!la || !_adjBk) return;
    const hA = (+document.getElementById('adj_hue').value) / 360;
    const sA = (+document.getElementById('adj_sat').value) / 100;
    const lA = (+document.getElementById('adj_lit').value) / 100;
    const src = _adjBk.data, id = la.ctx.createImageData(C.W, C.H), d = id.data;
    for (let i = 0; i < src.length; i += 4) {
      d[i + 3] = src[i + 3];
      if (!src[i + 3]) { d[i] = d[i + 1] = d[i + 2] = 0; continue; }
      let [h, s, l] = _r2h(src[i], src[i + 1], src[i + 2]);
      h = (h + hA + 1) % 1;
      s = Math.max(0, Math.min(1, s + sA));
      l = Math.max(0, Math.min(1, l + lA));
      const [r, g, b2] = _h2r(h, s, l);
      d[i] = r; d[i + 1] = g; d[i + 2] = b2;
    }
    _putWithSelection(la, id, _adjBk);
    C.render();
  }

  function apHS() {
    const la = T.activeLayer();
    if (!la || !_adjBk) { _adjBk = null; cMo(); return; }
    la.ctx.putImageData(_adjBk, 0, 0);
    Hi.push(); prevHS();
    _adjBk = null; cMo(); Ly.ui();
  }

  /* Blur Image */
  function blurImg() {
    if (!_adjSv()) return;
    sMo(`<h3>Blur Image</h3><label>Radius<input type="range" id="bi_r" min="1" max="20" value="3" style="width:120px" oninput="this.nextElementSibling.textContent=this.value;U.prevBI()"><span>3</span></label><div class="mb"><button class="bsc" onclick="U._adjCancel()">Cancel</button><button class="bp" onclick="U.apBI()">Apply</button></div>`);
    setTimeout(() => prevBI(), 50);
  }

  function _boxBlur(src, out, w, h, r) {
    const ia = 1 / (r + r + 1);
    /* Horizontal pass */
    for (let y = 0; y < h; y++) {
      let ri2 = y * w * 4, ti = ri2;
      const fv = [src[ri2], src[ri2 + 1], src[ri2 + 2], src[ri2 + 3]];
      const lv = [src[ri2 + (w - 1) * 4], src[ri2 + (w - 1) * 4 + 1], src[ri2 + (w - 1) * 4 + 2], src[ri2 + (w - 1) * 4 + 3]];
      const val = [fv[0] * (r + 1), fv[1] * (r + 1), fv[2] * (r + 1), fv[3] * (r + 1)];
      for (let j = 0; j < r; j++) {
        const ci = Math.min(j, w - 1) * 4 + ri2;
        for (let c = 0; c < 4; c++) val[c] += src[ci + c];
      }
      for (let j = 0; j <= r; j++) {
        const ci = Math.min(j + r, w - 1) * 4 + ri2;
        for (let c = 0; c < 4; c++) { val[c] += src[ci + c] - fv[c]; out[ti + c] = Math.round(val[c] * ia); }
        ti += 4;
      }
      for (let j = r + 1; j < w - r; j++) {
        const ci1 = (j + r) * 4 + ri2, ci2 = (j - r - 1) * 4 + ri2;
        for (let c = 0; c < 4; c++) { val[c] += src[ci1 + c] - src[ci2 + c]; out[ti + c] = Math.round(val[c] * ia); }
        ti += 4;
      }
      for (let j = w - r; j < w; j++) {
        const ci2 = (j - r - 1) * 4 + ri2;
        for (let c = 0; c < 4; c++) { val[c] += lv[c] - src[ci2 + c]; out[ti + c] = Math.round(val[c] * ia); }
        ti += 4;
      }
    }
    /* Vertical pass */
    const tmp = new Uint8ClampedArray(out);
    for (let x = 0; x < w; x++) {
      const fv = [tmp[x * 4], tmp[x * 4 + 1], tmp[x * 4 + 2], tmp[x * 4 + 3]];
      const lv = [tmp[x * 4 + (h - 1) * w * 4], tmp[x * 4 + (h - 1) * w * 4 + 1], tmp[x * 4 + (h - 1) * w * 4 + 2], tmp[x * 4 + (h - 1) * w * 4 + 3]];
      const val = [fv[0] * (r + 1), fv[1] * (r + 1), fv[2] * (r + 1), fv[3] * (r + 1)];
      for (let j = 0; j < r; j++) {
        const ci = x * 4 + Math.min(j, h - 1) * w * 4;
        for (let c = 0; c < 4; c++) val[c] += tmp[ci + c];
      }
      for (let j = 0; j <= r; j++) {
        const ci = x * 4 + Math.min(j + r, h - 1) * w * 4, oi = x * 4 + j * w * 4;
        for (let c = 0; c < 4; c++) { val[c] += tmp[ci + c] - fv[c]; out[oi + c] = Math.round(val[c] * ia); }
      }
      for (let j = r + 1; j < h - r; j++) {
        const ci1 = x * 4 + (j + r) * w * 4, ci2 = x * 4 + (j - r - 1) * w * 4, oi = x * 4 + j * w * 4;
        for (let c = 0; c < 4; c++) { val[c] += tmp[ci1 + c] - tmp[ci2 + c]; out[oi + c] = Math.round(val[c] * ia); }
      }
      for (let j = h - r; j < h; j++) {
        const ci2 = x * 4 + (j - r - 1) * w * 4, oi = x * 4 + j * w * 4;
        for (let c = 0; c < 4; c++) { val[c] += lv[c] - tmp[ci2 + c]; out[oi + c] = Math.round(val[c] * ia); }
      }
    }
  }

  function prevBI() {
    const la = T.activeLayer(); if (!la || !_adjBk) return;
    const r = Math.max(1, Math.min(+document.getElementById('bi_r').value, Math.floor((Math.min(C.W, C.H) - 1) / 2)));
    if (r < 1 || C.W < 3 || C.H < 3) return;
    const w = C.W, h = C.H;
    const src = _adjBk.data;
    const t1 = new Uint8ClampedArray(src.length);
    const t2 = new Uint8ClampedArray(src.length);
    _boxBlur(src, t1, w, h, r);
    _boxBlur(t1, t2, w, h, r);
    _boxBlur(t2, t1, w, h, r);
    const id = la.ctx.createImageData(w, h);
    id.data.set(t1);
    _putWithSelection(la, id, _adjBk);
    C.render();
  }

  function apBI() {
    const la = T.activeLayer();
    if (!la || !_adjBk) { _adjBk = null; cMo(); return; }
    la.ctx.putImageData(_adjBk, 0, 0);
    Hi.push(); prevBI();
    _adjBk = null; cMo(); Ly.ui();
  }

  /* Stroke */
  function stroke() {
    if (!_adjSv()) return;
    sMo(`<h3>Stroke</h3><label>Type<select id="sk_tp" onchange="U.prevSk()"><option value="outer">Outer</option><option value="inner">Inner</option></select></label><label>W<input type="range" id="sk_w" min="1" max="32" value="2" style="width:100px" oninput="this.nextElementSibling.textContent=this.value;U.prevSk()"><span>2</span></label><label>Col<input type="color" id="sk_c" value="${C.pc}" style="width:40px;height:20px;padding:0" onchange="U.prevSk()"></label><label>Op%<input type="range" id="sk_op" min="1" max="100" value="100" style="width:80px" oninput="this.nextElementSibling.textContent=this.value;U.prevSk()"><span>100</span></label><div class="mb"><button class="bsc" onclick="U._adjCancel()">Cancel</button><button class="bp" onclick="U.apSk()">Apply</button></div>`);
    setTimeout(() => prevSk(), 50);
  }

  function _bDist(alpha, w, h, ins, mx2) {
    const dist = new Float32Array(w * h);
    dist.fill(1e9);
    const q = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x, op = alpha[i] > 0;
        if (ins ? !op : op) continue;
        let bd = false;
        if (x > 0 && (alpha[i - 1] > 0) !== op) bd = true;
        if (x < w - 1 && (alpha[i + 1] > 0) !== op) bd = true;
        if (y > 0 && (alpha[i - w] > 0) !== op) bd = true;
        if (y < h - 1 && (alpha[i + w] > 0) !== op) bd = true;
        if (bd) { dist[i] = 0; q.push(i); }
      }
    }
    let qi = 0;
    const nb = [[-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1], [-1, -1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [1, 1, 1.414]];
    while (qi < q.length) {
      const ci = q[qi++], cx2 = ci % w, cy2 = (ci - cx2) / w, cd = dist[ci];
      if (cd >= mx2) continue;
      for (const [dx, dy, cost] of nb) {
        const nx = cx2 + dx, ny = cy2 + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx, nd = cd + cost;
        if (nd >= dist[ni]) continue;
        if (ins ? !(alpha[ni] > 0) : alpha[ni] > 0) continue;
        dist[ni] = nd; q.push(ni);
      }
    }
    return dist;
  }

  function prevSk() {
    const la = T.activeLayer(); if (!la || !_adjBk) return;
    const w = C.W, h = C.H, src = _adjBk.data;
    const type = document.getElementById('sk_tp').value;
    const width = +document.getElementById('sk_w').value;
    const color = document.getElementById('sk_c').value;
    const op = +document.getElementById('sk_op').value;
    const alpha = new Uint8Array(w * h);
    for (let i = 0; i < alpha.length; i++) alpha[i] = src[i * 4 + 3];
    const dist = _bDist(alpha, w, h, type === 'inner', width + 1);
    const cr = parseInt(color.slice(1, 3), 16);
    const cg = parseInt(color.slice(3, 5), 16);
    const cb = parseInt(color.slice(5, 7), 16);
    const opa = op / 100;
    const id = la.ctx.createImageData(w, h), d = id.data;
    for (let i = 0; i < w * h; i++) {
      const si = i * 4;
      d[si] = src[si]; d[si + 1] = src[si + 1];
      d[si + 2] = src[si + 2]; d[si + 3] = src[si + 3];
      if (dist[i] < width) {
        const blend = Math.min(1, width - dist[i]) * opa;
        if (type === 'outer') {
          if (!src[si + 3]) {
            d[si] = cr; d[si + 1] = cg; d[si + 2] = cb;
            d[si + 3] = Math.round(blend * 255);
          } else {
            d[si] = Math.round(src[si] * (1 - blend) + cr * blend);
            d[si + 1] = Math.round(src[si + 1] * (1 - blend) + cg * blend);
            d[si + 2] = Math.round(src[si + 2] * (1 - blend) + cb * blend);
            d[si + 3] = Math.max(src[si + 3], Math.round(blend * 255));
          }
        } else if (src[si + 3]) {
          d[si] = Math.round(src[si] * (1 - blend) + cr * blend);
          d[si + 1] = Math.round(src[si + 1] * (1 - blend) + cg * blend);
          d[si + 2] = Math.round(src[si + 2] * (1 - blend) + cb * blend);
        }
      }
    }
    _putWithSelection(la, id, _adjBk);
    C.render();
  }

  function apSk() {
    const la = T.activeLayer();
    if (!la || !_adjBk) { _adjBk = null; cMo(); return; }
    la.ctx.putImageData(_adjBk, 0, 0);
    Hi.push(); prevSk();
    _adjBk = null; cMo(); Ly.ui();
  }

  /* Outline FX (Aseprite-like 1px directional outline) */
  let _outlineFxLivePreview = false;

  function outlineFX() {
    const la = T.activeLayer();
    if (!la) return;
    if (!_adjSv()) return;

    _outlineFxLivePreview = false;

    sMo(`
      <div class="ofx-top">
        <h3 style="margin:0">Outline FX</h3>
        <button class="bsc" onclick="U.closeOutlineFX()">Close</button>
      </div>

      <label>
        Color
        <input
          type="color"
          id="ofx_color"
          value="${C.pc}"
          style="width:48px;height:24px;padding:0"
          oninput="U.previewOutlineFX()"
        >
      </label>

      <div class="ofx-grid">
        <button class="ofx-cell on" data-dx="-1" data-dy="-1" onclick="U.toggleOutlineFXCell(this)" title="Top Left">↖</button>
        <button class="ofx-cell on" data-dx="0"  data-dy="-1" onclick="U.toggleOutlineFXCell(this)" title="Middle Top">↑</button>
        <button class="ofx-cell on" data-dx="1"  data-dy="-1" onclick="U.toggleOutlineFXCell(this)" title="Top Right">↗</button>

        <button class="ofx-cell on" data-dx="-1" data-dy="0"  onclick="U.toggleOutlineFXCell(this)" title="Middle Left">←</button>
        <button class="ofx-cell"    data-dx="0"  data-dy="0"  onclick="U.toggleOutlineFXCell(this)" title="Center">•</button>
        <button class="ofx-cell on" data-dx="1"  data-dy="0"  onclick="U.toggleOutlineFXCell(this)" title="Middle Right">→</button>

        <button class="ofx-cell on" data-dx="-1" data-dy="1"  onclick="U.toggleOutlineFXCell(this)" title="Bottom Left">↙</button>
        <button class="ofx-cell on" data-dx="0"  data-dy="1"  onclick="U.toggleOutlineFXCell(this)" title="Middle Bottom">↓</button>
        <button class="ofx-cell on" data-dx="1"  data-dy="1"  onclick="U.toggleOutlineFXCell(this)" title="Bottom Right">↘</button>
      </div>

      <div class="ofx-checks">
        <label style="justify-content:flex-start;gap:6px">
          <input type="checkbox" id="ofx_outside" checked onchange="U.previewOutlineFX()">
          Outside
        </label>

        <label style="justify-content:flex-start;gap:6px">
          <input type="checkbox" id="ofx_inside" onchange="U.previewOutlineFX()">
          Inside
        </label>
      </div>

      <div class="ofx-bottom">
        <button class="bsc" onclick="U.closeOutlineFX()">Cancel</button>
        <div style="display:flex;gap:var(--sp3)">
          <button class="bsc" onclick="U.applyOutlineFX()">Apply</button>
          <button class="bp" onclick="U.okOutlineFX()">OK</button>
        </div>
      </div>
    `);

    previewOutlineFX();
  }

  function toggleOutlineFXCell(btn) {
    btn.classList.toggle('on');
    previewOutlineFX();
  }

  function _outlineFXReadState() {
    const color = document.getElementById('ofx_color').value || C.pc;
    const outside = document.getElementById('ofx_outside').checked;
    const inside = document.getElementById('ofx_inside').checked;

    const matrix = [...document.querySelectorAll('.ofx-cell')].map(btn => ({
      dx: +btn.dataset.dx,
      dy: +btn.dataset.dy,
      on: btn.classList.contains('on')
    }));

    return { color, outside, inside, matrix };
  }

  function _outlineFXParseColor(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16) || 0,
      g: parseInt(hex.slice(3, 5), 16) || 0,
      b: parseInt(hex.slice(5, 7), 16) || 0,
      a: 255
    };
  }

  function _outlineFXBuildImage(baseImageData, state) {
    const w = baseImageData.width;
    const h = baseImageData.height;
    const src = baseImageData.data;

    const result = new ImageData(new Uint8ClampedArray(src), w, h);
    const dst = result.data;

    const activeOffsets = state.matrix.filter(item => item.on);
    if ((!state.outside && !state.inside) || !activeOffsets.length) return result;

    const color = _outlineFXParseColor(state.color);
    const hasSelection = !!T.selection;
    const bounds = T.selectionBounds ? T.selectionBounds() : null;
    const centerOn = activeOffsets.some(item => item.dx === 0 && item.dy === 0);

    function inBounds(x, y) {
      return x >= 0 && y >= 0 && x < w && y < h;
    }

    function isSelected(x, y) {
      return !hasSelection || T.selectionHit(x, y);
    }

    function isSource(x, y) {
      if (!inBounds(x, y)) return false;
      if (!isSelected(x, y)) return false;
      return src[(y * w + x) * 4 + 3] > 0;
    }

    function isBackground(x, y) {
      if (!inBounds(x, y)) return true;
      if (hasSelection && !isSelected(x, y)) return true;
      return src[(y * w + x) * 4 + 3] === 0;
    }

    let minX = w, minY = h, maxX = -1, maxY = -1;

    const scanX0 = bounds ? bounds.x : 0;
    const scanY0 = bounds ? bounds.y : 0;
    const scanX1 = bounds ? (bounds.x + bounds.w - 1) : (w - 1);
    const scanY1 = bounds ? (bounds.y + bounds.h - 1) : (h - 1);

    for (let y = scanY0; y <= scanY1; y++) {
      for (let x = scanX0; x <= scanX1; x++) {
        if (!isSource(x, y)) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < minX || maxY < minY) return result;

    const x0 = Math.max(0, minX - 1);
    const y0 = Math.max(0, minY - 1);
    const x1 = Math.min(w - 1, maxX + 1);
    const y1 = Math.min(h - 1, maxY + 1);

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = (y * w + x) * 4;
        const source = isSource(x, y);
        let paint = false;

        if (state.outside && !source) {
          for (const item of activeOffsets) {
            if (isSource(x - item.dx, y - item.dy)) {
              paint = true;
              break;
            }
          }
        }

        if (!paint && state.inside && source) {
          if (centerOn) {
            paint = true;
          } else {
            for (const item of activeOffsets) {
              if (item.dx === 0 && item.dy === 0) continue;
              if (isBackground(x + item.dx, y + item.dy)) {
                paint = true;
                break;
              }
            }
          }
        }

        if (!paint) continue;

        dst[i] = color.r;
        dst[i + 1] = color.g;
        dst[i + 2] = color.b;
        dst[i + 3] = color.a;
      }
    }

    return result;
  }

  function previewOutlineFX() {
    const la = T.activeLayer();
    if (!la || !_adjBk) return;

    la.ctx.putImageData(_adjBk, 0, 0);

    const state = _outlineFXReadState();
    const result = _outlineFXBuildImage(_adjBk, state);

    la.ctx.putImageData(result, 0, 0);
    _outlineFxLivePreview = true;

    C.render();
  }

  function applyOutlineFX() {
    const la = T.activeLayer();
    if (!la || !_adjBk) return;

    const state = _outlineFXReadState();

    la.ctx.putImageData(_adjBk, 0, 0);
    Hi.push();

    const result = _outlineFXBuildImage(_adjBk, state);
    la.ctx.putImageData(result, 0, 0);

    _adjBk = la.ctx.getImageData(0, 0, C.W, C.H);
    _outlineFxLivePreview = false;

    C.render();
    Ly.ui();
  }

  function okOutlineFX() {
    const la = T.activeLayer();
    if (!la) {
      _adjBk = null;
      _outlineFxLivePreview = false;
      cMo();
      return;
    }

    if (_outlineFxLivePreview && _adjBk) {
      const state = _outlineFXReadState();

      la.ctx.putImageData(_adjBk, 0, 0);
      Hi.push();

      const result = _outlineFXBuildImage(_adjBk, state);
      la.ctx.putImageData(result, 0, 0);
    }

    _adjBk = null;
    _outlineFxLivePreview = false;
    cMo();

    C.render();
    Ly.ui();
  }

  function closeOutlineFX() {
    const la = T.activeLayer();

    if (la && _adjBk) {
      la.ctx.putImageData(_adjBk, 0, 0);
    }

    _adjBk = null;
    _outlineFxLivePreview = false;
    cMo();

    C.render();
    Ly.ui();
  }

  /* Replace Color */
  function replaceColor() {
    sMo(`<h3>Replace Color</h3><label>Source<input type="color" id="rc_src" value="${C.pc}" style="width:40px;height:20px;padding:0"></label><label>Hex<input type="text" id="rc_srch" value="${C.pc}" maxlength="7" style="width:70px"></label><label>Target<input type="color" id="rc_dst" value="${C.sc}" style="width:40px;height:20px;padding:0"></label><label>Hex<input type="text" id="rc_dsth" value="${C.sc}" maxlength="7" style="width:70px"></label><label>Tol<input type="range" id="rc_tol" min="0" max="128" value="0" style="width:80px" oninput="this.nextElementSibling.textContent=this.value"><span>0</span></label><div class="mb"><button class="bsc" onclick="U.cMo()">Cancel</button><button class="bp" onclick="U.apRC()">Replace</button></div>`);
    document.getElementById('rc_src').oninput = function () { document.getElementById('rc_srch').value = this.value; };
    document.getElementById('rc_dst').oninput = function () { document.getElementById('rc_dsth').value = this.value; };
  }

  function apRC() {
    const la = T.activeLayer(); if (!la) { cMo(); return; }
    Hi.push();
    let sH = document.getElementById('rc_srch').value;
    if (!/^#[0-9a-fA-F]{6}$/.test(sH)) sH = document.getElementById('rc_src').value;
    let dH = document.getElementById('rc_dsth').value;
    if (!/^#[0-9a-fA-F]{6}$/.test(dH)) dH = document.getElementById('rc_dst').value;
    const tl = +document.getElementById('rc_tol').value;
    const sr = parseInt(sH.slice(1, 3), 16), sg = parseInt(sH.slice(3, 5), 16), sb = parseInt(sH.slice(5, 7), 16);
    const dr = parseInt(dH.slice(1, 3), 16), dg = parseInt(dH.slice(3, 5), 16), db = parseInt(dH.slice(5, 7), 16);
    const id = la.ctx.getImageData(0, 0, C.W, C.H), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      if (Math.abs(d[i] - sr) <= tl && Math.abs(d[i + 1] - sg) <= tl && Math.abs(d[i + 2] - sb) <= tl) {
        d[i] = dr; d[i + 1] = dg; d[i + 2] = db;
      }
    }
    _putWithSelection(la, id);
    cMo(); C.render(); Ly.ui();
  }

  /* Color Range */
  function colorRange() {
    sMo(`<h3>Color Range</h3><label>Color<input type="color" id="cr_col" value="${C.pc}" style="width:40px;height:20px;padding:0"></label><label>Hex<input type="text" id="cr_hex" value="${C.pc}" maxlength="7" style="width:70px"></label><label>Tol<input type="range" id="cr_tol" min="0" max="128" value="0" style="width:80px" oninput="this.nextElementSibling.textContent=this.value"><span>0</span></label><div class="mb"><button class="bsc" onclick="U.cMo()">Cancel</button><button class="bp" onclick="U.apCR()">Select</button></div>`);
    document.getElementById('cr_col').oninput = function () { document.getElementById('cr_hex').value = this.value; };
  }

  function apCR() {
    const la = T.activeLayer(); if (!la) { cMo(); return; }
    let hex = document.getElementById('cr_hex').value;
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) hex = document.getElementById('cr_col').value;
    const tl = +document.getElementById('cr_tol').value;
    const sr = parseInt(hex.slice(1, 3), 16), sg = parseInt(hex.slice(3, 5), 16), sb = parseInt(hex.slice(5, 7), 16);
    const d = la.ctx.getImageData(0, 0, C.W, C.H).data;
    let x0 = C.W, y0 = C.H, x1 = 0, y1 = 0, found = false;
    for (let y = 0; y < C.H; y++) {
      for (let x = 0; x < C.W; x++) {
        const i = (y * C.W + x) * 4;
        if (!d[i + 3]) continue;
        if (Math.abs(d[i] - sr) <= tl && Math.abs(d[i + 1] - sg) <= tl && Math.abs(d[i + 2] - sb) <= tl) {
          found = true;
          if (x < x0) x0 = x; if (y < y0) y0 = y;
          if (x > x1) x1 = x; if (y > y1) y1 = y;
        }
      }
    }
    if (found) T.selection = { type: 'rect', x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    else alert('No match.');
    cMo(); C.render();
  }

  /* Tween Dialog */
  function tweenDlg() {
    if (An.frames.length < 2) { alert('Need 2+ frames'); return; }
    let fA = An.cf, fB = -1;
    const sel2 = [...T.selFrames].sort((a, b) => a - b);
    if (sel2.length >= 2) { fA = sel2[0]; fB = sel2[sel2.length - 1]; }
    else if (sel2.length === 1) {
      fA = Math.min(An.cf, sel2[0]); fB = Math.max(An.cf, sel2[0]);
      if (fA === fB) fB = Math.min(fA + 1, An.frames.length - 1);
    } else fB = Math.min(An.cf + 1, An.frames.length - 1);
    if (fA === fB) { alert('Select 2 frames'); return; }
    sMo(`<h3>Tween</h3><label>A<input type="number" id="tw_a" value="${fA + 1}" min="1" max="${An.frames.length}" style="width:50px"></label><label>B<input type="number" id="tw_b" value="${fB + 1}" min="1" max="${An.frames.length}" style="width:50px"></label><label>Count<input type="number" id="tw_n" value="5" min="1" max="100" style="width:50px"></label><label>Ease<select id="tw_ease"><option value="linear">Linear</option><option value="easeIn">In</option><option value="easeOut">Out</option><option value="easeInOut">In-Out</option></select></label><div class="mb"><button class="bsc" onclick="U.cMo()">Cancel</button><button class="bp" onclick="U.apTw()">Generate</button></div>`);
  }

  function apTw() {
    const a = +document.getElementById('tw_a').value - 1;
    const b = +document.getElementById('tw_b').value - 1;
    const n = Math.max(1, Math.min(100, +document.getElementById('tw_n').value || 5));
    const eId = document.getElementById('tw_ease').value;
    if (a < 0 || b < 0 || a >= An.frames.length || b >= An.frames.length || a === b) {
      alert('Invalid'); return;
    }
    cMo();
    An.tween(a, b, n, {
      linear: null,
      easeIn: t => t * t,
      easeOut: t => t * (2 - t),
      easeInOut: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    }[eId]);
    T.selFrames.clear();
  }

  function about() {
    sMo(`<h3>Imagus v1</h3><p style="font-size:10px;line-height:1.5;color:var(--txd)">Professional 2D Drawing & Animation<br>v1: Fixed GIF/WebP animation export · Adaptive history depth<br>Flood fill safety cap · Memory leak fixes · Robust LZW encoder<br>GIF transparency · VP8X animation flag · Null-safe adjustments<br>Improved error handling throughout</p><div class="mb"><button class="bp" onclick="U.cMo()">OK</button></div>`);
  }

  /* Event wiring */
  function iEvt() {
    const a = C.area;
    a.addEventListener('mousedown', e => {
      e.preventDefault();
      const ae = document.activeElement;
      if (ae && ae !== document.body && ae.blur) ae.blur();
      T.onDown(e);
    });
    window.addEventListener('mousemove', e => T.onMove(e));
    window.addEventListener('mouseup', e => T.onUp(e));
    a.addEventListener('contextmenu', e => e.preventDefault());
    a.addEventListener('wheel', e => {
      e.preventDefault();
      C.zoomAt(e.deltaY < 0 ? 1.5 : 1 / 1.5, e.clientX, e.clientY);
    }, { passive: false });
    a.addEventListener('mousemove', function(ev) {
      var p = C.s2c(ev.clientX, ev.clientY);
      _curX = p.x; _curY = p.y; _curOn = true;
      if (ev.buttons === 0 && !T._shiftPreview) C.scheduleRender();
    });
    a.addEventListener('mouseleave', function() { _curOn = false; C.render(); });
    /* Shift-line preview — runs independently of drag system */
    a.addEventListener('mousemove', e => {
      if (e.buttons !== 0) return;
      const ct = T.current;
      if (!e.shiftKey || !['brush', 'eraser'].includes(ct)) {
        if (T._shiftPreview) { T._clearShiftPrev(); C.render(); }
        return;
      }
      const bp = T._getLastBP();
      if (!bp) return;
      const pos = C.s2c(e.clientX, e.clientY);
      T._setShiftPrev(bp.x, bp.y, Math.floor(pos.x), Math.floor(pos.y));
      C.render();
    });

    const lopEl = document.getElementById('lop');
    let _lopUndoPushed = false;
    lopEl.addEventListener('pointerdown', () => { _lopUndoPushed = false; });
    lopEl.addEventListener('input', function () {
      const f = An.frames[An.cf]; if (!f) return;
      const ly = f.layers[f.activeLayer]; if (!ly) return;
      if (!_lopUndoPushed) { Hi.push(); _lopUndoPushed = true; }
      ly.opacity = +this.value;
      document.getElementById('lov').textContent = this.value;
      if (_layerSync) {
        for (const frm of An.frames) {
          const m = Ly._findByName(ly.name, frm);
          if (m && m !== ly) m.opacity = ly.opacity;
        }
      }
      C.render();
    });

    document.getElementById('fdi').addEventListener('change', function () {
      const v = Math.max(1, Math.min(65535, +this.value || 100));
      if (T.selFrames.size > 0)
        for (const i of T.selFrames) if (An.frames[i]) An.frames[i].duration = v;
      const f = An.frames[An.cf];
      if (f) f.duration = v;
      An.uStrip();
    });

    document.addEventListener('keydown', e => {
      if (document.querySelector('.mov')) { if (e.key === 'Escape') cMo(); return; }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const ctrl = e.ctrlKey || e.metaKey, shift = e.shiftKey;

      if (e.key === 'Alt' && !T.ctrlPick) {
       e.preventDefault(); T.ctrlPick = T.current; T.setLight('picker'); return;
      }
      if (e.key === ' ' && !T.spaceDown) { e.preventDefault(); T.spaceDown = true; return; }

      if (!ctrl && !shift) {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); shiftPx(-1, 0); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); shiftPx(1, 0);  return; }
        if (e.key === 'ArrowUp')    { e.preventDefault(); shiftPx(0, -1); return; }
        if (e.key === 'ArrowDown')  { e.preventDefault(); shiftPx(0, 1);  return; }
      }

      if (ctrl) {
        if (shift && e.key === '@') { e.preventDefault(); An.dupF(); return; }
        switch (e.key.toLowerCase()) {
          case 'z': e.preventDefault(); Hi.undo(); break;
          case 'y': e.preventDefault(); Hi.redo(); break;
          case 'c': e.preventDefault(); T.copySel(); break;
          case 'v': e.preventDefault(); T.pasteSel(); break;
          case 'x': e.preventDefault(); T.cutSel(); break;
          case 'a': e.preventDefault(); T.selAll(); break;
          case 's': e.preventDefault(); IO.save(); break;
          case 'o': e.preventDefault(); IO.openImg(); break;
          case '=': case '+': e.preventDefault(); C.zIn(); break;
          case '-': e.preventDefault(); C.zOut(); break;
          case '0': e.preventDefault(); C.zFit(); break;
          case '1': e.preventDefault(); C.z1x(); break;
        }
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 'n') { e.preventDefault(); newFile(); return; }
      if (shift) {
        if (e.key === '!') { e.preventDefault(); An.rmF(); return; }
        if (e.key === '@') { e.preventDefault(); An.addF(); return; }
        if (e.key === '#') { e.preventDefault(); An.dupF(); return; }
      }

      const k = e.key.toLowerCase();
      if (k === '0') { An.selAllF(); return; }

      for (const [tool, key] of Object.entries(KEYS)) {
        if (key === k && !['prevFrame', 'nextFrame', 'goToFrame', 'play', 'onionSkin', 'swapColors'].includes(tool)) {
          T.set(tool); return;
        }
      }

      if (k === KEYS.prevFrame) { An.prev(); return; }
      if (k === KEYS.nextFrame) { An.next(); return; }
      if (k === KEYS.goToFrame) {
        const n = prompt('Go to frame:', '1');
        if (n) An.goTo(parseInt(n) - 1);
        return;
      }
      if (k === KEYS.play) { An.pp(); return; }
      if (k === KEYS.onionSkin) { An.togOnion(); return; }
      if (k === KEYS.swapColors || k === 'x') { [C.pc, C.sc] = [C.sc, C.pc]; uCol(); return; }
      if (k === '=' || k === '+') { T.brushSize = Math.min(64, T.brushSize + 1); uTopt(); return; }
      if (k === '-') { T.brushSize = Math.max(1, T.brushSize - 1); uTopt(); return; }
      if (k === 'q') { togglePxMask(); return; }
      if (e.key === 'Delete') { T.delSel(); return; }
      if (e.key === 'Escape') { T.resetStuck(); T.clrSel(); return; }
      if (e.key === 'F11') { e.preventDefault(); togCvOnly(); return; }
      if (e.key === 'Enter' && T.floating) { T.commitFloat(); return; }
    });

    document.addEventListener('keyup', e => {
      if (e.key === 'Alt' && T.ctrlPick) {
        T.setLight(T.ctrlPick); T.ctrlPick = null;
      }
      if (e.key === ' ') T.spaceDown = false;
      if (e.key === 'Shift' && T._shiftPreview) { T._clearShiftPrev(); C.render(); }
    });

    document.getElementById('topts').addEventListener('mouseup', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') e.target.blur();
    });
    window.addEventListener('blur', () => T.resetStuck());window.addEventListener('blur', () => T.resetStuck());
    window.addEventListener('focus', () => T.resetStuck());
    document.addEventListener('visibilitychange', () => { if (document.hidden) T.resetStuck(); });
  }

  /* Frame Tags Dialog */
  function tagDlg() {
    let h = '<h3>Frame Tags</h3>';
    h += '<div style="max-height:200px;overflow-y:auto;margin-bottom:8px">';
    if (An.tags.length === 0) h += '<p style="font-size:10px;color:var(--txd)">No tags yet</p>';
    An.tags.forEach((t, i) => {
      h += `<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;font-size:10px">`;
      h += `<span style="width:12px;height:12px;background:${t.color};border-radius:2px;flex-shrink:0"></span>`;
      h += `<span style="flex:1">${t.name} (${t.from + 1}–${t.to + 1})</span>`;
      h += `<button class="bsc" style="padding:0 4px;font-size:8px" onclick="An.removeTag(${i});U.tagDlg()">✕</button>`;
      h += `</div>`;
    });
    h += '</div>';
    h += '<div style="border-top:1px solid var(--bd);padding-top:8px">';
    h += '<label>Name<input type="text" id="tag_name" value="" style="width:100px"></label>';
    h += '<label>From<input type="number" id="tag_from" value="1" min="1" max="' + An.frames.length + '" style="width:50px"></label>';
    h += '<label>To<input type="number" id="tag_to" value="' + An.frames.length + '" min="1" max="' + An.frames.length + '" style="width:50px"></label>';
    h += '<label>Color<input type="color" id="tag_col" value="#44aaff"></label>';
    h += '</div>';
    h += '<div class="mb"><button class="bp" onclick="U.apTag()">Add Tag</button><button class="bsc" onclick="U.cMo()">Close</button></div>';
    sMo(h);
  }

  function apTag() {
    const name = document.getElementById('tag_name').value.trim();
    const from = Math.max(0, (+document.getElementById('tag_from').value || 1) - 1);
    const to = Math.max(from, (+document.getElementById('tag_to').value || 1) - 1);
    const color = document.getElementById('tag_col').value || '#44aaff';
    if (!name) { alert('Enter a tag name'); return; }
    if (to >= An.frames.length) { alert('Frame range out of bounds'); return; }
    An.addTag(name, from, to, color);
    tagDlg();
  }

  /* Play Mode Dialog */
  function playModeDlg() {
    const cur = An.playMode;
    let h = '<h3>Playback Mode</h3>';
    h += '<label><input type="radio" name="pm" value="forward"' + (cur === 'forward' ? ' checked' : '') + '> Forward</label>';
    h += '<label><input type="radio" name="pm" value="reverse"' + (cur === 'reverse' ? ' checked' : '') + '> Reverse</label>';
    h += '<label><input type="radio" name="pm" value="ping-pong"' + (cur === 'ping-pong' ? ' checked' : '') + '> Ping-Pong</label>';
    h += '<div class="mb"><button class="bp" onclick="An.setPlayMode(document.querySelector(\'input[name=pm]:checked\').value);U.cMo()">OK</button><button class="bsc" onclick="U.cMo()">Cancel</button></div>';
    sMo(h);
  }

  /* Autosave Config */
  function autoSaveCfg() {
    let h = '<h3>Autosave</h3>';
    h += '<label>Enabled<input type="checkbox" id="as_on"' + (_autoSaveOn ? ' checked' : '') + '></label>';
    h += '<label>Interval (min)<input type="number" id="as_min" value="' + _autoSaveMin + '" min="1" max="20" style="width:50px"></label>';
    h += '<p style="font-size:9px;color:var(--txd);margin-top:6px">Saves .imagus project file automatically. Range: 1–20 minutes.</p>';
    h += '<div class="mb"><button class="bp" onclick="U.apAutoSave()">OK</button><button class="bsc" onclick="U.cMo()">Cancel</button></div>';
    sMo(h);
  }

  function apAutoSave() {
    const on = document.getElementById('as_on').checked;
    const min = Math.max(1, Math.min(20, +document.getElementById('as_min').value || 5));
    _autoSaveOn = on; _autoSaveMin = min;
    _restartAutoSave();
    cMo();
  }

  function _restartAutoSave() {
    if (_autoSaveTimer) { clearInterval(_autoSaveTimer); _autoSaveTimer = null; }
    if (_autoSaveOn && _autoSaveMin >= 1) {
      _autoSaveTimer = setInterval(() => {
        if (_dirty) {
          try { IO.save(); } catch (e) { console.error('Autosave failed:', e); }
        }
      }, _autoSaveMin * 60000);
    }
  }

  function init() { bTB(); iCol(); lPal([...PAL256]); iEvt(); uCol(); uTopt(); }

  return {
    init, uCol, uTopt, bTB, lPal, palReset, palClear, palSort, palExport, palPNG, palImportFile, palExpPAL, palExpGPL,
    newFile, mkNew, imgSize, aRsz, crop, trim, palSzUp, palSzDn,
    shiftPx: _lg(shiftPx),
    briCon, prevBC, apBC, hueSat, prevHS, apHS, blurImg, prevBI, apBI,
    _adjCancel,
    desat: _lg(desat), invertCol: _lg(invertCol),
    levels, prevLv, apLv,
    stroke, prevSk, apSk,
    outlineFX, previewOutlineFX, applyOutlineFX, okOutlineFX, closeOutlineFX, toggleOutlineFXCell,
    replaceColor,
    apRC: _lg(apRC),
    colorRange, apCR,
    gridCfg, applyGrid, checkerCfg, tiledCfg, textDlg, aTxt: _lg(aTxt),
    tweenDlg, apTw, togTheme, togCvOnly, showKeys, apK, svKF, ldKF,
    pxCount, about, sMo, cMo, brushCfg, curves, apCurves,
    tagDlg, apTag, playModeDlg, autoSaveCfg, apAutoSave,
    effectsPanel, prevFx, apEffect
  };
})();

/* ===== IO MODULE ===== */
const IO = (() => {

  /** Composite a single frame into a canvas */
  function comp(fr) {
    const c = document.createElement('canvas');
    c.width = C.W; c.height = C.H;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    if (C.bg === 'white') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, C.W, C.H); }
    for (const ly of fr.layers) {
  Ly.drawTo(cx, ly);
}
cx.globalAlpha = 1;
    return c;
  }

  function exp(fmt) {
    if (fmt === 'webp' && An.frames.length > 1) { expAnimWebP(); return; }
    const c = comp(An.frames[An.cf]);
    const mime = fmt === 'jpeg' ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/png';
    const ext = fmt === 'jpeg' ? 'jpg' : fmt;
    const q = fmt === 'jpeg' ? 0.92 : fmt === 'webp' ? 0.9 : undefined;
    c.toBlob(b => {
      if (!b) { alert('Export failed'); return; }
      const url = BlobURLs.create(b);
      const a = document.createElement('a');
      a.href = url; a.download = `imagus.${ext}`; a.click();
      setTimeout(() => BlobURLs.revoke(url), 2000);
    }, mime, q);
  }

  /** Animated WebP export — fixed VP8X animation flag */
  async function expAnimWebP() {
    try {
      const w = C.W, h = C.H, blobs = [];
      for (const fr of An.frames) {
        const cv = comp(fr);
        const blob = await new Promise(r => cv.toBlob(r, 'image/webp', 0.9));
        if (!blob) throw new Error('Frame encoding failed');
        blobs.push({ bytes: new Uint8Array(await blob.arrayBuffer()), dur: fr.duration || 100 });
      }

      function exCh(wb) {
        const out = [];
        let off = 12;
        while (off + 8 <= wb.length) {
          const tag = String.fromCharCode(wb[off], wb[off + 1], wb[off + 2], wb[off + 3]);
          const sz = wb[off + 4] | (wb[off + 5] << 8) | (wb[off + 6] << 16) | ((wb[off + 7] & 0x7f) << 24);
          if (tag === 'VP8 ' || tag === 'VP8L' || tag === 'ALPH')
            out.push(wb.slice(off, off + 8 + sz + (sz & 1)));
          off += 8 + sz + (sz & 1);
        }
        if (!out.length && wb.length > 12) return wb.slice(12);
        let tL = 0;
        for (const c2 of out) tL += c2.length;
        const r = new Uint8Array(tL);
        let p = 0;
        for (const c2 of out) { r.set(c2, p); p += c2.length; }
        return r;
      }

      const payloads = blobs.map(b => ({ data: exCh(b.bytes), dur: b.dur }));
      const cw = w - 1, ch = h - 1;

      /* VP8X chunk with ANIMATION flag (bit 1) set */
      const vp8x = new Uint8Array(10);
      vp8x[0] = 0x02; /* Animation flag */
      vp8x[4] = cw & 0xff; vp8x[5] = (cw >> 8) & 0xff; vp8x[6] = (cw >> 16) & 0xff;
      vp8x[7] = ch & 0xff; vp8x[8] = (ch >> 8) & 0xff; vp8x[9] = (ch >> 16) & 0xff;

      /* ANIM chunk: bgColor=0, loopCount=0 (infinite) */
      const animD = new Uint8Array(6);
      /* animD is all zeros: black background, loop=0 */

      const anmfs = payloads.map(pl => {
        const hdr = new Uint8Array(16);
        /* offset X, Y = 0 */
        hdr[6] = cw & 0xff; hdr[7] = (cw >> 8) & 0xff; hdr[8] = (cw >> 16) & 0xff;
        hdr[9] = ch & 0xff; hdr[10] = (ch >> 8) & 0xff; hdr[11] = (ch >> 16) & 0xff;
        hdr[12] = pl.dur & 0xff; hdr[13] = (pl.dur >> 8) & 0xff;
        hdr[14] = (pl.dur >> 16) & 0xff;
        hdr[15] = 0x01; /* dispose: do not dispose, no blending */
        const d = new Uint8Array(16 + pl.data.length);
        d.set(hdr, 0); d.set(pl.data, 16);
        return d;
      });

      let riffSz = 4 + 18 + 14;
      for (const a of anmfs) riffSz += 8 + a.length + (a.length & 1);

      const out = new Uint8Array(8 + riffSz);
      const dv = new DataView(out.buffer);
      out.set([0x52, 0x49, 0x46, 0x46], 0); /* RIFF */
      dv.setUint32(4, riffSz, true);
      out.set([0x57, 0x45, 0x42, 0x50], 8); /* WEBP */

      let off = 12;
      out.set([0x56, 0x50, 0x38, 0x58], off); /* VP8X */
      dv.setUint32(off + 4, 10, true);
      out.set(vp8x, off + 8); off += 18;

      out.set([0x41, 0x4E, 0x49, 0x4D], off); /* ANIM */
      dv.setUint32(off + 4, 6, true);
      out.set(animD, off + 8); off += 14;

      for (const a of anmfs) {
        out.set([0x41, 0x4E, 0x4D, 0x46], off); /* ANMF */
        dv.setUint32(off + 4, a.length, true);
        out.set(a, off + 8);
        off += 8 + a.length;
        if (a.length & 1) { out[off] = 0; off++; }
      }

      const bl = new Blob([out], { type: 'image/webp' });
      const url = BlobURLs.create(bl);
      const el = document.createElement('a');
      el.href = url; el.download = 'imagus-anim.webp'; el.click();
      setTimeout(() => BlobURLs.revoke(url), 2000);
    } catch (err) {
      console.error('WebP export error:', err);
      alert('WebP animation export failed: ' + err.message);
    }
  }

  /** GIF export — with transparency support and robust LZW */
  function expGIF() {
    try {
      const data = An.frames.map(f => ({ c: comp(f), d: f.duration }));
      bGIF(data, C.W, C.H).then(bl => {
        const url = BlobURLs.create(bl);
        const a = document.createElement('a');
        a.href = url; a.download = 'imagus.gif'; a.click();
        setTimeout(() => BlobURLs.revoke(url), 2000);
      }).catch(err => {
        console.error('GIF export error:', err);
        alert('GIF export failed: ' + err.message);
      });
    } catch (err) {
      console.error('GIF export error:', err);
      alert('GIF export failed: ' + err.message);
    }
  }

  async function bGIF(frames, w, h) {
    const buf = [];
    const wr = (...x) => buf.push(...x);
    const ws = s => { for (let i = 0; i < s.length; i++) buf.push(s.charCodeAt(i)); };
    const w16 = v => buf.push(v & 0xff, (v >> 8) & 0xff);

    /* Header */
    ws('GIF89a'); w16(w); w16(h);
    wr(0xf7, 0, 0); /* GCT flag, 256 colors, no sort, 256 entries */

    /* Global Color Table: 6x6x6 cube + grays, index 216 = transparent */
    const pal = [];
    for (let r = 0; r < 6; r++)
      for (let g = 0; g < 6; g++)
        for (let b = 0; b < 6; b++)
          pal.push([r * 51, g * 51, b * 51]);
    while (pal.length < 256) pal.push([0, 0, 0]);
    for (const c of pal) wr(c[0], c[1], c[2]);

    /* NETSCAPE looping extension */
    wr(0x21, 0xff, 11);
    ws('NETSCAPE2.0');
    wr(3, 1);
    w16(0); /* infinite loop */
    wr(0);

    /* Color quantization with nearest-neighbor lookup */
    function nr(r, g, b) {
      let best = 0, bd = 1e9;
      for (let i = 0; i < 216; i++) {
        const dr2 = pal[i][0] - r, dg = pal[i][1] - g, db = pal[i][2] - b;
        const d = dr2 * dr2 + dg * dg + db * db;
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }

    const TRANSPARENT_INDEX = 216;

    for (const fr of frames) {
      const d = fr.c.getContext('2d').getImageData(0, 0, w, h).data;

      /* Check if this frame has any transparency */
      let hasTransparency = false;
      for (let i = 3; i < d.length; i += 4) {
        if (d[i] < 128) { hasTransparency = true; break; }
      }

      /* Graphics Control Extension */
      wr(0x21, 0xf9, 4);
      if (hasTransparency) {
        wr(0x09); /* dispose: restore to background, transparent flag */
      } else {
        wr(0x08); /* dispose: restore to background, no transparency */
      }
      w16(Math.max(2, Math.round((fr.d || 100) / 10)));
      wr(hasTransparency ? TRANSPARENT_INDEX : 0); /* transparent color index */
      wr(0);

      /* Image descriptor */
      wr(0x2c); w16(0); w16(0); w16(w); w16(h); wr(0);

      /* Pixel data */
      wr(8); /* LZW minimum code size */
      const px = [];
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 128) px.push(TRANSPARENT_INDEX);
        else px.push(nr(d[i], d[i + 1], d[i + 2]));
      }

      const cp = lzw(8, px);
      let o = 0;
      while (o < cp.length) {
        const ch2 = Math.min(255, cp.length - o);
        wr(ch2);
        for (let i = 0; i < ch2; i++) buf.push(cp[o + i]);
        o += ch2;
      }
      wr(0);
    }

    wr(0x3b); /* trailer */
    return new Blob([new Uint8Array(buf)], { type: 'image/gif' });
  }

  /** LZW encoder with periodic clear-code resets for large images */
  function lzw(mn, px) {
    const cc = 1 << mn, ei = cc + 1;
    let cs = mn + 1, nc = ei + 1;
    let tb = new Map();
    for (let i = 0; i < cc; i++) tb.set('' + i, i);

    let bits = 0, bc = 0;
    const out = [];

    function wb(c, s) {
      bits |= c << bc;
      bc += s;
      while (bc >= 8) { out.push(bits & 0xff); bits >>= 8; bc -= 8; }
    }

    wb(cc, cs); /* clear code */
    let cr = '' + px[0];

    for (let i = 1; i < px.length; i++) {
      const nx = cr + ',' + px[i];
      if (tb.has(nx)) {
        cr = nx;
      } else {
        wb(tb.get(cr), cs);

        if (nc < 4096) {
          tb.set(nx, nc++);
        }
        if (nc > (1 << cs) && cs < 12) {
          cs++;
        }

        /* Reset table when it hits the 4096 limit to prevent corruption */
        if (nc >= 4096) {
          wb(cc, cs); /* emit clear code */
          cs = mn + 1;
          nc = ei + 1;
          tb = new Map();
          for (let j = 0; j < cc; j++) tb.set('' + j, j);
        }

        cr = '' + px[i];
      }
    }

    wb(tb.get(cr), cs);
    wb(ei, cs); /* end-of-information */
    if (bc > 0) out.push(bits & 0xff);

    return out;
  }

  /** Save project as .imagus JSON */
  function save() {
    try {
      const pr = {
          v: 14, app: 'imagus', w: C.W, h: C.H, bg: C.bg,
          pc: C.pc, sc: C.sc, cf: An.cf,
          frames: An.frames.map(f => ({
            al: f.activeLayer, dur: f.duration,
            layers: f.layers.map(ly => ({
              n: ly.name,
              o: ly.opacity,
              v: ly.visible,
              k: ly.locked,
              b: ly.blendMode,
              d: ly.canvas.toDataURL('image/png'),
              m: ly.mask ? {
                e: ly.mask.enabled,
                x: ly.mask.editing,
                d: ly.mask.canvas.toDataURL('image/png')
              } : null
            }))
          })),
          tags: An.tags.map(t => ({ name: t.name, from: t.from, to: t.to, color: t.color })),
          playMode: An.playMode
        };
      const bl = new Blob([JSON.stringify(pr)], { type: 'application/json' });
      const url = BlobURLs.create(bl);
      const a = document.createElement('a');
      a.href = url; a.download = 'project.imagus'; a.click();
      _dirty = false;
      setTimeout(() => BlobURLs.revoke(url), 2000);
    } catch (err) {
      console.error('Save error:', err);
      alert('Save failed: ' + err.message);
    }
  }

    function _isSupportedImageFile(file) {
      if (!file) return false;

      const allowedTypes = new Set([
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp'
      ]);

      return allowedTypes.has(file.type) || /\.(png|jpe?g|gif|webp)$/i.test(file.name || '');
    }

    function openImg() {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/gif,image/webp';

      inp.onchange = () => {
        const file = inp.files && inp.files[0];
        if (!file) return;

        if (!_isSupportedImageFile(file)) {
          alert('Please choose one valid image file.');
          return;
        }

        const img = new Image();
        const url = BlobURLs.create(file);

          img.onload = () => {
          Hi.clear();
          _dirty = false;
          T.resetStuck();
          T.selection = null;

          C.init(img.width, img.height, 'transparent');
          An.init();

          const layer = An.frames[0].layers[0];
          layer.name = (file.name || 'Image').replace(/\.[^.]+$/, '') || 'Image';
          layer.ctx.imageSmoothingEnabled = false;
          layer.ctx.drawImage(img, 0, 0);

          BlobURLs.revoke(url);

          requestAnimationFrame(() => {
            C.zFit();
            Ly.ui();
            U.uCol();
            An.uStrip();
          });
        };

        img.onerror = () => {
          BlobURLs.revoke(url);
          alert('Failed to load image.');
        };

        img.src = url;
      };

      inp.click();
    }

    function importImageAsLayer() {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/gif,image/webp';

      inp.onchange = () => {
        const file = inp.files && inp.files[0];
        if (!file) return;

        const img = new Image();
        const url = BlobURLs.create(file);

        img.onload = () => {
          const sourceW = img.width;
          const sourceH = img.height;
          const longestSide = Math.max(sourceW, sourceH);
          const safeName =
            file.name.replace(/\.[^.]+$/, '').trim() ||
            ('Imported Layer ' + ((An.frames[An.cf]?.layers.length || 0) + 1));

          U.sMo(`
            <h3>Import Image as Layer</h3>
            <p style="font-size:9px;color:var(--txd);margin-bottom:8px">
              Source: ${sourceW} × ${sourceH}px
            </p>
            <label>
              Target Size (px)
              <input type="number" id="import_size" value="${longestSide}" min="1" max="32768">
            </label>
            <label>
              Expand canvas if needed
              <input type="checkbox" id="import_expand" checked>
            </label>
            <p style="font-size:9px;color:var(--txd);margin-top:6px">
              The image will scale proportionally using the largest side.
            </p>
            <div class="mb">
              <button class="bsc" onclick="U.cMo()">Cancel</button>
              <button class="bp" id="import_apply_btn">Import</button>
            </div>
          `);

          const applyBtn = document.getElementById('import_apply_btn');

          applyBtn.onclick = () => {
            try {
              const frame = An.frames[An.cf];
              if (!frame) return;

              if (T.floating) T.commitFloat();

              const targetSize = Math.max(1, Math.round(+document.getElementById('import_size').value || longestSide));
              const expandCanvas = document.getElementById('import_expand').checked;

              const scale = targetSize / longestSide;
              const drawW = Math.max(1, Math.round(sourceW * scale));
              const drawH = Math.max(1, Math.round(sourceH * scale));

              Hi.push();

              if (expandCanvas) {
                const newCanvasW = Math.max(C.W, drawW);
                const newCanvasH = Math.max(C.H, drawH);

                if (newCanvasW !== C.W || newCanvasH !== C.H) {
                  C.resize(newCanvasW, newCanvasH);
                }
              }

              const currentFrame = An.frames[An.cf];
              if (!currentFrame) return;

              const layer = Ly.mk(safeName);
              layer.ctx.imageSmoothingEnabled = false;
              layer.ctx.clearRect(0, 0, C.W, C.H);

              const x = Math.round((C.W - drawW) / 2);
              const y = Math.round((C.H - drawH) / 2);

              layer.ctx.drawImage(img, x, y, drawW, drawH);

              currentFrame.layers.push(layer);
              currentFrame.activeLayer = currentFrame.layers.length - 1;

              U.cMo();
              Ly.ui();
              C.render();
            } finally {
              BlobURLs.revoke(url);
            }
          };
        };

        img.onerror = () => {
          BlobURLs.revoke(url);
          alert('Failed to import image.');
        };

        img.src = url;
      };

      inp.click();
    }

    function importSeq() {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/gif,image/webp';
      inp.multiple = true;

      inp.onchange = async () => {
        const files = [...(inp.files || [])]
          .filter(_isSupportedImageFile)
          .sort((a, b) =>
            a.name.localeCompare(b.name, undefined, {
              numeric: true,
              sensitivity: 'base'
            })
          );

        if (!files.length) {
          alert('No valid image files selected.');
          return;
        }

        if (files.length < 2) {
          alert('Import Images → Timeline needs at least 2 images. Use "Open Image" for a single image.');
          return;
        }

        const loaded = [];

        for (const file of files) {
          const img = new Image();
          const url = BlobURLs.create(file);

          try {
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = url;
            });

            if (img.width > 0 && img.height > 0) {
              loaded.push({ file, img });
            }
          } catch (err) {
            console.warn('Skipping bad image:', file.name, err);
          } finally {
            BlobURLs.revoke(url);
          }
        }

        if (loaded.length < 2) {
          alert('At least 2 valid images are required to build a timeline.');
          return;
        }

        const maxW = Math.max(...loaded.map(item => item.img.width));
        const maxH = Math.max(...loaded.map(item => item.img.height));

        Hi.clear();
        _dirty = false;

        C.init(maxW, maxH, 'transparent');
        An.frames = [];

        for (let i = 0; i < loaded.length; i++) {
          const { file, img } = loaded[i];
          const frameName =
            (file.name || `Frame ${i + 1}`).replace(/\.[^.]+$/, '') || `Frame ${i + 1}`;

          const fr = {
            layers: [Ly.mk(frameName)],
            activeLayer: 0,
            duration: 100
          };

          fr.layers[0].ctx.drawImage(
            img,
            Math.round((maxW - img.width) / 2),
            Math.round((maxH - img.height) / 2)
          );

          An.frames.push(fr);
        }

        An.cf = 0;

        requestAnimationFrame(() => {
          C.zFit();
          Ly.ui();
          U.uCol();
          An.uStrip();
        });
      };

      inp.click();
    }

  /** Load project — robust with error handling per image */
  function loadProj() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.imagus,.json';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      try {
        const pr = JSON.parse(await f.text());
        if (!pr.w || !pr.h || !pr.frames || !pr.frames.length) {
          alert('Invalid project file.'); return;
        }
        const maxDim = 8192;
        if (pr.w < 1 || pr.h < 1 || pr.w > maxDim || pr.h > maxDim) {
          alert('Invalid canvas dimensions in project.'); return;
        }
        if (pr.frames.length > 9999) {
          alert('Too many frames in project.'); return;
        }
        C.init(pr.w, pr.h, pr.bg || 'transparent');
        C.pc = pr.pc || '#000000';
        C.sc = pr.sc || '#ffffff';
        An.frames = [];
        const ps = [];
        for (const fs of pr.frames) {
          const fr = { layers: [], activeLayer: fs.al || 0, duration: fs.dur || 100 };
          for (const ls of fs.layers) {
            const ly = Ly.mk(ls.n || 'Layer');
                ly.opacity = typeof ls.o === 'number' ? ls.o : 100;
                ly.visible = ls.v !== false;
                ly.locked = !!ls.k;
                ly.blendMode = LAYER_BLEND_MODES.includes(ls.b) ? ls.b : 'normal';

                if (ls.d) {
                  const im = new Image();
                  ps.push(new Promise(resolve => {
                    im.onload = () => { ly.ctx.drawImage(im, 0, 0); resolve(); };
                    im.onerror = () => {
                      console.warn('Failed to load layer image data for:', ls.n);
                      resolve();
                    };
                  }));
                  im.src = ls.d;
                }

                if (ls.m && ls.m.d) {
                  const mm = Ly.ensureMask(ly);
                  mm.enabled = !!ls.m.e;
                  mm.editing = !!ls.m.x;

                  const mim = new Image();
                  ps.push(new Promise(resolve => {
                    mim.onload = () => {
                      mm.ctx.clearRect(0, 0, C.W, C.H);
                      mm.ctx.drawImage(mim, 0, 0);
                      resolve();
                    };
                    mim.onerror = () => {
                      console.warn('Failed to load mask image data for:', ls.n);
                      resolve();
                    };
                  }));
                  mim.src = ls.m.d;
                }

                fr.layers.push(ly);
          }
          /* Ensure at least one layer */
          if (fr.layers.length === 0) fr.layers.push(Ly.mk('Layer 1'));
          An.frames.push(fr);
        }
        await Promise.all(ps);
        An.cf = Math.min(pr.cf || 0, An.frames.length - 1);
        An.tags = Array.isArray(pr.tags) ? pr.tags.filter(t =>
          t && typeof t.name === 'string' && typeof t.from === 'number' &&
          typeof t.to === 'number' && t.from >= 0 && t.to < An.frames.length
        ) : [];
        if (pr.playMode && ['forward', 'reverse', 'ping-pong'].includes(pr.playMode)) An.playMode = pr.playMode;
        Hi.clear();
        _dirty = false;
        C.zFit(); Ly.ui(); U.uCol(); An.uStrip();
      } catch (e2) {
        console.error('Load error:', e2);
        alert('Failed to load: ' + e2.message);
      }
    };
    inp.click();
  }

  async function expAPNG() {
    try {
      var w = C.W, h = C.H, frms = An.frames;
      if (!frms.length) return;

      /* CRC32 table */
      var crcT = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        crcT[n] = c;
      }
      function crc32(buf, off, len) {
        var c = 0xffffffff;
        for (var i = off; i < off + len; i++) c = crcT[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
      }

      /* Build a PNG chunk: length + type + data + CRC */
      function mkCh(type, data) {
        var ch = new Uint8Array(12 + data.length);
        var dv = new DataView(ch.buffer);
        dv.setUint32(0, data.length);
        ch[4] = type.charCodeAt(0); ch[5] = type.charCodeAt(1);
        ch[6] = type.charCodeAt(2); ch[7] = type.charCodeAt(3);
        ch.set(data, 8);
        dv.setUint32(8 + data.length, crc32(ch, 4, 4 + data.length));
        return ch;
      }

      /* Parse PNG bytes into chunks */
      function parseCh(buf) {
        var out = [], off = 8;
        while (off + 8 <= buf.length) {
          var len = (buf[off] << 24) | (buf[off+1] << 16) | (buf[off+2] << 8) | buf[off+3];
          var t = String.fromCharCode(buf[off+4], buf[off+5], buf[off+6], buf[off+7]);
          out.push({ type: t, data: buf.slice(off + 8, off + 8 + len) });
          off += 12 + len;
        }
        return out;
      }

      /* Render all frames to PNG byte arrays */
      var pngs = [];
      for (var fi = 0; fi < frms.length; fi++) {
        var cv = comp(frms[fi]);
        var blob = await new Promise(function(r) { cv.toBlob(r, 'image/png'); });
        if (!blob) throw new Error('Frame ' + fi + ' encoding failed');
        pngs.push({ bytes: new Uint8Array(await blob.arrayBuffer()), dur: frms[fi].duration || 100 });
      }

      var firstCh = parseCh(pngs[0].bytes);
      var ihdr = firstCh.find(function(c) { return c.type === 'IHDR'; });
      if (!ihdr) throw new Error('No IHDR found');

      /* acTL: num_frames(4) + num_plays(4, 0=infinite) */
      var actl = new Uint8Array(8);
      var av = new DataView(actl.buffer);
      av.setUint32(0, frms.length);
      av.setUint32(4, 0);

      var seq = 0, parts = [];

      /* PNG signature */
      parts.push(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));
      parts.push(mkCh('IHDR', ihdr.data));
      parts.push(mkCh('acTL', actl));

      for (var i = 0; i < pngs.length; i++) {
        /* fcTL: 26 bytes */
        var fctl = new Uint8Array(26);
        var fv = new DataView(fctl.buffer);
        fv.setUint32(0, seq++);      /* sequence_number */
        fv.setUint32(4, w);           /* width */
        fv.setUint32(8, h);           /* height */
        fv.setUint32(12, 0);          /* x_offset */
        fv.setUint32(16, 0);          /* y_offset */
        fv.setUint16(20, pngs[i].dur);/* delay_num (ms) */
        fv.setUint16(22, 1000);       /* delay_den */
        fctl[24] = 0;                 /* dispose: none */
        fctl[25] = 0;                 /* blend: source */
        parts.push(mkCh('fcTL', fctl));

        var chunks = parseCh(pngs[i].bytes);
        var idats = chunks.filter(function(c) { return c.type === 'IDAT'; });

        if (i === 0) {
          /* First frame: use IDAT (backward compatible with static PNG viewers) */
          for (var j = 0; j < idats.length; j++) parts.push(mkCh('IDAT', idats[j].data));
        } else {
          /* Subsequent frames: use fdAT = sequence_number(4) + IDAT data */
          for (var j = 0; j < idats.length; j++) {
            var fd = new Uint8Array(4 + idats[j].data.length);
            new DataView(fd.buffer).setUint32(0, seq++);
            fd.set(idats[j].data, 4);
            parts.push(mkCh('fdAT', fd));
          }
        }
      }

      parts.push(mkCh('IEND', new Uint8Array(0)));

      /* Combine all parts */
      var total = 0;
      for (var p = 0; p < parts.length; p++) total += parts[p].length;
      var out = new Uint8Array(total);
      var off = 0;
      for (var p = 0; p < parts.length; p++) { out.set(parts[p], off); off += parts[p].length; }

      var bl = new Blob([out], { type: 'image/apng' });
      var url = BlobURLs.create(bl);
      var a = document.createElement('a');
      a.href = url; a.download = 'imagus-anim.apng'; a.click();
      setTimeout(function() { BlobURLs.revoke(url); }, 2000);
    } catch (err) {
      console.error('APNG export error:', err);
      alert('APNG export failed: ' + err.message);
    }
  }

  function expAVIF() {
    var cv = comp(An.frames[An.cf]);
    cv.toBlob(function(b) {
      if (!b || b.type !== 'image/avif') { alert('AVIF export is not supported by your browser.\nTry Chrome 96+, Firefox 113+, or Safari 16.4+.'); return; }
      var url = BlobURLs.create(b);
      var a = document.createElement('a');
      a.href = url; a.download = 'imagus.avif'; a.click();
      setTimeout(function() { BlobURLs.revoke(url); }, 2000);
    }, 'image/avif', 0.92);
  }

  function expSpritesheet() {
    try {
      var frms = An.frames;
      if (!frms.length) { alert('No frames to export'); return; }
      var w = C.W, h = C.H, count = frms.length;
      var maxCols = Math.ceil(Math.sqrt(count));
      var rows = Math.ceil(count / maxCols);
      var cols = Math.min(count, maxCols);
      var sw = cols * w, sh = rows * h;
      if (sw > 16384 || sh > 16384) {
        alert('Spritesheet too large (' + sw + 'x' + sh + '). Reduce frames or canvas size.');
        return;
      }
      var sc = document.createElement('canvas');
      sc.width = sw; sc.height = sh;
      var ctx = sc.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      for (var i = 0; i < count; i++) {
        var col = i % cols, row = Math.floor(i / cols);
        var fc = comp(frms[i]);
        ctx.drawImage(fc, col * w, row * h);
      }
      sc.toBlob(function(b) {
        if (!b) { alert('Spritesheet export failed'); return; }
        var url = BlobURLs.create(b);
        var a = document.createElement('a');
        a.href = url; a.download = 'imagus_spritesheet.png'; a.click();
        setTimeout(function() { BlobURLs.revoke(url); }, 2000);
      }, 'image/png');
      var durations = [];
      for (var j = 0; j < frms.length; j++) durations.push(frms[j].duration);
      var meta = JSON.stringify({
        image: 'imagus_spritesheet.png',
        frameWidth: w, frameHeight: h,
        columns: cols, rows: rows, count: count,
        frameDurations: durations
      }, null, 2);
      var jb = new Blob([meta], { type: 'application/json' });
      var ju = BlobURLs.create(jb);
      var ja = document.createElement('a');
      ja.href = ju; ja.download = 'imagus_spritesheet.json'; ja.click();
      setTimeout(function() { BlobURLs.revoke(ju); }, 2000);
    } catch (err) {
      console.error('Spritesheet export error:', err);
      alert('Spritesheet export failed: ' + err.message);
    }
  }

  function expImageSeq() {
    try {
      var frms = An.frames;
      if (!frms.length) { alert('No frames to export'); return; }
      var pad = String(frms.length).length;
      for (var i = 0; i < frms.length; i++) {
        (function(idx) {
          var fc = comp(frms[idx]);
          fc.toBlob(function(b) {
            if (!b) return;
            var url = BlobURLs.create(b);
            var a = document.createElement('a');
            var num = String(idx + 1);
            while (num.length < pad) num = '0' + num;
            a.href = url; a.download = 'frame_' + num + '.png'; a.click();
            setTimeout(function() { BlobURLs.revoke(url); }, 2000);
          }, 'image/png');
        })(i);
      }
    } catch (err) {
      console.error('Image sequence export error:', err);
      alert('Image sequence export failed: ' + err.message);
    }
  }

  return { exp, expGIF, expAnimWebP, expAPNG, expAVIF, expSpritesheet, expImageSeq, importSeq, importImageAsLayer, save, openImg, loadProj, comp };
})();

/* ===== REFERENCE IMAGE ===== */
const Ref = (() => {
  let origW = 0, origH = 0, dragging = false, dx = 0, dy = 0;
  let imgUrl = null;
  let closingRef = false;

  const panel = document.getElementById('refp');
  const img = document.getElementById('refimg');
  const opSl = document.getElementById('refop');
  const szSl = document.getElementById('refsz');

  function load() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';

    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;

      if (imgUrl) BlobURLs.revoke(imgUrl);

      img.onload = () => {
        closingRef = false;
        origW = img.naturalWidth;
        origH = img.naturalHeight;
        panel.style.display = 'block';
        panel.style.left = '120px';
        panel.style.top = '80px';
        updSz();
        updOp();
      };

      img.onerror = () => {
        if (closingRef) return;
        alert('Failed to load reference image.');
      };

      imgUrl = BlobURLs.create(f);
      img.src = imgUrl;
    };

    inp.click();
  }

  function close() {
    closingRef = true;
    panel.style.display = 'none';
    img.removeAttribute('src');
    if (imgUrl) {
      BlobURLs.revoke(imgUrl);
      imgUrl = null;
    }
  }

  function updOp() {
    img.style.opacity = opSl.value / 100;
  }

  function updSz() {
    const pct = szSl.value / 100;
    img.style.width = Math.round(origW * pct) + 'px';
    img.style.height = Math.round(origH * pct) + 'px';
  }

  document.getElementById('refhdr').addEventListener('mousedown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    dragging = true;
    dx = e.clientX - panel.offsetLeft;
    dy = e.clientY - panel.offsetTop;
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    panel.style.left = (e.clientX - dx) + 'px';
    panel.style.top = (e.clientY - dy) + 'px';
  });

  window.addEventListener('mouseup', () => {
    dragging = false;
  });

  opSl.addEventListener('input', updOp);
  szSl.addEventListener('input', updSz);

  return { load, close };
})();

/* ===== PREVIEW WINDOW ===== */
const Prev = (() => {
  var on = false, dragging = false, ddx = 0, ddy = 0;
  var panel = document.getElementById('prevw');
  var cv = document.getElementById('prevc');
  var hdr = document.getElementById('prevhdr');

  function toggle() {
    on = !on;
    if (on) { panel.style.display = ''; update(); }
    else { panel.style.display = 'none'; }
  }

  function close() { on = false; panel.style.display = 'none'; }

  function update() {
    if (!on) return;
    try {
      var pw = Math.min(160, C.W * 2);
      var ph = Math.max(1, Math.round(pw * C.H / C.W));
      if (cv.width !== C.W || cv.height !== C.H) { cv.width = C.W; cv.height = C.H; }
      cv.style.width = pw + 'px';
      cv.style.height = ph + 'px';
      var cx = cv.getContext('2d');
      cx.clearRect(0, 0, C.W, C.H);
      cx.imageSmoothingEnabled = false;
      var fc = IO.comp(An.frames[An.cf]);
      cx.drawImage(fc, 0, 0);
    } catch(e) { /* silent */ }
  }

  hdr.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'BUTTON') return;
    dragging = true;
    ddx = e.clientX - panel.offsetLeft;
    ddy = e.clientY - panel.offsetTop;
    e.preventDefault();
  });

  window.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    panel.style.left = (e.clientX - ddx) + 'px';
    panel.style.top = (e.clientY - ddy) + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  });

  window.addEventListener('mouseup', function() { dragging = false; });

  return { toggle, close, update };
})();

/* ===== INIT ===== */
window.addEventListener('load', () => {
  C.init(320, 240, 'transparent');
  An.init();
  U.init();
  requestAnimationFrame(() => {
    C.zFit(); C.render(); Ly.ui(); U.uCol();
  });
});

window.addEventListener('beforeunload', e => {
  if (_dirty) { e.preventDefault(); e.returnValue = ''; }
});
