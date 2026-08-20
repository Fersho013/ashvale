/* =====================================================================
   7. ENTIDADES Y MOBS
   ===================================================================== */
import { checkRectCollision, dist } from '../core/physics.js';
import { drawEntity } from '../core/assets.js';
import { getActiveWalls, MAP_W, MAP_H, clampToZone3 } from '../world/map.js';

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
        clampToZone3(this);
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
        this.attackCooldown = 0; this.staggerTimer = 0;
    }
    takeHit(dmg, wasParried) {
        this.flash = 12; this.hp -= dmg;
        if (wasParried) this.staggerTimer = 0.8 * 60;
    }
    update(player) {
        if (this.flash > 0) this.flash--;
        if (this.staggerTimer > 0) { this.staggerTimer--; clampToZone3(this); return; }

        const dx = (player.x + player.w/2) - (this.x + this.w/2);
        const dy = (player.y + player.h/2) - (this.y + this.h/2);
        const d = Math.hypot(dx, dy);
        if (d > 2) {
            const nx = dx/d, ny = dy/d;
            const activeWalls = getActiveWalls();
            this.x += nx * this.speed; this.resolveCollisions(true, activeWalls);
            this.y += ny * this.speed; this.resolveCollisions(false, activeWalls);
        }
        clampToZone3(this);

        if (checkRectCollision(this, player) && this.attackCooldown === 0) {
            const wasParried = player.onHitParryCheck();
            player.takeDamage(10, this);
            if (wasParried) this.staggerTimer = 0.8 * 60;
            this.attackCooldown = 45;
        }
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.hp <= 0) { this.x = 900 + Math.random()*100; this.y = 80 + Math.random()*150; this.hp = this.maxHp; }
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
        ctx.fillStyle = '#444'; ctx.fillRect(this.x, this.y - 8, this.w, 4);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(this.x, this.y - 8, Math.max(0,(this.hp/this.maxHp))*this.w, 4);
    }
}

export class Slime {
    constructor(x, y, big = false) {
        this.x = x; this.y = y; this.big = big;
        this.w = big ? 30 : 18; this.h = big ? 30 : 18;
        this.speed = 0.6; this.hp = big ? 20 : 10; this.maxHp = this.hp;
        this.flash = 0; this.mergeTimer = 0; this.wanderAngle = Math.random() * Math.PI * 2;
        this.fused = false;
    }
    takeHit(dmg) { this.flash = 10; this.hp -= dmg; this.mergeTimer = 0; }
    update(allSlimes) {
        if (this.flash > 0) this.flash--;
        this.wanderAngle += (Math.random() - 0.5) * 0.2;
        this.x += Math.cos(this.wanderAngle) * this.speed;
        this.y += Math.sin(this.wanderAngle) * this.speed;
        this.x = Math.max(30, Math.min(MAP_W - 60, this.x));
        this.y = Math.max(310, Math.min(MAP_H - 60, this.y));

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
    }
    draw(ctx) {
        drawEntity(ctx, 'slime_green', this.x, this.y, this.w, this.h,
            this.flash > 0 ? '#fff' : (this.big ? '#16a085' : '#2ecc71'), 'circle');
    }
}

export class Wolf {
    constructor(x, y) {
        this.x = x; this.y = y; this.w = 32; this.h = 32; this.speed = 1.9;
        this.hp = 25; this.maxHp = 25; this.flash = 0;
    }
    takeHit(dmg) { this.flash = 10; this.hp -= dmg; }
    update(player, deerList) {
        if (this.flash > 0) this.flash--;
        let target = null, best = 9999;
        for (const deer of deerList) {
            const d = dist(this, deer);
            if (d < 140 && d < best) { best = d; target = deer; }
        }
        if (!target) target = player;

        const dx = (target.x + target.w/2) - (this.x + this.w/2);
        const dy = (target.y + target.h/2) - (this.y + this.h/2);
        const d = Math.hypot(dx, dy);
        if (d > 4) { this.x += (dx/d) * this.speed; this.y += (dy/d) * this.speed; }

        this.x = Math.max(30, Math.min(770, this.x));
        this.y = Math.max(310, Math.min(880, this.y));

        if (target === player && checkRectCollision(this, player)) player.takeDamage(6, this);
        if (this.hp <= 0) { this.hp = this.maxHp; this.x = 60 + Math.random()*200; this.y = 340 + Math.random()*200; }
    }
    draw(ctx) { drawEntity(ctx, 'wolf', this.x, this.y, this.w, this.h, this.flash > 0 ? '#fff' : '#7f8c8d', 'rect', 'L'); }
}

export class Deer {
    constructor(x, y) { this.x = x; this.y = y; this.w = 28; this.h = 28; this.speed = 1.6; this.hp = 15; this.maxHp = 15; }
    update(player, wolves) {
        let fleeFrom = null, best = 9999;
        for (const w of wolves) { const d = dist(this, w); if (d < 120 && d < best) { best = d; fleeFrom = w; } }
        if (!fleeFrom && dist(this, player) < 90) fleeFrom = player;

        if (fleeFrom) {
            const dx = (this.x + this.w/2) - (fleeFrom.x + fleeFrom.w/2);
            const dy = (this.y + this.h/2) - (fleeFrom.y + fleeFrom.h/2);
            const d = Math.hypot(dx, dy) || 1;
            this.x += (dx/d) * this.speed; this.y += (dy/d) * this.speed;
        }
        this.x = Math.max(30, Math.min(770, this.x));
        this.y = Math.max(310, Math.min(880, this.y));
    }
    draw(ctx) { drawEntity(ctx, 'deer', this.x, this.y, this.w, this.h, '#d2b48c', 'rect', 'C'); }
}

export class GoblinExplorer {
    constructor(x, y) {
        this.x = x; this.y = y; this.w = 30; this.h = 30; this.speed = 1.5;
        this.hp = 20; this.maxHp = 20; this.flash = 0; this.attackCooldown = 0;
    }
    takeHit(dmg) { this.flash = 10; this.hp -= dmg; }
    update(player) {
        if (this.flash > 0) this.flash--;
        const fleeing = this.hp / this.maxHp < 0.2;
        const dx = (player.x + player.w/2) - (this.x + this.w/2);
        const dy = (player.y + player.h/2) - (this.y + this.h/2);
        const d = Math.hypot(dx, dy) || 1;

        if (fleeing) {
            this.x -= (dx/d) * this.speed; this.y -= (dy/d) * this.speed;
        } else if (d < 200) {
            this.x += (dx/d) * this.speed; this.y += (dy/d) * this.speed;
            if (checkRectCollision(this, player) && this.attackCooldown === 0) {
                player.takeDamage(5, this); this.attackCooldown = 50;
            }
        }
        if (this.attackCooldown > 0) this.attackCooldown--;
        this.x = Math.max(30, Math.min(770, this.x));
        this.y = Math.max(310, Math.min(880, this.y));
        if (this.hp <= 0) { this.hp = this.maxHp; this.x = 60 + Math.random()*200; this.y = 340 + Math.random()*200; }
    }
    draw(ctx) {
        const color = this.flash > 0 ? '#fff' : (this.hp/this.maxHp < 0.2 ? '#f39c12' : '#27ae60');
        drawEntity(ctx, 'goblin', this.x, this.y, this.w, this.h, color, 'rect', 'G');
    }
}
