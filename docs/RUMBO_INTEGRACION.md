# RUMBO DE INTEGRACION — un solo producto, dos frentes, una entrega

**Levantado el 2026-09-05 desde sesion cloud por Nami (Claude Code), leyendo ramas y
ejecutando las suites, no resumenes de PR.**

Este fichero existe porque el diagnostico ya estaba hecho y no bastaba. La conclusion del
Capitan del 2026-09-05 fue que las piezas valiosas existen pero **la integracion entre ellas
sigue recayendo en el**: transporta contexto, reconcilia respuestas y convierte propuestas en
encargos. Un inventario mas no arregla eso. Lo que lo arregla es un rumbo con una sola entrega,
sus pruebas escritas, y un reparto explicito entre lo que esta en el camino critico y lo que se
conserva fuera de el.

Se actualiza cuando cambie el rumbo, no cuando cambie la opinion. Es hermano de `POSICION.md`:
aquel dice donde esta el barco, este dice hacia donde va este ciclo.

---

## 1. Lo verificado en esta sesion

Todo lo de esta seccion es **OBSERVADO** desde el contenedor cloud del 2026-09-05, salvo lo
marcado. Corrige tres puntos del diagnostico de partida.

**Supersedido en parte el 2026-09-05 por el GO al frente 1.** Los hallazgos 1.1, 1.5 y 1.6
describian el estado *antes* de aterrizar #104. No se borran —eran ciertos cuando se
levantaron, y la fusion existe porque lo eran—; se marcan en su fila. El resto sigue vigente.

| # | Hallazgo | Como se comprobo |
|---|---|---|
| 1.1 | *(superado el 2026-09-05: aterrizado, ver §4)* **`cubierta/` no esta en la rama por defecto.** El tronco (`claude/franky-feature-O1BkB`) no contiene un solo fichero de `cubierta/`. La superficie visible del barco vive unicamente en ramas sin fusionar. | `git ls-tree -r origin/claude/franky-feature-O1BkB` |
| 1.2 | **La Cubierta arranca y responde.** `node cubierta/server/server.mjs` levanta en un contenedor limpio y `GET /api/salud` devuelve el parte completo: toda la tripulacion `en_puerto`, todos los ejes `no_observable`. Sin senal, sin movimiento: la regla dura se cumple. | Arranque real + `curl 127.0.0.1:8788/api/salud` |
| 1.3 | **Las pruebas de la Cubierta pasan.** `npm run test:cubierta` sobre la rama de PR #104: **38 pasadas, 0 fallidas**. | Ejecutado |
| 1.4 | **La propia suite denuncia la fragmentacion.** El agregador cierra con `suites ejecutadas: 3 de 4` y nombra la ausente: `cubierta-ui: no existe state/cubierta_ui en este arbol — el contrato pedagogico vive en agent/cubierta-not-recorded-preview` (PR #98). El producto esta partido en ramas y su propio test lo dice. | Salida del agregador |
| 1.5 | *(resuelto el 2026-09-05 al fusionar #104)* **PR #104 contiene estrictamente a PR #101.** `#101` es ancestro de `#104`: fusionar #104 aterriza las dos. #101 es ademas el unico PR **no draft** de los 23 abiertos, es decir, el unico marcado como listo es tambien el redundante. | `git merge-base --is-ancestor` |
| 1.6 | *(resuelto el 2026-09-05: la fusion se probo sobre el resultado real, no sobre la rama)* **Las dos ramas de Cubierta van 24 commits por detras del tronco.** Todos partes nocturnos. Cualquier fusion pasa antes por traer la base. | `git rev-list --count` |
| 1.7 | **23 PR abiertos en ThousandSunny (22 en draft) y 2 en PuenteDeMando (ambos draft).** El mas antiguo lleva abierto desde el 2026-07-22. | Listado de PR abiertos |
| 1.8 | **La rectificacion de PR #88 ya esta en el tronco.** El §5 de `POSICION.md` en la rama por defecto ya dice lo que ese PR proponia. El PR sigue abierto sin aportar nada. | `git show ...:POSICION.md` |

### Correccion de puerto — importa para el siguiente paso

La sonda que dio el dato decisivo del diagnostico —**ninguno de `8765`, `8767`, `8768` escucha**—
**no prueba nada sobre la Cubierta**. La Cubierta del repo escucha por defecto en **`8788`**
(`CUBIERTA_PUERTO`, `cubierta/server/server.mjs:30`). `8765` es la Bitacora de Hipatia, autoridad
operativa desde el 2026-07-24; que este callada es un dato real y pertenece al frente de
Continuidad, pero es otro dato.

Conclusion practica: **la disponibilidad de la Cubierta nunca se ha medido**. La pantalla
conservada de Rumbo no la demostraba, y la sonda tampoco la desmiente.

### Limite epistemico

`cubierta-world` (commit `fb82863`, con el bucle de Nami, sin remoto configurado) **no es
verificable desde aqui**: no esta en git ni alcanzable desde el contenedor. Todo lo que se diga
de el es **INFERIDO** del relato del Capitan. Su falta de remoto es, por si sola, el primer
riesgo de continuidad del ciclo: trabajo que solo existe en un disco.

---

## 2. La decision

**Un solo producto, con componentes separados.** Varias tareas pueden trabajar sobre el; ninguna
se convierte en un proyecto conceptualmente independiente con su propio hilo gigante.

De aqui salen tres consecuencias que este rumbo fija:

1. **La medida del avance es cuanto puede hacer el Capitan desde la Cubierta sin la conversacion**,
   no cuantos informes se cierran.
2. **Claude es revisor de entregas concretas**, no vigilante permanente de todos los frentes.
3. **Drive, Vegapunk y Utopia quedan conservados, fuera del camino critico**, salvo dependencia
   demostrada — demostrada, no supuesta.

---

## 3. La entrega del ciclo

> **Abrir la Cubierta despues de reiniciar, retomar una mision y completar una accion local util
> desde Nami, viendo su resultado y su evidencia, sin copiar mensajes entre Claude y Codex.**

Una sola. Escrita como prueba de aceptacion, para que se sepa si se ha cumplido sin pedir opinion:

| # | Paso | Se cumple cuando |
|---|---|---|
| A1 | Arranque | Tras reiniciar la maquina, un solo comando documentado deja la Cubierta respondiendo en su puerto declarado. Sin buscar cual era el puerto. |
| A2 | Estado recuperable | La Cubierta muestra la mision que estaba abierta antes del reinicio, y lo que muestra coincide con el estado en disco. |
| A3 | Disponibilidad honesta | Con Hipatia caida, la Cubierta lo dice y **sigue navegable**: los borradores locales y el movimiento no dependen de ella. Con Hipatia viva, lo indica sin que haya que comprobarlo por fuera. |
| A4 | Accion util | Desde Nami, en la interfaz, se completa una accion local y se ve **su resultado y su evidencia** en la misma pantalla. |
| A5 | Sin transporte humano | El recorrido A1-A4 se completa sin copiar un solo mensaje entre Claude y Codex. |
| A6 | Preservacion | Nada de A1-A4 se pierde al cerrar y volver a abrir. |

**Fuera de la entrega, explicitamente:** DeepSeek aporta dialogo cuando este autorizado;
movimiento, botones y persistencia no gastan tokens. Las acciones operacionales conservan su
autorizacion especifica: esta entrega no relaja ningun GO.

---

## 4. Los dos frentes

### Frente 1 — Continuidad

Arranque inequivoco de la referencia, estado recuperable y preservacion de los cambios.

| Orden | Accion | Prueba |
|---|---|---|
| 1.a | **Dar remoto a `cubierta-world`** o declararlo formalmente derivado de `cubierta/`. Hoy es trabajo que solo existe en un disco. | El commit `fb82863` es alcanzable desde fuera de la maquina del Capitan, o consta por escrito que se descarta. |
| 1.b | ~~**Aterrizar PR #104** en el tronco~~ — **HECHO el 2026-09-05** con GO del Capitan. | **Cumplida.** Ver el acta abajo. |
| 1.c | ~~**Cerrar la cuarta suite**~~ — **HECHO el 2026-09-05** con GO del Capitan. | **Cumplida:** el agregador dice `4 de 4` y no declara ninguna ausencia. Ver el acta abajo. |
| 1.d | ~~**Fijar el arranque en un sitio**~~ — **HECHO el 2026-09-05** con GO del Capitan. | **Cumplida:** un tercero la levanto desde un arbol limpio leyendo solo el repo. Ver el acta abajo. |
| 1.e | ~~**Senal de Hipatia sin acoplamiento**~~ — **HECHO el 2026-09-05** con GO del Capitan. | **Cumplida:** A3 verificada en vivo y fijada con pruebas. Ver el acta abajo. |

#### Acta de 1.b — la fusion del 2026-09-05

**Lo que no estaba previsto:** #104 no apuntaba al tronco. Su base era la rama de #101 — estaban
**apilados**, no en paralelo. Fusionar #104 tal cual lo habria metido en #101, no en el tronco.
Se reapunto la base de #104 a `claude/franky-feature-O1BkB` para que una sola fusion aterrizara
las dos, que es lo que 1.5 predecia y lo que el diff confirmo: **29 ficheros**, los 24 de #101
mas los 5 del nucleo epistemico.

**Como se verifico, y por que asi:** las pruebas se corrieron sobre el **resultado real de la
fusion**, construido en un arbol aparte, no sobre la rama de #104 aislada. Iba 24 commits por
detras (1.6): verde en la rama no dice nada sobre verde en el tronco.

| Comprobacion | Resultado |
|---|---|
| `git merge-tree` tronco + #104 | limpio, sin conflictos |
| `npm test` completo sobre la fusion | exit 0 |
| `npm run test:cubierta` sobre el tronco ya fusionado (`a78cfa4`) | 38 pasadas, 0 fallidas |
| Suite de la Funcion de Sueno | 81 pruebas, OK |
| `cubierta/`, `shared/` y `scripts/test-cubierta.mjs` en la rama por defecto | presentes |
| PR #101 | cerrado solo: su head es ahora ancestro del tronco |

**Commit de fusion:** `a78cfa4`.

**Lo que la fusion NO arregla:** el agregador sigue diciendo `suites ejecutadas: 3 de 4` y
nombrando la ausente. Eso es 1.c — cerrado poco despues, en el acta siguiente.

#### Acta de 1.c — la cuarta suite, el mismo dia

**El apilamiento se repite.** #98 estaba montado sobre #96, igual que #104 sobre #101. Otra vez
una sola fusion aterriza las dos, tras reapuntar la base al tronco. **Deja de ser casualidad: es
como trabaja esta flota**, y conviene comprobar la base de un PR antes de suponer que apunta al
tronco. Lo que el reparto del §5 llamaba «verificar solape entre #96 y #98» no era solape: era
una pila.

**El conflicto era el nudo, no un estorbo.** Un unico fichero en conflicto, `package.json`, y
justo en `test:cubierta`: la rama de #98 lo apuntaba a las suites de `state/cubierta_ui`, el
tronco al agregador. **Ese choque era el problema que 1.c existe para resolver**, escrito en el
unico sitio donde se veia.

Resuelto a favor del agregador. No es preferencia: `scripts/test-cubierta.mjs` ya tenia definida
la suite `cubierta-ui` contra los tres mismos globs, y solo esperaba a que el directorio
existiera. Quedarse con la definicion de #98 habria dejado las suites del barco isometrico sin
correr **con `npm test` en verde** — la regresion silenciosa que el propio agregador dice en su
cabecera que existe para impedir. Se conserva `preview:cubierta`, que solo vivia en #98.

| Comprobacion | Resultado |
|---|---|
| Conflictos al fusionar el tronco en la rama | 1, `package.json`, resuelto |
| Agregador sobre el tronco fusionado (`9c33576`) | **`suites ejecutadas: 4 de 4`**, ninguna ausencia |
| Reparto de las cuatro suites | epistemico 13 · barco 24 · pulso 38 · **cubierta-ui 58** |
| `npm test` completo sobre el tronco | exit 0, mas las 81 de la Funcion de Sueno |
| PR #96 | cerrado solo, su head es ancestro del tronco |

**Commit de fusion:** `9c33576`.

**Como se resolvio el conflicto, y donde consta:** el merge del tronco se empujo a la rama de
#98 como **commit de fusion**, sin rebase ni force-push, de modo que el checkout de su autor
sigue siendo valido y la resolucion queda a la vista en su propio PR.

**Lo que sigue sin estar verde, y no lo tapa esta fusion:** el propio #98 declaraba un limite
vivo —la vista previa esta construida pero nadie leyo el endpoint en marcha, por falta de un
`initData` efimero—. Ese limite entra en el tronco tal cual: **construido, no observado**. No
cuenta como A4.

#### Acta de 1.d y 1.e — el arranque y la senal

**1.e estaba medio hecho, y esa mitad no era la peligrosa.** `leerBitacora` ya
degradaba a `sin_senal` con motivo, y el HUD ya pintaba las fuentes con su estado: la Cubierta
**si** declaraba. Lo que faltaba era lo que se rompe sin que nadie lo note.

Lo que se encontro y se arreglo:

- **Acoplamiento latente en el arranque.** El sondeo inicial era un `await sondear()` sin guarda.
  Hoy ningun adaptador lanza —los cuatro capturan—, asi que no fallaba; pero el dia que uno lo
  hiciera, **la Cubierta no abriria por tener una fuente caida**, que es exactamente lo que A3
  prohibe. Ahora el sondeo inicial que falle se declara por `stderr` y el barco abre igual.
- **La mitad que faltaba, fijada con pruebas.** Dos casos nuevos en
  `cubierta/test/test_cubierta.mjs` (de 24 a 26): una bitacora inalcanzable sale `sin_senal` con
  el motivo nombrando la URL y `datos: null` —nunca `ok`, nunca un contador inventado—, y una
  bitacora caida no se lleva por delante a las otras tres fuentes.

**1.d era un defecto real, no un hueco de documentacion.** Con el puerto ocupado, la Cubierta
moria con `Unhandled 'error' event` y una traza cruda de Node. Es el segundo arranque de
cualquiera. Ahora dice que puerto esta ocupado, si es que ya la tenias abierta, y **nombra la
variable** con la que se cambia; sale con codigo 1, sin traza.

Ademas, el arranque se escribio donde se lee **antes** de sondar: `README.md` en la raiz y una
seccion propia en `CLAUDE.md`, que es lo que carga toda sesion. Las dos dicen lo mismo y las dos
dicen lo que costo el ciclo: **`8765` no es la Cubierta**.

| Comprobacion | Resultado |
|---|---|
| Arranque limpio en puerto libre | `Cubierta escuchando en http://127.0.0.1:8802` |
| Puerto ocupado | mensaje que nombra `CUBIERTA_PUERTO`, exit 1, **sin traza** |
| Con Hipatia caida: abre y declara | `bitacora -> sin_senal \| bitacora no alcanzable en http://127.0.0.1:8765` |
| Prueba del tercero (arbol limpio, solo el repo, `npm run cubierta`) | responde en 8788, `/api/salud` sirve la tripulacion |
| `npm test` completo | exit 0 — 26 + 38 + 13 + 58, `4 de 4`, y 81 de Sueno |

**Lo que sigue sin estar verde:** A3 se ha verificado con Hipatia **caida**, que es el caso que
importa para el desacoplamiento. La otra mitad —«con Hipatia viva, lo indica sin comprobarlo por
fuera»— **no se ha observado**: desde una sesion cloud no hay un `8765` vivo al que llamar. Queda
**construido y no observado**, como la vista previa de #98.

### Frente 2 — Uso

Terminar un recorrido completo en la interfaz que ya existe. No una interfaz nueva.

| Orden | Accion | Prueba |
|---|---|---|
| 2.a | ~~Retomar una mision abierta desde la Cubierta.~~ — **HECHO el 2026-09-06** con GO del Capitan. | **A2 cumplida.** Ver el acta abajo. |
| 2.b | Completar una accion local desde Nami y renderizar resultado + evidencia. | A4. |
| 2.c | Persistencia del recorrido entre sesiones. | A6. Los recados ya persisten (2.a); faltan los **artefactos**, que son la evidencia del trabajo cerrado. |

#### Acta de 2.a — lo abierto sobrevive al reinicio

**El hueco era literal:** `this.recados = []`. La Cubierta persistia `senales.jsonl` y
`veredictos.jsonl`, pero los recados vivian **solo en memoria**. Cualquier reinicio se llevaba por
delante todo el trabajo abierto: al volver, el barco no sabia que estaba haciendo. No habia nada
que «retomar».

Ahora hay `cubierta/state/recados.jsonl`, JSONL append-only como el resto del circuito soberano:
una instantanea del recado cada vez que cambia su **estado logico** —su estado o el paso en que
va—, nunca en cada tick. Al arrancar se reproduce (ultima entrada por id gana) y se compacta.

**La regla que salio de aqui, y que vale para todo lo que venga:**

> **Se persiste el estado; nunca la coreografia.**

Las posiciones, el rumbo y la ruta **no** se guardan: se vuelven a derivar. Y no es preferencia
estetica. `avanzar()` con la ruta vacia devuelve `true` al instante, asi que un paso restaurado
como `en_ruta` **habria "llegado" sin haber andado**, y uno `en_sitio` habria terminado su trabajo
sin estar alli. Restaurar la coreografia era, literalmente, programar la mentira que este mundo
existe para no contar. Por eso ambos vuelven a `pendiente` y el viaje se replanifica de verdad.

`esperando_llave` **si** sobrevive: una decision pendiente del Capitan es un hecho durable, no
coreografia, y perderla seria peor que restaurarla.

**Verificado ejecutando dos escenarios, no uno:**

| Escenario | Resultado |
|---|---|
| Reinicio **con el actor aun emitiendo senal** | el recado vuelve y **se reanuda hasta completarse** |
| Reinicio **sin ningun actor** | vuelve visible y **quieto**: `pendiente_encarnacion`, *«robin no tiene actor encarnandolo: el recado espera, y el personaje no se mueve»* |
| El paso que quedo `en_ruta` en disco | vuelve como `pendiente`: el viaje no se da por hecho |
| Lo que muestra la Cubierta contra el log en disco | **COINCIDE** en nakama, objetivo, estado, indice y pasos |
| Suite | 32 pasadas (26 antes) — 6 casos nuevos de rehidratacion |
| `npm test` completo | exit 0, `4 de 4` |

El segundo escenario es el que prueba A2 de verdad: sin actor no hay blanco movil, y lo que se ve
es exactamente lo que hay en disco.

**Lo que NO entra en 2.a, y hace falta decirlo:** los **artefactos** —el registro de lo ya
cerrado, que es la evidencia— siguen viviendo solo en memoria. Un recado cerrado vuelve del log,
pero el artefacto que dejo no. Eso es 2.c (A6), no esto, y se anota alli para que no se pierda de
vista.

**Limite heredado:** el hub tiene su propio `state/misiones/` fuera de este repo. Esta acta habla
de la unidad de trabajo **de la Cubierta** —el recado—, que es la unica observable desde una
sesion cloud y la unica que la prueba de A2 puede medir. Coser recado y mision del hub es trabajo
aparte, y no esta hecho.

---

## 5. Reparto de los frentes abiertos

23 PR en ThousandSunny, 2 en PuenteDeMando. El reparto no es una opinion sobre su calidad: es
donde caen respecto de **la entrega del §3**.

### En el camino critico

| PR | Que aporta | Nota |
|---|---|---|
| #114 | `POSICION.md`: los tres arboles del World y §1 al dia | El mas barato: un fichero, 4 commits por detras. Es el ancla que toda sesion lee al arrancar. |

### Aterrizados

| PR | Estado |
|---|---|
| #104 | **Fusionado el 2026-09-05** en `a78cfa4`. Trajo `cubierta/` entera y el nucleo epistemico. |
| #101 | **Cerrado solo** al fusionar #104: su head quedo como ancestro del tronco. |
| #98 | **Fusionado el 2026-09-05** en `9c33576`. Trajo `state/cubierta_ui` y cerro el `3 de 4`. |
| #96 | **Cerrado solo** al fusionar #98: no habia solape con el, habia una pila. |

### Cerrar por haber aterrizado o por redundancia

| PR | Motivo |
|---|---|
| #88 | Su rectificacion del §5 ya esta en el tronco (1.8). |

### Conservados fuera del camino critico

- **Corpus y migracion:** #106 (censo Drive → Vault).
- **Vegapunk:** #112, #113, y #11 de PuenteDeMando. Contratos de custodia y evidencias; su
  frontera esta declarada, no implementada, y GO-1 no esta pedido.
- **Protocolo y gobierno:** #111, #109, #82, y #10 de PuenteDeMando.
- **Continuidad de contexto:** #90 y #91 (`context-capsule.v1`). Candidatos a entrar en el camino
  si A5 —completar el recorrido sin transporte humano— resulta bloqueado por falta de contrato de
  contexto. Hasta entonces, conservados.
- **Funcion de Sueno:** #115, y los partes agenticos #103, #105, #107, #108, #110. El parte
  **determinista** de esas mismas noches ya esta en el tronco; el agentico anade `SLEEP_<fecha>.md`
  y toca `sleep_ledger.jsonl` y `sleep_state.json`, que llevan 18 dias de avance. Se deciden **por
  lote**, no uno a uno, y no en este ciclo.
- **Partes nocturnos antiguos:** #92, #97, #89.

**PuenteDeMando no recibe cambios en este ciclo.** Es adaptador: publica hacia fuera y no gobierna
protocolo. Nada de la entrega del §3 pasa por GAS. Se dice aqui para que no haga falta preguntarlo.

---

## 6. Como se trabaja a partir de aqui

El cambio de forma de trabajo es parte del rumbo, no un anexo. **Un encargo con resultado, limites
y pruebas permite completar sus pasos tecnicos sin pedir otro GO por cada detalle.** Se vuelve al
Capitan cuando cambia el riesgo o hace falta una decision real.

Plantilla de encargo, la misma que ya usa el despacho en sus PR:

```markdown
> **Objetivo** — el resultado observable, en una frase.
> **Alcance** — que ficheros y que componente.
> **Acciones autorizadas** — lo que se puede hacer sin volver a preguntar.
> **Limites** — lo que no se toca aunque sea la accion adyacente y obvia.
> **Verificacion** — la prueba que decide si esta hecho.
> **Entrega** — donde aterriza.
```

Tres reglas que este rumbo fija sobre el reparto:

1. **Una tarea nueva y breve por entrega**, con esta como antecedente. No varias conversaciones
   gigantes en paralelo.
2. **Los seguimientos "sin cambios" no son entregas.** Conservan vigilancia; no producen capacidad.
   Si un frente solo genera seguimientos, se conserva fuera del camino critico.
3. **Silencio honesto sobre ruido falso** (ley de la casa). Un frente que no puede observarse se
   clasifica y se calla; no emite alertas vacias.

---

## 7. Lo que este fichero no hace

- **No fusiona nada.** No toca ninguna rama ajena ni cierra ningun PR. Las acciones del §4 y §5
  requieren GO del Capitan, y varias caen sobre ramas de otros actores.
- **No autoriza GO-1 de Vegapunk**, ni relaja ninguna autorizacion operacional existente.
- **No escribe en `POSICION.md`.** Esta sesion es cloud; el ancla de posicion se levanta en la
  maquina del Capitan.
- **No mide `cubierta-world`.** No es alcanzable desde aqui (limite epistemico del §1).
- **No sustituye a la Bitacora.** La Bitacora de Hipatia sigue siendo la autoridad operativa; esto
  es el rumbo con el que se decide, no el registro de lo ocurrido.
