# Armería — convención de skills del Thousand Sunny

Este directorio es la **armería portable**: skills en Markdown que cualquier modelo
(Claude, Gemini, ChatGPT…) puede leer y ejecutar. La agrupación **no vive en carpetas
anidadas** — el arnés de Claude Code solo descubre `.claude/skills/<algo>/SKILL.md` a
un nivel. Vive en el **prefijo del nombre** y en los registros `CREW.md` /
`OPERACIONES.md` / `RUTINAS.md` (en la raíz del repo).

## Las tres capas (composicionales)

| Capa | Qué es | Nombre | Se define en |
|------|--------|--------|--------------|
| **Skill átoma (crew)** | habilidad compartida por toda la tripulación | `crew-<func>` | aquí + `CREW.md` |
| **Skill átoma (rol)** | habilidad de un Nakama concreto | `<nakama>-<func>` | aquí + `CREW.md` |
| **Nakama (rol)** | un *conjunto de skills* + identidad agéntica | `<nakama>` | `CREW.md` |
| **Operación (super-skill)** | composición de skills de *varios* Nakamas → un objetivo | `op-<objetivo>` | `OPERACIONES.md` |

Álgebra: `Nakama = Σ skills` · `Operación = ƒ(Nakama_A.skill, Nakama_B.skill, …) → objetivo`.

## Requisitos de cada `SKILL.md` (si faltan, el arnés NO la carga)

1. El archivo se llama **`SKILL.md`**, en MAYÚSCULAS. *(Fue la causa de que `zoro-migrate`
   estuviera invisible: su archivo era `skill.md` en minúsculas.)*
2. Frontmatter YAML con `name:` y `description:`.
3. La `description` lleva el **disparador**: *"Usar cuando el Capitán invoque /\<nombre\>
   o pida \<gatillo\>"* — así el modelo la activa solo, sin que tengas que recordarla.

## Plantilla mínima

```markdown
---
name: <nakama>-<func>
description: >-
  <Qué hace, en una frase>. Usar cuando el Capitán invoque /<nombre>
  o pida <gatillo concreto>.
---

# <Título>

<Cuerpo: pasos, reglas, cierre.>
```

## Añadir una skill nueva

1. `mkdir .claude/skills/<nombre>` y crea `SKILL.md` con la plantilla.
2. Regístrala en `CREW.md` (como `crew-*` o bajo su Nakama).
3. Si participa en una composición, enlázala en `OPERACIONES.md`.
4. Si corre programada, añádela a `RUTINAS.md`.
