/* =====================================================================
   3. MAPA Y ZONAS (1200x900)
   ===================================================================== */
export const MAP_W = 1200, MAP_H = 900;

export const ZONES = [
    { id: 1, name: 'Zona 1: Centro de Mando y Spawn', x: 0,   y: 0,   w: 400, h: 300, color: 'rgba(46,204,113,0.05)' },
    { id: 2, name: 'Zona 2: Galería de Armas y Habilidades', x: 400, y: 0,   w: 400, h: 300, color: 'rgba(52,152,219,0.05)' },
    { id: 3, name: 'Zona 3: Laboratorio de Combate', x: 800, y: 0,   w: 400, h: 300, color: 'rgba(231,76,60,0.05)' },
    { id: 4, name: 'Zona 4: Ecosistema y Bioma Vivo', x: 0,   y: 300, w: 800, h: 600, color: 'rgba(39,174,96,0.06)' },
    { id: 5, name: 'Zona 5: Escape y Portales', x: 800, y: 300, w: 400, h: 600, color: 'rgba(155,89,182,0.06)' }
];

export function getCurrentZone(entity) {
    const cx = entity.x + entity.w / 2, cy = entity.y + entity.h / 2;
    for (const z of ZONES) {
        if (cx >= z.x && cx < z.x + z.w && cy >= z.y && cy < z.y + z.h) return z;
    }
    return ZONES[0];
}

export const walls = [
    { x: 0, y: 0, w: MAP_W, h: 20 },
    { x: 0, y: MAP_H - 20, w: MAP_W, h: 20 },
    { x: 0, y: 0, w: 20, h: MAP_H },
    { x: MAP_W - 20, y: 0, w: 20, h: MAP_H },
    { x: 400, y: 0,   w: 15, h: 120 },
    { x: 400, y: 180, w: 15, h: 120 },
    { x: 800, y: 0,   w: 15, h: 120 },
    { x: 800, y: 180, w: 15, h: 120 },
    { x: 0,   y: 300, w: 170, h: 15 },
    { x: 230, y: 300, w: 340, h: 15 },
    { x: 630, y: 300, w: 170, h: 15 },
    { x: 800, y: 300, w: 15, h: 270 },
    { x: 800, y: 630, w: 15, h: 270 },
    { x: 800, y: 300, w: 150, h: 15 },
    { x: 1010,y: 300, w: 190, h: 15 },
];

export const doors = [
    { id: 'D12', name: 'Puerta Zona 1 ↔ Zona 2', x: 400, y: 120, w: 15, h: 60, open: false },
    { id: 'D23', name: 'Puerta Zona 2 ↔ Zona 3', x: 800, y: 120, w: 15, h: 60, open: false },
    { id: 'D14', name: 'Puerta Zona 1 ↔ Zona 4', x: 170, y: 300, w: 60, h: 15, open: false },
    { id: 'D24', name: 'Puerta Zona 2 ↔ Zona 4', x: 570, y: 300, w: 60, h: 15, open: false },
    { id: 'D45', name: 'Puerta Zona 4 ↔ Zona 5', x: 800, y: 570, w: 15, h: 60, open: false },
    { id: 'D35', name: 'Puerta Zona 3 ↔ Zona 5', x: 950, y: 300, w: 60, h: 15, open: false },
];

export function getActiveWalls() {
    return walls.concat(doors.filter(d => !d.open));
}

// Zona 3 se usa como "arena" de pruebas para los mobs de combate: los
// mantiene contenidos dentro de sus límites.
export const ZONE3_BOUNDS = ZONES[2];
export function clampToZone3(entity, margin = 10) {
    entity.x = Math.max(ZONE3_BOUNDS.x + margin, Math.min(ZONE3_BOUNDS.x + ZONE3_BOUNDS.w - entity.w - margin, entity.x));
    entity.y = Math.max(ZONE3_BOUNDS.y + margin, Math.min(ZONE3_BOUNDS.y + ZONE3_BOUNDS.h - entity.h - margin, entity.y));
}
