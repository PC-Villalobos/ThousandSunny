# Phase 0 Sunny Security Integration Result

Date: 2026-06-02
Mode: local/no-destructive proposal

## Status

Phase 0 was materialized as a local test artifact.

Production files were not modified.
GAS was not touched.
No deploy was run.

## Files

- `hub-server.phase0-local-test.js`
  - Copy of current `thousand-sunny-hub/hub-server.js` with Phase 0 guardrails applied.

- `sunny_security_kernel.js`
  - Portable security kernel used by the local test Hub.

- `test_phase0_security_kernel.js`
  - Compact regression harness for the security kernel.

## Guardrails Applied

1. Security kernel import
   - Imports `isToolAllowed`, `untrustedContextMessage`, `resolveAndCheckPath`, and `checkOutboundUrl`.

2. Role/tool policy
   - `authMiddleware` attaches `req.actorRole` and `req.canUseTool()`.
   - Local or authenticated requests default to `captain`.
   - Untrusted remote/public requests default to `public_webhook`.
   - `/api/telegram/outgoing` gates `telegram_send`.
   - `/api/desktop` gates the requested tool/action when it maps to a high-risk tool.

3. URL guard
   - `fetchJSON()` checks outbound URLs before `fetch`.
   - Error messages redact query strings and Telegram bot token paths.

4. Untrusted-context wrapper
   - Model-call helpers wrap user-originated content in untrusted context text.
   - Provider payloads remain plain `{ role, content }` or string parts; no metadata is sent to providers.
   - Applies through `callClaude`, `callCodex`, `callAntigravity`, and `callGemini`.

5. Path confinement
   - Codex `workingDir` passes through `resolveAndCheckPath`.
   - `/api/desktop` conditionally checks `path`, `filePath`, `workingDir`, `cwd`, and `targetPath`.

## Verification

Commands run:

```bash
node -c outputs/hub-server.phase0-local-test.js
node -c outputs/sunny_security_kernel.js
node outputs/test_phase0_security_kernel.js
```

Result:

```text
hub-server.phase0-local-test.js syntax OK
sunny_security_kernel.js syntax OK
12 phase-0 security tests passed
```

## Notes

Claude's pasted patch skeleton had empty `REPLACE` / `WITH` sections, so this patch was reconstructed directly from the local Hub source and the generated security kernel.

This is ready for review or remote handoff. It is not deployed.

