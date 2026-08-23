/* =====================================================================
   6. JUGADOR
   ===================================================================== */
import { Input } from '../core/input.js';
import { drawEntity, CHARACTER_SPRITE_SIZE } from '../core/assets.js';
import { checkRectCollision } from '../core/physics.js';
import { getActiveWalls } from '../world/map.js';
import { WEAPONS, PLAYER_SPRITE_KEYS } from '../data/weapons.js';
import { Inventory } from '../systems/inventory.js';
import { DEBUG } from '../systems/debug.js';

export class Player {
    constructor(x, y) {
        this.x = x; this.y = y; this.w = 34; this.h = 34;
        this.baseSpeed = 3.3;
        this.maxHp = 100; this.hp = 100;
        this.facing = { x: 1, y: 0 };

        // Dirección lógica para el sprite (centro=abajo, derecha, arriba, izquierda)
        // y animación de caminar alternando entre sprite quieto y sprite "movimiento".
        this.facingDir = 'centro';
        this.isMoving = false;
        this.walkAnimTimer = 0;
        this.walkFrameToggle = false;

        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 15;
        this.attackCooldown = 0;
        // Cuando el arma equipada es a distancia (ranged), el ataque no usa
        // getAttackHitbox(): en vez de eso deja aquí los datos de disparo un
        // frame para que worldInteraction.js cree el Projectile real. Así
        // Player no depende de game/world (ver core/gameContext.js).
        this.pendingProjectile = null;

        this.isBlocking = false;
        this.blockStartFrame = 0;
        this.parryWindowFrames = 6;

        this.barCapacity = 3;
        this.bars = 3;
        this.regenAccum = 0;

        this.flashTimer = 0;
        this.godMode = false;

        this.channeling = false;
        this.channelTimer = 0;
        this.channelDuration = 5 * 60;
        this.channelCooldown = 0;

        this.mitigationBuff = 0;
        this.mitigationPct = 0;

        this.respawn = { x: 150, y: 150 };
    }

    get currentWeapon() {
        return Inventory.equipment.weapon ? WEAPONS[Inventory.equipment.weapon] : WEAPONS.desarmado;
    }
    get speed() { return this.baseSpeed + (Inventory.hasBuff('Velocidad') ? 1.5 : 0); }
    get attackDamage() { return this.currentWeapon.dmg + (Inventory.hasBuff('Fuerza') ? 5 : 0); }

    update() {
        let dx = 0, dy = 0;
        if (Input.isDown(['KeyW','ArrowUp'])) dy -= 1;
        if (Input.isDown(['KeyS','ArrowDown'])) dy += 1;
        if (Input.isDown(['KeyA','ArrowLeft'])) dx -= 1;
        if (Input.isDown(['KeyD','ArrowRight'])) dx += 1;

        if (Input.touch.moveX !== 0 || Input.touch.moveY !== 0) {
            dx = Input.touch.moveX; dy = Input.touch.moveY;
        } else if (Math.abs(Input.gamepad.axes[0]) > 0 || Math.abs(Input.gamepad.axes[1]) > 0) {
            dx = Input.gamepad.axes[0]; dy = Input.gamepad.axes[1];
        }

        const moving = (dx !== 0 || dy !== 0);
        if (dx !== 0 && dy !== 0) { const l = Math.hypot(dx, dy); dx /= l; dy /= l; }

        if (this.channeling && moving) this.cancelChannel();

        const activeWalls = getActiveWalls();
        this.x += dx * this.speed; this.resolveCollisions(true, activeWalls);
        this.y += dy * this.speed; this.resolveCollisions(false, activeWalls);

        if (moving) { this.facing.x = dx; this.facing.y = dy; }

        // --- Dirección del sprite + animación de caminar (2 frames por dirección) ---
        this.isMoving = moving;
        if (moving) {
            // Bucket de 4 direcciones: la componente dominante decide el sprite.
            if (Math.abs(dx) > Math.abs(dy)) this.facingDir = dx > 0 ? 'derecha' : 'izquierda';
            else this.facingDir = dy > 0 ? 'centro' : 'arriba'; // abajo/centro o arriba

            this.walkAnimTimer++;
            if (this.walkAnimTimer >= 8) { this.walkAnimTimer = 0; this.walkFrameToggle = !this.walkFrameToggle; }
        } else {
            this.walkAnimTimer = 0; this.walkFrameToggle = false; // quieto = frame base de la última dirección
        }

        // Parry básico: Click Derecho / Mando L2-LT / Botón de escudo táctil
        const blockKeyDown = Input.mouse.rightDown || Input.gamepad.buttons.block || Input.touch.block;
        if (blockKeyDown && !this.isBlocking) { this.blockStartFrame = 0; }
        if (blockKeyDown) this.blockStartFrame++;
        this.isBlocking = blockKeyDown;

        if (this.attackCooldown > 0) this.attackCooldown--;
        // Ataque básico: Click Izquierdo / Mando R2-RT / Botón de ataque táctil
        const atkPressed = Input.mouse.down || Input.gamepad.buttons.attack || Input.touch.attack;
        if (atkPressed && this.attackCooldown === 0 && !this.isAttacking) {
            const weapon = this.currentWeapon;
            this.isAttacking = true;
            this.attackTimer = this.attackDuration;
            this.attackCooldown = weapon.attackCooldown;
            if (weapon.ranged) {
                this.pendingProjectile = {
                    x: this.x + this.w / 2, y: this.y + this.h / 2,
                    dirX: this.facing.x, dirY: this.facing.y,
                    dmg: this.attackDamage, weaponKey: Inventory.equipment.weapon || 'desarmado'
                };
            }
        }
        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) this.isAttacking = false;
        }

        // Habilidad 1: [Q] / Mando R1-RB / Botón de estrella táctil
        if ((Input.wasPressed('KeyQ') || Input.touch.q || Input.gamepad.justPressed.ability1) && this.bars >= 1) { this.bars -= 1; this.useAbility1(); Input.touch.q = false; }
        // Habilidad 2: [R] / Mando L1-LB / Botón de luna táctil
        if ((Input.wasPressed('KeyR') || Input.touch.r || Input.gamepad.justPressed.ability2) && this.bars >= 3) { this.bars -= 3; this.useAbility2(); Input.touch.r = false; }

        this.regenAccum += 0.2 / 60;
        if (this.regenAccum >= 1 && this.bars < this.barCapacity) { this.bars = Math.min(this.barCapacity, this.bars + 1); this.regenAccum = 0; }
        this.bars = Math.min(this.bars, this.barCapacity);

        if (this.mitigationBuff > 0) this.mitigationBuff--; else this.mitigationPct = 0;
        if (this.flashTimer > 0) this.flashTimer--;
        if (this.channelCooldown > 0) this.channelCooldown--;

        if (this.channeling) {
            this.channelTimer++;
            if (this.channelTimer >= this.channelDuration) this.completeChannel();
        }
    }

    useAbility1() {
        this.attackTimer = this.attackDuration; this.isAttacking = true;
        this.x += this.facing.x * 30; this.y += this.facing.y * 30;
        const activeWalls = getActiveWalls();
        this.resolveCollisions(true, activeWalls); this.resolveCollisions(false, activeWalls);
    }
    useAbility2() {
        if (Inventory.equipment.weapon === 'mandoble') {
            this.mitigationBuff = 3 * 60; this.mitigationPct = 0.5;
        } else {
            this.attackTimer = this.attackDuration; this.isAttacking = true;
        }
    }

    startChannel() {
        if (this.channelCooldown > 0 || this.channeling) return;
        this.channeling = true; this.channelTimer = 0;
        document.getElementById('escape-bar-container').style.display = 'block';
    }
    cancelChannel() {
        this.channeling = false; this.channelTimer = 0; this.channelCooldown = 3 * 60;
        document.getElementById('escape-bar-container').style.display = 'none';
    }
    completeChannel() {
        this.channeling = false; this.channelTimer = 0;
        document.getElementById('escape-bar-container').style.display = 'none';
        this.x = this.respawn.x; this.y = this.respawn.y;
    }

    onHitParryCheck() {
        return this.isBlocking && this.blockStartFrame > 0 && this.blockStartFrame <= this.parryWindowFrames;
    }

    resolveCollisions(isXAxis, activeWalls) {
        for (const wall of activeWalls) {
            if (checkRectCollision(this, wall)) {
                if (isXAxis) { if (this.x < wall.x) this.x = wall.x - this.w; else this.x = wall.x + wall.w; }
                else { if (this.y < wall.y) this.y = wall.y - this.h; else this.y = wall.y + wall.h; }
            }
        }
    }

    takeDamage(amount, attacker = null) {
        if (this.godMode) return;
        if (this.flashTimer > 0) return;
        if (this.channeling) this.cancelChannel();

        if (this.onHitParryCheck()) {
            this.bars = Math.min(this.barCapacity, this.bars + 2);
            this.flashTimer = 10;
            return;
        }

        if (this.isBlocking) amount = Math.floor(amount * 0.3);
        if (this.mitigationPct > 0) amount = Math.floor(amount * (1 - this.mitigationPct));
        if (Inventory.hasBuff('Resistencia')) amount = Math.max(0, amount - 10);

        if (Inventory.hasBuff('Espinas') && attacker && typeof attacker.hp === 'number') {
            attacker.hp -= Math.floor(amount * 0.5);
        }

        this.hp -= amount;
        this.flashTimer = 20;
        if (this.hp <= 0) { this.hp = this.maxHp; this.x = this.respawn.x; this.y = this.respawn.y; }
    }

    getAttackHitbox() {
        const weapon = this.currentWeapon;
        const reach = weapon.meleeReach ?? 38, size = weapon.meleeSize ?? 34;
        return {
            x: this.x + this.w/2 + this.facing.x * reach - size/2,
            y: this.y + this.h/2 + this.facing.y * reach - size/2,
            w: size, h: size
        };
    }

    draw(ctx) {
        const weapon = this.currentWeapon;
        let color = weapon.color;
        if (this.flashTimer > 0) color = '#ffffff';
        else if (this.isBlocking) color = '#3498db';

        const dirSprites = PLAYER_SPRITE_KEYS[this.facingDir] || PLAYER_SPRITE_KEYS.centro;
        const spriteKey = (this.isMoving && this.walkFrameToggle) ? dirSprites.walk : dirSprites.idle;
        drawEntity(ctx, spriteKey, this.x, this.y, this.w, this.h, color, 'rect', null, CHARACTER_SPRITE_SIZE);

        if (this.isAttacking && !weapon.ranged) {
            const box = this.getAttackHitbox();
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 2;
            ctx.fillRect(box.x, box.y, box.w, box.h);
            ctx.strokeRect(box.x, box.y, box.w, box.h);
        }
        if (this.channeling) {
            const pct = this.channelTimer / this.channelDuration;
            ctx.fillStyle = '#222';
            ctx.fillRect(this.x - 5, this.y - 20, this.w + 10, 6);
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(this.x - 5, this.y - 20, (this.w + 10) * pct, 6);
        }
        if (DEBUG.showHitboxes) {
            ctx.strokeStyle = '#00ffff';
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
    }
}
