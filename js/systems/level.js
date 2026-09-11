/* =====================================================================
   SISTEMA DE NIVELES Y EXPERIENCIA — 70 niveles
   Cada entrada de XP_TABLE es la EXP necesaria para pasar de nivel N a N+1
   (índice 0 = 1→2, índice 68 = 69→70). Total 69 valores.
   ===================================================================== */
import { showDialog } from '../ui/dialog.js';
import { Stats } from './stats.js';

export const MAX_LEVEL = 70;

export const XP_TABLE = [
    5, 20, 60, 140, 270, 470, 760, 1160, 1690, 2370,
    3220, 4260, 5510, 6990, 8720, 10720, 13010, 15610, 18540, 21820,
    25470, 29510, 33960, 38840, 44170, 49970, 56260, 63060, 70390, 78270,
    86720, 95760, 105410, 115690, 126620, 138220, 150510, 163510, 177240, 191720,
    206970, 223010, 239860, 257540, 276070, 295470, 315760, 336960, 359090, 382170,
    406220, 431260, 457310, 484390, 512520, 541720, 572010, 603410, 635940, 669620,
    704470, 740510, 777760, 816240, 855970, 896970, 939260, 982860, 1027790
];

// EXP por enemigo (según spec). mobArena no especificado -> 2 como goblin/lobo por ser arena.
export const MOB_XP = {
    slime: 1,
    granSlime: 3,
    lobo: 2,
    goblin: 2,
    mobArena: 2,
    ciervo: 0  // pasivo, sin EXP salvo que el jugador lo mate intencionalmente -> 0
};

export const QUEST_XP = 20;

export const LevelSystem = {
    level: 1,
    xp: 0,
    skillPoints: 0,

    get xpToNext() {
        if (this.level >= MAX_LEVEL) return 0;
        return XP_TABLE[this.level - 1];
    },

    get isMaxLevel() {
        return this.level >= MAX_LEVEL;
    },

    get progress() {
        if (this.isMaxLevel) return 1;
        const need = this.xpToNext;
        return need > 0 ? Math.min(1, this.xp / need) : 0;
    },

    addXp(amount, reason = '') {
        if (this.isMaxLevel || amount <= 0) return;
        this.xp += amount;
        let leveled = false;
        let levelsGained = 0;
        while (!this.isMaxLevel && this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            levelsGained++;
            leveled = true;
            // 1 punto de habilidad por nivel + stats: 3 normal, 5 cada 5 niveles
            this.skillPoints += 1;
            const statGain = (this.level % 5 === 0) ? 5 : 3;
            Stats.addPoints(statGain);
            showDialog('¡Subiste de nivel!', `¡Nivel ${this.level}! +1 PH +${statGain} PS${reason ? ' — ' + reason : ''}`);
        }
        if (this.isMaxLevel) {
            this.xp = 0; // En nivel máximo no se acumula
        }
        window.dispatchEvent(new CustomEvent('level-updated', { detail: { level: this.level, xp: this.xp, xpToNext: this.xpToNext, leveled, skillPoints: this.skillPoints, statPoints: Stats.available } }));
        if (!leveled && amount > 0) {
            window.dispatchEvent(new CustomEvent('xp-gained', { detail: { amount, reason } }));
        }
    },

    // Helpers para save/load y debug
    reset() {
        this.level = 1;
        this.xp = 0;
        this.skillPoints = 0;
        Stats.reset();
        window.dispatchEvent(new CustomEvent('level-updated', { detail: { level: 1, xp: 0, xpToNext: XP_TABLE[0], skillPoints: 0 } }));
    },

    toSaveData() {
        return { level: this.level, xp: this.xp, skillPoints: this.skillPoints };
    },

    loadSaveData(data) {
        if (!data) return;
        const lvl = Number(data.level);
        const xp = Number(data.xp);
        const sp = Number(data.skillPoints);
        if (Number.isInteger(lvl) && lvl >= 1 && lvl <= MAX_LEVEL) this.level = lvl;
        if (Number.isFinite(xp) && xp >= 0) this.xp = this.isMaxLevel ? 0 : xp;
        if (Number.isInteger(sp) && sp >= 0) this.skillPoints = sp;
        else if (data.skillPoints === undefined && this.level > 1) {
            // Migración de partidas viejas sin PH: otorgar 1 por nivel
            this.skillPoints = Math.max(0, this.level - 1);
        }
        // Clamp xp si supera el requerido (por migración de tabla antigua)
        if (!this.isMaxLevel && this.xp >= this.xpToNext) {
            // Normalizar exceso como si hubiera subido de nivel offline
            let curXp = this.xp;
            let curLvl = this.level;
            while (curLvl < MAX_LEVEL && curXp >= XP_TABLE[curLvl - 1]) {
                curXp -= XP_TABLE[curLvl - 1];
                curLvl++;
            }
            this.level = curLvl;
            this.xp = curLvl >= MAX_LEVEL ? 0 : curXp;
        }
        window.dispatchEvent(new CustomEvent('level-updated', { detail: { level: this.level, xp: this.xp, xpToNext: this.xpToNext, skillPoints: this.skillPoints } }));
    }
};
