# Fase 0 — Reconciliación previa del tronco y del ledger de sueño

Informe de la Fase 0 read-only encargada por el Puente de Mando. Este documento
no muta nada: es inventario, cálculo y recomendación. La reconciliación efectiva
(absorber los eventos huérfanos) requiere el `GO reconciliación`, que es una
autorización distinta e independiente de la que produjo este informe.

```yaml
version: 1.0-fase0
estado: completado, read-only, sin mutaciones
chronos:
  occurred_at: 2026-07-25
  recorded_at: 2026-07-25
  sequence_after: cierre_arco_cowork_nami (2026-07-25)
autoridad:
  encargo: Puente de Mando (sesion Codex)
  go_fase0_read_only: Capitan (2026-07-25)
  go_reconciliacion: pendiente, independiente
  go_cambio_default: pendiente, independiente
  go_groot_1_3: pendiente, independiente
provenance:
  class: verificado  # todo dato procede de consulta directa a git/GitHub, no de vista local parcial
ejecutor: claude-code (sesion remota, sin acceso al hub)
```

## 0. Resultado de cabecera

**La racha de fusión actor/rol de Groot no existe.**

Calculada sobre el journal global consolidado (74 eventos, union semantica de
tronco y ramas), la racha por actor **nunca supera 3** en toda la historia del
sistema. La ventana 2026-07-18 a 2026-07-22 es una alternancia perfecta, con
`streak=1` en cada entrada:

```
07-18  claude-code                  streak=1   [huerfano]
07-18  github-actions               streak=1   [tronco]
07-19  claude-code                  streak=1   [huerfano]
07-19  github-actions               streak=1   [tronco]
07-20  claude-code                  streak=1   [huerfano]
07-20  github-actions               streak=1   [tronco]
07-21  claude-code                  streak=1   [huerfano]
07-21  github-actions               streak=1   [tronco]
07-22  claude-code                  streak=1   [huerfano]
07-22  github-actions               streak=1   [tronco]
```

Las rachas de 10 y 11 observadas en los partes nocturnos eran integramente
artefacto de vista parcial: cada corrida calculaba la racha contra el ledger de
su propia rama, y el tronco solo habia absorbido la ruta determinista.

Esto satisface, con datos reales y no sinteticos, la prueba numero 7 exigida al
encargo Groot 1-3 ("reproduccion del salto streak 11->7 demuestra que desaparece
con el journal consolidado") antes de escribir una sola linea de codigo.

**Corolario operativo:** el pendiente heredado "romper la racha de Groot" queda
sin objeto. No hay racha que romper. El fallo es de observabilidad y absorcion,
conforme al dictamen del Puente.

## 1. Metodo

- Fuente: consulta directa a `git`/GitHub sobre el remoto, no sobre la copia local.
- Union semantica por clave canonica `(ts, event, actor, role)`. No concatenacion.
- Racha derivada por recalculo sobre la union ordenada por `ts`. El campo `streak`
  almacenado en cada linea se ignora por no ser fiable.
- Barrido de ramas: todas las que coinciden con `claude/sueno-*`,
  `claude/focused-keller-*` y `codex/sueno-*`, no solo los cinco PR nombrados.

## 2. Cifras verificadas

| Magnitud | Valor |
|---|---|
| Eventos en el tronco (`claude/franky-feature-O1BkB`) | 50 |
| Eventos huerfanos (en ramas, no absorbidos) | 24 |
| Eventos globales unicos | 74 |
| Huerfanos presentes en mas de una rama | 0 |
| Actor de los 24 huerfanos | `claude-code` en el 100 % |
| Racha global maxima en toda la historia | 3 |
| Racha global al cierre del 2026-07-25 | 3 (`deterministic-sleep-engine`) |

Reparto de actor en el tronco: 37 `github-actions`, 9 `claude-code`,
3 `deterministic-sleep-engine`.

**Alcance real: 24 ramas con eventos sin absorber, no 5.** Los PR #70, #71, #72,
#74 y #78 que el encargo nombraba son un subconjunto. El huerfano mas antiguo
data del 2026-06-19.

## 3. 0A — Matriz preservar / integrar / sustituir / descartar

| Elemento | Estado verificado | Accion | Justificacion |
|---|---|---|---|
| `main @ 08dd0cba` | ancestro directo del tronco; `+0` por delante | integrar (ya efectuado) | `merge-base` coincide con el HEAD de `main`; el tronco lo contiene entero |
| Los 8 commits exclusivos de `main` | absorbidos via `95fb653` | preservar | incluye PR #77 y `f95b3ce` |
| Commit exclusivo del tronco `71864c1` | vivo | preservar | parte nocturno 2026-07-20 |
| Blobs `.mjs` `f89423c5` y `83f29275` | hoy identicos (`f89423c5`) en ambas ramas | sustituir por `f89423c5` | `83f29275` quedo superado por la integracion; verificado byte a byte, sin CR |
| Ledger 44 frente a 45 entradas | hoy 44 (`main`) frente a 50 (tronco); contencion completa | integrar en el tronco | cero eventos de `main` ausentes en el tronco |
| Los 24 eventos huerfanos | 1 por rama, 0 duplicados, 100 % `claude-code` | integrar | son la ruta agentica completa, jamas absorbida |
| PR #70/#71/#72/#74/#78 | 5 de las 24 ramas (07-16 a 07-20) | integrar | subconjunto; no cerrarlos sin absorber su evento |
| Las otras 19 ramas | PR #62 (07-13) y 18 mas, desde 2026-06-19 | integrar | quedaban fuera del perimetro que el encargo asumia |
| Dos formatos de serializacion | 22 compacto `{"ts":"` y 2 espaciado `{"ts": "` | normalizar | mismo evento logico, bytes distintos; afecta a `run_id` y al dedup |
| Campo `streak` almacenado | no fiable en ninguna rama | descartar como dato primario | es derivable; persistirlo es la causa directa del artefacto |
| PR #79 | cerrado sin merge; 1 fichero, 233 lineas, sin eventos de sueno | descartar | resuelto por el Capitan; sin impacto sobre el ledger |

## 4. 0B — Candidato canonico

**`claude/franky-feature-O1BkB`.**

La eleccion no se apoya en que sea la rama por defecto (el encargo lo prohibe
expresamente), sino en que es la unica que satisface los seis criterios sin
necesidad de integrar nada:

| Criterio exigido | Verificacion |
|---|---|
| Conserva PR #77 | si; `08dd0cb` es ancestro |
| Conserva `f95b3ce` (separacion aditiva executor/actor/rol) | si; ancestro. Surtio efecto el 07-23: el actor paso de `github-actions` a `deterministic-sleep-engine` |
| Conserva el evento nocturno `71864c1` | si |
| Conserva todos los eventos validos de ambos ledgers | si; 50 de 50, cero perdidas desde `main` |
| Comportamiento compatible de los motores | `.mjs` identico entre troncos. **No verificado**: paridad cruzada `.mjs` frente a `.py`, que es la prueba numero 8 del encargo Groot 1-3 y queda fuera del alcance de Fase 0 |
| Historia trazable desde `94c6f86` | si; lineal via `95fb653` |

`main` queda descartado como candidato: le faltan 8 commits y 6 eventos. No es
un tronco rival, es un ancestro.

**No se necesita rama temporal de reconciliacion.** La reconciliacion entre los
dos troncos ya ocurrio de hecho entre el 21 y el 25 de julio.

## 5. 0C — Plan de reconciliacion

Entre `main` y el tronco no queda nada por reconciliar. El trabajo real es
absorber los 24 eventos huerfanos.

1. **Orden de integracion.** El tronco es la base. No hay integracion de ramas,
   solo union de eventos sobre `sleep_ledger.jsonl`.
2. **Resolucion de los motores.** Resuelta: blob unico `f89423c5`. Sin conflicto.
3. **Union semantica.** Clave canonica `(ts, event, actor, role)`, ordenada por
   `ts`. Verificada en seco: 74 eventos unicos, 0 colisiones.
4. **Prueba de no-perdida.** 50 + 24 = 74, ya ejecutada en frio y reproducible.
5. **Comparacion de arboles.** El unico fichero que cambia es
   `sleep_ledger.jsonl`. Los 24 informes `.md` viven en sus ramas y pueden
   absorberse o quedar referenciados; es decision aparte.
6. **Rollback.** Trivial: la absorcion es un solo commit sobre un solo fichero
   append-only. `git revert` lo deshace sin tocar nada mas.
7. **Precondicion nueva.** Normalizar la serializacion antes de unir, o el
   dedup por bytes fallara con los 2 eventos de formato espaciado.

## 6. 0D — Rama por defecto

**No procede cambiarla.** La rama por defecto ya es el candidato canonico. La
accion queda vacia por ausencia de delta, no por falta de autorizacion.

## 7. Recomendacion

El `GO reconciliacion` es ahora una operacion mucho menor de lo previsto: un
commit, un fichero, 24 lineas, rollback de un `revert`.

El encargo Groot 1-3 pierde su urgencia diagnostica, porque el journal
consolidado ya demostro lo que iba a demostrar. Sigue siendo la solucion
estructural para que el sistema no vuelva a quedarse ciego: separar `fired`,
`executed`, `published` y `absorbed`; derivar la racha en vez de persistirla; y
consolidar sin depender de fusionar ramas paralelas.

La decision 4 del encargo (si actor/rol es alarma consultiva o rotacion
obligatoria) sigue fuera de alcance y requiere orden separada del Capitan. Este
informe aporta un dato para esa decision: con el journal consolidado, el
guardrail de rotacion nunca se habria disparado, porque la racha real nunca
alcanzo el umbral de 3.

## 8. Hallazgo colateral

`POSICION.md`, creado el 2026-07-25 y declarado punto de entrada obligatorio
para cualquier auditoria futura, no esta en `origin/main` ni en
`origin/claude/franky-feature-O1BkB`. Es local de la maquina del Capitan. La
instruccion "leer POSICION.md antes de auditar nada" no puede cumplirse desde
una sesion remota. O se versiona, o el puntero necesita una variante explicita
para sesiones sin acceso al disco del Capitan.
