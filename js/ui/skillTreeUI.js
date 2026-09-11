/* =====================================================================
   ÁRBOL DE HABILIDADES — Apertura y cierre del menú de ramas.
   Incluye habilidades activas y pasivas (siempre activas, 1 PH).
   ===================================================================== */
import { state } from '../state.js';
import { SkillBook, PASSIVE_SKILLS } from '../systems/skills.js';
import { LevelSystem } from '../systems/level.js';
import { openItemActionMenu } from './itemActionMenu.js';
import { showDialog } from './dialog.js';

export function toggleSkillTree(forceOpen) {
    if (!state.gameStarted || state.gamePaused) return;
    const panel = document.getElementById('skill-tree-panel');
    const isOpen = panel.style.display === 'block';
    panel.style.display = typeof forceOpen === 'boolean'
        ? (forceOpen ? 'block' : 'none')
        : (isOpen ? 'none' : 'block');
    if (panel.style.display === 'block') { refreshPointsDisplay(); showSkillBranch(null); }
}

function refreshPointsDisplay() {
    const el = document.getElementById('skill-points-display');
    if (!el) return;
    el.innerHTML = `Puntos de Habilidad: <strong style="color:#f1c40f;">${LevelSystem.skillPoints} PH</strong> · Nivel ${LevelSystem.level}`;
}

function refreshSkillNodes() {
    document.querySelectorAll('#skill-branch-view [data-skill-id]').forEach(node => {
        const skill = SkillBook.get(node.dataset.skillId);
        if (!skill) { node.style.display = 'none'; return; }
        node.style.display = '';
        const learned = SkillBook.isLearned(skill.id);
        const isPassive = SkillBook.isPassive(skill.id);
        if (isPassive) {
            node.classList.toggle('unlearned', !learned);
            node.classList.toggle('assigned', learned);
            node.querySelector('span').innerText = isPassive ? 'Pasiva · 1 PH' : `${skill.cost} ${skill.cost === 1 ? 'Barra' : 'Barras'}`;
            node.querySelector('small').innerText = learned ? 'Aprendida · siempre activa' : `No aprendida · coste 1 PH`;
        } else {
            const slots = Object.entries(SkillBook.assigned).filter(([, id]) => id === skill.id).map(([slot]) => slot.toUpperCase());
            node.classList.toggle('unlearned', !learned);
            node.classList.toggle('assigned', slots.length > 0);
            node.querySelector('small').innerText = learned ? (slots.length ? `Asignada: ${slots.join(', ')}` : 'Aprendida · sin asignar') : `No aprendida · coste 1 PH`;
        }
    });
    refreshPointsDisplay();
}

export function refreshSkillBindings() {
    const slots = { q: 'btn-q', r: 'btn-r' };
    Object.entries(slots).forEach(([slot, buttonId]) => {
        const button = document.getElementById(buttonId);
        const skill = SkillBook.get(SkillBook.assigned[slot]);
        button.innerText = skill ? skill.shortLabel : (slot === 'q' ? '⭐' : '🌙');
        button.setAttribute('aria-label', skill ? `${skill.name} (${slot.toUpperCase()})` : `Habilidad ${slot.toUpperCase()}`);
        button.title = skill ? skill.name : '';
    });
    refreshSkillNodes();
}

function openAssignmentMenu(node, skill) {
    openItemActionMenu(node, [
        { label: 'Asignar a Q', onClick: () => { SkillBook.assign(skill.id, 'q'); refreshSkillBindings(); } },
        { label: 'Asignar a R', onClick: () => { SkillBook.assign(skill.id, 'r'); refreshSkillBindings(); } }
    ]);
}

function openSkillActions(node) {
    const skill = SkillBook.get(node.dataset.skillId);
    if (!skill) return;
    const actions = [];
    const isPassive = SkillBook.isPassive(skill.id);
    if (SkillBook.isLearned(skill.id)) {
        if (!isPassive) {
            actions.push({ label: 'Equipar skill', onClick: () => openAssignmentMenu(node, skill) });
            actions.push({ label: 'Mejorar skill', onClick: () => showDialog('Habilidades', 'Las mejoras de esta habilidad llegarán en una futura rama del árbol.') });
        } else {
            actions.push({ label: 'Pasiva activa', onClick: () => showDialog('Pasiva', `${skill.name}: ${skill.description}`) });
        }
    } else {
        actions.push({ label: `Aprender (${1} PH)`, onClick: () => {
            if (LevelSystem.skillPoints <= 0) { showDialog('Habilidades', `Necesitas 1 punto de habilidad. Tienes ${LevelSystem.skillPoints} PH. Sube de nivel.`); return; }
            const ok = SkillBook.learn(skill.id);
            if (!ok) showDialog('Habilidades', 'No se pudo aprender. Verifica tus PH.');
            refreshSkillBindings();
        }});
    }
    openItemActionMenu(node, actions);
}

const BRANCH_VIEWS = {
    swordsman: {
        title: 'Espadachín — Rama de Espadas',
        description: 'Las habilidades iniciales están arriba; las más potentes se desbloquearán hacia abajo.',
        skills: ['sword_thrust', 'sword_storm']
    },
    knight: {
        title: 'Caballero — Rama de Mandobles',
        description: 'Golpes lentos y decisivos: rompe postura y controla el espacio con impacto pesado.',
        skills: ['knight_earthsplitter', 'knight_cataclysm']
    },
    'dual-swordsman': {
        title: 'Espadachín Dual — Rama de Espadas Duales',
        description: 'Presión constante, daño continuo y movilidad ofensiva con Espadas Duales.',
        skills: ['dual_cross_slash', 'dual_steel_frenzy']
    },
    archer: {
        title: 'Arquero — Rama de Arcos',
        description: 'Controla la distancia con disparos perforantes y zonas de lluvia de flechas.',
        skills: ['archer_piercing_shot', 'archer_thorn_rain']
    },
    lancer: {
        title: 'Lancer — Rama de Lanzas',
        description: 'Ataque seguro de rango medio y control de zonas: interrumpe, empuja y rompe posturas.',
        skills: ['lancer_phalanx_charge', 'lancer_impaling_whirlwind']
    },
    arcane: {
        title: 'Arcano — Rama de Báculos',
        description: 'Magia explosiva y control de masas: proyectiles de éter y fuerzas gravitacionales.',
        skills: ['arcane_aether_projectile', 'arcane_void_vortex']
    },
    passives: {
        title: 'Habilidades Pasivas — Siempre activas',
        description: 'Una vez aprendidas, otorgan su efecto de forma permanente. Cuestan 1 PH cada una.',
        skills: Object.keys(PASSIVE_SKILLS)
    }
};

function ensurePassiveNodes() {
    const genealogy = document.querySelector('#skill-branch-view .skill-genealogy');
    if (!genealogy) return;
    const needed = Object.keys(PASSIVE_SKILLS).length;
    const existing = genealogy.querySelectorAll('[data-skill-id]').length;
    // Ya hay 2 nodos estáticos; crear los restantes para pasivas
    for (let i = existing; i < needed; i++) {
        const connector = document.createElement('div');
        connector.className = 'skill-connector';
        connector.setAttribute('aria-hidden', 'true');
        genealogy.appendChild(connector);
        const btn = document.createElement('button');
        btn.className = 'skill-node';
        btn.type = 'button';
        btn.dataset.skillId = '';
        btn.innerHTML = '<strong></strong><span></span><small></small>';
        btn.addEventListener('click', () => openSkillActions(btn));
        genealogy.appendChild(btn);
    }
    // Ocultar el nodo futuro que solo aplica a ramas activas
    const future = genealogy.querySelector('.skill-future-node');
    if (future) future.hidden = false;
}

function showSkillBranch(branch) {
    const branchGrid = document.getElementById('skill-branches');
    const branchView = document.getElementById('skill-branch-view');
    branchGrid.hidden = !!BRANCH_VIEWS[branch];
    branchView.hidden = !BRANCH_VIEWS[branch];
    const intro = document.querySelector('#skill-tree-panel .skill-tree-intro');
    intro.hidden = !!BRANCH_VIEWS[branch];
    if (!BRANCH_VIEWS[branch]) { refreshPointsDisplay(); return; }
    const view = BRANCH_VIEWS[branch];
    document.getElementById('skill-branch-title').innerText = view.title;
    document.getElementById('skill-branch-description').innerText = view.description;
    ensurePassiveNodes();
    const nodes = document.querySelectorAll('#skill-branch-view [data-skill-id]');
    const genealogy = document.querySelector('#skill-branch-view .skill-genealogy');
    const future = genealogy ? genealogy.querySelector('.skill-future-node') : null;
    if (branch === 'passives') {
        if (future) future.hidden = true;
        // Mostrar/ocultar conectores para pasivas (todos visibles)
        genealogy.querySelectorAll('.skill-connector').forEach(c => c.hidden = false);
    } else {
        if (future) future.hidden = false;
    }
    nodes.forEach((node, index) => {
        const skillId = view.skills[index];
        if (!skillId) { node.style.display = 'none'; // ocultar exceso en ramas de 2
            const conn = node.previousElementSibling;
            if (conn && conn.classList.contains('skill-connector')) conn.style.display = 'none';
            return;
        }
        node.style.display = '';
        const conn = node.previousElementSibling;
        if (conn && conn.classList.contains('skill-connector')) conn.style.display = index === 0 ? 'none' : '';
        const skill = SkillBook.get(skillId);
        node.dataset.skillId = skill.id;
        node.querySelector('strong').innerText = skill.name;
        const isPassive = SkillBook.isPassive(skill.id);
        node.querySelector('span').innerText = isPassive ? 'Pasiva · 1 PH' : `${skill.cost} ${skill.cost === 1 ? 'Barra' : 'Barras'} · ${index ? 'Definitiva' : 'Base'}`;
    });
    // Ocultar nodos extra no usados
    nodes.forEach((node, index) => {
        if (index >= view.skills.length) {
            node.style.display = 'none';
            const conn = node.previousElementSibling;
            if (conn && conn.classList.contains('skill-connector')) conn.style.display = 'none';
        }
    });
    refreshSkillNodes();
}

document.querySelectorAll('#skill-tree-panel [data-skill-branch]').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('#skill-tree-panel [data-skill-branch]').forEach(item => item.classList.remove('selected'));
        button.classList.add('selected');
        if (BRANCH_VIEWS[button.dataset.skillBranch]) showSkillBranch(button.dataset.skillBranch);
        else document.querySelector('#skill-tree-panel .skill-tree-intro').innerText = 'Esta rama estará disponible próximamente.';
    });
});

document.querySelectorAll('#skill-branch-view [data-skill-id]').forEach(node => node.addEventListener('click', () => openSkillActions(node)));
document.getElementById('skill-tree-back').addEventListener('click', () => showSkillBranch(null));
window.addEventListener('level-updated', refreshPointsDisplay);
refreshSkillBindings();
