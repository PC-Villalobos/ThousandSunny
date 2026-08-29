# Procedencia de artefactos generados por IA

```
provenance:
  produced_by: claude
  ai_role: draft
  human_contribution: direction_and_review
  human_authority: captain
  review_status: unreviewed
  canonical: false
```

Fecha: 2026-08-22
Packet: pendiente de asignación por el Capitán
Estado: criterio declarado

## Decisión

**Declaración del Capitán, 2026-08-22:** a partir de hoy, todo lo que Claude genera
—o toca para revisar o corregir— lleva marca de agua.

El Capitán planteó a la vez la duda correcta: *"no sé si se distingue el grado de
autoría que tiene la IA o la autoridad que tiene el humano"*. No se distingue. Una
marca sola dice **de dónde salió**, y eso es una sola de las tres cosas que hay que
poder leer por separado.

## Tres campos que no son el mismo campo

| Campo | Responde | Qué NO dice |
| :---- | :---- | :---- |
| `produced_by` | Quién generó materialmente el texto o el cambio: `claude`, `codex`, `groot_local`, `human` | Nada sobre cuánto puso el humano |
| `human_contribution` | Qué hizo el Capitán: `idea`, `direction`, `direction_and_review`, `rewrite`, `full_authorship` | Nada sobre si está autorizado |
| `human_authority` | Quién puede volverlo operativo o canónico. Siempre el Capitán, con Hipatia como registro | Nada sobre quién lo escribió |

Fundirlos reproduce, en la capa de procedencia, el mismo modo de fallo que
`state/usopp/monitor-coronal/ESTATUTO_COHERENCIA.md` §3 nombra en la capa de
intención: aparentar autorización donde solo hay origen.

**Una marca de agua no concede permisos.** Que Claude redactara algo no lo acerca a
canon; que lleve marca no lo aleja. La autoridad sigue siendo del Capitán.

## Cabecera

```yaml
provenance:
  produced_by: claude | codex | groot_local | human
  ai_role: draft | analysis | refactor | review
  human_contribution: idea | direction | direction_and_review | rewrite | full_authorship
  human_authority: captain
  review_status: unreviewed | human_reviewed | approved
  canonical: false
  source_session: referencia opaca, opcional
```

`canonical: false` por defecto. Pasar a canon exige el procedimiento Deckard
—pilar, estado, fuente y nivel de certeza—, no un cambio de campo.

## Lo que la marca no prueba

Esto es lo que impide que la regla se convierta en teatro:

1. **Una marca autoaplicada es declaración, no evidencia.** Que Claude escriba
   `produced_by: claude` no demuestra nada por sí solo: es exactamente el modo de
   fallo que el asiento R6 de `state/recepcion/RECEPCION_CUBIERTA_20260727.md` ya
   castigó al rebajar el motor de OpenClaw a *no verificado* — la configuración
   declarada no prueba quién respondió.
2. **Los anclajes verificables están fuera del fichero**: el trailer
   `Co-Authored-By` del commit, la autoría del PR, y el evento en Bitácora con su
   `packetId`. Esos los escribe la herramienta, no el texto. La cabecera es ayuda a
   la lectura; la traza es la prueba.
3. **La ausencia de marca no prueba autoría humana.** Un fichero sin cabecera puede
   ser humano, copiado, heredado o generado por un actor que la omitió. `sin marca`
   significa `unknown`, nunca `human`.

## Retroactividad

Ninguna. No se rellena hacia atrás lo que no se puede comprobar: el material
anterior a esta fecha queda `provenance: unknown_legacy` hasta que haya evidencia
real. Inventar procedencia para completar cabeceras sería fabricar exactamente la
trazabilidad que esta regla existe para tener de verdad.
