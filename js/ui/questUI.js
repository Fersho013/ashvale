/* =====================================================================
   UI DE MISIONES — diario del jugador y menú del Caballero Novato
   ===================================================================== */
import { QUESTS, QuestLog } from '../systems/quests.js';
import { showDialog } from './dialog.js';
import { refreshInventoryUI } from './inventoryUI.js';

const KNIGHT_ID = 'novice_knight';
let npcMenuEl = null;

function questPanel() { return document.getElementById('quest-panel'); }
function offerPanel() { return document.getElementById('quest-offer-panel'); }

function closeNpcMenu(restoreHud = true) {
    if (npcMenuEl) npcMenuEl.remove();
    npcMenuEl = null;
    if (restoreHud) document.body.classList.remove('npc-menu-open');
}

export function isNpcMenuOpen() { return !!npcMenuEl; }

export function openNoviceKnightMenu(npc) {
    closeNpcMenu();
    npcMenuEl = document.createElement('div');
    npcMenuEl.id = 'npc-action-menu';
    npcMenuEl.className = 'npc-action-menu';
    npcMenuEl.innerHTML = `<h3>Caballero Novato</h3><button type="button" data-action="talk">Hablar</button><button type="button" data-action="quests">Misiones</button>${QuestLog.hasReadyForNpc(KNIGHT_ID) ? '<button class="npc-deliver" type="button" data-action="deliver">Entregar misiones ✓</button>' : ''}<button type="button" data-action="close">Cerrar</button>`;
    npcMenuEl.addEventListener('click', event => {
        const action = event.target.dataset.action;
        if (!action) return;
        if (action === 'talk') {
            closeNpcMenu();
            const message = npc.messages[Math.floor(Math.random() * npc.messages.length)];
            showDialog('Caballero Novato', message);
        } else if (action === 'quests') {
            closeNpcMenu(false); openQuestOffers(true);
        } else if (action === 'deliver') {
            closeNpcMenu(false); openTurnInMenu();
        } else closeNpcMenu();
    });
    document.body.appendChild(npcMenuEl);
    document.body.classList.add('npc-menu-open');
}

function showOfferList() {
    const body = document.getElementById('quest-offer-content');
    body.innerHTML = '<p class="quest-intro">Elige una misión del Caballero Novato.</p>';
    Object.values(QUESTS).filter(q => q.npcId === KNIGHT_ID).forEach(quest => {
        const accepted = QuestLog.get(quest.id);
        const button = document.createElement('button');
        button.className = 'quest-entry-button';
        button.innerHTML = `<strong>${quest.title}</strong><small>${accepted ? (accepted.status === 'ready' ? '✓ Lista para entregar' : 'En progreso') : 'Disponible'}</small>`;
        button.onclick = () => showOfferDetail(quest.id);
        body.appendChild(button);
    });
}

function showOfferDetail(id) {
    const quest = QUESTS[id], active = QuestLog.get(id), body = document.getElementById('quest-offer-content');
    const unavailable = !active && QuestLog.active.length >= QuestLog.maxActive;
    body.innerHTML = `<h4>${quest.title}</h4><p class="quest-description">${quest.description}</p>${active ? `<p class="quest-progress">${active.status === 'ready' ? '✓ Misión completada: vuelve con el Caballero Novato.' : QuestLog.getProgressText(active)}</p>` : ''}<div class="quest-panel-actions"><button id="quest-accept-btn" type="button" ${active || unavailable ? 'disabled' : ''}>${active ? 'Misión aceptada' : 'Aceptar misión'}</button><button id="quest-offer-back" type="button">Volver</button></div>`;
    document.getElementById('quest-accept-btn').onclick = () => {
        if (QuestLog.accept(id)) showOfferDetail(id);
    };
    document.getElementById('quest-offer-back').onclick = showOfferList;
}

export function openQuestOffers(keepHudHidden = false) {
    if (keepHudHidden) document.body.classList.add('npc-menu-open');
    questPanel().style.display = 'none';
    offerPanel().style.display = 'block';
    showOfferList();
}

function openTurnInMenu() {
    offerPanel().style.display = 'block';
    const body = document.getElementById('quest-offer-content');
    const ready = QuestLog.getByNpc(KNIGHT_ID).filter(q => q.status === 'ready');
    body.innerHTML = '<h4>Misiones completadas</h4><p class="quest-intro">Entrega una misión al Caballero Novato para recibir su recompensa.</p>';
    ready.forEach(entry => {
        const quest = QUESTS[entry.id], button = document.createElement('button');
        button.className = 'quest-entry-button quest-ready';
        button.innerHTML = `<strong>✓ ${quest.title}</strong><small>Entregar · ${quest.rewardGold} Oro</small>`;
        button.onclick = () => {
            const delivered = QuestLog.turnIn(entry.id, KNIGHT_ID);
            if (!delivered) return;
            refreshInventoryUI();
            offerPanel().style.display = 'none';
            document.body.classList.remove('npc-menu-open');
            showDialog('Caballero Novato', `¡Excelente trabajo! Has entregado «${delivered.title}» y recibido ${delivered.rewardGold} Oro.`);
        };
        body.appendChild(button);
    });
}

function showQuestLogList() {
    const list = document.getElementById('quest-list');
    list.innerHTML = '';
    if (QuestLog.active.length === 0) {
        list.innerHTML = '<p class="quest-intro">No has aceptado ninguna mision. No tienes misiones activas.</p>';
        return;
    }
    QuestLog.active.forEach(entry => {
        const quest = QUESTS[entry.id], button = document.createElement('button');
        button.className = `quest-entry-button ${entry.status === 'ready' ? 'quest-ready' : ''}`;
        button.innerHTML = `<strong>${entry.status === 'ready' ? '✓ ' : ''}${quest.title}</strong><small>${entry.status === 'ready' ? 'Completada: entrégala al Caballero Novato' : QuestLog.getProgressText(entry)}</small>`;
        button.onclick = () => showQuestLogDetail(entry.id);
        list.appendChild(button);
    });
}

function showQuestLogDetail(id) {
    const entry = QuestLog.get(id), quest = entry && QUESTS[id];
    if (!entry || !quest) return showQuestLogList();
    const list = document.getElementById('quest-list');
    list.innerHTML = `<h4>${entry.status === 'ready' ? '✓ ' : ''}${quest.title}</h4><p class="quest-description">${quest.description}</p><p class="quest-progress">${entry.status === 'ready' ? 'Misión completada. Vuelve con el Caballero Novato para entregar.' : QuestLog.getProgressText(entry)}</p><div class="quest-panel-actions"><button id="quest-abandon-btn" type="button">Abandonar misión</button><button id="quest-log-back" type="button">Volver</button></div>`;
    document.getElementById('quest-abandon-btn').onclick = () => { QuestLog.abandon(id); showQuestLogList(); };
    document.getElementById('quest-log-back').onclick = showQuestLogList;
}

export function toggleQuestLog(forceOpen) {
    const panel = questPanel();
    const open = panel.style.display === 'block';
    panel.style.display = typeof forceOpen === 'boolean' ? (forceOpen ? 'block' : 'none') : (open ? 'none' : 'block');
    offerPanel().style.display = 'none';
    if (panel.style.display === 'block') showQuestLogList();
}

document.getElementById('quest-panel-close').addEventListener('click', () => toggleQuestLog(false));
document.getElementById('quest-offer-close').addEventListener('click', () => {
    offerPanel().style.display = 'none';
    document.body.classList.remove('npc-menu-open');
});
document.getElementById('quest-menu-btn').addEventListener('click', () => toggleQuestLog());
window.addEventListener('quests-updated', () => {
    if (questPanel().style.display === 'block') showQuestLogList();
    if (offerPanel().style.display === 'block') showOfferList();
});
