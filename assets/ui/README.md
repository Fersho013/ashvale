# UI — fondos del inventario y menús (todo opcional)

Si existen, se usan; si no, se conserva el estilo CSS actual:

| Archivo | Uso |
|---|---|
| `slot.png` | Fondo de cada casilla (`.inv-slot`, `.qb-slot`) |
| `slot_equip.png` | Fondo de casilla de equipo (`.equip-slot`) |
| `panel.png` | Fondo de paneles (inventario, cofre, misiones) |
| `button.png` | Fondo de botones (incluye menú Anciano Hablar/Guía/Cerrar) |

Para aplicarlos como fondo CSS понадобится una regla
`background-image: url(...)`; de momento el slot ya acepta iconos de ítem
encima (ver `assets/items/README.md`). Pídeme el cableado CSS cuando subas
estos PNG y lo conecto.
NPC (Anciano): el cuadro usa CSS (`css/style.css` `.npc-action-menu`);
su retrato iría como `assets/npc_elder.png` (clave `npc_elder` en
`js/core/assets.js`) cuando quieras dibujarlo en el diálogo.
