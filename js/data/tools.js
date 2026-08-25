/* =====================================================================
   HERRAMIENTAS DE RECOLECCIÓN — Hacha y Pico
   No son armas de combate: no aparecen en WEAPONS, no infligen daño y no
   se equipan como arma. Se obtienen en el nuevo "Cofre de Herramientas"
   (ver world/worldObjects.js -> toolsChestObj) y su función real (talar
   árboles / picar rocas y minerales) se activará cuando esos objetos del
   mundo se agreguen — por ahora solo quedan disponibles en el inventario.
   ===================================================================== */
export const TOOLS = {
    hacha: {
        id: 'hacha', name: 'Hacha', color: '#8d6e4f', asset: 'tool_hacha',
        description: 'Corta madera de los árboles.' // árboles: próximamente
    },
    pico: {
        id: 'pico', name: 'Pico', color: '#95a5a6', asset: 'tool_pico',
        description: 'Pica piedra de rocas y minerales.' // rocas/minerales: próximamente
    }
};
