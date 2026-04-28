# 2026-04-28 - Arquitectura del tronco

Decision: keep the ecosystem in two repositories for now.

| Repository | Role |
| --- | --- |
| `pc-villalobos/thousandsunny` | Trunk: canon, crew, agents, gardens, seeds, nursery, Bitacora. |
| `pc-villalobos/puentedemando` | Operative bridge: UI and console. |

## Accepted Shape

- Git branches are temporary work fronts, not permanent intention families.
- Durable identity lives in folders, manifests, IntentIDs, PRs, and Bitacora.
- Projects remain in `nursery/` until they meet at least two graduation criteria.
- Gardens are places; personified garden agents are voices declared inside them.
- CODEOWNERS starts with the captain only.

## Initial Canon

The first seeded intentions are `INT-GAIA-ARCADE`, `INT-PUENTE-2D`,
`INT-DRIVE-ISM`, and `INT-QUIRON-M0`.
