# Cierre tecnico — contrato comun y dos perfiles

GO: `GO_FUNCION_SUENO_PORTAR_CONTRATO_AL_CANON_Y_DECLARAR_DOS_PERFILES_V1`

Fecha: 2026-09-02
Estado: `contract_ported_two_profiles_declared`

## OBSERVADO

- La rama remota por defecto `claude/franky-feature-O1BkB` resolvio a
  `4219406dcdfb4f1e0d74bad35b6cf844f615cfe1` antes de crear el worktree limpio.
- El checkout de trabajo se aislo en la rama local
  `codex/sueno-two-profiles-v1`; no se modifico el checkout preexistente y sucio.
- `funcion_de_sueno.mjs` usa ahora el contrato puro de `role_assignment.mjs`.
- `scope_id`, `executor`, `actor` y `role` son obligatorios. El perfil repo fija
  `scopeId` en su configuracion versionada; sin CLI ni configuracion, la ausencia
  termina con codigo 1 antes de escanear o escribir.
- `supervisor_model` es opcional y no sustituye al actor.
- La senal vigente es `repeated_role_assignment`, severidad `medium`. Registra
  `execution_streak` y `day_streak`; la salida de rotacion permanece
  `human_required` y el anillo solo ofrece `next_candidate_role`.
- `sleep_profiles.v1.json` declara dos perfiles con `scope_id`, estado y ledger
  distintos: `repo-github-actions` y `groot-local-full-corpus`.
- Simulacion pura contra los estados existentes: el perfil repo conserva 82
  entradas historicas y el local 42. Todas carecen del contrato completo y quedan
  como `legacy_entries_excluded`; cada serie comparable nueva comienza en 1.
- Pruebas Node: 30/30 en verde. Incluyen identidades obligatorias, separacion de
  perfiles, ejecuciones frente a dias UTC, ausencia de afirmacion de fusion,
  decision humana y costura degradable con Hipatia.
- Los JSON de configuracion, perfiles y paquete parsean correctamente; `git diff
  --check` no detecta errores.
- Los historiales no cambiaron:
  - `sleep_state.json` SHA-256
    `9b37340c298ae000a1851aa531d983542c39a4d5b2d4bec0a8447b13bd32e1a8`.
  - `sleep_ledger.jsonl` SHA-256
    `37d8bc9ce481e6aff4d04b08c1965f3e6de723517a72643fad5b3637a40279d9`.
- No se ejecuto ningun ciclo real ni hubo POST a Hipatia, GAS u otro servicio.

## INFERIDO

- En la proxima corrida versionada, las 82 entradas historicas seguiran visibles
  pero no inflaran la nueva serie comparable: el corte por contrato es explicito.
- Separar `supervisor_model` evita que un cambio de modelo supervisor se presente
  como rotacion del componente determinista.
- El workflow existente ya carga `sleep_config.repo.json`; declarar alli
  `scopeId=thousandsunny-repo` activa el contrato sin modificar el workflow.

## NO DEMOSTRADO

- El perfil local aun no ejecuta el binario versionado; el manifiesto lo declara
  como `declared_not_verified_by_repository`.
- No hay paridad declarada con `funcion_de_sueno.py`, que queda como motor auxiliar
  historico fuera de los dos perfiles v1.
- La suite Python de linea base queda en 80/81 en Windows por un fallo preexistente
  de codificacion de consola (`ñ` observado como `�`) en
  `test_mismo_json_canonico`; no fue causado ni reparado por este GO.
- No se ha desplegado el workflow, abierto PR, fusionado ni cambiado la autoridad
  operacional.

## Siguiente GO minimo

Revisar humanamente el diff y decidir si se publica la rama. Un GO posterior y
separado debe desplegar el perfil local desde la referencia versionada o retirar
su copia divergente; no se hace por inferencia.
