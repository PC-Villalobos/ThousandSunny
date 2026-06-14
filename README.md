# ThousandSunny

The operating-system repo for the Thousand Sunny cognitive ecosystem.

ThousandSunny is a multi-AI infrastructure built around clinical practice,
doctoral research, and personal knowledge management. It connects Claude,
Gemini, and ChatGPT through shared memory, Google Apps Script, and portable
skills â€” all orchestrated under a One Piece crew metaphor where each AI
agent has a role (navigator, cook, shipwright, sniper, etc.).

This repo is the ship itself. Everything that makes the system run â€” skills,
configs, prompts, templates, CI â€” lives here.

## First nakama aboard

`/franky` is the shipwright skill. It scaffolds new project structures and
generates modules from templates. Run `/franky bootstrap` in Claude Code to
lay down the full directory skeleton, or `/franky scaffold <template> <name>`
to generate a single module.

More crew members will board as the system grows.

## Crew registry

The crew and its capabilities are defined in portable, model-agnostic Markdown,
so any model (Claude, Gemini, ChatGPT) reads the same armory:

- `CREW.md` — the roster: each Nakama (role) and the set of skills it carries.
- `OPERACIONES.md` — super-skills: compositions of several Nakamas' skills toward an objective.
- `RUTINAS.md` — the scheduling layer: when each skill runs, on which substrate, and its health.
- `.claude/skills/README.md` — the armory convention (naming, the three tiers, the SKILL.md template).

The model in one line: a **skill** is one capability; a **Nakama** is a set of
skills plus an identity; a **super-skill (Operación)** composes several Nakamas'
skills toward a goal.

## Status

Early construction. The keel is laid; the mast comes next.

## License

Private â€” not open source (yet).
