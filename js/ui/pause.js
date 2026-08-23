/* =====================================================================
   MENÚ DE PAUSA (accesible con [P] / [Esc], Options/Start, o botón ⏸ táctil)
   ===================================================================== */
import { state } from '../state.js';
import { saveGameState } from '../systems/saveLoad.js';
import { closeAllModals, showScreen, refreshMenuState } from './menu.js';

export function togglePause(forceState) {
    if (!state.gameStarted) return;
    state.gamePaused = (typeof forceState === 'boolean') ? forceState : !state.gamePaused;
    document.getElementById('pause-overlay').style.display = state.gamePaused ? 'flex' : 'none';
}

// Muestra/oculta los controles táctiles virtuales según state.touchControlsEnabled
// y refleja el estado actual en el texto del botón de pausa. También habilita/
// deshabilita que el letrero de interacción (#interaction-prompt) se pueda
// tocar directamente, ya que reemplaza al antiguo botón redondo de "E".
export function applyTouchControlsVisibility() {
    document.getElementById('touch-controls').style.display = state.touchControlsEnabled ? 'block' : 'none';
    document.getElementById('interaction-prompt').classList.toggle('tappable', state.touchControlsEnabled);
    const btn = document.getElementById('btn-toggle-touch-controls');
    btn.innerText = `Controles Táctiles: ${state.touchControlsEnabled ? 'Activados' : 'Desactivados'}`;
}
applyTouchControlsVisibility();

document.getElementById('btn-resume').addEventListener('click', () => togglePause(false));
document.getElementById('btn-toggle-touch-controls').addEventListener('click', () => {
    state.touchControlsEnabled = !state.touchControlsEnabled;
    applyTouchControlsVisibility();
});
document.getElementById('btn-pause-exit').addEventListener('click', () => {
    togglePause(false);
    if (state.gameStarted) saveGameState();
    state.gameStarted = false;
    closeAllModals();
    document.getElementById('game-container').style.display = 'none';
    showScreen('main-menu-screen');
    refreshMenuState();
});
