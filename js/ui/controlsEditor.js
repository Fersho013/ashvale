/* =====================================================================
   EDITOR DE POSICIÓN/TAMAÑO DE CONTROLES TÁCTILES (punto 2)
   Se abre desde el botón "Personalizar Controles" del menú de Pausa o
   "Personalizar Controles Táctiles" en Configuración (ambos exclusivos
   de Modo Móvil — ver ScreenManager._refreshMobileOnlyUI() en
   js/core/screenManager.js). Permite arrastrar cada control para
   reposicionarlo y usar su manija ⤡ para redimensionarlo. "Guardar"
   persiste el layout en localStorage (ver js/systems/controlsLayout.js)
   para no tener que repetir la configuración cada vez.
   ===================================================================== */
import { state } from '../state.js';
import {
    CONTROL_IDS, CONTROL_TYPES, SIZE_LIMITS,
    applyControlsLayout, applyLiveLayoutPx, computeEffectiveLayoutPx,
    persistLayoutPx, resetControlsLayout
} from '../systems/controlsLayout.js';
import { applyTouchControlsVisibility } from './pause.js';

let overlayEl = null;
let handlesEl = null;
let liveLayout = null;
let cameFromPause = false;
let forcedGameContainer = false;
let activeDrag = null;
let toolbarDrag = null;
let msgTimeout = null;

function getContainer() { return document.getElementById('game-container'); }

export function openControlsEditor(fromPause) {
    if (state.controlsEditMode) return;
    cameFromPause = !!fromPause;
    state.controlsEditMode = true;
    document.body.classList.add('controls-editing');

    const container = getContainer();
    forcedGameContainer = container.style.display !== 'block';
    if (forcedGameContainer) container.style.display = 'block'; // vista previa si el juego no ha iniciado
    if (cameFromPause) document.getElementById('pause-overlay').style.display = 'none';

    // Mientras se edita, los controles táctiles se ven siempre, sin importar
    // el toggle de "Controles Táctiles" del menú de Pausa.
    document.getElementById('touch-controls').style.display = 'block';
    document.getElementById('touch-pause-btn').style.display = 'flex';

    applyControlsLayout();
    liveLayout = computeEffectiveLayoutPx();
    applyLiveLayoutPx(liveLayout);

    buildOverlay();
    attachDragHandlers();
}

export function closeControlsEditor() {
    if (!state.controlsEditMode) return;
    state.controlsEditMode = false;
    document.body.classList.remove('controls-editing');
    detachDragHandlers();

    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    if (handlesEl) { handlesEl.remove(); handlesEl = null; }

    // Reaplica el layout persistido: descarta cualquier cambio en curso que
    // el jugador no haya confirmado con "Guardar".
    applyControlsLayout();
    applyTouchControlsVisibility();

    if (forcedGameContainer) getContainer().style.display = 'none';
    if (cameFromPause) document.getElementById('pause-overlay').style.display = 'flex';

    activeDrag = null;
    toolbarDrag = null;
}

function flashToolbarMsg(text) {
    const el = document.getElementById('ce-toolbar-msg');
    if (!el) return;
    el.innerText = text;
    clearTimeout(msgTimeout);
    msgTimeout = setTimeout(() => { el.innerText = ''; }, 2500);
}

function buildOverlay() {
    const previewNote = !state.gameStarted ? ' (vista previa: el juego no ha iniciado)' : '';

    overlayEl = document.createElement('div');
    overlayEl.id = 'controls-editor-toolbar';
    overlayEl.innerHTML = `
        <div id="ce-toolbar-drag-handle" title="Arrastra esta franja para mover el panel">
            <span aria-hidden="true">⠿</span><span>Mover panel</span><span aria-hidden="true">↕</span>
        </div>
        <p>Arrastra un control o bloque del HUD para moverlo. Usa el círculo ⤡ para cambiar su tamaño.${previewNote}</p>
        <div class="controls-editor-buttons">
            <button id="ce-save" type="button">Guardar</button>
            <button id="ce-reset" type="button">Restablecer</button>
            <button id="ce-close" type="button">Cerrar</button>
        </div>
        <div id="ce-toolbar-msg"></div>
    `;
    document.body.appendChild(overlayEl);
    document.getElementById('ce-toolbar-drag-handle').addEventListener('pointerdown', onToolbarPointerDown);

    handlesEl = document.createElement('div');
    handlesEl.id = 'controls-editor-handles';
    getContainer().appendChild(handlesEl);
    CONTROL_IDS.forEach(id => {
        const handle = document.createElement('div');
        handle.className = 'ce-resize-handle';
        handle.dataset.target = id;
        handlesEl.appendChild(handle);
    });

    document.getElementById('ce-save').addEventListener('click', () => {
        persistLayoutPx(liveLayout);
        flashToolbarMsg('✅ Layout guardado.');
    });
    document.getElementById('ce-reset').addEventListener('click', () => {
        resetControlsLayout();
        liveLayout = computeEffectiveLayoutPx();
        applyLiveLayoutPx(liveLayout);
        positionResizeHandles();
        flashToolbarMsg('↺ Restablecido a los valores por defecto.');
    });
    document.getElementById('ce-close').addEventListener('click', closeControlsEditor);

    // Respuesta táctil inmediata para los botones del propio editor
    overlayEl.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('touchend', e => { e.preventDefault(); btn.click(); }, { passive: false });
    });

    positionResizeHandles();
}

function positionResizeHandles() {
    if (!handlesEl) return;
    handlesEl.querySelectorAll('.ce-resize-handle').forEach(h => {
        const l = liveLayout[h.dataset.target];
        h.style.left = `${l.left + l.width - 11}px`;
        h.style.top = `${l.top + l.height - 11}px`;
    });
}

function attachDragHandlers() {
    CONTROL_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('pointerdown', onControlPointerDown);
    });
    handlesEl.querySelectorAll('.ce-resize-handle').forEach(h => h.addEventListener('pointerdown', onHandlePointerDown));
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
}

function detachDragHandlers() {
    CONTROL_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.removeEventListener('pointerdown', onControlPointerDown);
    });
    if (handlesEl) handlesEl.querySelectorAll('.ce-resize-handle').forEach(h => h.removeEventListener('pointerdown', onHandlePointerDown));
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
}

function onControlPointerDown(e) {
    e.preventDefault();
    const id = e.currentTarget.id;
    activeDrag = {
        id, mode: 'move', pointerId: e.pointerId,
        startClientX: e.clientX, startClientY: e.clientY,
        startLeft: liveLayout[id].left, startTop: liveLayout[id].top
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
}

function onToolbarPointerDown(e) {
    e.preventDefault();
    const rect = overlayEl.getBoundingClientRect();
    toolbarDrag = {
        pointerId: e.pointerId,
        startClientX: e.clientX, startClientY: e.clientY,
        startLeft: rect.left, startTop: rect.top
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
}

function onHandlePointerDown(e) {
    e.preventDefault();
    e.stopPropagation();
    const id = e.currentTarget.dataset.target;
    activeDrag = {
        id, mode: 'resize', pointerId: e.pointerId,
        startClientX: e.clientX, startClientY: e.clientY,
        startWidth: liveLayout[id].width, startHeight: liveLayout[id].height
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
}

function onPointerMove(e) {
    if (toolbarDrag && e.pointerId === toolbarDrag.pointerId) {
        const maxLeft = Math.max(0, window.innerWidth - overlayEl.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - overlayEl.offsetHeight);
        overlayEl.style.left = `${Math.max(0, Math.min(maxLeft, toolbarDrag.startLeft + e.clientX - toolbarDrag.startClientX))}px`;
        overlayEl.style.top = `${Math.max(0, Math.min(maxTop, toolbarDrag.startTop + e.clientY - toolbarDrag.startClientY))}px`;
        return;
    }
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
    const dx = e.clientX - activeDrag.startClientX;
    const dy = e.clientY - activeDrag.startClientY;
    const container = getContainer();
    const w = container.clientWidth, h = container.clientHeight;
    const l = liveLayout[activeDrag.id];

    if (activeDrag.mode === 'move') {
        l.left = Math.max(0, Math.min(w - l.width, activeDrag.startLeft + dx));
        l.top = Math.max(0, Math.min(h - l.height, activeDrag.startTop + dy));
    } else {
        const limits = SIZE_LIMITS[CONTROL_TYPES[activeDrag.id]];
        if (limits.min) {
            let newSize = activeDrag.startWidth + Math.max(dx, dy);
            newSize = Math.max(limits.min, Math.min(limits.max, newSize));
            newSize = Math.min(newSize, w - l.left, h - l.top);
            l.width = newSize; l.height = newSize;
        } else {
            l.width = Math.max(limits.minW, Math.min(limits.maxW, activeDrag.startWidth + dx, w - l.left));
            l.height = Math.max(limits.minH, Math.min(limits.maxH, activeDrag.startHeight + dy, h - l.top));
        }
    }
    applyLiveLayoutPx(liveLayout);
    positionResizeHandles();
}

function onPointerUp(e) {
    if (toolbarDrag && e.pointerId === toolbarDrag.pointerId) {
        toolbarDrag = null;
        return;
    }
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
    activeDrag = null;
}
