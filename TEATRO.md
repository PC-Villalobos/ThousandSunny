# TEATRO — la gramática del sistema (los seis papeles)

> Bajo la metáfora One Piece hay una gramática más simple y más profunda: **el
> teatro**. Toda acción del Thousand Sunny —un sueño nocturno, una migración, un
> checkpoint— es una *escena* donde un *actor* interpreta a un *personaje* siguiendo
> un *guión*, repartido por un *director*, ante un *público*. Definir bien estos seis
> papeles es lo que evita la deriva (la meditación 2026-06-25 la encontró justo donde
> no estaban definidos).
>
> Esta capa es **agnóstica del substrato**: vale igual para un modelo multifacético
> (un actor, muchos personajes) que para una crew multiagente (muchos actores).

## Los seis papeles

| Papel | Qué es | Dónde vive | Ejemplo |
|---|---|---|---|
| **Personaje** | el rol/identidad que se interpreta | `CREW.md` (los Nakamas) | Nami, Robin, Zoro |
| **Actor** | quién lo interpreta (modelo/substrato) | columna "actor" del ledger | claude-code, DeepSeek, Codex |
| **Guión** | qué dice/hace el personaje (portable, agnóstico del actor) | `.claude/skills/<x>/SKILL.md` | `robin-meditacion`, `sueno` |
| **Director** | reparte papeles y dice "acción" | `OPERACIONES.md` + `RUTINAS.md` + el Capitán | `op-amanecer`; el scheduler |
| **Escena** | el contexto: dónde y cuándo | entorno + trigger | Routine nocturna en la nube · sesión en el repo · Laboon en el VPS |
| **Público** | quién recibe la obra y la atestigua | la Bitácora/spine + el Capitán + Avatares de audiencia | la entrada en la Bitácora |

## Las cuatro leyes

**1. Ley de reparto — Actor ≠ Personaje.** El casting (qué actor encarna qué
personaje) es explícito en cada escena. *Rotación* = mismo personaje, otro actor.
*Fusión* = un actor que ya solo sabe ser un personaje. La función de sueño vigila
esto: el `streak` del ledger cuenta pares actor+personaje; a los 3 ciclos iguales,
recomienda rotación.

**2. Ley del guión — el guión es agnóstico del actor.** Una skill es Markdown
portable que cualquier modelo lee y ejecuta. Por eso la elección *modelo
multifacético vs. crew multiagente* es **diferible**: el mismo guión admite el
reparto de un actor con muchas máscaras (Groot y sus caras) o de muchos actores
distintos.

**3. Ley del público — el público canónico es el spine.** "Si una rutina no escribe
a la Bitácora, no ha cerrado" = **si el público no lo vio, la escena no ocurrió.**
Toda escena cierra ante su público (`crew-cerrar-bitacora`).

**4. Ley del director — está abierta.** Hoy el casting y el "acción" los dan el
Capitán + el scheduler. Quién dirige en la versión soberana (¿Brook? ¿un
meta-orquestador?) es **la decisión de diseño pendiente** — el papel infradefinido
del sistema.

## Relación con los registros

- **Personaje** → `CREW.md` (roster de Nakamas).
- **Guión** → `.claude/skills/` (armería de skills).
- **Director** → `OPERACIONES.md` (coreografías) + `RUTINAS.md` (cuándo corre cada una).
- **Escena · Actor · Público** → no tienen registro propio: viven en el entorno, en
  la columna "actor" del ledger, y en la Bitácora, respectivamente.

## Nota de desambiguación (resuelve la colisión "Nakama")

"Nakama" es **Personaje**, no Público. Cuando los docs viejos llamaban "Nakama" a un
*cliente/audiencia*, mezclaban dos papeles. El cliente externo es un **Avatar de
audiencia** = faceta del Público. Ver `state/meditacion/RECONCILIACION_v0.md` (D1).
