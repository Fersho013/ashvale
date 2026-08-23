/* =====================================================================
   PROYECTILES — disparados por armas a distancia (Báculo, Arco)
   Viajan en línea recta desde su punto de origen. Se destruyen al superar
   su alcance máximo (definido en "bloques" de BLOCK_SIZE px, ver
   world/map.js) o apenas impactan al PRIMER enemigo que golpean — nunca
   atraviesan para golpear a más de uno (ver systems/worldInteraction.js).
   ===================================================================== */
import { BLOCK_SIZE } from '../world/map.js';

export class Projectile {
    constructor({ x, y, dirX, dirY, dmg, speed, size, color, rangeBlocks }) {
        this.w = size; this.h = size;
        // x,y de entrada son el punto de origen (centro del jugador); se
        // convierten a la esquina superior izquierda del hitbox del proyectil.
        this.x = x - this.w / 2; this.y = y - this.h / 2;
        this.dirX = dirX; this.dirY = dirY;
        this.speed = speed; this.dmg = dmg; this.color = color;
        this.maxDistance = rangeBlocks * BLOCK_SIZE;
        this.traveled = 0;
        this.hasHit = false; // true en cuanto golpea a su primer (y único) objetivo
    }
    update() {
        const stepX = this.dirX * this.speed, stepY = this.dirY * this.speed;
        this.x += stepX; this.y += stepY;
        this.traveled += Math.hypot(stepX, stepY);
    }
    get expired() { return this.hasHit || this.traveled >= this.maxDistance; }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
