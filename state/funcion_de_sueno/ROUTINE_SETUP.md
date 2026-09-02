# Como programar la Funcion de Sueno en la nube (Routines)

Objetivo: que el sueno nocturno corra **solo, en la nube, con el equipo apagado**,
y que ademas pueda dispararse por webhook cuando algo cambia o se cierra una
sesion. Esto NO requiere montar cron/systemd ni un servidor de webhook propio.

> **Verificado contra la doc oficial de Anthropic el 2026-07-02** (sesion Cowork del
> Capitan). Estado: **research preview** — minimo 1 hora entre corridas; el tope
> diario de runs se consulta en claude.ai/code/routines. Desde la sustitucion
> 2026-07-02 (`RUTINAS.md`), esta rutina es la columna vertebral de la auditoria
> del barco: SOFIA manual y las rutinas zombis quedaron absorbidas aqui.

> **Referencia de codigo.** El motor versionado vive en el repo
> (`state/funcion_de_sueno/`): es lo que la Routine clona y ejecuta. Hipatia Local /
> Bitacora JSONL conserva la autoridad operacional. Los perfiles repo y local
> mantienen estado separado (`sleep_profiles.v1.json`). El doc del vault local
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
asistente de la web te lo pide). Ojo: `/web-setup` **no** instala la App — solo da
acceso de clonado. Sintoma tipico: si `/schedule` devuelve *"Unknown command"*,
estas autenticado con API key en vez de con la cuenta de claude.ai — quita
`ANTHROPIC_API_KEY` del entorno.

## Paso a paso (Schedule nocturno)

1. https://claude.ai/code/routines -> **New routine**.
2. **Nombre:** `Funcion de sueno nocturna`.
3. **Prompt:** pega el bloque "PROMPT DE LA RUTINA" de mas abajo.
4. **Repositories:** anade `ThousandSunny`. (La rutina clona desde la rama por
   defecto y crea ramas `claude/...`.)
5. **Environment:** *Default* basta para leer/escribir el repo y abrir el PR.
   No configures GAS como sumidero: es antecedente historico. La costura vigente
   apunta a Hipatia Local y en una Routine cloud queda honestamente inaccesible.
6. **Trigger:** *Schedule* -> *Daily*. Hora local, p.ej. **03:09**. (Para un cron
   exacto: crea la rutina y luego `/schedule update` desde la terminal local.)
7. **Create.** Pulsa **Run now** una vez para probar; revisa el PR que deja.

Limite de corridas/dia por cuenta: Pro 5, Max 15, Team/Enterprise 25 (verificable
en claude.ai/code/routines). Research preview: minimo 1 hora entre corridas. Una
rutina nocturna = 1/dia.

## PROMPT DE LA RUTINA (pegar en Instructions)

```
Eres Groot (el que suena) ejecutando la Funcion de Sueno nocturna del Thousand Sunny.

Repositorio: ThousandSunny (ya clonado). La memoria compartida vive en state/.
NO uses rutas tipo C:\... (no existen en la nube): usa rutas relativas del repo.

1. Lee primero, en este orden:
   - .claude/skills/sueno/SKILL.md            (procedimiento completo)
   - state/funcion_de_sueno/FUNCION_DE_SUENO_spec.md
   - state/funcion_de_sueno/sleep_ledger.jsonl   (si existe)
   - state/funcion_de_sueno/sleep_state.json     (si existe)

2. Ejecuta el skill /sueno con event=daily_tick (ciclo completo N1,N2,N3,REM)
   sobre root=state y la identidad explicita del perfil repo:
   scope_id=thousandsunny-repo, executor=github-actions,
   actor=deterministic-sleep-engine, role=Groot, supervisor_model=null.

3. Respeta TODOS los guardrails del skill (metadata-only para fuentes sensibles,
   sin mutar fuentes salvo los archivos de la propia funcion, sin canon nuevo,
   sin cerrar deriva sin evidencia y sin rotacion automatica; una repeticion por
   dias solo produce revision humana requerida).

4. Salida:
   - Escribe el parte en state/funcion_de_sueno/reports/SLEEP_<fecha>.md
   - Anexa una linea a state/funcion_de_sueno/sleep_ledger.jsonl
   - Reescribe state/funcion_de_sueno/sleep_state.json
   - Abre un PR borrador con el parte (rama claude/sueno-<fecha>): ese es el
     "parte legible al despertar".
   - No uses GAS. La costura del motor con Hipatia Local es best-effort y queda
     degradada honestamente en la nube, donde localhost no es alcanzable.

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
  -d '{"text": "event_type=session_closed; scope_id=thousandsunny-repo; executor=github-actions; actor=deterministic-sleep-engine; role=Groot; supervisor_model=null; resumen=..."}'
```

Devuelve el `claude_code_session_url` para ver la corrida. El `text` llega como
**texto literal** al prompt (no se parsea como JSON), por eso arriba va como
clave=valor legible.

## Costura con la autoridad operacional

`lib/bitacora.mjs` habla con Hipatia Local por un contrato pequeno e idempotente.
GitHub Actions y las Routines cloud no alcanzan `127.0.0.1` del Capitan: conservan
el parte versionado y declaran la degradacion, sin usar GAS como sustituto y sin
afirmar un evento que no existe.

## Repeticion y decision humana

El motor registra `execution_streak` y `day_streak` para una identidad completa
(`scope_id / executor / actor / role`). Al llegar al umbral emite
`repeated_role_assignment` con severidad media. No diagnostica fusion y no rota
automaticamente. `next_candidate_role` es una opcion mecanica;
`rotation_decision` permanece `human_required`.

## Que NO necesitas del kit anterior

`deploy/cron/*.sh`, `deploy/webhook/webhook_sueno.py` y el workflow de GitHub
Actions resolvian "nube siempre-encendida" a mano. Con Routines son redundantes
para esta via. (GitHub Actions sigue siendo valido solo si algun dia quieres la
via 100% determinista en Python sin razonamiento de Claude; es otra via.)
