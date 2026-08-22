/* =====================================================================
   10. INTERFAZ DE USUARIO (UI) — Inventario, Barra Rápida, Cofre y Drag & Drop
   Nota: el arrastre usa eventos de mouse propios (no el Drag & Drop
   nativo del navegador), porque ese API es poco confiable en PC —
   falla según navegador y no siempre dispara dragstart de forma
   consistente. Este sistema sigue el cursor con un "fantasma" y
   resuelve el destino con elementFromPoint al soltar.
   Fuentes válidas: 'global' (Inventario, 100 slots), 'quickbar'
   (Barra Rápida, 10 slots) y 'chest' (Cofre, 40 slots).
   ===================================================================== */
import { Inventory, tryConsumeItem } from '../systems/inventory.js';
import { WEAPONS } from '../data/weapons.js';

let dragState = null; // { source, index, ghostEl, sourceEl, startX, startY, moved }
const DRAG_THRESHOLD = 4; // px — por debajo de esto se considera un click, no un arrastre

function getArrayForSource(source) {
    if (source === 'chest') return Inventory.chest;
    if (source === 'quickbar') return Inventory.quickbar;
    return Inventory.global;
}

function makeGhost(item) {
    const ghost = document.createElement('div');
    ghost.className = 'inv-slot drag-ghost';
    ghost.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
    document.body.appendChild(ghost);
    return ghost;
}

function positionGhost(clientX, clientY) {
    if (!dragState) return;
    dragState.ghostEl.style.left = (clientX - 23) + 'px';
    dragState.ghostEl.style.top = (clientY - 23) + 'px';
}

function clearDragOverHighlight() {
    document.querySelectorAll('.inv-slot.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function slotUnderPoint(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    return el ? el.closest('[data-drop-source]') : null;
}

// Si el mouseup de un arrastre real cae sobre un slot, ese slot recibiría
// también un evento "click" justo después (mousedown y mouseup en el mismo
// elemento final). Lo interceptamos una sola vez para que no dispare
// tryConsumeItem/equipar por accidente al soltar.
function suppressNextClick(e) {
    e.stopPropagation();
    e.preventDefault();
    document.removeEventListener('click', suppressNextClick, true);
}

function onDragMove(e) {
    if (!dragState) return;
    if (!dragState.moved) {
        const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
        if (dist > DRAG_THRESHOLD) dragState.moved = true;
    }
    positionGhost(e.clientX, e.clientY);
    clearDragOverHighlight();
    const slot = slotUnderPoint(e.clientX, e.clientY);
    if (slot) slot.classList.add('drag-over');
}

function onDragEnd(e) {
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    if (!dragState) return;

    clearDragOverHighlight();
    dragState.sourceEl.classList.remove('dragging');
    dragState.ghostEl.remove();

    const slot = slotUnderPoint(e.clientX, e.clientY);
    if (slot && dragState.moved) {
        const targetSource = slot.dataset.dropSource;
        const targetIndex = parseInt(slot.dataset.dropIndex, 10);
        performMove(dragState.source, dragState.index, targetSource, targetIndex);
        document.addEventListener('click', suppressNextClick, true);
    }
    dragState = null;
}

function startDrag(e, source, index, item, sourceEl) {
    if (e.button !== 0) return; // solo click izquierdo arrastra
    e.preventDefault();
    sourceEl.classList.add('dragging');
    dragState = { source, index, ghostEl: makeGhost(item), sourceEl, startX: e.clientX, startY: e.clientY, moved: false };
    positionGhost(e.clientX, e.clientY);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
}

function performMove(fromSource, fromIndex, targetSource, targetIndex) {
    const fromArr = getArrayForSource(fromSource);
    const toArr = getArrayForSource(targetSource);
    const fromIdx = fromIndex, toIdx = targetIndex;

    const sourceItem = fromArr[fromIdx];
    if (!sourceItem) return;
    if (fromSource === targetSource && fromIdx === toIdx) return;

    if (fromSource === targetSource) {
        // Intercambiar dentro del mismo contenedor
        const temp = fromArr[fromIdx];
        fromArr[fromIdx] = fromArr[toIdx];
        fromArr[toIdx] = temp;
    } else {
        // Mover/apilar entre contenedores distintos (Inventario / Barra Rápida / Cofre)
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
            // Intercambiar ítems distintos entre ambos contenedores
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
        div.dataset.dropSource = 'global';
        div.dataset.dropIndex = i;
        if (item) {
            div.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
            div.addEventListener('mousedown', (e) => startDrag(e, 'global', i, item, div));
            div.onclick = () => tryConsumeItem(Inventory.global, i);
        }
        grid.appendChild(div);
    });

    const qbGrid = document.getElementById('quickbar-panel-grid');
    qbGrid.innerHTML = '';
    Inventory.quickbar.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'inv-slot';
        div.dataset.dropSource = 'quickbar';
        div.dataset.dropIndex = i;
        if (item) {
            div.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
            div.addEventListener('mousedown', (e) => startDrag(e, 'quickbar', i, item, div));
            div.onclick = () => tryConsumeItem(Inventory.quickbar, i);
        }
        qbGrid.appendChild(div);
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
        div.dataset.dropSource = 'chest';
        div.dataset.dropIndex = i;
        if (item) {
            div.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
            div.addEventListener('mousedown', (e) => startDrag(e, 'chest', i, item, div));
            // Click derecho: mover el stack completo al inventario al instante
            div.oncontextmenu = (e) => { e.preventDefault(); Inventory.quickMoveToPlayer(i); refreshChestUI(); };
        }
        chestGrid.appendChild(div);
    });

    const playerGrid = document.getElementById('chest-player-grid');
    playerGrid.innerHTML = '';
    Inventory.global.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'inv-slot';
        div.dataset.dropSource = 'global';
        div.dataset.dropIndex = i;
        if (item) {
            div.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
            div.addEventListener('mousedown', (e) => startDrag(e, 'global', i, item, div));
            // Click derecho: mover el stack completo al cofre al instante
            div.oncontextmenu = (e) => { e.preventDefault(); Inventory.quickMoveToChest(i); refreshChestUI(); };
        }
        playerGrid.appendChild(div);
    });
}

export function toggleInventory() {
    const panel = document.getElementById('inventory-panel');
    const open = panel.style.display === 'block';
    panel.style.display = open ? 'none' : 'block';
    if (!open) refreshInventoryUI();
}
