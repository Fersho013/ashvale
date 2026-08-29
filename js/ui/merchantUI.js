/* =====================================================================
   MERCADER — Comercio en Zona 4 al lado de la Bocina
   Menú con 4 opciones (Hablar / Comprar / Vender / Cerrar) que oculta el
   HUD como los demás NPC (clase npc-menu-open). Buy/Sell son paneles
   modales inmersivos que también mantienen el HUD oculto (hud-hidden).
   ===================================================================== */
import { Inventory } from '../systems/inventory.js';
import { showDialog } from './dialog.js';
import { refreshInventoryUI } from './inventoryUI.js';
import { WEAPONS } from '../data/weapons.js';

let merchantMenuEl = null;

function closeMerchantMenu(restoreHud = true) {
    if (merchantMenuEl) merchantMenuEl.remove();
    merchantMenuEl = null;
    if (restoreHud) document.body.classList.remove('npc-menu-open');
}

export function isMerchantMenuOpen() { return !!merchantMenuEl && document.body.contains(merchantMenuEl); }

export function openMerchantMenu(merchant) {
    // Cerrar otros menús de NPC si estuvieran abiertos (remover DOM visual; su is*Open pasará a false por contains)
    closeMerchantMenu();
    const otherNpc = document.getElementById('npc-action-menu');
    if (otherNpc) otherNpc.remove();
    const otherGuide = document.querySelector('.npc-action-menu:not(#merchant-action-menu)');
    if (otherGuide && otherGuide.id !== 'merchant-action-menu') otherGuide.remove();
    document.body.classList.remove('npc-menu-open');

    merchantMenuEl = document.createElement('div');
    merchantMenuEl.id = 'merchant-action-menu';
    merchantMenuEl.className = 'npc-action-menu';
    merchantMenuEl.innerHTML = `<h3>Mercader</h3><button type="button" data-action="talk">Hablar</button><button type="button" data-action="buy">Comprar</button><button type="button" data-action="sell">Vender</button><button type="button" data-action="close">Cerrar</button>`;
    merchantMenuEl.addEventListener('click', event => {
        const action = event.target.dataset.action;
        if (!action) return;
        if (action === 'talk') {
            closeMerchantMenu();
            const msg = merchant.messages[Math.floor(Math.random() * merchant.messages.length)];
            showDialog('Mercader', msg);
        } else if (action === 'buy') {
            closeMerchantMenu(false);
            openBuyPanel();
        } else if (action === 'sell') {
            closeMerchantMenu(false);
            openSellPanel();
        } else closeMerchantMenu();
    });
    document.body.appendChild(merchantMenuEl);
    document.body.classList.add('npc-menu-open');
}

// ---------------- Tienda: Comprar ----------------
const SHOP_BUY_ITEMS = [
    { name: 'Pocion de salud menor', price: 20, desc: '+20 HP' },
    { name: 'Pocion de salud', price: 50, desc: '+50 HP' },
    { name: 'Gran Pocion de salud', price: 100, desc: '+80 HP' },
    { name: 'Pocion de defensa', price: 50, desc: 'Reduce 20% daño 3 min' },
    { name: 'Pocion de espinas', price: 50, desc: 'Refleja 20% daño 3 min' }
];

function buyPanel() { return document.getElementById('merchant-buy-panel'); }
function sellPanel() { return document.getElementById('merchant-sell-panel'); }

export function openBuyPanel() {
    document.body.classList.add('npc-menu-open');
    if (sellPanel()) sellPanel().style.display = 'none';
    const panel = buyPanel();
    if (!panel) return;
    panel.style.display = 'block';
    renderBuyList();
}

export function openSellPanel() {
    document.body.classList.add('npc-menu-open');
    if (buyPanel()) buyPanel().style.display = 'none';
    const panel = sellPanel();
    if (!panel) return;
    panel.style.display = 'block';
    renderSellList();
}

function closeBuyPanel() {
    if (buyPanel()) buyPanel().style.display = 'none';
    // Si no hay otro panel mercantil abierto, restaurar HUD
    if (!sellPanel() || sellPanel().style.display !== 'block') document.body.classList.remove('npc-menu-open');
}

function closeSellPanel() {
    if (sellPanel()) sellPanel().style.display = 'none';
    if (!buyPanel() || buyPanel().style.display !== 'block') document.body.classList.remove('npc-menu-open');
}

function renderBuyList() {
    const container = document.getElementById('merchant-buy-content');
    const goldEl = document.getElementById('merchant-buy-gold');
    if (!container) return;
    if (goldEl) goldEl.innerText = Inventory.gold;
    container.innerHTML = '';
    SHOP_BUY_ITEMS.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'quest-entry-button';
        const canAfford = Inventory.gold >= item.price;
        btn.disabled = !canAfford;
        btn.style.opacity = canAfford ? '1' : '0.55';
        btn.innerHTML = `<strong>${item.name}</strong><small>${item.desc} · ${item.price} Oro ${canAfford ? '' : '(sin oro)'}</small>`;
        btn.onclick = () => {
            if (Inventory.gold < item.price) {
                showDialog('Mercader', 'No tienes suficiente oro.');
                return;
            }
            if (!Inventory.addMaterial(item.name, 1)) {
                showDialog('Inventario', '¡Inventario lleno! No puedes comprar más.');
                return;
            }
            Inventory.gold -= item.price;
            refreshInventoryUI();
            renderBuyList();
            showDialog('Mercader', `Has comprado: ${item.name} por ${item.price} Oro.`);
        };
        container.appendChild(btn);
    });
}

const SELL_PRICES = {
    'Bola de Baba': 1,
    'Botella': 2,
    'Botella con Agua': 3,
    'botella con agua': 3,
    'Huevo': 5,
    'huevo': 5,
    'Carne': 5,
    'carne': 5,
    'Carne Cocinada': 20,
    'carne cocinada': 20,
    'Colmillo': 5,
    'colmillo': 5,
    'Cuero': 20,
    'cuero': 20,
    'Metal Oxidado': 5,
    'metal oxidado': 5,
    'Hierro': 20,
    'Mineral de Hierro': 20,
    'Madera': 20,
    'madera': 20,
    'Piedra': 5,
    'piedra': 5,
    // Pociones a mitad de precio de compra
    'Pocion de salud menor': 10,
    'Pocion de salud': 25,
    'Gran Pocion de salud': 50,
    'Pocion de defensa': 25,
    'Pocion de espinas': 25,
    // Variantes con tilde (por si el jugador craftea)
    'Poción de Espinas': 25,
    'Poción de Defensa': 25,
    'Poción de Espinas Reducida (x2)': 12,
    'Poción de Defensa Reducida': 12,
    'Poción de Espinas Aumentada': 25,
    'Poción de Defensa Aumentada': 25
};

function getSellPrice(name) {
    if (SELL_PRICES[name] !== undefined) return SELL_PRICES[name];
    // Armas: 0 oro (todas las del catálogo)
    for (const key in WEAPONS) {
        if (WEAPONS[key].name === name) return 0;
    }
    // No listado: 0 por defecto
    return 0;
}

function renderSellList() {
    const container = document.getElementById('merchant-sell-content');
    const goldEl = document.getElementById('merchant-sell-gold');
    if (!container) return;
    if (goldEl) goldEl.innerText = Inventory.gold;
    container.innerHTML = '';
    // Recolectar todos los stacks del inventario global (y quickbar como respaldo)
    const entries = [];
    Inventory.global.forEach((item, idx) => {
        if (item) entries.push({ item, idx, source: 'global' });
    });
    if (entries.length === 0) {
        container.innerHTML = '<p class="quest-intro">No tienes objetos para vender.</p>';
        return;
    }
    // Agrupar por nombre para mostrar precio unitario
    const byName = new Map();
    entries.forEach(e => {
        if (!byName.has(e.item.name)) byName.set(e.item.name, { total: 0, price: getSellPrice(e.item.name), exampleIdx: e.idx });
        byName.get(e.item.name).total += e.item.qty;
    });
    byName.forEach((info, name) => {
        const btn = document.createElement('button');
        btn.className = 'quest-entry-button';
        const isZero = info.price === 0;
        btn.innerHTML = `<strong>${name} x${info.total}</strong><small>Vender 1 unidad · ${info.price} Oro${isZero ? ' (sin valor)' : ''}</small>`;
        btn.onclick = () => {
            // Buscar el primer stack con ese nombre y vender 1 unidad
            for (let i = 0; i < Inventory.global.length; i++) {
                const it = Inventory.global[i];
                if (it && it.name === name) {
                    it.qty--;
                    if (it.qty <= 0) Inventory.global[i] = null;
                    Inventory.gold += info.price;
                    refreshInventoryUI();
                    renderSellList();
                    if (isZero) showDialog('Mercader', `${name} no tiene valor para mí, pero me lo quedo.`);
                    else showDialog('Mercader', `Has vendido 1x ${name} por ${info.price} Oro.`);
                    break;
                }
            }
            if (goldEl) goldEl.innerText = Inventory.gold;
        };
        container.appendChild(btn);
    });
}

// Cierres — se enganchan en cuanto el DOM existe (el módulo se importa al final del body)
function attachMerchantCloseHandlers() {
    const buyClose = document.getElementById('merchant-buy-close');
    const sellClose = document.getElementById('merchant-sell-close');
    if (buyClose) buyClose.addEventListener('click', closeBuyPanel);
    if (sellClose) sellClose.addEventListener('click', closeSellPanel);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachMerchantCloseHandlers);
else attachMerchantCloseHandlers();

// También exponer cierres para el observer de hudVisibility (display cambia)
export function isMerchantBuyOpen() {
    const el = document.getElementById('merchant-buy-panel');
    return el && el.style.display === 'block';
}
export function isMerchantSellOpen() {
    const el = document.getElementById('merchant-sell-panel');
    return el && el.style.display === 'block';
}
