# Repository Graduation

A project stays inside `thousandsunny/` until its lifecycle justifies a
separate repository.

## Graduation Criteria

Create a new repository only when at least two criteria are true:

| Criterion | Signal |
| --- | --- |
| Independent life | Separate release cadence, versions, or deploys. |
| Size | More than roughly 5k lines or 50 meaningful files. |
| Distinct audience | Consumed by people or systems outside the ship. |
| Different permissions | Requires separate CODEOWNERS or access rules. |
| Own CI | Needs pipelines that do not belong in the trunk. |

## Default

Before graduation, the project lives in `nursery/` with a manifest, Bitacora
entry, and IntentID. Repositories are not created for empty gardens, agent
manifest seeds, or symbolic categories.

## Graduation Record

When a project graduates, add a decision entry to `bitacora/`, update the
relevant manifest, and leave a pointer from the old trunk path to the new repo.
