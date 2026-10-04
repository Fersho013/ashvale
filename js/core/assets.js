/* =====================================================================
   0. ASSET MANAGER
   ===================================================================== */
export const ASSET_PATH = 'assets/';

// Tamaño de dibujo estándar para sprites de personaje (jugador, NPCs).
// Coincide con la resolución nativa de esos assets (48x64) para que se
// dibujen SIN escalar ni deformar. Se pasa como "spriteSize" a drawEntity(),
// que ancla el sprite por los pies sobre el hitbox de colisión — así el
// personaje puede lucir más alto que su hitbox real sin aplastarse dentro
// de él. Si en el futuro cambian de resolución, solo hay que ajustar esto.
export const CHARACTER_SPRITE_SIZE = { w: 48, h: 64 };

export const ASSET_MANIFEST = {
    player:            'player.png',
    // Sprites direccionales del jugador (4 direcciones x 2 frames = caminar)
    player_centro:            'player/player_centro.png',
    player_centro_mov:        'player/player_centro_movimiento.png',
    player_derecha:           'player/player_derecha.png',
    player_derecha_mov:       'player/player_derecha_movimiento.png',
    player_arriba:            'player/player_arriba.png',
    player_arriba_mov:        'player/player_arriba_movimiento.png',
    player_izquierda:         'player/player_izquierda.png',
    player_izquierda_mov:     'player/player_izquierda_movimiento.png',
    npc_elder:         'npc_elder.png',
    goblin:            'goblin.png',
    goblin_capataz:    'goblin_capataz.png',
    wolf:              'wolf.png',
    deer:              'deer.png',
    slime_green:       'slime_green.png',
    slime_big:         'slime_big.png',
    dummy:             'dummy.png',
    // Props del escenario (carpeta assets/props/)
    campfire:          'props/campfire.png',
    alchemy_table:     'props/alchemy_table.png',
    build_table:       'props/build_table.png',
    bed:               'props/bed.png',
    chest:             'props/chest.png',
    work_table:        'props/work_table.png',
    // Puertas (carpeta assets/doors/): frontal = vista tal cual, side = perfil.
    // door = frontal cerrada (compatibilidad con código existente).
    door:              'doors/door_front.png',
    door_front:        'doors/door_front.png',
    door_side:         'doors/door_side.png',
    door_open_front:   'doors/door_open_front.png',
    door_open_side:    'doors/door_open_side.png',
    weapon_espada:     'weapon_espada.png',
    weapon_mandoble:   'weapon_mandoble.png',
    weapon_dagas:      'weapon_dagas.png',
    weapon_arco:       'weapon_arco.png',
    weapon_lanza:      'weapon_lanza.png',
    weapon_especial:   'weapon_especial.png',
    horn:              'props/horn.png',
    tool_hacha:        'tool_hacha.png',
    tool_pico:         'tool_pico.png',
    resource_tree:     'props/tree.png',
    resource_stone:    'props/stone.png',
    resource_iron_ore: 'props/iron_ore.png',
    projectile_arrow:  'projectile_arrow.png',
    projectile_arcane: 'projectile_arcane.png',
    // Pisos (carpeta assets/tiles/): uno por zona/bioma. Los que aún no
    // existen (madera, metal, cristal, piedritas, alcantarilla) caen al
    // fallback de su zona hasta que subas el PNG con ese nombre exacto.
    tile_grass:        'tiles/tile_grass.png',
    tile_stone:        'tiles/tile_stone.png',
    tile_wood:         'tiles/tile_wood.png',
    tile_metal:        'tiles/tile_metal.png',
    tile_glass:        'tiles/tile_glass.png',
    tile_pebble:       'tiles/tile_pebble.png',
    tile_sewer:        'tiles/tile_sewer.png',
    // UI del inventario (carpeta assets/ui/): fondos de slots y paneles.
    // Opcionales: si no existen, se conserva el estilo CSS actual.
    ui_slot:           'ui/slot.png',
    ui_slot_equip:     'ui/slot_equip.png',
    ui_panel:          'ui/panel.png',
    ui_button:         'ui/button.png'
};

// Catálogo visual: una entidad solo necesita referenciar su "sprite". Al
// incorporar arte nuevo se agrega el PNG indicado al manifest y se puede
// ajustar aquí su tamaño, anclaje o fallback sin tocar su lógica de juego.
export const SPRITES = {
    dummy:       { asset: 'dummy',             color: '#95a5a6', shape: 'rect', label: 'D' },
    arenaMob:    { asset: 'goblin',            color: '#c0392b', shape: 'rect', label: 'M' },
    slime:       { asset: 'slime_green',       color: '#2ecc71', shape: 'circle' },
    bigSlime:    { asset: 'slime_big',         color: '#16a085', shape: 'circle' },
    wolf:        { asset: 'wolf',              color: '#7f8c8d', shape: 'rect', label: 'L' },
    deer:        { asset: 'deer',              color: '#d2b48c', shape: 'rect', label: 'C' },
    goblin:      { asset: 'goblin',            color: '#27ae60', shape: 'rect', label: 'G' },
    npc:         { asset: 'npc_elder',         color: '#f1c40f', shape: 'rect', label: 'A', spriteSize: CHARACTER_SPRITE_SIZE },
    bed:         { asset: 'bed',               color: '#ffffff', shape: 'rect' },
    campfire:    { asset: 'campfire',          color: '#e67e22', shape: 'circle' },
    alchemy:     { asset: 'alchemy_table',     color: '#2980b9', shape: 'rect' },
    buildTable:  { asset: 'build_table',       color: '#8d6e4f', shape: 'rect', label: 'M' },
    chest:       { asset: 'chest',             color: '#a0642f', shape: 'rect', label: 'C' },
    workTable:   { asset: 'work_table',        color: '#8d6e4f', shape: 'rect' },
    horn:        { asset: 'horn',              color: '#9b59b6', shape: 'circle', label: 'B' },
    tree:        { asset: 'resource_tree',     color: '#238b45', shape: 'circle' },
    stone:       { asset: 'resource_stone',    color: '#9aa0a6', shape: 'rect' },
    ironOre:     { asset: 'resource_iron_ore', color: '#7f8c8d', shape: 'rect' },
    arrow:       { asset: 'projectile_arrow',  color: '#2ecc71', shape: 'circle' },
    arcaneBolt:  { asset: 'projectile_arcane', color: '#e74c3c', shape: 'circle' }
};

export const Assets = {
    cache: {},
    loadAll() {
        for (const key in ASSET_MANIFEST) {
            const img = new Image();
            img._ready = false;
            img.onload = () => { img._ready = true; };
            img.onerror = () => { img._ready = false; };
            img.src = ASSET_PATH + ASSET_MANIFEST[key];
            this.cache[key] = img;
        }
    },
    get(key) {
        const img = this.cache[key];
        if (img && img._ready) return img;
        return null;
    }
};
Assets.loadAll();

export function drawEntity(ctx, assetKey, x, y, w, h, fallbackColor, shape = 'rect', label = null, spriteSize = null) {
    const img = Assets.get(assetKey);
    if (img) {
        if (spriteSize) {
            // Dibuja al tamaño real del sprite (no al tamaño del hitbox),
            // centrado horizontalmente y apoyado por su base ("pies") sobre
            // el hitbox de colisión. Evita deformar sprites verticales
            // (ej. 48x64) al forzarlos dentro de un hitbox más pequeño.
            const dw = spriteSize.w, dh = spriteSize.h;
            const dx = x + w / 2 - dw / 2;
            const dy = y + h - dh;
            ctx.drawImage(img, dx, dy, dw, dh);
        } else {
            ctx.drawImage(img, x, y, w, h);
        }
    } else {
        ctx.fillStyle = fallbackColor;
        if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(x, y, w, h);
        }
        if (label) {
            ctx.fillStyle = '#000';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w / 2, y + h / 2 + 3);
        }
    }
}

// Punto de entrada para todo renderizado de entidad nueva. `overrides`
// permite efectos temporales (flash de daño, color de estado) sin copiar
// configuraciones de sprite por toda la base de código.
export function drawSprite(ctx, spriteKey, x, y, w, h, overrides = {}) {
    const sprite = SPRITES[spriteKey];
    if (!sprite) {
        drawEntity(ctx, spriteKey, x, y, w, h, overrides.color || '#ff00ff', overrides.shape || 'rect', overrides.label || '?');
        return false;
    }
    drawEntity(
        ctx, sprite.asset, x, y, w, h,
        overrides.color ?? sprite.color,
        overrides.shape ?? sprite.shape,
        overrides.label ?? sprite.label ?? null,
        overrides.spriteSize ?? sprite.spriteSize ?? null
    );
    return !!Assets.get(sprite.asset);
}

export function hasSprite(spriteKey) {
    const sprite = SPRITES[spriteKey];
    return !!sprite && !!Assets.get(sprite.asset);
}

// Iconos de ítems del inventario (carpeta assets/items/): convención
// assets/items/<nombre-normalizado>.png, ej. "Espada Oxidada" ->
// assets/items/espada_oxidada.png, "Madera" -> assets/items/madera.png.
// Carga perezosa: si el PNG existe se usa, si no se conserva el texto.
// Normalización igual que atlas.js para que ambos sistemas coincidan.
export function normalizeItemName(name = '') {
    return String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

const itemIconCache = new Map();
export function getItemIcon(itemName) {
    const key = normalizeItemName(itemName);
    if (!key) return null;
    if (!itemIconCache.has(key)) {
        const img = new Image();
        img._ready = false;
        img.onload = () => { img._ready = true; };
        img.onerror = () => { img._ready = false; };
        img.src = `${ASSET_PATH}items/${key}.png`;
        itemIconCache.set(key, img);
    }
    const img = itemIconCache.get(key);
    return img && img._ready ? img : null;
}
