# RUTINAS — capa de programación (cuándo corre cada skill)

> Una **Rutina** es una invocación *programada* de una skill u Operación. La
> **definición** es portable; el **binding** al scheduler es por substrato (scheduler de
> Claude, automations de Codex, triggers de GAS). Esta tabla es el panel de salud:
> de un vistazo se ve qué está vivo y qué está caído.

| Rutina | Invoca | Nakama | Cadencia | Substrato | Salud |
|--------|--------|--------|----------|-----------|-------|
| Barrido diario de cabos | `usopp-barrido` (op-amanecer #2) | 🎯 Usopp | 09:00 | Codex (`~/.codex/automations`) | ✅ activa |
| Sensor de proa | `nami-intake-proa` (op-amanecer #1) | 🧭 Nami | 08:37 | Claude (scheduler) | ⏸ bloqueada — **CABO-011** |
| Resumen Usopp | `usopp-resumen` | 🎯 Usopp | time-based | GAS (`THOUSAND SUNNY v3.0`) | ❌ caída 12–14 jun — *"Authorization is required"* |
| Meditación profunda | `robin-meditacion` | 📚 Robin | semanal / a demanda | Claude (Routine + connector Drive) | 🆕 nueva — 1ª corrida 2026-06-25 (deriva detectada) |

Leyenda: 🆕 nueva · ✅ activa · ⏸ pausada/bloqueada · ❌ caída.

**Invariante:** toda rutina cierra en la Bitácora (spine). Si una rutina no escribe al
spine, no ha cerrado.

## Cabos abiertos de esta capa

- **CABO-011** — aprobar conectores Gmail/Calendar del sensor de proa (Run now en Claude).
- **CABO-PROA-02** — reautorizar el trigger `usoppResumen` en GAS (caído 3 días seguidos).
  Diagnóstico (2026-06-25): el trigger time-based es `cicloAutonomo` → `cicloAutonomo_v3`
  (usa Sheets + Drive + UrlFetch externo). *"Authorization is required"* = la
  autorización guardada del trigger ya no cubre los scopes que el script usa (revocada
  o scope nuevo sin reconsentir). **Fix:** abrir el proyecto Apps Script, ejecutar una
  función a mano una vez → aceptar el consentimiento OAuth → el trigger revive. El repo
  no versiona `appsscript.json`, así que los scopes viven solo en el editor.
