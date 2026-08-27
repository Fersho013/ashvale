/* Atlas compatible con Aseprite, TexturePacker y free-tex-packer. */
const ATLAS_PATH = 'assets/atlases/';

export const ATLAS_MANIFEST = {
    player: { image: 'player.png', data: 'player.json' }, wolf: { image: 'wolf.png', data: 'wolf.json' },
    dummy: { image: 'dummy.png', data: 'dummy.json' },
    slime: { image: 'slime.png', data: 'slime.json' }, bigSlime: { image: 'big_slime.png', data: 'big_slime.json' },
    goblin: { image: 'goblin.png', data: 'goblin.json' }, goblinForeman: { image: 'goblin_foreman.png', data: 'goblin_foreman.json' },
    arenaMob: { image: 'arena_mob.png', data: 'arena_mob.json' }, deer: { image: 'deer.png', data: 'deer.json' },
    npc: { image: 'npc.png', data: 'npc.json' }, world: { image: 'world.png', data: 'world.json' },
    weapons: { image: 'weapons.png', data: 'weapons.json' }, ui: { image: 'ui.png', data: 'ui.json' }
};

export const ANIMATION_CONTRACT = {
    player: { directions: ['down', 'up', 'left', 'right'], animations: [
        'idle', 'move', 'attack_sword', 'skill_sword_thrust', 'skill_sword_storm',
        'attack_greatsword', 'skill_greatsword_earthsplitter', 'skill_greatsword_cataclysm',
        'attack_dual_blades', 'skill_dual_cross_slash', 'skill_dual_steel_frenzy',
        'attack_bow', 'skill_bow_piercing_shot', 'skill_bow_thorn_rain',
        'attack_spear', 'skill_spear_phalanx_charge', 'skill_spear_impaling_whirlwind',
        'attack_staff', 'skill_staff_aether_projectile', 'skill_staff_void_vortex'
    ] },
    dummy: { directions: ['down', 'up', 'left', 'right'], animations: ['idle'] },
    wolf: { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move', 'attack'] },
    slime: { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move', 'attack'] },
    bigSlime: { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move', 'attack'] },
    goblin: { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move', 'attack'] },
    goblinForeman: { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move', 'attack'] },
    arenaMob: { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move', 'attack'] },
    deer: { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move'] },
    npc: { directions: ['down', 'up', 'left', 'right'], animations: ['idle', 'move'] },
    world: { frames: ['ground', 'wall', 'door', 'tree', 'stone', 'iron_ore', 'bed', 'campfire', 'alchemy_table', 'build_table', 'chest', 'work_table', 'horn'] },
    weapons: { frames: ['sword', 'greatsword', 'dual_blades', 'bow', 'spear', 'staff', 'axe', 'pickaxe', 'arrow', 'arcane_bolt'] },
    ui: { frames: ['main_menu_bg', 'panel', 'dialog', 'button', 'slot', 'skill_node', 'tooltip', 'gold_icon', 'hp_bar', 'skill_bar', 'touch_button'] }
};

// Tamaños de presentación independientes de los hitboxes. Ajusta únicamente
// esta tabla si el arte final de un personaje es más alto/ancho que su área
// de colisión; todos se anclan por los pies.
export const ATLAS_DISPLAY_SIZES = {
    player: { w: 48, h: 64 }, dummy: { w: 42, h: 48 }, wolf: { w: 48, h: 48 }, slime: { w: 32, h: 32 },
    bigSlime: { w: 48, h: 48 }, goblin: { w: 42, h: 48 }, goblinForeman: { w: 48, h: 52 },
    arenaMob: { w: 44, h: 50 }, deer: { w: 44, h: 46 }, npc: { w: 48, h: 64 }
};

// "Personaje/idle-down_0.png" y "idle down 0" se resuelven igual.
export function normalizeAtlasName(name = '') {
    return String(name).replace(/\\/g, '/').split('/').pop().replace(/\.[^/.]+$/, '').trim().toLowerCase()
        .replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function normalizeFrames(data) {
    const raw = data?.frames || {};
    const pairs = Array.isArray(raw) ? raw.map((frame, index) => [frame.filename || frame.name || `${index}`, frame]) : Object.entries(raw);
    return pairs.map(([rawName, source], index) => ({ rawName, name: normalizeAtlasName(rawName), index,
        rect: source.frame || source, duration: Math.max(1, Number(source.duration) || 100) }))
        .filter(frame => frame.rect && Number.isFinite(frame.rect.x) && Number.isFinite(frame.rect.y));
}

function animationFrames(data, frames) {
    const animations = new Map();
    for (const tag of data?.meta?.frameTags || []) {
        const from = Math.min(tag.from, tag.to), to = Math.max(tag.from, tag.to);
        animations.set(normalizeAtlasName(tag.name), frames.filter(frame => frame.index >= from && frame.index <= to));
    }
    return animations;
}

const atlasCache = new Map();
const atlasListeners = new Set();
const notifyAtlasReady = id => atlasListeners.forEach(listener => listener(id));

async function loadAtlas(id, descriptor) {
    try {
        const [data, image] = await Promise.all([
            fetch(ATLAS_PATH + descriptor.data).then(response => { if (!response.ok) throw new Error(descriptor.data); return response.json(); }),
            new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error(descriptor.image)); img.src = ATLAS_PATH + descriptor.image; })
        ]);
        const frames = normalizeFrames(data);
        atlasCache.set(id, { image, frames, animations: animationFrames(data, frames), ready: true }); notifyAtlasReady(id);
    } catch (_) { atlasCache.set(id, { ready: false }); }
}

export function loadAtlases() { Object.entries(ATLAS_MANIFEST).forEach(([id, descriptor]) => loadAtlas(id, descriptor)); }

function resolveFrames(atlas, animation, direction) {
    const base = normalizeAtlasName(animation), dir = direction ? normalizeAtlasName(direction) : '';
    const candidates = dir ? [`${base}_${dir}`, `${dir}_${base}`, base] : [base];
    for (const candidate of candidates) {
        if (atlas.animations.has(candidate)) return atlas.animations.get(candidate);
        const prefix = `${candidate}_`;
        const found = atlas.frames.filter(frame => frame.name === candidate || frame.name.startsWith(prefix));
        if (found.length) return found.sort((a, b) => a.index - b.index);
    }
    return [];
}

function selectTimedFrame(frames, timeMs) {
    const cycle = frames.reduce((total, frame) => total + frame.duration, 0) || 1;
    let cursor = ((timeMs % cycle) + cycle) % cycle;
    for (const frame of frames) { cursor -= frame.duration; if (cursor < 0) return frame; }
    return frames[frames.length - 1];
}

function drawFrame(ctx, image, frame, x, y, w, h, { anchor = 'center', spriteSize = null } = {}) {
    const dw = spriteSize?.w || w, dh = spriteSize?.h || h;
    const dx = anchor === 'feet' ? x + w / 2 - dw / 2 : x + (w - dw) / 2;
    const dy = anchor === 'feet' ? y + h - dh : y + (h - dh) / 2;
    ctx.drawImage(image, frame.rect.x, frame.rect.y, frame.rect.w, frame.rect.h, dx, dy, dw, dh);
}

export function drawAtlasAnimation(ctx, atlasId, animation, direction, timeMs, x, y, w, h, options = {}) {
    const atlas = atlasCache.get(atlasId); if (!atlas?.ready) return false;
    const frames = resolveFrames(atlas, animation, direction); if (!frames.length) return false;
    drawFrame(ctx, atlas.image, selectTimedFrame(frames, timeMs), x, y, w, h, options); return true;
}

export function drawAtlasFrame(ctx, atlasId, frameName, x, y, w, h, options = {}) {
    const atlas = atlasCache.get(atlasId); if (!atlas?.ready) return false;
    const frame = resolveFrames(atlas, frameName)[0]; if (!frame) return false;
    drawFrame(ctx, atlas.image, frame, x, y, w, h, options); return true;
}

export function drawAtlasTiled(ctx, atlasId, frameName, x, y, w, h, tileW, tileH) {
    const atlas = atlasCache.get(atlasId); if (!atlas?.ready) return false;
    const frame = resolveFrames(atlas, frameName)[0]; if (!frame) return false;
    for (let py = y; py < y + h; py += tileH) for (let px = x; px < x + w; px += tileW) {
        ctx.drawImage(atlas.image, frame.rect.x, frame.rect.y, frame.rect.w, frame.rect.h, px, py, Math.min(tileW, x + w - px), Math.min(tileH, y + h - py));
    }
    return true;
}

export function getAtlasFrame(atlasId, frameName) {
    const atlas = atlasCache.get(atlasId); if (!atlas?.ready) return null;
    const frame = resolveFrames(atlas, frameName)[0]; return frame ? { image: atlas.image, frame: frame.rect } : null;
}

export function applyAtlasFrameToElement(element, atlasId, frameName) {
    const atlas = atlasCache.get(atlasId), entry = getAtlasFrame(atlasId, frameName);
    if (!element || !atlas?.ready || !entry) return false;
    element.dataset.uiSprite = normalizeAtlasName(frameName);
    element.style.backgroundImage = `url("${atlas.image.src}")`;
    element.style.backgroundSize = `${atlas.image.naturalWidth}px ${atlas.image.naturalHeight}px`;
    element.style.backgroundPosition = `-${entry.frame.x}px -${entry.frame.y}px`;
    element.style.backgroundRepeat = 'no-repeat'; return true;
}

export function onAtlasReady(listener) { atlasListeners.add(listener); for (const [id, atlas] of atlasCache) if (atlas.ready) listener(id); return () => atlasListeners.delete(listener); }
loadAtlases();
