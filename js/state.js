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
    isTouchDevice: ('ontouchstart' in window) || navigator.maxTouchPoints > 0
};
