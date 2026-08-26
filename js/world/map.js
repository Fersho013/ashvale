/* =====================================================================
   3. MAPA Y ZONAS (2400x1800)
   ===================================================================== */
// La ampliación duplica el plano del tutorial en ambos ejes. El tamaño de
// entidades, sprites y bloques de combate se mantiene: así hay más terreno
// explorable sin convertir al jugador, objetos o ataques en gigantes.
export const TUTORIAL_SCALE = 2;
export const MAP_W = 1200 * TUTORIAL_SCALE, MAP_H = 900 * TUTORIAL_SCALE;
// Unidad de "bloque" usada para alcances (ver data/weapons.js -> projectile.rangeBlocks)
// y para la grilla de depuración (coincide con el paso de 60px ya usado en main.js).
export const BLOCK_SIZE = 60;

export const ZONES = [
    { id: 1, name: 'Zona 1: Centro de Mando y Galería de Armas', x: 0,    y: 0,   w: 1600, h: 600,  color: 'rgba(46,204,113,0.05)' },
    { id: 3, name: 'Zona 3: Laboratorio de Combate', x: 1600, y: 0,   w: 800,  h: 600,  color: 'rgba(231,76,60,0.05)' },
    { id: 4, name: 'Zona 4: Ecosistema y Bioma Vivo', x: 0,    y: 600, w: 1600, h: 1200, color: 'rgba(39,174,96,0.06)' },
    { id: 5, name: 'Zona 5: Escape y Portales', x: 1600, y: 600, w: 800,  h: 1200, color: 'rgba(155,89,182,0.06)' }
];

export function getCurrentZone(entity) {
    const cx = entity.x + entity.w / 2, cy = entity.y + entity.h / 2;
    for (const z of ZONES) {
        if (cx >= z.x && cx < z.x + z.w && cy >= z.y && cy < z.y + z.h) return z;
    }
    return ZONES[0];
}

export const walls = [
    { x: 0, y: 0, w: MAP_W, h: 40 },
    { x: 0, y: MAP_H - 40, w: MAP_W, h: 40 },
    { x: 0, y: 0, w: 40, h: MAP_H },
    { x: MAP_W - 40, y: 0, w: 40, h: MAP_H },
    { x: 1600, y: 0,   w: 30, h: 240 },
    { x: 1600, y: 360, w: 30, h: 240 },
    { x: 0,    y: 600, w: 340, h: 30 },
    { x: 460,  y: 600, w: 680, h: 30 },
    { x: 1260, y: 600, w: 340, h: 30 },
    { x: 1600, y: 600, w: 30, h: 540 },
    { x: 1600, y: 1260, w: 30, h: 540 },
    { x: 1600, y: 600, w: 300, h: 30 },
    { x: 2020, y: 600, w: 380, h: 30 },
];

export const doors = [
    { id: 'D23', name: 'Puerta Zona 1 ↔ Zona 3', x: 1600, y: 240, w: 30, h: 120, open: false },
    { id: 'D14', name: 'Puerta Zona 1 ↔ Zona 4 (Oeste)', x: 340, y: 600, w: 120, h: 30, open: false },
    { id: 'D24', name: 'Puerta Zona 1 ↔ Zona 4 (Este)', x: 1140, y: 600, w: 120, h: 30, open: false },
    { id: 'D45', name: 'Puerta Zona 4 ↔ Zona 5', x: 1600, y: 1140, w: 30, h: 120, open: false },
    { id: 'D35', name: 'Puerta Zona 3 ↔ Zona 5', x: 1900, y: 600, w: 120, h: 30, open: false },
];

export function getActiveWalls() {
    return walls.concat(doors.filter(d => !d.open));
}

// Zona 3 se usa como "arena" de pruebas para los mobs de combate: los
// mantiene contenidos dentro de sus límites. Se busca por "id" (no por
// posición en el array) para no depender de cuántas zonas haya antes.
export const ZONE3_BOUNDS = ZONES.find(z => z.id === 3);
export function clampToZone3(entity, margin = 10) {
    entity.x = Math.max(ZONE3_BOUNDS.x + margin, Math.min(ZONE3_BOUNDS.x + ZONE3_BOUNDS.w - entity.w - margin, entity.x));
    entity.y = Math.max(ZONE3_BOUNDS.y + margin, Math.min(ZONE3_BOUNDS.y + ZONE3_BOUNDS.h - entity.h - margin, entity.y));
}

// El ecosistema conserva sus límites propios aunque el mapa haya crecido;
// mobs y futuros spawns pueden usar esta función sin posiciones mágicas.
export const ZONE4_BOUNDS = ZONES.find(z => z.id === 4);
export function clampToZone4(entity, margin = 10) {
    entity.x = Math.max(ZONE4_BOUNDS.x + margin, Math.min(ZONE4_BOUNDS.x + ZONE4_BOUNDS.w - entity.w - margin, entity.x));
    entity.y = Math.max(ZONE4_BOUNDS.y + margin, Math.min(ZONE4_BOUNDS.y + ZONE4_BOUNDS.h - entity.h - margin, entity.y));
}
