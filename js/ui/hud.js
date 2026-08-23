/* =====================================================================
   10. QUICKBAR, BUFFS Y HUD PRINCIPAL
   ===================================================================== */
import { Inventory, tryConsumeItem } from '../systems/inventory.js';
import { getCurrentZone } from '../world/map.js';
import { game } from '../core/gameContext.js';

export function buildQuickbarUI() {
    const bar = document.getElementById('quickbar');
    bar.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const slot = document.createElement('div');
        slot.className = 'qb-slot';
        const keyLabel = i === 9 ? '0' : String(i + 1);
        slot.innerHTML = `<span class="key">${keyLabel}</span>`;
        slot.onclick = () => tryConsumeItem(Inventory.quickbar, i);
        bar.appendChild(slot);
    }
}

export function refreshQuickbarUI() {
    const slots = document.querySelectorAll('#quickbar .qb-slot');
    slots.forEach((slot, i) => {
        const item = Inventory.quickbar[i];
        const keyLabel = i === 9 ? '0' : String(i + 1);
        if (item) slot.innerHTML = `<span class="key">${keyLabel}</span>${item.name.slice(0,4)}<span class="qty">${item.qty}</span>`;
        else slot.innerHTML = `<span class="key">${keyLabel}</span>`;
    });
}

export function refreshBuffsUI() {
    const panel = document.getElementById('buffs-panel');
    panel.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const b = Inventory.buffs[i];
        const div = document.createElement('div');
        div.className = 'buff-icon';
        if (b) {
            div.style.borderColor = b.color; div.style.color = b.color;
            div.innerHTML = `${b.name}<span class="timer">${Math.ceil(b.timer/60)}s</span>`;
        } else { div.style.opacity = '0.25'; div.innerText = '—'; }
        panel.appendChild(div);
    }
}

export function updateHUD() {
    const player = game.player;
    document.getElementById('hp-text').innerText = `${Math.max(0,Math.round(player.hp))}/${player.maxHp}`;
    document.getElementById('hp-fill').style.width = `${(player.hp / player.maxHp) * 100}%`;
    document.getElementById('weapon-text').innerText = player.currentWeapon.name;
    document.getElementById('gold-text').innerText = Inventory.gold;

    const gaugeEl = document.getElementById('skill-gauge');
    if (gaugeEl.children.length !== player.barCapacity) {
        gaugeEl.innerHTML = '';
        for (let i = 0; i < player.barCapacity; i++) { const pip = document.createElement('div'); pip.className = 'skill-pip'; gaugeEl.appendChild(pip); }
    }
    Array.from(gaugeEl.children).forEach((pip, i) => pip.classList.toggle('filled', i < Math.floor(player.bars)));

    document.getElementById('escape-bar-fill').style.width = player.channeling ? `${(player.channelTimer/player.channelDuration)*100}%` : '0%';

    const zone = getCurrentZone(player);
    document.getElementById('zone-label').innerText = zone.name;

    refreshBuffsUI();
    refreshQuickbarUI();
    // Nota: NO se refrescan aquí inv-grid/chest-grid en cada frame — hacerlo
    // reconstruía esos paneles ~60 veces por segundo, lo que podía destruir
    // el <div> justo entre el mousedown y el mouseup de un click en PC y
    // cancelar el evento "click" (el mini menú nunca llegaba a abrirse).
    // Cada acción que modifica el inventario ya llama explícitamente a
    // refreshInventoryUI()/refreshChestUI() por su cuenta (ver inventoryUI.js,
    // inventory.js y craftingUI.js), así que no hace falta hacerlo aquí.
}
