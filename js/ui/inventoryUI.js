/* =====================================================================
   10. INTERFAZ DE USUARIO (UI) — Inventario, Barra Rápida, Cofre
   Sistema de selección por toque: tocar/clickear un ítem abre un
   cuadrito con las acciones disponibles (ver js/ui/itemActionMenu.js).
   Reemplaza al arrastre, poco confiable en móvil, PC y mando.
   ===================================================================== */
import { Inventory, tryConsumeItem, isWeaponItem, isConsumableItem } from '../systems/inventory.js';
import { WEAPONS } from '../data/weapons.js';
import { openItemActionMenu } from './itemActionMenu.js';

// Varios cofres (punto 2): cuál está abierto ahora mismo en #chest-panel.
// Lo fija openChestPanel() al interactuar con cada cofre del mundo (ver
// systems/worldInteraction.js).
let currentChestId = 'main';
const CHEST_TITLES = {
    main: 'Cofre',
    weapons: 'Cofre de Armas',
    tools: 'Cofre de Herramientas'
};

function refreshAll() {
    refreshInventoryUI();
    refreshChestUI();
}

// Acciones base para un ítem que pertenece al jugador (Inventario Global o
// Barra Rápida): Equipar/Usar (según el tipo de ítem) + una acción de
// movimiento opcional (a Barra Rápida, a Inventario, o a Cofre).
// "Eliminar" es exclusivo del Inventario Global (includeDelete=true) — en
// ningún otro lugar (Barra Rápida, Cofre, vista del Cofre) se puede borrar.
function buildOwnedItemActions(arr, index, item, moveAction, includeDelete = false) {
    const actions = [];
    if (isWeaponItem(item)) {
        actions.push({ label: 'Equipar', onClick: () => { tryConsumeItem(arr, index); refreshAll(); } });
    } else if (isConsumableItem(item)) {
        actions.push({ label: 'Usar', onClick: () => { tryConsumeItem(arr, index); refreshAll(); } });
    }
    if (moveAction) actions.push(moveAction);
    if (includeDelete) actions.push({ label: 'Eliminar', onClick: () => { arr[index] = null; refreshAll(); } });
    return actions;
}

function attachSlotTap(div, arr, index, actionsBuilder) {
    div.onclick = () => {
        const item = arr[index];
        if (!item) return;
        openItemActionMenu(div, actionsBuilder(item));
    };
}

export function refreshInventoryUI() {
    const grid = document.getElementById('inv-grid');
    grid.innerHTML = '';
    Inventory.global.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'inv-slot';
        if (item) {
            div.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
            attachSlotTap(div, Inventory.global, i, (it) => buildOwnedItemActions(
                Inventory.global, i, it,
                { label: 'Mover a Barra Rápida', onClick: () => { Inventory.moveGlobalToQuickbar(i); refreshAll(); } },
                true // único lugar donde se puede eliminar ítems
            ));
        }
        grid.appendChild(div);
    });

    const qbGrid = document.getElementById('quickbar-panel-grid');
    qbGrid.innerHTML = '';
    Inventory.quickbar.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'inv-slot';
        if (item) {
            div.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
            attachSlotTap(div, Inventory.quickbar, i, (it) => buildOwnedItemActions(
                Inventory.quickbar, i, it,
                { label: 'Quitar de Barra Rápida', onClick: () => { Inventory.moveQuickbarToGlobal(i); refreshAll(); } }
            ));
        }
        qbGrid.appendChild(div);
    });

    const eqWeapon = document.getElementById('eq-weapon');
    const w = Inventory.equipment.weapon ? WEAPONS[Inventory.equipment.weapon] : WEAPONS.desarmado;
    eqWeapon.innerHTML = `<strong>Arma</strong><br>${w.name}`;
    eqWeapon.onclick = () => {
        if (!Inventory.equipment.weapon) return; // nada equipado, no hay nada que hacer
        openItemActionMenu(eqWeapon, [
            { label: 'Desequipar', onClick: () => { Inventory.unequipWeapon(); refreshAll(); } }
        ]);
    };

    const eqArmor = document.getElementById('eq-armor');
    eqArmor.innerText = 'Armadura\n' + (Inventory.equipment.armor || 'Ninguna');
    eqArmor.onclick = () => {
        if (!Inventory.equipment.armor) return;
        openItemActionMenu(eqArmor, [
            { label: 'Desequipar', onClick: () => { Inventory.equipment.armor = null; refreshAll(); } }
        ]);
    };

    const eqAccessory = document.getElementById('eq-accessory');
    eqAccessory.innerText = 'Amuleto\n' + (Inventory.equipment.accessory || 'Ninguno');
    eqAccessory.onclick = () => {
        if (!Inventory.equipment.accessory) return;
        openItemActionMenu(eqAccessory, [
            { label: 'Desequipar', onClick: () => { Inventory.equipment.accessory = null; refreshAll(); } }
        ]);
    };
}

export function refreshChestUI() {
    const chest = Inventory.chests[currentChestId];
    const chestGrid = document.getElementById('chest-grid');
    chestGrid.innerHTML = '';
    chest.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'inv-slot';
        if (item) {
            div.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
            attachSlotTap(div, chest, i, () => [
                { label: 'Mover al Inventario', onClick: () => { Inventory.quickMoveToPlayer(currentChestId, i); refreshAll(); } }
            ]);
        }
        chestGrid.appendChild(div);
    });

    const playerGrid = document.getElementById('chest-player-grid');
    playerGrid.innerHTML = '';
    Inventory.global.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'inv-slot';
        if (item) {
            div.innerHTML = `${item.name.slice(0,6)}<span class="qty">${item.qty}</span>`;
            attachSlotTap(div, Inventory.global, i, (it) => buildOwnedItemActions(
                Inventory.global, i, it,
                { label: 'Mover al Cofre', onClick: () => { Inventory.quickMoveToChest(currentChestId, i); refreshAll(); } }
            ));
        }
        playerGrid.appendChild(div);
    });
}

// Abre #chest-panel mostrando el cofre pedido ('main' | 'weapons' | 'tools',
// ver Inventory.chests). Llamado desde systems/worldInteraction.js al
// interactuar con cada cofre del mundo.
export function openChestPanel(chestId) {
    currentChestId = chestId;
    refreshChestUI();
    const title = CHEST_TITLES[chestId] || 'Cofre';
    document.getElementById('chest-panel-title').innerText = `${title} (40 Slots) — Toca un ítem para ver sus opciones`;
    document.getElementById('chest-panel').style.display = 'block';
}

export function toggleInventory() {
    const panel = document.getElementById('inventory-panel');
    const open = panel.style.display === 'block';
    panel.style.display = open ? 'none' : 'block';
    if (!open) refreshInventoryUI();
}
