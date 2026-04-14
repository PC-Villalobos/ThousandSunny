---
name: franky
description: >-
  Shipwright of the Thousand Sunny â€” scaffolds modules from templates and
  bootstraps repo structure. Use when the user invokes /franky or asks to
  scaffold boilerplate, generate a new module/component, or bootstrap
  project structure.
---

# Franky â€” Shipwright Skill

Franky builds the ship. He has two jobs:

1. **Bootstrap** â€” one-shot initialize a fresh project structure (directories,
   configs, README, CI skeleton).
2. **Scaffold** â€” generate individual modules, components, or endpoints from
   templates on demand.

## Invocation

### `/franky bootstrap [--stack <node|python|rust|generic>]`

Create the top-level project skeleton. Default stack: `generic`.

What gets created:

| Path | Purpose |
|------|---------|
| `src/` | Application source code |
| `tests/` | Test files |
| `docs/` | Documentation |
| `.github/workflows/ci.yml` | CI stub (GitHub Actions) |
| `README.md` | Expanded with stack-specific sections |
| `.gitignore` | Extended with stack-specific entries |

Rules:
- If a target file already exists, report it and skip (do not overwrite).
- The `--force` flag overrides the skip behavior.
- Read a few existing files first to match style conventions already in the repo.

### `/franky scaffold <template> <name>`

Generate one module from a built-in template.

Available templates (v1):

**module** â€” a standalone source file with exports and a matching test file.
```
src/<name>.{ext}
tests/<name>.test.{ext}
```

**component** â€” a UI component with its own directory, index, styles, and test.
```
src/components/<name>/
  index.{ext}
  <name>.{ext}
  <name>.test.{ext}
  <name>.styles.{ext}
```

**endpoint** â€” an API route handler with request validation and test.
```
src/routes/<name>.{ext}
tests/routes/<name>.test.{ext}
```

The file extension is inferred from the project stack (`.ts` for node,
`.py` for python, `.rs` for rust, `.txt` placeholder for generic).

### `/franky new <name>`

Alias for `/franky scaffold module <name>`.

## Rules

1. **Idempotency** â€” never overwrite existing files unless the user passes
   `--force`. If a target exists, report the conflict and stop.
2. **Convention-aware** â€” if the repo already has files, read a couple before
   generating new ones so naming, casing, and style match.
3. **No emoji in generated code** â€” playful shipwright asides ("SUPER!") are
   fine in chat output, never in file content.
4. **Self-contained** â€” templates are described inline in this skill file.
   No external scripts or helper binaries. Claude uses Write/Edit/Bash
   tools directly.

## v2 â€” Drive Structure Scaffolding (deferred)

Future versions will scaffold Google Drive structures for the clinical
ecosystem:

- Case folders (patient directory with Canon template, Caso_Vivo, feedback)
- Canon v1.1 templates (Sheets with 28 variables, 7 domains)
- ESTADO.json per case
- Caso_Vivo document skeleton

This requires GAS/Drive integration and is out of scope for v1. The design
space is intentionally left open.
