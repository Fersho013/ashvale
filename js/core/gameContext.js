/* =====================================================================
   CONTEXTO DE JUEGO (referencias runtime compartidas)
   main.js crea player/camera/world/canvas/ctx una sola vez y los deja
   aquí para que el resto de los módulos (UI, sistemas) puedan leerlos
   sin depender de imports circulares hacia main.js.
   ===================================================================== */
export const game = {
    canvas: null,
    ctx: null,
    player: null,
    camera: null,
    world: null
};
