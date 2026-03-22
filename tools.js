"use strict";
/* ===== TOOLS ===== */
const T = (() => {
  let cur = 'brush', bSz = 1, soft = 0, tol = 32, bOp = 100;
  let ldSize = 24, ldStrength = 16, ldInvert = false;
  let ppx = true, shM = 'outline', bShape = 'circle';
  let symH = false, symV = false, sym45 = false, sym45n = false;
  let mouseH = 0, gradT = 'linear', gradTransparentSecondary = false;
  let gradDither = false, gradDitherLv = 4, gradDitherSt = 'bayer';
  let lockX = false, lockY = false, smInt = 5;
  let sel = null, clip = null, floating = null;
  let tfMode = false, tfPixel = false, tfAction = 'auto';
  let floatingUndoCaptured = false;
  let drag = false, ds = null, lp = null, mo = null;
  let tc = null, tx = null, contourPts = null;
  let customBrush = null, selFrames = new Set();
  let jumbleInt = 35;
  let spaceDown = false, ctrlPick = null, lastBP = null, moveAll = false;
  let ppPrev = null, ppPend = null, _shiftPrev = null;
  let bSpacing = 0, bMinDiam = 1, bScatter = 0;
  let lockAlpha = false, fillContig = true;
  let patMode = 'none', patSrcX = 0, patSrcY = 0, patDstX = 0, patDstY = 0;

  function al() {
    const fr = An.frames[An.cf];
    if (!fr || !fr.layers.length) return null;
    if (fr.activeLayer < 0 || fr.activeLayer >= fr.layers.length)
      fr.activeLayer = Math.max(0, Math.min(fr.layers.length - 1, fr.activeLayer));
    return fr.layers[fr.activeLayer] || null;
  }

  function isSel(t) { return SEL_TOOLS.includes(t); }

  function hasSel() {
    return !!(sel && sel.type === 'rect' && sel.w > 0 && sel.h > 0);
  }

  function selBounds() {
    if (!hasSel()) return null;
    const x = Math.max(0, Math.round(sel.x));
    const y = Math.max(0, Math.round(sel.y));
    const w = Math.max(0, Math.min(C.W - x, Math.round(sel.w)));
    const h = Math.max(0, Math.min(C.H - y, Math.round(sel.h)));
    return (w > 0 && h > 0) ? { x, y, w, h } : null;
  }

  function selHit(x, y) {
    const b = selBounds();
    if (!b) return true;
    x = Math.floor(x); y = Math.floor(y);
    if (x < b.x || y < b.y || x >= b.x + b.w || y >= b.y + b.h) return false;
    if (!sel.mask) return true;
    return !!sel.mask[(y - b.y) * b.w + (x - b.x)];
  }

  function runSelectedEdit(layer, editFn) {
    const b = selBounds();
    if (!b) { editFn(layer.ctx); return; }
    if (!sel.mask) {
      layer.ctx.save();
      layer.ctx.beginPath();
      layer.ctx.rect(b.x, b.y, b.w, b.h);
      layer.ctx.clip();
      try { editFn(layer.ctx); } finally { layer.ctx.restore(); }
      return;
    }
    const before = layer.ctx.getImageData(b.x, b.y, b.w, b.h);
    const temp = document.createElement('canvas');
    temp.width = C.W; temp.height = C.H;
    const tx2 = temp.getContext('2d', { willReadFrequently: true });
    tx2.imageSmoothingEnabled = false;
    tx2.drawImage(layer.canvas, 0, 0);
    editFn(tx2);
    const after = tx2.getImageData(b.x, b.y, b.w, b.h);
    for (let i = 0; i < sel.mask.length; i++) {
      if (sel.mask[i]) continue;
      const p = i * 4;
      after.data[p]     = before.data[p];
      after.data[p + 1] = before.data[p + 1];
      after.data[p + 2] = before.data[p + 2];
      after.data[p + 3] = before.data[p + 3];
    }
    layer.ctx.putImageData(after, b.x, b.y);
  }

  function h2r(h) {
    if (!h || h.length < 7) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(h.slice(1, 3), 16),
      g: parseInt(h.slice(3, 5), 16),
      b: parseInt(h.slice(5, 7), 16)
    };
  }

  function h2rgba(h, a = 1) {
    const { r, g, b } = h2r(h);
    const alpha = Math.max(0, Math.min(1, a));
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function plotLine(x0, y0, x1, y1, cb) {
    x0 = Math.floor(x0); y0 = Math.floor(y0);
    x1 = Math.floor(x1); y1 = Math.floor(y1);
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx - dy;
    for (;;) {
      cb(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 > -dy) { e -= dy; x0 += sx; }
      if (e2 < dx) { e += dx; y0 += sy; }
    }
  }

  function dot(ctx, x, y, sz, col) {
    if (bShape === 'custom' && bScatter > 0 && cur === 'brush') {
      const ang = Math.random() * Math.PI * 2;
      x += Math.cos(ang) * Math.random() * bScatter;
      y += Math.sin(ang) * Math.random() * bScatter;
    }
    const p = Math.floor(x), q = Math.floor(y);

    if (customBrush && cur === 'brush') {
      const bw = customBrush.width, bh = customBrush.height;
      const bx = p - Math.floor(bw / 2);
      const by = q - Math.floor(bh / 2);

      var srcToDraw = customBrush;
      if (patMode !== 'none') {
        var ax = patMode === 'source' ? patSrcX : patDstX;
        var ay = patMode === 'source' ? patSrcY : patDstY;
        var pc = document.createElement('canvas');
        pc.width = bw; pc.height = bh;
        var px2 = pc.getContext('2d');
        px2.imageSmoothingEnabled = false;
        var brushData = customBrush.getContext('2d').getImageData(0, 0, bw, bh);
        var outData = px2.createImageData(bw, bh);
        for (var iy = 0; iy < bh; iy++) {
          for (var ix = 0; ix < bw; ix++) {
            var tx = ((bx + ix - ax) % bw + bw) % bw;
            var ty = ((by + iy - ay) % bh + bh) % bh;
            var si = (ty * bw + tx) * 4;
            var di = (iy * bw + ix) * 4;
            outData.data[di]     = brushData.data[si];
            outData.data[di + 1] = brushData.data[si + 1];
            outData.data[di + 2] = brushData.data[si + 2];
            outData.data[di + 3] = brushData.data[si + 3];
          }
        }
        px2.putImageData(outData, 0, 0);
        srcToDraw = pc;
      }

      if (!hasSel()) {
        ctx.save(); ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = bOp / 100;
        if (lockAlpha) ctx.globalCompositeOperation = 'source-atop';
        ctx.drawImage(srcToDraw, bx, by);
        ctx.restore(); return;
      }
      const temp = document.createElement('canvas');
      temp.width = bw; temp.height = bh;
      const tctx = temp.getContext('2d', { willReadFrequently: true });
      tctx.imageSmoothingEnabled = false;
      tctx.drawImage(srcToDraw, 0, 0);
      const id = tctx.getImageData(0, 0, bw, bh);
      const d = id.data;
      for (let yy = 0; yy < bh; yy++)
        for (let xx = 0; xx < bw; xx++)
          if (!selHit(bx + xx, by + yy)) d[(yy * bw + xx) * 4 + 3] = 0;
      tctx.putImageData(id, 0, 0);
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = bOp / 100;
      if (lockAlpha) ctx.globalCompositeOperation = 'source-atop';
      ctx.drawImage(temp, bx, by);
      ctx.restore(); return;
    }

    const size = Math.max(1, Math.round(sz));
    const half = size / 2;
    const baseAlpha = bOp / 100;
    const left = Math.floor(p - half) - 1;
    const top = Math.floor(q - half) - 1;
    const right = Math.ceil(p + half) + 1;
    const bottom = Math.ceil(q + half) + 1;

    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.fillStyle = col;
    if (lockAlpha && cur === 'brush') ctx.globalCompositeOperation = 'source-atop';
    for (let py = top; py <= bottom; py++) {
      for (let px = left; px <= right; px++) {
        if (px < 0 || py < 0 || px >= C.W || py >= C.H) continue;
        if (!selHit(px, py)) continue;
        let a = 0;
        if (bShape === 'square') {
          const dx = Math.abs((px + 0.5) - (p + 0.5));
          const dy = Math.abs((py + 0.5) - (q + 0.5));
          if (dx > half || dy > half) continue;
          if (soft > 0 && size > 1) {
            const edge = Math.min(half - dx, half - dy);
            const softZone = Math.max(0.5, half * (soft / 10));
            a = edge >= softZone ? 1 : Math.max(0, edge / softZone);
          } else { a = 1; }
        } else {
          const dx = (px + 0.5) - (p + 0.5), dy = (py + 0.5) - (q + 0.5);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > half) continue;
          if (soft > 0 && size > 1) {
            const inner = Math.max(0, half * (1 - soft / 10));
            a = dist <= inner ? 1 : Math.max(0, 1 - (dist - inner) / Math.max(0.0001, half - inner));
          } else { a = 1; }
        }
        if (a <= 0) continue;
        ctx.globalAlpha = baseAlpha * a;
        ctx.fillRect(px, py, 1, 1);
      }
    }
    ctx.restore();
  }

  function sLine(ctx, x0, y0, x1, y1, sz, col) {
    plotLine(x0, y0, x1, y1, (a, b) => dot(ctx, a, b, sz, col));
  }

  function _usePixelShapeStroke() { return !customBrush && soft <= 0; }

  function _pixelLine(ctx, x0, y0, x1, y1, col) {
    sLine(ctx, Math.floor(x0), Math.floor(y0), Math.floor(x1), Math.floor(y1),
      Math.max(1, Math.round(bSz)), col);
  }

  function _pixelRect(ctx, f, t, col) {
    const x0 = Math.floor(Math.min(f.x, t.x));
    const y0 = Math.floor(Math.min(f.y, t.y));
    const x1 = Math.floor(Math.max(f.x, t.x));
    const y1 = Math.floor(Math.max(f.y, t.y));
    _pixelLine(ctx, x0, y0, x1, y0, col);
    if (y1 !== y0) _pixelLine(ctx, x0, y1, x1, y1, col);
    if (y1 - y0 > 1) {
      _pixelLine(ctx, x0, y0 + 1, x0, y1 - 1, col);
      if (x1 !== x0) _pixelLine(ctx, x1, y0 + 1, x1, y1 - 1, col);
    }
  }

  function _pixelEllipse(ctx, f, t, col) {
    let x0 = Math.floor(Math.min(f.x, t.x));
    let y0 = Math.floor(Math.min(f.y, t.y));
    let x1 = Math.floor(Math.max(f.x, t.x));
    let y1 = Math.floor(Math.max(f.y, t.y));
    let a = Math.abs(x1 - x0), b = Math.abs(y1 - y0), b1 = b & 1;
    let dx = 4 * (1 - a) * b * b, dy = 4 * (b1 + 1) * a * a;
    let err = dx + dy + b1 * a * a, e2;
    if (a === 0 && b === 0) { dot(ctx, x0, y0, Math.max(1, Math.round(bSz)), col); return; }
    if (x0 > x1) { const tmp = x0; x0 = x1; x1 = tmp; }
    if (y0 > y1) y0 = y1;
    y0 += Math.floor((b + 1) / 2); y1 = y0 - b1;
    a = 8 * a * a; b1 = 8 * b * b;
    do {
      dot(ctx, x1, y0, Math.max(1, Math.round(bSz)), col);
      dot(ctx, x0, y0, Math.max(1, Math.round(bSz)), col);
      dot(ctx, x0, y1, Math.max(1, Math.round(bSz)), col);
      dot(ctx, x1, y1, Math.max(1, Math.round(bSz)), col);
      e2 = 2 * err;
      if (e2 <= dy) { y0++; y1--; err += dy += a; }
      if (e2 >= dx || 2 * err > dy) { x0++; x1--; err += dx += b1; }
    } while (x0 <= x1);
    while (y0 - y1 <= b) {
      dot(ctx, x0 - 1, y0, Math.max(1, Math.round(bSz)), col);
      dot(ctx, x1 + 1, y0, Math.max(1, Math.round(bSz)), col); y0++;
      dot(ctx, x0 - 1, y1, Math.max(1, Math.round(bSz)), col);
      dot(ctx, x1 + 1, y1, Math.max(1, Math.round(bSz)), col); y1--;
    }
  }

  function _pixelFilledEllipse(ctx, f, t, col) {
    const x0 = Math.floor(Math.min(f.x, t.x));
    const y0 = Math.floor(Math.min(f.y, t.y));
    const x1 = Math.floor(Math.max(f.x, t.x));
    const y1 = Math.floor(Math.max(f.y, t.y));
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (w < 1 || h < 1) return;
    const cx = x0 + (w - 1) / 2, cy = y0 + (h - 1) / 2;
    const rx = w / 2, ry = h / 2;
    ctx.save(); ctx.fillStyle = col;
    for (let py = y0; py <= y1; py++) {
      const ny = (py - cy) / ry;
      const inside = 1 - ny * ny;
      if (inside < 0) continue;
      const dx = Math.sqrt(inside) * rx;
      const lx = Math.ceil(cx - dx), rx2 = Math.floor(cx + dx);
      if (rx2 >= lx) ctx.fillRect(lx, py, rx2 - lx + 1, 1);
    }
    ctx.restore();
  }

  function _pixelContour(ctx, pts, col) {
    if (!pts || pts.length < 2) return;
    for (let i = 1; i < pts.length; i++)
      _pixelLine(ctx, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, col);
    if (pts.length >= 3)
      _pixelLine(ctx, pts[pts.length - 1].x, pts[pts.length - 1].y, pts[0].x, pts[0].y, col);
  }

  function spray(ctx, x, y, col) {
    const r = bSz * 2, n = bSz * 3;
    ctx.fillStyle = col; ctx.globalAlpha = bOp / 100;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * r;
      const px2 = Math.floor(x + Math.cos(a) * d);
      const py2 = Math.floor(y + Math.sin(a) * d);
      if (px2 >= 0 && py2 >= 0 && px2 < C.W && py2 < C.H && selHit(px2, py2))
        ctx.fillRect(px2, py2, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  function floodFill(ctx, sx, sy, fh) {
    sx = Math.floor(sx); sy = Math.floor(sy);
    const w = C.W, h = C.H;
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
    const id = ctx.getImageData(0, 0, w, h), d = id.data;
    const si = (sy * w + sx) * 4;
    const sr = d[si], sg = d[si + 1], sb = d[si + 2], sa = d[si + 3];
    const fc = h2r(fh);
    if (sr === fc.r && sg === fc.g && sb === fc.b && sa === 255) return;
    const t = tol;
    if (!fillContig) {
      for (let i = 0; i < d.length; i += 4) {
        if (Math.abs(d[i] - sr) <= t && Math.abs(d[i + 1] - sg) <= t &&
            Math.abs(d[i + 2] - sb) <= t && Math.abs(d[i + 3] - sa) <= t) {
          d[i] = fc.r; d[i + 1] = fc.g; d[i + 2] = fc.b; d[i + 3] = 255;
        }
      }
      ctx.putImageData(id, 0, 0); return;
    }
    const v = new Uint8Array(w * h);
    const st = [[sx, sy]];
    let iterations = 0;
    while (st.length && iterations < FLOOD_FILL_MAX_ITERATIONS) {
      iterations++;
      const [cx, cy] = st.pop();
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
      const ci = cy * w + cx;
      if (v[ci]) continue;
      const pi = ci * 4;
      if (Math.abs(d[pi] - sr) > t || Math.abs(d[pi + 1] - sg) > t ||
          Math.abs(d[pi + 2] - sb) > t || Math.abs(d[pi + 3] - sa) > t) continue;
      v[ci] = 1;
      d[pi] = fc.r; d[pi + 1] = fc.g; d[pi + 2] = fc.b; d[pi + 3] = 255;
      st.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    ctx.putImageData(id, 0, 0);
  }

  function magicSel(la, x, y) {
    x = Math.floor(x); y = Math.floor(y);
    const w = C.W, h = C.H;
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const d = la.ctx.getImageData(0, 0, w, h).data;
    const si = (y * w + x) * 4;
    const sr = d[si], sg = d[si + 1], sb = d[si + 2], sa = d[si + 3];
    const t = tol, mk = new Uint8Array(w * h);
    const st = [[x, y]];
    let x0 = x, y0 = y, x1 = x, y1 = y, iterations = 0;
    while (st.length && iterations < FLOOD_FILL_MAX_ITERATIONS) {
      iterations++;
      const [cx, cy] = st.pop();
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
      const ci = cy * w + cx;
      if (mk[ci]) continue;
      const pi = ci * 4;
      if (Math.abs(d[pi] - sr) > t || Math.abs(d[pi + 1] - sg) > t ||
          Math.abs(d[pi + 2] - sb) > t || Math.abs(d[pi + 3] - sa) > t) continue;
      mk[ci] = 1;
      if (cx < x0) x0 = cx; if (cy < y0) y0 = cy;
      if (cx > x1) x1 = cx; if (cy > y1) y1 = cy;
      st.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    const sw = x1 - x0 + 1, sh = y1 - y0 + 1;
    const cropMask = new Uint8Array(sw * sh);
    for (let py = y0; py <= y1; py++)
      for (let px = x0; px <= x1; px++)
        if (mk[py * w + px]) cropMask[(py - y0) * sw + (px - x0)] = 1;
    sel = { type: 'rect', x: x0, y: y0, w: sw, h: sh, mask: cropMask };
    C.render();
  }

  function applySmooth(ctx, x, y, bR) {
    const w = C.W, h = C.H, kr = Math.min(Math.max(1, Math.ceil(bR)), 16);
    const x0 = Math.max(0, Math.floor(x) - kr);
    const y0 = Math.max(0, Math.floor(y) - kr);
    const x1 = Math.min(w, Math.ceil(x) + kr + 1);
    const y1 = Math.min(h, Math.ceil(y) + kr + 1);
    const sw = x1 - x0, sh = y1 - y0;
    if (sw < 1 || sh < 1) return;
    const strength = smInt / 10;
    const id = ctx.getImageData(x0, y0, sw, sh), d = id.data;
    const o = new Uint8ClampedArray(d.length);
    const k = [1, 4, 7, 4, 1, 4, 16, 26, 16, 4, 7, 26, 41, 26, 7, 4, 16, 26, 16, 4, 1, 4, 7, 4, 1];
    for (let py2 = 0; py2 < sh; py2++) {
      for (let px2 = 0; px2 < sw; px2++) {
        const gx = x0 + px2, gy = y0 + py2;
        const wx = gx - x, wy = gy - y;
        const dist = Math.sqrt(wx * wx + wy * wy);
        const i = (py2 * sw + px2) * 4;
        if (!selHit(gx, gy) || dist > kr) {
          o[i] = d[i]; o[i + 1] = d[i + 1]; o[i + 2] = d[i + 2]; o[i + 3] = d[i + 3];
          continue;
        }
        let rr = 0, gg = 0, bb = 0, aa = 0, wt = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = px2 + dx, ny = py2 + dy;
            if (nx >= 0 && ny >= 0 && nx < sw && ny < sh) {
              const kw = k[(dy + 2) * 5 + (dx + 2)];
              const si2 = (ny * sw + nx) * 4;
              rr += d[si2] * kw; gg += d[si2 + 1] * kw;
              bb += d[si2 + 2] * kw; aa += d[si2 + 3] * kw;
              wt += kw;
            }
          }
        }
        const blend = (1 - dist / kr) * strength;
        o[i] = d[i] + (rr / wt - d[i]) * blend;
        o[i + 1] = d[i + 1] + (gg / wt - d[i + 1]) * blend;
        o[i + 2] = d[i + 2] + (bb / wt - d[i + 2]) * blend;
        o[i + 3] = d[i + 3] + (aa / wt - d[i + 3]) * blend;
      }
    }
    id.data.set(o);
    ctx.putImageData(id, x0, y0);
  }

  function applyJumble(ctx, x, y, sz) {
    const radius = Math.max(0.5, sz / 2);
    const reach = Math.max(1, Math.min(6, 1 + Math.floor(jumbleInt / 20)));
    const x0 = Math.max(0, Math.floor(x - radius - reach));
    const y0 = Math.max(0, Math.floor(y - radius - reach));
    const x1 = Math.min(C.W - 1, Math.ceil(x + radius + reach));
    const y1 = Math.min(C.H - 1, Math.ceil(y + radius + reach));
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (w < 1 || h < 1) return;
    const id = ctx.getImageData(x0, y0, w, h), d = id.data;
    const inside = [], opaque = [], transparent = [];
    const useSquare = (bShape === 'square'), r2 = radius * radius;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const gx = x0 + px, gy = y0 + py;
        if (!selHit(gx, gy)) continue;
        let hit = false;
        if (useSquare) {
          hit = Math.abs((gx + 0.5) - (x + 0.5)) <= radius &&
                Math.abs((gy + 0.5) - (y + 0.5)) <= radius;
        } else {
          const dx2 = (gx + 0.5) - (x + 0.5), dy2 = (gy + 0.5) - (y + 0.5);
          hit = (dx2 * dx2 + dy2 * dy2) <= r2;
        }
        if (!hit) continue;
        const i = (py * w + px) * 4;
        const p2 = { x: px, y: py, i };
        inside.push(p2);
        if (d[i + 3] > 0) opaque.push(p2); else transparent.push(p2);
      }
    }
    if (inside.length < 2) return;
    const ops = Math.max(1, Math.round(inside.length * (0.10 + jumbleInt / 110)));
    function rand(list) { return list[(Math.random() * list.length) | 0]; }
    function near(a, b) {
      return Math.abs(a.x - b.x) <= reach && Math.abs(a.y - b.y) <= reach && (a.x !== b.x || a.y !== b.y);
    }
    function copyPx(from, to) {
      d[to.i] = d[from.i]; d[to.i + 1] = d[from.i + 1];
      d[to.i + 2] = d[from.i + 2]; d[to.i + 3] = d[from.i + 3];
    }
    function swapPx(a, b) {
      for (let c = 0; c < 4; c++) {
        const tmp = d[a.i + c]; d[a.i + c] = d[b.i + c]; d[b.i + c] = tmp;
      }
    }
    function pickNear(list, anchor) {
      for (let tries = 0; tries < 20; tries++) {
        const p2 = rand(list);
        if (near(anchor, p2)) return p2;
      }
      return null;
    }
    for (let n = 0; n < ops; n++) {
      const mode = Math.random();
      if (mode < 0.55) {
        const a = rand(inside), b = pickNear(inside, a);
        if (a && b) swapPx(a, b); continue;
      }
      if (mode < 0.85 && opaque.length) {
        const src = rand(opaque);
        const copies = 2 + ((Math.random() * 3) | 0);
        for (let k = 0; k < copies; k++) { const dst2 = pickNear(inside, src); if (dst2) copyPx(src, dst2); }
        continue;
      }
      if (transparent.length && opaque.length) {
        const hole = rand(transparent);
        const copies = 1 + ((Math.random() * 2) | 0);
        for (let k = 0; k < copies; k++) { const dst2 = pickNear(opaque, hole); if (dst2) copyPx(hole, dst2); }
        continue;
      }
      if (opaque.length) {
        const src = rand(opaque), dst2 = pickNear(inside, src);
        if (dst2) copyPx(src, dst2);
      }
    }
    ctx.putImageData(id, x0, y0);
  }

  function getLightDarkDelta(isRightButton) {
    const lighten = ldInvert ? !isRightButton : isRightButton;
    return lighten ? ldStrength : -ldStrength;
  }

  function applyLightDark(ctx, x, y, sz, delta) {
    const radius = Math.max(0.5, sz / 2);
    const cx = Math.floor(x), cy = Math.floor(y);
    const x0 = Math.max(0, Math.floor(cx - radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const x1 = Math.min(C.W - 1, Math.ceil(cx + radius));
    const y1 = Math.min(C.H - 1, Math.ceil(cy + radius));
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (w < 1 || h < 1) return;
    const id = ctx.getImageData(x0, y0, w, h), d = id.data;
    const amount = Math.max(1, Math.min(255, Math.round(Math.abs(delta))));
    const r2 = radius * radius;
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const gx = x0 + px, gy = y0 + py;
        if (!selHit(gx, gy)) continue;
        const dx = (gx + 0.5) - (cx + 0.5), dy = (gy + 0.5) - (cy + 0.5);
        const dist2 = dx * dx + dy * dy;
        if (dist2 > r2) continue;
        const i = (py * w + px) * 4;
        if (!d[i + 3]) continue;
        const falloff = radius <= 0.5 ? 1 : 1 - (Math.sqrt(dist2) / radius);
        const step = Math.max(1, Math.round(amount * (0.35 + falloff * 0.65)));
        if (delta > 0) {
          d[i] = Math.min(255, d[i] + step);
          d[i + 1] = Math.min(255, d[i + 1] + step);
          d[i + 2] = Math.min(255, d[i + 2] + step);
        } else {
          d[i] = Math.max(0, d[i] - step);
          d[i + 1] = Math.max(0, d[i + 1] - step);
          d[i + 2] = Math.max(0, d[i + 2] - step);
        }
      }
    }
    ctx.putImageData(id, x0, y0);
  }

  function drawGrad(ctx, x0, y0, x1, y1, c1, c2, type, transparentSecond = false) {
    const dx = x1 - x0, dy = y1 - y0, dist = Math.hypot(dx, dy);
    const startColor = c1;
    const endColor = transparentSecond ? h2rgba(c2, 0) : c2;
    ctx.save();
    if (dist < 0.001) {
      ctx.fillStyle = startColor; ctx.globalAlpha = bOp / 100;
      ctx.fillRect(0, 0, C.W, C.H); ctx.restore(); return;
    }
    let g;
    if (type === 'radial') g = ctx.createRadialGradient(x0, y0, 0, x0, y0, Math.max(1, dist));
    else g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, startColor); g.addColorStop(1, endColor);
    ctx.fillStyle = g; ctx.globalAlpha = bOp / 100;
    ctx.fillRect(0, 0, C.W, C.H); ctx.restore();

    if (gradDither) {
      const w = C.W, h = C.H;
      const id = ctx.getImageData(0, 0, w, h), d = id.data;
      const levels = Math.max(2, Math.min(32, gradDitherLv));
      const step = 255 / (levels - 1);
      const B8 = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];
      const style = gradDitherSt || 'bayer';
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const i = (py * w + px) * 4;
          if (!d[i + 3]) continue;
          if (hasSel() && !selHit(px, py)) continue;
          let thr;
          if (style === 'bayer') thr = (B8[(py & 7) * 8 + (px & 7)] / 64 - 0.5) * step;
          else if (style === 'noise') thr = (Math.random() - 0.5) * step;
          else if (style === 'halftone') { const cx2 = (px % 6) - 3, cy2 = (py % 6) - 3; thr = (Math.sqrt(cx2 * cx2 + cy2 * cy2) / 4.24 - 0.5) * step; }
          else if (style === 'cross') { const mx = px % 4, my = py % 4; const cval = (mx === 1 || mx === 2 || my === 1 || my === 2) ? 0.7 : 0.2; thr = (cval - 0.5) * step; }
          else if (style === 'diamond') { const mx = Math.abs((px % 8) - 4), my = Math.abs((py % 8) - 4); thr = ((mx + my) / 8 - 0.5) * step; }
          else if (style === 'lines') thr = ((py % 4) / 4 - 0.5) * step;
          else thr = (B8[(py & 7) * 8 + (px & 7)] / 64 - 0.5) * step;
          for (let ch = 0; ch < 3; ch++)
            d[i + ch] = Math.max(0, Math.min(255, Math.round((d[i + ch] + thr) / step) * step));
        }
      }
      ctx.putImageData(id, 0, 0);
    }
  }

  function grabBrush() {
    const la = al();
    if (!la || !sel || sel.type !== 'rect' || sel.w < 1 || sel.h < 1) return;
    const sx = Math.max(0, Math.round(sel.x)), sy = Math.max(0, Math.round(sel.y));
    const sw = Math.min(Math.round(sel.w), C.W - sx);
    const sh = Math.min(Math.round(sel.h), C.H - sy);
    if (sw < 1 || sh < 1) return;
    customBrush = document.createElement('canvas');
    customBrush.width = sw; customBrush.height = sh;
    customBrush.getContext('2d').drawImage(la.canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    patSrcX = sx; patSrcY = sy;
    sel = null; set('brush'); C.render();
  }

  function flipCB(dir) {
    if (!customBrush) return;
    const w = customBrush.width, h = customBrush.height;
    const c2 = document.createElement('canvas');
    c2.width = w; c2.height = h;
    const cx = c2.getContext('2d');
    cx.save();
    if (dir === 'h') { cx.translate(w, 0); cx.scale(-1, 1); }
    else { cx.translate(0, h); cx.scale(1, -1); }
    cx.drawImage(customBrush, 0, 0); cx.restore();
    customBrush = c2;
  }

  function rotCB(deg) {
    if (!customBrush) return;
    const w = customBrush.width, h = customBrush.height;
    const ad = Math.abs(deg);
    const nw = (ad % 180) ? h : w, nh = (ad % 180) ? w : h;
    const c2 = document.createElement('canvas');
    c2.width = nw; c2.height = nh;
    const cx = c2.getContext('2d');
    cx.translate(nw / 2, nh / 2);
    cx.rotate(deg * Math.PI / 180);
    cx.drawImage(customBrush, -w / 2, -h / 2);
    customBrush = c2;
  }

  function clearCB() { customBrush = null; }

  function symDraw(ctx, fn, x, y) {
    const px = Math.floor(x), py = Math.floor(y);
    const centerX = C.W * C.symHP - 0.5;
    const centerY = C.H * C.symVP - 0.5;
    const points = [], used = new Set();
    function addPoint(ix, iy) {
      if (ix < 0 || iy < 0 || ix >= C.W || iy >= C.H) return;
      const key = ix + ',' + iy;
      if (used.has(key)) return;
      used.add(key); points.push([ix, iy]);
    }
    function mirrorH(ix, iy) { return [Math.round(2 * centerX - ix), iy]; }
    function mirrorV(ix, iy) { return [ix, Math.round(2 * centerY - iy)]; }
    function mirror45(ix, iy) {
      const dx = ix - centerX, dy = iy - centerY;
      return [Math.round(centerX + dy), Math.round(centerY + dx)];
    }
    function mirror45n(ix, iy) {
      const dx = ix - centerX, dy = iy - centerY;
      return [Math.round(centerX - dy), Math.round(centerY - dx)];
    }
    addPoint(px, py);
    let basePoints = [[px, py]];
    if (symH) {
      const extra = [];
      for (const [ix, iy] of basePoints) extra.push(mirrorH(ix, iy));
      for (const p of extra) addPoint(p[0], p[1]);
      basePoints = basePoints.concat(extra);
    }
    if (symV) {
      const extra = [];
      for (const [ix, iy] of basePoints) extra.push(mirrorV(ix, iy));
      for (const p of extra) addPoint(p[0], p[1]);
      basePoints = basePoints.concat(extra);
    }
    if (sym45) {
      const extra = [];
      for (const [ix, iy] of basePoints) extra.push(mirror45(ix, iy));
      for (const p of extra) addPoint(p[0], p[1]);
      basePoints = basePoints.concat(extra);
    }
    if (sym45n) {
      const extra = [];
      for (const [ix, iy] of basePoints) extra.push(mirror45n(ix, iy));
      for (const p of extra) addPoint(p[0], p[1]);
    }
    for (const [ix, iy] of points) fn(ctx, ix, iy);
  }

  function commitFloat() {
    if (!floating) return;
    const la = al();
    if (!la) {
      floating = null; tfMode = false; sel = null;
      floatingUndoCaptured = false; C.render(); return;
    }
    if (la.locked) { _showLockMsg(); return; }
    if (!floatingUndoCaptured) Hi.push();
    const fw = floating.tw || floating.canvas.width;
    const fh = floating.th || floating.canvas.height;
    la.ctx.save();
    la.ctx.translate(Math.round(floating.x) + fw / 2, Math.round(floating.y) + fh / 2);
    la.ctx.rotate(floating.rot || 0);
    la.ctx.imageSmoothingEnabled = !tfPixel;
    la.ctx.drawImage(floating.canvas, -fw / 2, -fh / 2, fw, fh);
    la.ctx.restore();
    la.ctx.imageSmoothingEnabled = false;
    floating = null; tfMode = false; tfAction = 'auto';
    sel = null; floatingUndoCaptured = false;
    C.render(); Ly.ui(); U.uTopt();
  }

  function floatFromSel() {
    const la = al();
    if (!la || !sel || sel.type !== 'rect') return false;
    const sx = Math.max(0, Math.round(sel.x)), sy = Math.max(0, Math.round(sel.y));
    const sw = Math.min(Math.round(sel.w), C.W - sx);
    const sh = Math.min(Math.round(sel.h), C.H - sy);
    if (sw < 1 || sh < 1) return false;
    Hi.push(); floatingUndoCaptured = true;
    const fc = document.createElement('canvas');
    fc.width = sw; fc.height = sh;
    const fx = fc.getContext('2d');
    fx.drawImage(la.canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    if (sel.mask) {
      const id = fx.getImageData(0, 0, sw, sh), d = id.data;
      for (let i = 0; i < sel.mask.length; i++)
        if (!sel.mask[i]) { d[i*4]=d[i*4+1]=d[i*4+2]=d[i*4+3]=0; }
      fx.putImageData(id, 0, 0);
      const srcId = la.ctx.getImageData(sx, sy, sw, sh), sd = srcId.data;
      for (let i = 0; i < sel.mask.length; i++)
        if (sel.mask[i]) { sd[i*4]=sd[i*4+1]=sd[i*4+2]=sd[i*4+3]=0; }
      la.ctx.putImageData(srcId, sx, sy);
    } else { la.ctx.clearRect(sx, sy, sw, sh); }
    floating = { canvas: fc, x: sx, y: sy, tw: sw, th: sh, rot: 0 };
    sel = null; C.render(); return true;
  }

  function startFreeRot() {
    if (floating) return;
    if (!sel) sel = { type: 'rect', x: 0, y: 0, w: C.W, h: C.H };
    if (floatFromSel()) { tfMode = true; C.render(); U.uTopt(); }
  }

  function hitHandle(pos) {
    if (!floating || !tfMode) return null;
    const f = floating;
    const fw = f.tw || f.canvas.width, fh = f.th || f.canvas.height;
    const centerX = f.x + fw / 2, centerY = f.y + fh / 2;
    const invRot = -(f.rot || 0);
    const dx = pos.x - centerX, dy = pos.y - centerY;
    const localX = dx * Math.cos(invRot) - dy * Math.sin(invRot);
    const localY = dx * Math.sin(invRot) + dy * Math.cos(invRot);
    const minZone = Math.max(30 / C.zm, 15);
    const effw = Math.max(fw, minZone), effh = Math.max(fh, minZone);
    const handleSize = Math.max(14 / C.zm, 6);
    if (tfAction === 'move') return 'move';
    if (tfAction === 'rotate') return 'rotate';
    if (tfAction === 'resize') {
      const handles = [
        { id: 'tl', x: -effw/2, y: -effh/2 }, { id: 'tr', x: effw/2, y: -effh/2 },
        { id: 'bl', x: -effw/2, y: effh/2 }, { id: 'br', x: effw/2, y: effh/2 },
        { id: 'tc', x: 0, y: -effh/2 }, { id: 'bc', x: 0, y: effh/2 },
        { id: 'ml', x: -effw/2, y: 0 }, { id: 'mr', x: effw/2, y: 0 }
      ];
      let best = 'br', bd = 1e9;
      for (const h2 of handles) { const d2 = (localX-h2.x)**2+(localY-h2.y)**2; if (d2<bd){bd=d2;best=h2.id;} }
      return best;
    }
    const resizePoints = [
      { id: 'tl', x: -effw/2, y: -effh/2 }, { id: 'tc', x: 0, y: -effh/2 },
      { id: 'tr', x: effw/2, y: -effh/2 }, { id: 'ml', x: -effw/2, y: 0 },
      { id: 'mr', x: effw/2, y: 0 }, { id: 'bl', x: -effw/2, y: effh/2 },
      { id: 'bc', x: 0, y: effh/2 }, { id: 'br', x: effw/2, y: effh/2 }
    ];
    for (const pt of resizePoints)
      if (Math.abs(localX - pt.x) <= handleSize && Math.abs(localY - pt.y) <= handleSize)
        return pt.id;
    const rotRadius = Math.max(10 / C.zm, 6);
    const rdx = localX, rdy = localY - (-effh / 2 - 10 / C.zm);
    if (rdx * rdx + rdy * rdy <= rotRadius * rotRadius) return 'rotate';
    if (localX >= -effw/2 && localX <= effw/2 && localY >= -effh/2 && localY <= effh/2) return 'move';
    return null;
  }

  function constrain(ds2, pos) {
    const d = Math.max(Math.abs(pos.x - ds2.x), Math.abs(pos.y - ds2.y));
    return { x: ds2.x + (pos.x >= ds2.x ? d : -d), y: ds2.y + (pos.y >= ds2.y ? d : -d) };
  }

  function hitSymAxis(clientX, clientY) {
    if (!symH && !symV) return null;
    const rect = C.area.getBoundingClientRect();
    const msx = clientX - rect.left, msy = clientY - rect.top;
    if (symH) { const sp = C.c2s(C.W * C.symHP, 0); if (Math.abs(msx - sp.sx) < 10) return 'h'; }
    if (symV) { const sp = C.c2s(0, C.H * C.symVP); if (Math.abs(msy - sp.sy) < 10) return 'v'; }
    return null;
  }

  function onDown(e) {
    if (ctrlPick && !e.altKey) {
      cur = ctrlPick; ctrlPick = null;
      document.querySelectorAll('.tb').forEach(b => b.classList.toggle('on', b.dataset.tool === cur));
    }
    const pos = C.s2c(e.clientX, e.clientY);
    const isR = e.button === 2, isMid = e.button === 1;
    const col = isR ? C.sc : C.pc;
    drag = true; ds = { ...pos }; lp = { ...pos }; mo = null;
    if (_shiftPrev) _shiftPrev = null;
    if (isMid || spaceDown) { mo = { pan: true }; return; }
    if (_pxMaskMode && _pxMaskCtx && e.button === 0) {
      const px = Math.floor(pos.x), py = Math.floor(pos.y);
      if (px >= 0 && py >= 0 && px < C.W && py < C.H) {
        if (e.button === 0) {
          _pxMaskCtx.fillStyle = _pxMaskCol;
          _pxMaskCtx.fillRect(px, py, bSz, bSz);
        }
        C.render();
      }
      return;
    }
    if (e.altKey) {
      const symHit2 = hitSymAxis(e.clientX, e.clientY);
      if (symHit2) {
        if (ctrlPick) { cur = ctrlPick; ctrlPick = null;
          document.querySelectorAll('.tb').forEach(b => b.classList.toggle('on', b.dataset.tool === cur)); }
        mo = { type: 'symaxis', axis: symHit2 }; return;
      }
    }
    if (floating) {
      if (tfMode) {
        const hid = hitHandle(pos);
        if (hid === 'rotate') {
          const f = floating;
          mo = { type: 'rotate',
            sa: Math.atan2(pos.y - (f.y + (f.th || f.canvas.height) / 2),
                           pos.x - (f.x + (f.tw || f.canvas.width) / 2)),
            sr: f.rot || 0 };
          return;
        }
        if (hid && hid !== 'move') {
          mo = { type: 'handle', id: hid, ox: pos.x, oy: pos.y,
            ow: floating.tw || floating.canvas.width,
            oh: floating.th || floating.canvas.height,
            ofx: floating.x, ofy: floating.y };
          return;
        }
        if (hid === 'move') {
          mo = { type: 'movefloat', dx: pos.x - floating.x, dy: pos.y - floating.y };
          return;
        }
        if (!hid) {
          const f = floating;
          mo = { type: 'rotate',
            sa: Math.atan2(pos.y - (f.y + (f.th || f.canvas.height) / 2),
                           pos.x - (f.x + (f.tw || f.canvas.width) / 2)),
            sr: f.rot || 0 };
          return;
        }
      }
      const f = floating, fw = f.tw || f.canvas.width, fh = f.th || f.canvas.height;
      if (pos.x >= f.x && pos.x <= f.x + fw && pos.y >= f.y && pos.y <= f.y + fh) {
        mo = { type: 'movefloat', dx: pos.x - f.x, dy: pos.y - f.y }; return;
      }
      commitFloat();
    }
    const la = al();
    if (cur === 'pan') return;
    if (cur === 'magnifier') { C.zoomAt(isR ? 1 / 1.5 : 1.5, e.clientX, e.clientY); drag = false; return; }
    if (!la) return;
    if (e.ctrlKey && e.button === 0 && !floating) {
      const fr = An.frames[An.cf];
      if (fr) {
        const px = Math.floor(pos.x), py = Math.floor(pos.y);
        if (px >= 0 && py >= 0 && px < C.W && py < C.H) {
          for (let i = fr.layers.length - 1; i >= 0; i--) {
            if (!fr.layers[i].visible) continue;
            if (fr.layers[i].ctx.getImageData(px, py, 1, 1).data[3] > 0) {
              fr.activeLayer = i; Ly.ui(); break;
            }
          }
        }
      }
      drag = false; return;
    }
    if (e.ctrlKey && isR && !floating) {
      if (la.locked) { _showLockMsg(); drag = false; return; }
      Hi.push(); mo = { type: 'movelayer', ...pos }; return;
    }
    const readOnly = ['picker', 'rect-select', 'freehand-select', 'magic-wand', 'brush-select'].includes(cur);
    if (la.locked && !readOnly) { _showLockMsg(); drag = false; return; }
    if (e.shiftKey && sel && sel.type === 'rect' && (isSel(cur) || cur === 'move')) {
      if (floatFromSel()) { mo = { type: 'movefloat', dx: pos.x - floating.x, dy: pos.y - floating.y }; }
      return;
    }
    if (Ly.isMaskEditing(la) && cur === 'brush') {
      Hi.push(); ppPrev = null; ppPend = null;
      Ly.paintMaskDot(la, pos.x, pos.y, bSz);
      lastBP = { x: Math.floor(pos.x), y: Math.floor(pos.y) }; C.render();
    }
    else if (Ly.isMaskEditing(la) && cur === 'eraser') {
      Hi.push(); ppPrev = null; ppPend = null;
      Ly.paintMaskDot(la, pos.x, pos.y, bSz, 0);
      lastBP = { x: Math.floor(pos.x), y: Math.floor(pos.y) }; C.render();
    }
    else if (['brush', 'eraser', 'airbrush'].includes(cur)) {
      Hi.push(); ppPrev = null; ppPend = null;
      if (patMode === 'dest' && customBrush) { patDstX = Math.floor(pos.x); patDstY = Math.floor(pos.y); }
      if (e.shiftKey && lastBP && (cur === 'brush' || cur === 'eraser')) {
        if (cur === 'eraser') {
          la.ctx.save(); la.ctx.globalCompositeOperation = 'destination-out';
          plotLine(lastBP.x, lastBP.y, Math.floor(pos.x), Math.floor(pos.y),
            (a, b) => symDraw(la.ctx, (c, xx, yy) => dot(c, xx, yy, bSz, '#000'), a, b));
          la.ctx.restore();
        } else {
          plotLine(lastBP.x, lastBP.y, Math.floor(pos.x), Math.floor(pos.y),
            (a, b) => symDraw(la.ctx, (c, xx, yy) => dot(c, xx, yy, bSz, col), a, b));
        }
      } else if (cur === 'eraser') {
        la.ctx.save(); la.ctx.globalCompositeOperation = 'destination-out';
        symDraw(la.ctx, (c, xx, yy) => dot(c, xx, yy, bSz, '#000'), pos.x, pos.y);
        la.ctx.restore();
      } else if (cur === 'airbrush') {
        symDraw(la.ctx, (c, xx, yy) => spray(c, xx, yy, col), pos.x, pos.y);
      } else {
        symDraw(la.ctx, (c, xx, yy) => dot(c, xx, yy, bSz, col), pos.x, pos.y);
      }
      ppPrev = { x: Math.floor(pos.x), y: Math.floor(pos.y) };
      lastBP = { ...ppPrev }; C.render();
    }
    else if (cur === 'smooth') { Hi.push(); applySmooth(la.ctx, pos.x, pos.y, bSz); C.render(); }
    else if (cur === 'jumble') { Hi.push(); lp = { x: pos.x, y: pos.y }; applyJumble(la.ctx, pos.x, pos.y, bSz); C.render(); }
    else if (cur === 'lightdark') { Hi.push(); applyLightDark(la.ctx, pos.x, pos.y, ldSize, getLightDarkDelta(isR)); C.render(); }
    else if (cur === 'bucket') { Hi.push(); T.runSelectedEdit(la, ctx => floodFill(ctx, pos.x, pos.y, col)); C.render(); Ly.ui(); }
    else if (cur === 'picker') {
      const cx2 = C.compClean();
      const px2 = Math.floor(pos.x), py2 = Math.floor(pos.y);
      if (px2 >= 0 && py2 >= 0 && px2 < C.W && py2 < C.H) {
        const dd = cx2.getImageData(px2, py2, 1, 1).data;
        const hex = '#' + [dd[0], dd[1], dd[2]].map(v => v.toString(16).padStart(2, '0')).join('');
        if (isR) C.sc = hex; else C.pc = hex;
        U.uCol();
      }
    }
    else if (cur === 'rect-select' || cur === 'brush-select') { sel = null; }
    else if (cur === 'freehand-select') { sel = { type: 'freehand', points: [{ ...pos }] }; }
    else if (cur === 'contour') {
      tc = document.createElement('canvas'); tc.width = C.W; tc.height = C.H;
      tx = tc.getContext('2d'); tx.imageSmoothingEnabled = false;
      contourPts = [{ x: Math.floor(pos.x), y: Math.floor(pos.y) }];
    }
    else if (cur === 'magic-wand') { magicSel(la, pos.x, pos.y); }
    else if (['line', 'rect', 'circle'].includes(cur)) {
      tc = document.createElement('canvas'); tc.width = C.W; tc.height = C.H;
      tx = tc.getContext('2d'); tx.imageSmoothingEnabled = false;
    }
    else if (cur === 'gradient') {
      Hi.push(); tc = document.createElement('canvas'); tc.width = C.W; tc.height = C.H;
      tx = tc.getContext('2d');
    }
    else if (cur === 'move') { Hi.push(); mo = { type: 'movelayer', ...pos }; }
    else if (cur === 'text') { U.textDlg(Math.floor(pos.x), Math.floor(pos.y)); }
  }

  function onMove(e) {
    if (!drag) return;
    let pos = C.s2c(e.clientX, e.clientY);
    const isR = (e.buttons & 2) !== 0, col = isR ? C.sc : C.pc;
    const la = al();
    if (mouseH > 0) {
      const sn = 1 + mouseH * .5;
      pos.x = Math.round(pos.x / sn) * sn; pos.y = Math.round(pos.y / sn) * sn;
    }
    if (ds && ['brush', 'eraser', 'airbrush'].includes(cur)) {
      if (lockX) pos.y = ds.y; if (lockY) pos.x = ds.x;
    }
    if (_pxMaskMode && _pxMaskCtx && (e.buttons & 1)) {
      const px = Math.floor(pos.x), py = Math.floor(pos.y);
      if (px >= 0 && py >= 0 && px < C.W && py < C.H) {
        _pxMaskCtx.fillStyle = _pxMaskCol;
        const x0 = Math.floor(lp.x), y0 = Math.floor(lp.y);
        const dx = Math.abs(px-x0), dy = Math.abs(py-y0), sx = x0<px?1:-1, sy = y0<py?1:-1;
        let ex = dx-dy, cx2 = x0, cy2 = y0;
        while (true) { _pxMaskCtx.fillRect(cx2, cy2, bSz, bSz); if(cx2===px&&cy2===py)break; const e2=2*ex; if(e2>-dy){ex-=dy;cx2+=sx;} if(e2<dx){ex+=dx;cy2+=sy;} }
        lp = { ...pos }; C.render();
      }
      return;
    }
    if ((mo && mo.pan) || (e.buttons & 4) || spaceDown) {
      C.px += e.movementX; C.py += e.movementY; C.render(); return;
    }
    if (mo && mo.type === 'symaxis') {
      if (mo.axis === 'h') C.symHP = Math.max(0.01, Math.min(0.99, pos.x / C.W));
      else C.symVP = Math.max(0.01, Math.min(0.99, pos.y / C.H));
      C.render(); U.uTopt(); return;
    }
    if (floating && mo) {
      if (mo.type === 'movefloat') { floating.x = pos.x - mo.dx; floating.y = pos.y - mo.dy; C.render(); return; }
      if (mo.type === 'rotate') {
        const f = floating;
        const fcx = f.x + (f.tw || f.canvas.width) / 2, fcy = f.y + (f.th || f.canvas.height) / 2;
        floating.rot = mo.sr + (Math.atan2(pos.y - fcy, pos.x - fcx) - mo.sa);
        C.render(); return;
      }
      if (mo.type === 'handle') {
        const dx2 = pos.x - mo.ox, dy2 = pos.y - mo.oy, id2 = mo.id;
        if (e.shiftKey && (id2 === 'br' || id2 === 'tr' || id2 === 'bl' || id2 === 'tl')) {
          const ratio = mo.ow / Math.max(1, mo.oh);
          let nw, nh;
          if (id2 === 'br') { nw = Math.max(1, Math.round(mo.ow + dx2)); nh = Math.max(1, Math.round(nw / ratio)); floating.tw = nw; floating.th = nh; }
          else if (id2 === 'tr') { nw = Math.max(1, Math.round(mo.ow + dx2)); nh = Math.max(1, Math.round(nw / ratio)); floating.tw = nw; floating.th = nh; floating.y = Math.round(mo.ofy + (mo.oh - nh)); }
          else if (id2 === 'bl') { nw = Math.max(1, Math.round(mo.ow - dx2)); nh = Math.max(1, Math.round(nw / ratio)); floating.tw = nw; floating.th = nh; floating.x = Math.round(mo.ofx + (mo.ow - nw)); }
          else if (id2 === 'tl') { nw = Math.max(1, Math.round(mo.ow - dx2)); nh = Math.max(1, Math.round(nw / ratio)); floating.tw = nw; floating.th = nh; floating.x = Math.round(mo.ofx + (mo.ow - nw)); floating.y = Math.round(mo.ofy + (mo.oh - nh)); }
          C.render(); return;
        }
        if (id2 === 'br') { floating.tw = Math.max(1, Math.round(mo.ow + dx2)); floating.th = Math.max(1, Math.round(mo.oh + dy2)); }
        else if (id2 === 'tr') { floating.tw = Math.max(1, Math.round(mo.ow + dx2)); floating.th = Math.max(1, Math.round(mo.oh - dy2)); floating.y = mo.ofy + dy2; }
        else if (id2 === 'bl') { floating.tw = Math.max(1, Math.round(mo.ow - dx2)); floating.th = Math.max(1, Math.round(mo.oh + dy2)); floating.x = mo.ofx + dx2; }
        else if (id2 === 'tl') { floating.tw = Math.max(1, Math.round(mo.ow - dx2)); floating.th = Math.max(1, Math.round(mo.oh - dy2)); floating.x = mo.ofx + dx2; floating.y = mo.ofy + dy2; }
        else if (id2 === 'tc') { floating.th = Math.max(1, Math.round(mo.oh - dy2)); floating.y = mo.ofy + dy2; }
        else if (id2 === 'bc') { floating.th = Math.max(1, Math.round(mo.oh + dy2)); }
        else if (id2 === 'ml') { floating.tw = Math.max(1, Math.round(mo.ow - dx2)); floating.x = mo.ofx + dx2; }
        else if (id2 === 'mr') { floating.tw = Math.max(1, Math.round(mo.ow + dx2)); }
        C.render(); return;
      }
    }
    if (cur === 'pan') { C.px += e.movementX; C.py += e.movementY; C.render(); lp = { ...pos }; return; }
    const readOnly = ['picker', 'rect-select', 'freehand-select', 'magic-wand', 'brush-select'].includes(cur);
    if (!la || (la.locked && !readOnly)) { lp = { ...pos }; return; }
    if (mo && mo.type === 'movelayer') {
      const dx2 = Math.round(pos.x - mo.x), dy2 = Math.round(pos.y - mo.y);
      if (dx2 || dy2) {
        const imgd = la.ctx.getImageData(0, 0, C.W, C.H);
        la.ctx.clearRect(0, 0, C.W, C.H); la.ctx.putImageData(imgd, dx2, dy2);
        if (moveAll) {
          for (let fi = 0; fi < An.frames.length; fi++) {
            if (fi === An.cf) continue;
            const oLy = Ly._findByName(la.name, An.frames[fi]);
            if (!oLy) continue;
            const oid = oLy.ctx.getImageData(0, 0, C.W, C.H);
            oLy.ctx.clearRect(0, 0, C.W, C.H);
            oLy.ctx.putImageData(oid, dx2, dy2);
          }
        }
        mo = { type: 'movelayer', ...pos }; C.render();
      }
      lp = { ...pos }; return;
    }
    if (Ly.isMaskEditing(la) && cur === 'brush') {
      Ly.paintMaskLine(la, lp.x, lp.y, pos.x, pos.y, bSz);
      lastBP = { x: Math.floor(pos.x), y: Math.floor(pos.y) };
      lp = { ...pos }; C.render(); return;
    }
    if (Ly.isMaskEditing(la) && cur === 'eraser') {
      Ly.paintMaskLine(la, lp.x, lp.y, pos.x, pos.y, bSz, 0);
      lastBP = { x: Math.floor(pos.x), y: Math.floor(pos.y) };
      lp = { ...pos }; C.render(); return;
    }
    if (cur === 'brush') {
      if (ppx && bSz <= 1 && !customBrush) {
        const nx = Math.floor(pos.x), ny = Math.floor(pos.y);
        if (nx !== Math.floor(lp.x) || ny !== Math.floor(lp.y)) {
          if (ppPend) {
            const dx1 = Math.abs(ppPend.x - ppPrev.x), dy1 = Math.abs(ppPend.y - ppPrev.y);
            const dx2 = Math.abs(nx - ppPend.x), dy2 = Math.abs(ny - ppPend.y);
            if (dx1 + dy1 === 1 && dx2 + dy2 === 1 && dx1 !== dx2) { ppPend = { x: nx, y: ny }; }
            else { symDraw(la.ctx, (c, xx, yy) => dot(c, xx, yy, bSz, col), ppPend.x, ppPend.y); ppPrev = { ...ppPend }; ppPend = { x: nx, y: ny }; }
          } else if (ppPrev) { ppPend = { x: nx, y: ny }; }
          else { symDraw(la.ctx, (c, xx, yy) => dot(c, xx, yy, bSz, col), nx, ny); ppPrev = { x: nx, y: ny }; }
        }
      } else {
        if (bShape === 'custom' && bSpacing > 0) {
          const x0 = Math.floor(lp.x), y0 = Math.floor(lp.y);
          const x1 = Math.floor(pos.x), y1 = Math.floor(pos.y);
          const ddx = x1 - x0, ddy = y1 - y0;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          const step = Math.max(1, bSpacing);
          const n = Math.max(1, Math.floor(dist / step));
          for (let si = 0; si <= n; si++) {
            const t = n > 0 ? si / n : 0;
            symDraw(la.ctx, (c, xx, yy) => dot(c, xx, yy, bSz, col),
              Math.round(x0 + ddx * t), Math.round(y0 + ddy * t));
          }
        } else {
          plotLine(Math.floor(lp.x), Math.floor(lp.y), Math.floor(pos.x), Math.floor(pos.y),
            (a, b) => symDraw(la.ctx, (c, xx, yy) => dot(c, xx, yy, bSz, col), a, b));
        }
      }
      lastBP = { x: Math.floor(pos.x), y: Math.floor(pos.y) };
      lp = { ...pos }; C.render();
    }
    else if (cur === 'eraser') {
      la.ctx.save(); la.ctx.globalCompositeOperation = 'destination-out';
      plotLine(Math.floor(lp.x), Math.floor(lp.y), Math.floor(pos.x), Math.floor(pos.y),
        (a, b) => symDraw(la.ctx, (c, xx, yy) => dot(c, xx, yy, bSz, '#000'), a, b));
      la.ctx.restore();
      lastBP = { x: Math.floor(pos.x), y: Math.floor(pos.y) };
      lp = { ...pos }; C.render();
    }
    else if (cur === 'airbrush') { symDraw(la.ctx, (c, xx, yy) => spray(c, xx, yy, col), pos.x, pos.y); lp = { ...pos }; C.render(); }
    else if (cur === 'smooth') { applySmooth(la.ctx, pos.x, pos.y, bSz); lp = { ...pos }; C.render(); }
    else if (cur === 'jumble') {
      const dx2 = pos.x - lp.x, dy2 = pos.y - lp.y;
      const step = Math.max(2, Math.round(bSz * 0.7));
      if ((dx2 * dx2 + dy2 * dy2) >= (step * step)) { applyJumble(la.ctx, pos.x, pos.y, bSz); lp = { ...pos }; C.render(); }
    }
    else if (cur === 'lightdark') {
      const delta = getLightDarkDelta(isR);
      plotLine(Math.floor(lp.x), Math.floor(lp.y), Math.floor(pos.x), Math.floor(pos.y),
        (a, b) => applyLightDark(la.ctx, a, b, ldSize, delta));
      lp = { ...pos }; C.render();
    }
    else if (['rect-select', 'brush-select'].includes(cur)) {
      let p = pos;
      if (e.shiftKey) p = constrain(ds, pos);
      const x = Math.min(ds.x, p.x), y = Math.min(ds.y, p.y);
      const w = Math.abs(p.x - ds.x), h = Math.abs(p.y - ds.y);
      sel = { type: 'rect', x: Math.round(x), y: Math.round(y), w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
      C.render();
    }
    else if (cur === 'freehand-select' && sel && sel.type === 'freehand') { sel.points.push({ ...pos }); C.render(); }
    else if (cur === 'contour' && tx && contourPts) {
      const nx = Math.floor(pos.x), ny = Math.floor(pos.y);
      const last = contourPts[contourPts.length - 1];
      if (!last || last.x !== nx || last.y !== ny) contourPts.push({ x: nx, y: ny });
      tx.clearRect(0, 0, C.W, C.H);
      drawContour(tx, contourPts, col, true);
      C.render();
      document.getElementById('mc').getContext('2d').drawImage(tc, 0, 0);
    }
    else if (['line', 'rect', 'circle'].includes(cur) && tx) {
      let p = pos;
      if (e.shiftKey && (cur === 'rect' || cur === 'circle')) p = constrain(ds, pos);
      tx.clearRect(0, 0, C.W, C.H);
      T.runSelectedEdit({ ctx: tx, canvas: tc }, ctx => drawShape(ctx, ds, p, col));
      C.render();
      document.getElementById('mc').getContext('2d').drawImage(tc, 0, 0);
    }
    else if (cur === 'gradient' && tx) {
      tx.clearRect(0, 0, C.W, C.H);
      const savedDither = gradDither;
      gradDither = false;
      T.runSelectedEdit({ ctx: tx, canvas: tc },
        ctx => drawGrad(ctx, ds.x, ds.y, pos.x, pos.y, C.pc, C.sc, gradT, gradTransparentSecondary));
      gradDither = savedDither;
      C.render();
      document.getElementById('mc').getContext('2d').drawImage(tc, 0, 0);
    }
  }

  function onUp(e) {
    if (!drag) return;
    drag = false;
    let pos = C.s2c(e.clientX, e.clientY);
    const isR = e.button === 2, col = isR ? C.sc : C.pc;
    const la = al();
    if (ppPend && la && cur === 'brush' && ppx && bSz <= 1 && !customBrush) {
      symDraw(la.ctx, (c, xx, yy) => dot(c, xx, yy, bSz, col), ppPend.x, ppPend.y);
      C.render();
    }
    ppPrev = null; ppPend = null;
    if (mo && (mo.pan || mo.type === 'movefloat' || mo.type === 'handle' ||
               mo.type === 'rotate' || mo.type === 'symaxis')) { mo = null; return; }
    if (['line', 'rect', 'circle'].includes(cur) && la && !la.locked && tx) {
      Hi.push();
      let p = pos;
      if (e.shiftKey && (cur === 'rect' || cur === 'circle')) p = constrain(ds, pos);
      T.runSelectedEdit(la, ctx => drawShape(ctx, ds, p, col));
      tc = null; tx = null; C.render();
    }
    if (cur === 'gradient' && la && !la.locked && tx) {
      T.runSelectedEdit(la,
        ctx => drawGrad(ctx, ds.x, ds.y, pos.x, pos.y, C.pc, C.sc, gradT, gradTransparentSecondary));
      tc = null; tx = null; C.render();
    }
    if (cur === 'contour') {
      if (la && !la.locked && tx && contourPts && contourPts.length >= 3) {
        Hi.push();
        T.runSelectedEdit(la, ctx => drawContour(ctx, contourPts, col));
      }
      tc = null; tx = null; contourPts = null; C.render(); Ly.ui();
    }
    if (cur === 'brush-select' && sel && sel.type === 'rect') grabBrush();
    if (cur === 'freehand-select' && sel && sel.type === 'freehand') {
      const pts = sel.points;
      if (pts.length >= 3) {
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (const p of pts) {
          if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y;
          if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y;
        }
        sel = { type: 'rect', x: Math.round(x0), y: Math.round(y0),
                w: Math.max(1, Math.round(x1 - x0)), h: Math.max(1, Math.round(y1 - y0)) };
      } else sel = null;
      C.render();
    }
    if (_layerSync && la && ['brush', 'eraser', 'airbrush', 'jumble', 'smooth', 'lightdark', 'bucket', 'line', 'rect', 'circle', 'contour', 'gradient'].includes(cur)) {
      for (let fi = 0; fi < An.frames.length; fi++) {
        if (fi === An.cf) continue;
        const oLy = Ly._findByName(la.name, An.frames[fi]);
        if (!oLy) continue;
        oLy.ctx.clearRect(0, 0, C.W, C.H);
        oLy.ctx.drawImage(la.canvas, 0, 0);
      }
    }
    if (_layerSync && la && Ly.isMaskEditing(la) && ['brush', 'eraser'].includes(cur)) {
      Ly.syncMaskToAllFrames(An.frames[An.cf].activeLayer);
    }
    mo = null; Ly.ui();
  }

  function drawContour(ctx, pts, col, preview = false) {
    if (!pts || pts.length < 2) return;
    const strokeAlpha = preview ? 0.85 : bOp / 100;
    const fillAlpha = preview ? 0.25 : bOp / 100;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = col; ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(1, Math.round(bSz));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const hasArea = pts.length >= 3;
    if (hasArea) {
      ctx.globalAlpha = fillAlpha;
      ctx.beginPath(); ctx.moveTo(Math.floor(pts[0].x), Math.floor(pts[0].y));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(Math.floor(pts[i].x), Math.floor(pts[i].y));
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = strokeAlpha;
    if (_usePixelShapeStroke()) { _pixelContour(ctx, pts, col); }
    else {
      ctx.beginPath(); ctx.moveTo(Math.floor(pts[0].x), Math.floor(pts[0].y));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(Math.floor(pts[i].x), Math.floor(pts[i].y));
      if (hasArea) ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShape(ctx, f, t, col) {
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.strokeStyle = col; ctx.fillStyle = col;
    ctx.lineWidth = Math.max(1, Math.round(bSz));
    if (cur === 'line') {
      if (_usePixelShapeStroke()) _pixelLine(ctx, f.x, f.y, t.x, t.y, col);
      else { ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(t.x, t.y); ctx.stroke(); }
    } else if (cur === 'rect') {
      if (shM === 'filled') {
        const x = Math.min(f.x, t.x), y = Math.min(f.y, t.y);
        ctx.fillRect(x, y, Math.abs(t.x - f.x), Math.abs(t.y - f.y));
      } else if (_usePixelShapeStroke()) _pixelRect(ctx, f, t, col);
      else {
        const x = Math.min(f.x, t.x), y = Math.min(f.y, t.y);
        ctx.strokeRect(x, y, Math.abs(t.x - f.x), Math.abs(t.y - f.y));
      }
    } else if (cur === 'circle') {
      const cx2 = (f.x + t.x) / 2, cy2 = (f.y + t.y) / 2;
      const rx = Math.abs(t.x - f.x) / 2, ry = Math.abs(t.y - f.y) / 2;
      if (rx < 1 || ry < 1) { ctx.restore(); return; }
      if (shM === 'filled') {
        if (_usePixelShapeStroke()) _pixelFilledEllipse(ctx, f, t, col);
        else { ctx.beginPath(); ctx.ellipse(cx2, cy2, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
      } else if (_usePixelShapeStroke()) _pixelEllipse(ctx, f, t, col);
      else { ctx.beginPath(); ctx.ellipse(cx2, cy2, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore();
  }

  /* Marching ants */
  let _marchOff = 0;
  setInterval(() => {
    _marchOff = (_marchOff + 1) % 12;
    if (sel || floating) { if (C.scheduleRender) C.scheduleRender(); else C.render(); }
  }, 130);

  function drawSel(ctx) {
    if (!sel) return;
    ctx.save();
    const sx = Math.round(sel.x || 0), sy = Math.round(sel.y || 0);
    const sw = Math.round(sel.w || 0), sh = Math.round(sel.h || 0);
    const u = 1 / C.zm;
    function strokeRect3() {
      ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = u * 2.5; ctx.setLineDash([]);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = u * 1.2; ctx.setLineDash([]);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = u * 1.2;
      ctx.setLineDash([6 * u, 4 * u]); ctx.lineDashOffset = -_marchOff * u;
      ctx.strokeRect(sx, sy, sw, sh);
    }
    function strokePath3(pts) {
      function dp() {
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath(); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = u * 2.5; ctx.setLineDash([]); dp();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = u * 1.2; ctx.setLineDash([]); dp();
      ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = u * 1.2;
      ctx.setLineDash([6 * u, 4 * u]); ctx.lineDashOffset = -_marchOff * u; dp();
    }
    if (sel.type === 'rect') strokeRect3();
    else if (sel.type === 'freehand' && sel.points && sel.points.length > 0) strokePath3(sel.points);
    ctx.restore();
  }

  function copySel() {
    const la = al();
    if (!la || !sel || sel.type !== 'rect') return;
    const sx = Math.max(0, Math.round(sel.x)), sy = Math.max(0, Math.round(sel.y));
    const sw = Math.min(Math.round(sel.w), C.W - sx), sh = Math.min(Math.round(sel.h), C.H - sy);
    if (sw < 1 || sh < 1) return;
    clip = document.createElement('canvas');
    clip.width = sw; clip.height = sh;
    const cx = clip.getContext('2d');
    cx.drawImage(la.canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    if (sel.mask) {
      const id = cx.getImageData(0, 0, sw, sh), d = id.data;
      for (let i = 0; i < sel.mask.length; i++)
        if (!sel.mask[i]) { d[i*4]=d[i*4+1]=d[i*4+2]=d[i*4+3]=0; }
      cx.putImageData(id, 0, 0);
    }
  }

  function cutSel() {
    const la = al();
    if (!la || !sel) return;
    Hi.push(); copySel();
    if (sel.mask) {
      const sx = Math.max(0, Math.round(sel.x)), sy = Math.max(0, Math.round(sel.y));
      const sw = Math.min(Math.round(sel.w), C.W - sx), sh = Math.min(Math.round(sel.h), C.H - sy);
      const id = la.ctx.getImageData(sx, sy, sw, sh), d = id.data;
      for (let i = 0; i < sel.mask.length; i++)
        if (sel.mask[i]) { d[i*4]=d[i*4+1]=d[i*4+2]=d[i*4+3]=0; }
      la.ctx.putImageData(id, sx, sy);
    } else { la.ctx.clearRect(Math.round(sel.x), Math.round(sel.y), Math.round(sel.w), Math.round(sel.h)); }
    C.render(); Ly.ui();
  }

  function pasteSel() {
    if (!clip) return;
    const x = sel ? Math.round(sel.x) : Math.round((C.W - clip.width) / 2);
    const y = sel ? Math.round(sel.y) : Math.round((C.H - clip.height) / 2);
    const fc = document.createElement('canvas');
    fc.width = clip.width; fc.height = clip.height;
    fc.getContext('2d').drawImage(clip, 0, 0);
    floating = { canvas: fc, x, y, tw: clip.width, th: clip.height, rot: 0 };
    floatingUndoCaptured = false; tfMode = false; sel = null; C.render();
  }

  function delSel() {
    const la = al();
    if (!la || !sel) return;
    Hi.push();
    if (sel.mask) {
      const sx = Math.max(0, Math.round(sel.x)), sy = Math.max(0, Math.round(sel.y));
      const sw = Math.min(Math.round(sel.w), C.W - sx), sh = Math.min(Math.round(sel.h), C.H - sy);
      const id = la.ctx.getImageData(sx, sy, sw, sh), d = id.data;
      for (let i = 0; i < sel.mask.length; i++)
        if (sel.mask[i]) { d[i*4]=d[i*4+1]=d[i*4+2]=d[i*4+3]=0; }
      la.ctx.putImageData(id, sx, sy);
    } else { la.ctx.clearRect(Math.round(sel.x), Math.round(sel.y), Math.round(sel.w), Math.round(sel.h)); }
    C.render(); Ly.ui();
  }

  function clrSel() { if (floating) commitFloat(); sel = null; C.render(); }

  function selAll() {
    if (sel && sel.type === 'rect' && sel.x === 0 && sel.y === 0 && sel.w === C.W && sel.h === C.H)
      sel = null;
    else sel = { type: 'rect', x: 0, y: 0, w: C.W, h: C.H };
    C.render();
  }

  function toggleTf(on) {
    if (on && sel && sel.type === 'rect' && !floating) {
      if (!floatFromSel()) return;
      tfMode = true; tfAction = 'auto';
    } else if (!on && floating) commitFloat();
    tfMode = on;
    if (!on) tfAction = 'auto';
    C.render(); U.uTopt();
  }

  function set(t) {
    if (floating) commitFloat();
    tfMode = false;
    cur = t; tc = null; tx = null; contourPts = null;
    mo = null; ppPrev = null; ppPend = null; lp = null; ds = null;
    document.querySelectorAll('.tb').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
    U.uTopt(); C.render();
  }

  function setLight(t) {
    cur = t;
    document.querySelectorAll('.tb').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  }

  function resetStuck() {
    if (ctrlPick) {
      cur = ctrlPick; ctrlPick = null;
      document.querySelectorAll('.tb').forEach(b => b.classList.toggle('on', b.dataset.tool === cur));
    }
    spaceDown = false; drag = false; mo = null; tc = null; tx = null;
    contourPts = null; lp = null; ds = null; ppPrev = null; ppPend = null;
  }

  return {
    get current() { return cur; },
    get brushSize() { return bSz; }, set brushSize(v) { bSz = v; },
    get ldSize() { return ldSize; }, set ldSize(v) { ldSize = Math.max(1, Math.min(128, +v || 1)); },
    get ldStrength() { return ldStrength; }, set ldStrength(v) { ldStrength = Math.max(1, Math.min(100, +v || 1)); },
    get ldInvert() { return ldInvert; }, set ldInvert(v) { ldInvert = !!v; },
    get bSpacing() { return bSpacing; }, set bSpacing(v) { bSpacing = v; },
    get bMinDiam() { return bMinDiam; }, set bMinDiam(v) { bMinDiam = v; },
    get bScatter() { return bScatter; }, set bScatter(v) { bScatter = v; },
    get hardness() { return soft; }, set hardness(v) { soft = v; },
    get tolerance() { return tol; }, set tolerance(v) { tol = v; },
    get brushOpacity() { return bOp; }, set brushOpacity(v) { bOp = v; },
    get jumbleIntensity() { return jumbleInt; }, set jumbleIntensity(v) { jumbleInt = v; },
    get pixelPerfect() { return ppx; }, set pixelPerfect(v) { ppx = v; },
    get shapeMode() { return shM; }, set shapeMode(v) { shM = v; },
    get brushShape() { return bShape; }, set brushShape(v) { bShape = v; },
    get symH() { return symH; }, set symH(v) { symH = v; C.render(); },
    get symV() { return symV; }, set symV(v) { symV = v; C.render(); },
    get sym45() { return sym45; }, set sym45(v) { sym45 = v; C.render(); },
    get sym45n() { return sym45n; }, set sym45n(v) { sym45n = v; C.render(); },
    get mouseHard() { return mouseH; }, set mouseHard(v) { mouseH = v; },
    get lockX() { return lockX; }, set lockX(v) { lockX = v; if (v) lockY = false; },
    get lockY() { return lockY; }, set lockY(v) { lockY = v; if (v) lockX = false; },
    get smoothInt() { return smInt; }, set smoothInt(v) { smInt = v; },
    get selection() { return sel; }, set selection(v) { sel = v; },
    get selFrames() { return selFrames; },
    get customBrush() { return customBrush; },
    get gradType() { return gradT; }, set gradType(v) { gradT = v; },
    get gradTransparentSecondary() { return gradTransparentSecondary; }, set gradTransparentSecondary(v) { gradTransparentSecondary = !!v; },
    get gradDither() { return gradDither; }, set gradDither(v) { gradDither = v; },
    get gradDitherLv() { return gradDitherLv; }, set gradDitherLv(v) { gradDitherLv = v; },
    get gradDitherSt() { return gradDitherSt; }, set gradDitherSt(v) { gradDitherSt = v; },
    get lockAlpha() { return lockAlpha; }, set lockAlpha(v) { lockAlpha = !!v; },
    get fillContig() { return fillContig; }, set fillContig(v) { fillContig = !!v; },
    get patMode() { return patMode; }, set patMode(v) { patMode = ['none','source','dest'].includes(v) ? v : 'none'; },
    get floating() { return floating; },
    get tfMode() { return tfMode; },
    get tfPixel() { return tfPixel; }, set tfPixel(v) { tfPixel = v; C.render(); },
    get tfAction() { return tfAction; }, set tfAction(v) { tfAction = v; },
    get spaceDown() { return spaceDown; }, set spaceDown(v) { spaceDown = v; },
    get ctrlPick() { return ctrlPick; }, set ctrlPick(v) { ctrlPick = v; },
    get moveAllFrames() { return moveAll; }, set moveAllFrames(v) { moveAll = v; },
    get _shiftPreview() { return _shiftPrev; },
    _getLastBP() { return lastBP; },
    _setShiftPrev(x0, y0, x1, y1) { _shiftPrev = { x0, y0, x1, y1 }; },
    _clearShiftPrev() { _shiftPrev = null; },
    onDown, onMove, onUp, drawSel, set, setLight, resetStuck,
    copySel, cutSel: _lg(cutSel), pasteSel, delSel: _lg(delSel), clrSel, selAll,
    activeLayer: al, grabBrush, flipCB, rotCB, clearCB,
    commitFloat, toggleTf, isSel, startFreeRot,
    hasSelection: hasSel,
    selectionBounds: selBounds,
    selectionHit: selHit,
    runSelectedEdit
  };
})();
