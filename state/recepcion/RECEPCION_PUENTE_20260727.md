# Recepción externa — incremento «Cubierta» del Puente de Mando

**Fecha:** 2026-07-27
**Actor de la recepción:** claude-code (sesión cloud)
**Rol:** Nami / Robin / Vivi — navegación, contraste y límites
**Constructor del incremento:** Codex, rol Usopp, desde `D:\SunnyFranky\linux-llm-control-plane`
**GO que autoriza este fichero:** Capitán, 2026-07-27, autorización 1 de 2 (materializar batería y
asientos en `state/`, sin modificar eventos originales)

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

### R4 · Colisión de nombres

**Pregunta:** ¿algún nombre nuevo del incremento colisiona con canon ya existente?
**Comprobación:** `grep` del nombre propuesto contra el árbol soberano y contra la lista de skills
cargadas por el arnés.

**Resultado:** «Jinbe» ya identifica un rol clínico (skill `jinbe`, y `role` canónico en
`docs/architecture/SUNNY_CORE.md`). El panel pasó a **«Timón técnico»**, provisional, dejando la
colisión visible en vez de resolverla unilateralmente. El nombre definitivo es del Capitán.

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

El evento de cierre `BIT-20260727T130330Z-e1da9d2d02b0` se escribió con `status: verified` y
`epistemic_status: observed`. Correcto para casi todo su contenido —suites, PID, hashes, 401—.

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

---

## 4. Lo que esta recepción NO autoriza

Escrito para que un lector futuro no lo tome por permiso:

- **No** autoriza llevar el código ni el contrato del incremento a ningún repositorio soberano.
  Eso es la autorización 2 y requiere GO propio.
- **No** autoriza el procedimiento de reinicio limpio ni la elevación de autoridad para
  `systemctl`.
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
