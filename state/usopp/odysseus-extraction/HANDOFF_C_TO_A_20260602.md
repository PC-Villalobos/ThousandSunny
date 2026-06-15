# Usopp handoff: Odysseus -> Sunny C to A

Date: 2026-06-02
Branch: claude/bold-fermi-NvyuM
Intent: unblock Claude Code remote triage and integration proposal.

## Files in this folder

- `sunny_refinement_backlog_20260602.json`
  - Phase backlog distilled from Odysseus.
  - Start with phase 0 and phase 1 only.

- `sunny_security_kernel.js`
  - Portable JS guard layer for Sunny.
  - Not a direct Odysseus copy.
  - Syntax already checked with `node -c`.

- `hub-server.local-context.js`
  - Local copy of the current Windows `thousand-sunny-hub/hub-server.js`.
  - Context only. Do not treat this as deployed source of truth unless Antonio asks.
  - No `.env`, no `hub.env`, no token file included.

## Recommended sequence

1. Triage `sunny_refinement_backlog_20260602.json`.
2. Scope only P0:
   - untrusted-context wrapper
   - URL guard
   - role/tool policy
   - path confinement
   - regression harness outline
3. Inspect `hub-server.local-context.js` for integration points.
4. Produce a patch proposal or a minimal local integration plan.
5. Do not touch GAS and do not deploy while W12/Mirror is active.

## Likely Hub integration points

- `fetchJSON(url, options)` around line 147:
  - candidate for URL guard before outbound requests.

- `authMiddleware(req, res, next)` around line 103:
  - candidate for role/capability extraction once roles are explicit.

- `/api/codex`, `/api/claude`, `/api/antigravity` routes:
  - candidate for untrusted context wrapping when user/body/Bitacora data is passed into model calls.

- `/api/desktop` and future file/tool routes:
  - candidate for path confinement.

- `/api/telegram/outgoing`:
  - high-risk tool gate candidate because it performs external messaging.

## Guardrails

- Do not import Odysseus wholesale.
- Do not add email/calendar/vault/shell routes yet.
- Do not include env files.
- Keep Bitacora canonical; sidecars are indexes, not source of truth.
- Treat clinical data as out of scope unless explicitly gated by the Captain.

