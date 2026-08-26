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
    import { npc, respawnBed, campfire, alchemyTable, buildTable, chestObj, weaponsChestObj, toolsChestObj, weaponRacks, toolRacks, bocinaVigia, harvestNodes } from '../world/worldObjects.js';
    import { WEAPONS } from '../data/weapons.js';
    import { TOOLS } from '../data/tools.js';
    import { showDialog, dialogState } from '../ui/dialog.js';
    import { openCraftPanel } from '../ui/craftingUI.js';
    import { openChestPanel } from '../ui/inventoryUI.js';
    import { anyModalOpen } from '../ui/menu.js';
    import { updateHUD } from '../ui/hud.js';

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

    function getEnemyGroups(world) {
        return [world.dummies, world.activeMobs, world.slimes, world.wolves, world.goblins];
    }

    function damageEnemy(mob, damage) {
        // ActiveMob usa el segundo parámetro para el parry; para las habilidades
        // de Espadachín no se activa ese efecto adicional.
        if (mob.takeHit) mob.takeHit(damage, false);
    }

    function breakPosture(mob, duration = 90) {
        // No hay jefes todavía: cuando se incorporen, basta marcarlos con
        // isBoss para que estas habilidades no les apliquen control total.
        if (mob.isBoss) return;
        mob.staggerTimer = Math.max(mob.staggerTimer || 0, duration);
        mob.attackCooldown = Math.max(mob.attackCooldown || 0, duration);
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
        updateBleeds(world);

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

        resolveSwordsmanSkills(player, world);
        applyKnightSkills(player, world);

        if (player.isAttacking && !player.currentWeapon.ranged && player.swordThrustTimer === 0
            && player.swordStormTimer === 0 && player.knightEarthsplitterTimer === 0
            && player.knightCataclysmTimer === 0) {
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
        const modalOpen = anyModalOpen();

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
            } else if (dist(player, npc) < npc.interactionRadius) {
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

        if (dialogState.timer > 0) { dialogState.timer--; if (dialogState.timer === 0) document.getElementById('dialog-box').style.display = 'none'; }

        updateHUD();
    }
