# Cierre de arco — 2026-10-18

**ARCO:** La pantalla del estado del barco, su contrato, Windows de verdad y la custodia de 1.a
**FECHA:** 2026-10-18
**DURACION APROX:** tres dias de calendario (2026-10-16 → 2026-10-18), con el grueso el 18
**ACTOR:** Claude Code (sesion cloud) — como Nami, navegante
**ROL:** Navegante

## Estado de este cierre: abierto

El cierre documental **no esta completo**. Este fichero es su parte narrativa, y faltan tres cosas:

- **Fusionarlo.** Hasta que el Capitan lo fusione, no esta en el tronco y la siguiente sesion no lo
  lee.
- **Volcarlo al sumidero del hub.** Desde cloud no es alcanzable; lo tiene que espejar otro actor.
- **Registrarlo en `closure_records.jsonl`.** No esta en este arbol y su cadena de hash no se
  escribe a ciegas.

El aviso a la Bitacora GAS ya salio, pero solo es un resumen que apunta a este fichero. No sustituye
nada de lo anterior.

## Por que este fichero existe

El sumidero canonico (`thousand-sunny-hub`) sigue sin ser alcanzable desde cloud:
`SUNNY_HUB_PATH` no esta definido en este contenedor. Este fichero es el registro narrativo en
`state/cierres/`, como en los cierres del 2026-07-25, 2026-07-26 y 2026-10-16.

**Novedad respecto al cierre del 2026-10-16:** este entorno si tiene `BITACORA_GAS_URL` y
`BITACORA_GAS_TOKEN`. El resumen compacto se envia a la Bitacora GAS con `action=log_cowork`; el
resultado consta en el cuerpo del PR que trae este fichero, no aqui, porque este fichero se
escribe antes del envio. Lo que sigue sin hacerse: `guardias-nami/` y la auto-memory de la maquina
del Capitan no existen en cloud, y `closure_records.jsonl` no se escribe a ciegas.

## Completado

Todo lo de esta lista esta en el tronco `claude/franky-feature-O1BkB`, cabeza `47d8dee`.

| PR | Commit de fusion | Que |
|---|---|---|
| #119 | `440945d` | `scripts/preservar.mjs`: custodia de trabajo que solo vive en un disco |
| #120 | `5fc030d` | A3 con Hipatia viva: la senal llegaba vacia y no se veia |
| #121 | `989568d` | `test:estado`: ninguna prueba de `state/` se queda sin correr |
| #122 | `6f4b1f5` | Rectificacion del cierre del 2026-07-25 y arreglo del guardia |
| #123 | `71689c1` | Hipatia: el vault de Obsidian pasa a ser espejo opcional |
| #124 | `b803870` | `/estado` (afirmaciones con prueba verificada) y `cubierta/openapi.json` |
| #125 | `d05c4a0` | Windows: la Bitacora carga (`pathToFileURL`) y las suites salen limpias |
| #126 | `f9002fc` | Una sola pantalla de estado, con el diseno de Figma sobre datos reales |
| #127 | `1d2dd34` | 1.a cumplida: `cubierta-world` en custodia privada, derivado provisional; `--remoto` obligatorio |
| #128 | `47d8dee` | La prueba de paridad del sueno lee la salida de Node como UTF-8 |

**Windows, verificado por otro agente en la maquina del Capitan**, no supuesto desde Linux:

- #125: `npm test` en exit 0 tras los dos fallos que solo Windows mostraba.
- #127: el primer intento pasaba 13 de 14. La prueba nueva construia la ruta con
  `URL.pathname`, que en Windows da `/C:/...`. Corregido con `fileURLToPath`; 14 de 14 en copia
  limpia.
- #128: entorno real `cp1252`, modo UTF-8 desactivado y sin variables que lo fuercen. La version
  anterior falla con la `ñ`; el arreglo pasa 3 de 3 y `npm test` termina en exit 0.

**Tronco al cierre:** `npm test` en exit 0 aqui y en Windows. Quedan dos pruebas de
`state/hipatia_bridge_runtime/` declaradas «sin configuracion», con su motivo.

## Pendiente (hereda al siguiente hilo)

1. **Esperas abiertas en `/estado`**, todas del Capitan:
   - A5: completar A1-A4 en su maquina sin copiar un mensaje entre Claude y Codex. Solo el puede
     medirlo.
   - Desplegar en su Hipatia el vault opcional (#123): `sync_to_local.ps1 -Apply`. Ningun agente
     lo ejecuta.
   - #117, el Encargo: aterrizarlo en la Cubierta o no. Sigue abierto y sin fusionar.
   - La capsula de contexto v1: si es la base de los arneses de contexto.
2. **Abrir `/estado` en su PC con Hipatia viva** para ver A3 en verde con sus propios ojos.
3. **Borrar la rama `codex/ui-estado-figma`.** El proxy de cloud devolvio 403; tiene que hacerlo
   el Capitan.
4. **Cambios sin commitear en `agent/cubierta-not-recorded-preview`**, en su clon local. Si hay que
   conservarlos, el destino es la custodia privada, con `--remoto` explicito.
5. **La revision de la interfaz con el colaborador del puente de Figma.** Es del Capitan.
6. **Volcar este cierre al sumidero** del hub, si otro actor con acceso al hub lo espeja.
7. **Actualizar el skill `cierre-de-arco`** a la topologia actual. Heredado desde el 2026-07-26:
   el skill sigue pidiendo `bitacora-bridge.sh` y `guardias-nami/`.
8. **Siguen vigentes los pendientes de los cierres anteriores** que este arco no toco, entre ellos
   la pregunta del 2026-09-06 sobre la revision adversaria de la persistencia.

## Decisiones tomadas

- **`/estado` separa afirmacion y prueba.** El registro se escribe a mano y el servidor verifica
  cada prueba citada contra el arbol y git en cada peticion. El estado tecnico y lo que espera al
  Capitan son campos distintos, y una decision lleva al menos dos alternativas.
- **El contrato HTTP de la Cubierta es OpenAPI 3.1, y lo fija una prueba en los dos sentidos.**
  Una ruta nueva sin contrato hace fallar la prueba, y tambien un contrato que describe una ruta
  inexistente.
- **`cubierta-world` es derivado provisional de `cubierta/`.** No se integra y conserva su
  procedencia en custodia privada. Lo que haga falta de ella entra limpio, en un PR propio.
- **`preservar.mjs` no tiene destino por defecto.** El repo es publico, asi que el destino nunca
  sale de una omision.
- **El trabajo privado no entra en este repo publico.** Ni el material editorial revisado en este
  arco ni la custodia de `cubierta-world`: el registro no nombra el repo privado ni las areas
  protegidas.

## Contexto para la siguiente Nami

- **El tronco es `claude/franky-feature-O1BkB`, cabeza `47d8dee`.** La rama de trabajo de esta
  sesion se reinicia desde el tronco despues de cada fusion.
- **`/estado` es la vista del Capitan** (`cubierta/estado/registro.json`). Se cambia la
  afirmacion con su prueba, nunca la pagina para que diga mas.
- **Windows no se supone desde Linux.** Rutas con `fileURLToPath` y `pathToFileURL`. En Python,
  `encoding="utf-8"` en todo `subprocess` en modo texto: la busqueda completa del 2026-10-18 no
  encontro ninguna llamada sin el.
- **Para buscar en codigo, el arbol sintactico, no el grep por lineas**, cuando el argumento puede
  estar en la linea siguiente.
- **Las salidas de otros agentes llegan pegadas en el chat.** Son informacion que hay que cotejar:
  en este arco Codex acerto las dos veces, y aun asi se verifico antes de actuar.

## Handoff

- **contexto:** Del 16 al 18 de octubre: `/estado` y su contrato OpenAPI, A3 con Hipatia viva, el
  vault de Obsidian opcional, los arreglos de Windows verificados en la maquina del Capitan y la
  custodia de 1.a. Diez PR, de #119 a #128, fusionados en el tronco hasta `47d8dee`.
- **decision:** `cubierta-world` queda como derivado provisional en custodia privada. `preservar.mjs`
  exige `--remoto`. Se fusiona solo lo verificado en Windows.
- **continuidad:** Ocho pendientes en la lista de arriba; los cinco primeros son del Capitan o de
  su maquina. El propio cierre sigue abierto: ver «Estado de este cierre» al principio.
- **session_ref:** sesion cloud de Claude Code, 2026-10-16 a 2026-10-18. El enlace es privado y no
  se publica en este repo.
