# Como programar la Funcion de Sueno en la nube (Routines)

Objetivo: que el sueno nocturno corra **solo, en la nube, con el equipo apagado**,
y que ademas pueda dispararse por webhook cuando algo cambia o se cierra una
sesion. Esto NO requiere montar cron/systemd ni un servidor de webhook propio.

> **Fuente de verdad.** El canon operativo vive en el repo
> (`state/funcion_de_sueno/`): es lo que la Routine clona y ejecuta, y la unica
> copia que la nube puede leer. El doc del vault local
> (`CLAUDE_CODE_ROUTINES_NATIVE.md`) debe quedar como **puntero** a este
> directorio y a PR #18, no como una segunda version en paralelo.

## La idea en una frase

Una **Routine** de Claude Code = un prompt guardado + repos + conectores, que
corre en la infraestructura de Anthropic. Trae tres disparadores; usa los que
necesites en una sola rutina:

| Lo que querias            | Disparador nativo de Routine | Notas |
|---------------------------|------------------------------|-------|
| Sueno nocturno completo   | **Schedule** (nightly)       | cron, minimo 1 hora. Hora local -> UTC automatico. |
| Reflejo por webhook        | **API** (endpoint `/fire` + token Bearer) | Reemplaza tu `webhook_sueno.py`. POST con campo `text`. |
| Reaccion a cambios en repo | **GitHub event** (PR/release)| p.ej. PR mergeado que toca `state/`. |

Mapa de tus `event_type` -> disparador:
- `daily_tick`     -> Schedule nightly.
- `session_closed` -> API `/fire` (tu herramienta hace el POST al cerrar sesion).
- `memory_changed` -> GitHub event (PR sobre `state/`) **o** API `/fire`.
- `manual_run`     -> boton **Run now** o API `/fire`.

## IMPORTANTE: donde se crea

`/schedule` esta **oculto dentro de una sesion de Claude Code en la web** (como
esta). Crea la rutina desde:

- **Web UI:** https://claude.ai/code/routines  ->  *New routine*  (recomendado:
  permite los 3 disparadores), **o**
- **Terminal local / Desktop:** `/schedule` (la CLI crea solo el disparador
  Schedule; API y GitHub se anaden luego en la web).

Requisitos: plan Pro/Max/Team/Enterprise con Claude Code on the web; login de
claude.ai (no API key); GitHub conectado al repo `ThousandSunny`. Para el
disparador GitHub hace falta la **Claude GitHub App** instalada en el repo (el
asistente de la web te lo pide).

## Paso a paso (Schedule nocturno)

1. https://claude.ai/code/routines -> **New routine**.
2. **Nombre:** `Funcion de sueno nocturna`.
3. **Prompt:** pega el bloque "PROMPT DE LA RUTINA" de mas abajo.
4. **Repositories:** anade `ThousandSunny`. (La rutina clona desde la rama por
   defecto y crea ramas `claude/...`.)
5. **Environment:** *Default* (red **Trusted**) basta para leer/escribir el repo
   y abrir el PR. Para que el sueno escriba la **Bitacora GAS** con el equipo
   apagado:
   - en el environment anade dos **secretos**: `BITACORA_GAS_URL` (el `/exec` del
     web app) y `BITACORA_GAS_TOKEN` (token compartido). Nunca van en el repo.
   - Network access -> **Custom** -> permite `script.google.com` y
     `script.googleusercontent.com` (marca tambien la lista por defecto de
     gestores de paquetes para no perder el acceso a registries).
   Si no defines `BITACORA_GAS_URL`, el bloque de bitacora queda en el parte como
   respaldo y no se pierde nada. Endurecimiento del GAS (token): seccion de abajo.
6. **Trigger:** *Schedule* -> *Daily*. Hora local, p.ej. **03:09**. (Para un cron
   exacto: crea la rutina y luego `/schedule update` desde la terminal local.)
7. **Create.** Pulsa **Run now** una vez para probar; revisa el PR que deja.

Limite de corridas/dia por cuenta: Pro 5, Max 15, Team/Enterprise 25. Una rutina
nocturna = 1/dia.

## PROMPT DE LA RUTINA (pegar en Instructions)

```
Eres Nami ejecutando la Funcion de Sueno nocturna del Thousand Sunny.

Repositorio: ThousandSunny (ya clonado). La memoria compartida vive en state/.
NO uses rutas tipo C:\... (no existen en la nube): usa rutas relativas del repo.

1. Lee primero, en este orden:
   - .claude/skills/sueno/SKILL.md            (procedimiento completo)
   - state/funcion_de_sueno/FUNCION_DE_SUENO_spec.md
   - state/funcion_de_sueno/sleep_ledger.jsonl   (si existe)
   - state/funcion_de_sueno/sleep_state.json     (si existe)

2. Ejecuta el skill /sueno con event=daily_tick (ciclo completo N1,N2,N3,REM)
   sobre root=state, actor=claude-code, role=Nami.

3. Respeta TODOS los guardrails del skill (metadata-only para fuentes sensibles,
   sin mutar fuentes salvo los archivos de la propia funcion, sin canon nuevo,
   sin cerrar deriva sin evidencia, rotacion actor/rol a los 3 ciclos).

4. Salida:
   - Escribe el parte en state/funcion_de_sueno/reports/SLEEP_<fecha>.md
   - Anexa una linea a state/funcion_de_sueno/sleep_ledger.jsonl
   - Reescribe state/funcion_de_sueno/sleep_state.json
   - Abre un PR borrador con el parte (rama claude/sueno-<fecha>): ese es el
     "parte legible al despertar".
   - Si hay deriva significativa, registra la Bitacora GAS segun el skill: si
     BITACORA_GAS_URL esta en el entorno, POSTea; si no, deja el bloque en el
     parte (nakama=Usopp, tema=caso0, mensaje=...).

Corre de forma autonoma; no pidas confirmacion.
```

## Variante para API / GitHub (reflejo rapido)

Misma rutina, anade otro trigger (en la web: *Add another trigger*). Cambia el
paso 2 del prompt por:

```
2. Si recibes un texto de evento (payload del trigger), usalo para fijar
   event=<session_closed|memory_changed|manual_run> y las fases segun la tabla
   del skill. Si no hay texto, usa event=daily_tick.
```

### Disparar por API (curl)

Tras anadir el trigger **API** en la web y generar el token (se muestra una sola
vez), dispara asi:

```bash
curl -X POST https://api.anthropic.com/v1/claude_code/routines/<ROUTINE_TRIGGER_ID>/fire \
  -H "Authorization: Bearer <TOKEN>" \
  -H "anthropic-beta: experimental-cc-routine-2026-04-01" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"text": "event_type=session_closed; actor=claude-code; role=Nami; resumen=..."}'
```

Devuelve el `claude_code_session_url` para ver la corrida. El `text` llega como
**texto literal** al prompt (no se parsea como JSON), por eso arriba va como
clave=valor legible.

## Enganche seguro a Bitacora GAS (PuenteDeMando)

El endpoint `/exec` del GAS es **publico y sin autenticar** por defecto: cualquiera
con la URL puede escribir tu bitacora (y disparar lo que exponga `?action=`). Antes
de meterlo en la nube, ponle un token compartido:

1. En el editor de Apps Script: **Configuracion del proyecto -> Propiedades del
   script** -> anade `COWORK_TOKEN` = `<un secreto aleatorio largo>`.
2. Valida el token al principio de tu `doGet`/`doPost`:

   ```javascript
   function doGet(e) {
     var p = (e && e.parameter) || {};
     var expected = PropertiesService.getScriptProperties().getProperty('COWORK_TOKEN');
     if (!expected || p.token !== expected) {
       return ContentService
         .createTextOutput(JSON.stringify({ ok: false, error: 'unauthorized' }))
         .setMimeType(ContentService.MimeType.JSON);
     }
     // ... aqui sigue tu manejo de action=log_cowork ...
   }
   ```
3. En el environment de la Routine guarda `BITACORA_GAS_URL` y `BITACORA_GAS_TOKEN`
   (= ese `COWORK_TOKEN`). El skill `/sueno` los lee del entorno y nunca los
   escribe en el repo.

Asi el sueno puede registrar deriva con el equipo apagado, pero el endpoint deja
de aceptar a cualquiera. La URL que se pego en chat conviene **rotarla** (crear un
nuevo deployment) una vez tenga token.

## Rotacion de actor/rol

El plan de Codex rotaba `--model` por dia par/impar. En Routines el modelo es fijo
por rutina (lo eliges en el selector del prompt). Opciones honestas:

- **Recomendada (simple):** una sola rutina con modelo fijo; el skill vigila la
  racha en el ledger y **recomienda** rotacion en el parte cuando `streak >= 3`.
  Tu cambias el modelo a mano en el formulario cuando lo avise.
- **Rotacion real automatica:** dos rutinas nocturnas en dias alternos (una L-X-V,
  otra M-J-S) con modelos distintos. Mas corridas/dia consumidas, pero el actor
  cambia solo.

## Que NO necesitas del kit anterior

`deploy/cron/*.sh`, `deploy/webhook/webhook_sueno.py` y el workflow de GitHub
Actions resolvian "nube siempre-encendida" a mano. Con Routines son redundantes
para esta via. (GitHub Actions sigue siendo valido solo si algun dia quieres la
via 100% determinista en Python sin razonamiento de Claude; es otra via.)
