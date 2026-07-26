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

## Authority order

Superseded on 2026-07-24 (`POSICION.md` §4, `CLAUDE.md` "Role in the fleet").
The steps below still name `thousand-sunny-hub` because they were written for
the previous topology. **The hub is legacy and its state is frozen at
2026-05-24.** Read the authority order in `CLAUDE.md` first; where this skill
and that order disagree, `CLAUDE.md` wins. Rewriting these steps against the
Bridge Runtime is pending (`state/contexto/CONTEXT_CAPSULE_v1.md` §8).

## Invocation

### `/nami estado`

Read and summarise the current canonical state.

Steps:

1. Try the Hipatia Bitácora first — `http://127.0.0.1:8765`. Read the last
   event and its `next_safe_action` before proposing your own.
2. If Hipatia is unreachable (any cloud session: `127.0.0.1` does not exist
   there), fall back to the repo, in order:
   - `POSICION.md`
   - most recent record in `state/cierres/`
   - last line of `state/funcion_de_sueno/sleep_ledger.jsonl`
3. Report: active project, current phase, open blockers, last checkpoint,
   **and which authority answered.** Never let a fallback pass as primary.
4. Legacy path, for architecture only, never as the present:

   ```bash
   npm --prefix "$SUNNY_HUB_PATH" run pull -- --summary
   ```

   This is the supported bypass of `sync_pull_state`, which remains broken.
   It returns May-2026 state.

If the sumidero is not reachable at all, say so. Do not fabricate state.

Note: the 5-minute mirror to GAS (`npm run mirror` in the hub) is a
long-running daemon owned by Antigravity. `/nami` does not start or
stop it; if the last `ruta=mirror` entry in the Bitacora is stale or
the last checkpoint carries the blocker `gas-mirror-down`, report that
in the `/nami estado` output as an operational blocker rather than
trying to recover it.

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
