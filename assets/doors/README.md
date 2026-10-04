# Puertas — frontal vs perfil, cerrada vs abierta

`js/main.js` → `drawDoor()` elige por forma (`w<h` = perfil/lateral,
`w>h` = frontal) y estado (`d.open`, se alterna con [E]):

| Archivo | Cuándo se usa |
|---|---|
| `door_front.png` | Cerrada horizontal (la actual, ajústala y pégala aquí) |
| `door_side.png` | Cerrada vertical / perfil |
| `door_open_front.png` | Abierta horizontal |
| `door_open_side.png` | Abierta vertical / perfil |

Si falta un `_open_*`, usa su cerrada; si falta `door_side`, usa `door_front`.
Tamaño sugerido 48x64, fondo transparente.
