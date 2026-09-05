# Contrato de conectores read-only V1

Cada conector produce una observación con estos campos mínimos:

```text
id
label
role
status: healthy | degraded | unknown | unavailable
authority
coverage
freshness
observed[]
excluded[]
error?
authorityEffect: none
```

## Invariantes

1. El Monitor no escribe en ninguna fuente observada.
2. La ausencia de una fuente degrada su tarjeta, no invalida el resto.
3. `unknown` expresa falta de cobertura; no equivale a fallo.
4. No se infiere memoria completa desde recuentos o presencia de archivos.
5. No se abren `NEM`, `CLI`, material clínico ni conversaciones históricas.
6. Los snapshots locales muestran su propia frescura.
7. La respuesta global declara siempre `completeness: unknown` y
   `authorityEffect: none`.

## Frontera de ejecución

El botón de actualización relee el endpoint del Monitor. No ejecuta el colector,
no arranca Rocket, no actualiza Git y no absorbe datos. La renovación de los
snapshots es una operación local explícita mediante `connectors:refresh`.
