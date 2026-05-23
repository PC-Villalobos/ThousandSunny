# NotebookLM Merge Review - 2026-05-23

Estado: reviewed_pending_apply
Cuenta: Antonio Villalobos
Superficie: NotebookLM home / Mis cuadernos
Regla: no se purga ni se elimina nada sin confirmacion explicita.

## Objetivo

Comparar los cuadernos marcados como solapados para decidir que debe quedar como
canon operativo, que debe moverse a marco teorico/narrativo y que puede quedar
como legado absorbido.

## Hallazgos

| Cuaderno | Fuentes | Lectura | Decision |
|---|---:|---|---|
| `NLM-SYS-SUNNY_MIGRATION_DOMAIN_DISSOCIATION__MERGE_REVIEW` | 50 | Contiene plan de migracion, decision locked-in, Escala Deckard N0-N5, protocolo de limpieza de humo y fuentes sobre workflows agenticos. NotebookLM lo identifica como Sunny Core operativo, pero reconoce solape alto con Deckard, Sunny Arch/Audit y Metatron. | `MERGE_INTO_CORE` / marcar como `CORE_CANDIDATE` |
| `NLM-SYS-METATRON_SECOND_BRAIN` | 22 | Mezcla fuentes de impacto, diseno, inspiracion, YouTube, notas pegadas, IRIS+, astrologia simbolica y conversacion sobre Metatron. Contiene material unico, pero no es sistema limpio. | `MOVE_TO_NAR` o `MIXED_REVIEW`; extraer piezas de auditoria antes de llevar nada al canon |
| `NLM-OPS-CLAUDE_NOTEBOOKLM_CONTEXT_BRIDGE` | 1 | Una fuente: video sobre conectar Claude con NotebookLM para contexto infinito. Su contenido ya fue formalizado en WP-007 y el piloto `NLM-20260523-01`. | `MERGE_INTO_WP007`; conservar como legado/referencia |

## Cuadernos Canonicos Comparados

| Cuaderno | Fuentes | Lectura |
|---|---:|---|
| `NLM-SYS-SUNNY_ARCH_AUDIT_v5_2` | 37 | Cuaderno tecnico amplio. Tiene material util sobre GAS, Obsidian, MCP, sutras N5 y arquitectura de agentes, pero tambien fuentes de startup, videos, imagenes y mercado. No debe recibir mas mezcla sin limpieza. |
| `NLM-SYS-DECKARD_MIGRATION_PLAN_v3` | 19 | Contiene estructura de migracion y clasificacion por dominios, pero tambien grupos tematicos mixtos. Debe conservarse como referencia de migracion mientras se extraen piezas estables. |
| `NLM-20260523-01_membrana_sunny_core` | 4 | Piloto WP-007 limpio y pequeno. Debe mantenerse como modelo de paquete controlado: pocas fuentes, prompt explicito, salida local y candidates. |

## Renombrados Recomendados

Estos cambios no eliminan nada; solo hacen visible el estado epistemico del cuaderno.

| Actual | Recomendado |
|---|---|
| `🚢 NLM-SYS-SUNNY_MIGRATION_DOMAIN_DISSOCIATION__MERGE_REVIEW` | `🚢 NLM-SYS-SUNNY_CORE_MIGRATION_PLAN__CORE_CANDIDATE` |
| `🕸️ NLM-SYS-METATRON_SECOND_BRAIN` | `🕸️ NLM-NAR-METATRON_SECOND_BRAIN__MIXED_REVIEW` |
| `🔗 NLM-OPS-CLAUDE_NOTEBOOKLM_CONTEXT_BRIDGE` | `🔗 NLM-LEG-CLAUDE_NOTEBOOKLM_CONTEXT_BRIDGE__ABSORB_WP007` |

## Purgas

No hay purga aprobada.

El unico candidato a archivo posterior es `NLM-LEG-CLAUDE_NOTEBOOKLM_CONTEXT_BRIDGE__ABSORB_WP007`,
pero solo despues de comprobar que WP-007 contiene todo el protocolo util.

## Accion Operativa Siguiente

1. Aplicar los 3 renombrados recomendados.
2. Extraer desde `SUNNY_CORE_MIGRATION_PLAN` las piezas canonicas:
   - decisiones locked-in;
   - Escala Deckard N0-N5;
   - limpieza de humo / Hipatia;
   - reglas de trazabilidad.
3. Crear un lote WP-007 nuevo con esas piezas y compararlo contra `NLM-20260523-01`.
4. Solo entonces proponer archivo o purga.

## Nota De Ejecucion

La revision se completo dentro de NotebookLM. La aplicacion de renombrados quedo
pendiente porque el navegador in-app rechazo la escritura en campos de titulo/chat
durante esta segunda tanda. No se modificaron cuadernos en esta fase.

Session ref: 2026-05-23 | Codex / Usopp | NotebookLM merge review
