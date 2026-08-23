/* =====================================================================
   ESTADO COMPARTIDO (banderas globales del juego)
   Se exporta un único objeto mutable para que todos los módulos que
   necesiten leer/escribir estas banderas lo hagan sobre las mismas
   propiedades (los bindings de "let" exportados en ESM son de solo
   lectura desde fuera del módulo que los declara).
   ===================================================================== */
export const state = {
    actionHeld: false,
    gameStarted: false,
    gamePaused: false,
    isTouchDevice: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
    // Visibilidad de los botones táctiles virtuales: activados por defecto
    // solo si el dispositivo es táctil. El jugador puede apagarlos/prenderlos
    // manualmente desde el menú de Pausa (ver js/ui/pause.js) — útil en
    // móvil cuando se conecta un mando y ya no se necesitan los botones.
    touchControlsEnabled: false,
    // true mientras el editor de posición/tamaño de controles táctiles está
    // abierto (ver js/ui/controlsEditor.js) — se usa para que el input táctil
    // normal (js/core/input.js) no interprete los arrastres de edición como
    // movimiento/ataques del jugador.
    controlsEditMode: false
};
state.touchControlsEnabled = state.isTouchDevice;
