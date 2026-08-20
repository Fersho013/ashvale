/* =====================================================================
   4. SISTEMA DE ARMAS Y EQUIPAMIENTO — Datos de armas
   ===================================================================== */
export const WEAPONS = {
    desarmado: { id:'desarmado', name:'Desarmado (Puños)', color:'#aaaaaa', asset:'player', dmg:4, ability1:'Puñetazo Veloz', ability2:'Guardia' },
    espada:   { id:'espada',   name:'Espada',        color:'#3498db', asset:'weapon_espada',   dmg:10, ability1:'Estocada Veloz', ability2:'Filo Tormentoso' },
    mandoble: { id:'mandoble', name:'Mandoble',       color:'#e67e22', asset:'weapon_mandoble', dmg:18, ability1:'Hendidura Terrenal', ability2:'Guardia de Titán' },
    dagas:    { id:'dagas',    name:'Dagas Duales',   color:'#9b59b6', asset:'weapon_dagas',    dmg:6,  ability1:'Paso Sombrío', ability2:'Torbellino' },
    arco:     { id:'arco',     name:'Arco',           color:'#2ecc71', asset:'weapon_arco',     dmg:8,  ability1:'Disparo Perforante', ability2:'Lluvia de Flechas' },
    lanza:    { id:'lanza',    name:'Lanza',          color:'#f1c40f', asset:'weapon_lanza',    dmg:12, ability1:'Estocada Profunda', ability2:'Barrido Falange' },
    especial: { id:'especial', name:'Báculo/Hacha',   color:'#e74c3c', asset:'weapon_especial', dmg:14, ability1:'Golpe Terrenal', ability2:'Proyección Mística' }
};

// Mapa dirección -> claves de sprite (quieto / caminando) para el jugador
export const PLAYER_SPRITE_KEYS = {
    centro:     { idle: 'player_centro',     walk: 'player_centro_mov' },
    derecha:    { idle: 'player_derecha',    walk: 'player_derecha_mov' },
    arriba:     { idle: 'player_arriba',     walk: 'player_arriba_mov' },
    izquierda:  { idle: 'player_izquierda',  walk: 'player_izquierda_mov' }
};
