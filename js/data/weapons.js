/* =====================================================================
   4. SISTEMA DE ARMAS Y EQUIPAMIENTO — Datos de armas
   Todos los tiempos (attackCooldown) están en FRAMES a 60fps (ver el game
   loop de main.js): 60 = 1s, 30 = 0.5s, 120 = 2s.

   - meleeReach / meleeSize: alcance y tamaño del hitbox de golpe cuerpo a
     cuerpo (ver Player.getAttackHitbox()). Mandoble y Lanza usan el doble
     de la Espada (interpretación de "el largo del ataque debe ser el
     doble que la espada" como el alcance/tamaño del golpe).
   - ranged + projectile: armas que en vez de golpe cuerpo a cuerpo
     disparan un Projectile (ver entities/projectile.js). rangeBlocks se
     mide en BLOCK_SIZE (world/map.js) y solo pueden impactar a UN
     enemigo (el primero que golpean, ver systems/worldInteraction.js).
   ===================================================================== */
// Una familia describe el tipo de combate, no el ítem concreto. Por ejemplo,
// "Espada" y "Espada Oxidada" son ítems distintos, pero pertenecen a la
// misma familia y por ello habilitan la misma rama de habilidades.
export const WEAPON_FAMILIES = {
    sword: { id: 'sword', label: 'espada', requirementLabel: 'una espada', pluralLabel: 'Espadas' },
    greatsword: { id: 'greatsword', label: 'mandoble', requirementLabel: 'un mandoble', pluralLabel: 'Mandobles' },
    dualBlades: { id: 'dualBlades', label: 'espadas duales', requirementLabel: 'unas Espadas Duales', pluralLabel: 'Espadas Duales' },
    bow: { id: 'bow', label: 'arco', requirementLabel: 'un arco', pluralLabel: 'Arcos' },
    spear: { id: 'spear', label: 'lanza', requirementLabel: 'una lanza', pluralLabel: 'Lanzas' },
    staff: { id: 'staff', label: 'báculo', requirementLabel: 'un báculo', pluralLabel: 'Báculos' }
};

export const WEAPONS = {
    desarmado: {
        id: 'desarmado', name: 'Desarmado (Puños)', color: '#aaaaaa', asset: 'player',
        dmg: 5, attackCooldown: 60, meleeReach: 38, meleeSize: 34,
        ability1: 'Puñetazo Veloz', ability2: 'Guardia'
    },
    espada: {
        id: 'espada', name: 'Espada', color: '#3498db', asset: 'weapon_espada',
        dmg: 10, attackCooldown: 60, meleeReach: 38, meleeSize: 34,
        family: 'sword', skillBranch: 'swordsman', ability1: 'Estocada Veloz', ability2: 'Filo Tormentoso'
    },
    dagas: {
        // Se conserva la clave interna "dagas" para no invalidar partidas
        // guardadas; el arma y su rama ahora se llaman Espadas Duales.
        id: 'dagas', name: 'Espadas Duales', color: '#9b59b6', asset: 'weapon_dagas',
        dmg: 5, attackCooldown: 30, meleeReach: 38, meleeSize: 34, family: 'dualBlades', // 0.5s: el doble de rápida que la Espada
        skillBranch: 'dual-swordsman', ability1: 'Tajo Cruzado', ability2: 'Frenesí de Acero'
    },
    mandoble: {
        id: 'mandoble', name: 'Mandoble', color: '#e67e22', asset: 'weapon_mandoble',
        dmg: 20, attackCooldown: 120, meleeReach: 76, meleeSize: 68, // alcance/tamaño x2 vs. Espada
        family: 'greatsword', skillBranch: 'knight', ability1: 'Hendidura Terrenal', ability2: 'Impacto Cataclismo'
    },
    lanza: {
        id: 'lanza', name: 'Lanza', color: '#f1c40f', asset: 'weapon_lanza',
        dmg: 15, attackCooldown: 120, meleeReach: 76, meleeSize: 68, family: 'spear', // alcance/tamaño x2 vs. Espada
        skillBranch: 'lancer', ability1: 'Embestida de Falange', ability2: 'Torbellino Empalador'
    },
    baculo: {
        id: 'baculo', name: 'Báculo', color: '#e74c3c', asset: 'weapon_especial', // TODO: sprite propio cuando exista arte dedicado al báculo
        dmg: 10, attackCooldown: 60, ranged: true, family: 'staff', skillBranch: 'arcane',
        projectile: { rangeBlocks: 3, speed: 9, size: 12, color: '#e74c3c', sprite: 'arcaneBolt' },
        ability1: 'Proyectil de Éter', ability2: 'Vórtice del Vacío'
    },
    arco: {
        id: 'arco', name: 'Arco', color: '#2ecc71', asset: 'weapon_arco',
        dmg: 10, attackCooldown: 60, ranged: true, family: 'bow', skillBranch: 'archer',
        projectile: { rangeBlocks: 4, speed: 11, size: 8, color: '#2ecc71', sprite: 'arrow' },
        ability1: 'Disparo Perforante', ability2: 'Lluvia de Flechas'
    },
    // Loot de baja probabilidad del Goblin (5%, ver data/mobs.js). No se
    // consigue en el Cofre de Armas del mapa (weaponsChestObj) — solo cae al matar
    // un Goblin. El nombre debe coincidir EXACTO con el del loot para que
    // el sistema de equipamiento la reconozca (ver systems/inventory.js).
    goblin_espada_corta: {
        id: 'goblin_espada_corta', name: 'Espada Corta de Goblin', color: '#7f8c8d', asset: 'weapon_espada', // TODO: sprite propio
        dmg: 15, attackCooldown: 60, meleeReach: 38, meleeSize: 34,
        family: 'sword', skillBranch: 'swordsman', ability1: 'Estocada Veloz', ability2: 'Filo Tormentoso'
    },
    // Craftable en la Mesa Constructora: Madera + Metal Oxidado (ver
    // data/recipes.js -> BUILD_RECIPES). No se consigue en las armerías.
    espada_oxidada: {
        id: 'espada_oxidada', name: 'Espada Oxidada', color: '#a07b52', asset: 'weapon_espada', // TODO: sprite propio
        dmg: 20, attackCooldown: 60, meleeReach: 38, meleeSize: 34,
        family: 'sword', skillBranch: 'swordsman', ability1: 'Estocada Veloz', ability2: 'Filo Tormentoso'
    }
};

export function getWeaponFamily(weapon) {
    return WEAPON_FAMILIES[weapon?.family] || null;
}

export function weaponSupportsSkill(weapon, skill) {
    return !!weapon && !!skill && weapon.family === skill.weaponFamily;
}

// Mapa dirección -> claves de sprite (quieto / caminando) para el jugador
export const PLAYER_SPRITE_KEYS = {
    centro:     { idle: 'player_centro',     walk: 'player_centro_mov' },
    derecha:    { idle: 'player_derecha',    walk: 'player_derecha_mov' },
    arriba:     { idle: 'player_arriba',     walk: 'player_arriba_mov' },
    izquierda:  { idle: 'player_izquierda',  walk: 'player_izquierda_mov' }
};
