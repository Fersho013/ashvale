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
    player_centro:            'player_centro.png',
    player_centro_mov:        'player_centro_movimiento.png',
    player_derecha:           'player_derecha.png',
    player_derecha_mov:       'player_derecha_movimiento.png',
    player_arriba:            'player_arriba.png',
    player_arriba_mov:        'player_arriba_movimiento.png',
    player_izquierda:         'player_izquierda.png',
    player_izquierda_mov:     'player_izquierda_movimiento.png',
    npc_elder:         'npc_elder.png',
    goblin:            'goblin.png',
    goblin_capataz:    'goblin_capataz.png',
    wolf:              'wolf.png',
    deer:              'deer.png',
    slime_green:       'slime_green.png',
    slime_big:         'slime_big.png',
    dummy:             'dummy.png',
    campfire:          'campfire.png',
    alchemy_table:     'alchemy_table.png',
    build_table:       'build_table.png',
    bed:               'bed.png',
    chest:             'chest.png',
    work_table:        'work_table.png',
    door:              'door.png',
    weapon_espada:     'weapon_espada.png',
    weapon_mandoble:   'weapon_mandoble.png',
    weapon_dagas:      'weapon_dagas.png',
    weapon_arco:       'weapon_arco.png',
    weapon_lanza:      'weapon_lanza.png',
    weapon_especial:   'weapon_especial.png',
    horn:              'bocina_vigia.png',
    tool_hacha:        'tool_hacha.png',
    tool_pico:         'tool_pico.png',
    resource_tree:     'resource_tree.png',
    resource_stone:    'resource_stone.png',
    resource_iron_ore: 'resource_iron_ore.png',
    projectile_arrow:  'projectile_arrow.png',
    projectile_arcane: 'projectile_arcane.png',
    tile_grass:        'tile_grass.png',
    tile_stone:        'tile_stone.png'
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
