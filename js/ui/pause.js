/* =====================================================================
   MENÚ DE PAUSA (accesible con [P] / [Esc], Options/Start, o botón ⏸ táctil)
   ===================================================================== */
import { state } from '../state.js';
import { saveGameState } from '../systems/saveLoad.js';
import { closeAllModals, showScreen, refreshMenuState } from './menu.js';
import { openControlsEditor } from './controlsEditor.js';

export function togglePause(forceState) {
    if (!state.gameStarted) return;
    state.gamePaused = (typeof forceState === 'boolean') ? forceState : !state.gamePaused;
    document.getElementById('pause-overlay').style.display = state.gamePaused ? 'flex' : 'none';
}

// Muestra/oculta los controles táctiles virtuales. La visibilidad real
// depende de DOS condiciones combinadas:
//   1) Modo Móvil debe estar activo (clase "mobile-mode-active" en <body>,
//      la alterna ScreenManager._refreshMobileOnlyUI() — así en PC no hay
//      ni rastro de controles táctiles, sin importar esta preferencia).
//   2) La preferencia del jugador (state.touchControlsEnabled), que se
//      alterna con el botón de este menú — útil en Modo Móvil si se
//      conecta un mando y ya no hacen falta los botones.
// El botón de pausa táctil (#touch-pause-btn) es la excepción: se gestiona
// puramente por CSS y permanece visible en todo Modo Móvil sin importar
// el toggle de arriba, para poder revertirlo si hace falta (punto 6).
export function applyTouchControlsVisibility() {
    const mobileModeActive = document.body.classList.contains('mobile-mode-active');
    const showTouch = mobileModeActive && state.touchControlsEnabled;
    document.getElementById('touch-controls').style.display = showTouch ? 'block' : 'none';
    document.getElementById('interaction-prompt').classList.toggle('tappable', showTouch);
    const btn = document.getElementById('btn-toggle-touch-controls');
    btn.innerText = `Controles Táctiles: ${state.touchControlsEnabled ? 'Activados' : 'Desactivados'}`;
}
applyTouchControlsVisibility();

document.getElementById('btn-resume').addEventListener('click', () => togglePause(false));
document.getElementById('btn-toggle-touch-controls').addEventListener('click', () => {
    state.touchControlsEnabled = !state.touchControlsEnabled;
    applyTouchControlsVisibility();
});

// Botón exclusivo de Modo Móvil (punto 2): abre el editor de posición/tamaño
// de los controles táctiles sin salir de la partida en curso.
const btnCustomizeControlsPause = document.getElementById('btn-customize-controls-pause');
if (btnCustomizeControlsPause) {
    btnCustomizeControlsPause.addEventListener('click', () => openControlsEditor(true));
}

document.getElementById('btn-pause-exit').addEventListener('click', () => {
    togglePause(false);
    if (state.gameStarted) saveGameState();
    state.gameStarted = false;
    closeAllModals();
    document.getElementById('game-container').style.display = 'none';
    showScreen('main-menu-screen');
    refreshMenuState();
});
