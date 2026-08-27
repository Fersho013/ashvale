/* =====================================================================
   6. JUGADOR
   ===================================================================== */
import { Input } from '../core/input.js';
import { drawEntity, CHARACTER_SPRITE_SIZE } from '../core/assets.js';
import { drawAtlasAnimation } from '../core/atlas.js';
import { checkRectCollision } from '../core/physics.js';
import { getActiveWalls } from '../world/map.js';
import { WEAPONS, PLAYER_SPRITE_KEYS, getWeaponFamily, weaponSupportsSkill } from '../data/weapons.js';
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
        this.spriteSkillAction = null;
        this.spriteSkillTimer = 0;
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

        // Estados de la rama Espadachín Dual. Tajo Cruzado no reemplaza el
        // ataque actual; Frenesí avanza y causa daño por pulsos durante 2 s.
        this.dualCrossSlashTimer = 0;
        this.dualCrossSlashResolved = false;
        this.dualSteelFrenzyTimer = 0;
        this.dualSteelFrenzyPulse = -1;

        // Lluvia de Espinas fija su área en el punto apuntado al lanzar.
        this.archerThornRainTimer = 0;
        this.archerThornRainPulse = -1;
        this.archerThornRainX = 0;
        this.archerThornRainY = 0;

        // Estados de Lancer: una embestida lineal de alcance amplio y un
        // barrido total para abrir espacio alrededor del jugador.
        this.lancerPhalanxTimer = 0;
        this.lancerPhalanxHits = new Set();
        this.lancerWhirlwindTimer = 0;
        this.lancerWhirlwindResolved = false;

        // Vórtice del Vacío: el centro se fija frente al jugador y atrae
        // durante 2 s antes de liberar una explosión elemental.
        this.arcaneVoidVortexTimer = 0;
        this.arcaneVoidVortexX = 0;
        this.arcaneVoidVortexY = 0;
        this.arcaneVoidVortexExploded = false;

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

        this.respawn = { x: 300, y: 300 };
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
        if (this.spriteSkillTimer > 0 && --this.spriteSkillTimer === 0) this.spriteSkillAction = null;
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
        if (this.dualCrossSlashTimer > 0) this.dualCrossSlashTimer--;
        if (this.dualSteelFrenzyTimer > 0) {
            this.dualSteelFrenzyTimer--;
            // Movimiento continuo, con colisiones, para que el frenesí sea
            // agresivo pero no atraviese paredes.
            const activeWalls = getActiveWalls();
            this.x += this.facing.x * 2.4; this.resolveCollisions(true, activeWalls);
            this.y += this.facing.y * 2.4; this.resolveCollisions(false, activeWalls);
            if (this.dualSteelFrenzyTimer === 0) this.isAttacking = false;
        }
        if (this.archerThornRainTimer > 0) this.archerThornRainTimer--;
        if (this.lancerPhalanxTimer > 0 && --this.lancerPhalanxTimer === 0) this.isAttacking = false;
        if (this.lancerWhirlwindTimer > 0 && --this.lancerWhirlwindTimer === 0) this.isAttacking = false;

        if (this.channeling) {
            this.channelTimer++;
            if (this.channelTimer >= this.channelDuration) this.completeChannel();
        }
    }

    useAssignedSkill(slot) {
        const skill = SkillBook.get(SkillBook.assigned[slot]);
        if (!skill || !SkillBook.isLearned(skill.id)) return;
        if (!weaponSupportsSkill(this.currentWeapon, skill)) {
            const family = getWeaponFamily({ family: skill.weaponFamily });
            showDialog('Habilidades', `Equipa ${family?.requirementLabel || 'un arma compatible'} para hacer la habilidad de ${(skill.branchLabel || skill.branch).toLowerCase()}.`);
            return;
        }
        if (this.bars < skill.cost) return;

        this.bars -= skill.cost;
        this.spriteSkillAction = {
            sword_thrust: 'skill_sword_thrust', sword_storm: 'skill_sword_storm',
            knight_earthsplitter: 'skill_greatsword_earthsplitter', knight_cataclysm: 'skill_greatsword_cataclysm',
            dual_cross_slash: 'skill_dual_cross_slash', dual_steel_frenzy: 'skill_dual_steel_frenzy',
            archer_piercing_shot: 'skill_bow_piercing_shot', archer_thorn_rain: 'skill_bow_thorn_rain',
            lancer_phalanx_charge: 'skill_spear_phalanx_charge', lancer_impaling_whirlwind: 'skill_spear_impaling_whirlwind',
            arcane_aether_projectile: 'skill_staff_aether_projectile', arcane_void_vortex: 'skill_staff_void_vortex'
        }[skill.id] || null;
        this.spriteSkillTimer = this.spriteSkillAction ? 24 : 0;
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
            return;
        }
        if (skill.id === 'dual_cross_slash') {
            // No toca isAttacking: puede insertarse dentro de la secuencia
            // normal de Espadas Duales sin cortarla.
            this.dualCrossSlashTimer = 6;
            this.dualCrossSlashResolved = false;
            return;
        }
        if (skill.id === 'dual_steel_frenzy') {
            this.dualSteelFrenzyTimer = 120;
            this.dualSteelFrenzyPulse = -1;
            this.isAttacking = true; this.attackTimer = 120;
            return;
        }
        if (skill.id === 'archer_piercing_shot') {
            this.pendingProjectile = {
                x: this.x + this.w / 2, y: this.y + this.h / 2,
                dirX: this.facing.x, dirY: this.facing.y,
                dmg: Math.ceil(this.attackDamage * 1.5), weaponKey: 'arco',
                piercing: true, knockback: 24, speed: 16, rangeBlocks: 6, size: 10, color: '#b6f25f', sprite: 'arrow'
            };
            return;
        }
        if (skill.id === 'archer_thorn_rain') {
            this.archerThornRainTimer = 120;
            this.archerThornRainPulse = -1;
            this.archerThornRainX = this.x + this.w / 2 + this.facing.x * 150;
            this.archerThornRainY = this.y + this.h / 2 + this.facing.y * 150;
            return;
        }
        if (skill.id === 'lancer_phalanx_charge') {
            // Avance largo que aprovecha el rango medio de la lanza. El
            // hitbox cubre todo el trayecto y cada enemigo solo recibe un golpe.
            this.lancerPhalanxTimer = 12;
            this.lancerPhalanxHits = new Set();
            this.isAttacking = true; this.attackTimer = 12;
            this.x += this.facing.x * 110; this.y += this.facing.y * 110;
            const activeWalls = getActiveWalls();
            this.resolveCollisions(true, activeWalls); this.resolveCollisions(false, activeWalls);
            return;
        }
        if (skill.id === 'lancer_impaling_whirlwind') {
            this.lancerWhirlwindTimer = 20;
            this.lancerWhirlwindResolved = false;
            this.isAttacking = true; this.attackTimer = 20;
            return;
        }
        if (skill.id === 'arcane_aether_projectile') {
            this.pendingProjectile = {
                x: this.x + this.w / 2, y: this.y + this.h / 2,
                dirX: this.facing.x, dirY: this.facing.y,
                dmg: Math.ceil(this.attackDamage * 1.6), weaponKey: 'baculo',
                speed: 12, rangeBlocks: 5, size: 16, color: '#8e44ad', sprite: 'arcaneBolt', homing: 0.12,
                explosionRadius: 62, magic: true
            };
            return;
        }
        if (skill.id === 'arcane_void_vortex') {
            this.arcaneVoidVortexTimer = 120;
            this.arcaneVoidVortexExploded = false;
            this.arcaneVoidVortexX = this.x + this.w / 2 + this.facing.x * 145;
            this.arcaneVoidVortexY = this.y + this.h / 2 + this.facing.y * 145;
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

    getLancerPhalanxHitbox() {
        const length = 160, thickness = 50;
        if (Math.abs(this.facing.x) >= Math.abs(this.facing.y)) {
            return {
                x: this.facing.x >= 0 ? this.x - 110 : this.x - 16,
                y: this.y + this.h / 2 - thickness / 2,
                w: length, h: thickness
            };
        }
        return {
            x: this.x + this.w / 2 - thickness / 2,
            y: this.facing.y >= 0 ? this.y - 110 : this.y - 16,
            w: thickness, h: length
        };
    }

    draw(ctx) {
        const weapon = this.currentWeapon;
        let color = weapon.color;
        if (this.flashTimer > 0) color = '#ffffff';
        else if (this.isBlocking) color = '#3498db';

        const dirSprites = PLAYER_SPRITE_KEYS[this.facingDir] || PLAYER_SPRITE_KEYS.centro;
        const spriteKey = (this.isMoving && this.walkFrameToggle) ? dirSprites.walk : dirSprites.idle;
        const direction = this.facingDir === 'centro' ? 'down' : this.facingDir;
        const atlasAnimation = this.getAtlasAnimation();
        const renderedFromAtlas = drawAtlasAnimation(
            ctx, 'player', atlasAnimation, direction, Math.floor(performance.now() / 80),
            this.x + this.w / 2 - CHARACTER_SPRITE_SIZE.w / 2,
            this.y + this.h - CHARACTER_SPRITE_SIZE.h,
            CHARACTER_SPRITE_SIZE.w, CHARACTER_SPRITE_SIZE.h, 'feet'
        );
        if (!renderedFromAtlas) {
            drawEntity(ctx, spriteKey, this.x, this.y, this.w, this.h, color, 'rect', null, CHARACTER_SPRITE_SIZE);
        }

        if (this.isAttacking && !weapon.ranged) {
            const box = this.swordThrustTimer > 0 ? this.getSwordThrustHitbox()
                : this.knightEarthsplitterTimer > 0 ? this.getKnightEarthsplitterHitbox()
                : this.lancerPhalanxTimer > 0 ? this.getLancerPhalanxHitbox() : this.getAttackHitbox();
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
        if (this.dualCrossSlashTimer > 0) {
            const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
            ctx.strokeStyle = '#9b59b6'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(cx - 34, cy - 34); ctx.lineTo(cx + 34, cy + 34); ctx.moveTo(cx + 34, cy - 34); ctx.lineTo(cx - 34, cy + 34); ctx.stroke();
        }
        if (this.dualSteelFrenzyTimer > 0) {
            ctx.beginPath(); ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 54, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(155,89,182,0.18)'; ctx.fill();
            ctx.strokeStyle = '#9b59b6'; ctx.lineWidth = 3; ctx.stroke();
        }
        if (this.archerThornRainTimer > 0) {
            ctx.beginPath(); ctx.arc(this.archerThornRainX, this.archerThornRainY, 82, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(46,204,113,0.18)'; ctx.fill();
            ctx.strokeStyle = '#b6f25f'; ctx.lineWidth = 2; ctx.stroke();
        }
        if (this.lancerWhirlwindTimer > 0) {
            ctx.beginPath(); ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 92, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(241,196,15,0.18)'; ctx.fill();
            ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 3; ctx.stroke();
        }
        if (this.arcaneVoidVortexTimer > 0) {
            const radius = 86;
            ctx.beginPath(); ctx.arc(this.arcaneVoidVortexX, this.arcaneVoidVortexY, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(142,68,173,0.20)'; ctx.fill();
            ctx.strokeStyle = '#c39bd3'; ctx.lineWidth = 3; ctx.stroke();
            ctx.beginPath(); ctx.arc(this.arcaneVoidVortexX, this.arcaneVoidVortexY, 16, 0, Math.PI * 2);
            ctx.fillStyle = '#241133'; ctx.fill();
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

    getAtlasAnimation() {
        if (this.spriteSkillTimer > 0 && this.spriteSkillAction) return this.spriteSkillAction;
        if (this.swordThrustTimer > 0) return 'skill_sword_thrust';
        if (this.swordStormTimer > 0) return 'skill_sword_storm';
        if (this.knightEarthsplitterTimer > 0) return 'skill_greatsword_earthsplitter';
        if (this.knightCataclysmTimer > 0) return 'skill_greatsword_cataclysm';
        if (this.dualCrossSlashTimer > 0) return 'skill_dual_cross_slash';
        if (this.dualSteelFrenzyTimer > 0) return 'skill_dual_steel_frenzy';
        if (this.archerThornRainTimer > 0) return 'skill_bow_thorn_rain';
        if (this.lancerPhalanxTimer > 0) return 'skill_spear_phalanx_charge';
        if (this.lancerWhirlwindTimer > 0) return 'skill_spear_impaling_whirlwind';
        if (this.arcaneVoidVortexTimer > 0) return 'skill_staff_void_vortex';
        if (this.isAttacking) {
            const family = this.currentWeapon.family;
            if (family === 'sword') return 'attack_sword';
            if (family === 'greatsword') return 'attack_greatsword';
            if (family === 'dualBlades') return 'attack_dual_blades';
            if (family === 'bow') return 'attack_bow';
            if (family === 'spear') return 'attack_spear';
            if (family === 'staff') return 'attack_staff';
        }
        return this.isMoving ? 'move' : 'idle';
    }
}
