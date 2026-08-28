/* =====================================================================
   GUARDADO Y CARGA DE PARTIDA
   ===================================================================== */
import { Inventory } from './inventory.js';
import { doors } from '../world/map.js';
import { harvestNodes } from '../world/worldObjects.js';
import { game } from '../core/gameContext.js';
import { state } from '../state.js';
import { SkillBook } from './skills.js';
import { QuestLog } from './quests.js';

export const SAVE_KEY = 'ashvale_save_v1';

export function saveGameState() {
    const player = game.player;
    const data = {
        player: { x: player.x, y: player.y, hp: player.hp, bars: player.bars, barCapacity: player.barCapacity, respawn: player.respawn },
        inventory: {
            quickbar: Inventory.quickbar, global: Inventory.global, chests: Inventory.chests,
            equipment: Inventory.equipment, gold: Inventory.gold
        },
        doors: doors.map(d => d.open),
        harvestNodes: harvestNodes.map(node => ({ uses: node.uses, recoveryUntil: node.recoveryUntil })),
        skills: SkillBook.toSaveData(),
        quests: QuestLog.toSaveData(),
        tutorialMapScale: 2
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (err) { console.warn('No se pudo guardar la partida:', err); }
}

export function loadGameState() {
    let raw;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (err) { raw = null; }
    if (!raw) return false;
    const data = JSON.parse(raw);
    // Las partidas guardadas en el mapa anterior (1200×900) se trasladan a
    // su posición equivalente dentro del nuevo plano duplicado una sola vez.
    if (data.tutorialMapScale !== 2 && data.player) {
        data.player.x *= 2; data.player.y *= 2;
        if (data.player.respawn) {
            data.player.respawn.x *= 2;
            data.player.respawn.y *= 2;
        }
    }
    // La clave interna del arma se conserva como "dagas", pero las partidas
    // previas guardaban su nombre anterior. Se migra al cargar para que siga
    // siendo equipable después del cambio a Espadas Duales.
    const renameDualSwords = item => { if (item && item.name === 'Dagas Duales') item.name = 'Espadas Duales'; };
    [data.inventory.quickbar, data.inventory.global].forEach(items => items?.forEach(renameDualSwords));
    Object.values(data.inventory.chests || {}).forEach(items => items?.forEach(renameDualSwords));
    const player = game.player;
    player.x = data.player.x; player.y = data.player.y; player.hp = data.player.hp;
    player.bars = data.player.bars; player.barCapacity = data.player.barCapacity; player.respawn = data.player.respawn;
    Inventory.quickbar = data.inventory.quickbar; Inventory.global = data.inventory.global;
    // Compatibilidad con partidas guardadas ANTES del punto 2 (un solo
    // Inventory.chest): si no existe el formato nuevo (chests), se deja el
    // set de 3 cofres recién sembrado por defecto en vez de romper la carga.
    if (data.inventory.chests) Inventory.chests = data.inventory.chests;
    Inventory.equipment = data.inventory.equipment || { weapon: null, tool: null, armor: null, accessory: null };
    Inventory.equipment.tool ??= null; Inventory.equipment.armor ??= null; Inventory.equipment.accessory ??= null;
    player.hp = Math.min(player.hp, player.maxHp);
    Inventory.gold = data.inventory.gold;
    SkillBook.loadSaveData(data.skills);
    QuestLog.loadSaveData(data.quests);
    doors.forEach((d, i) => { if (data.doors[i] !== undefined) d.open = data.doors[i]; });
    // Las partidas previas a los recursos renovables no tienen esta sección;
    // en ese caso los nodos conservan su estado inicial listo para usar.
    if (Array.isArray(data.harvestNodes)) {
        harvestNodes.forEach((node, i) => {
            const saved = data.harvestNodes[i];
            if (!saved) return;
            node.uses = Number.isInteger(saved.uses) ? saved.uses : 0;
            node.recoveryUntil = typeof saved.recoveryUntil === 'number' ? saved.recoveryUntil : 0;
        });
    }
    return true;
}

// Autoguardado periódico + al cerrar/salir de la pestaña, solo si hay partida en curso
setInterval(() => { if (state.gameStarted) saveGameState(); }, 15000);
window.addEventListener('beforeunload', () => { if (state.gameStarted) saveGameState(); });
