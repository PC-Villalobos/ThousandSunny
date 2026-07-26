# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role in the fleet

This repo is the **Claude Code cabin** of the Thousand Sunny cognitive ecosystem — the ship itself. It holds skills, configs, state, and CI. It is not the backbone.

The backbone lives outside git. Authority order, decided by the captain on 2026-07-24
(event `BIT-20260724T134345Z`) and recorded in `POSICION.md` §4:

1. **Bitácora de Hipatia — `http://127.0.0.1:8765`. Operational authority.** Bridge Runtime
   on the captain's machine. JSONL is the sovereign source; SQLite and Markdown are
   reconstructible projections; Obsidian is a view. Writes go through the service, never by
   editing the JSONL, and are confirmed with `write_verified`.
2. **This repo (`state/` + Git).** The only copy the cloud can read. Authority when Hipatia
   is unreachable; narrative closures in `state/cierres/` accompany the formal event, they
   do not replace it.
3. **`thousand-sunny-hub/` — LEGACY, STALE. Not current state.** Node.js HTTP server on the
   captain's machine (`$SUNNY_HUB_PATH`). Still runs as software, but its last checkpoint is
   2026-05-24 — two months behind. Architectural heritage and a source of reusable
   functions; **never load it as the present.**
4. **PuenteDeMando** (separate repo) — Google Apps Script + Sheets + Drive. Historical
   archive since 2026-07-24. GAS is an adapter; anything written there goes to the archive,
   not to the live bitácora.

If the authority you need is not reachable (e.g. running on GitHub infrastructure, where
`127.0.0.1` does not exist), say so explicitly and name which one you fell back to. Do not
fabricate state, and do not promote a lower rung to authority by silence.

The startup projection that collapses all of this into one read is specified in
`state/contexto/CONTEXT_CAPSULE_v1.md`. It is a contract, not yet a generator.

## Architecture: Sunny Core

The canonical hierarchy (from `docs/architecture/SUNNY_CORE.md`):

1. **Sunny Core** — protocol, state, missions, actors, roles, skills, triggers. Source of truth.
2. **PuenteDeMando** — captain's console; consumes `GET /api/core` and `GET /api/missions`.
3. **GAS Adapter** — mirrors to Google (Bitacora sheet, Drive, Telegram). Cannot invent protocol.
4. **Drive** — human-navigable memory mirror. Not source of truth.
5. **Hub local** — current runtime hosting the Core prototype.
6. **Argos Bridge** — inter-fleet communication (future).

### Hub API (LEGACY — `thousand-sunny-hub`, state frozen at 2026-05-24)

These endpoints work as software but serve stale state. Read them for architecture, never
for current position. The live surface is the Hipatia Bridge Runtime on `127.0.0.1:8765`
(`/api/events`, `/api/missions`, `/api/closure/dashboard`, `/api/git/repositories/…/status`);
its contract is mapped in `state/contexto/CONTEXT_CAPSULE_v1.md` §4.

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

Follow the authority order above and stop at the first rung that answers. Do not walk all
four; that is the token burn this protocol exists to end.

1. **Hipatia Bitácora** — `GET http://127.0.0.1:8765/api/events` (last event and its
   `next_safe_action`), `/api/missions`, `/api/closure/dashboard`,
   `/api/git/repositories/thousandsunny/status`.
2. **This repo**, if Hipatia is unreachable — `POSICION.md` first, then the most recent
   record in `state/cierres/`, then the last line of
   `state/funcion_de_sueno/sleep_ledger.jsonl`.
3. **Nothing else.** `thousand-sunny-hub` is legacy (`npm --prefix "$SUNNY_HUB_PATH" run
   pull -- --summary` still works and still returns May state — do not load it as the
   present). `sync_pull_state` remains broken (`SYNC_VIEW_TOKEN invalido`).

Read `next_safe_action` from the last bitácora event before proposing your own. It was
written by whoever had the context in hand.

### 2. Write a checkpoint at end

The checkpoint contract is `POST /api/events` on the Bridge Runtime. Ten mandatory fields,
five of them closed enums — read them from `state/funcion_de_sueno/lib/bitacora.mjs`, which is
the repo's executable reference and quotes the server source:

- Text: `actor`, `role`, `topic`, `title`, `message`
- Enums: `event_kind`, `epistemic_status`, `sensitivity`, `status`, `source`

`change`, `after`, `next_safe_action`, `evidence[]`, `scope`, `relations`, `project` and
`phase` are optional payload — emitted, not required. **Do not design a second checkpoint
format** — a third protocol competing with this file and `POSICION.md` is exactly the cost
being removed.

A value outside an enum sends the event to Cuarentena. `epistemic_status` is the one to get
right: it is where an event declares whether what it asserts was observed, calculated,
inferred or merely proposed. Without it a second-hand report canonises as verified fact on
the next read.

Write through the service, never by editing the JSONL, and confirm with `write_verified`.
Nothing clinical and no guarded path travels in the event: the membrane is metadata-only,
`sensitivity` fixed to `internal`.

The hub CLI (`npm --prefix "$SUNNY_HUB_PATH" run checkpoint`) is **deprecated**. It writes to
the May-2026 legacy store, which no one reads as current.

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

**Environment secrets** (set in the Routine environment, never committed):
- `BITACORA_GAS_URL` — GAS web app `/exec` endpoint
- `BITACORA_GAS_TOKEN` — shared token the GAS validates

If `BITACORA_GAS_URL` is unset, the GAS block is left in the report as a fallback.

## State directory (this repo)

`state/` holds the in-repo shared memory — the only copy the cloud can read:

```
state/
  funcion_de_sueno/   — sleep function: spec, ledger, reports, .mjs engine
  deckard/            — Deckard knowledge packets (certainty levels N0–N5)
  cierres/            — arc closure records (narrative + verified evidence)
  contexto/           — context-capsule.v1: startup projection contract + JSON Schema
```

Use only relative paths inside `state/`. Absolute paths (`C:\...`) do not exist in cloud environments.

**Cloud sessions: read the position anchor first.** Read `POSICION.md` at the repo root if
it is present; it is the ship's position of record, and the captain adjudicates what of it
is public-safe. If it is absent, read the most recent record in `state/cierres/` — it
carries the last arc's verified state, inherited pendings, and captain's decisions.

Never author `POSICION.md` from a cloud session, and never leave a placeholder in its place.
Its content comes from the captain's machine. A stub satisfies the auditor's search while
carrying no position, which is the exact failure this anchor exists to prevent.

## House rules

- No emoji in generated code or committed files unless the captain asks.
- Theatre cognitivo is the enemy; real artefacts are the goal. Don't create documentation for its own sake.
- Prefer editing existing files to creating new ones.
- When in doubt about canonical paths, ask the captain; do not guess.
- Any scheduled task that cannot observe its target must be classified `pending-rearchitect` and must not emit empty alerts. Honest silence is worth more than false noise.
- All operational closes require a handoff with `contexto`, `decision`, `continuidad`, and `session_ref`. Events without `packetId` or a canonical actor go to Cuarentena.
