# Journal global de la funcion de sueno — contrato `sleep_events/v1`

Esquema y reglas del journal append-only que sustituye a `sleep_ledger.jsonl`
como **fuente global de verdad del estado operacional**. Implementa los puntos
1, 2 y 3 del encargo Groot, autorizados por el Capitan el 2026-07-25.

```yaml
version: 1.0
estado: implementado, con motores en paridad y suite sintetica en verde
chronos:
  occurred_at: 2026-07-25
  recorded_at: 2026-07-25
  sequence_after: consolidacion_ledger (PR 86)
autoridad:
  encargo: Puente de Mando (sesion Codex)
  go_groot_1_3: Capitan (2026-07-25)
provenance:
  class: evaluado
alcance: esquema, motores Python/Node, consolidacion y pruebas sinteticas
fuera_de_alcance: GAS, Routine cloud, schedules, secretos, politica actor/rol
```

## 1. Por que existe

`sleep_ledger.jsonl` mezclaba tres cosas distintas en una sola linea: que una
corrida ocurrio, que produjo efectos, y que el tronco la habia incorporado.
Como cada rama calculaba la racha contra su propia copia parcial, el sistema
reportaba rachas de 10 y 11 que no existian (ver
`FASE0_RECONCILIACION_20260725.md`).

El journal separa esas etapas y deriva la racha en vez de persistirla.

## 2. Autoridades

| Capa | Autoridad sobre |
|---|---|
| Rama canonica de codigo | contrato, motores, pruebas |
| `sleep_events.jsonl` | **estado operacional global** |
| `sleep_ledger.jsonl` y los informes por rama | observaciones locales; **nunca evidencia global por si solas** |
| Bitacora | autoridad narrativa y canonica superior; no es necesaria para calcular la racha tecnica |

Nota de topologia: desde el 2026-07-24 la Bitacora es el servicio local, no GAS.
El journal no depende de ninguno de los dos para ser correcto.

## 3. Etapas y transiciones

```
fired -> executed | failed
executed -> published
published -> absorbed
```

**Ninguna etapa se infiere por la existencia de otra.** Que una corrida haya
publicado no implica que este absorbida; que este absorbida no altera el hecho
de que se ejecuto.

`absorbed` no modifica la ejecucion: solo registra su incorporacion al canon.

## 4. Identidad

```
run_id = sha256( routine_id | scheduled_at | actor | role )
```

**Endurecimiento respecto al spec.** El encargo escribia la identidad como
concatenacion directa. Se introduce el separador `|` porque la concatenacion sin
delimitador es ambigua: `("a","bc")` y `("ab","c")` colisionarian. Ambos motores
usan el mismo separador y producen el mismo digest.

- Un mismo `run_id` puede recibir nuevas transiciones.
- Los reintentos **conservan** `run_id` y **anaden** `attempt_id` (entero, base 1).

## 5. Deduplicacion

**Clave de deduplicacion: `(run_id, stage, attempt_id)`.**

**Desviacion declarada respecto al spec.** El encargo fijaba la clave en
`run_id + stage`. Esa clave hace incompatibles dos pruebas exigidas:

- la prueba 2 pide que reemitir el mismo evento no duplique filas;
- la prueba 3 pide que un reintento conserve `run_id` y genere otra fila.

Con `run_id + stage` estricto, el reintento de la prueba 3 seria rechazado como
duplicado. Anadir `attempt_id` a la clave es la unica forma de satisfacer ambas.
Para el caso corriente (`attempt_id = 1`) la clave se reduce a la del spec.

Reglas:

- Misma clave y **mismo contenido**: no-op idempotente, no se anade fila.
- Misma clave y **contenido distinto**: se **rechaza** y se registra como incidencia.
- Transicion no permitida por la maquina de estados: se rechaza como incidencia.

## 6. Integridad

Cada registro encadena con el anterior, siguiendo el patron ya usado en el
ecosistema:

```
record_hash = sha256( canonical( registro_sin_record_hash ) )
```

donde `canonical` es JSON con claves ordenadas, separadores `,` y `:`, sin
espacios, y `prev_hash` es el `record_hash` del registro anterior (cadena vacia
para el primero). La escritura es de **un unico proceso serializado**, con
actualizacion optimista contra el hash previo: si el journal cambio bajo los
pies del escritor, la operacion se rechaza en vez de sobrescribir.

## 7. Derivacion de la racha

```
streak := sobre los eventos globales de etapa `executed`,
          ordenados por `scheduled_at`,
          contando repeticiones consecutivas del mismo `actor`
```

**La racha nunca se persiste como verdad primaria.** Se calcula al leer. Esto es
lo que elimina el artefacto: no depende de que rama este mirando el observador.

## 8. Registro

Campos de una fila del journal:

| Campo | Tipo | Nota |
|---|---|---|
| `schema` | str | `sleep_events/v1` |
| `run_id` | str | sha256 hex |
| `attempt_id` | int | base 1 |
| `stage` | str | una de las cinco etapas |
| `routine_id` | str | identidad de la rutina |
| `scheduled_at` | str | instante programado, ISO 8601 |
| `occurred_at` | str | instante real |
| `actor` | str | quien juega el rol |
| `role` | str | rol jugado |
| `executor` | str \| null | sustrato que ejecuta; separado del actor |
| `payload` | obj | datos de la etapa (informe, verdict, rama) |
| `prev_hash` | str | encadenamiento |
| `record_hash` | str | integridad de esta fila |

## 9. Migracion

`sleep_ledger.jsonl` se proyecta al journal sin perdida: cada linea del ledger
consolidado produce un `fired` y un `executed` con el mismo `run_id`, mas un
`absorbed` si la linea ya estaba en el tronco. Las lineas que solo vivian en
ramas quedan como `executed` sin `absorbed`, que es exactamente el estado que el
sistema no sabia representar.

El ledger no se borra: pasa a ser observacion local.
