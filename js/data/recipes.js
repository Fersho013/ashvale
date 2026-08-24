/* =====================================================================
   5. RECETAS DE CRAFTEO Y EFECTOS DE CONSUMIBLES
   Tres estaciones de crafteo, todas con el mismo panel genérico de 3
   slots (ver ui/craftingUI.js): Hoguera (COOK_RECIPES), Máquina de
   Pociones (ALCHEMY_RECIPES) y Mesa Constructora (BUILD_RECIPES).

   Formato de las tablas de recetas: la clave es la lista de nombres de
   ingredientes, ORDENADA ALFABÉTICAMENTE y unida con '+', repitiendo el
   nombre tantas veces como slots ocupe (ej. 2x Carne + 1x Huevo se
   escribe 'Carne+Carne+Huevo'). Así, la MISMA combinación de items pero
   en distinta cantidad puede dar resultados distintos — ver
   ui/craftingUI.js para la lógica exacta de armado de la clave.
   ===================================================================== */

export const COOK_RECIPES = {
    'Carne': 'Carne Cocinada',
    'Huevo': 'Huevo Cocido',
    // Carne + Huevo (1+1): receta "chica", 1 minuto de duración
    'Carne+Huevo': 'Carne con Huevo Cocinados',
    // Carne + Huevo x2 (1+2) o Carne x2 + Huevo (2+1): misma receta
    // "grande", 3 minutos de duración. Nota: el nombre lleva "(Ración
    // Grande)" para distinguirla de la versión de 1 minuto de arriba —
    // ambas se llamarían igual en la lista original, así que se
    // diferencian por nombre para poder tener efectos distintos.
    'Carne+Huevo+Huevo': 'Carne con Huevo Cocinados (Ración Grande)',
    'Carne+Carne+Huevo': 'Carne con Huevo Cocinados (Ración Grande)',
    // Carne x3 (los 3 slots): ración grande solo de fuerza, 4 minutos
    'Carne+Carne+Carne': 'Gran Ración de Carne Cocinada'
};

export const ALCHEMY_RECIPES = {
    // Botella de agua base: se puede preparar de a 1, 2 o 3 a la vez
    // (mismo resultado individual, solo cambia cuántas salen del slot).
    'Botella':                  'Botella con Agua',
    'Botella+Botella':          'Botella con Agua (x2)',
    'Botella+Botella+Botella':  'Botella con Agua (x3)',

    // Poción de Espinas (refleja daño) — Botella con Agua + Cactus
    'Botella con Agua+Cactus':                 'Poción de Espinas',
    'Botella con Agua+Botella con Agua+Cactus': 'Poción de Espinas Reducida (x2)',
    'Botella con Agua+Cactus+Cactus':           'Poción de Espinas Aumentada',

    // Poción de Defensa (reduce daño recibido) — Botella con Agua + Mineral de Hierro
    'Botella con Agua+Mineral de Hierro':                        'Poción de Defensa',
    'Botella con Agua+Botella con Agua+Mineral de Hierro':       'Poción de Defensa Reducida',
    'Botella con Agua+Mineral de Hierro+Mineral de Hierro':      'Poción de Defensa Aumentada'
};

export const BUILD_RECIPES = {
    'Madera+Metal Oxidado': 'Espada Oxidada'
};

// Ítem "fallback" de la Hoguera: combinar comidas que no calzan con
// ninguna receta de COOK_RECIPES no devuelve los ingredientes (a
// diferencia de la Máquina de Pociones / Mesa Constructora) — en vez de
// eso, se consumen y entregan esto. Ver ui/craftingUI.js.
export const MASA_EXTRANA_NAME = 'Masa Extraña';

/* =====================================================================
   EFECTOS DE CONSUMIBLES
   Cada entrada tiene un "kind":
     - 'buff':   aplica uno o más buffs temporales (ver Inventory.addBuff).
                 Cada buff en "buffs" es { name, duration (frames a 60fps),
                 value, color }. "value" es lo que leen los getters/checks
                 de player.js (ver Inventory.getBuff) — así una misma
                 "Fuerza" puede valer +5, -5, +20, etc. según el ítem.
     - 'heal':   cambia el HP del jugador al instante (positivo o
                 negativo), sin buff de por medio. Se clampea entre
                 0 y player.maxHp (ver systems/inventory.js).
     - 'random': tira una ruleta ponderada ("outcomes", cada uno con su
                 "chance" 0–1) y aplica el resultado — puede combinar
                 "hp" (instantáneo) y "buffs" (temporales) a la vez. Se
                 usa para "Masa Extraña" (ver arriba).
   ===================================================================== */
export const CONSUMABLE_EFFECTS = {
    'Carne Cocinada': {
        kind: 'buff',
        buffs: [{ name: 'Fuerza', duration: 60 * 60, value: 5, color: '#e74c3c' }],
        msg: '+5 Fuerza (daño de ataque) por 1 min'
    },
    'Huevo Cocido': {
        kind: 'buff',
        buffs: [{ name: 'Velocidad', duration: 60 * 60, value: 1.5, color: '#2ecc71' }],
        msg: '+Velocidad de movimiento por 1 min'
    },
    'Carne con Huevo Cocinados': {
        kind: 'buff',
        buffs: [
            { name: 'Velocidad', duration: 1 * 60 * 60, value: 5, color: '#2ecc71' },
            { name: 'Fuerza',    duration: 1 * 60 * 60, value: 5, color: '#e74c3c' }
        ],
        msg: '+5 Velocidad y +5 Fuerza por 1 min'
    },
    'Carne con Huevo Cocinados (Ración Grande)': {
        kind: 'buff',
        buffs: [
            { name: 'Velocidad', duration: 3 * 60 * 60, value: 5, color: '#2ecc71' },
            { name: 'Fuerza',    duration: 3 * 60 * 60, value: 5, color: '#e74c3c' }
        ],
        msg: '+5 Velocidad y +5 Fuerza por 3 min'
    },
    'Gran Ración de Carne Cocinada': {
        kind: 'buff',
        buffs: [{ name: 'Fuerza', duration: 4 * 60 * 60, value: 5, color: '#e74c3c' }],
        msg: '+5 Fuerza por 4 min'
    },

    // Botella con Agua: cura instantánea. Las variantes (x2)/(x3) son solo
    // el resultado de craftear varias de una — cada una se consume y cura
    // por separado, por eso todas curan lo mismo (+10 HP) por unidad.
    'Botella con Agua':      { kind: 'heal', amount: 10, msg: '+10 HP' },
    'Botella con Agua (x2)': { kind: 'heal', amount: 10, msg: '+10 HP' },
    'Botella con Agua (x3)': { kind: 'heal', amount: 10, msg: '+10 HP' },

    'Poción de Espinas': {
        kind: 'buff',
        buffs: [{ name: 'Espinas', duration: 3 * 60 * 60, value: 0.20, color: '#9b59b6' }],
        msg: 'Refleja 20% del daño recibido por 3 min'
    },
    'Poción de Espinas Reducida (x2)': {
        kind: 'buff',
        buffs: [{ name: 'Espinas', duration: 3 * 60 * 60, value: 0.10, color: '#9b59b6' }],
        msg: 'Refleja 10% del daño recibido por 3 min'
    },
    'Poción de Espinas Aumentada': {
        kind: 'buff',
        buffs: [{ name: 'Espinas', duration: 3 * 60 * 60, value: 0.30, color: '#9b59b6' }],
        msg: 'Refleja 30% del daño recibido por 3 min'
    },

    'Poción de Defensa': {
        kind: 'buff',
        buffs: [{ name: 'Defensa', duration: 3 * 60 * 60, value: 0.20, color: '#7f8c8d' }],
        msg: 'Reduce 20% del daño recibido por 3 min'
    },
    'Poción de Defensa Reducida': {
        kind: 'buff',
        buffs: [{ name: 'Defensa', duration: 3 * 60 * 60, value: 0.10, color: '#7f8c8d' }],
        msg: 'Reduce 10% del daño recibido por 3 min'
    },
    'Poción de Defensa Aumentada': {
        kind: 'buff',
        buffs: [{ name: 'Defensa', duration: 3 * 60 * 60, value: 0.30, color: '#7f8c8d' }],
        msg: 'Reduce 30% del daño recibido por 3 min'
    },

    // Resultado fallido de la Hoguera (ver COOK_RECIPES / MASA_EXTRANA_NAME
    // arriba). Los porcentajes son independientes de duración: "hp" es
    // instantáneo, y la Fuerza (cuando aplica) dura 1 min.
    [MASA_EXTRANA_NAME]: {
        kind: 'random',
        outcomes: [
            { chance: 0.70, hp: -10, buffs: [{ name: 'Fuerza', duration: 60 * 60, value: -5, color: '#7f8c8d' }], msg: 'Sabe fatal: -5 Fuerza (1 min) y -10 HP.' },
            { chance: 0.20, hp: 5,   msg: 'No está tan mal: +5 HP.' },
            { chance: 0.08, hp: 10,  buffs: [{ name: 'Fuerza', duration: 60 * 60, value: 5, color: '#e74c3c' }], msg: '¡Sorprendentemente bueno!: +5 Fuerza (1 min) y +10 HP.' },
            { chance: 0.01, hp: 100, buffs: [{ name: 'Fuerza', duration: 60 * 60, value: 20, color: '#f1c40f' }], msg: '¡¡Increíble!!: +20 Fuerza (1 min) y +100 HP.' },
            { chance: 0.01, hp: -100, msg: 'Terrible... -100 HP.' }
        ]
    }
};
