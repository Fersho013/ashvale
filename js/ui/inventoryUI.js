/* =====================================================================
   10. LÓGICA DRAG & DROP COFRE Y INTERFAZ DE USUARIO (UI) — Inventario
   ===================================================================== */
import { Inventory, tryConsumeItem } from '../systems/inventory.js';
import { WEAPONS } from '../data/weapons.js';

let draggedSlotInfo = null;

export function handleDragStart(e, source, index) {
    draggedSlotInfo = { source, index };
    e.dataTransfer.setData('text/plain', JSON.stringify(draggedSlotInfo));
    e.target.classList.add('dragging');
}

export function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedSlotInfo = null;
}

export function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

export function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

export function handleDrop(e, targetSource, targetIndex) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    if (!draggedSlotInfo) return;

    const fromArr = draggedSlotInfo.source === 'chest' ? Inventory.chest : Inventory.global;
    const toArr = targetSource === 'chest' ? Inventory.chest : Inventory.global;
    const fromIdx = draggedSlotInfo.index;
    const toIdx = targetIndex;

    const sourceItem = fromArr[fromIdx];
    if (!sourceItem) return;

    if (draggedSlotInfo.source === targetSource) {
        // Intercambiar dentro del mismo contenedor
        const temp = fromArr[fromIdx];
        fromArr[fromIdx] = fromArr[toIdx];
        fromArr[toIdx] = temp;
    } else {
        // Mover/apilar entre Cofre e Inventario
        const targetItem = toArr[toIdx];
        if (!targetItem) {
            toArr[toIdx] = sourceItem;
            fromArr[fromIdx] = null;
        } else if (targetItem.name === sourceItem.name && targetItem.qty < 64) {
            const space = 64 - targetItem.qty;
            const transfer = Math.min(space, sourceItem.qty);
            targetItem.qty += transfer;
            sourceItem.qty -= transfer;
            if (sourceItem.qty <= 0) fromArr[fromIdx] = null;
        } else {
            // Intercambiar ítems distintos entre cofre e inventario
            toArr[toIdx] = sourceItem;
            fromArr[fromIdx] = targetItem;
        }
    }
    refreshChestUI();
    refreshInventoryUI();
}

export function refreshInventoryUI() {
    const grid = document.getElementById('inv-grid');
    grid.innerHTML = '';
    Inventory.global.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'inv-slot';
        if (item) {
            div.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
            div.onclick = () => tryConsumeItem(Inventory.global, i);
        }
        grid.appendChild(div);
    });

    const eqWeapon = document.getElementById('eq-weapon');
    const w = Inventory.equipment.weapon ? WEAPONS[Inventory.equipment.weapon] : WEAPONS.desarmado;
    eqWeapon.innerHTML = `<strong>Arma</strong><br>${w.name}`;
    eqWeapon.onclick = () => Inventory.unequipWeapon();

    document.getElementById('eq-armor').innerText = 'Armadura\n' + (Inventory.equipment.armor || 'Ninguna');
    document.getElementById('eq-accessory').innerText = 'Amuleto\n' + (Inventory.equipment.accessory || 'Ninguno');
}

export function refreshChestUI() {
    const chestGrid = document.getElementById('chest-grid');
    chestGrid.innerHTML = '';
    Inventory.chest.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'inv-slot';
        if (item) {
            div.draggable = true;
            div.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
            div.ondragstart = (e) => handleDragStart(e, 'chest', i);
            div.ondragend = handleDragEnd;
            // Click derecho: mover el stack completo al inventario al instante
            div.oncontextmenu = (e) => { e.preventDefault(); Inventory.quickMoveToPlayer(i); refreshChestUI(); };
        }
        div.ondragover = handleDragOver;
        div.ondragleave = handleDragLeave;
        div.ondrop = (e) => handleDrop(e, 'chest', i);
        chestGrid.appendChild(div);
    });

    const playerGrid = document.getElementById('chest-player-grid');
    playerGrid.innerHTML = '';
    Inventory.global.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'inv-slot';
        if (item) {
            div.draggable = true;
            div.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
            div.ondragstart = (e) => handleDragStart(e, 'player', i);
            div.ondragend = handleDragEnd;
            // Click derecho: mover el stack completo al cofre al instante
            div.oncontextmenu = (e) => { e.preventDefault(); Inventory.quickMoveToChest(i); refreshChestUI(); };
        }
        div.ondragover = handleDragOver;
        div.ondragleave = handleDragLeave;
        div.ondrop = (e) => handleDrop(e, 'player', i);
        playerGrid.appendChild(div);
    });
}

export function toggleInventory() {
    const panel = document.getElementById('inventory-panel');
    const open = panel.style.display === 'block';
    panel.style.display = open ? 'none' : 'block';
    if (!open) refreshInventoryUI();
}
