/* =====================================================================
   REGISTRO DE ENEMIGOS — vida base y tabla de recompensas (loot)
   Cada entrada de "loot" tira su propia probabilidad (chance, 0–1) de
   forma INDEPENDIENTE del resto: chance:1 significa que siempre se
   suelta. Las entradas con "gold" suman oro directo a Inventory.gold en
   vez de agregar un material.
   Este archivo es solo datos — la concesión real del loot (tirar los
   dados, sumar al inventario, avisar al jugador) vive en
   systems/worldInteraction.js (función grantLoot()), igual que
   entities/mobs.js consume baseHp de aquí en vez de tener números sueltos.
   ===================================================================== */
export const MOB_DATA = {
    slime: {
        id: 'slime', name: 'Slime', baseHp: 10,
        loot: [
            { name: 'Botella', qty: 1, chance: 1 },
            { gold: 5, chance: 1 },
            { name: 'Armadura de Cuero', qty: 1, chance: 0.05 }
        ]
    },
    lobo: {
        id: 'lobo', name: 'Lobo', baseHp: 25,
        loot: [
            { name: 'Carne', qty: 1, chance: 1 },
            { name: 'Cuero', qty: 1, chance: 1 },
            { name: 'Colmillo', qty: 1, chance: 1 }
        ]
    },
    goblin: {
        id: 'goblin', name: 'Goblin', baseHp: 20,
        loot: [
            { gold: 10, chance: 1 },
            { name: 'Espada Corta de Goblin', qty: 1, chance: 0.05 },
            { name: 'Metal Oxidado', qty: 1, chance: 1 }
        ]
    }
};
