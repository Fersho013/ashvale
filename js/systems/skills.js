/* =====================================================================
   LIBRO DE HABILIDADES — progreso, aprendizaje y asignación Q/R.
   Las dos habilidades de Espadachín comienzan aprendidas para el tutorial,
   pero el jugador debe asignarlas manualmente a Q o R antes de usarlas.
   Las pasivas, una vez aprendidas, siempre están activas.
   ===================================================================== */
import { LevelSystem } from './level.js';

export const SKILLS = {
    sword_thrust: {
        id: 'sword_thrust', branch: 'swordsman', branchLabel: 'Espadachín', name: 'Estocada Veloz', shortLabel: 'EV',
        weaponFamily: 'sword', cost: 1, description: 'Desplazamiento de 3 m que golpea en línea recta.'
    },
    sword_storm: {
        id: 'sword_storm', branch: 'swordsman', branchLabel: 'Espadachín', name: 'Filo Tormentoso', shortLabel: 'FT',
        weaponFamily: 'sword', cost: 3, description: 'Cuatro cortes frontales que acumulan sangrado.'
    },
    knight_earthsplitter: {
        id: 'knight_earthsplitter', branch: 'knight', branchLabel: 'Caballero', name: 'Hendidura Terrenal', shortLabel: 'HT',
        weaponFamily: 'greatsword', cost: 1, description: 'Golpe descendente que destruye la postura y rompe la defensa de enemigos menores.'
    },
    knight_cataclysm: {
        id: 'knight_cataclysm', branch: 'knight', branchLabel: 'Caballero', name: 'Impacto Cataclismo', shortLabel: 'IC',
        weaponFamily: 'greatsword', cost: 3, description: 'Salto y aplastamiento en área que aturde a enemigos no jefes durante 1.5 segundos.'
    },
    dual_cross_slash: {
        id: 'dual_cross_slash', branch: 'dual-swordsman', branchLabel: 'Espadachín Dual', name: 'Tajo Cruzado', shortLabel: 'TC',
        weaponFamily: 'dualBlades', cost: 1, description: 'Doble corte instantáneo en X que mantiene la presión del ataque básico.'
    },
    dual_steel_frenzy: {
        id: 'dual_steel_frenzy', branch: 'dual-swordsman', branchLabel: 'Espadachín Dual', name: 'Frenesí de Acero', shortLabel: 'FA',
        weaponFamily: 'dualBlades', cost: 3, description: 'Cortes giratorios en avance durante 2 segundos; resiste interrupciones menores.'
    },
    archer_piercing_shot: {
        id: 'archer_piercing_shot', branch: 'archer', branchLabel: 'Arquero', name: 'Disparo Perforante', shortLabel: 'DP',
        weaponFamily: 'bow', cost: 1, description: 'Flecha de alta velocidad que atraviesa enemigos y los empuja hacia atrás.'
    },
    archer_thorn_rain: {
        id: 'archer_thorn_rain', branch: 'archer', branchLabel: 'Arquero', name: 'Lluvia de Espinas', shortLabel: 'LE',
        weaponFamily: 'bow', cost: 3, description: 'Lluvia de flechas en un área focalizada que inflige daño continuo y ralentiza.'
    },
    lancer_phalanx_charge: {
        id: 'lancer_phalanx_charge', branch: 'lancer', branchLabel: 'Lancer', name: 'Embestida de Falange', shortLabel: 'EF',
        weaponFamily: 'spear', cost: 1, description: 'Empuje frontal de largo alcance que interrumpe a enemigos menores.'
    },
    lancer_impaling_whirlwind: {
        id: 'lancer_impaling_whirlwind', branch: 'lancer', branchLabel: 'Lancer', name: 'Torbellino Empalador', shortLabel: 'TE',
        weaponFamily: 'spear', cost: 3, description: 'Barrido de 360° que empuja enemigos y rompe su postura.'
    },
    arcane_aether_projectile: {
        id: 'arcane_aether_projectile', branch: 'arcane', branchLabel: 'Arcano', name: 'Proyectil de Éter', shortLabel: 'PE',
        weaponFamily: 'staff', cost: 1, description: 'Proyectil mágico de ligero auto-seguimiento que explota al impactar.'
    },
    arcane_void_vortex: {
        id: 'arcane_void_vortex', branch: 'arcane', branchLabel: 'Arcano', name: 'Vórtice del Vacío', shortLabel: 'VV',
        weaponFamily: 'staff', cost: 3, description: 'Falla gravitacional que atrae enemigos durante 2 s y culmina en una explosión elemental.'
    }
};

export const PASSIVE_SKILLS = {
    passive_sword_strength: { id: 'passive_sword_strength', branch: 'passives', branchLabel: 'Pasivas', name: 'Filo Afilado', shortLabel: 'FA', weaponFamily: 'sword', description: 'Pasiva: +2 daño con espada y espadas duales. Siempre activa.' , passiveBonus: { sword: 2, dualBlades: 2 } },
    passive_great_mighty: { id: 'passive_great_mighty', branch: 'passives', branchLabel: 'Pasivas', name: 'Fuerza Colosal', shortLabel: 'FC', weaponFamily: 'greatsword', description: 'Pasiva: +3 daño con mandoble y lanza. Siempre activa.', passiveBonus: { greatsword: 3, spear: 3 } },
    passive_arcane_focus: { id: 'passive_arcane_focus', branch: 'passives', branchLabel: 'Pasivas', name: 'Foco Arcano', shortLabel: 'FA', weaponFamily: 'staff', description: 'Pasiva: +4 daño con báculo. Siempre activa.', passiveBonus: { staff: 4 } },
    passive_vital_core: { id: 'passive_vital_core', branch: 'passives', branchLabel: 'Pasivas', name: 'Corazón Vigoroso', shortLabel: 'CV', description: 'Pasiva: +25 HP máximo. Siempre activa.', passiveBonus: { hp: 25 } },
    passive_hunter_eye: { id: 'passive_hunter_eye', branch: 'passives', branchLabel: 'Pasivas', name: 'Ojo de Halcón', shortLabel: 'OH', weaponFamily: 'bow', description: 'Pasiva: +3 daño con arco y +0.3 velocidad. Siempre activa.', passiveBonus: { bow: 3, speed: 0.3 } },
    passive_agile_steps: { id: 'passive_agile_steps', branch: 'passives', branchLabel: 'Pasivas', name: 'Pasos Ágiles', shortLabel: 'PA', description: 'Pasiva: +0.5 velocidad de movimiento. Siempre activa.', passiveBonus: { speed: 0.5 } }
};

const tutorialLearned = { sword_thrust: true, sword_storm: true };

export const SkillBook = {
    learned: { ...tutorialLearned },
    levels: { sword_thrust: 1, sword_storm: 1 },
    assigned: { q: null, r: null },

    get(id) { return SKILLS[id] || PASSIVE_SKILLS[id] || null; },
    isPassive(id) { return !!PASSIVE_SKILLS[id]; },
    isLearned(id) { return !!this.learned[id]; },
    getPassiveBonus(family) {
        let bonus = 0;
        for (const id of Object.keys(this.learned)) {
            if (!this.learned[id]) continue;
            const s = PASSIVE_SKILLS[id];
            if (!s || !s.passiveBonus) continue;
            if (s.passiveBonus[family]) bonus += s.passiveBonus[family];
        }
        return bonus;
    },
    getPassiveHpBonus() {
        let hp = 0;
        for (const id of Object.keys(this.learned)) {
            if (!this.learned[id]) continue;
            const s = PASSIVE_SKILLS[id];
            if (s?.passiveBonus?.hp) hp += s.passiveBonus.hp;
        }
        return hp;
    },
    getPassiveSpeedBonus() {
        let sp = 0;
        for (const id of Object.keys(this.learned)) {
            if (!this.learned[id]) continue;
            const s = PASSIVE_SKILLS[id];
            if (s?.passiveBonus?.speed) sp += s.passiveBonus.speed;
        }
        return sp;
    },
    learn(id) {
        const skill = SKILLS[id] || PASSIVE_SKILLS[id];
        if (!skill) return false;
        if (this.isLearned(id)) return false;
        // Las dos de tutorial ya están aprendidas sin coste; el resto consume 1 PH
        const isTutorial = !!tutorialLearned[id];
        if (!isTutorial) {
            if (LevelSystem.skillPoints <= 0) return false;
            LevelSystem.skillPoints = Math.max(0, LevelSystem.skillPoints - 1);
            window.dispatchEvent(new CustomEvent('level-updated', { detail: { skillPoints: LevelSystem.skillPoints } }));
        }
        this.learned[id] = true;
        this.levels[id] = Math.max(1, this.levels[id] || 0);
        return true;
    },
    assign(id, slot) {
        if (!this.isLearned(id) || !['q', 'r'].includes(slot)) return false;
        if (this.isPassive(id)) return false;
        Object.keys(this.assigned).forEach(key => { if (this.assigned[key] === id) this.assigned[key] = null; });
        this.assigned[slot] = id;
        return true;
    },
    toSaveData() {
        return { learned: { ...this.learned }, levels: { ...this.levels }, assigned: { ...this.assigned } };
    },
    loadSaveData(data) {
        this.learned = { ...tutorialLearned, ...(data?.learned || {}) };
        this.levels = { sword_thrust: 1, sword_storm: 1, ...(data?.levels || {}) };
        this.assigned = { q: null, r: null, ...(data?.assigned || {}) };
        Object.keys(this.assigned).forEach(slot => {
            const id = this.assigned[slot];
            if (!id || SKILLS[id] == null) this.assigned[slot] = null;
            else if (!this.isLearned(id)) this.assigned[slot] = null;
        });
    }
};
