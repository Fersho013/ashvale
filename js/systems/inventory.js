/* =====================================================================
   5. INVENTARIO Y COFRE — Lógica de datos
   (el arrastre fue reemplazado por un sistema de selección por toque;
   ver js/ui/itemActionMenu.js, js/ui/inventoryUI.js y js/ui/craftingUI.js)
   ===================================================================== */
import { WEAPONS } from '../data/weapons.js';
import { CONSUMABLE_EFFECTS } from '../data/recipes.js';
import { showDialog } from '../ui/dialog.js';
import { refreshInventoryUI } from '../ui/inventoryUI.js';

export function addStackToArray(arr, name, qty, maxSlots) {
    for (let i = 0; i < maxSlots && qty > 0; i++) {
        if (arr[i] && arr[i].name === name && arr[i].qty < 64) {
            const space = 64 - arr[i].qty;
            const add = Math.min(space, qty);
            arr[i].qty += add; qty -= add;
        }
    }
    for (let i = 0; i < maxSlots && qty > 0; i++) {
        if (!arr[i]) {
            const add = Math.min(64, qty);
            arr[i] = { name, qty: add }; qty -= add;
        }
    }
    return qty;
}

export const Inventory = {
    quickbar: new Array(10).fill(null),
    global: new Array(100).fill(null),
    chest: new Array(40).fill(null),
    equipment: { weapon: null, armor: null, accessory: null }, // Comienza SIN ARMA
    gold: 0,
    buffs: [],

    addMaterial(name, qty = 1, toQuickbar = false) {
        const arr = toQuickbar ? this.quickbar : this.global;
        const max = toQuickbar ? 10 : 100;
        const leftover = addStackToArray(arr, name, qty, max);
        return leftover <= 0;
    },

    addBuff(buff) {
        if (this.buffs.length >= 3) this.buffs.shift();
        this.buffs.push({ ...buff, timer: buff.duration });
    },
    hasBuff(name) { return this.buffs.some(b => b.name === name); },
    updateBuffs() {
        for (const b of this.buffs) b.timer--;
        this.buffs = this.buffs.filter(b => b.timer > 0);
    },

    equipWeaponFromSlot(arr, index) {
        const item = arr[index];
        if (!item) return;

        let foundKey = null;
        for (const key in WEAPONS) {
            if (WEAPONS[key].name === item.name && key !== 'desarmado') {
                foundKey = key;
                break;
            }
        }
        if (!foundKey) return;

        const currentEquipped = this.equipment.weapon;
        this.equipment.weapon = foundKey;

        item.qty--;
        if (item.qty <= 0) arr[index] = null;

        if (currentEquipped && WEAPONS[currentEquipped]) {
            this.addMaterial(WEAPONS[currentEquipped].name, 1);
        }
        showDialog('Equipamiento', `Has equipado: ${WEAPONS[foundKey].name}`);
        refreshInventoryUI();
    },

    unequipWeapon() {
        if (!this.equipment.weapon) return;
        const wName = WEAPONS[this.equipment.weapon].name;
        if (this.addMaterial(wName, 1)) {
            showDialog('Equipamiento', `Desequipado: ${wName}`);
            this.equipment.weapon = null;
            refreshInventoryUI();
        } else {
            showDialog('Inventario', '¡Inventario lleno para guardar el arma!');
        }
    },

    // Movimiento RÁPIDO (click derecho) — pasa el stack completo al otro contenedor de inmediato
    quickMoveToChest(globalIdx) {
        const item = this.global[globalIdx];
        if (!item) return;
        const leftover = addStackToArray(this.chest, item.name, item.qty, 40);
        const moved = item.qty - leftover;
        if (moved > 0) { item.qty -= moved; if (item.qty <= 0) this.global[globalIdx] = null; }
        if (leftover > 0) showDialog('Cofre', 'El cofre no tiene espacio suficiente para todo el stack.');
    },
    quickMoveToPlayer(chestIdx) {
        const item = this.chest[chestIdx];
        if (!item) return;
        const leftover = addStackToArray(this.global, item.name, item.qty, 100);
        const moved = item.qty - leftover;
        if (moved > 0) { item.qty -= moved; if (item.qty <= 0) this.chest[chestIdx] = null; }
        if (leftover > 0) showDialog('Inventario', 'Tu inventario no tiene espacio suficiente para todo el stack.');
    },

    // Mover el stack completo entre Inventario Global y Barra Rápida
    moveGlobalToQuickbar(globalIdx) {
        const item = this.global[globalIdx];
        if (!item) return;
        const leftover = addStackToArray(this.quickbar, item.name, item.qty, 10);
        const moved = item.qty - leftover;
        if (moved > 0) { item.qty -= moved; if (item.qty <= 0) this.global[globalIdx] = null; }
        if (leftover > 0) showDialog('Barra Rápida', 'No hay espacio suficiente en la Barra Rápida.');
    },
    moveQuickbarToGlobal(quickbarIdx) {
        const item = this.quickbar[quickbarIdx];
        if (!item) return;
        const leftover = addStackToArray(this.global, item.name, item.qty, 100);
        const moved = item.qty - leftover;
        if (moved > 0) { item.qty -= moved; if (item.qty <= 0) this.quickbar[quickbarIdx] = null; }
        if (leftover > 0) showDialog('Inventario', 'Tu inventario no tiene espacio suficiente para todo el stack.');
    },

    reset() {
        this.buffs = []; this.gold = 0;
        this.quickbar.fill(null); this.global.fill(null);
        this.equipment.weapon = null;
    }
};

Inventory.chest[0] = { name: 'Carne', qty: 10 };
Inventory.chest[1] = { name: 'Huevo', qty: 10 };
Inventory.chest[2] = { name: 'Botella', qty: 10 };
Inventory.chest[3] = { name: 'Cactus', qty: 10 };
Inventory.chest[4] = { name: 'Mineral de Hierro', qty: 10 };

export function tryConsumeItem(arr, index) {
    const item = arr[index];
    if (!item) return;

    for (const key in WEAPONS) {
        if (WEAPONS[key].name === item.name && key !== 'desarmado') {
            Inventory.equipWeaponFromSlot(arr, index);
            return;
        }
    }

    const effect = CONSUMABLE_EFFECTS[item.name];
    if (!effect) return;
    Inventory.addBuff({ name: effect.buffName, duration: effect.duration, color: effect.color });
    showDialog('Sistema', `Consumido: ${item.name} — ${effect.msg}`);
    item.qty--; if (item.qty <= 0) arr[index] = null;
    refreshInventoryUI();
}

// true si el ítem es un arma equipable (aparece en WEAPONS, excluyendo "desarmado")
export function isWeaponItem(item) {
    if (!item) return false;
    for (const key in WEAPONS) {
        if (key !== 'desarmado' && WEAPONS[key].name === item.name) return true;
    }
    return false;
}

// true si el ítem es un consumible (tiene efecto definido en CONSUMABLE_EFFECTS)
export function isConsumableItem(item) {
    return !!(item && CONSUMABLE_EFFECTS[item.name]);
}
