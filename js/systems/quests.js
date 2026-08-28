/* =====================================================================
   SISTEMA DE MISIONES — registro, progreso y entrega por NPC
   ===================================================================== */
import { Inventory } from './inventory.js';

export const QUESTS = {
    analyze_slime: {
        id: 'analyze_slime', npcId: 'novice_knight', title: 'Analicemos la baba',
        description: 'Esos slimes pegajosos están por todas partes, pero su viscosidad guarda propiedades fascinantes. Ve al campo, elimina a los suficientes y tráeme 20 bolas de baba para que pueda examinarlas en mi mesa de trabajo.',
        objective: { type: 'deliver', item: 'Bola de Baba', qty: 20, label: 'Bolas de Baba' }, rewardGold: 100
    },
    arena_creature: {
        id: 'arena_creature', npcId: 'novice_knight', title: 'El bicho raro de la arena',
        description: 'Hay una criatura inusual merodeando en la zona de combate de la arena. No comprendemos bien cómo reacciona ni qué tan peligrosa puede ser, así que necesito que entres allí y derrotes 5 veces al Mob de Arena para estudiar su comportamiento en batalla.',
        objective: { type: 'defeat', mob: 'mobArena', qty: 5, label: 'Mobs de Arena derrotados' }, rewardGold: 125
    },
    wolf_memories: {
        id: 'wolf_memories', npcId: 'novice_knight', title: 'Recuerdos del lobo',
        description: 'Los lobos del bosque se han vuelto demasiado agresivos y están amenazando a los viajeros. Adéntrate en la arboleda, derrota a 5 lobos y tráeme 5 de sus colmillos como prueba de que la zona vuelve a ser segura.',
        objective: { type: 'defeatAndDeliver', mob: 'lobo', kills: 5, item: 'Colmillo', qty: 5, label: 'Lobos derrotados y Colmillos' }, rewardGold: 150
    },
    defense_count: {
        id: 'defense_count', npcId: 'novice_knight', title: 'Cuanta defensa',
        description: 'Ahí fuera los golpes duelen y vas a necesitar más que una simple armadura. Ve a la máquina de pociones, prepara 1 poción de defensa y tráemela para confirmar que estás listo para resistir ataques pesados.',
        objective: { type: 'craftAndDeliver', item: 'Poción de Defensa', qty: 1, label: 'Poción de Defensa preparada' }, rewardGold: 100
    }
};

const MAX_ACTIVE_QUESTS = 10;
const notify = () => window.dispatchEvent(new Event('quests-updated'));

function countItem(name) {
    return [...Inventory.global, ...Inventory.quickbar]
        .reduce((total, stack) => total + (stack?.name === name ? stack.qty : 0), 0);
}

function removeItem(name, qty) {
    let remaining = qty;
    for (const list of [Inventory.global, Inventory.quickbar]) {
        for (const stack of list) {
            if (!stack || stack.name !== name || remaining <= 0) continue;
            const removed = Math.min(stack.qty, remaining);
            stack.qty -= removed; remaining -= removed;
            if (stack.qty <= 0) list[list.indexOf(stack)] = null;
        }
    }
    return remaining === 0;
}

function progressText(entry) {
    const q = QUESTS[entry.id], o = q.objective;
    if (o.type === 'deliver') return `${countItem(o.item)}/${o.qty} ${o.label}`;
    if (o.type === 'defeat') return `${entry.progress}/${o.qty} ${o.label}`;
    if (o.type === 'defeatAndDeliver') return `${entry.progress}/${o.kills} Lobos · ${countItem(o.item)}/${o.qty} Colmillos`;
    return `${entry.progress}/${o.qty} ${o.label}`;
}

function isReady(entry) {
    const o = QUESTS[entry.id].objective;
    if (o.type === 'deliver') return countItem(o.item) >= o.qty;
    if (o.type === 'defeat') return entry.progress >= o.qty;
    if (o.type === 'defeatAndDeliver') return entry.progress >= o.kills && countItem(o.item) >= o.qty;
    return entry.progress >= o.qty && countItem(o.item) >= o.qty;
}

export const QuestLog = {
    active: [],
    get maxActive() { return MAX_ACTIVE_QUESTS; },
    get(id) { return this.active.find(q => q.id === id) || null; },
    hasReadyForNpc(npcId) { return this.active.some(q => q.npcId === npcId && q.status === 'ready'); },
    getByNpc(npcId) { return this.active.filter(q => q.npcId === npcId); },
    getProgressText(entry) { return progressText(entry); },

    accept(id) {
        if (!QUESTS[id] || this.get(id) || this.active.length >= MAX_ACTIVE_QUESTS) return false;
        this.active.push({ id, npcId: QUESTS[id].npcId, progress: 0, status: 'active' });
        this.sync(); notify();
        return true;
    },

    abandon(id) {
        const index = this.active.findIndex(q => q.id === id);
        if (index < 0) return false;
        this.active.splice(index, 1); notify();
        return true;
    },

    recordDefeat(mobId) {
        let changed = false;
        this.active.forEach(entry => {
            if (entry.status === 'ready') return;
            const o = QUESTS[entry.id].objective;
            const needed = o.mob;
            if (needed !== mobId) return;
            const target = o.type === 'defeatAndDeliver' ? o.kills : o.qty;
            entry.progress = Math.min(target, entry.progress + 1);
            changed = true;
        });
        if (changed) { this.sync(); notify(); }
    },

    recordCrafted(itemName) {
        let changed = false;
        this.active.forEach(entry => {
            const o = QUESTS[entry.id].objective;
            if (entry.status !== 'ready' && o.type === 'craftAndDeliver' && o.item === itemName) {
                entry.progress = Math.min(o.qty, entry.progress + 1); changed = true;
            }
        });
        if (changed) { this.sync(); notify(); }
    },

    sync() {
        let changed = false;
        this.active.forEach(entry => {
            if (entry.status === 'active' && isReady(entry)) { entry.status = 'ready'; changed = true; }
        });
        if (changed) notify();
    },

    turnIn(id, npcId) {
        const entry = this.get(id), quest = entry && QUESTS[id];
        if (!entry || !quest || entry.npcId !== npcId || entry.status !== 'ready') return null;
        const o = quest.objective;
        if (o.type !== 'defeat' && !removeItem(o.item, o.qty)) return null;
        Inventory.gold += quest.rewardGold;
        this.active = this.active.filter(q => q !== entry);
        notify();
        return quest;
    },

    toSaveData() { return this.active.map(q => ({ ...q })); },
    loadSaveData(data) {
        this.active = Array.isArray(data)
            ? data.filter(q => QUESTS[q.id] && q.npcId === QUESTS[q.id].npcId).slice(0, MAX_ACTIVE_QUESTS)
                .map(q => ({ id: q.id, npcId: q.npcId, progress: Number(q.progress) || 0, status: q.status === 'ready' ? 'ready' : 'active' }))
            : [];
        this.sync();
    }
};
