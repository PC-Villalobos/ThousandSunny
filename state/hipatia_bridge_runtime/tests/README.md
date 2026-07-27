# Pruebas

Los archivos copiados desde `scripts/` conservan exactamente sus bytes y sus
hashes en `deploy/runtime-manifest.json`.

`run_portable.ps1` ejecuta únicamente:

- el contrato puro de eventos e idempotencia de `test_bitacora_v1_1.py`;
- la integridad, confinamiento y exclusiones de `test_projection_manifest.py`.

Las restantes pruebas históricas son integraciones con raíces y repositorios
locales declarados en los archivos operativos `config/*.json`. Esa configuración
local no se versiona. Por ello se conservan como evidencia reproducible del
runtime, pero no se ejecutan automáticamente desde la proyección ni se inventan
configuraciones sustitutas.

Su ejecución contra una instancia operativa requiere un GO propio porque algunas
pruebas generan registros de operación en los almacenes configurados.
