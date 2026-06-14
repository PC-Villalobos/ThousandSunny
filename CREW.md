# CREW — Roster de Nakamas y armería de skills

> La tripulación del Thousand Sunny. Un **Nakama** es un *rol agéntico* que cualquier
> modelo puede encarnar. Una **skill** es una *habilidad portable* en Markdown. Este
> archivo es la fuente de verdad de **quién existe** y **qué sabe hacer cada uno**.
>
> Convención de nombres y formato: ver `.claude/skills/README.md`.

## El modelo en tres capas

1. **Skill (átomo)** — una habilidad. Vive en `.claude/skills/<nombre>/SKILL.md`.
   - `crew-<func>` → compartida por toda la tripulación.
   - `<nakama>-<func>` → de un rol concreto.
2. **Nakama (rol)** — una identidad + el *conjunto de skills* que porta. Definido aquí.
3. **Operación (super-skill)** — varias skills de varios Nakamas hacia un objetivo.
   Definida en `OPERACIONES.md`.

**Regla de oro (doctrina del spine):** *un Nakama en cualquier substrato cierra en la
Bitácora, o no ha cerrado.* → skill `crew-cerrar-bitacora`.

---

## Skills de tripulación (crew · compartidas)

| Skill | Hace | Estado |
|-------|------|--------|
| `crew-cerrar-bitacora` | Registra el cierre de cualquier acción en el spine (GAS `log_cowork`). Único modo canónico de "cerrar". | propuesta |
| `crew-barrer-cabos` | Barrido de cabos sueltos sobre las vistas del sistema (Bitácora, prioridades, hipótesis). | propuesta |

---

## Nakamas (cada uno = un conjunto de skills)

### 🧭 Nami — Navegante · *intake / proa*
Mira hacia **fuera**. Pesca demandas nuevas antes de que entren al sistema. *Entrega*, no escribe el spine.
- skills de rol: `nami-intake-proa` (Gmail 36h + Calendar 7d → cabos nuevos)
- skills crew que usa: `crew-cerrar-bitacora` (para entregar, no para cerrar)
- substrato típico: **Claude** (conectores Gmail/Calendar)
- estado: `intake-proa` probado 14-jun · bloqueo: **CABO-011** (aprobar conectores)

### 🎯 Usopp — Francotirador · *bodega / spine*
Mira hacia **dentro**. Barre La Maceta y **es el único escritor del spine**.
- skills de rol: `usopp-barrido` (barrido de bodega), `usopp-resumen` (resumen diario)
- skills crew que usa: `crew-barrer-cabos`, `crew-cerrar-bitacora`
- substrato típico: **Codex** (local, La Maceta) + trigger **GAS**
- estado: ⚠ `usoppResumen` (GAS) caído 12–14 jun por autorización — ver `RUTINAS.md`

### 🔧 Franky — Carpintero · *scaffolding*
Construye el barco. Genera estructura y módulos desde plantillas.
- skills de rol: `franky` (bootstrap + scaffold; identidad y átomo aún fusionados — divisible en `franky-scaffold`)
- substrato típico: **Claude Code**
- estado: ✅ viva

### ⚔️ Zoro — Espadachín · *migración*
Corta nudos de formato. Migra Google Docs → Markdown real para Obsidian, sin tocar fuentes.
- skills de rol: `zoro-migrate`
- substrato típico: **Claude Code** / **GAS** / Antigravity local
- estado: ✅ **resucitada en este PR** (estaba invisible: su archivo era `skill.md` en minúsculas)

---

## Cómo sube a bordo un Nakama nuevo

1. Define su dominio en una frase (qué mira, de qué responde).
2. Crea sus skills átomas `<nakama>-<func>` en `.claude/skills/`.
3. Añádelo a este roster con su conjunto de skills.
4. Si participa en una Operación, enlázalo en `OPERACIONES.md`.
