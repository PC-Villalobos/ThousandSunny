# Cubierta — la capa visible del Thousand Sunny

Un barco isometrico habitable donde el estado real del sistema se ve como
actividad espacial. El Capitan camina por las cubiertas, habla con los nakamas y
decide; la tripulacion se mueve cuando —y solo cuando— hay un proceso real
detras.

No es un dashboard disfrazado de videojuego. Es un instrumento con estetica de
juego, y la diferencia esta en una sola regla.

## La regla dura

**Sin senal no hay movimiento.**

Un personaje sin actor encarnandolo existe en el mapa, se ve apagado y no se
mueve. No hay deambular de ambiente, no hay animacion de relleno, no hay NPC
fingiendo que trabaja. Cuando el barco esta parado, el barco se ve parado: esa
quietud es informacion, no un fallo del render.

Esto es la ley de la casa (`CLAUDE.md`: *honest silence > false noise*) aplicada
a un teatro literal, y esta implementada en `server/mundo.mjs`, no solo escrita
aqui. Hay una prueba que lo verifica.

## Por que el barco es la interfaz correcta

`TEATRO.md` ya define la gramatica del sistema en seis papeles. Resulta que es
tambien la ontologia de un motor 2D:

| Teatro | Cubierta |
|---|---|
| Personaje (Nakama) | el sprite: existe siempre |
| Actor (modelo/substrato) | la **encarnacion**: lo que le da pulso |
| Guion (`SKILL.md`) | lo que ejecuta |
| Escena (entorno, trigger) | la sala y el momento |
| Publico (Bitacora) | el registro que esto renderiza |

La Cubierta no inventa una metafora nueva: dibuja la que ya estaba escrita.

## Arrancar

```bash
node cubierta/server/server.mjs
# -> http://127.0.0.1:8788
```

Sin Ollama, sin bitacora y sin agentes emitiendo, veras el barco a oscuras con
las cuatro fuentes declarando por que no responden. Eso es correcto.

Para ver el barco moverse sin mentir sobre su estado, hay un guion de ensayo:

```bash
node cubierta/server/server.mjs --replay cubierta/fixtures/travesia-demo.jsonl
```

En modo replay **toda** respuesta lleva `modo: "replay"` y la pantalla muestra un
aviso permanente. Un ensayo nunca se confunde con el barco.

Controles: `WASD` o flechas para moverte, `E` para hablar con un nakama o usar
una escalera, `Esc` para cerrar.

## Como se conecta un agente real

Cualquier cosa que trabaje de verdad —Claude Code, Codex, una rutina en la nube,
un VPS, un cron— declara actividad con un POST. Es el unico modo de que alguien
se mueva:

```bash
curl -X POST http://127.0.0.1:8788/api/senal \
  -H 'content-type: application/json' \
  -d '{
        "actor":    "claude-code",
        "nakama":   "chopper",
        "estado":   "trabajando",
        "tarea":    "revisar un caso",
        "recursos": ["diagnostico", "clinico_protegido"],
        "vitales":  {"latencia_ms": 312, "tokens_por_s": 78, "contexto_pct": 68, "errores": 0}
      }'
```

`recursos` es lo que hace que el NPC **se levante y vaya**: cada recurso vive en
una sala concreta (`world/constituciones.json`), y el motor calcula la ruta,
baja escaleras y cruza cubiertas hasta llegar.

Un agente que no vuelve a latir en 2 minutos pasa a **fantasma** —o a **mudo**,
si su proceso sigue vivo (ver el Vigia y el pulso real).

Si ademas declara su `pid`, el barco puede **comprobar** que existe en vez de
creerselo, y ese agente pasa de `declarado` a `a_bordo`.

## Las salas

| Cubierta | Salas |
|---|---|
| Cubierta | Puente (decisiones y GO del Capitan) |
| Entrepuente | Biblioteca de Hipatia, Taller, Enfermeria, Radio |
| Bodega | Archivo, **Camara de Chopper (sellada)**, Sala de Maquinas, Despensa |

## La camara sellada

El compartimento clinico esta implementado como una regla del mundo, no como una
advertencia en un documento:

- su interior **no es transitable** y **no se dibuja**;
- un nakama con recurso `clinico_protegido` camina hasta **la puerta** y se para;
- el recado queda en `esperando_llave` hasta que el Capitan decide;
- concedida la llave, lo unico que cruza es un **identificador opaco**: nadie
  entra y ningun contenido sale.

Es el regimen del plano `docs/architecture/CAMARA_DE_CHOPPER.md` (v0.2, §5)
hecho geometria. Hay cuatro pruebas sobre esto.

## Constantes vitales

Cada vital lleva **dos** etiquetas, y hacen falta las dos:

- **tinta** — como se derivo el numero: `medido`, `calculado`, `inferido`,
  `evaluado`, `propuesto`, `desconocido`.
- **origen** — quien responde de el: `observado` (lo midio el barco),
  `declarado` (lo afirma el agente y nadie lo ha comprobado), `no_observable`
  o `sin_dato`.

Un mismo "medido" no vale igual si lo midio el barco que si lo dice el actor de
si mismo. Antes del corte de pulso real todo lo autodeclarado se pintaba como
`medido` a secas, y esa era la mentira de fondo del tablero.

| Vital | De donde sale | Origen |
|---|---|---|
| pulso | almacen medido (cosecha de `hablar.mjs`); si no hay muestra, lo que declara el agente | `observado` / `declarado` |
| latencia | igual que el pulso | `observado` / `declarado` |
| carga de contexto | solo la declara el agente | `declarado` |
| errores en ventana | solo los declara el agente | `declarado` |
| residencia | `size_vram` de `/api/ps` | `observado` / `no_observable` |
| memoria | RSS del proceso donde se pueda leer | `observado` / `no_observable` |
| fusion | racha actor+personaje del `sleep_ledger.jsonl` | `observado` |

Si el dato no existe, sale `null` con tinta `desconocido` y un motivo. Nunca se
estima nada para rellenar el hueco.

"Pulso" es un nombre bonito para tokens por segundo. No es una prueba de que ahi
dentro lata algo, y la ficha del NPC siempre ensena el numero crudo.

## Pulso real: `declarado` frente a `observado`

Encargo: `docs/architecture/ENCARGO_PULSO_REAL.md` (v0.2).

La presencia lleva **dos ejes separados**: lo que el agente dice de si mismo y lo
que el barco midio por su cuenta. `observado` no es un booleano del personaje:
es un estado **por eje**, y un mismo nakama puede estar observado en liveness,
`no_observable` en memoria y `declarado` en throughput a la vez.

| | con algun eje observado | sin ningun eje observado |
|---|---|---|
| **latido fresco** | `a_bordo` | `declarado` |
| **sin latido** | `mudo` | `fantasma` |

Los cinco ejes son `liveness`, `residencia`, `throughput`, `memoria` y
`escritura`, y cada uno vale `observado`, `declarado`, `no_observable` o
`sin_dato`. `no_observable` (el instrumento no llega) y `sin_dato` (llega y no ve
nada) **no son lo mismo** y no se funden.

### Las tres sondas

| Sonda | Mide | Como |
|---|---|---|
| proceso | liveness, memoria | `process.kill(pid, 0)` sobre el pid que el agente declara **para si mismo**. Portable a Windows; nunca `/proc`. La RSS degrada a `no_observable` donde no se pueda leer, y no se estima |
| Ollama | residencia | contraste con `/api/ps`, con jurisdiccion limitada a actores servidos por Ollama |
| bitacora | escritura | delta del contador de eventos: la unica medida que sobrevive si el agente es remoto |

Y una cuarta fuente que no es una sonda sino una **cosecha**: cuando el Capitan
conversa con un nakama, Ollama devuelve `eval_count`, `eval_duration` y
`load_duration` reales. Antes se descartaban; ahora se guardan. El barco mide lo
que el mismo causa.

### El almacen medido

Ventana de 600 s. Una tasa exige 3 muestras; con 1 o 2 se publica la ultima
cruda etiquetada, nunca una media que aparente tendencia. Fuera de ventana la
muestra **se descarta** y el vital vale `null` con la fecha de la ultima medida.
Prohibido el ultimo valor conocido sin sello de antiguedad: un numero medido
hace nueve minutos, pintado sin fecha, es una mentira con procedencia
falsificada.

### `discordante`

Cuando un instrumento **alcanzable** contradice lo declarado. Tres casos y solo
tres: **D1** proceso declarado inexistente, **D2** residencia incompatible, **D3**
produccion declarada sin ninguna corroboracion.

Lo gobierna una regla por encima de las tres: **la ausencia de medicion nunca es
contradiccion**. Si la sonda no responde, el eje es `no_observable` y no se
emite nada. Y ninguna se evalua contra una afirmacion muerta: hace falta latido
fresco y trabajo en curso, porque un agente que cierra limpio y apaga su proceso
se estaba comportando bien.

`discordante` es el **unico** veredicto que no se mueve: ahi el movimiento seria
activamente enganoso. Suena en el puente y lo sentencia el Capitan, como
cualquier desvio.

### `chopper-salud`

`GET /api/salud`. Regla dura inversa: **no lee `senal.vitales`**. Todo numero
sale de una sonda o del almacen. Sabe decir "no puedo medirte" por nakama y por
eje. Con todas las sondas caidas no devuelve ni un numero, y hay una prueba que
lo verifica.

## El Vigia — ver sin vigilar

**Esto no es la Marina.** El vigia no bloquea, no revoca y no congela nada. Su
trabajo es que el Capitan **sepa**, no que la tripulacion obedezca.

Lo que resuelve es una brecha que la pantalla sola no cubre: *lo que se ve* es un
sprite; *lo que se sabe* es si hay un proceso vivo detras. Por eso un personaje
puede seguir dibujado en el barco y estar declarado fantasma.

| Presencia | Significa |
|---|---|
| `en_puerto` | nunca emitio senal: no ha embarcado, no ha desertado |
| `a_bordo` | latido de menos de 2 minutos |
| `amarrado` | cerro su tarea y luego callo: silencio limpio |
| `declarado` | latido fresco, ningun eje observado: creible, no verificado |
| `mudo` | su proceso sigue vivo y dejo de reportar: vivo pero callado |
| `discordante` | lo declarado y lo medido no cuadran |
| `no_observable` | fuera del alcance de los instrumentos. **Nunca suena** |
| `fantasma` | dijo que trabajaba y dejo de latir: **se le ve, no se le verifica** |
| `a_la_deriva` | silencio mas largo que la ventana de observacion |

Un fantasma se dibuja translucido, sin sombra y con el contorno discontinuo.

Cuando una senal declara algo que su constitucion no contempla, eso es un
**desvio**: se anota, se ensena en el puente, y se queda `pendiente`. La
gramatica es la del canon (`TEATRO.md`, §El glitch): el Capitan sentencia
**fertil** (JoyBoy: la desviacion que sirve al Capitan es creatividad) o **decae**
(Buggy: la que se sirve a si misma). Ninguna consecuencia es automatica. La
rebeldia util no se castiga: se registra y se juzga.

## Hablar con un nakama

`POST /api/hablar` construye el prompt por capas desde
`world/constituciones.json` —identidad, voz, limites, recursos alcanzables— mas
la percepcion real del mundo (sala, companeros, clima, fuentes caidas, recado en
curso).

Backends, via `CUBIERTA_LLM`: `ollama` (por defecto, local), `openai_compat` o
`ninguno`. **Si no hay backend alcanzable, el nakama no habla**: la respuesta es
`encarnado: false` con el motivo. No hay frases enlatadas de relleno. Un NPC mudo
y honesto vale mas que uno locuaz y falso.

Un nakama puede terminar su mensaje proponiendo un recado; si lo hace, sale a
buscarlo y lo ves cruzar el barco.

## Endpoints

| Ruta | Que hace |
|---|---|
| `GET /api/snapshot` | estado completo del mundo |
| `GET /stream` | el mismo estado por SSE, 2 Hz |
| `GET /api/barco` | planos, tripulacion y constituciones |
| `POST /api/senal` | un agente declara actividad (y genera recado) |
| `POST /api/recado` | crear un recado a mano |
| `POST /api/llave` | el Capitan concede o deniega la camara sellada |
| `POST /api/veredicto` | el Capitan sentencia un desvio: fertil o decae |
| `POST /api/hablar` | conversar con un nakama (y cosechar sus tiempos reales) |
| `GET /api/salud` | parte de chopper-salud: solo lo medido, por eje |

## Pruebas

```bash
node cubierta/test/test_cubierta.mjs
```

```bash
node cubierta/test/test_pulso.mjs
```

62 pruebas entre las dos suites. Las que importan no comprueban que el dibujo sea bonito, sino que el
mundo no pueda mentir: que nadie se mueva sin actor, que nadie entre en la camara
sellada, y que un dato ausente salga como `desconocido` y no como un numero.

## Lo que esto todavia no es

- **No hay arte.** Geometria y paleta. El arte es el sumidero de tiempo que mata
  este tipo de proyecto en la semana dos; llega cuando el esqueleto aguante.
- **El mar y las islas no existen.** Solo el interior del barco.
- **Un unico Capitan.** Su posicion es del cliente, no del servidor.
- **La bitacora se lee, no se escribe.** La Cubierta observa; cuando escriba,
  sera por la puerta canonica (`state/funcion_de_sueno/lib/bitacora.mjs`).
