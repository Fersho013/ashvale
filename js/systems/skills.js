/* =====================================================================
   LIBRO DE HABILIDADES — progreso, aprendizaje y asignación Q/R.
   Las dos habilidades de Espadachín comienzan aprendidas para el tutorial,
   pero el jugador debe asignarlas manualmente a Q o R antes de usarlas.
   ===================================================================== */
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
    }
};

const tutorialLearned = { sword_thrust: true, sword_storm: true };

export const SkillBook = {
    learned: { ...tutorialLearned },
    levels: { sword_thrust: 1, sword_storm: 1 },
    assigned: { q: null, r: null },

    get(id) { return SKILLS[id] || null; },
    isLearned(id) { return !!this.learned[id]; },
    learn(id) {
        if (!SKILLS[id]) return false;
        this.learned[id] = true;
        this.levels[id] = Math.max(1, this.levels[id] || 0);
        return true;
    },
    assign(id, slot) {
        if (!this.isLearned(id) || !['q', 'r'].includes(slot)) return false;
        // Una habilidad ocupa un solo botón a la vez; si se mueve, libera
        // automáticamente el anterior para evitar asignaciones duplicadas.
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
            if (!SKILLS[this.assigned[slot]] || !this.isLearned(this.assigned[slot])) this.assigned[slot] = null;
        });
    }
};
