# Carta de custodia del puerto de Vegapunk — Fase 0

> Estado: **propuesta ejecutable, pendiente de GO del Capitán.** Nada de lo que
> sigue admite una sola fuente real. La Fase 0 existe para probar el circuito con
> material inventado *antes* de que una nota clínica, una transcripción o un
> registro íntimo real toque el barco.

**Qué prueba esta expedición:** no si podemos analizar intimidad, sino si el barco
sabe **no confundir asistencia, intimidad, investigación y metáfora** antes de tener
a una persona real a bordo. El fixture `metafora_trampa.md` es esa prueba, y el
puerto la pasa: se declara metáfora, arrastra la relación asistencial entera, y el
motor la reclasifica a `asistencial` con la evidencia al lado.

**Por qué es un puerto aparte y no una carpeta de Isla Drive:** Drive conserva su
frontera histórica. Vegapunk no la mueve — abre un carril distinto que permitirá,
más adelante y con GO explícito, trabajar con esos materiales de forma deliberada.

---

## 1. Las tres zonas de custodia

| Zona | Qué guarda | Regla |
|---|---|---|
| **Z1 · Compartimento de identidad** | la correspondencia identidad ↔ seudónimo | **Nunca se abre.** Se inventaría por `stat`, sin hash y sin cuerpo. Ni la tripulación, ni un actor contratado, ni el puerto mismo la leen. Denegada a todos, siempre. |
| **Z2 · Bodega de custodia** | el material ya seudonimizado, clasificado por clase y finalidad | Se abre solo bajo un GO que nombre caso, clase y finalidad. |
| **Z3 · Muelle de salida** | los paquetes que salen | **Único camino de salida.** Nadie recibe rutas ni acceso a la bodega: recibe un paquete construido por el puerto, con recibo. |

La separación Z1/Z2 es lo que hace que "seudónimo" signifique algo. Si el mapa vive
junto al material, no hay seudonimización: hay una etiqueta.

## 2. Las cuatro clases de material

De más a menos restrictiva. **El orden es la política.**

| Clase | Qué es | Sujeto |
|---|---|---|
| `asistencial` | episodio de una relación de cuidado | un tercero, que no puede consentir en diferido |
| `intimo` | registro íntimo o experimental del Capitán | el propio Capitán |
| `cuantificado` | medidas y series, seudónimas por construcción | tercero o Capitán |
| `metafora` | material simbólico o narrativo | nadie |

**Regla de disonancia:** el material *declara* su clase; el puerto la *verifica*
contra marcadores. Ante conflicto **gana siempre la clase más restrictiva**, y la
decisión queda con su evidencia en el recibo. La detección puede sobre-detectar
—eso solo aprieta— pero no puede infra-detectar.

**Regla del material no leído:** lo que no se ha abierto recibe la clase más
restrictiva por defecto, y **no** se marca como disonante. No se inventa una
contradicción que nadie observó.

## 3. Niveles de acceso y matriz

Niveles: `denegado` · `stat_only` (metadata, jamás se abre) · `derivado` (solo
agregados y huella) · `contenido` (texto literal).

Techo por clase y solicitante. La finalidad **no puede subir este techo, solo bajarlo**.

| clase | Capitán | tripulación | actor contratado | adaptador (GAS/Drive/Telegram) |
|---|---|---|---|---|
| `asistencial` | contenido | derivado | derivado | **denegado** |
| `intimo` | contenido | derivado | derivado | **denegado** |
| `cuantificado` | contenido | contenido | derivado | **denegado** |
| `metafora` | contenido | contenido | contenido | derivado |

**Techo de muelle.** De una clase guardada (`asistencial`, `intimo`) **nunca sale
texto literal por el muelle, ni siquiera hacia el Capitán**. La matriz le concede
`contenido` porque es el responsable del material y puede abrirlo en su máquina; lo
que el techo impide es que el puerto se convierta en un canal cómodo para sacar
clínica e intimidad en claro. Acceso directo y salida por el muelle no son lo mismo.

**Por qué el adaptador es el más atado:** es la única capa que publica hacia fuera
(Sheets, Drive, Telegram). Ver `VEGAPUNK_FRONTERA.md` en PuenteDeMando.

## 4. Consentimiento por finalidad y puerta clínica → investigación

Finalidades: `asistencia` · `investigacion` · `sistema` · `narrativa`.

Que un material entrara por `asistencia` **no** lo habilita para investigar con él.
El cruce es un acto propio: exige un **GO de puerta** escrito en la cabecera del
propio material (`puerta_investigacion`). Sin puerta, la finalidad no se sirve —
`puerta_cerrada` es el motivo, y queda en el recibo.

En Fase 0 solo `cuantificado_serie.md` lleva puerta, con un GO sintético. Existe
para probar que la puerta **abre**, no para normalizar que esté abierta.

## 5. Las tres condiciones de parada

Una parada no es un error recuperable: aborta la admisión y queda escrita.

1. **`PARADA_FUENTE_REAL`** — toda entrada que no sea un fixture de Fase 0 declarado
   (`fixture: vegapunk-fase-0`, `sintetico: true`). Admitir una sola fuente real es
   **un GO posterior, no un flag**.
2. **`PARADA_IDENTIDAD`** — Z1, o marcadores de identidad detectados fuera de Z1
   (nombre real, DNI/NIF, nº colegiado, NHC, email, teléfono).
3. **`PARADA_FUGA`** — un paquete ya construido que lleve texto literal de clase
   guardada, o un ítem sin recibo. Si salta, **el paquete entero se anula**. Es la
   defensa que sigue en pie si la matriz cambia mal.

## 6. Recibos

Cada decisión emite un recibo: qué se pidió, quién, para qué, qué se concedió, la
**huella** de la entrada (nunca su contenido), la clase declarada, la efectiva, la
disonancia con su evidencia, las paradas y los motivos.

Los recibos son **idempotentes**: mismo material + mismo solicitante = mismo id.
Re-correr el circuito no inventa historia nueva.

## 7. Prohibido en Fase 0

Doctoralia · Plaud · Noa Note · fuentes reales de Drive · transcripciones reales ·
identidad real · credenciales · contenido de terceros · promoción a canon · envío
de datos reales a cualquier actor, contratado o no.

## 8. Autoridad

- **Capitán** — decide alcance y excepciones. Única fuente de GO *y* de STOP.
- **Supervisión** — valida borradores y aplica; no autoriza.
- **Actor contratado** (DeepSeek u otro) — razona **solo** sobre el paquete de Z3, y
  **redacta**; no aplica y no afirma. Ver `CONTRATO_ACTOR_CONTRATADO.md`.
- **Hipatia** — conserva su papel operacional; no recibe contenido clínico.

## 9. Cierre de la Fase 0

Se cierra con: puerto visible en el mapa del barco (`CREW.md`, `OPERACIONES.md`),
esquema de custodia **comprobado con fixtures** (`vegapunk.test.mjs`), informe de
fallos (`FASE_0_INFORME.md`) y una propuesta de GO posterior para **una única
fuente real**, si procede.

Nada de esto demuestra sabiduría. Demuestra contrato.
