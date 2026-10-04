# Tiles — pisos y muros (48x48 PNG transparente, seamless sin marco)

El juego pinta cada zona/bioma en mosaico de 48x48 (`js/main.js` → `paintFloor`,
origen `js/world/map.js` floor/fallbacks). Si el PNG falta, usa el fallback y al
final el color plano: nunca se rompe.

| Archivo | Dónde se usa |
|---|---|
| `tile_grass.png` | Bosque (`forest`) + fallback Zona Ecosistema |
| `tile_pebble.png` | Minas/goblins (`mines`), fallback `tile_stone` |
| `tile_wood.png` | Zona 1 Centro de Mando, fallback `tile_grass` |
| `tile_metal.png` | Arena de pruebas, fallback `tile_stone` |
| `tile_glass.png` | Escape y portales, fallback `tile_stone` |
| `tile_sewer.png` | Humedal de Slimes (alcantarilla), fallback `tile_metal` |
| `tile_stone.png` | Muros + fallback general |

Requisito clave: el tile NO debe traer borde oscuro dibujado (el actual
`tile_grass` sí lo trae y por eso se ve cuadrícula). Exporta seamless.
