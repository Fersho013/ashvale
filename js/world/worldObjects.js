/* =====================================================================
   OBJETOS DEL MUNDO: NPC, mobiliario interactuable y galería de armas
   ===================================================================== */
export const weaponRacks = [
    { x: 440, y: 40,  w: 34, h: 34, weapon: 'espada' },
    { x: 520, y: 40,  w: 34, h: 34, weapon: 'mandoble' },
    { x: 600, y: 40,  w: 34, h: 34, weapon: 'dagas' },
    { x: 440, y: 200, w: 34, h: 34, weapon: 'arco' },
    { x: 520, y: 200, w: 34, h: 34, weapon: 'lanza' },
    { x: 600, y: 200, w: 34, h: 34, weapon: 'baculo' }
];

// Cofre de Herramientas: mismo patrón de "tomar item" que weaponRacks, pero
// para herramientas de recolección (ver data/tools.js). Ubicado en Zona 1,
// junto a las mesas de trabajo, sin invadir muros ni la puerta D12.
export const toolRacks = [
    { x: 250, y: 110, w: 34, h: 34, tool: 'hacha' },
    { x: 310, y: 110, w: 34, h: 34, tool: 'pico' }
];

export const npc = {
    x: 80, y: 60, w: 36, h: 36, interactionRadius: 60,
    messages: [
        "¡Bienvenido al Sandbox de Ashvale! Usa WASD o los controles táctiles para moverte.",
        "Zona 2 (este): Galería de Armas. Acércate y presiona [E] para tomar armas como ítems.",
        "Abre tu inventario con [I] para equiparte las armas o usar consumibles.",
        "En el Cofre, toca un ítem para ver sus opciones y moverlo hacia tu inventario."
    ],
    msgIndex: 0
};
export const respawnBed   = { x: 160, y: 60,  w: 30, h: 24, interactionRadius: 50 };
export const campfire     = { x: 80,  y: 160, w: 30, h: 30, interactionRadius: 50 };
export const alchemyTable = { x: 160, y: 160, w: 30, h: 30, interactionRadius: 50 };
export const chestObj      = { x: 250, y: 160, w: 32, h: 26, interactionRadius: 50 };
export const workTables = [ { x: 250, y: 40, w: 40, h: 26 }, { x: 310, y: 40, w: 40, h: 26 }, { x: 60, y: 230, w: 40, h: 26 } ];

export const bocinaVigia = { x: 950, y: 750, w: 34, h: 34, interactionRadius: 55 };
