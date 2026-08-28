/* =====================================================================
   11/12. MENÚ PRINCIPAL / CONFIGURACIÓN / ESTADO DE MODALES
   ===================================================================== */
import { state } from '../state.js';
import { ScreenManager } from '../core/screenManager.js';
import { SAVE_KEY } from '../systems/saveLoad.js';
import { openControlsEditor } from './controlsEditor.js';
import { applyControlsLayout } from '../systems/controlsLayout.js';

export function anyModalOpen() {
    return document.getElementById('inventory-panel').style.display === 'block'
        || document.getElementById('chest-panel').style.display === 'block'
        || document.getElementById('craft-panel').style.display === 'block'
        || document.getElementById('skill-tree-panel').style.display === 'block'
        || document.getElementById('quest-panel').style.display === 'block'
        || document.getElementById('quest-offer-panel').style.display === 'block';
}

export function closeAllModals() {
    document.getElementById('inventory-panel').style.display = 'none';
    document.getElementById('chest-panel').style.display = 'none';
    document.getElementById('craft-panel').style.display = 'none';
    document.getElementById('skill-tree-panel').style.display = 'none';
    document.getElementById('quest-panel').style.display = 'none';
    document.getElementById('quest-offer-panel').style.display = 'none';
}

export function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (id) document.getElementById(id).classList.add('active');
}

export function startGame() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('game-container').style.display = 'block';
    state.gameStarted = true;
    ScreenManager.resizeCanvas();
    applyControlsLayout(); // recién ahora #game-container es visible y se puede medir
}

export function refreshMenuState() {
    let hasSave = false;
    try { hasSave = !!localStorage.getItem(SAVE_KEY); } catch (err) { hasSave = false; }
    const btn = document.getElementById('btn-load-game');
    btn.disabled = !hasSave;
}
refreshMenuState();

// "Iniciar Partida" y "Cargar Partida" todavía no están implementados: el juego real irá aquí.
document.getElementById('btn-new-game').addEventListener('click', () => { showScreen('coming-soon-screen'); });
document.getElementById('btn-load-game').addEventListener('click', () => { showScreen('coming-soon-screen'); });
document.getElementById('btn-coming-soon-back').addEventListener('click', () => { showScreen('main-menu-screen'); refreshMenuState(); });

// "Tutorial" da acceso al contenido de gameplay en desarrollo (sandbox de pruebas).
document.getElementById('btn-tutorial').addEventListener('click', () => { startGame(); });

document.getElementById('btn-settings').addEventListener('click', () => showScreen('settings-screen'));
document.getElementById('btn-settings-back').addEventListener('click', () => { showScreen('main-menu-screen'); refreshMenuState(); });

// Asegura respuesta táctil inmediata al tocar cualquier botón de las pantallas de menú
document.querySelectorAll('.screen button, .pause-buttons button').forEach(btn => {
    btn.addEventListener('touchend', e => { e.preventDefault(); btn.click(); }, { passive: false });
});

document.getElementById('resolution-select').addEventListener('change', e => {
    const [w, h] = e.target.value.split('x').map(Number);
    ScreenManager.virtualWidth = w; ScreenManager.virtualHeight = h;
    ScreenManager.resizeCanvas();
});
document.getElementById('aspect-ratio-check').addEventListener('change', e => {
    ScreenManager.maintainAspectRatio = e.target.checked;
    ScreenManager.resizeCanvas();
});
document.getElementById('btn-toggle-fullscreen').addEventListener('click', function () {
    ScreenManager.toggleMobileMode(this);
});

// Botón exclusivo de Modo Móvil (punto 2): editor de posición/tamaño de controles.
const btnCustomizeControls = document.getElementById('btn-customize-controls');
if (btnCustomizeControls) {
    btnCustomizeControls.addEventListener('click', () => openControlsEditor(false));
}
