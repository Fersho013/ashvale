/* =====================================================================
   11. LÓGICA DE ACTUALIZACIÓN (update loop) — combate, mobs e interacción
   ===================================================================== */
import { state } from '../state.js';
import { game } from '../core/gameContext.js';
import { Input } from '../core/input.js';
import { checkRectCollision, dist } from '../core/physics.js';
import { Inventory } from './inventory.js';
import { Slime } from '../entities/mobs.js';
import { Projectile } from '../entities/projectile.js';
import { doors } from '../world/map.js';
import { npc, respawnBed, campfire, alchemyTable, buildTable, chestObj, weaponsChestObj, toolsChestObj, bocinaVigia } from '../world/worldObjects.js';
import { WEAPONS } from '../data/weapons.js';
import { showDialog, dialogState } from '../ui/dialog.js';
import { openCraftPanel } from '../ui/craftingUI.js';
import { openChestPanel } from '../ui/inventoryUI.js';
import { anyModalOpen } from '../ui/menu.js';
import { updateHUD } from '../ui/hud.js';

// Un proyectil solo puede golpear al PRIMER enemigo con el que colisiona
// (Báculo/Arco, ver data/weapons.js). Recorre los grupos de mobs en orden
// y se detiene en el primer impacto.
function checkProjectileHit(p) {
    const world = game.world;
    const groups = [
        { list: world.dummies,    parry: false },
        { list: world.activeMobs, parry: true },
        { list: world.slimes,     parry: false },
        { list: world.wolves,     parry: false },
        { list: world.goblins,    parry: false }
    ];
    for (const { list, parry } of groups) {
        for (const m of list) {
            if (checkRectCollision(p, m)) {
                if (parry) m.takeHit(p.dmg, false); else m.takeHit(p.dmg);
                return true;
            }
        }
    }
    return false;
}

export function update() {
    const player = game.player;
    const world = game.world;
    const camera = game.camera;

    player.update();
    Inventory.updateBuffs();

    world.dummies.forEach(d => d.update());
    world.activeMobs.forEach(m => m.update(player));
    world.slimes.forEach(s => s.update(world.slimes, player));
    const fused = world.slimes.filter(s => s.fused);
    if (fused.length >= 2) {
        const [a, b] = fused;
        world.slimes = world.slimes.filter(s => s !== a && s !== b);
        world.slimes.push(new Slime((a.x + b.x)/2, (a.y + b.y)/2, true));
    }
    world.wolves.forEach(w => w.update(player, world.deers));
    world.deers.forEach(d => d.update(player, world.wolves));
    world.goblins.forEach(g => g.update(player));

    // Báculo/Arco: Player.update() dejó los datos de disparo en
    // pendingProjectile (ver entities/player.js); aquí se crea el
    // Projectile real usando la config del arma equipada.
    if (player.pendingProjectile) {
        const pp = player.pendingProjectile;
        const cfg = WEAPONS[pp.weaponKey].projectile;
        world.projectiles.push(new Projectile({
            x: pp.x, y: pp.y, dirX: pp.dirX, dirY: pp.dirY, dmg: pp.dmg,
            speed: cfg.speed, size: cfg.size, color: cfg.color, rangeBlocks: cfg.rangeBlocks
        }));
        player.pendingProjectile = null;
    }
    world.projectiles.forEach(p => {
        p.update();
        if (!p.hasHit && checkProjectileHit(p)) {
            p.hasHit = true;
            player.bars = Math.min(player.barCapacity, player.bars + 0.5);
        }
    });
    world.projectiles = world.projectiles.filter(p => !p.expired);

    if (player.isAttacking && !player.currentWeapon.ranged) {
        const box = player.getAttackHitbox();
        const dmg = player.attackDamage;
        world.dummies.forEach(d => { if (checkRectCollision(box, d) && d.flash === 0) { d.takeHit(dmg); player.bars = Math.min(player.barCapacity, player.bars + 0.5); } });
        world.activeMobs.forEach(m => { if (checkRectCollision(box, m) && m.flash === 0) { m.takeHit(dmg, false); player.bars = Math.min(player.barCapacity, player.bars + 0.5); } });
        world.slimes.forEach(s => { if (checkRectCollision(box, s) && s.flash === 0) { s.takeHit(dmg); player.bars = Math.min(player.barCapacity, player.bars + 0.5); } });
        world.wolves.forEach(w => { if (checkRectCollision(box, w) && w.flash === 0) { w.takeHit(dmg); player.bars = Math.min(player.barCapacity, player.bars + 0.5); } });
        world.goblins.forEach(g => { if (checkRectCollision(box, g) && g.flash === 0) { g.takeHit(dmg); player.bars = Math.min(player.barCapacity, player.bars + 0.5); } });
    }
    world.slimes = world.slimes.filter(s => s.hp > 0);

    camera.follow(player);

    const eDown = Input.isDown(['KeyE']) || Input.gamepad.buttons.interact || Input.touch.interact;
    let promptText = null;
    let interactTarget = null;
    const modalOpen = anyModalOpen();

    if (!modalOpen) {
        if (dist(player, npc) < npc.interactionRadius) {
            promptText = 'Hablar con el Anciano [E]'; interactTarget = npc;
            if (eDown && !state.actionHeld) { showDialog('Anciano', npc.messages[npc.msgIndex]); npc.msgIndex = (npc.msgIndex + 1) % npc.messages.length; }
        } else if (dist(player, respawnBed) < respawnBed.interactionRadius) {
            promptText = 'Dormir para fijar Respawn [E]'; interactTarget = respawnBed;
            if (eDown && !state.actionHeld) { player.respawn = { x: player.x, y: player.y }; showDialog('Sistema', 'Punto de respawn actualizado.'); }
        } else if (dist(player, campfire) < campfire.interactionRadius) {
            promptText = 'Usar la Hoguera [E]'; interactTarget = campfire;
            if (eDown && !state.actionHeld) openCraftPanel('cook');
        } else if (dist(player, alchemyTable) < alchemyTable.interactionRadius) {
            promptText = 'Usar la Máquina de Pociones [E]'; interactTarget = alchemyTable;
            if (eDown && !state.actionHeld) openCraftPanel('alchemy');
        } else if (dist(player, buildTable) < buildTable.interactionRadius) {
            promptText = 'Usar la Mesa Constructora [E]'; interactTarget = buildTable;
            if (eDown && !state.actionHeld) openCraftPanel('build');
        } else if (dist(player, chestObj) < chestObj.interactionRadius) {
            promptText = 'Abrir Cofre [E]'; interactTarget = chestObj;
            if (eDown && !state.actionHeld) openChestPanel('main');
        } else if (dist(player, weaponsChestObj) < weaponsChestObj.interactionRadius) {
            promptText = 'Abrir Cofre de Armas [E]'; interactTarget = weaponsChestObj;
            if (eDown && !state.actionHeld) openChestPanel('weapons');
        } else if (dist(player, toolsChestObj) < toolsChestObj.interactionRadius) {
            promptText = 'Abrir Cofre de Herramientas [E]'; interactTarget = toolsChestObj;
            if (eDown && !state.actionHeld) openChestPanel('tools');
        } else if (dist(player, bocinaVigia) < bocinaVigia.interactionRadius) {
            promptText = 'Canalizar Bocina del Vigía [E] (5s)'; interactTarget = bocinaVigia;
            if (eDown && !state.actionHeld) player.startChannel();
        } else {
            for (const door of doors) {
                const doorCenter = { x: door.x + door.w/2, y: door.y + door.h/2, w: 1, h: 1 };
                const playerCenter = { x: player.x + player.w/2, y: player.y + player.h/2, w: 1, h: 1 };
                if (dist(doorCenter, playerCenter) < 55) {
                    promptText = (door.open ? 'Cerrar Puerta [E]' : 'Abrir Puerta [E]'); interactTarget = door;
                    if (eDown && !state.actionHeld) door.open = !door.open;
                    break;
                }
            }
        }
    }
    state.actionHeld = eDown;

    const promptEl = document.getElementById('interaction-prompt');
    if (promptText && !modalOpen) { promptEl.style.display = 'block'; promptEl.innerText = promptText; }
    else promptEl.style.display = 'none';

    if (dialogState.timer > 0) { dialogState.timer--; if (dialogState.timer === 0) document.getElementById('dialog-box').style.display = 'none'; }

    updateHUD();
}
