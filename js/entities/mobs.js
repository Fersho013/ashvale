/* =====================================================================
   7. ENTIDADES Y MOBS
   ===================================================================== */
import { checkRectCollision, dist } from '../core/physics.js';
import { drawEntity } from '../core/assets.js';
import { getActiveWalls, clampToZone3, clampToArea, randomPointInArea } from '../world/map.js';
import { MOBS } from '../data/mobs.js';
import { grantMobLoot } from '../systems/inventory.js';

// Ataque cuerpo a cuerpo común para los mobs. Al comenzar el ataque guarda
// la dirección, muestra un abanico frontal y aplica daño una única vez en
// el fotograma de impacto; nunca por el simple hecho de superponerse.
function beginMobAttack(mob, player) {
    if (mob.attackCooldown > 0 || mob.attackTimer > 0) return;
    const cx = mob.x + mob.w / 2, cy = mob.y + mob.h / 2;
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    const distance = Math.hypot(px - cx, py - cy);
    if (distance > mob.attackRange) return;
    mob.attackDirX = (px - cx) / (distance || 1);
    mob.attackDirY = (py - cy) / (distance || 1);
    mob.attackTimer = mob.attackDuration;
    mob.attackHit = false;
    mob.attackCooldown = mob.attackInterval;
}

function resolveMobAttack(mob, player) {
    if (mob.attackTimer <= 0) return;
    if (!mob.attackHit && mob.attackTimer === mob.attackImpactFrame) {
        const cx = mob.x + mob.w / 2, cy = mob.y + mob.h / 2;
        const px = player.x + player.w / 2, py = player.y + player.h / 2;
        const dx = px - cx, dy = py - cy;
        const distance = Math.hypot(dx, dy) || 1;
        // Abanico frontal de 110°. El radio incluye el centro del jugador
        // para que el área coincida visualmente con el golpe mostrado.
        const facing = (dx / distance) * mob.attackDirX + (dy / distance) * mob.attackDirY;
        if (distance <= mob.attackRange + Math.max(player.w, player.h) / 2 && facing >= Math.cos(Math.PI * 55 / 180)) {
            const wasParried = typeof player.onHitParryCheck === 'function' && player.onHitParryCheck();
            player.takeDamage(mob.attackDamage, mob);
            if (wasParried) mob.staggerTimer = 0.8 * 60;
        }
        mob.attackHit = true;
    }
    mob.attackTimer--;
}

function drawMobAttackArea(ctx, mob, color) {
    if (mob.attackTimer <= 0) return;
    const cx = mob.x + mob.w / 2, cy = mob.y + mob.h / 2;
    const angle = Math.atan2(mob.attackDirY, mob.attackDirX);
    ctx.save();
    ctx.globalAlpha = 0.2 + 0.25 * (mob.attackTimer / mob.attackDuration);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, mob.attackRange, angle - Math.PI * 55 / 180, angle + Math.PI * 55 / 180);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

export class DummyMob {
    constructor(x, y) {
        this.x = x; this.y = y; this.w = 38; this.h = 38;
        this.flash = 0; this.maxHp = 9999; this.hp = 9999;
        this.damageNumbers = [];
    }
    takeHit(dmg) {
        this.flash = 12;
        this.damageNumbers.push({ x: this.x + this.w/2, y: this.y, life: 40, value: dmg });
    }
    update() {
        if (this.flash > 0) this.flash--;
        this.damageNumbers.forEach(d => { d.y -= 0.6; d.life--; });
        this.damageNumbers = this.damageNumbers.filter(d => d.life > 0);
    }
    draw(ctx) {
        drawEntity(ctx, 'dummy', this.x, this.y, this.w, this.h, this.flash > 0 ? '#fff' : '#95a5a6', 'rect', 'D');
        ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
        this.damageNumbers.forEach(d => ctx.fillText(d.value, d.x, d.y));
    }
}

export class ActiveMob {
    constructor(x, y) {
        this.x = x; this.y = y; this.w = 34; this.h = 34;
        this.speed = 1.7; this.flash = 0; this.maxHp = 40; this.hp = 40;
        this.attackCooldown = 0; this.attackTimer = 0; this.staggerTimer = 0;
        this.attackRange = 62; this.attackDamage = 10; this.attackInterval = 120;
        this.attackDuration = 18; this.attackImpactFrame = 9;
    }
    takeHit(dmg, wasParried) {
        this.flash = 12; this.hp -= dmg;
        if (wasParried) this.staggerTimer = 0.8 * 60;
    }
    update(player) {
        if (this.flash > 0) this.flash--;
        if (this.staggerTimer > 0) { this.staggerTimer--; clampToZone3(this); return; }
        if (this.slowTimer > 0) this.slowTimer--;
        const speed = this.speed * (this.slowTimer > 0 ? (this.slowMultiplier || 0.5) : 1);

        const dx = (player.x + player.w/2) - (this.x + this.w/2);
        const dy = (player.y + player.h/2) - (this.y + this.h/2);
        const d = Math.hypot(dx, dy);
        if (d > this.attackRange * 0.72) {
            const nx = dx/d, ny = dy/d;
            const activeWalls = getActiveWalls();
            this.x += nx * speed; this.resolveCollisions(true, activeWalls);
            this.y += ny * speed; this.resolveCollisions(false, activeWalls);
        }
        clampToZone3(this);

        beginMobAttack(this, player);
        resolveMobAttack(this, player);
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.hp <= 0) { this.x = 1800 + Math.random()*200; this.y = 160 + Math.random()*300; this.hp = this.maxHp; }
    }
    resolveCollisions(isXAxis, activeWalls) {
        for (const wall of activeWalls) {
            if (checkRectCollision(this, wall)) {
                if (isXAxis) { if (this.x < wall.x) this.x = wall.x - this.w; else this.x = wall.x + wall.w; }
                else { if (this.y < wall.y) this.y = wall.y - this.h; else this.y = wall.y + wall.h; }
            }
        }
    }
    draw(ctx) {
        const color = this.staggerTimer > 0 ? '#7f8c8d' : (this.flash > 0 ? '#fff' : '#c0392b');
        drawEntity(ctx, 'goblin', this.x, this.y, this.w, this.h, color, 'rect', 'M');
        drawMobAttackArea(ctx, this, '#e74c3c');
        ctx.fillStyle = '#444'; ctx.fillRect(this.x, this.y - 8, this.w, 4);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(this.x, this.y - 8, Math.max(0,(this.hp/this.maxHp))*this.w, 4);
    }
}

export class Slime {
    constructor(x, y, big = false, habitat = null) {
        this.x = x; this.y = y; this.big = big;
        this.habitat = habitat;
        this.w = big ? 30 : 18; this.h = big ? 30 : 18;
        this.speed = 0.6;
        // Vida base desde el registro de datos (data/mobs.js); el Slime
        // "grande" (fusión de dos pequeños) conserva el x2 que ya tenía.
        const baseHp = MOBS.slime.baseHp;
        this.hp = big ? baseHp * 2 : baseHp; this.maxHp = this.hp;
        this.flash = 0; this.mergeTimer = 0; this.wanderAngle = Math.random() * Math.PI * 2;
        this.fused = false;
        this.attackCooldown = 0; this.attackTimer = 0;
        this.attackRange = big ? 62 : 50; this.attackDamage = 4; this.attackInterval = 240;
        this.attackDuration = 20; this.attackImpactFrame = 10;
    }
    takeHit(dmg) { this.flash = 10; this.hp -= dmg; this.mergeTimer = 0; }
    update(allSlimes, player) {
        if (this.flash > 0) this.flash--;
        if (this.staggerTimer > 0) { this.staggerTimer--; return; }
        if (this.slowTimer > 0) this.slowTimer--;
        const speed = this.speed * (this.slowTimer > 0 ? (this.slowMultiplier || 0.5) : 1);
        const dx = player ? (player.x + player.w / 2) - (this.x + this.w / 2) : 0;
        const dy = player ? (player.y + player.h / 2) - (this.y + this.h / 2) : 0;
        const playerDistance = Math.hypot(dx, dy);
        // El Slime conserva su deambular, pero si el jugador entra en su
        // zona de alerta se aproxima hasta la distancia de ataque.
        if (player && playerDistance < 180 && playerDistance > this.attackRange * 0.72) {
            this.x += (dx / playerDistance) * speed;
            this.y += (dy / playerDistance) * speed;
        } else if (!player || playerDistance >= 180) {
            this.wanderAngle += (Math.random() - 0.5) * 0.2;
            this.x += Math.cos(this.wanderAngle) * speed;
            this.y += Math.sin(this.wanderAngle) * speed;
        }
        clampToArea(this, this.habitat);

        if (!this.big) {
            for (const other of allSlimes) {
                if (other === this || other.big || other.fused) continue;
                if (dist(this, other) < 30 && this.flash === 0 && other.flash === 0) {
                    this.mergeTimer++;
                    if (this.mergeTimer > 5 * 60) { this.fused = true; other.fused = true; }
                    break;
                } else { this.mergeTimer = 0; }
            }
        }

        if (player) { beginMobAttack(this, player); resolveMobAttack(this, player); }
        if (this.attackCooldown > 0) this.attackCooldown--;

        // El propio Slime dispara la entrega del loot al morir: la
        // eliminación del array (world.slimes) la sigue haciendo
        // worldInteraction.js con el filtro de hp>0 de siempre.
        if (this.hp <= 0 && !this.lootGranted) { this.lootGranted = true; grantMobLoot('slime'); }
    }
    draw(ctx) {
        drawEntity(ctx, 'slime_green', this.x, this.y, this.w, this.h,
            this.flash > 0 ? '#fff' : (this.big ? '#16a085' : '#2ecc71'), 'circle');
        drawMobAttackArea(ctx, this, '#2ecc71');
    }
}

export class Wolf {
    constructor(x, y, habitat = null) {
        this.x = x; this.y = y; this.w = 32; this.h = 32; this.speed = 1.9;
        this.habitat = habitat;
        this.hp = MOBS.lobo.baseHp; this.maxHp = this.hp; this.flash = 0;
        this.attackCooldown = 0; this.attackTimer = 0;
        this.attackRange = 66; this.attackDamage = 6; this.attackInterval = 120;
        this.attackDuration = 16; this.attackImpactFrame = 8;
    }
    takeHit(dmg) { this.flash = 10; this.hp -= dmg; }
    update(player, deerList) {
        if (this.flash > 0) this.flash--;
        if (this.staggerTimer > 0) { this.staggerTimer--; return; }
        if (this.slowTimer > 0) this.slowTimer--;
        const speed = this.speed * (this.slowTimer > 0 ? (this.slowMultiplier || 0.5) : 1);
        let target = null, best = 9999;
        for (const deer of deerList) {
            const d = dist(this, deer);
            if (d < 140 && d < best) { best = d; target = deer; }
        }
        if (!target) target = player;

        const dx = (target.x + target.w/2) - (this.x + this.w/2);
        const dy = (target.y + target.h/2) - (this.y + this.h/2);
        const d = Math.hypot(dx, dy);
        const desiredDistance = target === player ? this.attackRange * 0.72 : 4;
        if (d > desiredDistance) { this.x += (dx/d) * speed; this.y += (dy/d) * speed; }

        clampToArea(this, this.habitat);

        if (target === player) beginMobAttack(this, player);
        // Si el lobo cambia de ciervo a jugador (o viceversa), un golpe que
        // ya había iniciado debe completar su animación, no quedarse activo.
        resolveMobAttack(this, player);
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.hp <= 0) {
            grantMobLoot('lobo');
            this.hp = this.maxHp;
            const spawn = randomPointInArea(this.habitat, this);
            this.x = spawn.x; this.y = spawn.y;
        }
    }
    draw(ctx) {
        drawEntity(ctx, 'wolf', this.x, this.y, this.w, this.h, this.flash > 0 ? '#fff' : '#7f8c8d', 'rect', 'L');
        drawMobAttackArea(ctx, this, '#bdc3c7');
    }
}

export class Deer {
    constructor(x, y, habitat = null) {
        this.x = x; this.y = y; this.w = 28; this.h = 28; this.speed = 1.6; this.hp = 15; this.maxHp = 15;
        this.habitat = habitat;
    }
    update(player, wolves) {
        if (this.slowTimer > 0) this.slowTimer--;
        const speed = this.speed * (this.slowTimer > 0 ? (this.slowMultiplier || 0.5) : 1);
        let fleeFrom = null, best = 9999;
        for (const w of wolves) { const d = dist(this, w); if (d < 120 && d < best) { best = d; fleeFrom = w; } }
        if (!fleeFrom && dist(this, player) < 90) fleeFrom = player;

        if (fleeFrom) {
            const dx = (this.x + this.w/2) - (fleeFrom.x + fleeFrom.w/2);
            const dy = (this.y + this.h/2) - (fleeFrom.y + fleeFrom.h/2);
            const d = Math.hypot(dx, dy) || 1;
            this.x += (dx/d) * speed; this.y += (dy/d) * speed;
        }
        clampToArea(this, this.habitat);
    }
    draw(ctx) { drawEntity(ctx, 'deer', this.x, this.y, this.w, this.h, '#d2b48c', 'rect', 'C'); }
}

export class GoblinExplorer {
    constructor(x, y, habitat = null) {
        this.x = x; this.y = y; this.w = 30; this.h = 30; this.speed = 1.5;
        this.habitat = habitat;
        this.hp = MOBS.goblin.baseHp; this.maxHp = this.hp; this.flash = 0; this.attackCooldown = 0;
        this.attackTimer = 0; this.attackRange = 62; this.attackDamage = 5; this.attackInterval = 120;
        this.attackDuration = 18; this.attackImpactFrame = 9;
        this.hostile = false;
    }
    takeHit(dmg) { this.flash = 10; this.hp -= dmg; this.hostile = true; }
    update(player) {
        if (this.flash > 0) this.flash--;
        if (this.staggerTimer > 0) { this.staggerTimer--; return; }
        if (this.slowTimer > 0) this.slowTimer--;
        // Los goblins de las Minas son neutrales hasta que el jugador los
        // ataca. Mientras tanto permanecen en su zona y no persiguen ni dañan.
        if (!this.hostile) {
            clampToArea(this, this.habitat);
            return;
        }
        const speed = this.speed * (this.slowTimer > 0 ? (this.slowMultiplier || 0.5) : 1);
        const fleeing = this.hp / this.maxHp < 0.2;
        const dx = (player.x + player.w/2) - (this.x + this.w/2);
        const dy = (player.y + player.h/2) - (this.y + this.h/2);
        const d = Math.hypot(dx, dy) || 1;

        if (fleeing) {
            this.x -= (dx/d) * speed; this.y -= (dy/d) * speed;
        } else if (d < 200) {
            if (d > this.attackRange * 0.72) {
                this.x += (dx/d) * speed; this.y += (dy/d) * speed;
            }
            beginMobAttack(this, player);
        }
        // También se resuelve si el jugador sale del radio tras iniciar el
        // golpe: el área conserva su dirección y termina de forma predecible.
        resolveMobAttack(this, player);
        if (this.attackCooldown > 0) this.attackCooldown--;
        clampToArea(this, this.habitat);
        if (this.hp <= 0) {
            grantMobLoot('goblin');
            this.hp = this.maxHp; this.hostile = false;
            const spawn = randomPointInArea(this.habitat, this);
            this.x = spawn.x; this.y = spawn.y;
        }
    }
    draw(ctx) {
        const color = this.flash > 0 ? '#fff' : (this.hp/this.maxHp < 0.2 ? '#f39c12' : '#27ae60');
        drawEntity(ctx, 'goblin', this.x, this.y, this.w, this.h, color, 'rect', 'G');
        drawMobAttackArea(ctx, this, '#f1c40f');
    }
}
