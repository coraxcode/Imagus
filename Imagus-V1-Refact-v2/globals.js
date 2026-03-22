"use strict";

/* ===== CONSTANTS ===== */
const SEL_TOOLS = ['rect-select', 'freehand-select', 'magic-wand', 'brush-select'];
const FLOOD_FILL_MAX_ITERATIONS = 4000000;

const LAYER_BLEND_MODES = Object.freeze([
  'normal',
  'dissolve',
  'behind',
  'clear',
  'darken',
  'multiply',
  'color-burn',
  'linear-burn',
  'darker-color',
  'lighten',
  'screen',
  'color-dodge',
  'linear-dodge',
  'lighter-color',
  'overlay',
  'soft-light',
  'hard-light',
  'vivid-light',
  'linear-light',
  'pin-light',
  'hard-mix',
  'difference',
  'exclusion',
  'subtract',
  'divide',
  'hue',
  'saturation',
  'color',
  'luminosity'
]);

const LAYER_BLEND_LABELS = Object.freeze({
  normal: 'Normal',
  dissolve: 'Dissolve',
  behind: 'Behind',
  clear: 'Clear',
  darken: 'Darken',
  multiply: 'Multiply',
  'color-burn': 'Color Burn',
  'linear-burn': 'Linear Burn',
  'darker-color': 'Darker Color',
  lighten: 'Lighten',
  screen: 'Screen',
  'color-dodge': 'Color Dodge',
  'linear-dodge': 'Linear Dodge (Add)',
  'lighter-color': 'Lighter Color',
  overlay: 'Overlay',
  'soft-light': 'Soft Light',
  'hard-light': 'Hard Light',
  'vivid-light': 'Vivid Light',
  'linear-light': 'Linear Light',
  'pin-light': 'Pin Light',
  'hard-mix': 'Hard Mix',
  difference: 'Difference',
  exclusion: 'Exclusion',
  subtract: 'Subtract',
  divide: 'Divide',
  hue: 'Hue',
  saturation: 'Saturation',
  color: 'Color',
  luminosity: 'Luminosity'
});

const LAYER_BLEND_NATIVE_OPS = Object.freeze({
  normal: 'source-over',
  behind: 'destination-over',
  clear: 'destination-out',
  darken: 'darken',
  multiply: 'multiply',
  'color-burn': 'color-burn',
  lighten: 'lighten',
  screen: 'screen',
  'color-dodge': 'color-dodge',
  overlay: 'overlay',
  'soft-light': 'soft-light',
  'hard-light': 'hard-light',
  difference: 'difference',
  exclusion: 'exclusion',
  hue: 'hue',
  saturation: 'saturation',
  color: 'color',
  luminosity: 'luminosity'
});

const PAL256 = (() => {
  const c = [];
  for (let r = 0; r < 6; r++)
    for (let g = 0; g < 6; g++)
      for (let b = 0; b < 6; b++)
        c.push('#' + [r * 51, g * 51, b * 51].map(v => v.toString(16).padStart(2, '0')).join(''));
  for (let i = 0; i < 40; i++) {
    const v = Math.round(i * 255 / 39);
    c.push('#' + v.toString(16).padStart(2, '0').repeat(3));
  }
  return c.slice(0, 256);
})();

let userPalette = [...PAL256];
let palSwatchSize = 12;

let KEYS = {
  brush: 'b', eraser: 'e', airbrush: 'a', jumble: 'j', bucket: 'g', picker: 'i',
  move: 'v', 'rect-select': 'm', 'magic-wand': 'w', text: 't',
  line: 'l', rect: 'r', circle: 'c', contour: 'o', pan: 'h', smooth: 's',
  gradient: 'd', lightdark: 'k', magnifier: 'z',
  prevFrame: '1', nextFrame: '2', goToFrame: '3', play: '4',
  onionSkin: '5', swapColors: 'x'
};

/* Safe blob URL helper */
const BlobURLs = (() => {
  const active = new Set();
  function create(blob) {
    const url = URL.createObjectURL(blob);
    active.add(url);
    return url;
  }
  function revoke(url) {
    if (url && active.has(url)) {
      URL.revokeObjectURL(url);
      active.delete(url);
    }
  }
  function revokeAll() {
    for (const url of active) URL.revokeObjectURL(url);
    active.clear();
  }
  return { create, revoke, revokeAll };
})();

/* ===== SHARED MUTABLE STATE ===== */
let _lockMsgTimer = 0;
let _dirty = false;
let _layerSync = false;
let _pxMaskMode = false, _pxMaskCanvas = null, _pxMaskCtx = null, _pxMaskCol = '#ff000080';
let _autoSaveOn = false, _autoSaveMin = 5, _autoSaveTimer = null;

/* ===== LAYER LOCK GUARD ===== */
function _showLockMsg() {
  const ci = document.getElementById('ci');
  ci.textContent = '\u{1F512} Layer locked';
  ci.style.color = 'var(--acc)';
  clearTimeout(_lockMsgTimer);
  _lockMsgTimer = setTimeout(() => { ci.style.color = ''; C.render(); }, 1200);
}

function _lg(fn) {
  return function(...args) {
    const la = T.activeLayer();
    if (la && la.locked) { _showLockMsg(); return; }
    return fn.apply(this, args);
  };
}

/* ===== PIXEL MASK MODE ===== */
function updatePxMaskButton() {
  const btn = document.querySelector('.tb[data-tool="pixel-mask"]');
  if (!btn) return;
  btn.classList.toggle('mask-on', _pxMaskMode);
}

function togglePxMask() {
  if (_pxMaskMode) {
    _pxMaskMode = false;
    updatePxMaskButton();
    if (_pxMaskCanvas) {
      const w = C.W, h = C.H;
      const d = _pxMaskCtx.getImageData(0, 0, w, h).data;
      let x0 = w, y0 = h, x1 = 0, y1 = 0, found = false;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 0) {
          found = true;
          if (x < x0) x0 = x; if (y < y0) y0 = y;
          if (x > x1) x1 = x; if (y > y1) y1 = y;
        }
      }
      if (found) {
        const sw = x1 - x0 + 1, sh = y1 - y0 + 1;
        const mask = new Uint8Array(sw * sh);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
          if (d[(y * w + x) * 4 + 3] > 0) mask[(y - y0) * sw + (x - x0)] = 1;
        T.selection = { type: 'rect', x: x0, y: y0, w: sw, h: sh, mask };
      }
      _pxMaskCanvas = null; _pxMaskCtx = null;
    }
    C.render();
    document.getElementById('ci').textContent = 'Mask → Selection';
  } else {
    _pxMaskMode = true;
    updatePxMaskButton();
    _pxMaskCanvas = document.createElement('canvas');
    _pxMaskCanvas.width = C.W; _pxMaskCanvas.height = C.H;
    _pxMaskCtx = _pxMaskCanvas.getContext('2d');
    C.render();
    document.getElementById('ci').textContent = '🎭 MASK MODE — Paint pixels, press Q to finish';
    document.getElementById('ci').style.color = 'var(--acc)';
  }
}
