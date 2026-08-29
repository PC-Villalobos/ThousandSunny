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

### Identidad contractual — `draft-r4`

`capsule_version: context-capsule.v1` identifica la familia, no la revisión exacta. Desde
`draft-r4`, toda instancia declara también:

```json
{
  "contract": {
    "name": "context-capsule.v1",
    "revision": "draft-r4",
    "schema_tag": "context-capsule-v1-draft-r4",
    "schema_commit": "<commit de la revisión r4>",
    "schema_blob": "<OID Git del blob del esquema>"
  }
}
```

`schema_commit` y `schema_blob` son valores del **generador**, no constantes autorreferentes
del esquema. Ambos se validan como cuarenta hexadecimales. Intentar fijar en el propio
esquema el blob de ese mismo archivo no tiene punto fijo: escribir el valor cambiaría el
blob que pretende identificar.

`schema_blob` significa el OID que devuelve Git para
`state/contexto/context-capsule.v1.schema.json`; nunca un SHA-256 de los bytes del árbol de
trabajo. Así la identidad no cambia entre LF y CRLF. La comprobación completa es:

1. `schema_tag` se resuelve a `schema_commit`;
2. `schema_commit:ruta_del_schema` se resuelve a `schema_blob`;
3. el validador usa contenido con ese mismo blob.

La etiqueta fija procedencia, no aprobación. `context-capsule-v1-draft-r4` sigue siendo
draft y no implica merge del PR. Las etiquetas `context-capsule-v1-*` se protegen contra
actualización y borrado; crear una nueva revisión requiere una etiqueta nueva.

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

El contrato tiene **tres capas** y confundirlas es el error que esta sección ha cometido dos
veces. Verificado por Codex contra `make_event` en `_bitacora/scripts/bitacora_server.py`
(líneas 150-205), leyendo el servidor vivo desde la máquina del Capitán.

**Capa 1 — `required_input`: siete campos.** Sin ellos el `POST` no se acepta.

`actor`, `role`, `topic`, `title`, `message`, `event_kind`, `epistemic_status`

**Capa 2 — `closed_enums`: cinco vocabularios.** Un valor fuera de ellos manda el evento a
Cuarentena. Dos de los cinco son además obligatorios; los otros tres tienen valor por defecto,
así que están validados pero no exigidos.

| Campo | Valores | ¿Obligatorio? |
|---|---|---|
| `event_kind` | `observation` `decision` `action` `result` `learning` `transition` `projection` | sí |
| `epistemic_status` | `observed` `calculated` `inferred` `evaluated` `proposed` `unknown` | sí |
| `sensitivity` | `public_safe` `internal` | no — por defecto `internal` |
| `status` | `observed` `decided` `executed` `verified` `blocked` `superseded` | no — por defecto `observed` |
| `source` | `captain` `codex` `claude` `github` `obsidian` `local_runtime` `other` | no — por defecto `local_runtime` |

**Capa 3 — `stored_event`.** El evento materializado en el log lleva más campos que los que
el cliente envía: el servidor los genera, los normaliza o los deja vacíos. `change`, `after`,
`next_safe_action`, `evidence[]`, `scope`, `relations`, `project` y `phase` viajan como carga
opcional — el constructor de sueño los emite, el contrato no los exige. **Que un campo
aparezca en el evento almacenado no lo convierte en obligatorio para quien escribe.**

**`bitacora.mjs` no valida nada de esto.** `appendEvent` hace `POST` del payload en crudo; las
constantes `ALLOWED_*` se exportan pero no se aplican en cliente. Su cabecera es
documentación, no cumplimiento. Por eso leerla como si fuera el contrato induce exactamente
la confusión de capas que describe esta sección: la única autoridad sobre qué es obligatorio
es el servidor.

`epistemic_status` es el campo decisivo para lo que persigue este contrato. Es donde un
evento declara si lo que afirma fue observado, calculado, inferido o sólo propuesto. Sin él,
un informe heredado se canoniza como hecho comprobado a la primera relectura.

**Rediseñar esto crearía un tercer protocolo compitiendo con `CLAUDE.md` y `POSICION.md`.** No
se hace. La cápsula **lee** el contrato; no lo sustituye. Lo que falta no es el esquema: es
el binding. Nadie hace `GET` de vuelta.

### Rectificación — esta sección se equivocó dos veces, y de la misma manera

**Primer error (`672ee23`).** Afirmaba que el contrato obligaba a `before`, `change`, `after`,
`meaning`, `next_safe_action`, `evidence[]`, `source`, `sensitivity` y `thread_id`. Casi
ninguno lo es; `before`, `meaning` y `thread_id` no aparecen siquiera en el constructor.
Procedencia: lectura de sesión anterior contra el fuente en la máquina del Capitán, dada por
buena sin poder reverificarla.

**Segundo error (`bcf9336`).** La corrección declaró **diez** campos obligatorios y, peor,
señaló a `POSICION.md` como discrepante por decir «siete obligatorios y cinco enums
cerrados». `POSICION.md` tenía razón. Los tres enums restantes tienen valor por defecto: son
vocabulario validado, no requisito de entrada. Procedencia: se leyó la **cabecera de comentario**
de `bitacora.mjs` —que lista los siete requisitos y los cinco enums bajo un solo epígrafe, y
que además escribe «(por defecto internal)» junto a `sensitivity`— y se tomó la lista entera
por obligatoria. El dato que la desmentía estaba dentro del texto que se estaba citando.

El patrón es el mismo las dos veces: **confundir el evento materializado con el payload
mínimo**, y tomar por contrato una fuente que sólo lo describe. La primera vez fue un esquema
recordado; la segunda, un comentario de código. Ninguna de las dos era el servidor. Por eso
§3 se organiza ahora en tres capas explícitas: mientras la distinción no esté escrita, se
vuelve a colapsar.

Corrección detectada por Codex leyendo `make_event` en el servidor vivo, y registrada como
bloqueo de revisión en `BIT-20260726T163616Z-0f25a1678130` antes de cualquier merge. Ninguno
de los dos errores se borra: el modo de fallo importa más que la corrección, y aquí el modo de
fallo se repitió después de haberlo diagnosticado.

Confirmación colateral: el 2026-07-26 una aportación de esta cápsula viajó a la Bitácora por
relé con `status: "reported"` y `sensitivity: "public"`. Codex los normalizó a `observed` e
`internal` antes de publicar. Ninguno estaba en el enum; sin esa normalización el evento
habría ido a Cuarentena.

---

## 4. Mapeo campo a campo

`repo` = sale de un archivo de este repositorio; comprobable sin red.
`vivo` = el endpoint respondió `200` contra el servicio, verificado desde superficie local.
`vivo (repo)` = además está atestiguado por código de este repo, así que una sesión cloud
puede comprobarlo sin red.
`hueco` = no existe almacén ni consulta que lo dé.

| Bloque de la cápsula | Fuente | Cómo se obtiene | Estado |
|---|---|---|---|
| `contract` | etiqueta + commit + blob Git | `git rev-parse` sobre la referencia y la ruta | repo |
| `position` | `POSICION.md` §1 | Lectura del repo | repo |
| `git` | git local, o evidencia git de Hipatia | `git` directo; o `/api/git/repositories/…/status`, vivo | repo |
| `bitacora.last_event_id` / `event_count` / `chain_verified` | Bitácora | `GET /api/events` | vivo |
| `bitacora.events_since_cursor` | Bitácora | Sin filtro `since` conocido — se recorta en cliente | vivo, hueco menor |
| `closures.formal_count` / `last_closure_hash` | `closure_records.jsonl` | `GET /api/closure/dashboard` | vivo |
| `closures.unabsorbed` | `state/cierres/` vs. cadena formal | Diff de nombres | repo (parcial) |
| `work.active_missions` | Bitácora | `GET /api/missions` | vivo |
| `work.open_blockers` | último cierre + `POSICION.md` §6 | Lectura del repo | repo |
| `work.recent_decisions` | eventos, campos `title` / `message` | `GET /api/events` | vivo |
| `work.next_safe_action` | eventos, campo `next_safe_action` | Último evento | vivo, y **hoy nadie lo lee** |
| `sleep` | `state/funcion_de_sueno/sleep_ledger.jsonl` | Última línea del ledger | repo |
| `seals` | prosa de `POSICION.md`, `CLAUDE.md`, guardas de la Función de Sueño | Ninguno. Los sellos viven en prosa | **hueco caro** |
| `training_signals` | relaciones `continues` / `supersedes` + timestamps | Derivación recomputable de eventos | diseño tipado, sin generador |
| `cursor` | — | No existe almacén de cursores | **hueco** |
| `recommended_reads` | derivado | Se calcula de los huecos y bloqueos | repo |
| `authority.health` | sondeo | `GET /api/health` más alcanzabilidad de cada almacén | vivo (repo) |

**Los cuatro endpoints responden `200` contra el servicio vivo.** Verificado por Codex el
2026-07-26 desde la máquina del Capitán —`/api/health`, `/api/events`,
`/api/closure/dashboard`, `/api/git/repositories/thousandsunny/status`— más `POST /api/events`
con `write_verified=true`. Registrado en `BIT-20260726T163512Z-02abb38a5efd`.

Lo que la nube puede comprobar por sí sola sigue siendo distinto: sólo `GET /api/health` y
`POST /api/events` están atestiguados por código de este repo. Los otros dos son verificación
de superficie local, no del repositorio. La distinción importa porque una sesión cloud no
puede reproducirla.

Rectificación: `672ee23` afirmaba que «diez de trece bloques salen de endpoints que ya
funcionan» cuando ninguno estaba confirmado; `bcf9336` los degradó todos a «sin confirmar»
cuando cinco bloques no necesitan endpoint alguno. Ambos extremos eran imprecisos. El reparto
real: cinco bloques (`position`, `work.open_blockers`, `sleep`, `recommended_reads` y parte de
`closures`) salen del repo y no tocan la red — ésa es la parte barata y siempre disponible;
el resto depende de la Bitácora y hoy responde.

### Los tres huecos, por orden de coste

1. **Los sellos viven en prosa.** Es el caro, y no por tokens: su fallo rompe el sello de
   Metatrón o una guarda clínica. Un agente que lee `POSICION.md` en diagonal puede concluir
   que N1–N5 "hay que crearlos" cuando lo que hay que hacer es rellenarlos con GO C0. El
   bloque `seals` los vuelve estructura con puerta declarada.
2. **No hay almacén de cursores.** Sin él la cápsula es una foto, no un diff, y `codex-usopp`
   sigue preguntando "¿qué ocurrió estos días?".
3. **`GET /api/events` no filtra por `since`.** Menor: se recorta en cliente. Importa a los
   cientos de eventos, no ahora.

El hueco que había en cuarto lugar —endpoints sin confirmar contra el servicio vivo— se cerró
el 2026-07-26. Queda una asimetría estructural, no un hueco: **el Bridge sólo es alcanzable
desde superficie local.** Ninguna sesión cloud puede verificar ni escribir; depende de relé.
Cualquier consumidor de esta cápsula que corra en la nube hereda esa limitación.

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

### Señal de entrenamiento: observación antes que veredicto

Una recurrencia posterior a una corrección no prueba que un actor «no aprendió». Sí permite
medir que el mismo modo de fallo reapareció dentro de una ventana, después de que el
correctivo estuviera disponible. `training_signals` separa ambos niveles:

```json
{
  "signal_id": "contract-layer-relapse-20260726",
  "observations": {
    "recurrence_after_correction": true,
    "correction_to_relapse_seconds": 14400,
    "correction_available_to_actor": true,
    "correction_inside_cited_artifact": true,
    "same_failure_mode": true,
    "epistemic_status": "observed",
    "evidence": [
      "bitacora:BIT-20260726T163512Z-02abb38a5efd",
      "bitacora:BIT-20260726T163616Z-0f25a1678130"
    ]
  },
  "assessment": {
    "claim": "El correctivo no impidió una recurrencia observable en esa ventana",
    "epistemic_status": "inferred",
    "status": "proposed",
    "causes": "unknown"
  }
}
```

Las observaciones deben poder recomputarse desde el registro. La evaluación permanece
`inferred` y `proposed`; las causas internas del actor quedan `unknown`.

---

## 7. Alcance descartado a propósito

- **Seis niveles de memoria L0–L5.** El sustrato real tiene tres almacenes físicos, no seis.
  Seis es taxonomía que nadie mantiene. La cápsula los colapsa en bloques con presupuesto.
- **Rediseñar el checkpoint.** Ya existe: siete campos de entrada obligatorios y cinco enums
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
4. ~~Confirmar los endpoints contra el servicio vivo~~ — hecho por Codex el 2026-07-26 desde
   superficie local: los cuatro responden `200`, más `POST /api/events` con
   `write_verified=true` (`BIT-20260726T163512Z-02abb38a5efd`).
5. Levantar el bloque `seals` a estructura — el hueco caro. Cada sello necesita puerta
   tipada: autoridad, GO requerido, operaciones prohibidas, condición de apertura, evidencia
   y **caducidad**. Sin caducidad un sello sobrevive a su motivo, que es cómo `CLAUDE.md`
   acabó mandando cargar el hub dos meses después de dejar de ser autoridad.
6. Crear el almacén de cursores y el registro `codex-usopp`.
7. Generador de la cápsula sobre Bitácora + Git + `state/cierres/`.
8. Adaptar **una sola** skill —la de checkpoint/contexto— y medir tokens antes y después.
9. Sólo entonces extender la costura al resto.
