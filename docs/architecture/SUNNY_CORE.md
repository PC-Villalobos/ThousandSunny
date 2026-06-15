# Sunny Core

Fecha: 2026-05-01
Packet: SUN-0002
Estado: especificacion cerrada

## Decision

Sunny Core es la fuente de verdad del Thousand Sunny.

GAS no es el cerebro del barco. GAS queda como adaptador Google para Drive,
Sheets, Telegram, WebApp y futuras integraciones de Calendar/Gmail.

La regla corta:

> GAS escribe en mares Google, pero no gobierna el barco.

## Jerarquia

1. `Sunny Core`: protocolo, estado, misiones, cubierta, handoffs, cuarentena,
   actores, roles, skills, triggers y adaptadores.
2. `PuenteDeMando`: consola del Capitan y superficie de operacion.
3. `GAS Adapter`: puente hacia Google. Refleja, traduce y notifica.
4. `Drive`: espejo operativo, archivo navegable y memoria compartida.
5. `Hub local`: runtime actual que aloja el prototipo del Core.
6. `Argos Bridge`: comunicacion inter-barcos y Concilio de Flotas.

## Invariantes

- Toda logica que define identidad, estado, mision o verdad canonica pertenece
  a Sunny Core.
- Todo lo que conecta con plataformas externas pertenece a adaptadores.
- Los adaptadores no pueden inventar protocolo. Solo traducen eventos canonicos.
- El feed visible al Capitan solo recibe `START` y `CLOSE`.
- Todo cierre operativo requiere handoff con `contexto`, `decision`,
  `continuidad` y `session_ref`.
- Los eventos strict sin `packetId` o actor canonico van a Cuarentena.

## Superficie canonica actual

El prototipo vive en:

`C:\Users\usuario\Documents\Claude\Projects\IA como extension cognitiva personal (Gemini, Claude y ChatGPT)\thousand-sunny-hub`

Rutas vivas:

- `state/shared-state.json`: estado vivo del barco.
- `state/event-stream.jsonl`: eventos canonicos silenciosos.
- `state/cubierta/feed.jsonl`: feed visible `START`/`CLOSE`.
- `state/misiones/{open,in_progress,done,parked,blocked,archived}/`: misiones.
- `state/handoffs/`: handoffs cerrados por packet.
- `state/cuarentena/events.jsonl`: entradas rechazadas.
- `state/schemas/*.schema.json`: contratos JSON.

## Actores, roles y skills

`actor` es el motor real. Es el campo de interoperabilidad con Argos y otros
barcos.

Actores de flota Sunny:

- Claude
- Codex
- Gemini
- ChatGPT
- OpenClaw
- Qwen
- DeepSeek
- Pi
- Captain

Superficie compatible Argos v1.6:

- Claude
- Codex
- Gemini
- ChatGPT
- OpenClaw
- Qwen

DeepSeek y Pi se conservan para compatibilidad historica/local del Sunny. En
mensajes destinados a Argos se degradan a lectura historica o se bloquean hasta
que exista acuerdo explicito de capitanes.

`role` es la vestidura interna: Nami, Zoro, Sanji, Usopp, Franky, Vivi,
Chopper, Robin, Jinbe, Brook, Agape, Nemesis o Sofia.

`skill` es la accion concreta ejecutada por un actor dentro de un rol.

## API minima

Implementado en el Hub:

- `GET /api/core`: resumen del Core, fronteras, rutas, protocolo y schemas.
- `GET /api/core/schemas`: resumen con schemas embebidos.
- `GET /api/protocol`: protocolo vivo, conteos y tails.
- `GET /api/missions`: listado de misiones.
- `GET /api/missions/:packetId`: mision por ID.
- `POST /api/missions/start`: abre o inicia mision y escribe `START`.
- `POST /api/missions/:packetId/close`: cierra mision, exige handoff y escribe
  `CLOSE`.

Futuro inmediato:

- `POST /api/adapters/gas/sync`: sincronizacion controlada hacia GAS/Drive.
- `POST /api/bridge/argos/concilio`: salida hacia Concilio compartido.
- `POST /api/bridge/argos/inbox`: entrada autenticada desde Argos.

## Adaptadores

### GAS Adapter

Responsabilidades:

- Mirror de eventos visibles hacia Bitacora/Drive/Telegram.
- Lectura legacy mientras la WebApp y Cowork sigan hablando con GAS.
- Higiene minima para evitar entradas sin actor o packet.

No responsabilidades:

- No asigna IDs canonicos.
- No decide estados.
- No define handoff.
- No reordena Drive.

### PuenteDeMando Adapter

Responsabilidades:

- Mostrar estado del Core.
- Enviar mensajes del Capitan como eventos o misiones canonicas.
- Consumir `GET /api/core`, `GET /api/missions` y `state/cubierta/feed.jsonl`.

### Drive Adapter

Responsabilidades:

- Espejar decisiones y cierres como Markdown navegable.
- Mantener Drive como memoria compartida humana.

No es fuente de verdad.

### Argos Bridge

Responsabilidades:

- Traducir `room`, `agent`, `packet_id` y `closure` entre Sunny y Argos.
- Publicar en una room compartida cuando Ruben entregue token y nombre de sala.
- Rechazar o cuarentenar mensajes externos malformados.

Regla de soberania:

Sunny puede hablar con Argos, pero Sunny no depende del ngrok de Argos para
mantener su propio estado.

## Protocolo de sincronizacion

1. Core recibe evento o mision.
2. Core normaliza `actor`, `role`, `packetId`, estado y trigger.
3. Core valida en modo strict cuando el evento afecta protocolo.
4. Si falla, escribe en `state/cuarentena/events.jsonl`.
5. Si pasa, escribe en `state/event-stream.jsonl` y actualiza
   `state/shared-state.json`.
6. Si el momento es visible, escribe en `state/cubierta/feed.jsonl`.
7. Adaptadores espejan hacia GAS/Drive/Telegram/Argos sin alterar la verdad.

## Migracion recomendada

SUN-0003 debe extraer el prototipo de `shared-state.js` a un modulo Core
versionable o, como minimo, conectar flujos reales de Puente/Cowork a:

- `POST /api/missions/start`
- `POST /api/missions/:packetId/close`
- `GET /api/core`

SUN-0004 puede implementar el GAS Adapter como espejo controlado.
SUN-0005 puede abrir el Argos Bridge una vez acordados token, room y frontera
de capitanes con Ruben.

## No objetivos

- No meter Argos dentro de Apps Script.
- No convertir GAS en un monolito.
- No reescribir toda la Bitacora Viva de golpe.
- No exponer endpoints externos del Sunny sin token, room y politica de
  cuarentena.
