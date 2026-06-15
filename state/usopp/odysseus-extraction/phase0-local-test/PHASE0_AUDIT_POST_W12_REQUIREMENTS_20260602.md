# Phase 0 Audit: Post-W12 Requirements

Date: 2026-06-02
Status: Phase 0 approved as local-test only

## Verdict

The Phase 0 Sunny security local-test was audited against real code, not just the proposal.

Approved as a local-test artifact.
Not approved for direct production merge until Wave 12 closes and the residual issues below are handled.

## Verified Corrections

1. Role derivation is not hardcoded.
   - `resolveActorRole()` grants requested role only for authenticated or local requests.
   - Otherwise it defaults to `public_webhook`.

2. Provider payloads receive no metadata.
   - `asUntrustedContent()` sends only text content.
   - `providerSafeMessages()` emits plain `{ role, content }`.

3. Token-bearing URLs are redacted in logs.
   - `redactUrlForLog()` masks Telegram `/bot<token>` paths and query strings.

4. Path confinement is conditional.
   - `guardDesktopPayload()` only touches present path-like fields.
   - Proxy behavior remains intact when no path fields are present.

## Required Before Real Hub Patch

1. Harden local trust boundary first.
   - Current local-test grants `captain` for local requests.
   - When patching the real Hub, do not trust spoofable proxy-derived IPs.
   - Prefer direct socket validation or explicit `trust proxy` configuration with known proxy boundaries.

2. Reconsider `blockPrivate: false` in `fetchJSON`.
   - Metadata/link-local is blocked.
   - Private IP ranges still pass.
   - For model/provider calls that do not need localhost/private LAN, use stricter URL policy.

3. Note DNS rebinding / TOCTOU risk.
   - `checkOutboundUrl()` resolves before `fetch`; fetch may resolve again.
   - Low priority for static known providers, but keep visible.

4. Replace token `===` comparison during hardening.
   - Use `crypto.timingSafeEqual` where practical.
   - Lower priority in local use, but easy to close in the real patch.

## Process Constraints

- Do not touch GAS.
- Do not deploy.
- Do not modify production Hub until Wave 12 is closed/audited.
- Convert this local-test into a real patch only after the Captain authorizes post-W12 integration.

