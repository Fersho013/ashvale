# Atlas de Ashvale

Coloca aquí un PNG y el JSON que exporte Aseprite, TexturePacker o free-tex-packer. Cada pareja debe llamarse igual que su entrada en `js/core/atlas.js`:

- `player`, `dummy`, `wolf`, `slime`, `big_slime`, `goblin`, `goblin_foreman`, `arena_mob`, `deer`, `npc`
- `world`, `weapons`, `ui`

Ejemplo: `player.png` y `player.json`.

## Nombres de frames

Se aceptan carpetas y extensiones. Por ejemplo, `Player/Attack Sword Down 0.png` se normaliza automáticamente a `attack_sword_down_0`.

Para animaciones usa cualquiera de estas dos convenciones:

```text
move_down_0.png
move_down_1.png
attack_sword_left_0.png
```

o crea un `frameTag` de Aseprite llamado `move_down`, `attack_sword_left`, etc. Las direcciones válidas son `down`, `up`, `left` y `right`.

Los nombres requeridos de cada atlas están declarados en `ANIMATION_CONTRACT` de `js/core/atlas.js`. Los frames estáticos para `world`, `weapons` y `ui` aparecen en el mismo contrato.

Los tiempos `duration` de cada frame del JSON se respetan; no hace falta que todos duren lo mismo.

Mientras falte un PNG, JSON o frame, el juego continúa usando la apariencia de respaldo actual.

## Ejecución local

Los navegadores bloquean normalmente `fetch()` de JSON cuando se abre `index.html` directamente con `file://`. Prueba el juego desde un servidor local, por ejemplo desde la carpeta del proyecto:

```powershell
python -m http.server 8000
```

Después abre `http://localhost:8000`.
