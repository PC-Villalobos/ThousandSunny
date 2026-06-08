# 05_WORK_PACKETS

Version: 0.2
Estado: activo
Ultima actualizacion: 2026-05-23

## Formato

Cada work packet debe tener:

- ID
- Estado
- Voz
- Entrada permitida
- Salida obligatoria
- Acciones prohibidas
- Handoff

## Packets vivos

### WP-001 - Bootstrap minimo Sunny Core
Estado: done
Voz: Codex / Usopp
Entrada: diagnostico de saturacion, SUN-0004, PDF Integracion de herramientas.
Salida: `00_BOOTSTRAP_SUNNY_CORE.md`
Prohibido: ampliar a manual largo.
Handoff: creado en SUN-0005.

### WP-002 - Canon minimo
Estado: done
Voz: Codex / Usopp
Entrada: SUN-0002, SUN-0003, SUN-0004, State of the Ship.
Salida: `01_CANON.md`
Prohibido: mezclar clinica o trading en canon general.
Handoff: creado en SUN-0005.

### WP-003 - Inventario semilla
Estado: done
Voz: Codex / Usopp
Entrada: documentos estructurales detectados en Drive.
Salida: `02_INVENTARIO.csv` con 15 piezas semilla.
Prohibido: inventariar todo Drive en una pasada.
Handoff: ampliar de 15 a 50 piezas en mision posterior.

### WP-004 - Entidades y roles
Estado: done
Voz: Codex / Usopp
Entrada: Protocolo Deckard, tripulacion Sunny, herramientas.
Salida: `03_ENTIDADES.json`
Prohibido: convertir roles en permisos de escritura real.
Handoff: revisar por Nami si se integra con UI.

### WP-005 - Schema de pieza Deckard
Estado: done
Voz: Codex / Usopp
Entrada: Escala Deckard, inventario y frontera de dominios.
Salida: `04_PIEZAS_SCHEMA.json`
Prohibido: usar como validador clinico.
Handoff: integrarlo al Core cuando haya endpoint de piezas.

### WP-006 - n8n dry-run protocol
Estado: open
Voz: Codex / Sanji
Entrada: lista de workflows vivos.
Salida: protocolo para `LECTURA -> ETIQUETADO -> LOG -> DRY_RUN`.
Prohibido: borrar, mover, renombrar o sobreescribir.
Handoff: pendiente.

### WP-007 - NotebookLM prompt contract
Estado: done
Voz: ChatGPT / Nami
Entrada: 3-5 fuentes por lote.
Salida: prompt fijo para extraer candidatos sin canonizar.
Prohibido: pedir "que es todo mi sistema".
Handoff: `WP-007_NOTEBOOKLM_PROMPT_CONTRACT.md` y `WP-007_NOTEBOOKLM_BATCH_TEMPLATE.md`.

### WP-008 - Inventario 50 piezas
Estado: done
Voz: Gemini / Zoro con supervision Nami
Entrada: solo documentos estructurales.
Salida: ampliar `02_INVENTARIO.csv` a 50 filas.
Prohibido: material clinico, trading y sesiones sin permiso.
Handoff: PR #5 mergeado; inventario estructural ampliado a 50 piezas.

### WP-009 - Gastrulacion Metatron
Estado: plan_ready
Voz: Codex / Usopp con supervision Nami
Entrada: auditoria Wave5, mapa de gastrulacion, estado local de oleadas.
Salida: `state/metatron/METATRON_GESTATION_STATE.md`.
Prohibido: publicar contenido clinico, mover fuentes, ejecutar Mirror sin GO C0.
Handoff: Wave8 en Plan con 16 candidatos y `source_mutations=0`; Mirror bloqueado hasta GO C0 explicito del Capitan.

### WP-011 - La Maceta de Groot
Estado: open
Voz: Claude Code / Franky
Entrada: conversacion de genesis (2026-06-05/06), principio Fibonacci, fases embriologicas, vault local C:\La maceta de Groot.
Salida: `state/maceta_groot/MACETA_GROOT_STATE.md`, `state/maceta_groot/RETOMAR.md`, canon Fibonacci en `state/deckard/06_FIBONACCI_GROWTH.md`.
Prohibido: mezclar material clinico; representar fase Ent antes de completar fase Morula; saltarse fases de desarrollo; confundir el tiesto con su contenido final.
Nota: WP-010 ya esta ocupado por Corpus Collection interno de Metatron (Wave8 candidatos).
Handoff: Fase 1 (Semilla) completada 2026-06-06. Vault local creado. Canon Fibonacci formalizado. Proxima accion: Fase 2 (Doble) — definir corpus raiz del vault.
