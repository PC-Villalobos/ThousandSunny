# RETOMAR - Cold Start Metatron Gestation

Este archivo permite retomar Metatron desde una conversacion nueva con Codex, Antigravity o Claude Code sin depender del historial del chat anterior.

## Uso

Pega esta linea al iniciar:

`Lee state/metatron/RETOMAR.md y retoma Metatron desde ahi.`

Si el agente tiene acceso local a la boveda, puede usar tambien:

`G:\Mi unidad\00_BOVEDA_NEXUS\RETOMAR.md`

## Estado Actual

```json
{
  "current_wave": 8,
  "next_wave": 8,
  "last_mode": "Plan",
  "last_batch_id": "OBS-BATCH-0020-GESTATION-WAVE8-20260524",
  "max_files": 0,
  "total_notes_materialized": 197,
  "source_mutations": 0,
  "sealed": false,
  "manifest": null,
  "verification": null,
  "pending": "WP-010 collection. Wave8 no tiene candidatos; recolectar corpus elegible antes de reintentar Plan. Mirror bloqueado sin GO C0."
}
```

## Archivos A Leer

1. Estado vivo local: `G:\Mi unidad\00_BOVEDA_NEXUS\_meta\config\metatron_gestation_waves.state.json`
2. Resumen saneado versionado: `state/metatron/METATRON_GESTATION_STATE.md`
3. Mapa de tejidos local: `G:\Mi unidad\00_BOVEDA_NEXUS\_meta\manifiestos\gastrulation_fate_map.md`

## Reglas

- Plan no materializa notas.
- Mirror requiere GO C0 explicito.
- P6, purga, borrado y sellado requieren GO C0 explicito.
- `source_mutations` debe permanecer en 0.
- NEM, CAR, ISM y CLI quedan fuera de automatizaciones.
- No versionar artefactos completos de `G:\...` ni `.gemini\...`.
- No predecir IDs de Bitacora: registrar en GAS, releer `bitacora_desde` y anotar el ID real. Si no se puede confirmar, usar `bitacora_id: null`.

## Cierre De Wave

1. Verificar state, plan/manifest/verification, notas fisicas y lock.
2. Confirmar `source_mutations=0`.
3. Si hay Mirror, actualizar mapa de gastrulacion y ejecutar validador.
4. Crear manifiesto local de cierre si aplica.
5. Registrar en GAS y recuperar ID real por relectura.
6. Actualizar `RETOMAR.md`.
7. Actualizar `state/metatron/METATRON_GESTATION_STATE.md`.
8. Commit/push solo de resumen saneado.

Ultima actualizacion: 2026-05-24 por Usopp/Codex.
