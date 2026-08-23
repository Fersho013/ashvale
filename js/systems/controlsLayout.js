/* =====================================================================
   EDITOR DE CONTROLES TÁCTILES — Layout persistente (punto 2)
   Cada control táctil (joystick, botones de acción, botón de pausa) se
   posiciona con position:absolute dentro de #game-container. Este módulo
   calcula esa posición/tamaño combinando:
     1) Un layout por defecto, anclado a una esquina (aproxima el CSS
        original), usado mientras el jugador no haya guardado nada propio.
     2) Un layout personalizado guardado en localStorage (en % del
        contenedor, para adaptarse razonablemente a distintas resoluciones).
   La edición en vivo (arrastrar/redimensionar) vive en js/ui/controlsEditor.js;
   este módulo solo calcula y aplica posiciones.
   ===================================================================== */
import { state } from '../state.js';

export const CONTROL_IDS = ['left-joy-base', 'btn-atk', 'btn-blk', 'btn-q', 'btn-r', 'btn-inv', 'touch-pause-btn'];

export const CONTROL_TYPES = {
    'left-joy-base':   'joystick',
    'btn-atk':         'button',
    'btn-blk':         'button',
    'btn-q':           'button',
    'btn-r':           'button',
    'btn-inv':         'button',
    'touch-pause-btn': 'button'
};

// Tamaño mínimo/máximo (px) permitido al redimensionar cada tipo de control.
export const SIZE_LIMITS = {
    joystick: { min: 70, max: 170 },
    button:   { min: 34, max: 88 }
};

// Posiciones por defecto: aproximan el layout visual original (joystick
// abajo-izquierda, botón de pausa arriba-derecha, botones de acción
// agrupados abajo-derecha). offsetX/offsetY son px medidos desde la
// esquina indicada por "anchor". Totalmente ajustable desde el editor.
const DEFAULT_LAYOUT = {
    'left-joy-base':   { anchor: 'bottom-left',  offsetX: 20,  offsetY: 20, size: 100 },
    'touch-pause-btn': { anchor: 'top-right',    offsetX: 15,  offsetY: 15, size: 46 },
    'btn-atk':         { anchor: 'bottom-right', offsetX: 15,  offsetY: 69, size: 46 },
    'btn-blk':         { anchor: 'bottom-right', offsetX: 69,  offsetY: 69, size: 46 },
    'btn-q':           { anchor: 'bottom-right', offsetX: 123, offsetY: 69, size: 46 },
    'btn-r':           { anchor: 'bottom-right', offsetX: 15,  offsetY: 15, size: 46 },
    'btn-inv':         { anchor: 'bottom-right', offsetX: 69,  offsetY: 15, size: 46 }
};

const STORAGE_KEY = 'ashvale_controls_layout_v1';

function getContainer() { return document.getElementById('game-container'); }

function computeDefaultPx(id, w, h) {
    const d = DEFAULT_LAYOUT[id];
    let left, top;
    switch (d.anchor) {
        case 'bottom-left':  left = d.offsetX;              top = h - d.offsetY - d.size; break;
        case 'bottom-right': left = w - d.offsetX - d.size; top = h - d.offsetY - d.size; break;
        case 'top-right':    left = w - d.offsetX - d.size; top = d.offsetY;              break;
        default:              left = d.offsetX;              top = d.offsetY;              break; // top-left
    }
    return { left, top, size: d.size };
}

export function loadSavedLayout() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (err) { return null; }
}

export function saveLayoutToStorage(layoutPct) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutPct)); }
    catch (err) { console.warn('No se pudo guardar el layout de controles:', err); }
}

export function clearSavedLayout() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* noop */ }
}

// Layout efectivo actual (guardado, con fallback a valores por defecto),
// en px absolutos dentro de #game-container.
export function computeEffectiveLayoutPx() {
    const container = getContainer();
    const w = container.clientWidth || 960, h = container.clientHeight || 540;
    const saved = loadSavedLayout() || {};
    const result = {};
    CONTROL_IDS.forEach(id => {
        if (saved[id]) {
            const s = saved[id];
            const limits = SIZE_LIMITS[CONTROL_TYPES[id]];
            result[id] = {
                left: (s.leftPct / 100) * w,
                top: (s.topPct / 100) * h,
                size: Math.max(limits.min, Math.min(limits.max, (s.sizePct / 100) * w))
            };
        } else {
            result[id] = computeDefaultPx(id, w, h);
        }
    });
    return result;
}

function applyLayoutToDOM(layoutById) {
    CONTROL_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const l = layoutById[id];
        el.style.position = 'absolute';
        el.style.left = `${l.left}px`;
        el.style.top = `${l.top}px`;
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.width = `${l.size}px`;
        el.style.height = `${l.size}px`;
    });
    // El "stick" interior del joystick se escala junto con su base.
    const stick = document.getElementById('left-joy-stick');
    if (stick && layoutById['left-joy-base']) {
        const s = layoutById['left-joy-base'].size * 0.4;
        stick.style.width = `${s}px`;
        stick.style.height = `${s}px`;
    }
}

// Aplica el layout persistido (guardado o por defecto). Es lo que se usa
// siempre en juego normal — la edición en vivo la gestiona controlsEditor.js.
export function applyControlsLayout() {
    const container = getContainer();
    if (!container || container.clientWidth === 0) return; // aún no visible, nada que medir
    applyLayoutToDOM(computeEffectiveLayoutPx());
}

// Usado por controlsEditor.js para pintar en vivo mientras el jugador arrastra.
export function applyLiveLayoutPx(layoutById) {
    applyLayoutToDOM(layoutById);
}

// Convierte un layout en px (el que arma controlsEditor.js mientras se
// arrastra) a % del contenedor y lo persiste en localStorage.
export function persistLayoutPx(layoutById) {
    const container = getContainer();
    const w = container.clientWidth || 960, h = container.clientHeight || 540;
    const pct = {};
    CONTROL_IDS.forEach(id => {
        const l = layoutById[id];
        pct[id] = { leftPct: (l.left / w) * 100, topPct: (l.top / h) * 100, sizePct: (l.size / w) * 100 };
    });
    saveLayoutToStorage(pct);
}

export function resetControlsLayout() {
    clearSavedLayout();
    applyControlsLayout();
}

// Reaplica el layout guardado si cambia el tamaño de ventana/orientación,
// salvo que el editor esté abierto (éste gestiona su propio redibujado).
window.addEventListener('resize', () => { if (!state.controlsEditMode) applyControlsLayout(); });
