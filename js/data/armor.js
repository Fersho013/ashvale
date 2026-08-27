/* =====================================================================
   FAMILIAS DE ARMADURA
   Toda armadura se registra aquí para compartir el mismo equipamiento,
   cálculo de estadísticas y slot de inventario.
   ===================================================================== */
export const ARMOR_FAMILIES = {
    armor: { id: 'armor', label: 'Armadura', slot: 'armor' }
};

export const ARMORS = {
    leather_armor: {
        id: 'leather_armor', name: 'Armadura de Cuero', family: 'armor',
        maxHpBonus: 20, defense: 5,
        description: '+20 HP máximo · +5 Defensa'
    }
};

export function getArmor(key) { return ARMORS[key] || null; }
export function findArmorKeyByName(name) { return Object.keys(ARMORS).find(key => ARMORS[key].name === name) || null; }
