/* =====================================================================
   ÁRBOL DE HABILIDADES — Apertura y cierre del menú de ramas.
   Las ramas ya tienen sus botones; la asignación de habilidades llegará
   después sin modificar los controles de teclado, mando o táctiles.
   ===================================================================== */
import { state } from '../state.js';
import { SkillBook } from '../systems/skills.js';
import { openItemActionMenu } from './itemActionMenu.js';
import { showDialog } from './dialog.js';

export function toggleSkillTree(forceOpen) {
    if (!state.gameStarted || state.gamePaused) return;
    const panel = document.getElementById('skill-tree-panel');
    const isOpen = panel.style.display === 'block';
    panel.style.display = typeof forceOpen === 'boolean'
        ? (forceOpen ? 'block' : 'none')
        : (isOpen ? 'none' : 'block');
    if (panel.style.display === 'block') showSkillBranch(null);
}

function refreshSkillNodes() {
    document.querySelectorAll('#skill-branch-view [data-skill-id]').forEach(node => {
        const skill = SkillBook.get(node.dataset.skillId);
        const learned = SkillBook.isLearned(skill.id);
        const slots = Object.entries(SkillBook.assigned).filter(([, id]) => id === skill.id).map(([slot]) => slot.toUpperCase());
        node.classList.toggle('unlearned', !learned);
        node.classList.toggle('assigned', slots.length > 0);
        node.querySelector('small').innerText = learned ? (slots.length ? `Asignada: ${slots.join(', ')}` : 'Aprendida · sin asignar') : 'No aprendida';
    });
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
    if (SkillBook.isLearned(skill.id)) {
        actions.push({ label: 'Equipar skill', onClick: () => openAssignmentMenu(node, skill) });
        actions.push({ label: 'Mejorar skill', onClick: () => showDialog('Habilidades', 'Las mejoras de esta habilidad llegarán en una futura rama del árbol.') });
    } else {
        actions.push({ label: 'Aprender skill', onClick: () => { SkillBook.learn(skill.id); refreshSkillBindings(); } });
    }
    openItemActionMenu(node, actions);
}

function showSkillBranch(branch) {
    const branchGrid = document.getElementById('skill-branches');
    const branchView = document.getElementById('skill-branch-view');
    branchGrid.hidden = branch === 'swordsman';
    branchView.hidden = branch !== 'swordsman';
    const intro = document.querySelector('#skill-tree-panel .skill-tree-intro');
    intro.hidden = branch === 'swordsman';
    if (branch === 'swordsman') refreshSkillNodes();
}

document.querySelectorAll('#skill-tree-panel [data-skill-branch]').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('#skill-tree-panel [data-skill-branch]').forEach(item => item.classList.remove('selected'));
        button.classList.add('selected');
        if (button.dataset.skillBranch === 'swordsman') showSkillBranch('swordsman');
        else document.querySelector('#skill-tree-panel .skill-tree-intro').innerText = 'Esta rama estará disponible próximamente.';
    });
});

document.querySelectorAll('#skill-branch-view [data-skill-id]').forEach(node => node.addEventListener('click', () => openSkillActions(node)));
document.getElementById('skill-tree-back').addEventListener('click', () => showSkillBranch(null));
refreshSkillBindings();
