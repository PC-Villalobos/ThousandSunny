# OPERACIONES — Super-skills (composición multi-Nakama)

> Una **Operación** (super-skill) es *el producto de varias skills de varios Nakamas
> interactuando para un objetivo*. No es un átomo: es una coreografía.
>
> Hoy se definen aquí de forma **declarativa**. Cuando una Operación se repite y se
> estabiliza, se **materializa** como skill cargable `.claude/skills/op-<nombre>/SKILL.md`
> cuyo cuerpo es el playbook de orquestación (qué skill, en qué orden, qué Nakama).

## Anatomía de una Operación

- **Objetivo** — el resultado que produce.
- **Nakamas** — los roles que participan.
- **Secuencia** — qué skill corre, en qué orden, quién la porta.
- **Cierre** — dónde aterriza (siempre el spine: `crew-cerrar-bitacora`).

---

## `op-amanecer` — Barrido completo del día

**Objetivo:** que ningún cabo —ni de fuera ni de dentro— empiece el día sin ser visto,
y que todo cierre en el spine. Un solo escritor.

| # | Nakama | Skill | Hace | Substrato |
|---|--------|-------|------|-----------|
| 1 | 🧭 Nami | `nami-intake-proa` | 08:37 · escanea Gmail (36h) + Calendar (7d) → cabos nuevos de fuera; **entrega** | Claude |
| 2 | 🎯 Usopp | `usopp-barrido` | 09:00 · barre La Maceta (Bitácora, prioridades, hipótesis, Jimbe) | Codex |
| 3 | 🎯 Usopp | `crew-cerrar-bitacora` | cierra los cabos del día en el spine (único escritor) | GAS |

**Reparto sin solape:** Nami mira afuera y *entrega*; Usopp mira adentro y *escribe*.
**Estado:** parcial — paso 1 probado 14-jun; paso 2 activo en Codex; cierre vivo
(entradas 1382–1385). Bloqueo: **CABO-011** (conectores de proa sin aprobar).

> Esta Operación no se inventó: es el reparto proa/bodega acordado el 14-jun, bautizado.

---

## Plantilla para una Operación nueva

```markdown
## op-<nombre> — <título>

**Objetivo:** ...

| # | Nakama | Skill | Hace | Substrato |
|---|--------|-------|------|-----------|
| 1 | ... | ... | ... | ... |

**Estado:** propuesta
**Cierre:** crew-cerrar-bitacora
```
