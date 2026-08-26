/* =====================================================================
   PROYECTILES — disparados por armas a distancia (Báculo, Arco)
   Viajan en línea recta desde su punto de origen. Se destruyen al superar
   su alcance máximo (definido en "bloques" de BLOCK_SIZE px, ver
   world/map.js) o apenas impactan al PRIMER enemigo que golpean — nunca
   atraviesan para golpear a más de uno (ver systems/worldInteraction.js).
   ===================================================================== */
import { BLOCK_SIZE } from '../world/map.js';

export class Projectile {
    constructor({ x, y, dirX, dirY, dmg, speed, size, color, rangeBlocks, piercing = false, knockback = 0, homing = 0, explosionRadius = 0, magic = false }) {
        this.w = size; this.h = size;
        // x,y de entrada son el punto de origen (centro del jugador); se
        // convierten a la esquina superior izquierda del hitbox del proyectil.
        this.x = x - this.w / 2; this.y = y - this.h / 2;
        this.dirX = dirX; this.dirY = dirY;
        this.speed = speed; this.dmg = dmg; this.color = color;
        this.maxDistance = rangeBlocks * BLOCK_SIZE;
        this.traveled = 0;
        this.hasHit = false; // true en cuanto golpea a su primer (y único) objetivo
        this.piercing = piercing;
        this.knockback = knockback;
        this.homing = homing;
        this.explosionRadius = explosionRadius;
        this.magic = magic;
        this.hitTargets = new Set();
    }
    update(targets = []) {
        // Corrección suave, no un giro instantáneo: conserva la sensación de
        // proyectil mágico con auto-seguimiento ligero.
        if (this.homing > 0) {
            const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
            let target = null, bestDistance = 220;
            for (const mob of targets) {
                if (this.hitTargets.has(mob)) continue;
                const mx = mob.x + mob.w / 2, my = mob.y + mob.h / 2;
                const distance = Math.hypot(mx - cx, my - cy);
                if (distance < bestDistance) { bestDistance = distance; target = mob; }
            }
            if (target) {
                const mx = target.x + target.w / 2, my = target.y + target.h / 2;
                const distance = Math.hypot(mx - cx, my - cy) || 1;
                this.dirX += ((mx - cx) / distance - this.dirX) * this.homing;
                this.dirY += ((my - cy) / distance - this.dirY) * this.homing;
                const directionLength = Math.hypot(this.dirX, this.dirY) || 1;
                this.dirX /= directionLength; this.dirY /= directionLength;
            }
        }
        const stepX = this.dirX * this.speed, stepY = this.dirY * this.speed;
        this.x += stepX; this.y += stepY;
        this.traveled += Math.hypot(stepX, stepY);
    }
    get expired() { return (!this.piercing && this.hasHit) || this.traveled >= this.maxDistance; }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
