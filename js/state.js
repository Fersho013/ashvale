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
    // Ya no gobierna la visibilidad de los controles táctiles (eso ahora es
    // exclusivamente Modo Móvil, ver ScreenManager.isMobileMode / clase
    // "mobile-mode-active" en <body>) — se conserva por si sirve a futuro.
    isTouchDevice: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
    // Preferencia del jugador de mostrar u ocultar los botones táctiles
    // MIENTRAS esté en Modo Móvil (toggle en el menú de Pausa) — útil si
    // se conecta un mando y ya no hacen falta. En PC (Modo Móvil apagado)
    // esta bandera no importa: el CSS oculta los controles táctiles sin
    // excepción (ver "body:not(.mobile-mode-active)" en style.css).
    touchControlsEnabled: true,
    // true mientras el editor de posición/tamaño de controles táctiles está
    // abierto (ver js/ui/controlsEditor.js) — se usa para que el input táctil
    // normal (js/core/input.js) no interprete los arrastres de edición como
    // movimiento/ataques del jugador.
    controlsEditMode: false
};

