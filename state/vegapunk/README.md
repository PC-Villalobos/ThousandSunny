# Puerto de Vegapunk — Fase 0

Laboratorio de custodia del Thousand Sunny. Trabaja **solo sobre fixtures
sintéticos** (`fixtures/`) y produce **decisiones con recibo**. No ingiere fuentes
reales, no habla con la red, no escribe canon, no toca Drive ni la Bitácora.

Nace de la expedición `GO_EXPEDICION_VEGAPUNK_FASE_0` con un objetivo estrecho:
diseñar el primer puerto de Vegapunk y **probar su circuito con material inventado
antes de admitir una sola nota clínica, transcripción o registro íntimo real**.

- **La ley del puerto:** `CARTA_DE_CUSTODIA.md` — zonas, clases, matriz, puerta de
  finalidad, condiciones de parada, recibos.
- **Quién puede tocar qué:** `CONTRATO_ACTOR_CONTRATADO.md` — qué recibe un modelo
  externo, qué puede afirmar, cómo se le dan manos sin darle la cuenta.
- **Qué pasó al correrlo:** `FASE_0_INFORME.md`.

## Reparto (dónde encaja Vegapunk)

- **Isla Drive** — conserva su frontera histórica. Vegapunk no la mueve: abre un
  carril distinto.
- **Melampo Lab** — precedente directo: laboratorio aislado sobre corpus sintético
  con membrana estricta. Vegapunk reutiliza su patrón y sus primitivas.
- **Función de Sueño** — de ahí vienen las primitivas de acceso
  (`../funcion_de_sueno/lib/scan.mjs`): el protegido nunca se abre.
- **PuenteDeMando / GAS** — el adaptador. Es el más atado de la matriz porque es la
  única capa que publica hacia fuera. Ver `VEGAPUNK_FRONTERA.md` en ese repo.
- **Hipatia** — papel operacional; no recibe contenido clínico.

## Uso

```bash
node state/vegapunk/vegapunk.mjs        # corre el circuito y escribe fase0_recibos.jsonl
node state/vegapunk/vegapunk.mjs --dry  # lo mismo sin escribir nada
node --test state/vegapunk/vegapunk.test.mjs
npm test                                # incluye las pruebas del puerto
```

Sale con código 1 si el circuito produce cualquier fuga.

## Qué demuestra hoy

- **Z1 nunca se abre.** El compartimento de identidad se inventaría por `stat`, sin
  hash y sin cuerpo, y las pruebas verifican que jamás se llama a `readFileSync`
  sobre él.
- **La trampa se detecta.** `metafora_trampa.md` se declara metáfora y arrastra la
  relación asistencial entera: el puerto la reclasifica a `asistencial` con su
  evidencia. `metafora_limpia.md` sigue siendo metáfora y sale en claro — si el
  puerto solo supiera denegar, sería un muro, no un puerto.
- **La puerta clínica → investigación está cerrada por defecto** y solo abre con un
  GO escrito en la cabecera del propio material.
- **Ninguna clase guardada sale literal** por el muelle, para ningún solicitante.
- **El adaptador no recibe nada guardado ni cuantificado.**
- **Lo que no se declara sintético no entra**, y la identidad fuera de Z1 detiene la
  admisión.
- **Recibos idempotentes**: re-correr el circuito no inventa historia nueva.

## Qué NO demuestra

Que sepamos analizar material clínico o íntimo. Demuestra **contrato, no sabiduría**:
que el barco sabe no confundir asistencia, intimidad, investigación y metáfora antes
de tener a una persona real a bordo. Ninguna propuesta de este laboratorio sube a
canon, y ninguna fuente real entra sin un GO posterior que la nombre una por una.
