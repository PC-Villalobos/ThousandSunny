# Funcion de sueno - contrato para rutina cloud

Ejecuta el ciclo de sueno sobre la memoria compartida disponible en el workspace.

Comando recomendado si existe Node.js:

```bash
node state/funcion_de_sueno/funcion_de_sueno.mjs --config state/funcion_de_sueno/sleep_config.repo.json --actor cloud --role Nami --cloud-request
```

Objetivo:

- No producir narrativa nueva como verdad canonica.
- Auditar coherencia, deltas, enlaces y atractores.
- Rotar el actor por roles para evitar fusion con un personaje.
- Dejar reporte y eventos en `state/funcion_de_sueno/reports`.
- Si el entorno no permite ejecutar Node, leer `state/funcion_de_sueno/FUNCION_DE_SUENO_FASES.md` y producir manualmente un reporte siguiendo las mismas fases.

Root esperado en cloud: raiz del repo `pc-villalobos/thousandsunny`.
Actor/Rol recomendado: cloud / Nami.
