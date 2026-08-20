/* =====================================================================
   Botón dinámico de interacción táctil
   Posiciona el botón táctil contextual justo encima del objetivo
   (NPC/objeto) detectado.
   ===================================================================== */
import { state } from '../state.js';
import { game } from '../core/gameContext.js';

const touchInteractBtn = document.getElementById('touch-interact-dynamic');

export function positionTouchInteractButton(target) {
    if (!state.isTouchDevice || !target) { touchInteractBtn.style.display = 'none'; return; }
    const canvas = game.canvas;
    const camera = game.camera;
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    const offsetX = canvasRect.left - containerRect.left;
    const offsetY = canvasRect.top - containerRect.top;
    const worldCX = target.x + target.w / 2;
    const worldTopY = target.y;
    const screenX = offsetX + (worldCX - camera.x) * scaleX;
    const screenY = offsetY + (worldTopY - camera.y) * scaleY - 30;
    touchInteractBtn.style.left = `${screenX}px`;
    touchInteractBtn.style.top = `${screenY}px`;
    touchInteractBtn.style.display = 'flex';
}
