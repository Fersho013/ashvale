/* =====================================================================
   OBJETOS DEL MUNDO: NPC, mobiliario interactuable, estantes y cofres
   ===================================================================== */
// El mapa tutorial se amplió 2×. Las posiciones se escalan para conservar
// la distribución relativa; las dimensiones se mantienen listas para los
// sprites actuales y los futuros assets individuales.
const S = 2;
const pos = (x, y) => ({ x: x * S, y: y * S });
// Estantes de Armas/Herramientas: fuente INFINITA de ítems (se puede volver
// las veces que se quiera, igual que el punto 1 original). Todos en una
// sola fila, en la parte SUPERIOR de esta zona de equipamiento.
export const weaponRacks = [
    { ...pos(410, 40), w: 34, h: 34, weapon: 'espada',   name: 'Estante de Espadas' },
    { ...pos(456, 40), w: 34, h: 34, weapon: 'mandoble', name: 'Estante de Mandobles' },
    { ...pos(502, 40), w: 34, h: 34, weapon: 'dagas',    name: 'Estante de Espadas Duales' },
    { ...pos(548, 40), w: 34, h: 34, weapon: 'arco',     name: 'Estante de Arcos' },
    { ...pos(594, 40), w: 34, h: 34, weapon: 'lanza',    name: 'Estante de Lanzas' },
    { ...pos(640, 40), w: 34, h: 34, weapon: 'baculo',   name: 'Estante de Báculos' }
];
export const toolRacks = [
    { ...pos(686, 40), w: 34, h: 34, tool: 'hacha', name: 'Estante de Hachas' },
    { ...pos(732, 40), w: 34, h: 34, tool: 'pico',  name: 'Estante de Picos' }
];

// Cofre de Armas y Cofre de Herramientas (punto 2): stock FINITO — cada uno
// abre su propio almacenamiento (ver Inventory.chests en systems/inventory.js).
// En la parte INFERIOR de la misma zona, debajo de los estantes.
export const weaponsChestObj = { ...pos(550, 200), w: 32, h: 26, interactionRadius: 50 };
export const toolsChestObj   = { ...pos(630, 200), w: 32, h: 26, interactionRadius: 50 };

export const npc = {
    // El Anciano recibe al jugador junto a la Hoguera, al inicio del centro.
    x: 365, y: 300, w: 36, h: 36, interactionRadius: 60,
    messages: [
        "¡Bienvenido al Sandbox de Ashvale! Usa WASD o los controles táctiles para moverte.",
        "Al este de esta sala hay Estantes de Armas/Herramientas (puedes tomar de ahí las veces que quieras) y, más abajo, un Cofre de Armas y uno de Herramientas con existencias limitadas. Presiona [E] junto a cualquiera.",
        "Abre tu inventario con [I] para equiparte las armas o usar consumibles.",
        "En el Cofre, toca un ítem para ver sus opciones y moverlo hacia tu inventario."
    ],
    msgIndex: 0
};
// A las afueras de la Zona 3, aún del lado de la Zona 1 y debajo de la
// puerta de la arena. Sus misiones viven en systems/quests.js.
export const noviceKnight = {
    id: 'novice_knight', name: 'Caballero Novato', x: 1510, y: 395, w: 36, h: 36,
    interactionRadius: 64,
    messages: [
        'Saludos',
        'Algunos enemigos tienen probabilidad de dar botín especial',
        'Hay que salvar al mundo'
    ]
};
// Distribución inicial del Centro de Mando: cama a la izquierda del spawn,
// Anciano y Hoguera al frente, cofre a su derecha y estaciones debajo.
export const respawnBed   = { x: 220, y: 300, w: 30, h: 24, interactionRadius: 50 };
export const campfire     = { x: 420, y: 300, w: 30, h: 30, interactionRadius: 50 };
export const chestObj      = { x: 470, y: 300, w: 32, h: 26, interactionRadius: 50 };
export const alchemyTable = { x: 420, y: 390, w: 30, h: 30, interactionRadius: 50 };
// Mesa Constructora (punto 2): arma craftable a partir de materiales de
// mob-loot (ver data/mobs.js) — espadas, herramientas y armaduras (ver
// data/recipes.js -> BUILD_RECIPES). Ubicada junto al resto de estaciones
// de crafteo, en un hueco libre de muros de la Zona 1.
export const buildTable    = { x: 500, y: 390, w: 30, h: 30, interactionRadius: 50 };
export const workTables = [ { ...pos(250, 40), w: 40, h: 26 }, { ...pos(310, 40), w: 40, h: 26 }, { ...pos(60, 230), w: 40, h: 26 } ];

export const bocinaVigia = { ...pos(950, 750), w: 34, h: 34, interactionRadius: 55 };

// Mercader — Zona 4 (Ecosistema y Bioma vivo), al lado de la Bocina del Vigía
export const merchant = {
    id: 'merchant', name: 'Mercader', x: 1940, y: 1450, w: 36, h: 36, interactionRadius: 64,
    messages: [
        'Tengo varios articulos utiles',
        'Vendeme todo lo que tengas'
    ]
};

// Recursos renovables de la Zona 4: Ecosistema y Bioma Vivo. Cada nodo se
// puede recolectar cinco veces antes de quedar en recuperación por 3 min.
export const harvestNodes = [
    { id: 'tree-1', type: 'tree', sprite: 'tree', label: 'Árbol', ...pos(240, 430), w: 48, h: 64, interactionRadius: 62, requiredTool: 'hacha', action: 'Talando', drop: 'Madera', uses: 0, maxUses: 5, recoveryUntil: 0 },
    { id: 'tree-2', type: 'tree', sprite: 'tree', label: 'Árbol', ...pos(320, 650), w: 48, h: 64, interactionRadius: 62, requiredTool: 'hacha', action: 'Talando', drop: 'Madera', uses: 0, maxUses: 5, recoveryUntil: 0 },
    { id: 'stone-1', type: 'stone', sprite: 'stone', label: 'Piedra', ...pos(620, 450), w: 44, h: 36, interactionRadius: 58, requiredTool: 'pico', action: 'Minando', drop: 'Piedra', uses: 0, maxUses: 5, recoveryUntil: 0 },
    { id: 'iron-ore-1', type: 'ironOre', sprite: 'ironOre', label: 'Mena de hierro', ...pos(690, 500), w: 44, h: 40, interactionRadius: 58, requiredTool: 'pico', action: 'Minando', drop: 'Mineral de Hierro', uses: 0, maxUses: 5, recoveryUntil: 0 }
];

// Todos los objetos físicos del mapa se concentran aquí. Las interacciones
// continúan usando sus radios propios, pero el jugador no puede atravesar
// NPC, mobiliario, cofres, estantes, recursos ni la Bocina del Vigía.
export function getStaticSolidColliders() {
    return [
        npc, noviceKnight, merchant, respawnBed, campfire, alchemyTable, buildTable, chestObj,
        weaponsChestObj, toolsChestObj, bocinaVigia,
        ...workTables, ...weaponRacks, ...toolRacks, ...harvestNodes
    ];
}
