/* =====================================================================
   CUADRO DE DIÁLOGO — escritura progresiva y navegación NPC
   ===================================================================== */
export const dialogState = { timer: 0, fullText: '', visibleChars: 0, typeTimer: 0, onNext: null };
const TYPE_INTERVAL_FRAMES = 3;
const DISPLAY_AFTER_COMPLETE_FRAMES = 2 * 60;

function setDialogButtons(onNext) {
    const next = document.getElementById('dialog-next-btn');
    const close = document.getElementById('dialog-close-btn');
    next.style.display = onNext ? 'inline-block' : 'none';
    next.onclick = onNext ? () => onNext() : null;
    close.onclick = closeDialog;
}

export function showDialog(name, text, { onNext = null } = {}) {
    const box = document.getElementById('dialog-box');
    document.querySelector('#dialog-box .name').innerText = name;
    document.getElementById('dialog-text').innerText = '';
    box.style.display = 'block';
    dialogState.fullText = text;
    dialogState.visibleChars = 0;
    dialogState.typeTimer = 0;
    dialogState.timer = 0;
    dialogState.onNext = onNext;
    setDialogButtons(onNext);
}

export function showNpcDialogue(npc) {
    showDialog('Anciano', npc.messages[npc.msgIndex], {
        onNext: () => {
            npc.msgIndex = (npc.msgIndex + 1) % npc.messages.length;
            showNpcDialogue(npc);
        }
    });
}

export function closeDialog() {
    dialogState.timer = 0; dialogState.fullText = ''; dialogState.visibleChars = 0; dialogState.onNext = null;
    document.getElementById('dialog-box').style.display = 'none';
}

export function updateDialog() {
    if (!dialogState.fullText) return;
    if (dialogState.visibleChars < dialogState.fullText.length) {
        if (++dialogState.typeTimer >= TYPE_INTERVAL_FRAMES) {
            dialogState.typeTimer = 0;
            dialogState.visibleChars++;
            document.getElementById('dialog-text').innerText = dialogState.fullText.slice(0, dialogState.visibleChars);
        }
        if (dialogState.visibleChars === dialogState.fullText.length) dialogState.timer = DISPLAY_AFTER_COMPLETE_FRAMES;
        return;
    }
    if (--dialogState.timer <= 0) closeDialog();
}
