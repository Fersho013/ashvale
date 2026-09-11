/* =====================================================================
   UI DE STATS — Menú de asignación de puntos de stat
   ===================================================================== */
import { Stats, STAT_IDS, STAT_LABELS, STAT_DESCRIPTIONS } from '../systems/stats.js';
import { LevelSystem } from '../systems/level.js';
import { game } from '../core/gameContext.js';

function panel() { return document.getElementById('stats-panel'); }

export function openStatsPanel() {
    const p = panel();
    if (!p) return;
    p.style.display = 'block';
    document.body.classList.add('hud-hidden');
    renderStatsPanel();
}

export function closeStatsPanel() {
    const p = panel();
    if (!p) return;
    p.style.display = 'none';
    document.body.classList.remove('hud-hidden');
}

export function toggleStatsPanel(forceOpen) {
    const p = panel();
    if (!p) return;
    const isOpen = p.style.display === 'block';
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !isOpen;
    if (shouldOpen) openStatsPanel();
    else closeStatsPanel();
}

function renderStatsPanel() {
    const body = document.getElementById('stats-content');
    const availableEl = document.getElementById('stats-available');
    if (!body || !availableEl) return;
    availableEl.innerText = `${Stats.available} PS · Nv ${LevelSystem.level} · ${LevelSystem.skillPoints} PH`;
    body.innerHTML = '';
    for (const id of STAT_IDS) {
        const row = document.createElement('div');
        row.className = 'stats-row';
        const val = Stats.get(id);
        row.innerHTML = `
            <div class="stats-info">
                <strong>${STAT_LABELS[id]}</strong>
                <small>${STAT_DESCRIPTIONS[id]}</small>
                <span class="stats-value">Nivel: ${val}</span>
            </div>
            <button type="button" data-stat="${id}" class="stats-plus" ${Stats.available <= 0 ? 'disabled' : ''}>+1</button>
        `;
        body.appendChild(row);
    }
    body.querySelectorAll('.stats-plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const stat = btn.dataset.stat;
            if (Stats.allocate(stat)) {
                // Si es vitalidad, ajustar HP máximo y curar proporcionalmente
                const player = game.player;
                if (player && stat === 'vitalidad') {
                    // HP se recalcula via getter, pero si estaba lleno, mantener lleno
                    // No hace falta ajustar hp directamente, maxHp ya subió
                }
                renderStatsPanel();
            }
        });
    });
}

// Actualizar panel si está abierto al ganar puntos
window.addEventListener('stats-updated', () => {
    const p = panel();
    if (p && p.style.display === 'block') renderStatsPanel();
});
window.addEventListener('level-updated', () => {
    const p = panel();
    if (p && p.style.display === 'block') renderStatsPanel();
});

function bindStatsClose() {
    const btn = document.querySelector('#stats-panel .close-modal');
    if (btn) btn.addEventListener('click', closeStatsPanel);
}
bindStatsClose();
if (!document.querySelector('#stats-panel .close-modal')) {
    document.addEventListener('DOMContentLoaded', bindStatsClose);
}
