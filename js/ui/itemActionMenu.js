/* =====================================================================
   MENÚ CONTEXTUAL DE ACCIONES DE ÍTEM
   Reemplaza el arrastre (poco confiable en móvil, PC y mando) por un
   sistema de selección por toque: tocar/clickear un slot con un ítem
   abre un cuadrito con las acciones disponibles para ese ítem. Solo
   un menú puede estar abierto a la vez, y se cierra al elegir una
   acción, al tocar "Cerrar", o al tocar fuera del cuadro.
   ===================================================================== */
let menuEl = null;
let outsideCloseHandler = null;
let selectedEl = null;
let itemNameEl = null;

function ensureMenuEl() {
    if (menuEl) return menuEl;
    menuEl = document.createElement('div');
    menuEl.id = 'item-action-menu';
    menuEl.className = 'item-action-menu';
    document.body.appendChild(menuEl);
    return menuEl;
}

function ensureItemNameEl() {
    if (itemNameEl) return itemNameEl;
    itemNameEl = document.createElement('div');
    itemNameEl.id = 'item-selected-name';
    itemNameEl.className = 'item-selected-name';
    document.body.appendChild(itemNameEl);
    return itemNameEl;
}

export function closeItemActionMenu() {
    if (selectedEl) { selectedEl.classList.remove('selected'); selectedEl = null; }
    if (!menuEl) return;
    menuEl.style.display = 'none';
    menuEl.innerHTML = '';
    if (itemNameEl) { itemNameEl.style.display = 'none'; itemNameEl.innerText = ''; }
    if (outsideCloseHandler) {
        document.removeEventListener('mousedown', outsideCloseHandler, true);
        document.removeEventListener('touchstart', outsideCloseHandler, true);
        outsideCloseHandler = null;
    }
}

function positionItemName(el, anchorEl) {
    const rect = anchorEl.getBoundingClientRect(), margin = 6;
    el.style.display = 'block';
    const width = Math.min(Math.max(90, el.offsetWidth), window.innerWidth - margin * 2);
    const left = Math.max(margin, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - margin));
    const top = Math.max(margin, rect.top - el.offsetHeight - margin);
    el.style.left = `${left}px`; el.style.top = `${top}px`;
}

function positionMenu(el, anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const menuWidth = 150, margin = 6;
    let left = rect.left + rect.width / 2 - menuWidth / 2;
    let top = rect.bottom + margin;

    left = Math.max(margin, Math.min(left, window.innerWidth - menuWidth - margin));
    const estimatedHeight = 40 * (el.children.length) + 10;
    if (top + estimatedHeight > window.innerHeight) top = rect.top - margin - estimatedHeight;
    if (top < margin) top = margin;

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.width = `${menuWidth}px`;
}

// anchorEl: el slot tocado — el cuadro aparece pegado a él.
// actions: [{ label, onClick }] — "Cerrar" se agrega siempre al final.
export function openItemActionMenu(anchorEl, actions) {
    closeItemActionMenu();
    const el = ensureMenuEl();
    el.innerHTML = '';

    anchorEl.classList.add('selected');
    selectedEl = anchorEl;
    const itemName = anchorEl.dataset.itemName;
    if (itemName) {
        const nameEl = ensureItemNameEl();
        nameEl.innerText = itemName;
        positionItemName(nameEl, anchorEl);
    }

    actions.forEach(a => {
        const btn = document.createElement('button');
        btn.className = 'item-action-btn';
        btn.innerText = a.label;
        btn.onclick = (e) => {
            e.stopPropagation();
            closeItemActionMenu();
            a.onClick();
        };
        el.appendChild(btn);
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'item-action-btn item-action-close';
    closeBtn.innerText = 'Cerrar';
    closeBtn.onclick = (e) => { e.stopPropagation(); closeItemActionMenu(); };
    el.appendChild(closeBtn);

    el.style.display = 'flex';
    positionMenu(el, anchorEl);

    // Cerrar al tocar fuera del cuadro (se registra en el siguiente tick para
    // no capturar el mismo toque/click que abrió el menú).
    outsideCloseHandler = (e) => { if (!el.contains(e.target)) closeItemActionMenu(); };
    setTimeout(() => {
        document.addEventListener('mousedown', outsideCloseHandler, true);
        document.addEventListener('touchstart', outsideCloseHandler, true);
    }, 0);
}
