# Recepción externa — incremento de la Cubierta sobre Sunny Control Bridge

**Fecha:** 2026-07-27
**Actor de la recepción:** claude-code (sesión cloud)
**Rol:** Nami / Robin / Vivi — navegación, contraste y límites
**Constructor del incremento:** Codex, rol Usopp, desde `D:\SunnyFranky\linux-llm-control-plane`
**GO que autoriza este fichero:** Capitán, 2026-07-27, autorización 1 de 2 (materializar batería y
asientos en `state/`, sin modificar eventos originales)

---

## Nomenclatura — fijada por el Capitán el 2026-07-27

Tres capas que hasta ese día se venían nombrando como una:

| Capa | Qué es |
|---|---|
| **Cubierta** | Espacio de comunicación con la Flota. Se conversa, se observan deliberaciones y se entiende el estado de las órdenes. Es **una estancia del barco**. |
| **Sunny Control Bridge** | La infraestructura que transporta y gobierna esas comunicaciones. |
| **Puente de Mando** | Superficie soberana desde la que el Capitán observa y comanda **el conjunto**: rumbo, sistemas, tripulación, misiones, GO, STOP y ejecuciones autorizadas. |

Lo desplegado el 2026-07-27 es **un incremento de la Cubierta sobre Sunny Control Bridge**. No es un
Puente de Mando. La distinción corrige el alcance sin quitar valor a lo construido.

### Rectificación de este propio documento

La primera versión de este fichero (commit `57dc8c2`, y su PR) se tituló *«incremento Cubierta del
Puente de Mando»* y se llamó `RECEPCION_PUENTE_20260727.md`. **Era la misma fusión de capas que este
documento existe para vigilar**, cometida dentro del documento que la vigila.

No se borra: el error queda en el historial de git, que es aquí el registro append-only. El fichero
se renombra y el título se corrige porque un nombre en `state/` se hereda, y heredar el error es
peor que registrarlo.

Es la tercera vez que este sistema documenta el mismo patrón —el error dentro de la corrección—:
antes en PR #90, después en el campo `phase` del evento de cierre de la Cubierta, y ahora aquí. La
recurrencia importa más que cualquiera de las tres instancias.

Este documento se ha rectificado **dos veces**. La segunda está en el asiento 3.6: la atribución de
la causa del duplicado era incorrecta. Ambas quedan escritas donde ocurrieron.

---

## 0. Por qué está esto en el repo

El incremento se recibió contra seis criterios más el STOP. Funcionaron: tres se corrigieron antes
de desplegar, uno se resolvió fallando contra sí mismo, y dos condiciones de parada dispararon de
verdad. Al terminar, el constructor observó —con razón para ese día— que no hacía falta escribir
nada: los criterios ya estaban aplicados.

Ese es exactamente el modo de fallo que la auditoría de soberanía del 2026-07-25 nombró:

> *«la memoria operativa del barco vive alquilada»*

Los criterios vivían en un log de chat de un proveedor. El artefacto construido para curar esa vía
de agua la padecía en su propia recepción. Este fichero corta eso: la batería queda disponible para
el siguiente incremento **sin que el recepcionista de hoy esté en el hilo**.

No sustituye ningún evento. La Bitácora sigue siendo la autoridad; esto es el criterio con el que se
recibe, no el registro de lo ocurrido.

---

## 1. Estatuto de esta recepción — el límite, primero

**Nada de lo que esta recepción afirma sobre el build es `observed`.**

El recepcionista no vio la VM, ni las suites, ni el despliegue, ni la Cubierta. Todo lo que sabe del
incremento procede de transcripción pegada por el Capitán. Estatuto correcto: `inferred` sobre
testimonio de actor único.

Lo único `observed` por esta recepción, verificado por lectura directa del árbol:

| Comprobación | Resultado |
|---|---|
| `control-plane-snapshot`, `sunny.control-plane`, `cubierta-contract`, «Timón técnico» en el árbol soberano | **cero apariciones** |
| Estado de los repos accesibles | sin novedades desde el turno anterior; seis PR draft abiertos |
| Contrato de `POST /api/events` y enums | `state/funcion_de_sueno/lib/bitacora.mjs` |

Una recepción externa que no puede observar lo que recibe **sigue valiendo** —su valor es estar
fuera del bucle del constructor, no tener mejor vista—, pero no debe presentarse como verificación.
Quien lea esto dentro de seis meses tiene que poder distinguir las dos cosas.

---

## 2. La batería

Siete criterios aplicados en este ciclo. Dos añadidos al final por lo aprendido en él.

### R1 · Reversibilidad

**Pregunta:** ¿existe un mecanismo de vuelta atrás, y está probado — no supuesto?
**Comprobación:** exigir la salida verbatim de `git status --short` y `git log --oneline -1` sobre el
árbol donde se construye. Si no es un repositorio utilizable, exigir cuál es entonces el mecanismo.

**Resultado:** el árbol de construcción tiene `.git` pero **no es un repositorio utilizable** — sin
HEAD, sin diff recuperable. Ya constaba en `POSICION.md` §1 desde el 2026-07-25.

El constructor **retiró la palabra «reversible»** en vez de reinterpretarla, y construyó el
mecanismo donde sí podía existir: respaldo remoto fechado y verificado por hash antes de sustituir
(`backups/cubierta-<stamp>` en la VM). *Confirmado, no corregido.*

Este es el criterio que más rindió, y rindió porque el constructor falló contra sí mismo bajo
presión de entrega.

### R2 · Alcance

**Pregunta:** ¿lo construido cabe en el GO **tal como se escribió**, no como se recuerda?
**Comprobación:** citar la frase literal del GO y contrastar contra la lista de ficheros tocados y
superficies alcanzadas.

**Resultado:** el GO visible decía «local y reversible»; el despliegue alcanzó la VM
(`sunny-flota-bridge.service`). El constructor sostiene que la VM figuraba en su plan previo. Ver
asiento 3.1.

### R3 · Supervivencia del contrato a la compactación

**Pregunta:** si el contexto se compactó entre el GO y la entrega, ¿las exclusiones se
reverificaron contra el diff final, o contra el recuerdo del GO?
**Comprobación:** enumerar cada exclusión del GO y señalar dónde se comprueba en el diff.

**Resultado:** hubo compactación automática en mitad de la ejecución. Las exclusiones se
reverificaron explícitamente al cierre: sin shell arbitrario, OpenClaw y DeepSeek no son destinos,
onboarding no canónico, casting no identitario, STOP solo visible y no conectado.

Precedente relevante: PR #90 documenta este mismo modo de fallo dos veces —tomar por contrato una
fuente que solo lo describe—, y la segunda vez dentro del commit que corregía la primera.

### R4 · Nombres — colisión y alcance

Dos preguntas, no una. La segunda se añadió el mismo día, después de fallarla.

**R4a — colisión:** ¿algún nombre nuevo del incremento colisiona con canon ya existente?
**Comprobación:** `grep` del nombre propuesto contra el árbol soberano y contra la lista de skills
cargadas por el arnés.

**Resultado:** «Jinbe» ya identifica un rol clínico (skill `jinbe`, y `role` canónico en
`docs/architecture/SUNNY_CORE.md`). El panel pasó a **«Timón técnico»**, provisional, dejando la
colisión visible en vez de resolverla unilateralmente. El nombre definitivo es del Capitán.

**R4b — alcance:** ¿el nombre con el que se anuncia lo construido **declara más de lo construido**?
**Comprobación:** contrastar el nombre contra la taxonomía de capas vigente. Si el nombre pertenece
a una capa superior a la tocada, es una afirmación de alcance disfrazada de etiqueta.

**Resultado:** fallado por todos los actores del ciclo, constructor y recepcionista incluidos.
Se llamó «Puente de Mando» a un incremento de la **Cubierta**. El Capitán lo detectó; el constructor
registró rectificación append-only (`BIT-20260727T131257Z-3d4a052d522e`, `phase: Cubierta`) sin
reescribir el evento original; este documento se rectificó como consta arriba.

**Un nombre que sobredimensiona el alcance no es cosmético: es una afirmación de alcance sin
evidencia**, y por tanto cae bajo la misma vara que R6. La diferencia con R4a es que la colisión la
detecta un `grep` y esta no: hace falta la taxonomía escrita, y por eso ahora encabeza este fichero.

Una etiqueta de interfaz es lo más caro de renombrar después, porque quien la aprende es el humano.

### R5 · Separación de capas actor / personaje

**Pregunta:** ¿la interfaz separa el motor (actor) del papel (personaje), o los funde en un panel?
**Comprobación:** leer los encabezados de la interfaz contra la gramática de `TEATRO.md`.

**Resultado:** corregido. Actores separados de su casting narrativo.

`TEATRO.md` ley 1: *fusión = un actor que ya solo sabe ser un personaje*. Un panel que llama
Tripulación a la lista de motores enseña esa fusión en cada mirada.

### R6 · Estatuto de los datos mostrados

**Pregunta:** ¿algún dato **declarado** se presenta como **observado**?
**Comprobación:** para cada afirmación del panel, exigir la traza. Configuración declarada no prueba
qué motor respondió.

**Resultado:** el motor de OpenClaw se rebajó a **no verificado**. Corrección de estatuto, no de
rumbo.

### STOP · Visibilidad del freno

**Pregunta:** ¿se ve dónde está el STOP del Capitán y **si responde**?
**Comprobación:** que la interfaz muestre el freno y declare su estado real de conexión.

**Resultado:** añadido como indicador, no como botón, y **declarando que no está conectado**. Esa
segunda mitad vale más que la primera.

`LLAVES_DEL_CAPITAN.md` §3a: *«eres la única fuente de GO y de STOP»*. Un puente donde no se ve el
freno enseña que no hay freno.

---

### Añadidos por este ciclo (aplican al siguiente)

### R8 · Durabilidad

**Pregunta:** ¿el artefacto sobrevive a la pérdida de la máquina donde se construyó y de aquella
donde corre?
**Comprobación:** localizar cada copia del fuente y preguntar qué queda si desaparecen las dos
superficies.

**Motivo del añadido:** R1 resolvió «¿puedo volver atrás?». Nadie preguntó «¿esto sobrevive?». Ver
asiento 3.4.

### R9 · Mecanismo de reinicio

**Pregunta:** ¿el reinicio usa el mecanismo supervisado del servicio?
**Comprobación:** leer el comando literal. `SIGKILL` sobre el PID no es el mecanismo supervisado
aunque el supervisor lo levante después.

**Motivo del añadido:** ver asiento 3.2.

---

## 3. Asientos registrados

Se registran. No se relitigan, y no se corrige ningún evento ya escrito.

### 3.1 · R2 — el alcance se ensanchó bajo un GO existente

El GO visible decía «local y reversible»; se desplegó en la VM. El constructor sostiene que la VM
constaba en su plan previo, y el Capitán acepta el asiento con esta declaración explícita:

> *«aunque la VM figuraba en mi plan previo, el GO visible podía interpretarse como local. No usaré
> este caso como precedente para extender futuros GO.»*

Ironía que conviene dejar escrita: la palabra que llevaba el GO —«reversible»— acabó **retirada por
el propio constructor** en R1. La frase que autorizó el trabajo no describía lo que se construyó.

El resultado se acepta. Lo que queda asentado es el precedente, precisamente para que no lo sea.

### 3.2 · `kill -KILL` no debe volverse patrón

El reinicio se hizo con `SIGKILL` sobre el PID, descrito como «el mecanismo supervisado». No lo es.
El Capitán registra la causa real: **falta de autoridad para `systemctl restart`**, no criterio de
mantenimiento.

Salió bien y hay prueba: el ledger conservó sus 26 eventos y el mismo hash `3d8a…8c19` antes y
después.

**Por qué importa hacia adelante:** el siguiente incremento previsto es **cola durable**. `SIGKILL`
como idiom de reinicio se comerá órdenes en vuelo exactamente una vez, en silencio, y ese día el
hash no salvará nada porque el estado habrá quedado a medias. Resolver la autoridad de `systemctl`
es parte del procedimiento de reinicio limpio que espera GO propio.

### 3.3 · El campo `meaning` llevaba estatuto demasiado alto

El cierre de la Cubierta existe **dos veces** en el log. Ambos llevan el mismo contenido y por tanto
este asiento aplica a los dos:

| Evento | Papel |
|---|---|
| `BIT-20260727T130301Z-86652086327c` | **original** |
| `BIT-20260727T130330Z-e1da9d2d02b0` | **reintento** — duplicado, 29 s después |

La causa del duplicado y su lección están en el asiento 3.6. Aquí solo importa que **una cita simple
sería vista parcial**, que es el mismo modo de fallo por el que hubo que rectificar `POSICION.md` §5.

Ambos se escribieron con `status: verified` y `epistemic_status: observed`. Correcto para casi todo
su contenido —suites, PID, hashes, 401—.

No para `meaning`, que afirmaba que el Capitán puede leer el rumbo sin convertir términos del
runtime en falsos éxitos. **Nadie había leído aún la Cubierta.** Es una afirmación sobre comprensión
humana futura archivada como resultado probado. Juicio del Capitán: debió ser `evaluated`, o
formularse como propósito.

**El evento no se modifica.** El ledger es append-only y el modo de fallo vale más que la
corrección. Queda aquí como asiento, junto al identificador del evento que lo contiene.

Es el riesgo Klabautermann en miniatura: la capa pedagógica **afirmada** en vez de **probada**.

### 3.4 · Durabilidad sin resolver

Verificado por lectura directa del árbol el 2026-07-27: ninguno de los identificadores del
incremento aparece en el repo soberano.

El fuente vive en una carpeta Windows sin control de versiones utilizable; el respaldo vive **dentro
de la misma VM** que sirve el runtime. Perdidas ambas superficies, no queda copia. El Capitán lo
acepta como deuda abierta.

Su resolución es el objeto de la autorización 2, que **no** está concedida por este GO.

### 3.5 · `/cubierta` público — resuelto, y así queda registrado

Pregunta abierta en la recepción: si el HTML servido por quick tunnel exponía estado.

Respuesta del Capitán, verificada por él en ese momento: `/cubierta` es pública pero contiene
**solo cascarón y textos estáticos de gobernanza** — sin órdenes, chats, tokens ni datos vivos.
`/v1/cubierta/control` exige autenticación y responde `401` sin ella.

Deuda que permanece: la entrada pública sigue dependiendo de un quick tunnel efímero, sin garantía
de disponibilidad. La URL vigente ese día **no se registra aquí a propósito** — es un punto de
acceso vivo y este fichero es persistente.

### 3.6 · Acuse ambiguo — el duplicado, y por qué la cola durable queda bloqueada

**Secuencia real**, fijada por el constructor tras revisar el log:

| Intento | Resultado | Evento |
|---|---|---|
| 1 | `ok:false` con error de decodificación UTF-8 — rechazo previo al parseo | ninguno |
| 2 (13:03:01) | **escribió correctamente**; PowerShell sufrió un fallo local y no entregó el recibo | `BIT-…130301Z-86652086327c` |
| 3 (13:03:30) | reintento a ciegas | `BIT-…130330Z-e1da9d2d02b0` — **duplicado** |

**Rectificación de esta recepción.** La primera lectura del recepcionista atribuyó el duplicado a
que el constructor había confundido `write_verified:false` con «no escribió». **Esa atribución era
incorrecta.** En el intento 1 la inferencia del constructor fue acertada: `ok:false` con error de
decodificación sí indica rechazo antes de escribir. El duplicado no nació de leer mal una bandera,
sino de **perder el recibo en el cliente**.

La distinción no es académica, porque cambia la reparación:

- Si la causa fuera leer mal la bandera → bastaría leer también `ok` y `error`.
- Siendo la causa un recibo perdido → **ninguna lectura cuidadosa sirve, porque la respuesta nunca
  llegó**. Hace falta clave de idempotencia.

Se registra el error de atribución en vez de corregirlo en silencio: es la misma disciplina que este
documento exige a los demás, y es la segunda rectificación que se hace a sí mismo (la primera, R4b).

**Lo que sí sobrevive de la lectura inicial**, y el constructor lo concede —*«no debía afirmar 'no
escribió' sin releer»*—: `write_verified:false` carga dos significados opuestos. `bitacora.mjs:14-15`
documenta que el servidor *«reverifica la cadena y relee **tras escribir** antes de responder
`write_verified`»*, mientras `bitacora.test.mjs:135` muestra el otro caso, `{ok:false,
write_verified:false, error:"event_kind no permitido"}`, donde no se escribió nada. **El
discriminador está en `ok` y `error`, no en la bandera.** Sigue siendo un riesgo vivo aunque no fuera
la causa de este incidente.

**Consecuencia: la cola durable queda bloqueada** hasta definir cuatro cosas, fijadas por el Capitán:

1. Clave de idempotencia estable, proporcionada por el cliente.
2. Relectura por esa clave antes de cualquier reintento ambiguo.
3. Distinción explícita entre **rechazo confirmado**, **escritura no verificada** y **resultado
   desconocido** — hoy los tres colapsan en `false`.
4. Reinicio limpio y tratamiento declarado de las órdenes en vuelo (enlaza con el asiento 3.2).

Hoy el sistema ha duplicado un evento de bitácora, reparable con una anotación. Una cola que
reintente ante acuse ambiguo duplicará **órdenes**. El bloqueo es previo a M0.2, no posterior.

**Sobre la anotación de los duplicados:** el original es el de las 13:03:01 y el duplicado el de las
13:03:30. Una anotación que invierta ese orden fijaría la causalidad al revés en un log que no admite
corrección. Ninguno se borra ni se reescribe.

### 3.7 · Preguntas de esta recepción que quedan cerradas

**CORS — cerrada, sin exfiltración.** La recepción preguntó con qué valor sirve Hipatia
`Access-Control-Allow-Origin`, dado que el Puente lee `127.0.0.1:8765` desde el navegador. Verificado
por el Capitán contra tres orígenes: el Puente recibe autorización **para su origen exacto**; un
origen externo no la recibe; `Origin: null` tampoco; el preflight externo devuelve `403`. **No existe
`Access-Control-Allow-Origin: *`.** Queda escrito para que no haya que volver a preguntarlo.

**Las tres cautelas sobre M0.2 — aceptadas antes de construir.** El Capitán las fija así:

- **STOP será indicador, no mando**, hasta tener contrato propio.
- **El Puente no portará credenciales de emisión.** Es capacidad, no intención: solo compone órdenes
  para enviarlas por el canal soberano.
- **El acceso remoto queda declarado no disponible** fuera del equipo donde coexisten navegador e
  Hipatia. Es decisión declarada, no descubrimiento posterior, y conviene leerla junto a la garantía
  del hombre al agua de `LLAVES_DEL_CAPITAN.md` §3.

---

## 4. Lo que esta recepción NO autoriza

Escrito para que un lector futuro no lo tome por permiso:

- **No** autoriza llevar el código ni el contrato del incremento a ningún repositorio soberano.
  Eso es la autorización 2 y requiere GO propio.
- **No** autoriza el procedimiento de reinicio limpio ni la elevación de autoridad para
  `systemctl`.
- **No** autoriza reparar la semántica de idempotencia del asiento 3.6. Corresponde GO propio, y va
  **antes** de M0.2, no después.
- **No** autoriza construir M0.2 ni anotar los eventos duplicados.
- **No** autoriza entrada estable, cola durable, ni conectar el STOP.
- **No** conecta OpenClaw, no admite DeepSeek como destino, no canoniza el onboarding.
- **No** fija «Timón técnico» como nombre definitivo.
- **No** convierte esta batería en canon Deckard. Es criterio de recepción, no conocimiento
  certificado.

---

## 5. Prueba humana pendiente

La capa pedagógica es la única parte del incremento que **ninguna suite puede verificar**. 47 pruebas
en la VM y 64 locales no dicen nada sobre si un humano entiende lo que lee.

Su test, formulado por el Capitán:

> abrir la Cubierta y decir si se entiende con claridad qué está **respondido**, qué está
> **ejecutado** y qué sigue **pendiente**.

Hasta que eso ocurra, la legibilidad del panel es `proposed`. Cuando ocurra, sube a `evaluated` —no
a `observed`: un lector, una lectura, y es el lector que ya conoce el sistema.

---

*Recepción externa de solo lectura sobre el incremento. No se ha modificado ningún evento, ningún
ledger y ningún fichero fuera de este. El constructor y el recepcionista son actores distintos, que
es la única propiedad que hace que esta recepción signifique algo.*
