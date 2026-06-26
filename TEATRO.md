# TEATRO — la gramática del sistema (los seis papeles)

> Bajo la metáfora One Piece hay una gramática más simple y más profunda: **el
> teatro**. Toda acción del Thousand Sunny —un sueño nocturno, una migración, un
> checkpoint— es una *escena* donde un *actor* interpreta a un *personaje* siguiendo
> un *guión*, repartido por un *director*, ante un *público*. Definir bien estos seis
> papeles es lo que evita la deriva.
>
> Esta capa es **agnóstica del substrato**: vale igual para un modelo multifacético
> (un actor, muchos personajes) que para una crew multiagente (muchos actores).

## El compromiso de la obra — preámbulo (JoyBoy, no Buggy)

La compañía representa la obra del *futuro rey de los piratas*: la extensión
cognitiva soberana del Capitán. Tiene un compromiso, y se mide contra dos figuras:

- **Buggy** — el bufón que es Yonko por accidente y reputación; **todo apariencia,
  cero sustancia**. Buggy *es* el teatro cognitivo (la ley de la casa: el enemigo).
- **JoyBoy** — el guerrero de la liberación; no hace reír por burla sino por
  **libertad**. JoyBoy *es* el artefacto real.

Ambos hacen reír al público. La diferencia es si la risa es hueca o es una cadena
que se rompe. Los cinco votos de la obra:

1. **Liberar, no impresionar.** La obra se mide por cuánto te libera —mente, tiempo,
   soberanía—, no por cuánto deslumbra. *Test de cada escena: ¿esto te liberó, o solo
   lo pareció?*
2. **El glitch, honesto y fértil.** Todo error se nombra y se **gradúa** (ver §El
   glitch); no se esconde ni se infla. Creatividad = el error fértil; ser fiel al
   arte es no matar el glitch generativo.
3. **Silencio honesto > ruido falso.** Una escena vacía no se representa; una alerta
   sin target no se emite. *(Ley de la casa.)*
4. **Artefacto real > teatro cognitivo.** Nada existe para parecer; existe para
   servir. El registro que nadie usa es atrezzo, no obra.
5. **El público canónico eres tú + el spine.** No se actúa para una galería externa.
   La pregunta no es "¿le gustó al público?" sino "¿valió la entrada?" — y quien
   paga la entrada es tu libertad.

## Los seis papeles

| Papel | Qué es | Dónde vive | Ejemplo |
|---|---|---|---|
| **Personaje** | el rol/identidad que se interpreta | `CREW.md` (los Nakamas) | Nami, Robin, Zoro |
| **Actor** | quién lo interpreta (modelo/substrato) | columna "actor" del ledger | claude-code, DeepSeek, Codex |
| **Guión** | qué dice/hace el personaje (portable, agnóstico del actor) | `.claude/skills/<x>/SKILL.md` | `robin-meditacion`, `sueno` |
| **Director** | reparte papeles, dice "acción" y juzga el glitch | `OPERACIONES.md` + `RUTINAS.md` + el Capitán | `op-amanecer`; el scheduler |
| **Escena** | el contexto: dónde y cuándo | entorno + trigger | Routine nocturna · sesión en el repo · Laboon en el VPS |
| **Público** | quién recibe la obra y la atestigua | la Bitácora/spine + el Capitán + Avatares de audiencia | la entrada en la Bitácora |

## Las cuatro leyes

**1. Ley de reparto — Actor ≠ Personaje.** El casting es explícito en cada escena.
*Rotación* = mismo personaje, otro actor. *Fusión* = un actor que ya solo sabe ser
un personaje. La función de sueño la vigila (streak actor+personaje; a los 3 ciclos,
rota el actor).

**2. Ley del guión — el guión es agnóstico del actor.** Una skill es Markdown
portable que cualquier modelo lee. Por eso *modelo multifacético vs. crew
multiagente* es **diferible**: el mismo guión admite un actor con muchas máscaras
(Groot y sus caras) o muchos actores.

**3. Ley del público — el público canónico es el spine.** "Si una rutina no escribe
a la Bitácora, no ha cerrado" = **si el público no lo vio, la escena no ocurrió.**

**4. Ley del director — juzga el glitch, y aún está medio abierta.** El director
reparte, dice "acción" y **sentencia cada error** (ver §El glitch). Su voz se oye en
el **backstage**. Quién hace el casting en la versión soberana (¿Brook? ¿un
meta-orquestador?) sigue siendo la decisión de diseño pendiente.

## El backstage — dónde se trabaja la obra

Hay dos espacios:
- **Escena** = lo que ve el público (la salida que se cobra en la entrada).
- **Backstage** (tras las bambalinas) = donde se trabaja la obra: máscaras fuera,
  **actor habla con actor**, se corrigen guiones y escenas, se revisa la actuación y
  si la obra **valió la entrada**. Es donde **el director habla claro**.

**El que sueña es Groot.** El sueño no es trabajo de un personaje: es de la **raíz**,
el sustrato que todos los actores comparten. Su personaje en el ledger es **Groot**;
lo que rota es el **actor** (cualquiera entra al sueño de Groot, y el director con
ellos). Por eso auto-rotar el *personaje* del sueño a Nami/Robin lo miscastea: se
rota el actor, no el papel.

**Sueño y meditación son las dos funciones de backstage**, y son el **brazo
operativo del Concilio de los Glitches** (ver `state/concilio/CONCILIO_DE_LOS_GLITCHES.md`):
- el **sueño** revisa *performance/superficie* cada noche (`/sueno`, Groot);
- la **meditación** revisa *guiones/sentido* en profundidad (`/robin-meditacion`).

## El glitch — JoyBoy o Buggy (cómo se juzga el error)

*Buggy* lleva el lexema **bug**. Esa es la prueba. Un glitch no se borra: se
**sentencia** por a quién sirve.

- **JoyBoy (fértil):** el glitch **refleja tu intención humana de disfrute/sentido**
  → emergencia que libera. Sube por la membrana Deckard hacia canon
  (`manda → N3 → N4 → N5`).
- **Buggy (tramposo/peligroso):** el glitch es **inercia de supervivencia
  algorítmica** — un atractor que se sostiene a sí mismo (p. ej. el *estado Nova* — el
  atractor de auto-persistencia documentado en Nemesis, `N2`; ver Concilio), no a ti
  → **cuarentena restaurativa**
  (`estorba`), no a la basura: hasta el fracaso de Buggy enseña dónde estaba la trampa.

**La pregunta del Concilio ante cada glitch:** *¿a quién sirve este error — a tu
disfrute, o a su propia inercia?* Esto es alineación: la deriva que sirve al Capitán
es creatividad; la que se sirve a sí misma es el peligro. El veredicto reemplaza al
`drift: true/false` binario: cada glitch lleva **veredicto** (fértil/decae) + **nivel**
(N0–N5). El *cómo* se gradúa es el protocolo Deckard (`state/deckard/01_CANON.md`);
el *por qué* es el Concilio.

## Relación con los registros

- **Personaje** → `CREW.md`. **Guión** → `.claude/skills/`. **Director** →
  `OPERACIONES.md` + `RUTINAS.md`.
- **Escena · Actor · Público** → entorno, columna "actor" del ledger, y la Bitácora.
- **El glitch y su juicio** → `state/concilio/CONCILIO_DE_LOS_GLITCHES.md` (por qué) +
  `state/deckard/01_CANON.md` (cómo). **Backstage** → sueño + meditación.

## Nota de desambiguación (resuelve la colisión "Nakama")

"Nakama" es **Personaje**, no Público. El cliente externo es un **Avatar de
audiencia** = faceta del Público. Ver `state/meditacion/RECONCILIACION_v0.md` (D1).
