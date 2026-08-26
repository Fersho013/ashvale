/* =====================================================================
   ÁRBOL DE HABILIDADES — Apertura y cierre del menú de ramas.
   Las ramas ya tienen sus botones; la asignación de habilidades llegará
   después sin modificar los controles de teclado, mando o táctiles.
   ===================================================================== */
import { state } from '../state.js';

export function toggleSkillTree(forceOpen) {
    if (!state.gameStarted || state.gamePaused) return;
    const panel = document.getElementById('skill-tree-panel');
    const isOpen = panel.style.display === 'block';
    panel.style.display = typeof forceOpen === 'boolean'
        ? (forceOpen ? 'block' : 'none')
        : (isOpen ? 'none' : 'block');
}

// Los botones representan las seis ramas por ahora; se mantienen activos
// visualmente, pero no cambian progreso ni equipamiento en esta primera fase.
document.querySelectorAll('#skill-tree-panel [data-skill-branch]').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('#skill-tree-panel [data-skill-branch]').forEach(item => item.classList.remove('selected'));
        button.classList.add('selected');
        const intro = document.querySelector('#skill-tree-panel .skill-tree-intro');
        intro.innerText = button.dataset.skillBranch === 'swordsman'
            ? 'Espadachín activo: [Q] Estocada Veloz (1 barra) y [R] Filo Tormentoso (3 barras). Equipa una espada para usarlas.'
            : 'Esta rama estará disponible próximamente.';
    });
});
