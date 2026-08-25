/* =====================================================================
   GUARDADO Y CARGA DE PARTIDA
   ===================================================================== */
import { Inventory } from './inventory.js';
import { doors } from '../world/map.js';
import { game } from '../core/gameContext.js';
import { state } from '../state.js';

export const SAVE_KEY = 'ashvale_save_v1';

export function saveGameState() {
    const player = game.player;
    const data = {
        player: { x: player.x, y: player.y, hp: player.hp, bars: player.bars, barCapacity: player.barCapacity, respawn: player.respawn },
        inventory: {
            quickbar: Inventory.quickbar, global: Inventory.global, chests: Inventory.chests,
            equipment: Inventory.equipment, gold: Inventory.gold
        },
        doors: doors.map(d => d.open)
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (err) { console.warn('No se pudo guardar la partida:', err); }
}

export function loadGameState() {
    let raw;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (err) { raw = null; }
    if (!raw) return false;
    const data = JSON.parse(raw);
    const player = game.player;
    player.x = data.player.x; player.y = data.player.y; player.hp = data.player.hp;
    player.bars = data.player.bars; player.barCapacity = data.player.barCapacity; player.respawn = data.player.respawn;
    Inventory.quickbar = data.inventory.quickbar; Inventory.global = data.inventory.global;
    // Compatibilidad con partidas guardadas ANTES del punto 2 (un solo
    // Inventory.chest): si no existe el formato nuevo (chests), se deja el
    // set de 3 cofres recién sembrado por defecto en vez de romper la carga.
    if (data.inventory.chests) Inventory.chests = data.inventory.chests;
    Inventory.equipment = data.inventory.equipment; Inventory.gold = data.inventory.gold;
    doors.forEach((d, i) => { if (data.doors[i] !== undefined) d.open = data.doors[i]; });
    return true;
}

// Autoguardado periódico + al cerrar/salir de la pestaña, solo si hay partida en curso
setInterval(() => { if (state.gameStarted) saveGameState(); }, 15000);
window.addEventListener('beforeunload', () => { if (state.gameStarted) saveGameState(); });
