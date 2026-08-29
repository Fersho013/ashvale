/* =====================================================================
   11. LÓGICA DE ACTUALIZACIÓN (update loop) — combate, mobs e interacción
   ===================================================================== */
import { state } from '../state.js';
import { game } from '../core/gameContext.js';
import { Input } from '../core/input.js';
import { checkRectCollision, dist } from '../core/physics.js';
import { Inventory, grantMobLoot } from './inventory.js';
import { Slime } from '../entities/mobs.js';
import { Projectile } from '../entities/projectile.js';
import { doors } from '../world/map.js';
import { npc, noviceKnight, respawnBed, campfire, alchemyTable, buildTable, chestObj, weaponsChestObj, toolsChestObj, weaponRacks, toolRacks, bocinaVigia, harvestNodes } from '../world/worldObjects.js';
import { WEAPONS } from '../data/weapons.js';
import { TOOLS } from '../data/tools.js';
import { showDialog, showNpcDialogue, updateDialog } from '../ui/dialog.js';
import { openCraftPanel } from '../ui/craftingUI.js';
import { openChestPanel } from '../ui/inventoryUI.js';
import { anyModalOpen } from '../ui/menu.js';
import { updateHUD } from '../ui/hud.js';
import { openNoviceKnightMenu, isNpcMenuOpen } from '../ui/questUI.js';
import { openElderMenu, isGuideMenuOpen } from '../ui/guideUI.js';
import { QuestLog } from './quests.js';
import { maintainMobPopulations, MOB_POPULATION_LIMITS } from './mobSpawner.js';

const HARVEST_DURATION_MS = 3 * 1000;
const HARVEST_RECOVERY_MS = 3 * 60 * 1000;
let activeHarvest = null;

function setHarvestBar(visible, label = '', progress = 0) {
    document.getElementById('harvest-bar-container').style.display = visible ? 'block' : 'none';
    document.getElementById('harvest-label').innerText = label;
    document.getElementById('harvest-bar-fill').style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
}

function updateActiveHarvest() {
    if (!activeHarvest) return false;
    const now = Date.now();
    const elapsed = now - activeHarvest.startedAt;
    setHarvestBar(true, `${activeHarvest.node.action}...`, elapsed / HARVEST_DURATION_MS);
    if (elapsed < HARVEST_DURATION_MS) return true;

    const node = activeHarvest.node;
    if (Inventory.addMaterial(node.drop, 1)) {
        node.uses++;
        if (node.uses >= node.maxUses) {
            node.uses = 0;
            node.recoveryUntil = now + HARVEST_RECOVERY_MS;
        }
        showDialog('Botín', `Has obtenido: ${node.drop} x1.`);
    } else {
        showDialog('Inventario', `¡Inventario lleno! No puedes guardar ${node.drop}.`);
    }
    activeHarvest = null;
    setHarvestBar(false);
    return false;
}

function startHarvest(node) {
    activeHarvest = { node, startedAt: Date.now() };
    setHarvestBar(true, `${node.action}...`, 0);
}

// Los disparos básicos golpean al primer enemigo. Disparo Perforante marca
// el proyectil como piercing para atravesar objetivos sin golpearlos dos veces.
function checkProjectileHit(p) {
    const world = game.world;
    const groups = [
        { list: world.dummies,    parry: false },
        { list: world.activeMobs, parry: true },
        { list: world.slimes,     parry: false },
        { list: world.wolves,     parry: false },
        { list: world.deers,      parry: false },
        { list: world.goblins,    parry: false }
    ];
    for (const { list, parry } of groups) {
        for (const m of list) {
            if (p.hitTargets.has(m)) continue;
            if (checkRectCollision(p, m)) {
                if (p.explosionRadius > 0) {
                    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
                    for (const group of getEnemyGroups(world)) {
                        for (const target of group) {
                            const tx = target.x + target.w / 2, ty = target.y + target.h / 2;
                            if (Math.hypot(tx - cx, ty - cy) <= p.explosionRadius) {
                                // Daño mágico directo: no pasa por defensas físicas.
                                damageEnemy(target, p.dmg);
                                p.hitTargets.add(target);
                            }
                        }
                    }
                    return true;
                }
                if (parry) m.takeHit(p.dmg, false);
                else {
                    // Para ciervo el golpe de proyectil (jugador) debe quedar registrado como 'player'
                    if (m.constructor && m.constructor.name === 'Deer') m.takeHit(p.dmg, 'player');
                    else m.takeHit(p.dmg);
                }
                p.hitTargets.add(m);
                if (p.knockback > 0) {
                    const dx = (m.x + m.w / 2) - (p.x + p.w / 2);
                    const dy = (m.y + m.h / 2) - (p.y + p.h / 2);
                    const length = Math.hypot(dx, dy) || 1;
                    m.x += (dx / length) * p.knockback;
                    m.y += (dy / length) * p.knockback;
                }
                if (!p.piercing) return true;
            }
        }
    }
    // Un perforante permanece activo después de impactar; el resto termina
    // en el primer blanco, como los proyectiles básicos.
    return p.hitTargets.size > 0 && !p.piercing;
}

function applyArcaneSkills(player, world) {
    if (player.arcaneVoidVortexTimer <= 0) return;
    const cx = player.arcaneVoidVortexX, cy = player.arcaneVoidVortexY;
    const radius = 86;
    for (const group of getEnemyGroups(world)) {
        for (const mob of group) {
            const mx = mob.x + mob.w / 2, my = mob.y + mob.h / 2;
            const dx = cx - mx, dy = cy - my;
            const distance = Math.hypot(dx, dy) || 1;
            if (distance > radius) continue;
            // La atracción ocurre en todos los cuadros durante los 2 s.
            // Los jefes futuros pueden marcarse isBoss para reducirla.
            const pull = mob.isBoss ? 0.7 : 2.2;
            mob.x += (dx / distance) * pull;
            mob.y += (dy / distance) * pull;
        }
    }
    player.arcaneVoidVortexTimer--;
    if (player.arcaneVoidVortexTimer === 0 && !player.arcaneVoidVortexExploded) {
        player.arcaneVoidVortexExploded = true;
        for (const group of getEnemyGroups(world)) {
            for (const mob of group) {
                const mx = mob.x + mob.w / 2, my = mob.y + mob.h / 2;
                if (Math.hypot(mx - cx, my - cy) <= radius) damageEnemy(mob, Math.ceil(player.attackDamage * 3));
            }
        }
    }
}

function getEnemyGroups(world) {
    return [world.dummies, world.activeMobs, world.slimes, world.wolves, world.deers, world.goblins];
}

function damageEnemy(mob, damage) {
    // Corrección: para ciervo el segundo parámetro debe marcar quién golpeó para el loot
    if (mob.constructor && mob.constructor.name === 'Deer') {
        if (mob.takeHit) mob.takeHit(damage, 'player');
        return;
    }
    if (mob.takeHit) mob.takeHit(damage, false);
}

function grantDefeatedLoot(list, mobKey) {
    for (const mob of list) {
        if (mob.hp > 0 || mob.lootGranted) continue;
        // Corrección: para ciervo, el loot y la misión solo cuentan si el último golpe fue del jugador
        if (mob.lastHitBy === 'wolf' && (mobKey === 'ciervo' || (typeof mobKey === 'function' && mobKey(mob) === 'ciervo'))) {
            mob.lootGranted = true;
            continue;
        }
        mob.lootGranted = true;
        const defeatedKey = typeof mobKey === 'function' ? mobKey(mob) : mobKey;
        QuestLog.recordDefeat(defeatedKey);
        grantMobLoot(defeatedKey);
    }
}

function breakPosture(mob, duration = 90) {
    // No hay jefes todavía: cuando se incorporen, basta marcarlos con
    // isBoss para que estas habilidades no les apliquen control total.
    if (mob.isBoss) return;
    mob.staggerTimer = Math.max(mob.staggerTimer || 0, duration);
    mob.attackCooldown = Math.max(mob.attackCooldown || 0, duration);
}

function pushEnemyFrom(mob, originX, originY, distance) {
    const mx = mob.x + mob.w / 2, my = mob.y + mob.h / 2;
    const dx = mx - originX, dy = my - originY;
    const length = Math.hypot(dx, dy) || 1;
    mob.x += (dx / length) * distance;
    mob.y += (dy / length) * distance;
}

function applyLancerSkills(player, world) {
    if (player.lancerPhalanxTimer > 0) {
        const box = player.getLancerPhalanxHitbox();
        for (const group of getEnemyGroups(world)) {
            for (const mob of group) {
                if (player.lancerPhalanxHits.has(mob) || !checkRectCollision(box, mob)) continue;
                player.lancerPhalanxHits.add(mob);
                damageEnemy(mob, Math.ceil(player.attackDamage * 1.35));
                // Interrumpe ataques/casteos de enemigos menores sin hacer
                // que el control sea permanente: 1 s de postura rota.
                breakPosture(mob, 60);
            }
        }
    }

    if (player.lancerWhirlwindTimer > 0 && !player.lancerWhirlwindResolved
        && player.lancerWhirlwindTimer <= 12) {
        player.lancerWhirlwindResolved = true;
        const px = player.x + player.w / 2, py = player.y + player.h / 2;
        for (const group of getEnemyGroups(world)) {
            for (const mob of group) {
                const mx = mob.x + mob.w / 2, my = mob.y + mob.h / 2;
                if (Math.hypot(mx - px, my - py) > 90) continue;
                damageEnemy(mob, Math.ceil(player.attackDamage * 1.5));
                pushEnemyFrom(mob, px, py, 95);
                // Ruptura instantánea de postura: 1.5 s para recuperar espacio.
                breakPosture(mob, 90);
            }
        }
    }
}

function applyKnightSkills(player, world) {
    if (player.knightEarthsplitterTimer > 0 && !player.knightEarthsplitterResolved
        && player.knightEarthsplitterTimer <= 9) {
        player.knightEarthsplitterResolved = true;
        const box = player.getKnightEarthsplitterHitbox();
        for (const group of getEnemyGroups(world)) {
            for (const mob of group) {
                if (!checkRectCollision(box, mob)) continue;
                damageEnemy(mob, Math.ceil(player.attackDamage * 2));
                breakPosture(mob, 90);
            }
        }
    }

    if (player.knightCataclysmTimer > 0 && !player.knightCataclysmResolved
        && player.knightCataclysmTimer <= 8) {
        player.knightCataclysmResolved = true;
        const px = player.x + player.w / 2, py = player.y + player.h / 2;
        for (const group of getEnemyGroups(world)) {
            for (const mob of group) {
                const mx = mob.x + mob.w / 2, my = mob.y + mob.h / 2;
                if (Math.hypot(mx - px, my - py) > 118) continue;
                damageEnemy(mob, Math.ceil(player.attackDamage * 1.5));
                breakPosture(mob, 90);
            }
        }
    }
}

function applyDualSwordsmanSkills(player, world) {
    if (player.dualCrossSlashTimer > 0 && !player.dualCrossSlashResolved) {
        player.dualCrossSlashResolved = true;
        const px = player.x + player.w / 2, py = player.y + player.h / 2;
        for (const group of getEnemyGroups(world)) {
            for (const mob of group) {
                const mx = mob.x + mob.w / 2, my = mob.y + mob.h / 2;
                if (Math.hypot(mx - px, my - py) <= 62) {
                    // Cada diagonal de la X es un impacto independiente de
                    // 15: al conectar el Tajo Cruzado completo son 30 de daño.
                    damageEnemy(mob, 15);
                    damageEnemy(mob, 15);
                }
            }
        }
    }

    if (player.dualSteelFrenzyTimer > 0) {
        const pulse = Math.floor((120 - player.dualSteelFrenzyTimer) / 12);
        if (pulse === player.dualSteelFrenzyPulse) return;
        player.dualSteelFrenzyPulse = pulse;
        const px = player.x + player.w / 2, py = player.y + player.h / 2;
        for (const group of getEnemyGroups(world)) {
            for (const mob of group) {
                const mx = mob.x + mob.w / 2, my = mob.y + mob.h / 2;
                // El radio coincide exactamente con el círculo visual del
                // frenesí: todos los enemigos dentro reciben cada pulso.
                if (Math.hypot(mx - px, my - py) <= 54) damageEnemy(mob, Math.ceil(player.attackDamage * 2.85));
            }
        }
    }
}

function applyArcherSkills(player, world) {
    if (player.archerThornRainTimer <= 0) return;
    const pulse = Math.floor((120 - player.archerThornRainTimer) / 15);
    if (pulse === player.archerThornRainPulse) return;
    player.archerThornRainPulse = pulse;
    for (const group of getEnemyGroups(world)) {
        for (const mob of group) {
            const mx = mob.x + mob.w / 2, my = mob.y + mob.h / 2;
            if (Math.hypot(mx - player.archerThornRainX, my - player.archerThornRainY) > 82) continue;
            damageEnemy(mob, Math.ceil(player.attackDamage * 0.8));
            if (!mob.isBoss) {
                mob.slowTimer = Math.max(mob.slowTimer || 0, 30);
                mob.slowMultiplier = 0.5;
            }
        }
    }
}

function applyBleed(mob, damage) {
    mob.bleedStacks = Math.min(4, (mob.bleedStacks || 0) + 1);
    mob.bleedTimer = 4 * 60;
    mob.bleedTick = 30;
    mob.bleedDamage = damage;
}

function updateBleeds(world) {
    for (const group of getEnemyGroups(world)) {
        for (const mob of group) {
            if (!mob.bleedTimer || mob.bleedTimer <= 0) continue;
            mob.bleedTimer--;
            if (--mob.bleedTick <= 0) {
                damageEnemy(mob, mob.bleedDamage * mob.bleedStacks);
                mob.bleedTick = 30;
            }
            if (mob.bleedTimer <= 0) mob.bleedStacks = 0;
        }
    }
}

function isInSwordStormRange(player, mob) {
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    const mx = mob.x + mob.w / 2, my = mob.y + mob.h / 2;
    const dx = mx - px, dy = my - py;
    const distance = Math.hypot(dx, dy);
    return distance <= 105 && distance > 0 && ((dx / distance) * player.facing.x + (dy / distance) * player.facing.y) >= 0.15;
}

function resolveSwordsmanSkills(player, world) {
    if (player.swordThrustTimer > 0) {
        const box = player.getSwordThrustHitbox();
        for (const group of getEnemyGroups(world)) {
            for (const mob of group) {
                if (!player.swordThrustHits.has(mob) && checkRectCollision(box, mob)) {
                    player.swordThrustHits.add(mob);
                    // Daño directo: no depende de ningún modificador de defensa.
                    damageEnemy(mob, Math.ceil(player.attackDamage * 1.5));
                }
            }
        }
    }

    if (player.swordStormTimer > 0) {
        const slash = Math.floor((48 - player.swordStormTimer) / 12);
        if (slash !== player.swordStormLastSlash) {
            player.swordStormLastSlash = slash;
            for (const group of getEnemyGroups(world)) {
                for (const mob of group) {
                    if (!isInSwordStormRange(player, mob) || player.swordStormHits.get(mob) === slash) continue;
                    player.swordStormHits.set(mob, slash);
                    damageEnemy(mob, Math.ceil(player.attackDamage * 0.75));
                    applyBleed(mob, Math.max(1, Math.ceil(player.attackDamage * 0.12)));
                }
            }
        }
    }
}

export function update() {
    const player = game.player;
    const world = game.world;
    const camera = game.camera;

    player.update();
    Inventory.updateBuffs();
    // Las misiones de entrega se completan en cuanto el jugador lleva los
    // materiales requeridos, aunque hayan sido obtenidos fuera de combate.
    QuestLog.sync();

    world.dummies.forEach(d => d.update());
    world.activeMobs.forEach(m => m.update(player));
    world.slimes.forEach(s => s.update(world.slimes, player));
    const fused = world.slimes.filter(s => s.fused);
    const bigSlimeCount = world.slimes.filter(s => s.big).length;
    if (fused.length >= 2 && bigSlimeCount < MOB_POPULATION_LIMITS.bigSlimes) {
        const [a, b] = fused;
        world.slimes = world.slimes.filter(s => s !== a && s !== b);
        world.slimes.push(new Slime((a.x + b.x)/2, (a.y + b.y)/2, true, a.habitat));
    } else if (fused.length >= 2) {
        // Al alcanzarse el máximo de tres Grandes, los normales permanecen
        // separados y no se pierde ninguna unidad por una fusión inválida.
        fused.forEach(s => { s.fused = false; s.mergeTimer = 0; });
    }
    world.wolves.forEach(w => w.update(player, world.deers));
    world.deers.forEach(d => d.update(player, world.wolves));
    world.goblins.forEach(g => g.update(player));
    updateBleeds(world);

    // Báculo/Arco: Player.update() dejó los datos de disparo en
    // pendingProjectile (ver entities/player.js); aquí se crea el
    // Projectile real usando la config del arma equipada.
    if (player.pendingProjectile) {
        const pp = player.pendingProjectile;
        const cfg = WEAPONS[pp.weaponKey].projectile;
        world.projectiles.push(new Projectile({
            x: pp.x, y: pp.y, dirX: pp.dirX, dirY: pp.dirY, dmg: pp.dmg,
            speed: pp.speed ?? cfg.speed, size: pp.size ?? cfg.size, color: pp.color ?? cfg.color,
            rangeBlocks: pp.rangeBlocks ?? cfg.rangeBlocks, sprite: pp.sprite ?? cfg.sprite, piercing: pp.piercing, knockback: pp.knockback,
            homing: pp.homing, explosionRadius: pp.explosionRadius, magic: pp.magic
        }));
        player.pendingProjectile = null;
    }
    world.projectiles.forEach(p => {
        p.update(getEnemyGroups(world).flat());
        if (!p.hasHit && checkProjectileHit(p)) {
            p.hasHit = true;
            player.bars = Math.min(player.barCapacity, player.bars + 0.5);
        }
    });
    world.projectiles = world.projectiles.filter(p => !p.expired);

    resolveSwordsmanSkills(player, world);
    applyKnightSkills(player, world);
    applyDualSwordsmanSkills(player, world);
    applyArcherSkills(player, world);
    applyLancerSkills(player, world);
    applyArcaneSkills(player, world);

    if (player.isAttacking && !player.currentWeapon.ranged && player.swordThrustTimer === 0
        && player.swordStormTimer === 0 && player.knightEarthsplitterTimer === 0
        && player.knightCataclysmTimer === 0 && player.dualSteelFrenzyTimer === 0
        && player.lancerPhalanxTimer === 0 && player.lancerWhirlwindTimer === 0) {
        const box = player.getAttackHitbox();
        const dmg = player.attackDamage;
        world.dummies.forEach(d => { if (checkRectCollision(box, d) && d.flash === 0) { d.takeHit(dmg); player.bars = Math.min(player.barCapacity, player.bars + 0.5); } });
        world.activeMobs.forEach(m => { if (checkRectCollision(box, m) && m.flash === 0) { m.takeHit(dmg, false); player.bars = Math.min(player.barCapacity, player.bars + 0.5); } });
        world.slimes.forEach(s => { if (checkRectCollision(box, s) && s.flash === 0) { s.takeHit(dmg); player.bars = Math.min(player.barCapacity, player.bars + 0.5); } });
        world.wolves.forEach(w => { if (checkRectCollision(box, w) && w.flash === 0) { w.takeHit(dmg); player.bars = Math.min(player.barCapacity, player.bars + 0.5); } });
        world.deers.forEach(d => { if (checkRectCollision(box, d) && d.flash === 0) { d.takeHit(dmg, 'player'); player.bars = Math.min(player.barCapacity, player.bars + 0.5); } });
        world.goblins.forEach(g => { if (checkRectCollision(box, g) && g.flash === 0) { g.takeHit(dmg); player.bars = Math.min(player.barCapacity, player.bars + 0.5); } });
    }
    // Las habilidades y ataques básicos pueden matar después de que las
    // entidades ya se actualizaron este cuadro. El botín se resuelve aquí
    // antes de retirarlas, garantizando una única entrega por muerte.
    grantDefeatedLoot(world.activeMobs, 'mobArena');
    grantDefeatedLoot(world.slimes, slime => slime.big ? 'granSlime' : 'slime');
    grantDefeatedLoot(world.wolves, 'lobo');
    grantDefeatedLoot(world.deers, 'ciervo');
    grantDefeatedLoot(world.goblins, 'goblin');
    world.slimes = world.slimes.filter(s => s.hp > 0);
    world.activeMobs = world.activeMobs.filter(m => m.hp > 0);
    world.wolves = world.wolves.filter(w => w.hp > 0);
    world.deers = world.deers.filter(d => d.hp > 0);
    world.goblins = world.goblins.filter(g => g.hp > 0);
    maintainMobPopulations(world);

    camera.follow(player);

    // La acción de recolección usa tiempo real (no frames): tarda 3 s aun
    // si el navegador reduce temporalmente la frecuencia de actualización.
    if (updateActiveHarvest()) {
        document.getElementById('interaction-prompt').style.display = 'none';
        updateHUD();
        return;
    }

    const eDown = Input.isDown(['KeyE']) || Input.gamepad.buttons.interact || Input.touch.interact;
    let promptText = null;
    let interactTarget = null;
    const modalOpen = anyModalOpen() || isNpcMenuOpen() || isGuideMenuOpen();

    if (!modalOpen) {
        const harvestNode = harvestNodes.find(node => dist(player, node) < node.interactionRadius);
        if (harvestNode) {
            const requiredToolName = harvestNode.requiredTool === 'hacha' ? 'hacha' : 'pico';
            if (Date.now() < harvestNode.recoveryUntil) {
                promptText = `${harvestNode.label} en recuperación [E]`;
                if (eDown && !state.actionHeld) showDialog('Recolección', 'Vuelve más tarde.');
            } else if (Inventory.equipment.tool !== harvestNode.requiredTool) {
                const verb = harvestNode.requiredTool === 'hacha' ? 'talar' : 'picar';
                promptText = `Requieres ${requiredToolName} para ${verb} [E]`;
                if (eDown && !state.actionHeld) showDialog('Recolección', `Requieres ${requiredToolName} para ${verb}.`);
            } else {
                const verb = harvestNode.requiredTool === 'hacha' ? 'Talar' : 'Picar';
                promptText = `${verb} ${harvestNode.label} [E] (3s)`;
                if (eDown && !state.actionHeld) startHarvest(harvestNode);
            }
            interactTarget = harvestNode;
        } else if (dist(player, noviceKnight) < noviceKnight.interactionRadius) {
            promptText = 'Hablar con el Caballero Novato [E]'; interactTarget = noviceKnight;
            if (eDown && !state.actionHeld) openNoviceKnightMenu(noviceKnight);
        } else if (dist(player, npc) < npc.interactionRadius) {
            promptText = 'Hablar con el Anciano [E]'; interactTarget = npc;
            if (eDown && !state.actionHeld) openElderMenu(npc);
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
            let found = false;
            for (const rack of weaponRacks) {
                if (dist(player, rack) < 50) {
                    const w = WEAPONS[rack.weapon];
                    promptText = `Tomar ${w.name} del ${rack.name} [E]`; interactTarget = rack;
                    if (eDown && !state.actionHeld) {
                        if (Inventory.addMaterial(w.name, 1)) {
                            showDialog(rack.name, `Has obtenido: ${w.name}. Abre el inventario [I] para equiparla.`);
                        } else {
                            showDialog('Inventario', `¡Inventario lleno! No puedes llevar la ${w.name}.`);
                        }
                    }
                    found = true; break;
                }
            }
            if (!found) {
                for (const rack of toolRacks) {
                    if (dist(player, rack) < 50) {
                        const t = TOOLS[rack.tool];
                        promptText = `Tomar ${t.name} del ${rack.name} [E]`; interactTarget = rack;
                        if (eDown && !state.actionHeld) {
                            if (Inventory.addMaterial(t.name, 1)) {
                                showDialog(rack.name, `Has obtenido: ${t.name}.`);
                            } else {
                                showDialog('Inventario', `¡Inventario lleno! No puedes llevar el/la ${t.name}.`);
                            }
                        }
                        found = true; break;
                    }
                }
            }
            if (!found) {
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
    }
    state.actionHeld = eDown;

    const promptEl = document.getElementById('interaction-prompt');
    if (promptText && !modalOpen) { promptEl.style.display = 'block'; promptEl.innerText = promptText; }
    else promptEl.style.display = 'none';

    updateDialog();

    updateHUD();
}
