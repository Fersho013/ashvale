/* =====================================================================
   SISTEMA DE STATS — Fuerza / Agilidad / Inteligencia / Vitalidad / Destreza
   Cada punto asignado da bonus según spec. Se ganan al subir de nivel.
   ===================================================================== */

export const STAT_IDS = ['fuerza', 'agilidad', 'inteligencia', 'vitalidad', 'destreza'];

export const STAT_LABELS = {
    fuerza: 'FUERZA',
    agilidad: 'AGILIDAD',
    inteligencia: 'INTELIGENCIA',
    vitalidad: 'VITALIDAD',
    destreza: 'DESTREZA'
};

export const STAT_DESCRIPTIONS = {
    fuerza: '+1 daño espada/dual, +2 daño mandoble/lanza por punto',
    agilidad: '+2 vel.atq espada, +3 dual, +1 resto por punto',
    inteligencia: '+3 daño báculo por punto',
    vitalidad: '+10 HP máximo por punto',
    destreza: '+2 daño espada/dual, +1 mandoble/lanza, +3 arco por punto'
};

export const Stats = {
    available: 0,
    // puntos asignados por stat
    values: { fuerza: 0, agilidad: 0, inteligencia: 0, vitalidad: 0, destreza: 0 },

    get(stat) { return this.values[stat] || 0; },

    canAllocate(stat) { return this.available > 0 && STAT_IDS.includes(stat); },

    allocate(stat) {
        if (!this.canAllocate(stat)) return false;
        this.values[stat]++;
        this.available--;
        window.dispatchEvent(new CustomEvent('stats-updated', { detail: { stat, values: { ...this.values }, available: this.available } }));
        return true;
    },

    // Para refund futuro si se quiere (deallocate)
    refund(stat) {
        if (!STAT_IDS.includes(stat) || this.values[stat] <= 0) return false;
        this.values[stat]--;
        this.available++;
        window.dispatchEvent(new CustomEvent('stats-updated', { detail: { stat, values: { ...this.values }, available: this.available } }));
        return true;
    },

    addPoints(amount) {
        if (amount <= 0) return;
        this.available += amount;
        window.dispatchEvent(new CustomEvent('stats-updated', { detail: { values: { ...this.values }, available: this.available } }));
    },

    // Bonuses derivados — usados por Player
    getDamageBonus(family) {
        const f = this.values.fuerza;
        const d = this.values.destreza;
        const intel = this.values.inteligencia;
        let bonus = 0;
        if (family === 'sword') bonus += f * 1 + d * 2;
        else if (family === 'dualBlades') bonus += f * 1 + d * 2;
        else if (family === 'greatsword') bonus += f * 2 + d * 1;
        else if (family === 'spear') bonus += f * 2 + d * 1;
        else if (family === 'bow') bonus += d * 3;
        else if (family === 'staff') bonus += intel * 3;
        return bonus;
    },

    getVitalityHpBonus() {
        return this.values.vitalidad * 10;
    },

    // Agilidad: reduce cooldown en frames
    getCooldownReduction(family) {
        const a = this.values.agilidad;
        if (family === 'sword') return a * 2;
        if (family === 'dualBlades') return a * 3;
        // mandoble, lanza, báculo, arco
        return a * 1;
    },

    reset() {
        this.available = 0;
        this.values = { fuerza: 0, agilidad: 0, inteligencia: 0, vitalidad: 0, destreza: 0 };
        window.dispatchEvent(new CustomEvent('stats-updated', { detail: { values: { ...this.values }, available: this.available } }));
    },

    toSaveData() {
        return { available: this.available, values: { ...this.values } };
    },

    loadSaveData(data) {
        if (!data) return;
        if (Number.isInteger(data.available) && data.available >= 0) this.available = data.available;
        if (data.values) {
            for (const id of STAT_IDS) {
                const v = Number(data.values[id]);
                if (Number.isInteger(v) && v >= 0) this.values[id] = v;
            }
        }
        window.dispatchEvent(new CustomEvent('stats-updated', { detail: { values: { ...this.values }, available: this.available } }));
    }
};
