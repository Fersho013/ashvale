/* =====================================================================
   INICIALIZACIÓN Y GAME LOOP — punto de entrada que ensambla todo
   ===================================================================== */
import { state } from './state.js';
import { game } from './core/gameContext.js';
import { Input } from './core/input.js';
import { ScreenManager } from './core/screenManager.js';
import { Camera } from './core/camera.js';
import { drawEntity, CHARACTER_SPRITE_SIZE } from './core/assets.js';
import { Player } from './entities/player.js';
import { DummyMob, ActiveMob, Slime, Wolf, Deer, GoblinExplorer } from './entities/mobs.js';
import { setupDebugPanel, DEBUG } from './systems/debug.js';
import { update } from './systems/worldInteraction.js';
import { buildQuickbarUI } from './ui/hud.js';
import { toggleInventory } from './ui/inventoryUI.js';
import { togglePause } from './ui/pause.js';
import { anyModalOpen, closeAllModals } from './ui/menu.js';
import { ZONES, MAP_W, MAP_H, walls, doors } from './world/map.js';
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

const player = new Player(150, 150);
const camera = new Camera(canvas.width, canvas.height);

const world = {
    dummies: [ new DummyMob(505, 115) ],
    activeMobs: [ new ActiveMob(1050, 200) ],
    slimes: [ new Slime(150, 380), new Slime(190, 400) ],
    wolves: [ new Wolf(400, 500) ],
    deers: [ new Deer(500, 600) ],
    goblins: [ new GoblinExplorer(650, 450) ],
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

    workTables.forEach(t => drawEntity(ctx, 'work_table', t.x, t.y, t.w, t.h, '#8d6e4f', 'rect'));
    drawEntity(ctx, 'npc_elder', npc.x, npc.y, npc.w, npc.h, '#f1c40f', 'rect', 'A', CHARACTER_SPRITE_SIZE);
    drawEntity(ctx, 'bed', respawnBed.x, respawnBed.y, respawnBed.w, respawnBed.h, '#ffffff', 'rect');
    drawEntity(ctx, 'campfire', campfire.x, campfire.y, campfire.w, campfire.h, '#e67e22', 'circle');
    drawEntity(ctx, 'alchemy_table', alchemyTable.x, alchemyTable.y, alchemyTable.w, alchemyTable.h, '#2980b9', 'rect');
    drawEntity(ctx, 'build_table', buildTable.x, buildTable.y, buildTable.w, buildTable.h, '#8d6e4f', 'rect', 'M');
    drawEntity(ctx, 'chest', chestObj.x, chestObj.y, chestObj.w, chestObj.h, '#a0642f', 'rect', 'C');
    drawEntity(ctx, 'chest', weaponsChestObj.x, weaponsChestObj.y, weaponsChestObj.w, weaponsChestObj.h, '#c0392b', 'rect', 'A');
    drawEntity(ctx, 'chest', toolsChestObj.x, toolsChestObj.y, toolsChestObj.w, toolsChestObj.h, '#7f8c8d', 'rect', 'H');

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
        if (node.type === 'tree') {
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

    drawEntity(ctx, 'horn', bocinaVigia.x, bocinaVigia.y, bocinaVigia.w, bocinaVigia.h, '#9b59b6', 'circle', 'B');

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
                update();
            }
            render();
        }
    }
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
