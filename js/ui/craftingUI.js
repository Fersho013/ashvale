/* =====================================================================
   10. CRAFTING PANEL (Hoguera / Máquina de Pociones)
   ===================================================================== */
import { Inventory, addStackToArray } from '../systems/inventory.js';
import { COOK_RECIPES, ALCHEMY_RECIPES } from '../data/recipes.js';
import { openItemActionMenu } from './itemActionMenu.js';

let craftContext = null;

export function openCraftPanel(type) {
    craftContext = { type, slots: [null, null, null] };
    document.getElementById('craft-title').innerText = type === 'cook' ? 'Hoguera — Cocinar' : 'Máquina de Pociones — Preparar';
    document.getElementById('craft-action-btn').innerText = type === 'cook' ? 'Cocinar' : 'Preparar';
    document.getElementById('craft-msg').innerText = '';
    renderCraftSlots(); renderCraftInvGrid();
    document.getElementById('craft-panel').style.display = 'block';
}

export function renderCraftSlots() {
    document.querySelectorAll('.craft-slot').forEach((el, i) => {
        const item = craftContext.slots[i];
        el.innerText = item ? item.name : '(vacío)';
        el.onclick = () => {
            if (item) { addStackToArray(Inventory.global, item.name, 1, 100); craftContext.slots[i] = null; renderCraftSlots(); renderCraftInvGrid(); }
        };
    });
}

export function renderCraftInvGrid() {
    const grid = document.getElementById('craft-inv-grid');
    grid.innerHTML = '';
    Inventory.global.forEach((item, i) => {
        const div = document.createElement('div'); div.className = 'inv-slot';
        if (item) {
            div.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
            div.onclick = () => {
                const current = Inventory.global[i];
                if (!current) return;
                openItemActionMenu(div, [
                    {
                        label: 'Agregar a Ingredientes',
                        onClick: () => {
                            const emptyIdx = craftContext.slots.findIndex(s => !s);
                            if (emptyIdx === -1) return;
                            craftContext.slots[emptyIdx] = { name: current.name };
                            current.qty--; if (current.qty <= 0) Inventory.global[i] = null;
                            renderCraftSlots(); renderCraftInvGrid();
                        }
                    }
                ]);
            };
        }
        grid.appendChild(div);
    });
}

document.getElementById('craft-action-btn').addEventListener('click', () => {
    const names = craftContext.slots.filter(Boolean).map(s => s.name).sort();
    if (names.length === 0) { document.getElementById('craft-msg').innerText = 'Coloca al menos un ingrediente.'; return; }
    const table = craftContext.type === 'cook' ? COOK_RECIPES : ALCHEMY_RECIPES;
    let resultName = null;
    if (names.length === 1 && table[names[0]]) resultName = table[names[0]];
    else if (table[names.join('+')]) resultName = table[names.join('+')];

    if (resultName) {
        addStackToArray(Inventory.global, resultName, 1, 100);
        document.getElementById('craft-msg').innerText = 'Resultado: ' + resultName;
    } else {
        craftContext.slots.forEach(s => { if (s) addStackToArray(Inventory.global, s.name, 1, 100); });
        document.getElementById('craft-msg').innerText = 'No hay receta con esos ingredientes. Ingredientes devueltos.';
    }
    craftContext.slots = [null, null, null];
    renderCraftSlots(); renderCraftInvGrid();
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => { document.getElementById(btn.dataset.close).style.display = 'none'; });
});
