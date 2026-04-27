# Gaia Evolution Arcade

IntentID: `INT-GAIA-ARCADE`

## Principle

Build the seed first: three short arcade levels that prove movement,
loss, recovery, and memory-as-skin feel good before any larger era map is
opened.

The core contract is:

- `loop` is generic code: lives, regeneration, checkpoints, progression,
  purchases, HUD, and persistence hooks.
- `lore` is content: era id, level mechanics, art direction, narrator
  lines, rewards, and skin memory text.
- A new era should be added as content first. If it requires loop changes,
  the contract failed and should be tightened before adding more eras.

## Seed levels

| Level | Era | Arcade feel | New rule | Free skin | Premium skin |
| --- | --- | --- | --- | --- | --- |
| `01-sabana` | Sabana | runner, jump, collect | body before explanation | `sendero_sabana` | `guardian_sabana` |
| `02-piedra` | Piedra | push, break, carry | tool changes route | `tallador_piedra` | `obsidiana_pulida` |
| `03-fuego` | Fuego | timing, heat, restart | risk must be readable | `chispa_viva` | `llama_azul` |

## Era backlog

| Order | Era | Theme | Status |
| --- | --- | --- | --- |
| 1 | Sabana | Instinct and movement | seed |
| 2 | Piedra | Tool and weight | seed |
| 3 | Fuego | Risk and energy | seed |
| 4 | Rio | Flow and route | backlog |
| 5 | Aldea | Cooperation and memory | backlog |
| 6 | Metal | Precision and craft | backlog |
| 7 | Vela | Exploration and wind | backlog |
| 8 | Vapor | Pressure and machine | backlog |
| 9 | Electricidad | Circuit and speed | backlog |
| 10 | Orbita | Perspective and gravity | backlog |
| 11 | Red | Connection and noise | backlog |
| 12 | Biosfera | Balance and cost | backlog |
| 13 | Gaia | Synthesis and return | backlog |

## Lives loop

Default seed values:

- 5 max lives.
- 10 minute regeneration per life.
- Checkpoints persist independently from lives.
- Game over shows three equal options: wait for regeneration, start over,
  continue with Robux.
- No pressure timer, no shrinking free options, no copy that implies the
  paid option is mandatory.

## Monetization

Developer product hooks are placeholders until Roblox product IDs exist.
`MonetizationService` owns `MarketplaceService.ProcessReceipt` exactly
once on the server. The HUD can prompt a purchase, but receipt processing
and granting lives stay server-side.

Premium skins are cosmetic memory variants. They must not grant progress,
extra lives, shorter cooldowns, or hidden checkpoints.

## Rojo map

- `src/shared`: shared loop contract and registries.
- `src/server`: generic loop services and server bootstrap.
- `src/client`: HUD and player-facing prompts.
- `levels/*`: content packages. These should stay data-first until a
  level needs art assets or models.
