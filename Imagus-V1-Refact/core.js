"use strict";
/* ===== CORE CANVAS ===== */
const C = (() => {
  let W = 320, H = 240, zm = 1, panX = 0, panY = 0;
  let grid = false, gsz = 8, bg = 'transparent';
  let gridColor = '#4488ff', gridAlpha = 0.25, gridThick = 1;
  let pCol = '#000000', sCol = '#ffffff', ckp = null, ckSize = 8;
  let ckCol1 = '', ckCol2 = '';
  let symHP = 0.5, symVP = 0.5;
  let guideH = false, guideV = false, guideHY = 0.5, guideVX = 0.5;
  let tiledMode = 'off';

  const mc = document.getElementById('mc');
  const mx = mc.getContext('2d', { willReadFrequently: true });
  const oc = document.getElementById('oc');
  const ox = oc.getContext('2d');
  const ca = document.getElementById('ca');

  function mkCk() {
    const sz = Math.max(1, ckSize);
    const c2 = document.createElement('canvas');
    c2.width = sz * 2; c2.height = sz * 2;
    const x = c2.getContext('2d');
    const cs = getComputedStyle(document.documentElement);
    x.fillStyle = ckCol1 || cs.getPropertyValue('--ck1').trim() || '#606070';
    x.fillRect(0, 0, sz * 2, sz * 2);
    x.fillStyle = ckCol2 || cs.getPropertyValue('--ck2').trim() || '#505060';
    x.fillRect(sz, 0, sz, sz);
    x.fillRect(0, sz, sz, sz);
    ckp = mx.createPattern(c2, 'repeat');
  }

  function init(w, h, b) {
    const maxPixels = 25000000;
    if (w * h > maxPixels) {
      if (!confirm(`Canvas ${w}×${h} (${Math.round(w*h/1e6)}MP) is very large and may be slow. Continue?`)) return;
    }
    W = w; H = h; bg = b;
    mc.width = W; mc.height = H;
    mkCk();
  }

  function compFrame(fr) {
    const c2 = document.createElement('canvas');
    c2.width = W; c2.height = H;
    const cx = c2.getContext('2d');
    cx.imageSmoothingEnabled = false;
    if (bg === 'white') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H); }
    if (fr) {
      for (const ly of fr.layers) {
        Ly.drawTo(cx, ly);
      }
    }
    cx.globalAlpha = 1;
    return cx;
  }

  function c2s(cx2, cy2) {
    const aW = ca.clientWidth, aH = ca.clientHeight;
    const dW = W * zm, dH = H * zm;
    return {
      sx: panX + (aW - dW) / 2 + cx2 * zm,
      sy: panY + (aH - dH) / 2 + cy2 * zm
    };
  }

  let _renderRAF = 0;
  function scheduleRender() {
    if (!_renderRAF) _renderRAF = requestAnimationFrame(() => { _renderRAF = 0; render(); });
  }

  function render() {
    const aW = ca.clientWidth, aH = ca.clientHeight;
    if (!aW || !aH) return;
    const dW = W * zm, dH = H * zm;
    const lf = panX + (aW - dW) / 2, tp = panY + (aH - dH) / 2;

    mc.style.cssText = `position:absolute;image-rendering:pixelated;width:${dW}px;height:${dH}px;left:${lf}px;top:${tp}px`;
    oc.style.cssText = `position:absolute;pointer-events:none;left:0;top:0;width:${aW}px;height:${aH}px`;

    const sW = Math.ceil(aW), sH = Math.ceil(aH);
    if (oc.width !== sW || oc.height !== sH) { oc.width = sW; oc.height = sH; }

    mx.imageSmoothingEnabled = false;
    mx.clearRect(0, 0, W, H);
    if (ckp) { mx.fillStyle = ckp; mx.fillRect(0, 0, W, H); }
    if (bg === 'white') { mx.fillStyle = '#fff'; mx.fillRect(0, 0, W, H); }

    const frames = An.frames, ci = An.cf;

    /* Onion skin */
    if (An.onion) {
      if (An.onionAll) {
        for (let fi = 0; fi < frames.length; fi++) {
          if (fi === ci) continue;
          const dist = Math.abs(fi - ci);
          const alpha = Math.max(0.04, 0.3 / dist);
          mx.save();
          mx.globalAlpha = alpha;
          for (const ly of frames[fi].layers) {
            Ly.drawTo(mx, ly);
          }
          mx.restore();
        }
      } else {
        if (ci > 0) {
          mx.save();
          mx.globalAlpha = 0.25;
          for (const ly of frames[ci - 1].layers) {
            Ly.drawTo(mx, ly);
          }
          mx.restore();
        }
        if (ci < frames.length - 1) {
          mx.save();
          mx.globalAlpha = 0.15;
          for (const ly of frames[ci + 1].layers) {
            Ly.drawTo(mx, ly);
          }
          mx.restore();
        }
      }
    }

    /* Current frame layers */
    const fr = frames[ci];
    if (fr) {
      for (const ly of fr.layers) {
        if (!ly.visible) continue;
        Ly.drawTo(mx, ly);
      }
      mx.globalAlpha = 1;
    }

    /* Floating selection on main canvas */
    const fl = T.floating;
    if (fl) {
      const fw = fl.tw || fl.canvas.width, fh = fl.th || fl.canvas.height;
      mx.save();
      mx.translate(fl.x + fw / 2, fl.y + fh / 2);
      mx.rotate(fl.rot || 0);
      mx.globalAlpha = 0.9;
      mx.imageSmoothingEnabled = !T.tfPixel;
      mx.drawImage(fl.canvas, -fw / 2, -fh / 2, fw, fh);
      mx.restore();
      mx.imageSmoothingEnabled = false;
      mx.globalAlpha = 1;
    }

    /* Overlay canvas */
    ox.clearRect(0, 0, sW, sH);
    const ix = x => lf + x * zm;
    const iy = y => tp + y * zm;
    const snap = v => Math.round(v) + 0.5;

    /* Tiled mode */
    if (tiledMode !== 'off') {
      ox.save();
      ox.imageSmoothingEnabled = false;
      const offs = [];
      if (tiledMode === 'x' || tiledMode === 'both') offs.push([-1, 0], [1, 0]);
      if (tiledMode === 'y' || tiledMode === 'both') offs.push([0, -1], [0, 1]);
      if (tiledMode === 'both') offs.push([-1, -1], [1, -1], [-1, 1], [1, 1]);
      ox.globalAlpha = 0.4;
      for (const [ddx, ddy] of offs)
        ox.drawImage(mc, lf + ddx * dW, tp + ddy * dH, dW, dH);
      ox.globalAlpha = 1;
      ox.restore();
    }

    /* Grid */
    if (grid) {
      const step = gsz;
      if (zm * step >= 1.5) {
        ox.save();
        ox.strokeStyle = gridColor;
        ox.globalAlpha = gridAlpha;
        ox.lineWidth = Math.max(1, gridThick);
        for (let xg = 0; xg <= W; xg += step) {
          const sx = snap(ix(xg));
          ox.beginPath(); ox.moveTo(sx, Math.round(iy(0)));
          ox.lineTo(sx, Math.round(iy(H))); ox.stroke();
        }
        for (let yg = 0; yg <= H; yg += step) {
          const sy = snap(iy(yg));
          ox.beginPath(); ox.moveTo(Math.round(ix(0)), sy);
          ox.lineTo(Math.round(ix(W)), sy); ox.stroke();
        }
        ox.restore();
      }
    }

    const gCol = getComputedStyle(document.documentElement).getPropertyValue('--guide').trim() || '#4488ff';
    ox.setLineDash([]);

    /* Symmetry guides */
    if (T.symH) {
      const sx = snap(ix(W * symHP));
      ox.strokeStyle = gCol; ox.lineWidth = 1.5;
      ox.beginPath(); ox.moveTo(sx, Math.round(iy(0)));
      ox.lineTo(sx, Math.round(iy(H))); ox.stroke();
      const my = Math.round((iy(0) + iy(H)) / 2);
      ox.fillStyle = gCol; ox.beginPath(); ox.arc(sx, my, 5, 0, Math.PI * 2); ox.fill();
    }
    if (T.symV) {
      const sy = snap(iy(H * symVP));
      ox.strokeStyle = gCol; ox.lineWidth = 1.5;
      ox.beginPath(); ox.moveTo(Math.round(ix(0)), sy);
      ox.lineTo(Math.round(ix(W)), sy); ox.stroke();
      const mx2 = Math.round((ix(0) + ix(W)) / 2);
      ox.fillStyle = gCol; ox.beginPath(); ox.arc(mx2, sy, 5, 0, Math.PI * 2); ox.fill();
    }
    if (T.sym45) {
      const cx2 = ix(W * symHP), cy2 = iy(H * symVP), diag = Math.max(dW, dH);
      ox.strokeStyle = gCol; ox.lineWidth = 1; ox.setLineDash([4, 4]);
      ox.beginPath(); ox.moveTo(cx2 - diag, cy2 - diag);
      ox.lineTo(cx2 + diag, cy2 + diag); ox.stroke(); ox.setLineDash([]);
    }
    if (T.sym45n) {
      const cx2 = ix(W * symHP), cy2 = iy(H * symVP), diag = Math.max(dW, dH);
      ox.strokeStyle = gCol; ox.lineWidth = 1; ox.setLineDash([4, 4]);
      ox.beginPath(); ox.moveTo(cx2 - diag, cy2 + diag);
      ox.lineTo(cx2 + diag, cy2 - diag); ox.stroke(); ox.setLineDash([]);
    }

    /* Horizontal/vertical guides */
    if (guideH) {
      const sy = snap(iy(H * guideHY));
      ox.strokeStyle = gCol; ox.lineWidth = 1; ox.setLineDash([4, 4]);
      ox.beginPath(); ox.moveTo(Math.round(ix(0)), sy);
      ox.lineTo(Math.round(ix(W)), sy); ox.stroke(); ox.setLineDash([]);
    }
    if (guideV) {
      const sx = snap(ix(W * guideVX));
      ox.strokeStyle = gCol; ox.lineWidth = 1; ox.setLineDash([4, 4]);
      ox.beginPath(); ox.moveTo(sx, Math.round(iy(0)));
      ox.lineTo(sx, Math.round(iy(H))); ox.stroke(); ox.setLineDash([]);
    }

    /* Selection & floating overlay */
    ox.save();
    ox.translate(lf, tp);
    ox.scale(zm, zm);
    T.drawSel(ox);

    if (fl) {
      const fw = fl.tw || fl.canvas.width, fh = fl.th || fl.canvas.height;
      ox.save();
      ox.translate(fl.x + fw / 2, fl.y + fh / 2);
      ox.rotate(fl.rot || 0);
      ox.strokeStyle = 'rgba(0,0,0,0.5)'; ox.lineWidth = 2.5 / zm;
      ox.setLineDash([]);
      ox.strokeRect(-fw / 2, -fh / 2, fw, fh);
      ox.strokeStyle = '#44aaff'; ox.lineWidth = 1.2 / zm;
      ox.setLineDash([5 / zm, 3 / zm]);
      ox.strokeRect(-fw / 2, -fh / 2, fw, fh);
      ox.setLineDash([]);
      if (T.tfMode) {
        const minZone = Math.max(30 / zm, 15);
        const effw = Math.max(fw, minZone), effh = Math.max(fh, minZone);
        const hs = Math.max(10 / zm, 3);
        const pts = [
          [-effw/2, -effh/2], [0, -effh/2], [effw/2, -effh/2],
          [-effw/2, 0], [effw/2, 0],
          [-effw/2, effh/2], [0, effh/2], [effw/2, effh/2]
        ];
        ox.fillStyle = '#fff'; ox.strokeStyle = '#2266ee'; ox.lineWidth = 1.5 / zm;
        for (const [hx, hy] of pts) {
          ox.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
          ox.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs);
        }
        const rGap = 10 / zm;
        ox.strokeStyle = '#44aaff'; ox.lineWidth = 1 / zm;
        ox.beginPath(); ox.moveTo(0, -effh / 2);
        ox.lineTo(0, -effh / 2 - rGap); ox.stroke();
        ox.beginPath(); ox.arc(0, -effh / 2 - rGap, 4 / zm, 0, Math.PI * 2);
        ox.fillStyle = '#44aaff'; ox.fill();
      }
      ox.restore();
    }
    ox.restore();

    /* Shift-line preview */
    if (T._shiftPreview) {
      const sp = T._shiftPreview;
      ox.save();
      ox.strokeStyle = 'rgba(68,136,255,0.6)';
      ox.lineWidth = 1;
      ox.setLineDash([4, 3]);
      ox.beginPath();
      ox.moveTo(ix(sp.x0 + 0.5), iy(sp.y0 + 0.5));
      ox.lineTo(ix(sp.x1 + 0.5), iy(sp.y1 + 0.5));
      ox.stroke();
      ox.setLineDash([]);
      ox.restore();
    }

    /* Pixel Mask overlay */
    if (_pxMaskMode && _pxMaskCanvas) {
      mx.save();
      mx.globalAlpha = 0.5;
      mx.drawImage(_pxMaskCanvas, 0, 0);
      mx.restore();
    }

    /* Info bar */
    document.getElementById('ci').textContent =
      `${Math.round(zm * 100)}% | ${W}×${H}${tiledMode !== 'off' ? ' [Tiled:' + tiledMode + ']' : ''}`;
  }

  function s2c(cx2, cy2) {
    const r = ca.getBoundingClientRect();
    const sx = cx2 - r.left, sy = cy2 - r.top;
    const aW = ca.clientWidth, aH = ca.clientHeight;
    const dW = W * zm, dH = H * zm;
    return {
      x: (sx - (panX + (aW - dW) / 2)) / zm,
      y: (sy - (panY + (aH - dH) / 2)) / zm
    };
  }

  function sZ(z) { zm = Math.max(0.1, Math.min(128, z)); render(); }

  function zoomAt(factor, clientX, clientY) {
    const rect = ca.getBoundingClientRect();
    const msx = clientX - rect.left, msy = clientY - rect.top;
    const aW = ca.clientWidth, aH = ca.clientHeight;
    const cx = (msx - (panX + (aW - W * zm) / 2)) / zm;
    const cy = (msy - (panY + (aH - H * zm) / 2)) / zm;
    zm = Math.max(0.1, Math.min(128, zm * factor));
    panX = msx - (aW - W * zm) / 2 - cx * zm;
    panY = msy - (aH - H * zm) / 2 - cy * zm;
    render();
  }

  function zIn() { sZ(zm * 1.5); }
  function zOut() { sZ(zm / 1.5); }
  function z1x() { panX = 0; panY = 0; sZ(1); }

  function zFit() {
    const aW = ca.clientWidth - 16, aH = ca.clientHeight - 16;
    if (aW <= 0 || aH <= 0) { zm = 1; return; }
    zm = Math.min(aW / W, aH / H, 16);
    panX = 0; panY = 0;
    render();
  }

  function togGrid() { grid = !grid; render(); }

  function flipC(dir) {
    const fr = An.frames[An.cf];
    const sel = T.selection;
    const la = T.activeLayer();
    if (sel && sel.type === 'rect' && la && sel.w > 0 && sel.h > 0) {
      if (la.locked) { _showLockMsg(); return; }
      Hi.push();
      const sx = Math.max(0, Math.round(sel.x)), sy = Math.max(0, Math.round(sel.y));
      const sw = Math.min(Math.round(sel.w), W - sx), sh = Math.min(Math.round(sel.h), H - sy);
      if (sw > 0 && sh > 0) {
        const t2 = document.createElement('canvas');
        t2.width = sw; t2.height = sh;
        const tx = t2.getContext('2d');
        tx.save();
        if (dir === 'h') { tx.translate(sw, 0); tx.scale(-1, 1); }
        else { tx.translate(0, sh); tx.scale(1, -1); }
        tx.drawImage(la.canvas, sx, sy, sw, sh, 0, 0, sw, sh);
        tx.restore();
        la.ctx.clearRect(sx, sy, sw, sh);
        la.ctx.drawImage(t2, sx, sy);
      }
    } else {
      Hi.push();
      for (const ly of fr.layers) {
        if (ly.mask) {
          const mt = document.createElement('canvas');
          mt.width = W; mt.height = H;
          const mx2 = mt.getContext('2d');
          mx2.save();
          if (dir === 'h') { mx2.translate(W, 0); mx2.scale(-1, 1); }
          else { mx2.translate(0, H); mx2.scale(1, -1); }
          mx2.drawImage(ly.mask.canvas, 0, 0);
          mx2.restore();
          ly.mask.ctx.clearRect(0, 0, W, H);
          ly.mask.ctx.drawImage(mt, 0, 0);
        }
        const t2 = document.createElement('canvas');
        t2.width = W; t2.height = H;
        const tx = t2.getContext('2d');
        tx.save();
        if (dir === 'h') { tx.translate(W, 0); tx.scale(-1, 1); }
        else { tx.translate(0, H); tx.scale(1, -1); }
        tx.drawImage(ly.canvas, 0, 0);
        tx.restore();
        ly.ctx.clearRect(0, 0, W, H);
        ly.ctx.drawImage(t2, 0, 0);
      }
    }
    render(); Ly.ui();
  }

  function rotC(deg) {
    const fr = An.frames[An.cf];
    const sel = T.selection;
    const la = T.activeLayer();
    const ad = Math.abs(deg);
    if (sel && sel.type === 'rect' && la && sel.w > 0 && sel.h > 0) {
      if (la.locked) { _showLockMsg(); return; }
      Hi.push();
      const sx = Math.max(0, Math.round(sel.x)), sy = Math.max(0, Math.round(sel.y));
      const sw = Math.min(Math.round(sel.w), W - sx), sh = Math.min(Math.round(sel.h), H - sy);
      if (sw > 0 && sh > 0) {
        const src = document.createElement('canvas');
        src.width = sw; src.height = sh;
        src.getContext('2d').drawImage(la.canvas, sx, sy, sw, sh, 0, 0, sw, sh);
        const nw = (ad === 90 || ad === 270) ? sh : sw;
        const nh = (ad === 90 || ad === 270) ? sw : sh;
        const dst = document.createElement('canvas');
        dst.width = nw; dst.height = nh;
        const dx = dst.getContext('2d');
        dx.translate(nw / 2, nh / 2);
        dx.rotate(deg * Math.PI / 180);
        dx.drawImage(src, -sw / 2, -sh / 2);
        la.ctx.clearRect(sx, sy, sw, sh);
        const px = sx + Math.round((sw - nw) / 2);
        const py = sy + Math.round((sh - nh) / 2);
        la.ctx.drawImage(dst, Math.max(0, px), Math.max(0, py));
        T.selection = {
          type: 'rect',
          x: Math.max(0, px), y: Math.max(0, py),
          w: nw, h: nh
        };
      }
    } else {
      Hi.push();
      let nw = W, nh = H;
      if (ad === 90 || ad === 270) { nw = H; nh = W; }
      for (const ly of fr.layers) {
        const t2 = document.createElement('canvas');
        t2.width = nw; t2.height = nh;
        const tx = t2.getContext('2d');
        tx.translate(nw / 2, nh / 2);
        tx.rotate(deg * Math.PI / 180);
        tx.drawImage(ly.canvas, -W / 2, -H / 2);
        ly.canvas.width = nw; ly.canvas.height = nh;
        ly.ctx.imageSmoothingEnabled = false;
        ly.ctx.drawImage(t2, 0, 0);
        if (ly.mask) {
          const mt = document.createElement('canvas');
          mt.width = nw; mt.height = nh;
          const mx2 = mt.getContext('2d');
          mx2.translate(nw / 2, nh / 2);
          mx2.rotate(deg * Math.PI / 180);
          mx2.drawImage(ly.mask.canvas, -W / 2, -H / 2);
          ly.mask.canvas.width = nw;
          ly.mask.canvas.height = nh;
          ly.mask.ctx = ly.mask.canvas.getContext('2d', { willReadFrequently: true });
          ly.mask.ctx.imageSmoothingEnabled = false;
          ly.mask.ctx.drawImage(mt, 0, 0);
        }
      }
      if (ad === 90 || ad === 270) { W = nw; H = nh; }
      mc.width = W; mc.height = H;
      mkCk(); zFit();
    }
    render(); Ly.ui();
  }

  function resize(nw, nh) {
    Hi.push();
    for (const fr of An.frames) {
      for (const ly of fr.layers) {
        const t2 = document.createElement('canvas');
        t2.width = nw; t2.height = nh;
        const tx = t2.getContext('2d');
        tx.imageSmoothingEnabled = false;
        tx.drawImage(ly.canvas, 0, 0, nw, nh);
        ly.canvas.width = nw; ly.canvas.height = nh;
        ly.ctx.imageSmoothingEnabled = false;
        ly.ctx.drawImage(t2, 0, 0);
        if (ly.mask) {
          const mt = document.createElement('canvas');
          mt.width = nw; mt.height = nh;
          const mx2 = mt.getContext('2d');
          mx2.imageSmoothingEnabled = false;
          mx2.drawImage(ly.mask.canvas, 0, 0, nw, nh);
          ly.mask.canvas.width = nw; ly.mask.canvas.height = nh;
          ly.mask.ctx = ly.mask.canvas.getContext('2d', { willReadFrequently: true });
          ly.mask.ctx.imageSmoothingEnabled = false;
          ly.mask.ctx.drawImage(mt, 0, 0);
        }
      }
    }
    W = nw; H = nh;
    mc.width = W; mc.height = H;
    mkCk(); zFit(); Ly.ui();
  }

  function compClean() { return compFrame(An.frames[An.cf]); }

  return {
    get W() { return W; }, get H() { return H; },
    get zm() { return zm; }, set zm(v) { zm = v; },
    get px() { return panX; }, set px(v) { panX = v; },
    get py() { return panY; }, set py(v) { panY = v; },
    get gsz() { return gsz; }, set gsz(v) { gsz = v; },
    get bg() { return bg; },
    get pc() { return pCol; }, set pc(v) { pCol = v; },
    get sc() { return sCol; }, set sc(v) { sCol = v; },
    get area() { return ca; },
    get symHP() { return symHP; }, set symHP(v) { symHP = v; },
    get symVP() { return symVP; }, set symVP(v) { symVP = v; },
    get guideH() { return guideH; }, set guideH(v) { guideH = v; },
    get guideV() { return guideV; }, set guideV(v) { guideV = v; },
    get guideHY() { return guideHY; }, set guideHY(v) { guideHY = v; },
    get guideVX() { return guideVX; }, set guideVX(v) { guideVX = v; },
    get gridColor() { return gridColor; }, set gridColor(v) { gridColor = v; },
    get gridAlpha() { return gridAlpha; }, set gridAlpha(v) { gridAlpha = v; },
    get gridThick() { return gridThick; }, set gridThick(v) { gridThick = v; },
    get ckSize() { return ckSize; },
    set ckSize(v) { ckSize = v; mkCk(); render(); },
    get ckCol1() { return ckCol1; }, set ckCol1(v) { ckCol1 = v; mkCk(); render(); },
    get ckCol2() { return ckCol2; }, set ckCol2(v) { ckCol2 = v; mkCk(); render(); },
    get tiledMode() { return tiledMode; },
    set tiledMode(v) { tiledMode = v; render(); },
    init, render, scheduleRender, s2c, c2s, sZ, zoomAt, zIn, zOut, zFit, z1x,
    togGrid, flipC, rotC, resize, compClean, compFrame, mkCk
  };
})();

/* ===== LAYERS ===== */
const Ly = (() => {
  const _maskTmpCanvas = document.createElement('canvas');
  const _maskTmpCtx = _maskTmpCanvas.getContext('2d', { willReadFrequently: true });
  _maskTmpCtx.imageSmoothingEnabled = false;

  function _fitMaskTmp() {
    if (_maskTmpCanvas.width !== C.W) _maskTmpCanvas.width = C.W;
    if (_maskTmpCanvas.height !== C.H) _maskTmpCanvas.height = C.H;
    _maskTmpCtx.imageSmoothingEnabled = false;
  }

  function _refreshMaskCtx(mask) {
    mask.ctx = mask.canvas.getContext('2d', { willReadFrequently: true });
    mask.ctx.imageSmoothingEnabled = false;
  }

  function _mkMask() {
    const mask = {
      canvas: document.createElement('canvas'),
      ctx: null,
      enabled: true,
      editing: true
    };
    mask.canvas.width = C.W;
    mask.canvas.height = C.H;
    _refreshMaskCtx(mask);
    mask.ctx.fillStyle = 'rgba(255,255,255,1)';
    mask.ctx.fillRect(0, 0, C.W, C.H);
    return mask;
  }

  function ensureMask(layer) {
    if (!layer.mask) layer.mask = _mkMask();
    return layer.mask;
  }

  function cloneMask(mask) {
    if (!mask) return null;
    const copy = _mkMask();
    copy.ctx.clearRect(0, 0, C.W, C.H);
    copy.ctx.drawImage(mask.canvas, 0, 0);
    copy.enabled = !!mask.enabled;
    copy.editing = !!mask.editing;
    return copy;
  }

  function clone(layer, newName = layer.name) {
    const copy = mk(newName);
    copy.ctx.drawImage(layer.canvas, 0, 0);
    copy.opacity = layer.opacity;
    copy.visible = layer.visible;
    copy.locked = layer.locked;
    copy.blendMode = _sanitizeBlendMode(layer.blendMode);
    copy.mask = cloneMask(layer.mask);
    return copy;
  }

  function _grayFromHex(hex) {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return Math.round(r * 0.299 + g * 0.587 + b * 0.114);
  }

  function isMaskEditing(layer) {
    return !!(layer && layer.mask && layer.mask.enabled && layer.mask.editing);
  }

  function addMask() {
    const f = fr();
    if (!f) return;
    const layer = f.layers[f.activeLayer];
    if (!layer) return;
    if (!layer.mask) Hi.push();
    const mask = ensureMask(layer);
    mask.enabled = true;
    mask.editing = true;
    if (_layerSync) syncMaskToAllFrames(f.activeLayer);
    ui(); C.render();
  }

  function cycleMask(layer) {
    if (!layer) return;
    Hi.push();
    if (!layer.mask) {
      const mask = ensureMask(layer);
      mask.enabled = true;
      mask.editing = true;
    } else if (layer.mask.editing) {
      layer.mask.editing = false;
      layer.mask.enabled = true;
    } else if (layer.mask.enabled) {
      layer.mask.enabled = false;
      layer.mask.editing = false;
    } else {
      layer.mask.enabled = true;
      layer.mask.editing = true;
    }
    if (_layerSync) syncMaskToAllFrames(An.frames[An.cf].activeLayer);
    ui(); C.render();
  }

  /* Blend mode support */
  const _nativeBlendSupport = new Map();
  const _blendProbeCtx = document.createElement('canvas').getContext('2d');

  function _sanitizeBlendMode(mode) {
    return LAYER_BLEND_MODES.includes(mode) ? mode : 'normal';
  }

  function _supportsNativeBlend(mode) {
    mode = _sanitizeBlendMode(mode);
    if (_nativeBlendSupport.has(mode)) return _nativeBlendSupport.get(mode);
    const op = LAYER_BLEND_NATIVE_OPS[mode];
    if (!op || !_blendProbeCtx) {
      _nativeBlendSupport.set(mode, false);
      return false;
    }
    _blendProbeCtx.globalCompositeOperation = 'source-over';
    _blendProbeCtx.globalCompositeOperation = op;
    const ok = _blendProbeCtx.globalCompositeOperation === op;
    _nativeBlendSupport.set(mode, ok);
    return ok;
  }

  function _blendOptionsHTML(selectedMode = 'normal') {
    const safe = _sanitizeBlendMode(selectedMode);
    return LAYER_BLEND_MODES.map(mode => {
      const selected = mode === safe ? ' selected' : '';
      return `<option value="${mode}"${selected}>${LAYER_BLEND_LABELS[mode]}</option>`;
    }).join('');
  }

  function _ensureBlendSelectBuilt() {
    const sel = document.getElementById('lblend');
    if (!sel || sel.dataset.ready === '1') return;
    sel.innerHTML = _blendOptionsHTML('normal');
    sel.dataset.ready = '1';
    sel.addEventListener('change', function () {
      setBlendMode(this.value);
    });
  }

  function setBlendMode(mode) {
    const f = fr();
    if (!f) return;
    const ly = f.layers[f.activeLayer];
    if (!ly) return;
    const safe = _sanitizeBlendMode(mode);
    if (ly.blendMode === safe) { sOp(); return; }
    Hi.push();
    ly.blendMode = safe;
    if (_layerSync) {
      for (const frm of An.frames) {
        const m = _findByName(ly.name, frm);
        if (m && m !== ly) m.blendMode = safe;
      }
    }
    sOp(); C.render(); An.uStrip();
  }

  function openBlendDialog() {
    const f = fr();
    if (!f) return;
    const ly = f.layers[f.activeLayer];
    if (!ly) return;
    U.sMo(`
      <h3>Blending Mode</h3>
      <label>
        Mode
        <select id="blend_mode_picker">${_blendOptionsHTML(ly.blendMode)}</select>
      </label>
      <p style="font-size:9px;color:var(--txd);margin-top:8px">
        This affects live rendering, Merge Down, Flatten, thumbnails, and export.
      </p>
      <div class="mb">
        <button class="bsc" onclick="U.cMo()">Cancel</button>
        <button class="bp" id="blend_apply_btn">Apply</button>
      </div>
    `);
    document.getElementById('blend_apply_btn').onclick = () => {
      const v = document.getElementById('blend_mode_picker').value;
      setBlendMode(v);
      U.cMo();
    };
  }

  function _getEffectiveLayerCanvas(layer) {
    if (!layer.mask || !layer.mask.enabled) return layer.canvas;
    _fitMaskTmp();
    _maskTmpCtx.clearRect(0, 0, C.W, C.H);
    _maskTmpCtx.globalAlpha = 1;
    _maskTmpCtx.globalCompositeOperation = 'source-over';
    _maskTmpCtx.drawImage(layer.canvas, 0, 0);
    _maskTmpCtx.globalCompositeOperation = 'destination-in';
    _maskTmpCtx.drawImage(layer.mask.canvas, 0, 0);
    _maskTmpCtx.globalCompositeOperation = 'source-over';
    return _maskTmpCanvas;
  }

  function _getCanvasReadContext(canvas) {
    if (canvas === _maskTmpCanvas) return _maskTmpCtx;
    return canvas.getContext('2d', { willReadFrequently: true });
  }

  function _clamp255(v) {
    return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
  }

  function _hash8(x, y) {
    let n = (((x + 1) * 73856093) ^ ((y + 1) * 19349663)) >>> 0;
    n ^= n >>> 13;
    n = (n * 1274126177) >>> 0;
    return n & 255;
  }

  function _rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d) + (g < b ? 6 : 0); break;
        case g: h = ((b - r) / d) + 2; break;
        default: h = ((r - g) / d) + 4; break;
      }
      h /= 6;
    }
    return [h, s, l];
  }

  function _hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  function _hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : (l + s - l * s);
      const p = 2 * l - q;
      r = _hueToRgb(p, q, h + 1 / 3);
      g = _hueToRgb(p, q, h);
      b = _hueToRgb(p, q, h - 1 / 3);
    }
    return [_clamp255(r * 255), _clamp255(g * 255), _clamp255(b * 255)];
  }

  function _multiplyCh(b, s) { return _clamp255((b * s) / 255); }
  function _screenCh(b, s) { return _clamp255(255 - ((255 - b) * (255 - s)) / 255); }
  function _overlayCh(b, s) {
    b /= 255; s /= 255;
    return _clamp255((b <= 0.5 ? (2 * b * s) : (1 - 2 * (1 - b) * (1 - s))) * 255);
  }
  function _hardLightCh(b, s) { return _overlayCh(s, b); }
  function _softLightCh(b, s) {
    b /= 255; s /= 255;
    let out;
    if (s <= 0.5) {
      out = b - (1 - 2 * s) * b * (1 - b);
    } else {
      const d = b <= 0.25 ? (((16 * b - 12) * b + 4) * b) : Math.sqrt(b);
      out = b + (2 * s - 1) * (d - b);
    }
    return _clamp255(out * 255);
  }
  function _colorBurnCh(b, s) {
    if (s <= 0) return 0;
    return _clamp255(255 - ((255 - b) * 255) / s);
  }
  function _colorDodgeCh(b, s) {
    if (s >= 255) return 255;
    return _clamp255((b * 255) / (255 - s));
  }
  function _vividLightCh(b, s) {
    return s < 128
      ? _colorBurnCh(b, Math.min(255, s * 2))
      : _colorDodgeCh(b, Math.min(255, (s - 128) * 2));
  }
  function _linearLightCh(b, s) { return _clamp255(b + 2 * s - 255); }
  function _pinLightCh(b, s) {
    return s < 128 ? Math.min(b, s * 2) : Math.max(b, (s - 128) * 2);
  }

  function _blendRGB(mode, br, bg, bb, sr, sg, sb) {
    switch (mode) {
      case 'normal': case 'dissolve': case 'behind': case 'clear':
        return [sr, sg, sb];
      case 'darken':
        return [Math.min(br, sr), Math.min(bg, sg), Math.min(bb, sb)];
      case 'multiply':
        return [_multiplyCh(br, sr), _multiplyCh(bg, sg), _multiplyCh(bb, sb)];
      case 'color-burn':
        return [_colorBurnCh(br, sr), _colorBurnCh(bg, sg), _colorBurnCh(bb, sb)];
      case 'linear-burn':
        return [_clamp255(br + sr - 255), _clamp255(bg + sg - 255), _clamp255(bb + sb - 255)];
      case 'darker-color':
        return (br + bg + bb) <= (sr + sg + sb) ? [br, bg, bb] : [sr, sg, sb];
      case 'lighten':
        return [Math.max(br, sr), Math.max(bg, sg), Math.max(bb, sb)];
      case 'screen':
        return [_screenCh(br, sr), _screenCh(bg, sg), _screenCh(bb, sb)];
      case 'color-dodge':
        return [_colorDodgeCh(br, sr), _colorDodgeCh(bg, sg), _colorDodgeCh(bb, sb)];
      case 'linear-dodge':
        return [_clamp255(br + sr), _clamp255(bg + sg), _clamp255(bb + sb)];
      case 'lighter-color':
        return (br + bg + bb) >= (sr + sg + sb) ? [br, bg, bb] : [sr, sg, sb];
      case 'overlay':
        return [_overlayCh(br, sr), _overlayCh(bg, sg), _overlayCh(bb, sb)];
      case 'soft-light':
        return [_softLightCh(br, sr), _softLightCh(bg, sg), _softLightCh(bb, sb)];
      case 'hard-light':
        return [_hardLightCh(br, sr), _hardLightCh(bg, sg), _hardLightCh(bb, sb)];
      case 'vivid-light':
        return [_vividLightCh(br, sr), _vividLightCh(bg, sg), _vividLightCh(bb, sb)];
      case 'linear-light':
        return [_linearLightCh(br, sr), _linearLightCh(bg, sg), _linearLightCh(bb, sb)];
      case 'pin-light':
        return [_pinLightCh(br, sr), _pinLightCh(bg, sg), _pinLightCh(bb, sb)];
      case 'hard-mix':
        return [(br + sr >= 255) ? 255 : 0, (bg + sg >= 255) ? 255 : 0, (bb + sb >= 255) ? 255 : 0];
      case 'difference':
        return [Math.abs(br - sr), Math.abs(bg - sg), Math.abs(bb - sb)];
      case 'exclusion':
        return [_clamp255(br + sr - (2 * br * sr) / 255), _clamp255(bg + sg - (2 * bg * sg) / 255), _clamp255(bb + sb - (2 * bb * sb) / 255)];
      case 'subtract':
        return [Math.max(0, br - sr), Math.max(0, bg - sg), Math.max(0, bb - sb)];
      case 'divide':
        return [sr <= 0 ? 255 : _clamp255((br / sr) * 255), sg <= 0 ? 255 : _clamp255((bg / sg) * 255), sb <= 0 ? 255 : _clamp255((bb / sb) * 255)];
      case 'hue': {
        const [sh] = _rgbToHsl(sr, sg, sb);
        const [, bs, bl] = _rgbToHsl(br, bg, bb);
        return _hslToRgb(sh, bs, bl);
      }
      case 'saturation': {
        const [, ss] = _rgbToHsl(sr, sg, sb);
        const [bh, , bl] = _rgbToHsl(br, bg, bb);
        return _hslToRgb(bh, ss, bl);
      }
      case 'color': {
        const [sh, ss] = _rgbToHsl(sr, sg, sb);
        const [, , bl] = _rgbToHsl(br, bg, bb);
        return _hslToRgb(sh, ss, bl);
      }
      case 'luminosity': {
        const [, , sl] = _rgbToHsl(sr, sg, sb);
        const [bh, bs] = _rgbToHsl(br, bg, bb);
        return _hslToRgb(bh, bs, sl);
      }
      default:
        return [sr, sg, sb];
    }
  }

  function _softwareBlendInto(ctx, sourceCanvas, alphaScale, mode) {
    const srcCtx = _getCanvasReadContext(sourceCanvas);
    if (!srcCtx) return;
    const w = C.W, h = C.H;
    const dst = ctx.getImageData(0, 0, w, h);
    const src = srcCtx.getImageData(0, 0, w, h);
    const d = dst.data, s = src.data;

    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const br = d[i], bg2 = d[i + 1], bb = d[i + 2], ba = d[i + 3] / 255;
      const sr = s[i], sg = s[i + 1], sb = s[i + 2];
      let sa = (s[i + 3] / 255) * alphaScale;
      if (sa <= 0) continue;

      if (mode === 'dissolve') {
        const x = p % w, y = (p / w) | 0;
        if ((_hash8(x, y) / 255) > sa) continue;
        sa = 1;
      }

      const rgb = _blendRGB(mode, br, bg2, bb, sr, sg, sb);
      const ao = sa + ba * (1 - sa);
      if (ao <= 0) {
        d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = 0;
        continue;
      }
      d[i] = _clamp255((((1 - sa) * ba * br) + ((1 - ba) * sa * sr) + (ba * sa * rgb[0])) / ao);
      d[i + 1] = _clamp255((((1 - sa) * ba * bg2) + ((1 - ba) * sa * sg) + (ba * sa * rgb[1])) / ao);
      d[i + 2] = _clamp255((((1 - sa) * ba * bb) + ((1 - ba) * sa * sb) + (ba * sa * rgb[2])) / ao);
      d[i + 3] = _clamp255(ao * 255);
    }
    ctx.putImageData(dst, 0, 0);
  }

  function drawTo(ctx, layer) {
    if (!layer || !layer.visible) return;
    const prevAlpha = ctx.globalAlpha;
    const prevComp = ctx.globalCompositeOperation;
    const blendMode = _sanitizeBlendMode(layer.blendMode);
    const layerAlpha = prevAlpha * (layer.opacity / 100);
    const sourceCanvas = _getEffectiveLayerCanvas(layer);
    const nativeOp = LAYER_BLEND_NATIVE_OPS[blendMode];
    if (nativeOp && _supportsNativeBlend(blendMode)) {
      ctx.globalAlpha = layerAlpha;
      ctx.globalCompositeOperation = nativeOp;
      ctx.drawImage(sourceCanvas, 0, 0);
      ctx.globalCompositeOperation = prevComp;
      ctx.globalAlpha = prevAlpha;
      return;
    }
    _softwareBlendInto(ctx, sourceCanvas, layerAlpha, blendMode);
    ctx.globalCompositeOperation = prevComp;
    ctx.globalAlpha = prevAlpha;
  }

  function _plotMaskLine(x0, y0, x1, y1, cb) {
    x0 = Math.floor(x0); y0 = Math.floor(y0);
    x1 = Math.floor(x1); y1 = Math.floor(y1);
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      cb(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = err * 2;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  function paintMaskDot(layer, x, y, sz, forcedGray = null) {
    const mask = ensureMask(layer);
    const gray = forcedGray === null ? _grayFromHex(C.pc) : forcedGray;
    const size = Math.max(1, Math.round(sz));
    const half = size / 2;
    const left = Math.max(0, Math.floor(x - half) - 1);
    const top = Math.max(0, Math.floor(y - half) - 1);
    const right = Math.min(C.W - 1, Math.ceil(x + half) + 1);
    const bottom = Math.min(C.H - 1, Math.ceil(y + half) + 1);
    const w = right - left + 1, h = bottom - top + 1;
    if (w <= 0 || h <= 0) return;
    const id = mask.ctx.getImageData(left, top, w, h);
    const d = id.data;
    const useSquare = T.brushShape === 'square';
    const radius = size / 2, r2 = radius * radius;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const gx = left + px, gy = top + py;
        if (T.selection && !T.selectionHit(gx, gy)) continue;
        let inside = false;
        if (useSquare) {
          inside = Math.abs((gx + 0.5) - (x + 0.5)) <= radius &&
                   Math.abs((gy + 0.5) - (y + 0.5)) <= radius;
        } else {
          const dx = (gx + 0.5) - (x + 0.5), dy = (gy + 0.5) - (y + 0.5);
          inside = (dx * dx + dy * dy) <= r2;
        }
        if (!inside) continue;
        const i = (py * w + px) * 4;
        d[i] = gray; d[i + 1] = gray; d[i + 2] = gray; d[i + 3] = gray;
      }
    }
    mask.ctx.putImageData(id, left, top);
  }

  function paintMaskLine(layer, x0, y0, x1, y1, sz, forcedGray = null) {
    _plotMaskLine(x0, y0, x1, y1, (px, py) => {
      paintMaskDot(layer, px, py, sz, forcedGray);
    });
  }

  function applyMask() {
    const f = fr();
    if (!f) return;
    const layer = f.layers[f.activeLayer];
    if (!layer || !layer.mask) return;
    Hi.push();
    const art = layer.ctx.getImageData(0, 0, C.W, C.H);
    const a = art.data;
    const m = layer.mask.ctx.getImageData(0, 0, C.W, C.H).data;
    for (let i = 0; i < a.length; i += 4) {
      a[i + 3] = Math.round(a[i + 3] * (m[i + 3] / 255));
    }
    layer.ctx.putImageData(art, 0, 0);
    layer.mask = null;
    if (_layerSync) {
      for (let fi = 0; fi < An.frames.length; fi++) {
        if (fi === An.cf) continue;
        const other = _findByName(layer.name, An.frames[fi]);
        if (!other) continue;
        other.ctx.clearRect(0, 0, C.W, C.H);
        other.ctx.drawImage(layer.canvas, 0, 0);
        other.mask = null;
      }
    }
    ui(); C.render();
  }

    function _findByName(name, frame) {
        if (!name || !frame) return null;
        return frame.layers.find(ly => ly.name === name) || null;
      }

  function syncMaskToAllFrames(layerIndex) {
    const src = An.frames[An.cf].layers[layerIndex];
    if (!src) return;
    for (let fi = 0; fi < An.frames.length; fi++) {
      if (fi === An.cf) continue;
      const dst = _findByName(src.name, An.frames[fi]);
      if (!dst) continue;
      dst.mask = cloneMask(src.mask);
    }
  }

  function mk(n) {
    const c = document.createElement('canvas');
    c.width = C.W; c.height = C.H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    return {
      name: n || 'Layer', canvas: c, ctx,
      visible: true, opacity: 100, locked: false,
      blendMode: 'normal', mask: null
    };
  }

  function getMoveSel(frame = fr()) {
    if (!frame) return null;
    if (!frame._moveSel) frame._moveSel = new Set();
    return frame._moveSel;
  }

  function cleanupMoveSel(frame = fr()) {
    if (!frame) return;
    const sel = getMoveSel(frame);
    for (const layer of [...sel]) {
      if (!frame.layers.includes(layer)) sel.delete(layer);
    }
  }

  function hasMoveSel(frame = fr()) {
    if (!frame) return false;
    cleanupMoveSel(frame);
    return getMoveSel(frame).size > 0;
  }

  function toggleMoveSel(layer) {
    const f = fr();
    if (!f || !layer) return;
    cleanupMoveSel(f);
    const sel = getMoveSel(f);
    if (sel.has(layer)) sel.delete(layer); else sel.add(layer);
    ui();
  }

  function fr() { return An.frames[An.cf]; }

  function add() {
    const f = fr(); if (!f) return;
    Hi.push();
    f.layers.push(mk('Layer ' + (f.layers.length + 1)));
    f.activeLayer = f.layers.length - 1;
    ui(); C.render();
  }

  function rm() {
    const f = fr(); if (!f || f.layers.length <= 1) return;
    Hi.push();
    f.layers.splice(f.activeLayer, 1);
    f.activeLayer = Math.min(f.activeLayer, f.layers.length - 1);
    ui(); C.render();
  }

  function dup() {
    const f = fr(); if (!f) return;
    const s = f.layers[f.activeLayer];
    if (!s) return;
    Hi.push();
    const d = clone(s, s.name + ' copy');
   }

  function up() {
    const f = fr(); if (!f) return;
    cleanupMoveSel(f);
    if (!hasMoveSel(f)) {
      const i = f.activeLayer;
      if (i >= f.layers.length - 1) return;
      [f.layers[i], f.layers[i + 1]] = [f.layers[i + 1], f.layers[i]];
      f.activeLayer++;
      ui(); C.render(); return;
    }
    const sel = getMoveSel(f);
    const activeRef = f.layers[f.activeLayer];
    let moved = false;
    for (let i = f.layers.length - 2; i >= 0; i--) {
      const cur = f.layers[i], above = f.layers[i + 1];
      if (sel.has(cur) && !sel.has(above)) {
        [f.layers[i], f.layers[i + 1]] = [f.layers[i + 1], f.layers[i]];
        moved = true;
      }
    }
    if (!moved) return;
    f.activeLayer = Math.max(0, f.layers.indexOf(activeRef));
    ui(); C.render();
  }

  function dn() {
    const f = fr(); if (!f) return;
    cleanupMoveSel(f);
    if (!hasMoveSel(f)) {
      const i = f.activeLayer;
      if (i <= 0) return;
      [f.layers[i], f.layers[i - 1]] = [f.layers[i - 1], f.layers[i]];
      f.activeLayer--;
      ui(); C.render(); return;
    }
    const sel = getMoveSel(f);
    const activeRef = f.layers[f.activeLayer];
    let moved = false;
    for (let i = 1; i < f.layers.length; i++) {
      const cur = f.layers[i], below = f.layers[i - 1];
      if (sel.has(cur) && !sel.has(below)) {
        [f.layers[i], f.layers[i - 1]] = [f.layers[i - 1], f.layers[i]];
        moved = true;
      }
    }
    if (!moved) return;
    f.activeLayer = Math.max(0, f.layers.indexOf(activeRef));
    ui(); C.render();
  }

  function mergeDown() {
    const f = fr(); if (!f) return;
    const i = f.activeLayer;
    if (i <= 0) return;
    Hi.push();
    Ly.drawTo(f.layers[i - 1].ctx, f.layers[i]);
    f.layers.splice(i, 1);
    f.activeLayer = i - 1;
    ui(); C.render();
  }

  function flatten() {
    const f = fr(); if (!f) return;
    Hi.push();
    const m = mk('Flat');
    if (C.bg === 'white') { m.ctx.fillStyle = '#fff'; m.ctx.fillRect(0, 0, C.W, C.H); }
    for (const ly of f.layers) { Ly.drawTo(m.ctx, ly); }
    m.ctx.globalAlpha = 1;
    f.layers = [m]; f.activeLayer = 0;
    ui(); C.render();
  }

  function syncAll() {
    const f = fr(); if (!f) return;
    const src = f.layers[f.activeLayer], idx = f.activeLayer;
    Hi.push();
    for (let i = 0; i < An.frames.length; i++) {
      if (i === An.cf) continue;
      const frame = An.frames[i];
      const cp = clone(src);
      const ins = Math.min(idx, frame.layers.length);
      frame.layers.splice(ins, 0, cp);
      if (frame.activeLayer >= ins) frame.activeLayer++;
    }
    ui(); C.render();
  }

  function syncSel() {
    const f = fr(); if (!f) return;
    if (T.selFrames.size === 0) { alert('Select frames first'); return; }
    const src = f.layers[f.activeLayer], idx = f.activeLayer;
    Hi.push();
    for (const i of T.selFrames) {
      if (i === An.cf || !An.frames[i]) continue;
      const frame = An.frames[i];
      const cp = clone(src);
      const ins = Math.min(idx, frame.layers.length);
      frame.layers.splice(ins, 0, cp);
      if (frame.activeLayer >= ins) frame.activeLayer++;
    }
    ui(); C.render();
  }

  function rmAll() {
    const f = fr(); if (!f) return;
    const idx = f.activeLayer;
    Hi.push();
    for (const frame of An.frames) {
      if (frame.layers.length > 1 && idx < frame.layers.length) {
        frame.layers.splice(idx, 1);
        if (frame.activeLayer >= frame.layers.length)
          frame.activeLayer = frame.layers.length - 1;
      }
    }
    ui(); C.render();
  }

  function detachAll() {
    const f = fr(); if (!f) return;
    const idx = f.activeLayer;
    Hi.push();
    let lowestFrame = -1;
    for (let i = 0; i < An.frames.length; i++) {
      if (idx < An.frames[i].layers.length) { lowestFrame = i; break; }
    }
    for (let i = 0; i < An.frames.length; i++) {
      if (i === lowestFrame) continue;
      const frame = An.frames[i];
      if (frame.layers.length > 1 && idx < frame.layers.length) {
        frame.layers.splice(idx, 1);
        if (frame.activeLayer >= frame.layers.length)
          frame.activeLayer = frame.layers.length - 1;
      }
    }
    ui(); C.render();
  }

  function detachSel() {
    const f = fr(); if (!f) return;
    if (T.selFrames.size === 0) { alert('Select frames first (Shift+click in timeline)'); return; }
    const idx = f.activeLayer;
    Hi.push();
    for (const i of T.selFrames) {
      if (!An.frames[i]) continue;
      const frame = An.frames[i];
      if (frame.layers.length > 1 && idx < frame.layers.length) {
        frame.layers.splice(idx, 1);
        if (frame.activeLayer >= frame.layers.length)
          frame.activeLayer = frame.layers.length - 1;
      }
    }
    ui(); C.render();
  }

  function ren() {
    const f = fr(); if (!f) return;
    const ly = f.layers[f.activeLayer];
    const n = prompt('Rename layer:', ly.name);
    if (n && n.trim()) { Hi.push(); ly.name = n.trim(); ui(); }
  }

  function ui() {
    const f = fr(); if (!f) return;
    const list = document.getElementById('ll');
    list.innerHTML = '';
    cleanupMoveSel(f);
    const moveSel = getMoveSel(f);

    for (let i = f.layers.length - 1; i >= 0; i--) {
      const ly = f.layers[i];
      const div = document.createElement('div');
      div.className = 'li' + (i === f.activeLayer ? ' act' : '');

      const th = document.createElement('canvas');
      th.className = 'lt'; th.width = 28; th.height = 16;
      const preview = document.createElement('canvas');
      preview.width = C.W; preview.height = C.H;
      const pctx = preview.getContext('2d', { willReadFrequently: true });
      pctx.imageSmoothingEnabled = false;
      Ly.drawTo(pctx, ly);
      th.getContext('2d').drawImage(preview, 0, 0, 28, 16);

      const mb = document.createElement('button');
      mb.type = 'button'; mb.className = 'lm'; mb.textContent = '▣';
      if (!ly.mask) mb.classList.add('off');
      else if (ly.mask.editing) mb.classList.add('edit');
      else if (ly.mask.enabled) mb.classList.add('on');
      else mb.classList.add('off');
      mb.title = !ly.mask ? 'Add Mask' :
        ly.mask.editing ? 'Mask editing ON' :
        ly.mask.enabled ? 'Mask ON' : 'Mask OFF';
      mb.onclick = ev => {
        ev.stopPropagation();
        f.activeLayer = i;
        cycleMask(ly);
      };

      const nm = document.createElement('span');
      nm.className = 'ln';
      nm.textContent = ly.name;                      
      nm.title = `${ly.name} — ${LAYER_BLEND_LABELS[_sanitizeBlendMode(ly.blendMode)]}`;
      nm.ondblclick = () => {
        const n = prompt('Name:', ly.name);
        if (n) { ly.name = n; ui(); }
      };

      const mv = document.createElement('button');
      mv.type = 'button';
      mv.className = 'lm move' + (moveSel.has(ly) ? ' on' : '');
      mv.textContent = '↕';
      mv.title = moveSel.has(ly) ? 'Selected for multi-move' : 'Select for multi-move';
      mv.onclick = ev => {
        ev.stopPropagation();
        f.activeLayer = i;
        toggleMoveSel(ly);
        sOp();
      };

      const lk = document.createElement('span');
      lk.className = 'lv';
      lk.textContent = ly.locked ? '\u{1F512}' : '\u{1F513}';
      lk.title = ly.locked ? 'Unlock layer' : 'Lock layer';
      if (ly.locked) lk.style.cssText = 'background:#c22;color:#fff;border-radius:2px;padding:0 2px';
      lk.onclick = ev => {
        ev.stopPropagation();
        ly.locked = !ly.locked;
        if (T.selFrames.size === An.frames.length) {
          for (const frm of An.frames) {
            if (frm.layers[i]) frm.layers[i].locked = ly.locked;
          }
        }
        ui();
      };

      const vs = document.createElement('span');
      vs.className = 'lv';
      vs.textContent = ly.visible ? '👁' : '—';
      vs.onclick = ev => {
        ev.stopPropagation();
        ly.visible = !ly.visible;
        if (T.selFrames.size === An.frames.length) {
          for (const frm of An.frames) {
            if (frm.layers[i]) frm.layers[i].visible = ly.visible;
          }
        }
        ui(); C.render();
      };

      div.append(th, mb, nm, mv, lk, vs);
      div.onclick = () => { f.activeLayer = i; ui(); sOp(); };
      list.append(div);
    }
    sOp(); An.uStrip();
  }

  function sOp() {
    const f = fr(); if (!f) return;
    const ly = f.layers[f.activeLayer]; if (!ly) return;
    document.getElementById('lop').value = ly.opacity;
    document.getElementById('lov').textContent = ly.opacity;
    _ensureBlendSelectBuilt();
    const blendSel = document.getElementById('lblend');
    if (blendSel) blendSel.value = _sanitizeBlendMode(ly.blendMode);
  }

  return {
     mk, clone, ensureMask, cloneMask, isMaskEditing, _findByName,
    addMask, cycleMask, drawTo,
    paintMaskDot, paintMaskLine, applyMask, syncMaskToAllFrames,
    setBlendMode, openBlendDialog,
    add, rm, dup, up, dn, mergeDown, flatten,
    syncAll, syncSel, rmAll, detachAll, detachSel, ren, ui, sOp
  };
})();

/* ===== ANIMATION ===== */
const An = (() => {
  let frames = [], cf = 0, playing = false, timer = null;
  let onion = false, onionAll = false;

  function mkF() {
    return { layers: [Ly.mk('Layer 1')], activeLayer: 0, duration: 100 };
  }

  function init() { frames = [mkF()]; cf = 0; uStrip(); Ly.ui(); }

  function addF() {
    Hi.push();
    frames.splice(cf + 1, 0, mkF());
    cf++; uStrip(); Ly.ui(); C.render();
  }

  function dupF() {
    Hi.push();
    const s = frames[cf];
    const d = { layers: [], activeLayer: s.activeLayer, duration: s.duration };
    for (const ly of s.layers) { d.layers.push(Ly.clone(ly)); }
    frames.splice(cf + 1, 0, d);
    cf++; uStrip(); Ly.ui(); C.render();
  }

  function rmF() {
    if (frames.length <= 1) return;
    Hi.push();
    frames.splice(cf, 1);
    cf = Math.min(cf, frames.length - 1);
    uStrip(); Ly.ui(); C.render();
  }

  function goTo(i) {
    cf = Math.max(0, Math.min(frames.length - 1, i));
    uStrip(); Ly.ui(); C.render(); syncDur();
  }

  function prev() { goTo(cf - 1); }
  function next() { goTo(cf + 1); }

  function moveL() {
    const sel = [...T.selFrames].sort((a, b) => a - b);
    if (sel.length > 0) {
      if (sel[0] <= 0) return;
      for (const i of sel) {
        [frames[i], frames[i - 1]] = [frames[i - 1], frames[i]];
      }
      T.selFrames.clear();
      for (const i of sel) T.selFrames.add(i - 1);
      if (T.selFrames.has(cf - 1) || sel.includes(cf)) cf = Math.max(0, cf - 1);
      uStrip(); Ly.ui(); C.render(); return;
    }
    if (cf <= 0) return;
    [frames[cf], frames[cf - 1]] = [frames[cf - 1], frames[cf]];
    cf--; uStrip(); Ly.ui(); C.render();
  }

  function moveR() {
    const sel = [...T.selFrames].sort((a, b) => b - a);
    if (sel.length > 0) {
      if (sel[0] >= frames.length - 1) return;
      for (const i of sel) {
        [frames[i], frames[i + 1]] = [frames[i + 1], frames[i]];
      }
      const oldSel = [...T.selFrames];
      T.selFrames.clear();
      for (const i of oldSel) T.selFrames.add(i + 1);
      if (oldSel.includes(cf)) cf = Math.min(frames.length - 1, cf + 1);
      uStrip(); Ly.ui(); C.render(); return;
    }
    if (cf >= frames.length - 1) return;
    [frames[cf], frames[cf + 1]] = [frames[cf + 1], frames[cf]];
    cf++; uStrip(); Ly.ui(); C.render();
  }

  function selAllF() {
    if (T.selFrames.size === frames.length) T.selFrames.clear();
    else for (let i = 0; i < frames.length; i++) T.selFrames.add(i);
    uStrip();
  }

  let _ds = false;
  function pp() {
    if (playing) { stop(); return; }
    playing = true;
    document.getElementById('bp').textContent = '⏸';
    document.getElementById('bp').classList.add('on');
    document.getElementById('bp').classList.add('playing');
    _ds = true; tick();
  }

  function tick() {
    if (!playing) return;
    cf = (cf + 1) % frames.length;
    C.render(); Ly.ui(); syncDur();
    document.getElementById('fi').textContent = `${cf + 1}/${frames.length}`;
    const thumbs = document.getElementById('fs').children;
    for (let i = 0; i < thumbs.length; i++)
      thumbs[i].classList.toggle('act', i === cf);
    timer = setTimeout(tick, Math.max(16, frames[cf].duration || 100));
  }

  function stop() {
    playing = false; clearTimeout(timer);
    document.getElementById('bp').textContent = '▶';
    document.getElementById('bp').classList.remove('on');
    document.getElementById('bp').classList.remove('playing');
    if (_ds) { _ds = false; cf = 0; uStrip(); Ly.ui(); C.render(); syncDur(); }
  }

  function togOnion() {
    onion = !onion;
    if (!onion) onionAll = false;
    document.getElementById('bo').classList.toggle('on', onion);
    const oab = document.getElementById('boa');
    if (oab) oab.classList.toggle('on', onionAll);
    C.render();
  }

  function togOnionAll() {
    if (!onion) { onion = true; document.getElementById('bo').classList.add('on'); }
    onionAll = !onionAll;
    const oab = document.getElementById('boa');
    if (oab) oab.classList.toggle('on', onionAll);
    C.render();
  }

  function syncDur() {
    document.getElementById('fdi').value = frames[cf] ? frames[cf].duration : 100;
  }

  function uStrip() {
    const strip = document.getElementById('fs');
    strip.innerHTML = '';
    const TW = 48, TH = Math.max(1, Math.round(TW * C.H / C.W));
    frames.forEach((fr, i) => {
      const div = document.createElement('div');
      div.className = 'ft' + (i === cf ? ' act' : '');
      if (T.selFrames.has(i)) div.classList.add('msel');
      const c2 = document.createElement('canvas');
      c2.width = TW; c2.height = TH;
      const cx = c2.getContext('2d');
      cx.imageSmoothingEnabled = false;
      const full = C.compFrame(fr).canvas;
      cx.drawImage(full, 0, 0, TW, TH);
      const sp = document.createElement('span');
      sp.textContent = (i + 1) + ' ' + fr.duration + 'ms';
      div.append(c2, sp);
      div.onclick = e => {
        if (e.shiftKey) {
          if (T.selFrames.has(i)) T.selFrames.delete(i); else T.selFrames.add(i);
          uStrip();
        } else { T.selFrames.clear(); goTo(i); }
      };
      strip.append(div);
    });
    document.getElementById('fi').textContent = `${cf + 1}/${frames.length}`;
    syncDur();
  }

  function tween(idxA, idxB, count, easeFn) {
    if (idxA < 0 || idxB < 0 || idxA >= frames.length || idxB >= frames.length ||
        idxA === idxB || count < 1) return;
    if (idxA > idxB) [idxA, idxB] = [idxB, idxA];
    const fA = frames[idxA], fB = frames[idxB];
    const w = C.W, h = C.H;
    const nL = Math.max(fA.layers.length, fB.layers.length);
    Hi.push();
    const nf = [];
    for (let s = 1; s <= count; s++) {
      const rt = s / (count + 1);
      const t = easeFn ? easeFn(rt) : rt;
      const fr = { layers: [], activeLayer: 0,
        duration: Math.round(fA.duration * (1 - rt) + fB.duration * rt) };
      for (let li = 0; li < nL; li++) {
        const lyA = fA.layers[li], lyB = fB.layers[li];
        const nl = Ly.mk(lyA ? lyA.name : lyB ? lyB.name : 'Layer');
        nl.opacity = Math.round((lyA ? lyA.opacity : 0) * (1 - t) + (lyB ? lyB.opacity : 0) * t);
        nl.visible = true;
        const dA = lyA ? lyA.ctx.getImageData(0, 0, w, h).data : new Uint8ClampedArray(w * h * 4);
        const dB = lyB ? lyB.ctx.getImageData(0, 0, w, h).data : new Uint8ClampedArray(w * h * 4);
        const out = nl.ctx.createImageData(w, h), od = out.data, t1 = 1 - t;
        for (let i = 0; i < od.length; i += 4) {
          const aA = dA[i + 3] / 255, aB = dB[i + 3] / 255, aO = aA * t1 + aB * t;
          od[i + 3] = Math.round(aO * 255);
          if (aO > 0) {
            const wA = (aA * t1) / aO, wB = (aB * t) / aO;
            od[i]     = Math.round(dA[i]     * wA + dB[i]     * wB);
            od[i + 1] = Math.round(dA[i + 1] * wA + dB[i + 1] * wB);
            od[i + 2] = Math.round(dA[i + 2] * wA + dB[i + 2] * wB);
          }
        }
        nl.ctx.putImageData(out, 0, 0);
        fr.layers.push(nl);
      }
      nf.push(fr);
    }
    frames.splice(idxA + 1, 0, ...nf);
    cf = idxA; T.selFrames.clear();
    uStrip(); Ly.ui(); C.render();
  }

  function moveBlockTo() {
    const sel = [...T.selFrames].sort((a, b) => a - b);
    if (sel.length === 0) { alert('Select frames first (Shift+click)'); return; }
    const dest = prompt('Move selected frames before which position? (1-' + (frames.length + 1) + ')', '1');
    if (!dest) return;
    let di = Math.max(0, Math.min(frames.length, parseInt(dest) - 1));
    if (isNaN(di)) return;
    Hi.push();
    const extracted = [];
    for (let i = sel.length - 1; i >= 0; i--) {
      extracted.unshift(frames.splice(sel[i], 1)[0]);
      if (di > sel[i]) di--;
    }
    frames.splice(di, 0, ...extracted);
    cf = di;
    T.selFrames.clear();
    for (let i = 0; i < extracted.length; i++) T.selFrames.add(di + i);
    uStrip(); Ly.ui(); C.render();
  }

  return {
    get frames() { return frames; }, set frames(v) { frames = v; },
    get cf() { return cf; }, set cf(v) { cf = v; },
    get onion() { return onion; }, get onionAll() { return onionAll; },
    get playing() { return playing; },
    mkF, init, addF, dupF, rmF, goTo, prev, next, moveL, moveR,
    selAllF, pp, stop, togOnion, togOnionAll, uStrip, syncDur, tween, moveBlockTo
  };
})();

/* ===== HISTORY — adaptive memory cap ===== */
const Hi = (() => {
  let u = [], r = [];

  function maxDepth() {
    const totalSurfaces = An.frames.reduce(
      (sum, f) => sum + f.layers.reduce((n, ly) => n + 1 + (ly.mask ? 1 : 0), 0), 0
    );
    const pixelBytes = C.W * C.H * 4;
    const snapshotBytes = totalSurfaces * pixelBytes;
    const MAX_BYTES = 150 * 1024 * 1024;
    return Math.max(5, Math.min(50, Math.floor(MAX_BYTES / Math.max(1, snapshotBytes))));
  }

  function snap() {
    const out = { cf: An.cf, w: C.W, h: C.H, frames: [] };
    for (const f of An.frames) {
      const fl = { al: f.activeLayer, dur: f.duration, layers: [] };
      for (const ly of f.layers) {
        const c = document.createElement('canvas');
        c.width = C.W; c.height = C.H;
        c.getContext('2d').drawImage(ly.canvas, 0, 0);
        let m = null;
        if (ly.mask) {
          const mc = document.createElement('canvas');
          mc.width = C.W; mc.height = C.H;
          mc.getContext('2d').drawImage(ly.mask.canvas, 0, 0);
          m = { c: mc, e: ly.mask.enabled, x: ly.mask.editing };
        }
        fl.layers.push({ n: ly.name, o: ly.opacity, v: ly.visible, k: ly.locked, b: ly.blendMode, c, m });
      }
      out.frames.push(fl);
    }
    return out;
  }

  function restore(s) {
    const prevZoom = C.zm, prevPanX = C.px, prevPanY = C.py;
    const rw = s.w || C.W, rh = s.h || C.H;
    const sizeChanged = rw !== C.W || rh !== C.H;
    if (sizeChanged) C.init(rw, rh, C.bg);
    An.frames = [];
    for (const fs of s.frames) {
      const fr = { layers: [], activeLayer: fs.al, duration: fs.dur || 100 };
      for (const ls of fs.layers) {
        const ly = Ly.mk(ls.n);
        ly.canvas.width = rw; ly.canvas.height = rh;
        ly.ctx.imageSmoothingEnabled = false;
        ly.opacity = ls.o; ly.visible = ls.v; ly.locked = ls.k;
        ly.blendMode = LAYER_BLEND_MODES.includes(ls.b) ? ls.b : 'normal';
        ly.ctx.drawImage(ls.c, 0, 0);
        if (ls.m) {
          ly.mask = Ly.ensureMask(ly);
          ly.mask.canvas.width = rw; ly.mask.canvas.height = rh;
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
    An.cf = Math.min(s.cf, An.frames.length - 1);
    if (sizeChanged) { C.zFit(); } else { C.zm = prevZoom; C.px = prevPanX; C.py = prevPanY; C.render(); }
    Ly.ui(); An.uStrip();
  }

  function push() {
    _dirty = true;
    const cap = maxDepth();
    u.push(snap());
    while (u.length > cap) u.shift();
    r = [];
  }

  function undo() {
    if (!u.length) return;
    const cap = maxDepth();
    r.push(snap());
    while (r.length > cap) r.shift();
    restore(u.pop());
  }

  function redo() {
    if (!r.length) return;
    u.push(snap());
    restore(r.pop());
  }

  function clear() { u = []; r = []; _dirty = false; }

  return { push, undo, redo, clear };
})();
