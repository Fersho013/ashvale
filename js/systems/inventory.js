/* =====================================================================
   5. INVENTARIO Y COFRE — Lógica de datos
   (el arrastre fue reemplazado por un sistema de selección por toque;
   ver js/ui/itemActionMenu.js, js/ui/inventoryUI.js y js/ui/craftingUI.js)
   ===================================================================== */
import { WEAPONS } from '../data/weapons.js';
import { TOOLS } from '../data/tools.js';
import { ARMORS, findArmorKeyByName } from '../data/armor.js';
import { CONSUMABLE_EFFECTS } from '../data/recipes.js';
import { rollLoot } from '../data/mobs.js';
import { showDialog } from '../ui/dialog.js';
import { refreshInventoryUI } from '../ui/inventoryUI.js';
import { game } from '../core/gameContext.js';

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
    // Varios cofres (punto 2): cada uno es un contenedor independiente de
    // 40 slots, igual que el Cofre original. "weapons" y "tools" reemplazan
    // a los antiguos estantes/racks infinitos del mundo — ahora son un
    // stock limitado que el jugador saca y decide qué llevarse (ver
    // world/worldObjects.js y systems/worldInteraction.js).
    chests: {
        main: new Array(40).fill(null),
        weapons: new Array(40).fill(null),
        tools: new Array(40).fill(null)
    },
    equipment: { weapon: null, tool: null, armor: null, accessory: null }, // Comienza SIN EQUIPO
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
    // A diferencia de hasBuff() (solo true/false), devuelve el buff completo
    // — necesario para leer su "value" (ej. cuánta Fuerza da exactamente
    // esta Fuerza en particular: +5, -5, +20... ver data/recipes.js).
    getBuff(name) { return this.buffs.find(b => b.name === name) || null; },
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

    equipToolFromSlot(arr, index) {
        const item = arr[index];
        if (!item) return;

        const foundKey = Object.keys(TOOLS).find(key => TOOLS[key].name === item.name);
        if (!foundKey) return;

        const currentEquipped = this.equipment.tool;
        this.equipment.tool = foundKey;
        item.qty--;
        if (item.qty <= 0) arr[index] = null;

        if (currentEquipped && TOOLS[currentEquipped]) this.addMaterial(TOOLS[currentEquipped].name, 1);
        showDialog('Equipamiento', `Has equipado: ${TOOLS[foundKey].name}`);
        refreshInventoryUI();
    },

    unequipTool() {
        if (!this.equipment.tool) return;
        const toolName = TOOLS[this.equipment.tool].name;
        if (this.addMaterial(toolName, 1)) {
            this.equipment.tool = null;
            showDialog('Equipamiento', `Desequipado: ${toolName}`);
            refreshInventoryUI();
        } else {
            showDialog('Inventario', '¡Inventario lleno para guardar la herramienta!');
        }
    },

    equipArmorFromSlot(arr, index) {
        const item = arr[index];
        const foundKey = item && findArmorKeyByName(item.name);
        if (!foundKey) return;
        const currentEquipped = this.equipment.armor;
        this.equipment.armor = foundKey;
        item.qty--; if (item.qty <= 0) arr[index] = null;
        if (currentEquipped && ARMORS[currentEquipped]) this.addMaterial(ARMORS[currentEquipped].name, 1);
        syncPlayerHpToEquipment();
        showDialog('Equipamiento', `Has equipado: ${ARMORS[foundKey].name} (${ARMORS[foundKey].description}).`);
        refreshInventoryUI();
    },

    unequipArmor() {
        const armor = ARMORS[this.equipment.armor];
        if (!armor) return;
        if (!this.addMaterial(armor.name, 1)) { showDialog('Inventario', '¡Inventario lleno para guardar la armadura!'); return; }
        this.equipment.armor = null;
        syncPlayerHpToEquipment();
        showDialog('Equipamiento', `Desequipado: ${armor.name}.`);
        refreshInventoryUI();
    },

    // Movimiento RÁPIDO (click derecho) — pasa el stack completo al otro contenedor de inmediato
    quickMoveToChest(chestId, globalIdx) {
        const item = this.global[globalIdx];
        if (!item) return;
        const chest = this.chests[chestId];
        const leftover = addStackToArray(chest, item.name, item.qty, 40);
        const moved = item.qty - leftover;
        if (moved > 0) { item.qty -= moved; if (item.qty <= 0) this.global[globalIdx] = null; }
        if (leftover > 0) showDialog('Cofre', 'El cofre no tiene espacio suficiente para todo el stack.');
    },
    quickMoveToPlayer(chestId, chestIdx) {
        const chest = this.chests[chestId];
        const item = chest[chestIdx];
        if (!item) return;
        const leftover = addStackToArray(this.global, item.name, item.qty, 100);
        const moved = item.qty - leftover;
        if (moved > 0) { item.qty -= moved; if (item.qty <= 0) chest[chestIdx] = null; }
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
        this.equipment.tool = null;
        this.equipment.armor = null;
        syncPlayerHpToEquipment();
    }
};

Inventory.chests.main[0] = { name: 'Carne', qty: 10 };
Inventory.chests.main[1] = { name: 'Huevo', qty: 10 };
Inventory.chests.main[2] = { name: 'Botella', qty: 10 };
Inventory.chests.main[3] = { name: 'Cactus', qty: 10 };
Inventory.chests.main[4] = { name: 'Mineral de Hierro', qty: 10 };
// La Hacha (data/tools.js) aún no tiene función de tala implementada, así
// que no hay forma real de conseguir Madera todavía. Se siembra aquí para
// poder probar la Mesa Constructora (Espada Oxidada, ver data/recipes.js)
// mientras esa mecánica no exista.
Inventory.chests.main[5] = { name: 'Madera', qty: 10 };

// Cofre de Armas (punto 2): reemplaza a los antiguos estantes — las 6
// armas ya no son una fuente infinita en el mundo, ahora es un stock fijo
// dentro de este cofre. Empieza con 1 unidad de cada una; ajustar aquí si
// se quiere un stock inicial distinto.
const ARMORY_WEAPON_KEYS = ['espada', 'mandoble', 'dagas', 'lanza', 'baculo', 'arco'];
ARMORY_WEAPON_KEYS.forEach((key, i) => {
    Inventory.chests.weapons[i] = { name: WEAPONS[key].name, qty: 1 };
});

// Cofre de Herramientas (punto 2): mismo reemplazo que el de Armas, pero
// con Hacha y Pico.
Inventory.chests.tools[0] = { name: TOOLS.hacha.name, qty: 1 };
Inventory.chests.tools[1] = { name: TOOLS.pico.name, qty: 1 };

export function tryConsumeItem(arr, index) {
    const item = arr[index];
    if (!item) return;

    for (const key in WEAPONS) {
        if (WEAPONS[key].name === item.name && key !== 'desarmado') {
            Inventory.equipWeaponFromSlot(arr, index);
            return;
        }
    }

    for (const key in TOOLS) {
        if (TOOLS[key].name === item.name) {
            Inventory.equipToolFromSlot(arr, index);
            return;
        }
    }

    if (findArmorKeyByName(item.name)) {
        Inventory.equipArmorFromSlot(arr, index);
        return;
    }

    const effect = CONSUMABLE_EFFECTS[item.name];
    if (!effect) return;

    let msg = effect.msg;
    if (effect.kind === 'buff') {
        effect.buffs.forEach(b => Inventory.addBuff(b));
    } else if (effect.kind === 'heal') {
        applyInstantHp(effect.amount);
    } else if (effect.kind === 'random') {
        // Ruleta ponderada (ver data/recipes.js -> MASA_EXTRANA_NAME): las
        // probabilidades no necesariamente suman 1 exacto por redondeo del
        // diseño original, así que se recorre en orden y se usa la primera
        // que "cae" — si por algún error de datos no cae ninguna, se toma
        // la última como resultado por defecto.
        let roll = Math.random();
        let outcome = effect.outcomes[effect.outcomes.length - 1];
        for (const o of effect.outcomes) {
            if (roll < o.chance) { outcome = o; break; }
            roll -= o.chance;
        }
        if (outcome.hp) applyInstantHp(outcome.hp);
        if (outcome.buffs) outcome.buffs.forEach(b => Inventory.addBuff(b));
        msg = outcome.msg;
    }

    showDialog('Sistema', `Consumido: ${item.name} — ${msg}`);
    item.qty--; if (item.qty <= 0) arr[index] = null;
    refreshInventoryUI();
}

// Cambia el HP del jugador al instante (positivo o negativo), clampeado
// entre 0 y su máximo. Usado por los consumibles kind:'heal' y por los
// resultados de kind:'random' (ver data/recipes.js).
function applyInstantHp(amount) {
    const player = game.player;
    if (!player) return;
    player.hp = Math.max(0, Math.min(player.maxHp, player.hp + amount));
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

export function isArmorItem(item) { return !!(item && findArmorKeyByName(item.name)); }

function syncPlayerHpToEquipment() {
    const player = game.player;
    if (player) player.hp = Math.min(player.hp, player.maxHp);
}

// Se llama al morir un enemigo (ver entities/mobs.js y systems/worldInteraction.js)
// para resolver y aplicar su tabla de loot (ver data/mobs.js): el oro se
// suma directo a Inventory.gold, el resto entra como material al inventario
// global. Si el inventario está lleno para algún material, ese drop en
// particular se pierde (mismo comportamiento que el resto de pickups del
// mundo, ver worldInteraction.js) pero no bloquea los demás.
export function grantMobLoot(mobKey) {
    const drops = rollLoot(mobKey);
    if (drops.length === 0) return;

    const parts = [];
    for (const drop of drops) {
        if (drop.name === 'Oro') {
            Inventory.gold += drop.qty;
            parts.push(`${drop.qty} de Oro`);
        } else if (Inventory.addMaterial(drop.name, drop.qty)) {
            parts.push(`${drop.name} x${drop.qty}`);
        }
    }
    if (parts.length > 0) showDialog('Botín', `Has obtenido: ${parts.join(', ')}.`);
    refreshInventoryUI();
}
