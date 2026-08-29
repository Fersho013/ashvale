/* =====================================================================
   REGISTRO DE ENEMIGOS — vida base y tabla de recompensas (loot)
   Fuente única de verdad para los stats base y el botín de cada tipo de
   enemigo hostil. Las clases de comportamiento (movimiento, IA, ataque)
   siguen viviendo en entities/mobs.js; este archivo solo tiene DATOS,
   siguiendo el mismo patrón que data/weapons.js, data/tools.js y
   data/recipes.js (sin imports, sin lógica de juego).

   Formato de "loot": cada entrada es { name, qty, chance }, evaluada de
   forma INDEPENDIENTE al morir el enemigo (no es una ruleta exclusiva:
   varias entradas con chance:1 caen siempre, y pueden coexistir con una
   entrada de baja probabilidad, ej. la armadura del Slime).
   "name: 'Oro'" es un caso especial resuelto en systems/inventory.js
   (grantMobLoot): se suma a Inventory.gold en vez de ir a los materiales.
   ===================================================================== */
export const MOBS = {
    slime: {
        id: 'slime', name: 'Slime', baseHp: 30,
        loot: [
            { name: 'Bola de Baba',      qty: 1, chance: 1 },
            { name: 'Botella',           qty: 1, chance: 0.50 },
            { name: 'Armadura de Cuero', qty: 1, chance: 0.05 } // 5%
        ]
    },
    granSlime: {
        id: 'granSlime', name: 'Gran Slime', baseHp: 90,
        loot: [
            { name: 'Bola de Baba',      qty: 3, chance: 1 },
            { name: 'Botella',           qty: 2, chance: 0.75 },
            { name: 'Armadura de Cuero', qty: 1, chance: 0.10 }
        ]
    },
    lobo: {
        id: 'lobo', name: 'Lobo', baseHp: 60,
        loot: [
            { name: 'Carne',    qty: 1, chance: 1 },
            { name: 'Cuero',    qty: 1, chance: 1 },
            { name: 'Colmillo', qty: 1, chance: 1 }
        ]
    },
    goblin: {
        id: 'goblin', name: 'Goblin', baseHp: 80,
        loot: [
            { name: 'Oro',                     qty: 10, chance: 1 },
            { name: 'Espada Corta de Goblin',  qty: 1,  chance: 0.05 }, // 5%, ver data/weapons.js
            { name: 'Metal Oxidado',           qty: 1,  chance: 1 }
        ]
    },
    ciervo: {
        id: 'ciervo', name: 'Ciervo', baseHp: 50,
        loot: [
            { name: 'Cuerno', qty: 1, chance: 1 },
            { name: 'Cuero',  qty: 1, chance: 1 },
            { name: 'Carne',  qty: 1, chance: 1 }
        ]
    },
    mobArena: {
        id: 'mobArena', name: 'Mob de Arena', baseHp: 150, loot: []
    }
};

// Resuelve la tabla de loot de un enemigo en el momento de su muerte: cada
// entrada se evalúa contra su propia probabilidad. Devuelve solo los items
// realmente obtenidos (sin tocar el inventario — eso lo hace grantMobLoot()
// en systems/inventory.js, que es quien conoce Inventory.gold/addMaterial).
export function rollLoot(mobKey) {
    const data = MOBS[mobKey];
    if (!data) return [];
    return data.loot
        .filter(drop => Math.random() < drop.chance)
        .map(drop => ({ name: drop.name, qty: drop.qty }));
}
