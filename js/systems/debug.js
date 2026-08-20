/* =====================================================================
   9. DEBUG PANEL
   ===================================================================== */
import { Slime, Wolf, GoblinExplorer, Deer, DummyMob } from '../entities/mobs.js';
import { Inventory } from './inventory.js';

export const DEBUG = { panelOpen: false, showHitboxes: false };

export function setupDebugPanel(player, world) {
    document.getElementById('dbg-god').addEventListener('change', e => player.godMode = e.target.checked);
    document.getElementById('dbg-hitboxes').addEventListener('change', e => DEBUG.showHitboxes = e.target.checked);

    document.getElementById('dbg-spawn-slime').onclick  = () => world.slimes.push(new Slime(player.x + 40, player.y));
    document.getElementById('dbg-spawn-wolf').onclick   = () => world.wolves.push(new Wolf(player.x + 40, player.y));
    document.getElementById('dbg-spawn-goblin').onclick = () => world.goblins.push(new GoblinExplorer(player.x + 40, player.y));
    document.getElementById('dbg-spawn-deer').onclick   = () => world.deers.push(new Deer(player.x + 40, player.y));
    document.getElementById('dbg-spawn-dummy').onclick  = () => world.dummies.push(new DummyMob(player.x + 40, player.y));

    document.getElementById('dbg-add-gold').onclick = () => {
        Inventory.gold += 100;
        Inventory.addMaterial('Mineral de Hierro', 10);
        Inventory.addMaterial('Agua', 10);
    };
    document.getElementById('dbg-reset').onclick = () => {
        player.hp = player.maxHp; player.bars = player.barCapacity; Inventory.buffs = [];
    };
}
