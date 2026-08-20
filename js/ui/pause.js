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

document.getElementById('btn-resume').addEventListener('click', () => togglePause(false));
document.getElementById('btn-pause-exit').addEventListener('click', () => {
    togglePause(false);
    if (state.gameStarted) saveGameState();
    state.gameStarted = false;
    closeAllModals();
    document.getElementById('game-container').style.display = 'none';
    showScreen('main-menu-screen');
    refreshMenuState();
});
