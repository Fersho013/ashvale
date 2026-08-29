/* =====================================================================
   HUD VISIBILITY — Punto 1: ocultar HUD mientras hay menús inmersivos
   Cubre: inventario, todos los cofres, hoguera/máquina de pociones/mesa
   constructora (craft-panel), árbol de habilidades y menú de misiones.
   Usa MutationObserver sobre el atributo style para reaccionar a cualquier
   apertura/cierre sin tener que parchear cada toggle individualmente.
   ===================================================================== */

const IMMERSIVE_PANELS = [
    'inventory-panel',
    'chest-panel',
    'craft-panel',
    'skill-tree-panel',
    'quest-panel',
    'quest-offer-panel',
    'guide-panel'
];

export function syncHudVisibility() {
    const shouldHide = IMMERSIVE_PANELS.some(id => {
        const el = document.getElementById(id);
        return el && el.style.display === 'block';
    });
    document.body.classList.toggle('hud-hidden', shouldHide);
}

export function initHudVisibility() {
    syncHudVisibility();
    const observer = new MutationObserver(syncHudVisibility);
    IMMERSIVE_PANELS.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el, { attributes: true, attributeFilter: ['style'] });
    });
}
