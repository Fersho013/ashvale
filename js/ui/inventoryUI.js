/* =====================================================================
   10. INTERFAZ DE USUARIO (UI) — Inventario, Barra Rápida, Cofre
   Sistema de selección por toque: tocar/clickear un ítem abre un
   cuadrito con las acciones disponibles (ver js/ui/itemActionMenu.js).
   Reemplaza al arrastre, poco confiable en móvil, PC y mando.
   ===================================================================== */
import { Inventory, tryConsumeItem, isWeaponItem, isConsumableItem, isArmorItem } from '../systems/inventory.js';
import { WEAPONS } from '../data/weapons.js';
import { TOOLS } from '../data/tools.js';
import { ARMORS } from '../data/armor.js';
import { CONSUMABLE_EFFECTS } from '../data/recipes.js';
import { openItemActionMenu } from './itemActionMenu.js';
import { showDialog } from './dialog.js';

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
    } else if (isToolItem(item)) {
        actions.push({ label: 'Equipar herramienta', onClick: () => { tryConsumeItem(arr, index); refreshAll(); } });
    } else if (isArmorItem(item)) {
        actions.push({ label: 'Equipar armadura', onClick: () => { tryConsumeItem(arr, index); refreshAll(); } });
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
        div.dataset.itemName = item.name;
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

    const eqTool = document.getElementById('eq-tool');
    const tool = Inventory.equipment.tool ? TOOLS[Inventory.equipment.tool] : null;
    eqTool.innerHTML = `<strong>Herramienta</strong><br>${tool ? tool.name : 'Ninguna'}`;
    eqTool.onclick = () => {
        if (!Inventory.equipment.tool) return;
        openItemActionMenu(eqTool, [
            { label: 'Desequipar', onClick: () => { Inventory.unequipTool(); refreshAll(); } }
        ]);
    };

    const eqArmor = document.getElementById('eq-armor');
    const armor = Inventory.equipment.armor ? ARMORS[Inventory.equipment.armor] : null;
    eqArmor.innerHTML = `<strong>Armadura</strong><br>${armor ? armor.name : 'Ninguna'}${armor ? `<small>${armor.description}</small>` : ''}`;
    eqArmor.dataset.itemName = armor?.name || '';
    eqArmor.onclick = () => {
        if (!Inventory.equipment.armor) return;
        openItemActionMenu(eqArmor, [
            { label: 'Desequipar', onClick: () => { Inventory.unequipArmor(); refreshAll(); } }
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

function chestDetailEl() { return document.getElementById('chest-detail'); }

function countUsedSlots(arr) { return arr.reduce((n, s) => n + (s ? 1 : 0), 0); }

function describeChestItem(item) {
    if (!item) return null;
    for (const key in WEAPONS) {
        const w = WEAPONS[key];
        if (w.name === item.name && key !== 'desarmado') {
            return { kind: 'Arma cuerpo a cuerpo', title: item.name, desc: `${w.name}: daño ${w.dmg}, recarga ${w.attackCooldown}f.`, stats: [`⚔️ Daño: ${w.dmg}`, `⏱️ Recarga: ${w.attackCooldown}f`], rarity: 'Común' };
        }
    }
    for (const key in TOOLS) {
        const t = TOOLS[key];
        if (t.name === item.name) return { kind: 'Herramienta', title: item.name, desc: t.description || 'Herramienta de recolección.', stats: [], rarity: 'Común' };
    }
    for (const key in ARMORS) {
        const a = ARMORS[key];
        if (a.name === item.name) return { kind: 'Armadura', title: item.name, desc: a.description || '', stats: [`❤️ HP: +${a.maxHpBonus || 0}`, `🛡️ Defensa: +${a.defense || 0}`], rarity: 'Común' };
    }
    const eff = CONSUMABLE_EFFECTS[item.name];
    if (eff) return { kind: 'Consumible', title: item.name, desc: eff.msg || '', stats: [], rarity: 'Común' };
    return { kind: 'Material', title: item.name, desc: 'Material de crafteo o botín.', stats: [], rarity: 'Común' };
}

function renderChestDetail(item, transferLabel, onTransfer) {
    const detail = chestDetailEl();
    if (!detail) return;
    if (!item) {
        detail.innerHTML = '<div class="chest-empty">Toca un ítem para ver su detalle.</div>';
        return;
    }
    const info = describeChestItem(item) || { kind: '', title: item.name, desc: '', stats: [], rarity: 'Común' };
    detail.innerHTML = `
        <div class="chest-detail-head"><span class="chest-detail-icon">⚔️</span><div><strong>${info.title}</strong><small>${info.kind} · x${item.qty}</small></div></div>
        <p class="chest-detail-desc">${info.desc}</p>
        ${info.stats.map(s => `<div class="chest-detail-stat">${s}</div>`).join('')}
        <div class="chest-detail-stat rarity">Raridad: ${info.rarity}</div>
        <div class="chest-detail-actions">
            <button type="button" class="chest-transfer-btn" id="chest-transfer-btn">⤾ ${transferLabel}</button>
            <button type="button" class="chest-ghost-btn" id="chest-detail-btn">👁 Ver detalle</button>
        </div>`;
    document.getElementById('chest-transfer-btn').onclick = onTransfer;
    document.getElementById('chest-detail-btn').onclick = () => showDialog(info.title, `${info.kind} — ${info.desc}`);
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
            div.onclick = () => {
                renderChestDetail(item, 'Transferir', () => { Inventory.quickMoveToPlayer(currentChestId, i); refreshAll(); });
                openItemActionMenu(div, [
                    { label: 'Mover al Inventario', onClick: () => { Inventory.quickMoveToPlayer(currentChestId, i); refreshAll(); } }
                ]);
            };
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
            div.onclick = () => {
                renderChestDetail(item, 'Transferir', () => { Inventory.quickMoveToChest(currentChestId, i); refreshAll(); });
                openItemActionMenu(div, buildOwnedItemActions(
                    Inventory.global, i, item,
                    { label: 'Mover al Cofre', onClick: () => { Inventory.quickMoveToChest(currentChestId, i); refreshAll(); } }
                ));
            };
        }
        playerGrid.appendChild(div);
    });

    const cs = document.getElementById('chest-spaces');
    if (cs) cs.innerText = `Espacios: ${countUsedSlots(chest)}/${chest.length}`;
    const ps = document.getElementById('chest-player-spaces');
    if (ps) ps.innerText = `Espacios: ${countUsedSlots(Inventory.global)}/${Inventory.global.length}`;
    if (chestDetailEl() && !chestDetailEl().innerHTML) renderChestDetail(null);
}

// Abre #chest-panel mostrando el cofre pedido ('main' | 'weapons' | 'tools',
// ver Inventory.chests). Llamado desde systems/worldInteraction.js al
// interactuar con cada cofre del mundo.
export function openChestPanel(chestId) {
    currentChestId = chestId;
    const detail = chestDetailEl();
    if (detail) detail.innerHTML = '';
    refreshChestUI();
    const title = CHEST_TITLES[chestId] || 'Cofre';
    document.getElementById('chest-panel-title').innerText = title;
    document.getElementById('chest-panel').style.display = 'block';
}

export function toggleInventory() {
    const panel = document.getElementById('inventory-panel');
    const open = panel.style.display === 'block';
    panel.style.display = open ? 'none' : 'block';
    if (!open) refreshInventoryUI();
}

function isToolItem(item) {
    return !!(item && Object.values(TOOLS).some(tool => tool.name === item.name));
}
