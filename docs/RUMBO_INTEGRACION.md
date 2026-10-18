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

### Estado de la entrega, al 2026-10-16

**La entrega esta en el tronco.** PR #116 fusionado el 2026-10-16 en `b9d9f6b`, con GO del
Capitan. Hasta ese momento A1-A6 vivian en una rama y el tronco mostraba la Cubierta sin
2.a, 2.b ni 2.c: cualquier actor que lo mirase diagnosticaba —con razon— un prototipo. Esa
contradiccion se cerro. Verificado sobre el tronco, no sobre la rama: `npm test` en exit 0,
agregador `4 de 4` «sin huerfanas», funcion de sueno `2 de 2`.

| # | Estado | Sostenido por |
|---|---|---|
| A1 | **Cumplida** | 1.d. Prueba del tercero: arbol limpio, solo el repo, `npm run cubierta` responde en 8788 |
| A2 | **Cumplida** | 2.a. Reinicio con y sin actor; lo mostrado coincide con el disco |
| A3 | **Cumplida y observada** | 1.e para la mitad caida. La mitad **viva**, el 2026-10-16: se levanto el runtime real de Hipatia en el contenedor y se vio en navegador. Aparecio rota y se arreglo. Ver el acta abajo |
| A4 | **Cumplida y observada** | 2.b. Navegador real contra el `#artefactos` renderizado, en los dos casos del umbral |
| A5 | **Del Capitan** | El recorrido A1-A4 se completo aqui por HTTP sin transporte humano, pero A5 se mide en **su** uso, no en el mio |
| A6 | **Cumplida y observada** | 2.c. Recorrido completo, cerrar y reabrir: nada se perdio, y se ve |

**Fuera de la entrega, explicitamente:** DeepSeek aporta dialogo cuando este autorizado;
movimiento, botones y persistencia no gastan tokens. Las acciones operacionales conservan su
autorizacion especifica: esta entrega no relaja ningun GO.

---

## 4. Los dos frentes

### Frente 1 — Continuidad

Arranque inequivoco de la referencia, estado recuperable y preservacion de los cambios.

| Orden | Accion | Prueba |
|---|---|---|
| 1.a | **Dar remoto a `cubierta-world`** o declararlo formalmente derivado de `cubierta/`. Hoy es trabajo que solo existe en un disco. **En curso desde el 2026-10-16** con GO del Capitan: la herramienta esta en el tronco, el empuje es del Capitan. Ver el acta abajo. | El commit `fb82863` es alcanzable desde fuera de la maquina del Capitan, o consta por escrito que se descarta. **Sigue abierta:** nada de lo hecho aqui la cumple. |
| 1.b | ~~**Aterrizar PR #104** en el tronco~~ — **HECHO el 2026-09-05** con GO del Capitan. | **Cumplida.** Ver el acta abajo. |
| 1.c | ~~**Cerrar la cuarta suite**~~ — **HECHO el 2026-09-05** con GO del Capitan. | **Cumplida:** el agregador dice `4 de 4` y no declara ninguna ausencia. Ver el acta abajo. |
| 1.d | ~~**Fijar el arranque en un sitio**~~ — **HECHO el 2026-09-05** con GO del Capitan. | **Cumplida:** un tercero la levanto desde un arbol limpio leyendo solo el repo. Ver el acta abajo. |
| 1.e | ~~**Senal de Hipatia sin acoplamiento**~~ — **HECHO el 2026-09-05** con GO del Capitan. | **Cumplida** para el desacoplamiento. **Correccion del 2026-10-16:** donde esta fila decia «A3 verificada en vivo», «en vivo» era con Hipatia **caida**; la mitad viva no se habia observado nunca, y al observarse estaba rota. Ver el acta de A3 abajo. |

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
| 2.b | ~~Completar una accion local desde Nami y renderizar resultado + evidencia.~~ — **HECHO el 2026-09-06** con GO del Capitan. | **A4 cumplida, y observada en pantalla.** Ver el acta abajo. |
| 2.c | ~~Persistencia del recorrido entre sesiones.~~ — **HECHO el 2026-09-06** con GO del Capitan. | **A6 cumplida, observada en pantalla tras reabrir.** Ver el acta abajo. |

#### Acta de 2.c — nada se pierde al cerrar y volver a abrir

**Otra vez dos perdidas, no una.**

1. **Los artefactos no se persistian.** 2.a devolvia el trabajo abierto; la **evidencia del
   cerrado** —justo lo que 2.b acababa de hacer visible— seguia solo en memoria.
2. **Los veredictos del Capitan se escribian y no se releian.** `veredictos.jsonl` existia desde
   antes, pero el arranque hacia `const veredictos = []` y nunca lo miraba. Estaban en el fichero
   y desaparecian de la pantalla en cada reinicio. **Un registro que existe y no se ve es peor
   que no tenerlo**: parece que se perdio algo que en realidad esta ahi.

**Y una fuga que abri yo en 2.a.** La persistencia de recados corria **tambien en modo replay**:
un fixture se escribia en `recados.jsonl` y en el siguiente arranque era indistinguible de
trabajo real. Es exactamente la confusion entre el ensayo y el barco que toda respuesta declara
con `modo: "replay"`. Ahora el replay ni lee ni escribe el estado real, y lo dice al arrancar.

**Verificado con el recorrido entero**, no por piezas. Estado antes de cerrar: un recado abierto
esperando la llave del Capitan, dos artefactos (uno `Observado` con dos referencias, otro `No
registrado`) y un veredicto. Se mato el proceso y se volvio a abrir:

```
Recados recuperados del disco: 3
Artefactos recuperados del disco: 2
Veredictos del Capitan recuperados del disco: 1
```

| Comprobacion | Resultado |
|---|---|
| Recados abiertos, antes vs. despues | intacto |
| Artefactos, con estatuto y numero de referencias | intacto |
| Veredictos del Capitan | intacto |
| En pantalla tras reabrir (navegador real) | los dos artefactos con su evidencia, y el recado *«chopper esta en la puerta de camara_sellada esperando la llave del Capitan»* |
| Replay con 4 nakamas encarnados | el log soberano queda **byte a byte identico** |
| Suite | 41 pasadas (37 antes) |
| `npm test` completo | exit 0, `4 de 4` |

**Un aviso sobre el metodo, porque casi me lleva a mentir.** La primera prueba del replay dio
*«el replay escribio en el log»*. Era falso: habia quedado **un servidor anterior vivo**, y lo
que se anadio fue un cambio real suyo —la senal de chopper envejecio mas de 15 minutos y su
recado paso de `esperando_llave` a `pendiente_encarnacion`—. El sello estaba bien desde el
principio. Antes de declarar un fallo hay que comprobar **quien** escribio, no solo **que** algo
cambio; si no, se reporta como defecto lo que era el sistema funcionando.

#### Acta de 2.b — el resultado con su evidencia al lado

**Tres huecos, no uno.** El artefacto —lo que el nakama trae de vuelta— existia, pero:

1. **La evidencia no se podia adjuntar nunca.** `evidencia` solo se aceptaba al *abrir* el
   recado, es decir **antes de que existiera nada que evidenciar**. Todo artefacto nacia sin
   ella, siempre.
2. **El HUD la tiraba.** El artefacto llevaba `evidencia` y `recursos`; el panel pintaba solo
   titulo, nakama y hora.
3. **El estatuto hablaba un vocabulario muerto.** `tinta: medido | propuesto` — `medido` es
   justo el termino que el canon retiro por no decir quien midio, y `propuesto` convertia una
   ausencia en un juicio del agente. Mismo tipo de deuda que #104 corrigio en los ejes, viva
   todavia aqui. Y un cuarto sitio: el **prompt** de `hablar.mjs` seguia enseñandole al nakama
   ese vocabulario retirado, sin `no registrado`.

**Lo que se hizo.** La evidencia se adjunta al recado **vivo** cuando el agente vuelve con
algo, y el artefacto que sale al cerrarlo la lleva. El estatuto sale del nucleo canonico
(`shared/epistemico.mjs`), presentado en el servidor para que ningun enum crudo llegue al
lector (invariante 2). El prompt habla ya el canon.

**El umbral se respeta, y eso se ve.** Sin evidencia el artefacto dice `not_recorded` —la
ausencia, no un juicio—. Con **una** referencia **no se afirma** `observed` y **tampoco se
rebaja** a otro valor: se declara el hueco, en naranja y con su aviso. Con **dos**, `observed`.

**Verificado con un navegador de verdad**, no leyendo el codigo: Chromium por CDP contra el
`#artefactos` renderizado. Sin dependencias nuevas — el guion vivio fuera del repo.

Dos referencias:

```
fechar la ola de ingesta
nami · 12:13:32
Evidencia (2):
· fichero · olas/ola_01.md · 42 documentos fechados
· hash · biblioteca de Hipatia · sha256:9f2c...e11
OBSERVADO
```

Una sola:

```
cotejar el censo
robin · 12:15:17
Evidencia (1):
· fichero · censo.md
Lectura directa con una sola referencia de evidencia. El vocabulario exige dos para
`observed`, asi que el estatuto no se afirma en vez de rebajarse a otro valor.
SIN ESTATUTO AFIRMADO
```

| Comprobacion | Resultado |
|---|---|
| Badges en el DOM | `tinta observed => Observado` · `tinta sin_estatuto => Sin estatuto afirmado` |
| Tooltip del badge | el detalle canonico, literal |
| Suite | 37 pasadas (32 antes) — 5 casos nuevos de estatuto y evidencia |
| `npm test` completo | exit 0, `4 de 4` |

**Diferencia con lo anterior:** #98 dejo su vista previa *construida y no observada*, y 1.e dejo
la mitad de A3 igual. A4 **si** esta observada: alguien —un navegador— miro la pantalla.

**Lo que sigue sin cerrar:** los artefactos **siguen sin persistir**. Un reinicio conserva el
recado (2.a) pero se lleva la evidencia que dejo. Es 2.c (A6) y es ahora lo unico que le falta
al recorrido completo.

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

### Correccion de 1.c — las suites huerfanas (2026-10-16)

1.c cerro «la cuarta suite» y dejo el agregador diciendo `4 de 4`. Conte las cuatro que el
agregador nombra y **no comprobe si habia ficheros de prueba fuera de esa lista**. Habia 29
pruebas que nadie ejecutaba, y `npm test` estaba verde con ellas dentro:

| Donde | Pruebas | Por que no corrian |
|---|---|---|
| `state/cubierta_ui/baseline/server/` | 10 | la suite `cubierta-ui` enumeraba tres directorios y este no estaba, dentro de la superficie que ella misma reclama |
| `state/funcion_de_sueno/lib/` | 19 | `test:sueno` solo invocaba `unittest`; los `*.test.mjs` de esa misma funcion no los llamaba nadie |

Las 19 incluyen la degradacion de la Bitacora de Hipatia: 11 casos que comprueban que un sumidero
apagado no lanza y que el ciclo sigue. La prueba del desacoplamiento existia y no se ejecutaba.

**Una prueba que nadie corre no protege nada**, y el agregador se escribio precisamente para que
`npm test` no pudiera estar verde con la mitad sin ejecutar. El agujero era del mismo tipo que el
que vino a tapar, un nivel mas arriba: no vigilaba su propio perimetro.

**Lo que cambia:**

- `state/cubierta_ui/baseline/server` entra en la suite `cubierta-ui`: 58 → 68 pruebas.
- El agregador **barre las superficies que reclama** (`shared/`, `cubierta/`, `state/cubierta_ui/`)
  y, si encuentra un `*.test.mjs` o `test_*.mjs` que ninguna suite ejecuta, lo nombra y sale con
  error. Una huerfana nueva ya no puede nacer en silencio.
- `test:sueno` pasa a `scripts/test-sueno.mjs`: resuelve el interprete (`PYTHON`, `python3`,
  `python`), **descubre los ficheros por barrido en vez de por lista**, y declara la ausencia con
  su remedio. Lo que falta se dice; no se omite.

**Verificado ejecutando, incluido ver fallar a los guardias:**

| Comprobacion | Resultado |
|---|---|
| `npm test` completo | exit 0 |
| Agregador | `4 de 4`, 68 en `cubierta-ui`, «sin huerfanas» |
| Funcion de sueno | `2 de 2`: 81 de Python y 19 de Node |
| Huerfana plantada bajo una superficie reclamada | **exit 1**, nombrando el fichero |
| Prueba de Python plantada en `lib/` (donde `discover` no llega) | **exit 1**, con el remedio |
| Sin ningun Python en el PATH | exit 0, `1 de 2`, `AUSENTE python` + remedio — **ya no muere con un ENOENT opaco** |

La ultima fila es el arreglo de portabilidad: en Windows `python3` no suele estar en PATH, y
`npm test` moria por el nombre del interprete, no por el contenido de nada.

**Limites de esta correccion, declarados y no arreglados:**

- Siguen huerfanas `state/melampo_lab/melampo.test.mjs` (8 pruebas) y los 7 `test_*.py` de
  `state/hipatia_bridge_runtime/tests/`. Son otras superficies —un laboratorio y el puente de
  Hipatia—, fuera de este encargo. Quedan dichas aqui para que no se pierdan otra vez.
  **Cerradas el mismo dia, mas tarde**, con GO del Capitan a lo que quedaba del rumbo:
  `npm run test:estado`. Ver el acta del cierre del §5.
- **El fallo de Bitacora en Windows que reporto Codex no se reproduce aqui.** `bitacora.test.mjs`
  pasa 11 de 11, y su unico caso de red apunta a `127.0.0.1:9` —puerto muerto a proposito— y solo
  afirma booleanos y un `note`; el `reason`, que si depende de plataforma, no se afirma. Sin la
  ruta del fichero y el texto de la asercion, ese fallo **no es asignable** a este arbol.


### Acta de 1.a — custodia de `cubierta-world` (2026-10-16)

Con GO del Capitan. **1.a no se cierra desde cloud, y esta acta no pretende lo contrario.** Su
prueba es que `fb82863` sea alcanzable desde fuera de su maquina, y el commit no esta en git ni
en este contenedor: el empuje solo puede salir del disco donde vive. Lo que si se podia hacer
aqui es que ese empuje deje de depender de que alguien recuerde tres ordenes de git bien escritas.

**Mecanismo elegido: rama de preservacion, no repo nuevo.** `cubierta-world` tiene historia
disjunta de este repo; una rama suya en ThousandSunny lo hace alcanzable sin tocar el tronco, sin
abrir PR y sin fusionar nada. Es **custodia, no integracion**. La razon de no crear un repo
dedicado es deliberada: eso inclinaria la decision «componente o derivado», que es del Capitan y
sigue sin tomar. Esta rama no la inclina — preserva el trabajo y la deja intacta. Si manana se
decide repo propio, mover una rama preservada es trivial; recuperar un disco que fallo, no.

**Herramienta:** `scripts/preservar.mjs`. Por defecto es un **ensayo**: nombra el empuje exacto
y no empuja nada. Lo que comprueba antes de afirmar:

| Comprobacion | Por que esta |
|---|---|
| La ruta es un repo de git alcanzable | Si el trabajo nunca se commiteo, no hay nada que empujar: lo dice con su remedio |
| El SHA pedido existe en ese repo | `fb82863` esta **INFERIDO del relato**, no leido. Si no existe, se nombra en vez de fallar en el empuje |
| El arbol esta limpio | Un empuje preserva **commits**, no ficheros sin commitear. Si hay cambios sueltos, avisa y dice cuantos |
| El remoto ya lo tiene | Idempotente: si ya esta a salvo, no toca nada y lo dice |
| El commit pedido es ancestro de HEAD | Si no lo es, recibe rama propia; si no, se perderia por el camino |
| Verificacion despues del empuje | `ls-remote` contra el SHA. Un empuje sin confirmar se declara **SIN VERIFICAR**, no se canta como hecho |

No fuerza nunca. Si la rama remota existe y el empuje no es avance directo, git lo rechaza, y eso
es lo correcto: historia preservada no se sobreescribe.

**Lo que el Capitan ejecuta en su maquina**, desde su copia de ThousandSunny al dia
(`git pull`), con la ruta real del repo de `cubierta-world` (ensayo primero, que no empuja nada):

```
node scripts/preservar.mjs "C:\ruta\a\cubierta-world" --commit fb82863
node scripts/preservar.mjs "C:\ruta\a\cubierta-world" --commit fb82863 --ejecutar
```

Deja la rama `preserva/cubierta-world` en ThousandSunny. Hecho eso, 1.a se puede comprobar desde
cualquier sitio, esta sesion incluida: `git ls-remote origin refs/heads/preserva/cubierta-world`.

**El agujero que aparecio al hacerlo:** la primera version de estas pruebas quedo huerfana. El
guardia de 1.c barre `shared/`, `cubierta/` y `state/cubierta_ui/`, y `scripts/` —donde viven los
corredores mismos— estaba **fuera del perimetro**. El agregador decia `4 de 4` «sin huerfanas»
con 11 pruebas nuevas sin ejecutar. Mismo tipo de agujero que 1.c, un nivel mas arriba otra vez.
Arreglado: `scripts` entra en las superficies reclamadas y las pruebas de herramientas son la
quinta suite.

**Verificado ejecutando, incluido ver fallar al guardia:**

| Comprobacion | Resultado |
|---|---|
| `npm test` completo | exit 0 |
| Agregador | **`5 de 5`**, «sin huerfanas» |
| Funcion de sueno | `2 de 2` |
| Pruebas del preservador | 11 de 11 — 8 con git inyectado, 3 contra git real sobre repos sinteticos |
| El refspec que el script nombra | Ejecutado contra un `--bare` local: crea la rama con el SHA exacto |
| Segunda pasada sobre el mismo repo ya empujado | `ya esta a salvo`, cero empujes (idempotencia, ejecutada) |
| Huerfana plantada en `scripts/` **antes** de ampliar el perimetro | exit **0** — el agujero era real |
| La misma huerfana **despues** | **exit 1**, nombrando el fichero |

**Limites, declarados:**

- **1.a sigue abierta.** Mientras el empuje no se haga, el riesgo es identico al del 2026-09-05:
  el trabajo vive en un disco. La herramienta no preserva nada por si sola.
- **No se ha comprobado que `fb82863` exista.** Sigue siendo INFERIDO. El ensayo lo dira en su
  maquina en un segundo; si el SHA no es ese, el script lo nombra en vez de tragarselo.
- **No se decide «componente o derivado»**, ni para `cubierta-world` ni para `CubiertaLocal`. Esa
  decision es del Capitan y esta rama no la adelanta.
- **El empuje puede fallar por credenciales** en esa maquina. Si `ls-remote` no contesta, el script
  avisa y no asume que ya esta a salvo.

---


### Acta de A3 — Hipatia viva, observada por primera vez (2026-10-16)

Con GO del Capitan. A3 llevaba desde el 2026-09-05 «a medias» por una razon material y no por
falta de ganas: **no habia ningun `8765` vivo al que llamar desde cloud**. Esta sesion lo
resolvio levantando el runtime real: `state/hipatia_bridge_runtime/server/bitacora_server.py`,
copiado al scratchpad —mismos SHA-256, comprobados— para no escribir nada dentro de `state/`.
No es un doble: es el codigo de Hipatia, con su `verify_chain` rehaciendo la cadena de hashes
antes de contestar.

`GET /api/health` respondio: `{"ok": true, "version": "v1.1", "events": 0, "schemas": [], "bind": "127.0.0.1:8765"}`.

**Hallazgo 1 — Hipatia no arranca sin Obsidian.** El servidor se niega a arrancar si no existe
`D:\La maceta de Groot\...\MOC_BITACORA_HIPATIA_LOCAL_v1.md`: una ruta absoluta de Windows,
en `update_obsidian_moc`, que lanza `RuntimeError`. Hubo que crear una fixture de laboratorio
con los dos marcadores diarios para que levantara. Esto invierte la regla de la casa: la
Cubierta trata a Hipatia como **autoridad, no dependencia**, y Hipatia depende de un vault que
la propia arquitectura declara **espejo, no fuente de verdad**. ~~Queda hallado y no arreglado.~~
**Resuelto el mismo dia, mas tarde, con GO del Capitan.** Ver el acta de la frontera del vault,
abajo.

**Hallazgo 2 — la mitad viva estaba rota, y por eso A3 existia.** Con la Bitacora contestando, la
Cubierta declaraba la fuente `ok` y entregaba `eventos: null, version: null`. Causa: el cliente
`bitacora.mjs` devuelve `{ ok, reachable, httpStatus, payload }` y el adaptador leia
`salud.events ?? salud.body?.events` — los datos viajan dentro de `payload`. Seis semanas
invisible, porque la unica mitad observable era la caida. El comentario de la propia suite lo
confesaba sin saberlo: «estas dos pruebas fijan **esa mitad**».

**Hallazgo 3 — aun arreglado, no se veia.** El cliente pintaba de cada fuente solo el `id`, el
punto de color y el `motivo`. El `motivo` solo existe cuando la fuente calla, asi que con
Hipatia **viva** el Capitan veia un punto verde y nada mas: indistinguible de una autoridad que
no dice nada. A3 pide que la Cubierta lo indique **sin comprobarlo por fuera**, y no lo hacia.

**Lo que cambia:**

- `leerBitacora` lee de `payload` (conservando las dos lecturas antiguas por si otro cliente
  entrega el cuerpo plano). El `??` respeta el cero: un ledger vacio son **0 eventos**, no dato
  desconocido.
- Cada fuente gana `nota`: el gemelo de `motivo` para el caso vivo, una linea ya resumida que la
  pantalla muestra tal cual. `sinSenal` la pone en `null` para que toda fuente tenga la misma
  forma, calle o hable.
- El cliente pinta `nota` junto al `id`. Con Hipatia viva la fila dice **`bitacora v1.1 — 0 eventos`**.
- Cuatro pruebas nuevas fijan la mitad viva, con **doble propio en puerto efimero**: la suite no
  depende de que Hipatia este encendida, que es la regla que esa seccion defiende.

**Verificado ejecutando, incluido ver fallar al guardia:**

| Comprobacion | Resultado |
|---|---|
| Runtime real de Hipatia en el contenedor | arranco: `0 eventos verificados`, cadena rehecha |
| `GET /api/health` | `{ok:true, version:"v1.1", events:0, schemas:[], bind:"127.0.0.1:8765"}` |
| `/api/snapshot` **antes** del arreglo, con Hipatia viva | `estado:"ok"` con `eventos:null, version:null` — el fallo, observado |
| `/api/snapshot` **despues** | `eventos:0`, `version:"v1.1"`, `nota:"v1.1 — 0 eventos"` |
| Navegador real (Chromium), Hipatia **viva** | fila `bitacora v1.1 — 0 eventos`, punto `ok`, **cero errores de pagina** |
| Navegador real, Hipatia **detenida** y recargando | fila `bitacora no alcanzable en http://127.0.0.1:8765`, punto `sin_senal`, **el barco sigue abierto** |
| Regresion plantada a proposito (volver a leer de la raiz) | **3 pruebas en rojo**, `null !== 22` y `null !== 0` |
| `npm test` completo | exit 0 — Cubierta **45 pasadas**, agregador `5 de 5`, sueno `2 de 2` |

**Limites, declarados:**

- **El ledger de aqui tiene 0 eventos.** Es el codigo real, no los datos reales: `events/` esta
  deliberadamente fuera de la proyeccion. La ruta de codigo es la misma con 0 que con 22 —lo fija
  la prueba— pero **su instancia, con su volumen, sigue sin observarse desde aqui**.
- ~~**La fixture del MOC es de laboratorio**, vive en el scratchpad y no entra al repo. Sin ella,
  Hipatia no arranca fuera de su maquina: eso es el hallazgo 1, no un detalle de montaje.~~
  **Ya no hace falta ninguna fixture:** con la frontera del vault, Hipatia arranca sin vault. Ver
  el acta de abajo.
- **`schemas` no se muestra.** Llega en la respuesta y no se pinta. No se amplia la entrega por
  eso; queda dicho.
- **A5 sigue siendo del Capitan.** Esto se midio en mi uso, no en el suyo.

---

---

## 5. Reparto de los frentes abiertos

23 PR en ThousandSunny, 2 en PuenteDeMando. El reparto no es una opinion sobre su calidad: es
donde caen respecto de **la entrega del §3**.

### En el camino critico

**Vacio desde el 2026-10-16.** #114 era el unico y aterrizo ese dia con GO del Capitan.

| PR | Que aporta | Nota |
|---|---|---|
| ~~#114~~ | `POSICION.md`: los tres arboles del World y §1 al dia | **Fusionado el 2026-10-16** en `29bc4c2`. Ver abajo. |

### Aterrizados

| PR | Estado |
|---|---|
| #104 | **Fusionado el 2026-09-05** en `a78cfa4`. Trajo `cubierta/` entera y el nucleo epistemico. |
| #101 | **Cerrado solo** al fusionar #104: su head quedo como ancestro del tronco. |
| #98 | **Fusionado el 2026-09-05** en `9c33576`. Trajo `state/cubierta_ui` y cerro el `3 de 4`. |
| #116 | **Fusionado el 2026-10-16** en `b9d9f6b`. Trajo este rumbo y los dos frentes: A1-A6, la persistencia del recorrido y el guardia de huerfanas. |
| #118 | **Fusionado el 2026-10-16** en `d83e63f`. Rumbo al dia tras la fusion y cierre del arco. |
| #119 | **Fusionado el 2026-10-16** en `440945d`. La herramienta de custodia de 1.a y el perimetro de `scripts/`. |
| #120 | **Fusionado el 2026-10-16** en `5fc030d`. A3 con Hipatia viva: observada, rota y arreglada. |
| #114 | **Fusionado el 2026-10-16** en `29bc4c2`. El ancla de posicion con los tres arboles del World. |
| #96 | **Cerrado solo** al fusionar #98: no habia solape con el, habia una pila. |

### Cerrar por haber aterrizado o por redundancia

| PR | Motivo |
|---|---|
| #88 | ~~Su rectificacion del §5 ya esta en el tronco (1.8).~~ Esa clasificacion era falsa: le faltaba la rectificacion del cierre del 2026-07-25. **Resuelto el 2026-10-16 con GO del Capitan:** esas 37 lineas ya estan en el tronco, su mitad de `POSICION.md` no se arrastra, y entonces si queda cerrable por redundancia. Ver el acta abajo. |

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


### Acta del cierre del §5 — y un error del propio reparto (2026-10-16)

Con GO del Capitan a «lo que quede del rumbo». Lo que quedaba, repartido con honestidad:

| Pendiente | Donde se cierra |
|---|---|
| **#114**, unico PR del camino critico | Aqui. **Fusionado** en `29bc4c2` |
| **#88**, clasificado «cerrar por redundancia» | La clasificacion era falsa; **resuelto con GO aparte el mismo dia**: su rectificacion del cierre aterriza, su mitad de `POSICION.md` no |
| **Huerfanas de `state/`** (melampo + los 7 de Hipatia) | Aqui. Cerradas con `test:estado` |
| **Conservados** (#106, #112, #113, #111, #109, #82, #90, #91, #115, partes nocturnos) | **No en este ciclo**, por decision del propio §5: se deciden por lote |
| **1.a** (el empuje de `fb82863`) y **A5** (el recorrido) | En la maquina del Capitan |

#### #88 no se cierra, y el rumbo se equivocaba al decir que si

El §1.8 afirmaba: «la rectificacion de PR #88 ya esta en el tronco; el PR sigue abierto sin
aportar nada». **Comprobado, es inexacto por los dos lados:**

- En `POSICION.md` el tronco **no dice lo que #88 proponia**: dice algo **posterior y
  distinto**. #88 sostiene «la rotacion no estaba rota: era vista parcial, y las rachas de 10 y
  11 eran artefacto de leer solo el tronco». El tronco dice «la alarma estaba bien; el anillo
  estaba mal» —`Groot` no figuraba en `config.roles`, `findIndex` devolvia `-1`— y remata con
  «de 42 ciclos, 40 los durmio la maquina y 2 un agente. No habia a quien rotar». Son dos
  analisis con conclusiones distintas; el del tronco es mas tardio y mas especifico, pero no es
  el de #88.
- #88 toca **ademas** `state/cierres/CIERRE_ARCO_20260725.md`: 37 lineas de rectificacion de
  aquel cierre, con el recalculo del ledger consolidado. **Eso no esta en el tronco**
  —comprobado por busqueda: cero apariciones—. Cerrarlo por redundante habria **perdido
  contenido**, y en un fichero de cierre, que por convencion de la casa conserva el error en vez
  de borrarlo.

Tampoco se fusiona: #88 esta en conflicto (`dirty`), y resolverlo significaria **reescribir el
§5 de `POSICION.md` desde una sesion cloud** para dejar un analisis que el tronco ya supero. Eso
no se hace aqui. **Decision del Capitan**, con la pregunta ya acotada: ¿debe el cierre del
2026-07-25 llevar su rectificacion, aunque el §5 del ancla haya seguido avanzando sin ella?

**Contestado el mismo dia: GO.** El cierre del 2026-07-25 lleva su rectificacion. Las 37 lineas
entran **tal como las escribio su autor**, no reescritas: el tronco no habia tocado ese fichero
desde la base de #88, asi que lo que aterriza es exactamente su aportacion y nada mas.

Lo que **no** se arrastra, y por que:

- **La mitad de `POSICION.md` se queda fuera.** Su fila del §5 y su pendiente nº3 sostienen el
  analisis de la «vista parcial»; el tronco lleva uno **posterior y mas especifico** —el anillo de
  roles mal configurado—. Traerla seria hacer retroceder el ancla, y hacerlo desde una sesion
  cloud, que es justo lo que el §7 prohibe. Su nota de cabecera («Segunda correccion, el mismo
  dia…») si es historia aditiva y tampoco esta en el tronco: **la puede llevar el Capitan desde su
  maquina** si la quiere; no la escribo yo.
- **El PR no se fusiona.** Esta en conflicto, y el conflicto vive precisamente en
  `POSICION.md`. Se aterriza su contenido unico por otra via y el PR queda cerrado por
  redundancia —esta vez de verdad—, con un comentario que dice donde fue cada mitad.

La consecuencia epistemica importa mas que el fichero: ese cierre documentaba un modo de fallo
—concluir sobre el tronco sin ver la mitad agentica— y el propio analisis volvio a caer en el. Sin
la rectificacion, el cierre conservaba la conclusion falsa sin la correccion al lado. Con ella,
conserva las dos, que es la convencion de la casa: **el error no se borra, se rectifica al lado**.

#### Las huerfanas de `state/`, cerradas

`scripts/test-estado.mjs` reclama `state/` **menos** las superficies con dueno
(`funcion_de_sueno` para `test:sueno`, `cubierta_ui` para `test:cubierta`), barre cuatro formas
de nombrar una prueba —`*.test.mjs`, `test_*.mjs`, `test_*.py` y `*test*.js`— y **obliga a que
cada fichero caiga en una de cuatro cajas**: se ejecuta aqui, lo corre otro script de npm, no es
una suite, o le falta configuracion local que la proyeccion excluye. Lo que no cae en ninguna es
huerfana y sale con error. Se cierra la **clase** de fallo, no las dos instancias conocidas: una
prueba nueva bajo `state/` entra sola, sin lista a mano que olvidar.

De los **11 ficheros barridos**: 6 se ejecutan (8 pruebas de melampo y 5 ficheros de Python de
Hipatia), 2 ya los corria `npm test` por otra entrada, 2 se declaran sin la configuracion local
que necesitan, y 1 **no es una suite**: `hub-server.phase0-local-test.js` es el servidor del hub
v2.0 —pide `express` y `ws`—, disfrazado por el nombre del directorio. Ejecutarlo por barrido
habria sido arrancar un servidor creyendo correr una prueba.

#### Tres cosas que solo se supieron ejecutando

1. **Las pruebas de Hipatia escriben en su propio arbol.** Corri `test_closure_core_ola2_1.py`
   en su sitio y creo `closure/` y un fichero con nombre de ruta de Obsidian **dentro de
   `state/hipatia_bridge_runtime/`**. Eso viola la regla de la casa —no se muta `state/` fuera
   de las tres rutas permitidas— y de paso rompio su propia prueba del manifiesto, que comprueba
   que ninguna raiz de datos soberanos este proyectada. **Fue error mio**, los ficheros quedaron
   sin seguimiento y se borraron; nada se commiteo. El corredor corre ahora sobre **copia**, y
   hay una prueba que falla si alguien vuelve a correrlo en su sitio: se la vio fallar.
2. **Una copia compartida hace la tanda dependiente del orden.** `closure` va antes que
   `projection` alfabeticamente, asi que la prueba del cierre rompia a la del manifiesto en la
   misma copia. Es **una copia limpia por fichero**, no una por superficie.
3. **El propio guardia estaba mal planteado, y lo descubrio el trabajo siguiente.** Exigia el
   arbol de `state/` **limpio** para poder decidir, asi que en cuanto hubo un cambio legitimo ahi
   dentro —la rectificacion del cierre de #88, horas despues— `npm test` se puso en rojo sin que
   nada estuviese roto. Un guardia que falla con trabajo honesto en curso no protege: estorba.
   Arreglado el mismo dia: compara el **conjunto de rutas sucias antes y despues** y falla solo si
   el corredor **anade** alguna. Vuelto a ver fallar con el arbol ya sucio y el corredor forzado a
   ejecutar en su sitio, que es la unica forma de saber que sigue vigilando.

#### Verificado ejecutando, incluido ver fallar al guardia

| Comprobacion | Resultado |
|---|---|
| `npm test` completo, con `test:estado` dentro | exit **0** |
| Cubierta | **45 pasadas**; agregador `5 de 5` «sin huerfanas» |
| Funcion de sueno | `2 de 2` |
| `state/` | **11 ficheros barridos**, ninguno sin caja; 5 de Python en copia limpia, 8 de melampo |
| `git status state` despues de correrlo | limpio |
| Guardia de la copia, con el corredor forzado a ejecutar en su sitio | **en rojo**, nombrando `closure/` |
| El mismo guardia, ya arreglado, con `state/` sucio de antemano | **en rojo** igual: distingue lo que anade el corredor de lo que ya habia |
| Pruebas del propio corredor | 5 de 5 |
| `#114` sobre el tronco tras fusionar | `POSICION.md` con los tres arboles, `npm test` exit 0 |

#### Limites, declarados

- **Los conservados siguen conservados.** No es pereza: lo fija el propio §5 —se deciden por
  lote y no en este ciclo—, y un GO a «lo que quede del rumbo» no es un GO a saltarse el reparto
  que el rumbo establece. Siguen fuera: Vegapunk sin GO-1, PuenteDeMando sin cambios, y los
  partes nocturnos agenticos sin decidir.
- ~~**#88 queda abierto a proposito**, con la pregunta acotada arriba.~~ **Contestada el mismo dia
  con GO:** ver arriba. Queda pendiente, solo para su maquina, la nota de cabecera de
  `POSICION.md` que este fichero no escribe.
- **1.a y A5 siguen siendo del Capitan.** Nada de aqui las mueve.
- **Las dos pruebas `SIN CONFIG` no se arreglan.** Necesitan `config/bridge_roots.json` y
  `config/git_repositories.json`, que la proyeccion excluye deliberadamente. Inventar esa
  configuracion seria fabricar un verde.

---


### Acta de la frontera del vault — Hipatia deja de depender de Obsidian (2026-10-16)

Con GO del Capitan. Cierra el hallazgo 1 del acta de A3 y, con el, los **tres**
`inherited_pending_review` que el manifiesto de la proyeccion arrastraba desde el 2026-07-27.

**El problema, en una linea:** `bitacora_server.py` lanzaba `RuntimeError` si no existia el MOC
del vault —una ruta absoluta de Windows, en `update_obsidian_moc`—, asi que **la autoridad
operativa no se podia levantar en ninguna maquina que no fuese la del Capitan**. Y eso invierte la
regla de la casa dos veces: la Cubierta trata a Hipatia como autoridad y no dependencia, y la
arquitectura declara que el vault es **espejo, no fuente de verdad**. La autoridad dependia del
espejo.

**Precedente dentro del propio runtime:** la capa de adaptadores (`bridge_core`) ya resuelve sus
raices desde `config/bridge_roots.json`. Las tres constantes de modulo eran la excepcion, no la
norma. No se invento un patron: se aplico el que ya estaba.

**La decision, en `server/vault.py`:**

| Caso | Comportamiento |
|---|---|
| Vault en su sitio (valor por defecto **heredado**) | **Identico a antes**, escritura por escritura |
| Otra raiz | `HIPATIA_OBSIDIAN_ROOT`, sin tocar codigo |
| Raiz **inexistente** | Espejo inactivo y **declarado** al arrancar, con su remedio. No se escribe ni se crea nada ahi |
| Vault presente y **MOC ausente** | **Sigue lanzando.** No es ausencia, es incoherencia de una superficie que si esta |
| Espejo inactivo y `event_absorbed` | **False.** Absorber es haber llegado a la vista humana; sin espejo que mirar no se afirma |

Esa ultima fila es la que no se podia decidir a la ligera. Debilitar el predicado a «basta la copia
local» habria cambiado el significado de un **estado de gobierno** porque falte un directorio. Se
elige no afirmar lo que no se puede ver, que es la ley de la casa.

**El cerrojo cambia de sentido, no desaparece.** La prueba del manifiesto obligaba a *declarar*
cada ruta absoluta del codigo; ahora **prohibe que quede ninguna**, y a cambio exige que cada
enlace al vault conste como opcional, sobreescribible, con su variable de entorno y con su ruta por
defecto coincidiendo con la que dice `vault.py`. Los dos escritores del vault siguen enumerados
uno a uno: el espejo es opcional, no libre.

**Verificado ejecutando, con el servidor real:**

| Comprobacion | Resultado |
|---|---|
| Arranque **sin vault ninguno** | `espejo de Obsidian inactivo: no existe …` + `0 eventos verificados`; `/api/health` responde **200** |
| La raiz del vault tras ese arranque | **no se creo** — era el defecto que en Linux llenaba el arbol de directorios `D:\…` |
| Arranque **con vault montado** | `Espejo de Obsidian activo en …` |
| `POST /api/events` con vault montado | `write_verified: true`; vista diaria en `daily/2026-10-16.md` del vault y **el MOC enlazando el dia** |
| Pruebas de la frontera | **6 de 6**, incluida la incoherencia (vault presente, MOC ausente → lanza) |
| Prueba del manifiesto, con el contrato nuevo | 6 de 6 |
| `test_closure_core_ola2_1.py` | pasa: exige el informe fisico siempre, y el del vault solo con vault |
| `npm test` completo | exit 0 |

**Limites, declarados:**

- **Esto no esta desplegado en su maquina.** La proyeccion va **por delante** del runtime hasta que
  el Capitan corra `deploy/sync_to_local.ps1 -Apply`, que compara hashes, exige el `8765` parado y
  deja backup. El manifiesto lo dice con dos campos nuevos para que nadie lea esos hashes como «lo
  que corre ahora mismo».
- **Cambia el comportamiento con el vault desmontado**, y eso es una decision, no un arreglo
  neutro: antes era una caida ruidosa de la autoridad entera; ahora es el espejo apagado y dicho.
  Si lo que queria era caerse, se revierte en una linea.
- **Las dos pruebas `SIN CONFIG` siguen igual.** Necesitan `config/bridge_roots.json` y
  `config/git_repositories.json`, excluidos de la proyeccion. Esto no las toca.
- **`server/vault.py` es fichero nuevo del runtime**, no solo de la proyeccion: entra en el
  manifiesto porque sin el los dos modulos que lo importan no arrancan alli.

**Fusionado el 2026-10-18** con GO del Capitan, como `71689c1` (PR #123), probado antes sobre el
tronco del dia: `npm test` exit 0. El despliegue en su Hipatia **no** se ha hecho y sigue siendo
decision suya; la pantalla de estado lo lista como tal.

---

### Acta de la pantalla de estado — que hay, que funciona, que falta (2026-10-18)

Con GO del Capitan, despues de una conversacion con Octavio sobre construir de fuera hacia dentro.
La necesidad la dijo el propio Capitan: *«que tengo hecho, que esta funcionando de lo que tengo
hecho, que me falta»*, y *«hace 3 meses disenamos una cosa que resolvia esto y ahora otra vez
estamos intentando resolverlo de nuevo»*. Primero fue una maqueta; Codex la reviso y pidio cuatro
cambios antes de integrarla. Los cuatro estan dentro.

**Que es:** `GET /estado` en la Cubierta, enlazada desde su cabecera. Lee
`cubierta/estado/registro.json` —lo que se **afirma**, escrito a mano— y comprueba en cada
lectura, contra el arbol y contra git, cada prueba que cita. Lo afirmado y lo comprobado salen
juntos y separados.

| Lo que pidio Codex | Como queda |
|---|---|
| Separar estado tecnico y decision pendiente | `estado` y `espera` son campos distintos. Algo puede estar probado y esperar una decision. Una decision exige al menos dos alternativas con su consecuencia, o la entrada se rechaza y se declara |
| «Visto funcionando» con fecha y entorno | Cada entrada lleva fecha, edad en dias y entorno. Una observacion de un contenedor no se presenta como disponibilidad en la maquina del Capitan |
| Evidencia que se pueda abrir | Cada prueba enlaza su fichero, commit o PR. Las de fichero y documento se comprueban (el documento tiene que seguir diciendo la frase citada), los commits contra git, y los PR se enlazan pero se marcan **no comprobables aqui** |
| Una busqueda vacia no es «hay que construirlo» | La busqueda recorre el registro, el rumbo, `CLAUDE.md` y los cierres, nombra lo que consulto y dice que no consulta PR, ramas ni otros discos. Una mencion en un documento sale como mencion, no como solucion |

Y una regla de Codex que el registro cumple: **un problema tecnico no es tarea del Capitan.** El
conflicto de #117 sale como `siguiente` de la tripulacion; solo la decision de aterrizarlo es suya.

**Dos comprobaciones que vigilan el propio registro:** toda prueba de fichero que cita tiene que
existir (si se mueve un fichero, el registro cambia con el o la suite falla), y el commit
`fb82863` se afirma **ausente**: el dia que sea alcanzable, la pantalla dice que el registro esta
desfasado.

| Comprobacion | Resultado |
|---|---|
| Suite `cubierta-estado` | 18 pruebas; tres reglas rotas a proposito hicieron fallar las suyas |
| Agregador | `suites ejecutadas: 6 de 6`, sin huerfanas |
| `npm test` | exit 0 |
| Navegador real, 1280 y 390 px | 14 filas, 5 esperas, la busqueda devuelve la capsula de julio; sin errores de consola. A 390 px desbordaba por rutas largas: se vio y se arreglo |

**Lo que no es:** el registro sigue escrito a mano, y la pantalla no lee GitHub; esa fila aparece
como **Falta**. Nada privado entra en el registro: el repositorio es publico, y una prueba lo
vigila.

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

- **No fusiona por su cuenta.** Hasta el 2026-10-16 no habia fusionado nada; ese dia, con GO
  explicito del Capitan en cada caso, se fusionaron **#116** (`b9d9f6b`), **#118** (`d83e63f`),
  **#119** (`440945d`), **#120** (`5fc030d`) y **#114** (`29bc4c2`) —los cuatro primeros, este
  mismo trabajo; el quinto, el ancla de posicion del camino critico—. La regla no cambia:
  ninguna accion del §4 o del §5 se ejecuta sin GO, y varias caen sobre ramas de otros actores
  que este fichero no toca. **Y un GO amplio no es un GO a todo:** el 2026-10-16, con GO a «lo
  que quede del rumbo», #88 **no** se cerro pese a estar clasificado para cerrar, porque la
  clasificacion resulto falsa, y los conservados siguieron conservados porque el reparto lo
  dice.
- **No autoriza GO-1 de Vegapunk**, ni relaja ninguna autorizacion operacional existente.
- **No escribe en `POSICION.md`.** Esta sesion es cloud; el ancla de posicion se levanta en la
  maquina del Capitan.
- **No mide `cubierta-world`.** No es alcanzable desde aqui (limite epistemico del §1).
- **No sustituye a la Bitacora.** La Bitacora de Hipatia sigue siendo la autoridad operativa; esto
  es el rumbo con el que se decide, no el registro de lo ocurrido.
