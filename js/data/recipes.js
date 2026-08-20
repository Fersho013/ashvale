/* =====================================================================
   5. RECETAS DE COCINA, ALQUIMIA Y EFECTOS DE CONSUMIBLES
   ===================================================================== */
export const COOK_RECIPES = { 'Carne': 'Carne Cocinada', 'Huevo': 'Huevo Cocido' };
export const ALCHEMY_RECIPES = {
    'Agua+Botella+Cactus': 'Poción de Espinas',
    'Agua+Botella+Mineral de Hierro': 'Poción de Resistencia'
};

export const CONSUMABLE_EFFECTS = {
    'Carne Cocinada':      { buffName: 'Fuerza',     duration: 60 * 60, color: '#e74c3c', msg: '+5 Fuerza (daño de ataque)' },
    'Huevo Cocido':        { buffName: 'Velocidad',  duration: 60 * 60, color: '#2ecc71', msg: '+5 Velocidad de movimiento' },
    'Poción de Espinas':   { buffName: 'Espinas',    duration: 60 * 60, color: '#9b59b6', msg: 'Refleja 50% del daño recibido' },
    'Poción de Resistencia': { buffName: 'Resistencia', duration: 60 * 60, color: '#7f8c8d', msg: '+10 Defensa' }
};
