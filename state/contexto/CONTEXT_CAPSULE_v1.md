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

**Verificado en el contenedor cloud sobre `d094bba`, 2026-07-26 (segunda pasada):**

| Hecho | Valor |
|---|---|
| Base | `claude/franky-feature-O1BkB` en `d094bba`, con los cuatro commits locales del Capitán ya publicados y `cc9df87` conservado como ancestro |
| Contrato de evento | Leído del código, no de memoria: `state/funcion_de_sueno/lib/bitacora.mjs` |
| Cierres narrativos en repo | dos: `CIERRE_ARCO_20260725.md` y `CIERRE_ARCO_20260726.md` |
| `state/funcion_de_sueno/lib/` | contiene `scan.mjs`, `scan.test.mjs`, `bitacora.mjs` y `bitacora.test.mjs` |

**Primera pasada, sobre `cc9df87`, ahora superada.** Se registró que `lib/` no contenía
`bitacora.mjs` y que el último ciclo de sueño daba `streak: 4, drift: true` con actor
`deterministic-sleep-engine`. Ambas cosas eran ciertas en aquel árbol y ya no lo son:
`bitacora.mjs` aterrizó con los commits del Capitán, y `POSICION.md` §5 explica que la racha
venía de un anillo de roles al que le faltaba `Groot`, no de una fusión real. Se deja escrito
porque una instantánea sin fecha se lee como presente, y ese es el fallo que esta sección
existe para evitar.

**Heredado, aún no reverificable desde aquí:** los recuentos de la Bitácora (eventos, cierres
formales, misiones) y las cifras de bytes. Se leyeron en sesión anterior contra fuentes de la
máquina del Capitán. **El contenedor no alcanza `127.0.0.1:8765`** — sondeado: `000` en
`127.0.0.1`, `localhost` y `host.docker.internal`, sin puertos a la escucha. El Bridge está
encendido en la máquina del Capitán desde las 16:05Z; esta sesión sigue sin verlo.

Lo que **sí** dejó de ser herencia: el contrato de evento. `bitacora.mjs` está en el repo y se
lee directamente. Ver §3.

---

## 3. Lo que ya está construido y no hay que rediseñar

`POST /api/events` obliga a diez campos, cinco de ellos con enum cerrado. Leído de
`state/funcion_de_sueno/lib/bitacora.mjs`, que a su vez lo leyó del fuente del servidor
(`_bitacora/scripts/bitacora_server.py`):

| Campo | Tipo | Valores |
|---|---|---|
| `actor` | texto | — |
| `role` | texto | — |
| `topic` | texto | — |
| `title` | texto | — |
| `message` | texto | — |
| `event_kind` | **enum** | `observation` `decision` `action` `result` `learning` `transition` `projection` |
| `epistemic_status` | **enum** | `observed` `calculated` `inferred` `evaluated` `proposed` `unknown` |
| `sensitivity` | **enum** | `public_safe` `internal` (por defecto `internal`) |
| `status` | **enum** | `observed` `decided` `executed` `verified` `blocked` `superseded` |
| `source` | **enum** | `captain` `codex` `claude` `github` `obsidian` `local_runtime` `other` |

`change`, `after`, `next_safe_action`, `evidence[]`, `scope`, `relations`, `project` y `phase`
viajan como carga opcional: el constructor de eventos de sueño los emite, el contrato no los
exige.

`epistemic_status` es el campo decisivo para lo que persigue este contrato. Es donde un
evento declara si lo que afirma fue observado, calculado, inferido o sólo propuesto. Sin él,
un informe heredado se canoniza como hecho comprobado a la primera relectura.

**Rediseñar esto crearía un tercer protocolo compitiendo con `CLAUDE.md` y `POSICION.md`.** No
se hace. La cápsula **lee** el contrato; no lo sustituye. Lo que falta no es el esquema: es
el binding. Nadie hace `GET` de vuelta.

### Rectificación — la primera versión de esta sección era falsa

La versión que entró en `672ee23` afirmaba que el contrato obligaba a `before`, `change`,
`after`, `meaning`, `next_safe_action`, `evidence[]`, `source`, `sensitivity` y `thread_id`.
De esos nueve, sólo `sensitivity` y `source` son obligatorios. `before`, `meaning` y
`thread_id` no aparecen siquiera en el constructor. Y los seis que sí lo son —`topic`,
`title`, `message`, `event_kind`, `epistemic_status`, `status`— no se mencionaban.

La conclusión sobrevive: hay un contrato real con enums cerrados y no debe rediseñarse. La
evidencia con que se sostenía, no. Procedencia del error: se leyó en sesión anterior contra
el fuente en la máquina del Capitán y se dio por bueno sin poder reverificarlo — **el fallo
exacto que §2 existe para prevenir, cometido dentro de este documento**. La rectificación se
deja al lado y no se borra el error, porque el modo de fallo importa más que la corrección.

Confirmación colateral: el 2026-07-26 esta cápsula viajó a la Bitácora por relé con
`status: "reported"` y `sensitivity: "public"`. Codex los normalizó a `observed` e `internal`
antes de publicar. Ninguno de los dos estaba en el enum; sin esa normalización el evento
habría ido a Cuarentena.

---

## 4. Mapeo campo a campo

`repo` = sale de un archivo de este repositorio; comprobable sin red.
`confirmado` = el endpoint está atestiguado por código del repo (`bitacora.mjs`).
`sin confirmar` = el endpoint se dio por existente en sesión anterior y **ningún código del
repo lo respalda**. Puede existir; aquí no consta.
`hueco` = no existe almacén ni consulta que lo dé.

| Bloque de la cápsula | Fuente | Cómo se obtiene | Estado |
|---|---|---|---|
| `position` | `POSICION.md` §1 | Lectura del repo | repo |
| `git` | git local, o evidencia git de Hipatia | `git` directo; el endpoint `/api/git/repositories/…/status` no consta en el repo | repo |
| `bitacora.last_event_id` / `event_count` / `chain_verified` | Bitácora | `GET /api/events` | sin confirmar |
| `bitacora.events_since_cursor` | Bitácora | Sin filtro `since` conocido — se recorta en cliente | sin confirmar |
| `closures.formal_count` / `last_closure_hash` | `closure_records.jsonl` | `GET /api/closure/dashboard` | sin confirmar |
| `closures.unabsorbed` | `state/cierres/` vs. cadena formal | Diff de nombres | repo (parcial) |
| `work.active_missions` | Bitácora | `GET /api/missions` | sin confirmar |
| `work.open_blockers` | último cierre + `POSICION.md` §6 | Lectura del repo | repo |
| `work.recent_decisions` | eventos, campos `title` / `message` | `GET /api/events` | sin confirmar |
| `work.next_safe_action` | eventos, campo `next_safe_action` | Último evento | sin confirmar, y **hoy nadie lo lee** |
| `sleep` | `state/funcion_de_sueno/sleep_ledger.jsonl` | Última línea del ledger | repo |
| `seals` | prosa de `POSICION.md`, `CLAUDE.md`, guardas de la Función de Sueño | Ninguno. Los sellos viven en prosa | **hueco caro** |
| `cursor` | — | No existe almacén de cursores | **hueco** |
| `recommended_reads` | derivado | Se calcula de los huecos y bloqueos | repo |
| `authority.health` | sondeo | `GET /api/health` más alcanzabilidad de cada almacén | confirmado |

**Sólo dos endpoints están atestiguados por código del repo: `GET /api/health` y
`POST /api/events`.** Los demás vienen de la lectura de la sesión anterior contra la máquina
del Capitán y siguen sin poder comprobarse desde la nube.

Rectificación: `672ee23` afirmaba que «diez de trece bloques salen de endpoints que ya
funcionan». Cinco bloques (`position`, `work.open_blockers`, `sleep`, `recommended_reads` y
parte de `closures`) salen del repo y no necesitan endpoint alguno — eso se mantiene y es la
parte barata. Pero los que sí dependen de la Bitácora descansan en endpoints sin confirmar, y
presentarlos como «ya funcionan» era pasar herencia por verificación.

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
  "status": "observed",
  "source": "claude",
  "valid_at": "2026-07-26",
  "expand": "state/funcion_de_sueno/lib/bitacora.mjs"
}
```

El modelo pide la evidencia sólo si la necesita. `status` toma el enum `epistemic_status` del
contrato de Bitácora —`observed`, `calculated`, `inferred`, `evaluated`, `proposed`,
`unknown`— y es lo que impide que un informe heredado se canonice como hecho comprobado.

La v1 original usaba aquí valores propios (`verified`, `reported`, `contested`, `stale`) que
no existen en el contrato. No es cosmética: fue esa desalineación la que obligó a normalizar
un evento de esta cápsula antes de publicarlo en la Bitácora. Una cápsula que habla un
dialecto distinto del almacén al que apunta produce exactamente el trabajo de traducción que
viene a eliminar.

---

## 7. Alcance descartado a propósito

- **Seis niveles de memoria L0–L5.** El sustrato real tiene tres almacenes físicos, no seis.
  Seis es taxonomía que nadie mantiene. La cápsula los colapsa en bloques con presupuesto.
- **Rediseñar el checkpoint.** Ya existe, con diez campos obligatorios y cinco enums
  cerrados (§3). Tocarlo abre un tercer protocolo.
- **Migración destructiva de las trece SQLite.** Primero interfaz de consulta común encima;
  luego migración por dominios con comprobación de recuentos y hashes.
- **Un workflow engine nuevo.** El arnés existente aguanta (`POSICION.md` §6).

---

## 8. Orden de construcción

El punto 1 va antes que el generador, no después: **un lector construido sobre protocolo
contradictorio automatiza la confusión más rápido.**

1. ~~Resolver la contradicción de autoridad entre `CLAUDE.md` y `POSICION.md`~~ — hecho en
   esta rama.
2. ~~Subir o resolver los tres commits locales y `CIERRE_ARCO_20260726.md`~~ — hecho el
   2026-07-26 (`d094bba`, reconciliado por merge, sin `--force`).
3. ~~Alinear §3 y el esquema con el contrato real de `POST /api/events`~~ — hecho en esta
   rama tras leer `bitacora.mjs`.
4. Confirmar contra el **servicio vivo** los endpoints que §4 marca `sin confirmar`. El
   Bridge está encendido en la máquina del Capitán, pero ninguna sesión cloud lo alcanza:
   requiere una superficie local o el relé.
5. Levantar el bloque `seals` a estructura — el hueco caro. Cada sello necesita puerta
   tipada: autoridad, GO requerido, operaciones prohibidas, condición de apertura, evidencia
   y **caducidad**. Sin caducidad un sello sobrevive a su motivo, que es cómo `CLAUDE.md`
   acabó mandando cargar el hub dos meses después de dejar de ser autoridad.
6. Crear el almacén de cursores y el registro `codex-usopp`.
7. Generador de la cápsula sobre Bitácora + Git + `state/cierres/`.
8. Adaptar **una sola** skill —la de checkpoint/contexto— y medir tokens antes y después.
9. Sólo entonces extender la costura al resto.
