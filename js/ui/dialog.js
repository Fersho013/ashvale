/* =====================================================================
   CUADRO DE DIÁLOGO (NPC / Sistema)
   dialogState.timer se expone como objeto mutable porque worldInteraction.js
   necesita decrementarlo cuadro a cuadro fuera de este módulo.
   ===================================================================== */
export const dialogState = { timer: 0 };

export function showDialog(name, text) {
    const box = document.getElementById('dialog-box');
    document.querySelector('#dialog-box .name').innerText = name;
    document.getElementById('dialog-text').innerText = text;
    box.style.display = 'block';
    dialogState.timer = 180;
}
