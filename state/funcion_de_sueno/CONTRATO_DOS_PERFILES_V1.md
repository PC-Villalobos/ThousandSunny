# Funcion de Sueno — contrato comun y dos perfiles

Estado: contrato tecnico versionado

Fecha: 2026-09-02
GO: `GO_FUNCION_SUENO_PORTAR_CONTRATO_AL_CANON_Y_DECLARAR_DOS_PERFILES_V1`

## Una referencia de codigo, dos despliegues

`state/funcion_de_sueno/` es la referencia versionada del codigo. Hipatia Local /
Bitacora JSONL sigue siendo la autoridad operacional. Ningun reporte, ledger,
workflow o perfil adquiere autoridad por estar en el repositorio.

La implementacion de referencia de este contrato es
`funcion_de_sueno.mjs` + `role_assignment.mjs`, que usa el workflow nocturno.
`funcion_de_sueno.py` permanece como motor auxiliar historico y no implementa
todavia este contrato de identidad; ningun perfil v1 debe invocarlo. Portarlo o
retirarlo exige una decision separada.

El mismo contrato puede ejecutarse en dos ambitos sin mezclar su estado:

| Perfil | Ambito | Estado y ledger | Identidad declarada |
|---|---|---|---|
| `repo-github-actions` | `state/` del repo | versionados en este directorio | `thousandsunny-repo / github-actions / deterministic-sleep-engine / Groot` |
| `groot-local-full-corpus` | corpus local completo | externos al repo, conservados en su despliegue | `groot-local-full-corpus / codex-local-cron / deterministic-sleep-engine / Usopp`; supervisor `gpt-5.6-terra` |

La forma mecanica completa vive en `sleep_profiles.v1.json`. El segundo perfil
queda declarado, no verificado por el repositorio: su disponibilidad y su raiz se
comprueban localmente antes de cada ciclo.

## Identidad

- `scope_id`: ambito del estado y del ledger. Impide sumar historiales de perfiles distintos.
- `executor`: infraestructura que inicia materialmente el ciclo.
- `actor`: componente que ejecuta el contrato determinista.
- `role`: papel operativo declarado para esa corrida.
- `supervisor_model`: modelo que supervisa u orquesta, si existe. No sustituye al actor.

Los cuatro primeros campos son obligatorios. `scope_id` puede proceder de la
configuracion versionada del perfil; no hay un valor global por defecto. Cambiar
solo `supervisor_model` no constituye rotacion del actor ni del rol.

## Repeticion no es fusion

El motor registra dos medidas:

- `execution_streak`: ejecuciones consecutivas con el mismo
  `scope_id / executor / actor / role`;
- `day_streak`: fechas UTC distintas cubiertas por esas ejecuciones consecutivas.

Al alcanzar el umbral de dias se emite `repeated_role_assignment`, severidad
`medium`. Es una observacion tecnica. No demuestra fusion identitaria. El anillo
solo ofrece `next_candidate_role`; `rotation_decision` siempre queda
`human_required`.

## Historia y corte

Los historiales existentes no se migran, reescriben ni fusionan. Las entradas
anteriores que no contienen el contrato completo quedan preservadas y se cuentan
como `legacy_entries_excluded` al calcular la nueva repeticion. La primera corrida
de cada perfil bajo v1 inicia por tanto una serie comparable nueva dentro de su
propio ledger.

## Fronteras de este cambio

- No ejecuta un ciclo real ni modifica los historiales existentes.
- No rota roles ni actores.
- No absorbe un perfil en el otro.
- No convierte el ledger del repo en autoridad operacional.
- No demuestra que los dos motores desplegados ya compartan el mismo binario.
- No declara paridad del contrato con el motor Python auxiliar.
