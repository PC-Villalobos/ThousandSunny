# RUTINAS — capa de programación (cuándo corre cada skill)

> Una **Rutina** es una invocación *programada* de una skill u Operación. La
> **definición** es portable; el **binding** al scheduler es por substrato (scheduler de
> Claude, automations de Codex, triggers de GAS). Esta tabla es el panel de salud:
> de un vistazo se ve qué está vivo y qué está caído.

| Rutina | Invoca | Nakama | Cadencia | Substrato | Salud |
|--------|--------|--------|----------|-----------|-------|
| Sueño nocturno | `/sueno` | 🌙 Groot (el que sueña) | 03:09 Madrid (Routine) + 01:09 UTC (Actions) | Claude Routine + GitHub Actions | ✅ activa |
| Meditación profunda | `robin-meditacion` | 📚 Robin | semanal / a demanda | Claude (Routine + connector Drive) | ✅ activa — precedente Drive 2026-06-25 |
| Barrido diario de cabos | `usopp-barrido` (op-amanecer #2) | 🎯 Usopp | 09:00 | Codex (`~/.codex/automations`) | 💤 sustituida 2026-07-02 → sueño/shadowlog (Codex sin máquina) |
| Sensor de proa | `nami-intake-proa` (op-amanecer #1) | 🧭 Nami | 08:37 | Claude (scheduler) | 💤 sustituida 2026-07-02 → sueño/shadowlog (cierra CABO-011) |
| Resumen Usopp | `usopp-resumen` | 🎯 Usopp | time-based | GAS (`THOUSAND SUNNY v3.0`) | 💤 sustituida 2026-07-02 — GAS es adaptador, no scheduler (cierra CABO-PROA-02) |
| Revisión SOFÍA (manual) | — | Capitán | lunes 9:00 | Google Calendar | 🕯 retirada 2026-07-02 → absorbida por sueño + meditación |

Leyenda: 🆕 nueva · ✅ activa · ⏸ pausada/bloqueada · ❌ caída · 💤 sustituida · 🕯 retirada.

**Invariante:** toda rutina cierra en la Bitácora (spine). Si una rutina no escribe al
spine, no ha cerrado.

## Sustitución 2026-07-02 — el barco se audita solo

Orden del Capitán: la revisión semanal de SOFÍA y las tareas programadas manuales
quedan sustituidas por la **función de sueño + shadowlog** corriendo en la nube
(Routines de Claude Code), conectadas a:

- **GitHub** — el repo es lo que la Routine clona y donde escribe (ledger, informes).
- **Drive** — vía connector en la Routine (precedente: meditación 2026-06-25); los
  loops interactivos de migración siguen siendo el canal grueso Drive → repo.
- **Obsidian** — vía micelio git: obsidian-git (móvil/PC) hace pull; la maceta ve el
  parte del sueño cuando el Capitán despierta.

La herencia de SOFÍA (sus 5 preguntas → fases N1/N2/N3/REM) y la definición del
shadowlog: `state/funcion_de_sueno/FUNCION_DE_SUENO_spec.md`.

Regla de la casa intacta: una rutina que no puede observar su objetivo se marca
`pending-rearchitect` y calla; silencio honesto > ruido falso.

## Cabos de esta capa

- **CABO-012** — abierto 2026-07-02 (manos del Capitán): en claude.ai/code/routines,
  editar la rutina del sueño y añadir el trigger **API** (Generate token → la URL y
  el token se muestran **una sola vez** → guardarlos en la keystone, jamás en el
  repo). Opcional: tercer trigger **GitHub event** sobre PRs a `state/` (requiere
  la Claude GitHub App; `/web-setup` no la instala). Probar con **Run now**.
- **CABO-011** — cerrado 2026-07-02: el sensor de proa queda sustituido por el
  sueño/shadowlog; no hay conectores que aprobar.
- **CABO-PROA-02** — cerrado 2026-07-02 por deprecación: `usoppResumen` (GAS) no se
  reautoriza; GAS queda como adaptador de espejo, no scheduler. Si algún día se quiere
  revivir: abrir el proyecto Apps Script, ejecutar una función a mano, aceptar el
  consentimiento OAuth (los scopes viven solo en el editor; el repo no versiona
  `appsscript.json`).
