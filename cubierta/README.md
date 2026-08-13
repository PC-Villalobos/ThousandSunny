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

Un agente que no vuelve a latir en 2 minutos pasa a **fantasma** (ver el Vigia).

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

Cada vital declara su tinta (`medido`, `calculado`, `inferido`, `evaluado`,
`propuesto`, `desconocido`) y su fuente. Si el dato no existe, sale `null` con
tinta `desconocido` y un motivo. Nunca se estima nada para rellenar el hueco.

| Vital | De donde sale | Tinta |
|---|---|---|
| pulso | `tokens_por_s` de la senal / `eval_count` de Ollama | medido |
| latencia | `latencia_ms` / `total_duration` | medido |
| carga de contexto | contexto ocupado sobre ventana | calculado |
| errores en ventana | contador de la senal | medido |
| residencia | `size_vram` de `/api/ps` | medido |
| fusion | racha actor+personaje del `sleep_ledger.jsonl` | calculado |

"Pulso" es un nombre bonito para tokens por segundo. No es una prueba de que ahi
dentro lata algo, y la ficha del NPC siempre ensena el numero crudo.

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
| `POST /api/hablar` | conversar con un nakama |

## Pruebas

```bash
node cubierta/test/test_cubierta.mjs
```

20 pruebas. Las que importan no comprueban que el dibujo sea bonito, sino que el
mundo no pueda mentir: que nadie se mueva sin actor, que nadie entre en la camara
sellada, y que un dato ausente salga como `desconocido` y no como un numero.

## Lo que esto todavia no es

- **No hay arte.** Geometria y paleta. El arte es el sumidero de tiempo que mata
  este tipo de proyecto en la semana dos; llega cuando el esqueleto aguante.
- **El mar y las islas no existen.** Solo el interior del barco.
- **Un unico Capitan.** Su posicion es del cliente, no del servidor.
- **La bitacora se lee, no se escribe.** La Cubierta observa; cuando escriba,
  sera por la puerta canonica (`state/funcion_de_sueno/lib/bitacora.mjs`).
