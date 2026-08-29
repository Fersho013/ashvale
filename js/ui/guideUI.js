/* =====================================================================
   GUÍA DEL ANCIANO — consulta visual de las mecánicas actuales
   ===================================================================== */
import { showNpcDialogue } from './dialog.js';

let elderMenuEl = null;

const GUIDE_SECTIONS = [
    { id: 'weapons', title: '⚔️ Armas y combate', body: '<p>Equipa un arma desde el Inventario. El ataque básico usa Click / RT / ⚔️ y el parry usa Click derecho / LT / 🛡️. Cada tipo de arma cambia el alcance, daño y comportamiento de ataque.</p><ul><li>Espada: equilibrio y versatilidad.</li><li>Mandoble: golpes pesados y ruptura de postura.</li><li>Espadas duales: daño continuo y movilidad.</li><li>Arco, Lanza y Báculo: combate a distancia o de alcance medio.</li></ul>' },
    { id: 'skills', title: '🌳 Árbol de habilidades', body: '<p>Abre el Árbol de habilidades con <strong>O</strong> o 🌳. Aprende y asigna habilidades a <strong>Q</strong> y <strong>R</strong>; necesitas el arma de la rama equipada para usarlas. Las habilidades de 1 barra complementan el combo y las de 3 barras son definitivas.</p>' },
    { id: 'inventory', title: '🎒 Inventario y equipamiento', body: '<p>Abre el Inventario con <strong>I</strong> o 🎒. Toca un objeto para ver sus acciones, equipa armas, herramientas y armaduras en sus slots. La Barra rápida admite 10 objetos consumibles.</p>' },
    { id: 'campfire', title: '🔥 Hoguera', body: '<p>La Hoguera cocina alimentos. Coloca ingredientes y cocina para crear consumibles.</p><div class="guide-recipe"><strong>Carne</strong> → Carne Cocinada</div><div class="guide-recipe"><strong>Huevo</strong> → Huevo Cocido</div><div class="guide-recipe"><strong>Carne + Huevo</strong> → Carne con Huevo Cocinados</div>' },
    { id: 'alchemy', title: '⚗️ Máquina de pociones', body: '<p>Combina ingredientes para preparar pociones. Las recetas inválidas devuelven los ingredientes.</p><div class="guide-recipe"><strong>Botella</strong> → Botella con Agua</div><div class="guide-recipe"><strong>Botella con Agua + Mineral de Hierro</strong> → Poción de Defensa</div><div class="guide-recipe"><strong>Botella con Agua + Cactus</strong> → Poción de Espinas</div>' },
    { id: 'builder', title: '🛠️ Mesa constructora', body: '<p>La Mesa Constructora convierte materiales en equipo.</p><div class="guide-recipe"><strong>Madera + Metal Oxidado</strong> → Espada Oxidada</div><div class="guide-recipe"><strong>Cuero + Cuero + Cuero</strong> → Armadura de Cuero</div>' },
    { id: 'quests', title: '📜 NPC y misiones', body: '<p>El Caballero Novato ofrece misiones. Abre el diario con <strong>H</strong> o 📜 para revisar el progreso. Las misiones completadas aparecen verdes con ✓ y deben entregarse al mismo NPC que las ofreció.</p>' },
    { id: 'dummy', title: '🎯 Dummy de combate', body: '<p>El Dummy del laboratorio sirve para comprobar el daño, alcance, ataques básicos y habilidades sin necesidad de perseguir enemigos.</p>' },
    { id: 'tools', title: '🪓 Herramientas y recolección', body: '<p>Equipa el <strong>Hacha</strong> para talar árboles y el <strong>Pico</strong> para picar piedra y mena de hierro. Cada acción tarda 3 segundos, concede un material y cada nodo tiene 5 usos antes de recuperarse durante 3 minutos.</p>' }
];

function guidePanel() { return document.getElementById('guide-panel'); }

function closeElderMenu(restoreHud = true) {
    if (elderMenuEl) elderMenuEl.remove();
    elderMenuEl = null;
    if (restoreHud) document.body.classList.remove('npc-menu-open');
}

export function isGuideMenuOpen() { return !!elderMenuEl && document.body.contains(elderMenuEl); }

export function openElderMenu(npc) {
    closeElderMenu();
    elderMenuEl = document.createElement('div');
    elderMenuEl.className = 'npc-action-menu';
    elderMenuEl.innerHTML = '<h3>Anciano</h3><button type="button" data-action="talk">Hablar</button><button type="button" data-action="guide">Guía</button><button type="button" data-action="close">Cerrar</button>';
    elderMenuEl.addEventListener('click', event => {
        const action = event.target.dataset.action;
        if (action === 'talk') { closeElderMenu(); showNpcDialogue(npc); }
        else if (action === 'guide') { closeElderMenu(false); openGuide(); }
        else if (action === 'close') closeElderMenu();
    });
    document.body.appendChild(elderMenuEl);
    document.body.classList.add('npc-menu-open');
}

function showGuideList() {
    const content = document.getElementById('guide-content');
    content.innerHTML = '<p class="quest-intro">Selecciona una mecánica para consultar su funcionamiento y recetas.</p><div class="guide-grid"></div>';
    const grid = content.querySelector('.guide-grid');
    GUIDE_SECTIONS.forEach(section => {
        const button = document.createElement('button');
        button.className = 'guide-entry-button'; button.innerText = section.title;
        button.onclick = () => showGuideDetail(section.id);
        grid.appendChild(button);
    });
}

function showGuideDetail(id) {
    const section = GUIDE_SECTIONS.find(item => item.id === id);
    if (!section) return showGuideList();
    document.getElementById('guide-content').innerHTML = `<h4>${section.title}</h4><div class="guide-detail">${section.body}</div><div class="quest-panel-actions"><button id="guide-back" type="button">Volver</button></div>`;
    document.getElementById('guide-back').onclick = showGuideList;
}

export function openGuide() {
    document.body.classList.add('npc-menu-open');
    guidePanel().style.display = 'block';
    showGuideList();
}

export function closeGuide() {
    guidePanel().style.display = 'none';
    document.body.classList.remove('npc-menu-open');
}

document.getElementById('guide-close').addEventListener('click', closeGuide);
