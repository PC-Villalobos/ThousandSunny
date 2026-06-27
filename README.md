# ThousandSunny

The operating-system repo for the Thousand Sunny cognitive ecosystem.

ThousandSunny is the operating system for a **sovereign cognitive exoskeleton** —
the captain's mind, extended. Not a connector for someone else's models: an OS
meant to be run **in natural language**, typed or spoken, where a crew of AI
agents executes everything so the captain commands without writing commands or
clicking.

- **Brain:** an Obsidian vault (the *maceta de Groot*) read as RAG — the source of memory.
- **Engine:** DeepSeek, and increasingly local models, for sovereignty and the confidentiality owed to the captain's patients.
- **Nervous system (the *micelio*):** Obsidian Sync + GitHub, carrying state between devices and agents.
- **Crew:** the nakamas (Groot, Nami, Robin, Jimbe, Zoro, Chopper…) are *characters* that a model *actor* plays; the scripts are portable Markdown skills, so the actor is interchangeable (Claude, Codex, DeepSeek, local) while the play stays the same.

Built for clinical practice, doctoral research, and personal knowledge management,
under a One Piece crew metaphor. The grammar beneath it (character · actor · script ·
director · scene · audience) lives in `TEATRO.md`; the architecture in
`bridge-linux/ARQUITECTURA.md`; and the thesis — why a small model wrapped in dense
*glia* (continuous memory, tools, autonomy) outgrows an isolated frontier model — in
`TESIS.md`.

This repo is the ship itself. Everything that makes the system run â€” skills,
configs, prompts, templates, CI â€” lives here.

## First nakama aboard

`/franky` is the shipwright skill. It scaffolds new project structures and
generates modules from templates. Run `/franky bootstrap` in Claude Code to
lay down the full directory skeleton, or `/franky scaffold <template> <name>`
to generate a single module.

`/sueno` is Nami's nightly sleep-function skill. It runs an artificial sleep
cycle (N1-REM) over the shared memory in `state/` to consolidate the day, audit
coherence, detect drift, and prevent actor/role fusion, leaving a readable
report. It is designed to run unattended from a cloud Routine (schedule, API, or
GitHub event) so the ship dreams itself while the crew sleeps. See
`state/funcion_de_sueno/ROUTINE_SETUP.md` to wire the trigger.

More crew members will board as the system grows.

## Crew registry

The crew and its capabilities are defined in portable, model-agnostic Markdown,
so any model (Claude, Codex, DeepSeek, local…) reads the same armory:

- `TEATRO.md` — the grammar beneath the metaphor: the six roles (character, actor, script, director, scene, audience) that every action instantiates. The registries below are those roles made concrete.
- `CREW.md` — the roster: each Nakama (a **character**) and the set of skills it carries.
- `OPERACIONES.md` — super-skills: compositions of several Nakamas' skills toward an objective (the **director's** choreography).
- `RUTINAS.md` — the scheduling layer: when each skill runs, on which substrate, and its health.
- `.claude/skills/README.md` — the armory convention (naming, the three tiers, the SKILL.md template).

The model in one line: a **skill** is one capability; a **Nakama** is a set of
skills plus an identity; a **super-skill (Operación)** composes several Nakamas'
skills toward a goal.

## Status

Early construction. The keel is laid; the mast comes next.

## License

Private â€” not open source (yet).
