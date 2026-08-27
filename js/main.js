/* =====================================================================
   INICIALIZACIÓN Y GAME LOOP — punto de entrada que ensambla todo
   ===================================================================== */
import { state } from './state.js';
import { game } from './core/gameContext.js';
import { Input } from './core/input.js';
import { ScreenManager } from './core/screenManager.js';
import { Camera } from './core/camera.js';
import { drawEntity, drawSprite, hasSprite } from './core/assets.js';
import { Player } from './entities/player.js';
import { DummyMob, ActiveMob, Slime, Wolf, Deer, GoblinExplorer } from './entities/mobs.js';
import { setupDebugPanel, DEBUG } from './systems/debug.js';
import { update } from './systems/worldInteraction.js';
import { buildQuickbarUI } from './ui/hud.js';
import { toggleInventory } from './ui/inventoryUI.js';
import { togglePause } from './ui/pause.js';
import { toggleSkillTree } from './ui/skillTreeUI.js';
import { anyModalOpen, closeAllModals } from './ui/menu.js';
import { ZONES, MAP_W, MAP_H, walls, doors, BIOME_AREAS } from './world/map.js';
import { npc, respawnBed, campfire, alchemyTable, buildTable, chestObj, workTables, weaponsChestObj, toolsChestObj, weaponRacks, toolRacks, bocinaVigia, harvestNodes } from './world/worldObjects.js';
import { WEAPONS } from './data/weapons.js';
import { TOOLS } from './data/tools.js';
import './systems/saveLoad.js';
import './ui/craftingUI.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Pixel art: sin suavizado, o los sprites (incluso a su tamaño nativo) se
// ven borrosos/con halos al reescalar el canvas (resolución, pantalla
// completa, etc.).
ctx.imageSmoothingEnabled = false;

const TUTORIAL_SCALE = 2;
const player = new Player(150 * TUTORIAL_SCALE, 150 * TUTORIAL_SCALE);
const camera = new Camera(canvas.width, canvas.height);

const world = {
    dummies: [ new DummyMob(505 * TUTORIAL_SCALE, 115 * TUTORIAL_SCALE) ],
    activeMobs: [ new ActiveMob(1050 * TUTORIAL_SCALE, 200 * TUTORIAL_SCALE) ],
    // Cada especie comienza y permanece dentro de su bioma específico.
    slimes: [
        new Slime(940, 1430, false, BIOME_AREAS.slimeMarsh), new Slime(1040, 1510, false, BIOME_AREAS.slimeMarsh),
        new Slime(1130, 1410, false, BIOME_AREAS.slimeMarsh), new Slime(1220, 1520, false, BIOME_AREAS.slimeMarsh),
        new Slime(1320, 1430, false, BIOME_AREAS.slimeMarsh), new Slime(1400, 1560, false, BIOME_AREAS.slimeMarsh),
        new Slime(1010, 1640, false, BIOME_AREAS.slimeMarsh), new Slime(1280, 1650, false, BIOME_AREAS.slimeMarsh)
    ],
    wolves: [ new Wolf(360, 940, BIOME_AREAS.forest), new Wolf(610, 1170, BIOME_AREAS.forest) ],
    deers: [ new Deer(520, 1310, BIOME_AREAS.forest), new Deer(680, 1510, BIOME_AREAS.forest), new Deer(390, 1480, BIOME_AREAS.forest) ],
    goblins: [ new GoblinExplorer(1050, 860, BIOME_AREAS.mines), new GoblinExplorer(1300, 1030, BIOME_AREAS.mines), new GoblinExplorer(1430, 800, BIOME_AREAS.mines) ],
    projectiles: [] // proyectiles activos de Báculo/Arco (ver systems/worldInteraction.js)
};

game.canvas = canvas; game.ctx = ctx; game.player = player; game.camera = camera; game.world = world;

buildQuickbarUI();
setupDebugPanel(player, world);

document.addEventListener('keydown', e => {
    if (!state.gameStarted) return;
    if (e.code === 'KeyP') { togglePause(); return; }
    if (e.code === 'Escape') {
        if (anyModalOpen()) closeAllModals();
        else togglePause();
        return;
    }
    if (state.gamePaused) return;
    if (e.code === 'KeyI' || e.code === 'Tab') toggleInventory();
    if (e.code === 'KeyO') toggleSkillTree();
    if (e.code === 'Backquote' || e.code === 'F2') {
        DEBUG.panelOpen = !DEBUG.panelOpen;
        document.getElementById('debug-panel').style.display = DEBUG.panelOpen ? 'block' : 'none';
    }
});

ScreenManager.init('gameCanvas', { virtualWidth: 960, virtualHeight: 540, maintainAspectRatio: false });
ScreenManager.onResize = () => { if (typeof camera !== 'undefined' && camera) { camera.width = canvas.width; camera.height = canvas.height; } };

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    for (const z of ZONES) { ctx.fillStyle = z.color; ctx.fillRect(z.x, z.y, z.w, z.h); }
    for (const biome of Object.values(BIOME_AREAS)) {
        ctx.fillStyle = biome.color; ctx.fillRect(biome.x, biome.y, biome.w, biome.h);
        ctx.strokeStyle = biome.border; ctx.lineWidth = 2; ctx.strokeRect(biome.x, biome.y, biome.w, biome.h);
        ctx.fillStyle = biome.border; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'left';
        ctx.fillText(biome.name, biome.x + 14, biome.y + 26);
    }

    if (DEBUG.showHitboxes) {
        ctx.strokeStyle = '#2a2a2a';
        for (let x = 0; x <= MAP_W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,MAP_H); ctx.stroke(); }
        for (let y = 0; y <= MAP_H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(MAP_W,y); ctx.stroke(); }
    }

    ctx.fillStyle = '#3a3a3a'; ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
    for (const w of walls) { ctx.fillRect(w.x, w.y, w.w, w.h); if (DEBUG.showHitboxes) ctx.strokeRect(w.x, w.y, w.w, w.h); }

    for (const d of doors) {
        drawEntity(ctx, 'door', d.x, d.y, d.w, d.h, d.open ? 'rgba(46,204,113,0.35)' : '#6e4b2a', 'rect');
        if (DEBUG.showHitboxes) { ctx.strokeStyle = d.open ? '#2ecc71' : '#e74c3c'; ctx.strokeRect(d.x, d.y, d.w, d.h); }
    }

    workTables.forEach(t => drawSprite(ctx, 'workTable', t.x, t.y, t.w, t.h));
    drawSprite(ctx, 'npc', npc.x, npc.y, npc.w, npc.h);
    drawSprite(ctx, 'bed', respawnBed.x, respawnBed.y, respawnBed.w, respawnBed.h);
    drawSprite(ctx, 'campfire', campfire.x, campfire.y, campfire.w, campfire.h);
    drawSprite(ctx, 'alchemy', alchemyTable.x, alchemyTable.y, alchemyTable.w, alchemyTable.h);
    drawSprite(ctx, 'buildTable', buildTable.x, buildTable.y, buildTable.w, buildTable.h);
    drawSprite(ctx, 'chest', chestObj.x, chestObj.y, chestObj.w, chestObj.h);
    drawSprite(ctx, 'chest', weaponsChestObj.x, weaponsChestObj.y, weaponsChestObj.w, weaponsChestObj.h, { color: '#c0392b', label: 'A' });
    drawSprite(ctx, 'chest', toolsChestObj.x, toolsChestObj.y, toolsChestObj.w, toolsChestObj.h, { color: '#7f8c8d', label: 'H' });

    for (const rack of weaponRacks) {
        const w = WEAPONS[rack.weapon];
        drawEntity(ctx, w.asset, rack.x, rack.y, rack.w, rack.h, w.color, 'rect', w.name[0]);
    }
    for (const rack of toolRacks) {
        const t = TOOLS[rack.tool];
        drawEntity(ctx, t.asset, rack.x, rack.y, rack.w, rack.h, t.color, 'rect', t.name[0]);
    }

    // Recursos del Ecosistema y Bioma Vivo. Se dibujan con formas simples
    // para no requerir assets adicionales y poder distinguirlos claramente.
    for (const node of harvestNodes) {
        const recovering = Date.now() < node.recoveryUntil;
        ctx.globalAlpha = recovering ? 0.35 : 1;
        if (hasSprite(node.sprite)) {
            drawSprite(ctx, node.sprite, node.x, node.y, node.w, node.h);
        } else if (node.type === 'tree') {
            ctx.fillStyle = '#6e4b2a';
            ctx.fillRect(node.x + 18, node.y + 30, 12, 34);
            ctx.fillStyle = '#238b45';
            ctx.beginPath(); ctx.arc(node.x + 24, node.y + 23, 23, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = node.type === 'ironOre' ? '#7f8c8d' : '#9aa0a6';
            ctx.beginPath(); ctx.moveTo(node.x + 4, node.y + node.h); ctx.lineTo(node.x + 10, node.y + 8); ctx.lineTo(node.x + 32, node.y + 2); ctx.lineTo(node.x + node.w, node.y + 20); ctx.lineTo(node.x + 36, node.y + node.h); ctx.closePath(); ctx.fill();
            if (node.type === 'ironOre') { ctx.fillStyle = '#d35400'; ctx.fillRect(node.x + 17, node.y + 16, 8, 8); }
        }
        ctx.globalAlpha = 1;
    }

    world.dummies.forEach(d => d.draw(ctx));
    world.activeMobs.forEach(m => m.draw(ctx));
    world.slimes.forEach(s => s.draw(ctx));
    world.wolves.forEach(w => w.draw(ctx));
    world.deers.forEach(d => d.draw(ctx));
    world.goblins.forEach(g => g.draw(ctx));

    drawSprite(ctx, 'horn', bocinaVigia.x, bocinaVigia.y, bocinaVigia.w, bocinaVigia.h);

    world.projectiles.forEach(p => p.draw(ctx));

    player.draw(ctx);

    ctx.restore();
}

let lastTime = 0;
const frameInterval = 1000 / 60;
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;
    if (elapsed >= frameInterval) {
        lastTime = timestamp - (elapsed % frameInterval);
        if (state.gameStarted) {
            Input.pollGamepad();
            if (Input.gamepad.justPressed.pause) togglePause();
            if (!state.gamePaused) {
                if (Input.gamepad.justPressed.inventory) toggleInventory();
                if (Input.gamepad.justPressed.skillTree) toggleSkillTree();
                update();
            }
            render();
        }
    }
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
