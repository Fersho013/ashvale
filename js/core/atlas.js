/* =====================================================================
   ATLAS DE SPRITES — compatible con TexturePacker / Aseprite

   Coloca cada pareja PNG + JSON en assets/atlases/. El JSON puede usar
   `frames` como objeto o array y, opcionalmente, `meta.frameTags` de
   Aseprite. Las animaciones se resuelven por frameTag o por prefijo:
   `attack_sword_down_0`, `attack_sword_down_1`, etc.
   ===================================================================== */
const ATLAS_PATH = 'assets/atlases/';

export const ATLAS_MANIFEST = {
    player:   { image: 'player.png',   data: 'player.json' },
    wolf:     { image: 'wolf.png',     data: 'wolf.json' },
    slime:    { image: 'slime.png',    data: 'slime.json' },
    bigSlime: { image: 'big_slime.png', data: 'big_slime.json' },
    goblin:   { image: 'goblin.png',   data: 'goblin.json' },
    arenaMob: { image: 'arena_mob.png', data: 'arena_mob.json' },
    deer:     { image: 'deer.png',     data: 'deer.json' },
    world:    { image: 'world.png',    data: 'world.json' },
    weapons:  { image: 'weapons.png',  data: 'weapons.json' },
    ui:       { image: 'ui.png',       data: 'ui.json' }
};

// Contrato de exportación para los autores de arte. Cada dirección usa
// down/up/left/right. Las habilidades pueden tener tantos frames como se
// necesiten; basta que todos compartan el mismo prefijo.
export const ANIMATION_CONTRACT = {
    player: {
        directions: ['down', 'up', 'left', 'right'],
        animations: [
            'idle', 'move',
            'attack_sword', 'skill_sword_thrust', 'skill_sword_storm',
            'attack_greatsword', 'skill_greatsword_earthsplitter', 'skill_greatsword_cataclysm',
            'attack_dual_blades', 'skill_dual_cross_slash', 'skill_dual_steel_frenzy',
            'attack_bow', 'skill_bow_piercing_shot', 'skill_bow_thorn_rain',
            'attack_spear', 'skill_spear_phalanx_charge', 'skill_spear_impaling_whirlwind',
            'attack_staff', 'skill_staff_aether_projectile', 'skill_staff_void_vortex'
        ]
    },
    wolf:     { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move', 'attack'] },
    slime:    { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move', 'attack'] },
    bigSlime: { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move', 'attack'] },
    goblin:   { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move', 'attack'] },
    arenaMob: { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move', 'attack'] },
    deer:     { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move'] },
    world:    { frames: ['tree', 'stone', 'iron_ore', 'ground', 'wall', 'door', 'bed', 'campfire', 'alchemy_table', 'build_table', 'chest', 'work_table', 'horn'] },
    weapons:  { frames: ['sword', 'greatsword', 'dual_blades', 'bow', 'spear', 'staff', 'axe', 'pickaxe', 'arrow', 'arcane_bolt'] },
    ui:       { frames: ['main_menu_bg', 'panel', 'dialog', 'button', 'slot', 'skill_node', 'tooltip', 'gold_icon', 'hp_bar', 'skill_bar', 'touch_button'] }
};

function normalizeFrames(data) {
    const rawFrames = data?.frames || {};
    const source = Array.isArray(rawFrames)
        ? rawFrames.map((frame, index) => [frame.filename || `${index}`, frame])
        : Object.entries(rawFrames);
    return source.map(([name, source], index) => ({
        name,
        index,
        rect: source.frame || source,
        duration: source.duration || 100
    })).filter(frame => frame.rect && Number.isFinite(frame.rect.x));
}

function animationFrames(data, frames) {
    const tags = data?.meta?.frameTags || [];
    const animations = new Map();
    for (const tag of tags) {
        const from = Math.min(tag.from, tag.to), to = Math.max(tag.from, tag.to);
        animations.set(tag.name, frames.filter(frame => frame.index >= from && frame.index <= to));
    }
    return animations;
}

const atlasCache = new Map();
const atlasListeners = new Set();

function notifyAtlasReady(id) {
    for (const listener of atlasListeners) listener(id);
}

async function loadAtlas(id, descriptor) {
    try {
        const [data, image] = await Promise.all([
            fetch(ATLAS_PATH + descriptor.data).then(response => {
                if (!response.ok) throw new Error(`No se encontró ${descriptor.data}`);
                return response.json();
            }),
            new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error(`No se encontró ${descriptor.image}`));
                img.src = ATLAS_PATH + descriptor.image;
            })
        ]);
        const frames = normalizeFrames(data);
        atlasCache.set(id, { image, frames, animations: animationFrames(data, frames), ready: true });
        notifyAtlasReady(id);
    } catch (_) {
        // Los atlas son opcionales durante la migración: el renderer de
        // respaldo mantiene el juego funcional hasta que exista el arte.
        atlasCache.set(id, { ready: false });
    }
}

export function loadAtlases() {
    Object.entries(ATLAS_MANIFEST).forEach(([id, descriptor]) => loadAtlas(id, descriptor));
}

function resolveFrames(atlas, animation, direction) {
    const candidates = direction ? [`${animation}_${direction}`, `${direction}_${animation}`, animation] : [animation];
    for (const name of candidates) {
        if (atlas.animations.has(name)) return atlas.animations.get(name);
        const prefix = `${name}_`;
        const found = atlas.frames.filter(frame => frame.name === name || frame.name.startsWith(prefix));
        if (found.length) return found;
    }
    return [];
}

export function drawAtlasAnimation(ctx, atlasId, animation, direction, tick, x, y, w, h, anchor = 'center') {
    const atlas = atlasCache.get(atlasId);
    if (!atlas?.ready) return false;
    const frames = resolveFrames(atlas, animation, direction);
    if (!frames.length) return false;
    const frame = frames[Math.floor(tick / 6) % frames.length];
    const { x: sx, y: sy, w: sw, h: sh } = frame.rect;
    const dy = anchor === 'feet' ? y + h - h : y;
    ctx.drawImage(atlas.image, sx, sy, sw, sh, x, dy, w, h);
    return true;
}

export function getAtlasFrame(atlasId, frameName) {
    const atlas = atlasCache.get(atlasId);
    if (!atlas?.ready) return null;
    const frame = atlas.frames.find(entry => entry.name === frameName || entry.name.startsWith(`${frameName}_`));
    return frame ? { image: atlas.image, frame: frame.rect } : null;
}

// Útil para menús DOM: aplica un frame del atlas como fondo CSS sin crear
// una imagen independiente por panel, botón, slot o cuadro de diálogo.
export function applyAtlasFrameToElement(element, atlasId, frameName) {
    const atlas = atlasCache.get(atlasId);
    const entry = getAtlasFrame(atlasId, frameName);
    if (!element || !atlas?.ready || !entry) return false;
    const { x, y } = entry.frame;
    element.dataset.uiSprite = frameName;
    element.style.backgroundImage = `url("${atlas.image.src}")`;
    element.style.backgroundSize = `${atlas.image.naturalWidth}px ${atlas.image.naturalHeight}px`;
    element.style.backgroundPosition = `-${x}px -${y}px`;
    element.style.backgroundRepeat = 'no-repeat';
    return true;
}

export function onAtlasReady(listener) {
    atlasListeners.add(listener);
    for (const [id, atlas] of atlasCache) if (atlas.ready) listener(id);
    return () => atlasListeners.delete(listener);
}

loadAtlases();
