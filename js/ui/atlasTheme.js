/* =====================================================================
   TEMA DE INTERFAZ DESDE ATLAS
   El atlas `ui.json/ui.png` puede pintar fondos sin convertir cada control
   en un archivo separado. Los colores CSS existentes son el fallback.
   ===================================================================== */
import { applyAtlasFrameToElement, onAtlasReady } from '../core/atlas.js';

const UI_FRAME_SELECTORS = {
    main_menu_bg: ['#main-menu-screen', '#settings-screen', '#coming-soon-screen', '#pause-overlay'],
    panel: ['.modal-panel', '#ui-overlay', '#debug-panel', '#controls-editor-toolbar'],
    dialog: ['#dialog-box', '#interaction-prompt'],
    button: ['.menu-buttons button', '.settings-row button', '.pause-buttons button', '#craft-action-btn', '.item-action-btn'],
    slot: ['.inv-slot', '.equip-slot', '.craft-slot', '.qb-slot'],
    skill_node: ['.skill-node', '.skill-tree-buttons button'],
    touch_button: ['.t-btn']
};

function applyUiAtlas() {
    for (const [frame, selectors] of Object.entries(UI_FRAME_SELECTORS)) {
        document.querySelectorAll(selectors.join(',')).forEach(element => applyAtlasFrameToElement(element, 'ui', frame));
    }
}

onAtlasReady(id => {
    if (id === 'ui') applyUiAtlas();
});
