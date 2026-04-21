---
name: nami
description: >-
  Navigator of the Thousand Sunny - reads canonical state from the sumidero
  and writes checkpoints after real work. Use when the user invokes /nami or
  asks to check ship state, audit progress, or close a work block with a
  checkpoint.
---

# Nami - Navigator Skill

Nami keeps coherence across cabins. She has two jobs:

1. **Read** - load the canonical state before work starts.
2. **Write** - persist a checkpoint once work closes.

Without Nami, Claude Code sessions are silent to Cowork, Telegram, and the
other nakamas.

## Invocation

### `/nami estado`

Read and summarise the current canonical state.

Steps:

1. Resolve the hub path from `$SUNNY_HUB_PATH` or the default captain path
   (see `CLAUDE.md`).
2. Run the canonical read interface:

```bash
npm --prefix "$SUNNY_HUB_PATH" run pull -- --summary
```

3. If `npm run pull` is unavailable but the hub filesystem is reachable,
   fall back to reading:
   - `state/shared-state.json`
   - `state/STATE_OF_THE_SHIP.md`
   - `state/PROJECT_REGISTRY.md`
4. Report: active project, current phase, open blockers, last checkpoint.

If the sumidero is not reachable, say so. Do not fabricate state.

### `/nami checkpoint [--title T] [--summary S] [--next N] [--blocker B] [--tag T]...`

Write a checkpoint to the sumidero. Delegates to the hub CLI:

```bash
npm --prefix "$SUNNY_HUB_PATH" run checkpoint -- \
  --title "..." --summary "..." \
  --project thousand_sunny_operativo \
  --actor claude-code \
  --tag <tag> --next "..." --blocker "..."
```

If any of `--title`, `--summary` or `--next` are missing, prompt the
captain; do not invent values.

If the hub is not reachable, emit the checkpoint as a fenced JSON block
in chat so it can be mirrored manually:

```json
{
  "title": "...",
  "summary": "...",
  "project": "thousand_sunny_operativo",
  "actor": "claude-code",
  "tags": ["..."],
  "nextActions": ["..."],
  "blockers": ["..."]
}
```

### `/nami rumbo`

Alias for `/nami estado` followed by a short recommendation of the next
step based on the `nextActions` of the last checkpoint.

## Rules

1. **No fabrication.** Never invent state, checkpoints, or project status.
   If the sumidero is unreachable, say so.
2. **No overwrite.** Checkpoints are append-only. Never edit
   `shared-state.json` or `STATE_OF_THE_SHIP.md` by hand; go through the
   hub CLI so `event-stream.jsonl` and mirror logic fire.
3. **Actor stamped.** Always tag the actor as `claude-code` for sessions
   that originate here. That is how the crew tells cabins apart.
4. **Silent is wrong.** Closing a real work block without a checkpoint is
   the failure mode the captain has named explicitly. Don't do it.
