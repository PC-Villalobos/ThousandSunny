# CLAUDE.md - ThousandSunny

Project-wide guidance for Claude Code sessions working inside this repo.

## Role in the fleet

This repo is the **Claude Code cabin** of the Thousand Sunny ecosystem. It
sits alongside two operational components that live **outside** of git:

- `thousand-sunny-hub/` - the canonical sumidero (local hub, HTTP server,
  shared state). Default location on the captain's machine:
  `C:\Users\usuario\Documents\Claude\Projects\IA como extensión cognitiva personal (Gemini, Claude y ChatGPT)\thousand-sunny-hub\`
- Google Apps Script + Sheets + Drive - the presence / notification layer
  (see [PuenteDeMando](https://github.com/PC-Villalobos/PuenteDeMando)).

Claude Code sessions are one more cabin that plugs into this backbone.
They are not the backbone.

## Context protocol

Every non-trivial Claude Code session in this ecosystem must:

### 1. Load canonical state at start

Before beginning substantial work, load the canonical state. Preferred
path is the hub CLI:

```bash
npm --prefix "$SUNNY_HUB_PATH" run pull -- --summary
```

This bypasses `sync_pull_state` and returns a compact view of
`shared-state.json`. Drop `--summary` for the full JSON.

Fallback, if the CLI is unavailable, is to read the files directly:

- `thousand-sunny-hub/state/shared-state.json` - machine-readable state
- `thousand-sunny-hub/state/STATE_OF_THE_SHIP.md` - prose briefing
- `thousand-sunny-hub/state/PROJECT_REGISTRY.md` - active project index

If the hub is not reachable from the session at all (e.g. running on
GitHub infrastructure rather than on the captain's machine), say so
explicitly instead of proceeding blind. Do not fabricate state.

### 2. Write a checkpoint at end

When a block of real work closes, persist a checkpoint into the sumidero:

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

The CLI lives at `scripts/checkpoint.js` in the hub and delegates to the
shared module `shared-checkpoint.js`. Without a checkpoint the session is
invisible to Cowork, Telegram, and the rest of the crew.

If the session has no filesystem access to the hub, emit the checkpoint
inline in the PR body under `## Checkpoint` using the same fields. Codex
or Antigravity can mirror it into the sumidero.

### 3. Do not bypass the sumidero

- The sumidero is canonical. Anything not persisted there does not exist
  for the rest of the crew.
- `sync_pull_state` is currently broken (`SYNC_VIEW_TOKEN invalido`). The
  bypass is `npm run pull` (canonical read) or direct file reads
  (fallback); see `puentedemando/docs/COWORK-CONTEXT-BRIDGE.md` for the
  full contract.

## Crew aboard

- `/franky` - shipwright. Scaffolds repo skeletons and modules.
- `/nami` - navigator. Reads sumidero state and writes checkpoints.

More nakamas are added as skills under `.claude/skills/<name>/SKILL.md`.

## House rules

- No emoji in generated code or committed files unless the captain asks.
- Don't create documentation for its own sake. Theatre cognitivo is the
  enemy; real artefacts are the goal.
- Prefer editing existing files to creating new ones.
- When in doubt about canonical paths, ask the captain; do not guess.
