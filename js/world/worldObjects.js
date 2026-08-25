/* =====================================================================
   OBJETOS DEL MUNDO: NPC, mobiliario interactuable, estantes y cofres
   ===================================================================== */
// Estantes de Armas/Herramientas: fuente INFINITA de ítems (se puede volver
// las veces que se quiera, igual que el punto 1 original). Todos en una
// sola fila, en la parte SUPERIOR de esta zona de equipamiento.
export const weaponRacks = [
    { x: 410, y: 40, w: 34, h: 34, weapon: 'espada',   name: 'Estante de Espadas' },
    { x: 456, y: 40, w: 34, h: 34, weapon: 'mandoble', name: 'Estante de Mandobles' },
    { x: 502, y: 40, w: 34, h: 34, weapon: 'dagas',    name: 'Estante de Dagas' },
    { x: 548, y: 40, w: 34, h: 34, weapon: 'arco',     name: 'Estante de Arcos' },
    { x: 594, y: 40, w: 34, h: 34, weapon: 'lanza',    name: 'Estante de Lanzas' },
    { x: 640, y: 40, w: 34, h: 34, weapon: 'baculo',   name: 'Estante de Báculos' }
];
export const toolRacks = [
    { x: 686, y: 40, w: 34, h: 34, tool: 'hacha', name: 'Estante de Hachas' },
    { x: 732, y: 40, w: 34, h: 34, tool: 'pico',  name: 'Estante de Picos' }
];

// Cofre de Armas y Cofre de Herramientas (punto 2): stock FINITO — cada uno
// abre su propio almacenamiento (ver Inventory.chests en systems/inventory.js).
// En la parte INFERIOR de la misma zona, debajo de los estantes.
export const weaponsChestObj = { x: 550, y: 200, w: 32, h: 26, interactionRadius: 50 };
export const toolsChestObj   = { x: 630, y: 200, w: 32, h: 26, interactionRadius: 50 };

export const npc = {
    x: 80, y: 60, w: 36, h: 36, interactionRadius: 60,
    messages: [
        "¡Bienvenido al Sandbox de Ashvale! Usa WASD o los controles táctiles para moverte.",
        "Al este de esta sala hay Estantes de Armas/Herramientas (puedes tomar de ahí las veces que quieras) y, más abajo, un Cofre de Armas y uno de Herramientas con existencias limitadas. Presiona [E] junto a cualquiera.",
        "Abre tu inventario con [I] para equiparte las armas o usar consumibles.",
        "En el Cofre, toca un ítem para ver sus opciones y moverlo hacia tu inventario."
    ],
    msgIndex: 0
};
export const respawnBed   = { x: 160, y: 60,  w: 30, h: 24, interactionRadius: 50 };
export const campfire     = { x: 80,  y: 160, w: 30, h: 30, interactionRadius: 50 };
export const alchemyTable = { x: 160, y: 160, w: 30, h: 30, interactionRadius: 50 };
export const chestObj      = { x: 250, y: 160, w: 32, h: 26, interactionRadius: 50 };
// Mesa Constructora (punto 2): arma craftable a partir de materiales de
// mob-loot (ver data/mobs.js) — espadas, herramientas y armaduras (ver
// data/recipes.js -> BUILD_RECIPES). Ubicada junto al resto de estaciones
// de crafteo, en un hueco libre de muros de la Zona 1.
export const buildTable    = { x: 320, y: 160, w: 30, h: 30, interactionRadius: 50 };
export const workTables = [ { x: 250, y: 40, w: 40, h: 26 }, { x: 310, y: 40, w: 40, h: 26 }, { x: 60, y: 230, w: 40, h: 26 } ];

export const bocinaVigia = { x: 950, y: 750, w: 34, h: 34, interactionRadius: 55 };

// Recursos renovables de la Zona 4: Ecosistema y Bioma Vivo. Cada nodo se
// puede recolectar cinco veces antes de quedar en recuperación por 3 min.
export const harvestNodes = [
    { id: 'tree-1', type: 'tree', label: 'Árbol', x: 240, y: 430, w: 48, h: 64, interactionRadius: 62, requiredTool: 'hacha', action: 'Talando', drop: 'Madera', uses: 0, maxUses: 5, recoveryUntil: 0 },
    { id: 'tree-2', type: 'tree', label: 'Árbol', x: 430, y: 590, w: 48, h: 64, interactionRadius: 62, requiredTool: 'hacha', action: 'Talando', drop: 'Madera', uses: 0, maxUses: 5, recoveryUntil: 0 },
    { id: 'stone-1', type: 'stone', label: 'Piedra', x: 620, y: 450, w: 44, h: 36, interactionRadius: 58, requiredTool: 'pico', action: 'Minando', drop: 'Piedra', uses: 0, maxUses: 5, recoveryUntil: 0 },
    { id: 'iron-ore-1', type: 'ironOre', label: 'Mena de hierro', x: 680, y: 700, w: 44, h: 40, interactionRadius: 58, requiredTool: 'pico', action: 'Minando', drop: 'Mineral de Hierro', uses: 0, maxUses: 5, recoveryUntil: 0 }
];
