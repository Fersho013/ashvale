# Items — iconos del inventario (uno por ítem, opcional)

Convención que ya pinta `js/ui/inventoryUI.js` + `js/ui/hud.js`:
`assets/items/<nombre-normalizado>.png`

Normalización: minúsculas, sin acentos, todo lo no alfanumérico → `_`.
Ejemplos:
- `Madera` → `madera.png`
- `Espada Oxidada` → `espada_oxidada.png`
- `Mineral de Hierro` → `mineral_de_hierro.png`
- `Poción de Defensa` → `pocion_de_defensa.png`

Tamaño sugerido 32x32 o 48x48, fondo transparente.
Si el PNG no existe, el slot muestra el texto de antes: puedes añadir
sprites poco a poco sin romper nada.
El fondo del slot se edita con `assets/ui/slot.png` (ver `assets/ui/README.md`).
