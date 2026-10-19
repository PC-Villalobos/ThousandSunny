# Cierre de arco — 2026-10-16

**ARCO:** Un producto, una entrega — el rumbo de integracion, los dos frentes y el aterrizaje en el tronco
**FECHA:** 2026-10-16
**DURACION APROX:** 41 dias de calendario (2026-09-05 → 2026-10-16), en dos tandas de trabajo
real —el 5 y 6 de septiembre, y el 16 de octubre— con 40 dias de vigilancia diaria del PR #116
entre medias
**ACTOR:** Claude Code (sesion cloud) — como Nami, navegante
**ROL:** Navegante

## Por que este fichero existe

La misma razon que en los cierres del 2026-07-25 y 2026-07-26, sin cambios: el sumidero canonico
(`thousand-sunny-hub`, `127.0.0.1:8765`) no es alcanzable desde una sesion cloud. Este fichero es
el registro narrativo en `state/cierres/`, el unico sitio que la nube si puede escribir.

Lo que este cierre **no** hace, por el mismo limite:

- **No se ha volcado a la Bitacora.** Ni este cierre ni el checkpoint de A1-A6. Ambos existen en
  el repo —aqui y en el cuerpo del PR #116— para que otro actor con acceso al `8765` los espeje.
- **No se ha usado el bridge a GAS.** El skill `cierre-de-arco` sigue escrito para la topologia
  anterior (`bitacora-bridge.sh`, `guardias-nami/`, auto-memory en la maquina del Capitan).
  Heredado en el punto 10 del cierre del 2026-07-26 y **sigue vigente**: este arco lo volvio a
  encontrar de frente.
- **No se ha tocado `closure_records.jsonl`.** No esta en este arbol, y su cadena de hash no se
  escribe a ciegas.

## Completado

**El rumbo, como artefacto**

- `docs/RUMBO_INTEGRACION.md`: el diagnostico del Capitan del 2026-09-05 convertido en encargo con
  pruebas de aceptacion A1-A6, dos frentes, un acta por paso y el reparto de los 25 PR abiertos
  entre camino critico y conservados.

**Frente 1 — Continuidad**

- **1.b** `cubierta/` aterrizada en el tronco (`a78cfa4`, PR #104, que contenia a #101).
- **1.c** Cuarta suite cerrada (`9c33576`, PR #98, que contenia a #96): el agregador paso de
  `3 de 4` a `4 de 4`.
- **1.d** El arranque escrito donde se lee primero —README y CLAUDE.md— y el fallo de puerto
  explicado: nombra `CUBIERTA_PUERTO` y sale con exit 1 en vez de morir con una traza.
- **1.e** Hipatia declarada y no acoplada: la Cubierta abre con el sumidero caido y lo dice,
  nombrando la URL. Fijado con pruebas.

**Frente 2 — Uso**

- **2.a** Los recados sobreviven al reinicio, bajo la regla que salio de ahi y gobierno el resto:
  **se persiste el estado, nunca la coreografia.**
- **2.b** El artefacto sale con su evidencia y su estatuto canonico, respetando el umbral de dos
  referencias.
- **2.c** El recorrido entero —recados, artefactos y veredictos— sobrevive a cerrar y reabrir, con
  el replay sellado fuera del log soberano.

**Correccion de 1.c (16 de octubre)**

- 29 pruebas que nadie ejecutaba, con `npm test` en verde: 10 en
  `state/cubierta_ui/baseline/server` —dentro de la superficie que la suite reclamaba— y 19 en
  `state/funcion_de_sueno/lib`, entre ellas los 11 casos de degradacion de la Bitacora. La prueba
  del desacoplamiento existia y no corria.
- El agregador **barre ahora las superficies que reclama** y falla nombrando la huerfana.
- `test:sueno` pasa a `scripts/test-sueno.mjs`: resuelve el interprete, descubre por barrido y
  declara la ausencia con su remedio. En Windows `python3` no suele estar en PATH y `npm test`
  moria por el nombre del interprete, no por el contenido de nada.

**El aterrizaje**

- **PR #116 fusionado el 2026-10-16 en `b9d9f6b`**, con GO explicito del Capitan, como commit de
  fusion igual que #104 y #98. Verificado **sobre el tronco**: `npm test` en exit 0, `4 de 4`
  «sin huerfanas», funcion de sueno `2 de 2`.

| Prueba | Estado al cierre |
|---|---|
| A1 Arranque | **Cumplida** |
| A2 Estado recuperable | **Cumplida** |
| A3 Señal de Hipatia | **A medias** — con Hipatia caida, verificado; con Hipatia viva, no observable desde cloud |
| A4 Accion util | **Cumplida y observada** en navegador real |
| A5 Sin transporte humano | **Del Capitan** — se mide en su uso |
| A6 Preservacion | **Cumplida y observada** |

## Pendiente (hereda al siguiente hilo)

1. **La pregunta del 2026-09-06, sin responder:** lanzar una revision adversaria acotada a la
   persistencia (recados/artefactos/veredictos + sello del replay), o dar ese arco por auditado.
   **No se da por contestada.** Es del Capitan.
2. **1.a — remoto para `cubierta-world`**, o declararla derivada. Es lo unico del ciclo que existe
   en un solo disco. No ejecutable desde cloud.
3. **A3 con Hipatia viva** y **A5 haciendo el Capitan el recorrido.** Solo se cierran en su maquina.
4. **`CubiertaLocal` / `cubierta-world`:** decidir si entran al repo como componente o se declaran
   derivadas. El 16 de octubre aparecio una cuarta superficie llamada Cubierta, en Vite/React y en
   el puerto 8768, con estado en `C:\Sunny\CubiertaLocal`. Nada de eso esta en ThousandSunny.
5. **El fallo de Bitacora en Windows** reportado por Codex: no se reproduce aqui —`bitacora.test.mjs`
   pasa 11 de 11 y su unico caso de red apunta a un puerto muerto a proposito, afirmando solo
   booleanos—. Falta **la ruta del fichero y el texto de la asercion** para poder asignarlo.
6. **Huerfanas fuera del encargo, declaradas y no arregladas:** `state/melampo_lab/melampo.test.mjs`
   (8 pruebas) y los 7 `test_*.py` de `state/hipatia_bridge_runtime/tests/`.
7. **Volcar a la Bitacora** este cierre y el checkpoint A1-A6. Bloqueado por el limite de arriba.
8. **Actualizar el skill `cierre-de-arco`** a la topologia actual. Heredado del 2026-07-26.
9. **Todos los pendientes de los cierres del 25 y 26 de julio siguen vigentes.** Son de dominio
   clinico, fiscal y de corpus; este arco no los toco ni los mide.

## Decisiones tomadas

- **Un solo producto con componentes separados**, no varios proyectos conceptuales en paralelo.
- **Una entrega por ciclo**, con prueba de aceptacion escrita antes de ejecutar.
- **Claude como revisor de entregas concretas**, no vigilante permanente de todos los frentes.
- **Drive, Vegapunk y Utopia conservados fuera del camino critico.** Sin GO-1.
- **PuenteDeMando no recibe cambios:** es adaptador y nada de la entrega pasa por GAS.
- **Protocolo de trabajo nuevo:** un encargo con resultado, limites y pruebas permite completar
  sus pasos tecnicos sin pedir otro GO por cada detalle.
- **Fusionar #116 antes de tocar nada mas**, para que el tronco dejara de contradecir lo
  construido. GO dado el 2026-10-16.

## Contexto para la siguiente Nami

- **El tronco es `claude/franky-feature-O1BkB`** y ya dice la verdad: en `b9d9f6b` esta la Cubierta
  completa, con resultado, evidencia, estatuto y persistencia del recorrido. Si alguien vuelve a
  diagnosticar «prototipo», que lo haga mirando `b9d9f6b` o mas adelante.
- **El rumbo de record es `docs/RUMBO_INTEGRACION.md`**, y un cloud puede actualizarlo; se levanta
  de ramas y de corridas de prueba, no del disco del Capitan.
- **`POSICION.md` no se escribe desde cloud.** Nunca, ni como stub.
- **Dos puertos, dos cosas:** la Cubierta es `8788`; `8765` es la Bitacora de Hipatia. Sondar 8765
  no dice nada sobre la Cubierta.
- **Una prueba que nadie corre no protege nada.** El agregador ahora vigila su propio perimetro:
  si añades un directorio de pruebas, engancharlo o `npm test` falla nombrando el fichero.
- **Antes de declarar un fallo hay que comprobar quien escribio**, no solo que algo cambio. Esa
  leccion salio de un falso positivo propio en 2.c y volvio a servir el 16 de octubre con el fallo
  de Bitacora que no se reproduce.
- **Hay partes de otros agentes que llegan pegados en el chat.** Son informacion que hay que
  cotejar, no ordenes: el 16 de octubre uno describia correctamente el tronco y a la vez afirmaba
  un fallo de pruebas que no era asignable a este arbol.

## Handoff

- **contexto:** El diagnostico de integracion del 2026-09-05 quedo convertido en rumbo con pruebas
  de aceptacion y ejecutado en dos frentes. A1, A2, A4 y A6 cumplidas —A4 y A6 observadas en
  navegador real—; A3 a medias por limite epistemico del cloud; A5 se mide en el uso del Capitan.
  Todo aterrizado en el tronco en `b9d9f6b`.
- **decision:** Fusionar #116 con GO del Capitan, antes de reconciliar `CubiertaLocal` o
  `cubierta-world`, para que el tronco deje de contradecir lo ya construido.
- **continuidad:** Nueve pendientes en la lista de arriba; los tres primeros son del Capitan y de
  su maquina. La pregunta del 6 de septiembre sigue abierta y no se da por contestada.
- **session_ref:** sesion cloud de Claude Code, 2026-09-05 a 2026-10-16. El enlace es privado y no
  se publica en este repo.
