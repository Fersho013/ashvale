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
    dummy:             'dummy.png',
    campfire:          'campfire.png',
    alchemy_table:     'alchemy_table.png',
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
    tile_grass:        'tile_grass.png',
    tile_stone:        'tile_stone.png'
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
