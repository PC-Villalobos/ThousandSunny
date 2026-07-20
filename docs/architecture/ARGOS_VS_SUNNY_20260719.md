# Argos (Rubén) vs. Thousand Sunny — comparativa de arquitectura

**Fecha:** 2026-07-19
**Origen:** síntesis de una conversación con Antonio sobre capturas que Rubén compartió de Argos (grafo de memoria reorganizado por "Melampo", su compostador nocturno). No son hallazgos de código auditado; son inferencia a partir de lo visible y de documentación ya existente en este ecosistema.

## Lo que mostró Rubén

Cuatro capturas de un grafo de fuerza (nodos = documentos/eventos, aristas = relaciones semánticas), en secuencia temporal:

1. Estado inicial: un núcleo compacto ("atlas de acupuntura", extraído siguiendo el canon de Melampo) cerca del centro, y un halo grande de puntos sin enlazar (sustrato huérfano) — bitácoras y "semillas" con volcado de ideas de 4-5 meses, aún sin conectar.
2. Tras un primer volcado (dos años de historial de ChatGPT): el núcleo central gana densidad y ramificaciones; empiezan a aparecer islotes y cadenas intermedias.
3. Con 7 tareas concurrentes de reorganización: emergen varios concentradores ("estrellas") en paralelo, cada uno un frente de trabajo propio.
4. Estado más organizado: dominios diferenciados, grandes concentradores, satélites especializados, puentes entre comunidades — el atlas de acupuntura se mantiene compacto y diferenciado, sin mezclarse con el resto.

## Qué es Melampo (según la descripción de Rubén)

Un "compostador nocturno": ingiere corpus histórico, extrae conceptos/relaciones, y distingue (al menos conceptualmente) entre:

- **Huérfano topológico** — sin enlaces todavía.
- **Semilla semántica** — contiene una idea recuperable.
- **Compost real** — duplicado, ruido o versión superada.
- **Canon** — material validado, con procedencia y contratos explícitos.

No hay evidencia directa (código, esquema de datos) de cómo Melampo decide a qué categoría pertenece cada nodo, ni de qué motor de grafo usa, ni de cómo evita colisiones entre las 7 tareas paralelas. Solo tenemos la fenomenología visual.

## Lo que ya sabíamos de Argos por documentación existente en este ecosistema

- `ARGOS_QUICKSTART.md` (documentación operativa, v2.1.0 doc / runtime 0.4.0 en el momento de exportación): bandeja de `work_packets`, estado persistente en `state/argos.state.json`, bitácoras separadas (actividad, sombra, handoffs, glitches), feed en `cubierta/feed.jsonl`, API local en `localhost:8080`, cierre remoto autenticado, actores canónicos (Claude, Codex, Gemini, ChatGPT, OpenClaw, Qwen).
- `INTER_AI_PROTOCOL.md`: disciplina común de registro — packet_id obligatorio, rechazo de entradas huérfanas, separación log/transcript/sombra/glitches/estado, criterios de handoff.
- Puente Flota (`README.md` "ARGOS FLOTA - Puente operativo Thousand Sunny / Argos"): canal ya diseñado entre Sunny y Argos vía `/api/flota/*`, sesiones Markdown append-only, SSE, con separación explícita Concilio (privado de Argos) / Flota (compartido). Vista invitada no debe exponer Concilio, Bitácora interna, Cubierta ni estado privado. Token compartido fuera de git. **No verificado en este sesión que el endpoint siga vivo** — no usar sin confirmación explícita de Antonio.
- Antecedentes de principios de Rubén (La Maceta de Groot): "files as skills" (router + carga incremental de contexto), loops con estado y detección de repetición, "SQL-first" (persistir y contrastar antes de interpretar), "runtime sobre modelo" (el poder está en la composición de prompts/permisos/herramientas/memoria, no en el modelo individual).

Lo que **no** está documentado en ningún sitio de este ecosistema: la arquitectura concreta de esta última generación de Argos (motor de grafo, algoritmo de las 7 tareas paralelas, criterio de promoción a canon, métricas de recuperación). Solo tenemos su fenomenología externa vía las capturas de esta semana.

## Comparativa

| | Odysseus | Argos | Thousand Sunny |
|---|---|---|---|
| Naturaleza | Producto local terminado (interfaz, agentes, MCP, memoria persistente) | Arquitectura personal de digestión de memoria | Sistema operativo humano-IA (tripulación, autoridad, compuertas) |
| Fortaleza actual | Plataforma general desplegable | Arquitectura integrada de trabajo, memoria y delegación; Melampo madura como ciclo de digestión bajo gates y validación humana | Gobierno semántico: procedencia, certeza, autoridad humana, checkpoints append-only, separación simulación/propuesta/autoridad |
| Punto débil relativo | — | Autoridad y gobierno no visibles desde fuera | No existe todavía un único motor continuo de captura→clasificación→enlace→consolidación→recuperación |

## La diferencia central

Argos tiene más integrada la arquitectura de trabajo, memoria y delegación, con Melampo todavía madurando dentro de ella. Thousand Sunny posee órganos equivalentes, pero aún debe integrarlos en un circuito único y fiable.

## Piezas que le faltan a Sunny para integrar su metabolismo en un circuito único y fiable

1. **Sustrato común** — almacén único de nodos, relaciones, procedencia, temporalidad y estado canónico.
2. **Melampo propio** — ciclo nocturno que ingiera solo fuentes autorizadas, deduplique, descubra familias y proponga enlaces sin canonizar automáticamente.
3. **Orquestador concurrente** — colas y trabajadores especializados (Robin, Chopper, Nami...) con bloqueo, reanudación, idempotencia y trazas.
4. **Recuperación operativa** — que los enlaces mejoren una misión real y se pueda medir qué recuerdo se recuperó, por qué, con qué evidencia.

Hoy Sunny tiene partes de (1) completas, prototipos separados de (2), contratos para (3), y (4) todavía no demostrado de extremo a extremo.

## Siguiente paso propuesto (no ejecutado)

No otro documento arquitectónico: un **Melampo mínimo del Sunny**, corriendo sobre un corpus public-safe pequeño, cerrando el circuito completo una vez:

```
entrada autorizada
  → extracción de semillas
  → relaciones propuestas
  → revisión Robin/Chopper
  → promoción o compost
  → recuperación durante una misión
  → evidencia en Bitácora
```

Y repitiéndolo cada noche.

## Pedido sugerido para Rubén (no enviado)

> Para poder comparar Argos con Thousand Sunny sin inventarnos cómo funciona: ¿nos pasás un esquema public-safe de esta versión? Con cinco cosas basta — componentes, flujo de ingestión, qué hace Melampo, cómo coordinás las 7 tareas, y qué criterio promueve algo de sustrato a canon. No hace falta código, corpus, rutas, tokens ni configuración privada.
