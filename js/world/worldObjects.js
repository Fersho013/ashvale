/* =====================================================================
   OBJETOS DEL MUNDO: NPC, mobiliario interactuable y cofres
   ===================================================================== */
// Cofre de Armas y Cofre de Herramientas (punto 2): mismo patrón que el
// Cofre original (chestObj) — cada uno abre su propio almacenamiento (ver
// Inventory.chests en systems/inventory.js) en vez de ser una fuente
// infinita como los antiguos estantes/racks.
export const weaponsChestObj = { x: 440, y: 40,  w: 32, h: 26, interactionRadius: 50 };
export const toolsChestObj   = { x: 250, y: 110, w: 32, h: 26, interactionRadius: 50 };

export const npc = {
    x: 80, y: 60, w: 36, h: 36, interactionRadius: 60,
    messages: [
        "¡Bienvenido al Sandbox de Ashvale! Usa WASD o los controles táctiles para moverte.",
        "Al este de esta sala hay un Cofre de Armas y un Cofre de Herramientas. Acércate y presiona [E] para abrirlos y elegir qué llevarte.",
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
