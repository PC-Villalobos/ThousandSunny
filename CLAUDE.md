# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role in the fleet

This repo is the **Claude Code cabin** of the Thousand Sunny cognitive ecosystem — the ship itself. It holds skills, configs, state, and CI. It is not the backbone.

The backbone lives outside git in two components:

- **`thousand-sunny-hub/`** — the canonical sumidero (Node.js HTTP server + shared state). Default path on the captain's machine: `C:\Users\usuario\Documents\Claude\Projects\IA como extensión cognitiva personal (Gemini, Claude y ChatGPT)\thousand-sunny-hub\`. Exposed via `$SUNNY_HUB_PATH`.
- **PuenteDeMando** (separate repo) — Google Apps Script + Sheets + Drive, the presence/notification layer. GAS is an adapter; it mirrors events but does not govern the ship.

If the hub is not reachable (e.g. running on GitHub infrastructure), say so explicitly. Do not fabricate state.

## Architecture: Sunny Core

The canonical hierarchy (from `docs/architecture/SUNNY_CORE.md`):

1. **Sunny Core** — protocol, state, missions, actors, roles, skills, triggers. Source of truth.
2. **PuenteDeMando** — captain's console; consumes `GET /api/core` and `GET /api/missions`.
3. **GAS Adapter** — mirrors to Google (Bitacora sheet, Drive, Telegram). Cannot invent protocol.
4. **Drive** — human-navigable memory mirror. Not source of truth.
5. **Hub local** — current runtime hosting the Core prototype.
6. **Argos Bridge** — inter-fleet communication (future).

### Hub API (implemented)

| Endpoint | What it does |
|---|---|
| `GET /api/core` | Summary of Core, routes, protocol |
| `GET /api/protocol` | Live protocol, event counts, tails |
| `GET /api/missions` | Mission list |
| `POST /api/missions/start` | Open a mission, write `START` |
| `POST /api/missions/:packetId/close` | Close mission, require handoff, write `CLOSE` |

### Event flow

1. Core receives event or mission → normalises `actor`, `role`, `packetId`, state, trigger.
2. If validation fails → writes to `state/cuarentena/events.jsonl`.
3. If passes → writes to `state/event-stream.jsonl` and updates `state/shared-state.json`.
4. If visible moment → writes to `state/cubierta/feed.jsonl` (only `START` and `CLOSE`).
5. Adapters mirror outward without altering truth.

The hub state files (inside `thousand-sunny-hub/`, outside this repo):
- `state/shared-state.json` — live ship state
- `state/event-stream.jsonl` — canonical silent events
- `state/cubierta/feed.jsonl` — visible START/CLOSE feed
- `state/misiones/{open,in_progress,done,parked,blocked,archived}/` — missions by status
- `state/handoffs/` — closed handoffs by packet
- `state/cuarentena/events.jsonl` — rejected entries

## Context protocol (every non-trivial session)

### 1. Load canonical state at start

```bash
npm --prefix "$SUNNY_HUB_PATH" run pull -- --summary
```

Drop `--summary` for the full JSON. Fallback (direct file reads, in order):
- `thousand-sunny-hub/state/shared-state.json`
- `thousand-sunny-hub/state/STATE_OF_THE_SHIP.md`
- `thousand-sunny-hub/state/PROJECT_REGISTRY.md`

`sync_pull_state` is currently broken (`SYNC_VIEW_TOKEN invalido`). Use `npm run pull` instead.

### 2. Write a checkpoint at end

```bash
npm --prefix "$SUNNY_HUB_PATH" run checkpoint -- \
  --title "<titulo corto>" \
  --summary "<resumen accionable>" \
  --project thousand_sunny_operativo \
  --actor claude-code \
  --tag <tag-relevante> \
  --next "<siguiente paso>" \
  --blocker "<bloqueo si aplica>"
```

Without a checkpoint the session is invisible to Cowork, Telegram, and the rest of the crew.

**Remote sessions** (GitHub Actions, Routines) with no hub access: emit the checkpoint in the PR body under a `## Checkpoint` section using the same fields. Another actor can mirror it into the sumidero.

## Skill system

Skills live in `.claude/skills/<name>/SKILL.md`. The naming prefix determines the layer:

| Layer | Name pattern | Defined in |
|---|---|---|
| Shared crew skill | `crew-<func>` | `.claude/skills/` + `CREW.md` |
| Role-specific skill | `<nakama>-<func>` | `.claude/skills/` + `CREW.md` |
| Nakama (role) | `<nakama>` | `CREW.md` |
| Operation (super-skill) | `op-<objective>` | `OPERACIONES.md` |

**Critical naming rule**: the file must be `SKILL.md` in uppercase. A lowercase `skill.md` is not discovered by the harness. (`zoro-migrate` was invisible for this reason.)

**Required frontmatter** (both fields mandatory for the harness to load the skill):
```yaml
---
name: <nakama>-<func>
description: >-
  <What it does>. Usar cuando el Capitán invoque /<name> o pida <concrete trigger>.
---
```

The description's trigger phrase is what makes the model auto-activate the skill without the captain having to remember it.

### Adding a skill

1. `mkdir .claude/skills/<name>` — create `SKILL.md` with the template above.
2. Register in `CREW.md` (as `crew-*` or under its Nakama).
3. If it participates in a composition, link it in `OPERACIONES.md`.
4. If it runs on a schedule, add it to `RUTINAS.md`.

## Active crew and skills

| Skill / command | Role | Substrate | Status |
|---|---|---|---|
| `/franky` | Shipwright — scaffolds modules from templates | Claude Code | ✅ live |
| `/nami` | Navigator — reads sumidero state, writes checkpoints | Claude Code | ✅ live |
| `/sueno` | Sleep function — nightly audit cycle N1→REM | Claude Code Routine / GitHub Actions | ✅ live |
| `/zoro-migrate` | Format cutter — migrates Google Docs to plain Markdown | Claude Code / GAS / local | ✅ live |

Full crew registry: `CREW.md`. Scheduled routines and health status: `RUTINAS.md`. Operation compositions: `OPERACIONES.md`.

## Funcion de Sueno (nightly sleep)

The sleep function runs a four-phase audit over `state/`:

| Phase | Name | Does |
|---|---|---|
| N1 | Conciliation | Inventory + deltas (new/changed/gone files). Read-only. |
| N2 | Consolidation | Episodic/procedural memory; records who played which role. |
| N3 | Deep sleep | Audit: orphans, unindexed notes, contradictions, Sophia coherence. |
| REM | Integration | Actor/role fusion risk, rotation recommendation, cycle learning. |

**Two execution paths:**
- **Agentic (primary):** Claude Code Routine (cloud, unattended) — runs `/sueno` via the Routine prompt at 03:09 Madrid time. Setup in `state/funcion_de_sueno/ROUTINE_SETUP.md`.
- **Deterministic (secondary):** GitHub Actions workflow (`.github/workflows/sueno-nocturno.yml`) — runs `state/funcion_de_sueno/funcion_de_sueno.mjs` with Node 22 at 01:09 UTC, commits the report, pushes.

**Permitted writes** (the only mutations the skill may make to `state/`):
- `state/funcion_de_sueno/reports/SLEEP_<YYYY-MM-DD>.md` — the sleep report
- `state/funcion_de_sueno/sleep_ledger.jsonl` — one line per run (actor/role streak, drift flag)
- `state/funcion_de_sueno/sleep_state.json` — state of the last run

**Key guardrails:**
- Metadata-only for paths marked `HOLD_CLINICO`, `clinical_guarded`, `[N2-HOLD-CLI]`, `[N2-HOLD-NEM]`, or `00_BOVEDA_NEXUS`.
- Never mutate source files in `state/` outside the three permitted paths above.
- Never produce new canon (Deckard canon requires pillar, status, source, and certainty level).
- If `streak >= 3` (same actor+role 3 consecutive cycles), mark `rotate:true` in the ledger and warn in the report.

**Tests:** `npm run test:sueno` runs both halves — the Python suites under
`state/funcion_de_sueno/` and the Node ones in `lib/`. It resolves the interpreter
(`PYTHON`, then `python3`, then `python`) and, finding none, says so with the remedy
instead of dying on an opaque ENOENT — `python3` is usually absent from PATH on
Windows. Override with `PYTHON=py npm run test:sueno`.

**Environment secrets** (set in the Routine environment, never committed):
- `BITACORA_GAS_URL` — GAS web app `/exec` endpoint
- `BITACORA_GAS_TOKEN` — shared token the GAS validates

If `BITACORA_GAS_URL` is unset, the GAS block is left in the report as a fallback.

## Cubierta (the visible layer)

Landed on the trunk on 2026-09-05 (PRs #104 and #98). One Node process, no
dependencies, bound to loopback.

```bash
npm run cubierta          # -> http://127.0.0.1:8788
npm run test:cubierta     # the aggregator: every suite, or it names the missing one
npm run test:sueno        # sleep function: Python suites + the Node ones in lib/
npm run test:estado       # the state/ surfaces nobody else runs; declares what it cannot
```

- **Port `8788`**, override with `CUBIERTA_PUERTO`; host `127.0.0.1`, override
  with `CUBIERTA_HOST`. If the port is taken the process says so and names the
  variable — it does not die with a stack trace.
- **`8765` is the Bitacora de Hipatia, not the Cubierta.** Probing 8765 tells you
  nothing about whether the Cubierta is up. Do not confuse the two.
- **Hipatia is authority, not dependency.** The Cubierta reads the Bitacora and
  declares in `/api/snapshot` whether it answers, naming the URL when it does
  not. With Hipatia down the ship still opens. Pinned by tests in
  `cubierta/test/test_cubierta.mjs`; do not couple them. Each source carries
  `motivo` when it is silent and `nota` when it answers — for the Bitacora,
  `version` and event count, which the client shows beside the id. Both halves
  are pinned, the live one with its own double on an ephemeral port: a test must
  never need a real 8765.
- **A live 8765 from a cloud session is reproducible.** Copy
  `state/hipatia_bridge_runtime/server/*.py` to the scratchpad (never run it in
  place: startup creates `events/`, `index/` and `daily/` next to it, inside
  `state/`) and run `python3 server/bitacora_server.py` from there. Since
  2026-10-16 that is all it takes: no vault fixture, no MOC.
- **The Obsidian vault is a mirror, so it is optional.** `server/vault.py`
  resolves the vault root — the inherited absolute path by default,
  `HIPATIA_OBSIDIAN_ROOT` to point elsewhere. If that root does not exist the
  mirror is off, the startup line says so with its remedy, and **nothing is
  written or created there**; with the vault mounted, behaviour is identical to
  before, write for write. A vault that is present but inconsistent (mounted, MOC
  missing) still raises: that is incoherence, not absence. And with the mirror off
  `event_absorbed` returns False — absorption into the vault is not asserted
  when it cannot be observed. Until 2026-10-16 Hipatia refused to start without
  the MOC, so the operational authority could not be raised on any machine but the
  captain's; the decision closing that is the A3-Obsidian record in
  `docs/RUMBO_INTEGRACION.md`.
- **`deploy/runtime-manifest.json` is the deployment key, not documentation.**
  `sync_to_local.ps1` compares each projected file's SHA-256 against it and
  refuses to copy on a mismatch. Edit anything under
  `state/hipatia_bridge_runtime/` and you must regenerate those hashes, or the
  captain's deploy throws. The projection now **leads** the live runtime until he
  runs `sync_to_local.ps1 -Apply` himself, and the manifest says so.
- Two surfaces carry the name Cubierta: `cubierta/` (the isometric ship) and
  `state/cubierta_ui/` (the pedagogic contract and reference surface). Both are
  on the trunk and `scripts/test-cubierta.mjs` runs both — never let one script
  definition shadow the other.
- **`/estado` is the captain's view of the ship**: what exists, what works, what is
  missing, and whether something was already solved. It reads `cubierta/estado/registro.json`
  (hand-written claims) and checks every cited proof against the tree and git on each request.
  Change a claim there, with its proof; never edit the page to say more than the registry backs.
  Technical state (`estado`) and what waits on the captain (`espera`) are separate fields, and a
  decision needs at least two alternatives with their consequences. The repo is public: nothing
  private goes in the registry.
- **`cubierta/openapi.json` is the Cubierta's HTTP contract** (OpenAPI 3.1, served at
  `/openapi.json`). `cubierta/test/test_openapi.mjs` fails if a route in `server.mjs` is missing
  from it, if it describes a route the server does not handle, or if a real response breaks its
  schema. Add or change a route and the contract changes in the same commit.
- **A test nobody runs protects nothing.** The aggregator sweeps the surfaces it
  claims (`shared/`, `cubierta/`, `state/cubierta_ui/`, `scripts/`) and fails,
  naming the file, if a `*.test.mjs` or `test_*.mjs` there is in no suite. If you add a test
  directory, wire it: a green `npm test` with a suite unrun is the exact failure
  this guard exists to prevent.
- **`state/` has no unrun corner either.** `scripts/test-estado.mjs` claims
  `state/` minus the surfaces with their own runner (`funcion_de_sueno`,
  `cubierta_ui`), sweeps for `*.test.mjs`, `test_*.mjs`, `test_*.py` and
  `*test*.js`, and every file must land in one of four boxes — it runs here,
  another npm script runs it, it only looks like a suite, or the projection
  excludes the local config it needs. Anything else is an orphan and fails. A new
  test under `state/` enters on its own; there is no hand-written list to forget.
- **The Hipatia tests write into the tree they run in.** `test_closure_core_ola2_1.py`
  creates `closure/` and an Obsidian-shaped view in the root of
  `state/hipatia_bridge_runtime/`, which both mutates `state/` and breaks that
  projection's own manifest test. `test:estado` runs each one on a **fresh copy**,
  one per file — sharing a copy makes the tanda order-dependent. Never run them in
  place.

## State directory (this repo)

`state/` holds the in-repo shared memory — the only copy the cloud can read:

```
state/
  funcion_de_sueno/   — sleep function: spec, ledger, reports, .mjs engine
  deckard/            — Deckard knowledge packets (certainty levels N0–N5)
  cierres/            — arc closure records (narrative + verified evidence)
```

Use only relative paths inside `state/`. Absolute paths (`C:\...`) do not exist in cloud environments.

**Cloud sessions: read the position anchor first.** Read `POSICION.md` at the repo root if
it is present; it is the ship's position of record, and the captain adjudicates what of it
is public-safe. If it is absent, read the most recent record in `state/cierres/` — it
carries the last arc's verified state, inherited pendings, and captain's decisions.

Never author `POSICION.md` from a cloud session, and never leave a placeholder in its place.
Its content comes from the captain's machine. A stub satisfies the auditor's search while
carrying no position, which is the exact failure this anchor exists to prevent.

**Then read the current heading.** `docs/RUMBO_INTEGRACION.md` is the rumbo of record for the
current cycle: the single deliverable, its acceptance test, the two fronts, and which open PRs
are on the critical path versus conserved outside it. `POSICION.md` says where the ship is;
the rumbo says where this cycle is taking it. Unlike the position anchor, a cloud session may
update it — it is levantado from branches and test runs, not from the captain's disk.

## House rules

- No emoji in generated code or committed files unless the captain asks.
- Theatre cognitivo is the enemy; real artefacts are the goal. Don't create documentation for its own sake.
- Prefer editing existing files to creating new ones.
- **Work that exists on one disk only is not preserved.** `node scripts/preservar.mjs
  <ruta-del-repo-local> --remoto <url> [--commit <sha>]` inspects a local repo and names the exact
  push that makes it reachable at `--remoto`, on a `preserva/*` branch with disjoint history. There
  is **no default destination**: without `--remoto` it stops before calling git. This repo is
  public, so private work goes to a private custody repo, never here by omission. It is a dry run
  until `--ejecutar`, it never forces, and it warns that uncommitted files do not travel. Custody,
  not integration: a preservation branch decides nothing about whether that work becomes a
  component. See the 1.a record in `docs/RUMBO_INTEGRACION.md`.
- When in doubt about canonical paths, ask the captain; do not guess.
- Any scheduled task that cannot observe its target must be classified `pending-rearchitect` and must not emit empty alerts. Honest silence is worth more than false noise.
- All operational closes require a handoff with `contexto`, `decision`, `continuidad`, and `session_ref`. Events without `packetId` or a canonical actor go to Cuarentena.
