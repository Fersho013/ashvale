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

export const CONTROL_IDS = [
    'left-joy-base', 'btn-atk', 'btn-blk', 'btn-q', 'btn-r', 'btn-inv', 'btn-skills', 'touch-pause-btn',
    'ui-overlay', 'quickbar', 'buffs-panel'
];

export const CONTROL_TYPES = {
    'left-joy-base':   'joystick',
    'btn-atk':         'button',
    'btn-blk':         'button',
    'btn-q':           'button',
    'btn-r':           'button',
    'btn-inv':         'button',
    'btn-skills':      'button',
    'touch-pause-btn': 'button',
    'ui-overlay':      'hudPanel',
    'quickbar':        'hudBar',
    'buffs-panel':     'hudBuffs'
};

// Tamaño mínimo/máximo (px) permitido al redimensionar cada tipo de control.
export const SIZE_LIMITS = {
    joystick: { min: 70, max: 170 },
    button:   { min: 34, max: 88 },
    hudPanel: { minW: 160, maxW: 420, minH: 70, maxH: 260 },
    hudBar:   { minW: 180, maxW: 760, minH: 42, maxH: 130 },
    hudBuffs: { minW: 80, maxW: 360, minH: 42, maxH: 150 }
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
    'btn-inv':         { anchor: 'bottom-right', offsetX: 69,  offsetY: 15, size: 46 },
    'btn-skills':      { anchor: 'top-right',    offsetX: 15,  offsetY: 69, size: 46 },
    'ui-overlay':      { anchor: 'top-left',     offsetX: 10,  offsetY: 10, width: 230, height: 82 },
    'quickbar':        { anchor: 'bottom-center', offsetX: 0, offsetY: 10, width: 448, height: 50 },
    'buffs-panel':     { anchor: 'top-right',    offsetX: 10,  offsetY: 10, width: 156, height: 46 }
};

const STORAGE_KEY = 'ashvale_controls_layout_v1';

function getContainer() { return document.getElementById('game-container'); }

function computeDefaultPx(id, w, h) {
    const d = DEFAULT_LAYOUT[id];
    const width = d.width || d.size, height = d.height || d.size;
    let left, top;
    switch (d.anchor) {
        case 'bottom-left':  left = d.offsetX;              top = h - d.offsetY - height; break;
        case 'bottom-right': left = w - d.offsetX - width;  top = h - d.offsetY - height; break;
        case 'bottom-center': left = w / 2 - width / 2;     top = h - d.offsetY - height; break;
        case 'top-right':    left = w - d.offsetX - width;  top = d.offsetY;              break;
        default:              left = d.offsetX;              top = d.offsetY;              break; // top-left
    }
    return { left, top, width, height };
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
            // Las versiones actuales persisten widthPct/heightPct para todos
            // los controles. Se conserva sizePct solo como compatibilidad con
            // layouts antiguos; leer únicamente sizePct producía NaN tras
            // guardar y hacía que joystick y botones perdieran su tamaño.
            const oldSize = ((s.widthPct ?? s.sizePct) / 100) * w;
            result[id] = {
                left: (s.leftPct / 100) * w,
                top: (s.topPct / 100) * h,
                width: limits.min ? Math.max(limits.min, Math.min(limits.max, oldSize)) : Math.max(limits.minW, Math.min(limits.maxW, (s.widthPct ?? s.sizePct) / 100 * w)),
                height: limits.min ? Math.max(limits.min, Math.min(limits.max, oldSize)) : Math.max(limits.minH, Math.min(limits.maxH, (s.heightPct ?? s.sizePct) / 100 * h))
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
        el.style.width = `${l.width}px`;
        el.style.height = `${l.height}px`;
        if (CONTROL_TYPES[id].startsWith('hud')) {
            el.style.transform = 'none';
            const defaultHeight = DEFAULT_LAYOUT[id].height;
            el.style.setProperty('--hud-scale', String(l.height / defaultHeight));
        }
    });
    // El "stick" interior del joystick se escala junto con su base.
    const stick = document.getElementById('left-joy-stick');
    if (stick && layoutById['left-joy-base']) {
        const s = layoutById['left-joy-base'].width * 0.4;
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
        pct[id] = { leftPct: (l.left / w) * 100, topPct: (l.top / h) * 100, widthPct: (l.width / w) * 100, heightPct: (l.height / h) * 100 };
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
