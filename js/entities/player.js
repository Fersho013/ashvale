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
import { SkillBook } from '../systems/skills.js';
import { showDialog } from '../ui/dialog.js';

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

        // Estados temporales de la rama Espadachín. El daño se resuelve en
        // worldInteraction.js, que conoce todos los enemigos del mundo.
        this.swordThrustTimer = 0;
        this.swordThrustHits = new Set();
        this.swordStormTimer = 0;
        this.swordStormLastSlash = -1;
        this.swordStormHits = new Map();

        // Estados de la rama Caballero. El impacto y sus efectos sobre los
        // enemigos se resuelven en worldInteraction.js.
        this.knightEarthsplitterTimer = 0;
        this.knightEarthsplitterResolved = false;
        this.knightCataclysmTimer = 0;
        this.knightCataclysmResolved = false;

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
    get speed() {
        const b = Inventory.getBuff('Velocidad');
        return this.baseSpeed + (b ? b.value : 0);
    }
    get attackDamage() {
        const b = Inventory.getBuff('Fuerza');
        // Math.max(0, ...): con la Masa Extraña (data/recipes.js) la Fuerza
        // puede ser negativa (debuff) — nunca debe bajar el daño de 0.
        return Math.max(0, this.currentWeapon.dmg + (b ? b.value : 0));
    }

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

        // Cada entrada usa exactamente la habilidad que el jugador haya
        // configurado en el Árbol de Habilidades para ese botón.
        if (Input.wasPressed('KeyQ') || Input.touch.q || Input.gamepad.justPressed.ability1) { this.useAssignedSkill('q'); Input.touch.q = false; }
        if (Input.wasPressed('KeyR') || Input.touch.r || Input.gamepad.justPressed.ability2) { this.useAssignedSkill('r'); Input.touch.r = false; }

        this.regenAccum += 0.2 / 60;
        if (this.regenAccum >= 1 && this.bars < this.barCapacity) { this.bars = Math.min(this.barCapacity, this.bars + 1); this.regenAccum = 0; }
        this.bars = Math.min(this.bars, this.barCapacity);

        if (this.mitigationBuff > 0) this.mitigationBuff--; else this.mitigationPct = 0;
        if (this.flashTimer > 0) this.flashTimer--;
        if (this.channelCooldown > 0) this.channelCooldown--;
        if (this.swordThrustTimer > 0 && --this.swordThrustTimer === 0) this.isAttacking = false;
        if (this.swordStormTimer > 0 && --this.swordStormTimer === 0) this.isAttacking = false;
        if (this.knightEarthsplitterTimer > 0 && --this.knightEarthsplitterTimer === 0) this.isAttacking = false;
        if (this.knightCataclysmTimer > 0 && --this.knightCataclysmTimer === 0) this.isAttacking = false;

        if (this.channeling) {
            this.channelTimer++;
            if (this.channelTimer >= this.channelDuration) this.completeChannel();
        }
    }

    useAssignedSkill(slot) {
        const skill = SkillBook.get(SkillBook.assigned[slot]);
        if (!skill || !SkillBook.isLearned(skill.id)) return;
        if (this.currentWeapon.skillBranch !== skill.branch) {
            showDialog('Habilidades', 'Equipa una espada para realizar la habilidad de espada');
            return;
        }
        if (this.bars < skill.cost) return;

        this.bars -= skill.cost;
        if (skill.id === 'sword_thrust') {
            // 3 m equivalen a 90 px en este prototipo. El hitbox recorre el
            // trayecto completo y puede alcanzar a más de un enemigo.
            this.swordThrustTimer = 8;
            this.swordThrustHits = new Set();
            this.isAttacking = true; this.attackTimer = 8;
            this.x += this.facing.x * 90; this.y += this.facing.y * 90;
            const activeWalls = getActiveWalls();
            this.resolveCollisions(true, activeWalls); this.resolveCollisions(false, activeWalls);
            return;
        }
        if (skill.id === 'sword_storm') {
            // Cuatro tajos durante 0.8 s. Cada impacto reinicia y acumula
            // sangrado por cuatro segundos (resuelto en worldInteraction).
            this.swordStormTimer = 48;
            this.swordStormLastSlash = -1;
            this.swordStormHits = new Map();
            this.isAttacking = true; this.attackTimer = 48;
            return;
        }
        if (skill.id === 'knight_earthsplitter') {
            // Un breve armado comunica el peso del mandoble; el golpe se
            // resuelve una sola vez a mitad de la animación.
            this.knightEarthsplitterTimer = 18;
            this.knightEarthsplitterResolved = false;
            this.isAttacking = true; this.attackTimer = 18;
            return;
        }
        if (skill.id === 'knight_cataclysm') {
            // El salto avanza hacia la dirección de mira. El aterrizaje y el
            // área de impacto se resuelven en el último tercio del movimiento.
            this.knightCataclysmTimer = 24;
            this.knightCataclysmResolved = false;
            this.isAttacking = true; this.attackTimer = 24;
            this.x += this.facing.x * 75; this.y += this.facing.y * 75;
            const activeWalls = getActiveWalls();
            this.resolveCollisions(true, activeWalls); this.resolveCollisions(false, activeWalls);
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

        const resistencia = Inventory.getBuff('Resistencia');
        if (resistencia) amount = Math.max(0, amount - resistencia.value);

        // Poción de Defensa (data/recipes.js): reduce el daño un %
        // (20/10/30 según la variante), a diferencia de Resistencia que
        // resta un valor plano fijo.
        const defensa = Inventory.getBuff('Defensa');
        if (defensa) amount = Math.floor(amount * (1 - defensa.value));

        const espinas = Inventory.getBuff('Espinas');
        if (espinas && attacker && typeof attacker.hp === 'number') {
            attacker.hp -= Math.floor(amount * espinas.value);
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

    getSwordThrustHitbox() {
        // Cubre el trayecto del desplazamiento, no solo la posición final.
        const length = 120, thickness = 46;
        if (Math.abs(this.facing.x) >= Math.abs(this.facing.y)) {
            return {
                x: this.facing.x >= 0 ? this.x - 90 : this.x - 30,
                y: this.y + this.h / 2 - thickness / 2,
                w: length, h: thickness
            };
        }
        return {
            x: this.x + this.w / 2 - thickness / 2,
            y: this.facing.y >= 0 ? this.y - 90 : this.y - 30,
            w: thickness, h: length
        };
    }

    getKnightEarthsplitterHitbox() {
        const size = 92, reach = 62;
        return {
            x: this.x + this.w / 2 + this.facing.x * reach - size / 2,
            y: this.y + this.h / 2 + this.facing.y * reach - size / 2,
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
            const box = this.swordThrustTimer > 0 ? this.getSwordThrustHitbox()
                : this.knightEarthsplitterTimer > 0 ? this.getKnightEarthsplitterHitbox() : this.getAttackHitbox();
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 2;
            ctx.fillRect(box.x, box.y, box.w, box.h);
            ctx.strokeRect(box.x, box.y, box.w, box.h);
        }
        if (this.knightCataclysmTimer > 0) {
            const radius = 118;
            ctx.beginPath(); ctx.arc(this.x + this.w / 2, this.y + this.h / 2, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(230,126,34,0.18)'; ctx.fill();
            ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 2; ctx.stroke();
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
