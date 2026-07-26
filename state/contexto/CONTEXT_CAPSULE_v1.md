# context-capsule.v1 — contrato de arranque

**Estado: contrato diseñado y mapeado. No instalado.** No hay generador, no hay almacén de
cursores, no hay skill que lo consuma. Este archivo y `context-capsule.v1.schema.json` son
el contrato; construirlo es un paso posterior y separado.

Decisión del Capitán vigente (`state/cierres/CIERRE_ARCO_20260725.md`): *no abrir nada nuevo
hasta que lo abierto respire solo*. Un contrato no es una apertura: es la condición para que
lo abierto deje de re-descubrirse cada sesión.

---

## 1. Qué problema resuelve

Hoy cada agente reconstruye el estado leyendo documentos completos: `POSICION.md`,
`CLAUDE.md`, el último cierre, el ledger de sueño, más el historial del proveedor. Son
~38.900 B de arranque mínimo (~10.000 tokens) para responder a tres preguntas que caben en
una página: dónde estamos, qué está abierto, qué es lo siguiente seguro.

El problema no es falta de memoria. Es que **nadie lee de vuelta**. Cada sesión escribe en
un pozo y luego reconstruye desde markdown.

El caso más claro: el campo `next_safe_action` se escribe en cada evento de Bitácora —
literalmente "qué hacer a continuación", redactado por quien tenía el contexto en la mano —
y no lo ha leído nadie nunca. Recuperarlo cuesta cero.

La cápsula es una **proyección**, no una fuente. Se deriva; no se edita; no se commitea una
instancia como si fuera estado. Si se pierde, se regenera.

---

## 2. Procedencia de las cifras de este documento

Distinción deliberada, porque este contrato existe precisamente para que nadie vuelva a
mezclar lo verificado con lo heredado.

**Verificado en el contenedor cloud, 2026-07-26:**

| Hecho | Valor |
|---|---|
| Rama de trabajo | `claude/thousandsunny-continuity-tokens-w4n0ab`, idéntica a `origin`, árbol limpio |
| HEAD | `cc9df87` (`chore(sueno): parte nocturno 2026-07-26`) |
| Rama por defecto del remoto | `claude/franky-feature-O1BkB`, en `7a65416` — **por detrás** de esta rama |
| Último ciclo de sueño | 2026-07-26, executor `github-actions`, actor `deterministic-sleep-engine`, rol Groot, `streak: 4`, `drift: true` |
| Cierres narrativos en repo | uno: `CIERRE_ARCO_20260725.md` |
| `state/funcion_de_sueno/lib/` | contiene `scan.mjs` y `scan.test.mjs`. **No contiene `bitacora.mjs`** |

**Heredado, no reverificable desde aquí:** el esquema `hipatia-bitacora-v1.1`, los cuatro
endpoints, los recuentos (22 eventos, 214 cierres formales, 19 misiones) y las cifras de
bytes. Se leyeron en la sesión anterior contra fuentes de la máquina del Capitán
(`bitacora_event.schema.json`, `bitacora_server.py`, `closure_core.py`, `git_evidence.py`).
Ninguna de esas rutas es alcanzable desde el contenedor. **El Bridge Runtime está apagado:
el contrato está verificado contra el fuente del servidor, no contra el servicio vivo.**

**Consecuencia operativa:** los tres commits locales del Capitán (`7a24934`, `983f6e5`,
`f1aafb9`) y `CIERRE_ARCO_20260726.md` no han llegado al remoto. `bitacora.mjs` —la primera
costura ejecutable— sólo existe en su máquina. Este contrato no la toca ni la duplica; el
mapeo de §4 asume que aterrizará en `state/funcion_de_sueno/lib/bitacora.mjs` y se apoya en
ella cuando lo haga.

---

## 3. Lo que ya está construido y no hay que rediseñar

El esquema `hipatia-bitacora-v1.1` **ya obliga** a cada evento a llevar `before`, `change`,
`after`, `meaning`, `next_safe_action`, `evidence[]`, `source`, `sensitivity`, `thread_id`.

Es decir: el contrato de checkpoint es más estricto que cualquier rediseño — tiene siete
campos más y enums cerrados donde una propuesta nueva pondría texto libre. **Rediseñar el
checkpoint crearía un tercer protocolo compitiendo con `CLAUDE.md` y `POSICION.md`.** No se
hace. La cápsula **lee** ese esquema; no lo sustituye.

Lo que falta no es el esquema. Es el binding: nadie hace `GET` de vuelta.

---

## 4. Mapeo campo a campo

`ok` = el dato existe y es recuperable de una fuente que ya funciona.
`hueco` = no existe almacén o consulta que lo dé.

| Bloque de la cápsula | Fuente | Cómo se obtiene | Estado |
|---|---|---|---|
| `position` | `POSICION.md` §1 | Lectura del repo | ok |
| `git` | evidencia git de Hipatia | `GET /api/git/repositories/thousandsunny/status` → rama, HEAD, ahead/behind, 20 últimos commits, sin tocar shell | ok |
| `bitacora.last_event_id` / `event_count` / `chain_verified` | Bitácora | `GET /api/events` | ok |
| `bitacora.events_since_cursor` | Bitácora | `GET /api/events` **no filtra por `since`** — se recorta en cliente | hueco menor |
| `closures.formal_count` / `last_closure_hash` | `closure_records.jsonl` | `GET /api/closure/dashboard` devuelve el bloque vivo entero | ok |
| `closures.unabsorbed` | `state/cierres/` vs. cadena formal | Diff de nombres contra el dashboard | ok |
| `work.active_missions` | Bitácora | `GET /api/missions` | ok |
| `work.open_blockers` | último cierre + `POSICION.md` §6 | Lectura del repo | ok |
| `work.recent_decisions` | eventos, campo `meaning` | `GET /api/events` | ok |
| `work.next_safe_action` | eventos, campo `next_safe_action` | `GET /api/events`, último evento | ok, y **hoy nadie lo lee** |
| `sleep` | `state/funcion_de_sueno/sleep_ledger.jsonl` | Última línea del ledger | ok |
| `seals` | prosa de `POSICION.md`, `CLAUDE.md`, guardas de la Función de Sueño | Ninguno. Los sellos viven en prosa | **hueco caro** |
| `cursor` | — | No existe almacén de cursores | **hueco** |
| `recommended_reads` | derivado | Se calcula de los huecos y bloqueos | ok |
| `authority.health` | sondeo | Alcanzabilidad de cada almacén | ok |

**Diez de trece bloques salen de endpoints que ya funcionan.**

### Los tres huecos, por orden de coste

1. **Los sellos viven en prosa.** Es el caro, y no por tokens: su fallo rompe el sello de
   Metatrón o una guarda clínica. Un agente que lee `POSICION.md` en diagonal puede concluir
   que N1–N5 "hay que crearlos" cuando lo que hay que hacer es rellenarlos con GO C0. El
   bloque `seals` los vuelve estructura con puerta declarada.
2. **No hay almacén de cursores.** Sin él la cápsula es una foto, no un diff, y `codex-usopp`
   sigue preguntando "¿qué ocurrió estos días?".
3. **`GET /api/events` no filtra por `since`.** Menor: con 22 eventos se recorta en cliente.
   Importa a los cientos, no ahora.

---

## 5. Coste

| | Bytes | Tokens aprox. |
|---|---|---|
| Arranque actual, mínimo | 38.903 | ~10.000 |
| Cápsula serializada con los valores reales de hoy | 2.398 | ~680 |

Factor 15. Medido, no estimado — la cápsula se serializó con los valores del día.

Presupuestos admitidos por el contrato (`budget.name`). El router escoge `tiny` salvo que la
tarea pida otra cosa: `tiny` ≤800 tokens (posición + trabajo vivo), `normal` ≤2.500 (más
deltas y decisiones), `deep` ≤8.000 (memoria semántica consultada), `audit` sin techo
(evidencia completa bajo demanda). Un bloque recortado se declara en `budget.truncated`;
nunca se omite en silencio.

---

## 6. Separación memoria / evidencia

La cápsula **no inyecta documentos**. Cada afirmación viaja como `claim`: afirmación
compacta, estado epistémico, procedencia citable, fecha y puntero para ampliar.

```json
{
  "claim": "Bridge Runtime cosido a Funcion de Sueno",
  "status": "verified",
  "source": "git:983f6e5",
  "valid_at": "2026-07-26",
  "expand": "state/funcion_de_sueno/lib/bitacora.mjs"
}
```

El modelo pide la evidencia sólo si la necesita. `status` distingue `verified` de `reported`:
es lo que impide que un informe heredado se canonice como hecho comprobado.

---

## 7. Alcance descartado a propósito

- **Seis niveles de memoria L0–L5.** El sustrato real tiene tres almacenes físicos, no seis.
  Seis es taxonomía que nadie mantiene. La cápsula los colapsa en bloques con presupuesto.
- **Rediseñar el checkpoint.** Ya existe y es más estricto (§3). Tocarlo abre un tercer
  protocolo.
- **Migración destructiva de las trece SQLite.** Primero interfaz de consulta común encima;
  luego migración por dominios con comprobación de recuentos y hashes.
- **Un workflow engine nuevo.** El arnés existente aguanta (`POSICION.md` §6).

---

## 8. Orden de construcción

El punto 1 va antes que el generador, no después: **un lector construido sobre protocolo
contradictorio automatiza la confusión más rápido.**

1. ~~Resolver la contradicción de autoridad entre `CLAUDE.md` y `POSICION.md`~~ — hecho en
   esta rama.
2. Subir o resolver los tres commits locales y `CIERRE_ARCO_20260726.md`.
3. Encender el Bridge Runtime y confirmar los cuatro endpoints contra el servicio vivo. Sin
   esto, §4 sigue verificado contra fuente, no contra servicio.
4. Levantar el bloque `seals` a estructura — el hueco caro.
5. Crear el almacén de cursores y el registro `codex-usopp`.
6. Generador de la cápsula sobre Bitácora + Git + `state/cierres/`.
7. Adaptar **una sola** skill —la de checkpoint/contexto— y medir tokens antes y después.
8. Sólo entonces extender la costura al resto.
