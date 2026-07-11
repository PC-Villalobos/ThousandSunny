---
aliases: [bridge-linux-bitacora-codex-20260711]
---

# Bitacora — Integracion de Codex (recuperacion de contexto)

Estado: checkpoint honesto
Fecha: 2026-07-11
Actor: claude-code (sesion remota, infra GitHub)
Referencia de diseno: `bridge-linux/ARQUITECTURA.md`, `bridge-linux/HITO_0_FAST_START.md`

## Por que existe este documento

Hubo una sesion previa en la que se intento "integrar Codex en el disco duro a
traves de Linux". Al volver, la app no estaba disponible como se esperaba y no
quedaba contexto de aquella sesion. Esta bitacora fija los hechos verificados
para que el contexto **no se vuelva a perder**: la regla del ecosistema es que
lo que no se hace commit + push en un contenedor efimero, se evapora.

## Hallazgo en git (verificado 2026-07-11)

- La rama `claude/codex-linux-integration-2bceg2` **no tiene commits propios** en
  ninguno de los dos repos (ThousandSunny y PuenteDeMando). Es un puntero recien
  creado sobre la punta de la mainline (ultimo parte nocturno de la funcion de
  sueno). Reflog: `Created from HEAD`.
- No hay stash, ni ramas huerfanas, ni ficheros sin seguir con ese trabajo.
- Conclusion: el trabajo de aquella sesion **nunca se persistio en git**. En la
  nube no es recuperable; solo lo seria si quedo algo en el disco local del PC.

## Realidad del Codex actual (segun el pantallazo aportado)

- Corria en `C:\Windows\System32` -> es **Windows**, no el disco Linux que se
  pretendia. La integracion en Linux (capa Odysseus) no llego a materializarse.
- Codex es una **CLI de terminal**, no una app de escritorio. El "no tengo la app
  disponible" es una divergencia de expectativa: lo instalado *es* Codex, en
  consola.
- Instalacion a medio configurar:
  - MCP `github` falla: falta la variable de entorno del PAT de GitHub.
  - MCP `notion` falla: falta `codex mcp login notion`.
  - Version antigua (0.120.0; disponible 0.144.1).

## Reconciliacion con el plan bridge-linux

Segun `ARQUITECTURA.md` + `HITO_0_FAST_START.md`:

- Quien debe alojar Codex es **Odysseus = el PC Linux**, junto a Claude Code, el
  vault de Obsidian local y Ollama.
- El PC Linux figuraba **"en reparacion"**; por eso el Hito 0 arranca por el VPS
  (Laboon) desde el movil, y Codex/Odysseus quedan **explicitamente para "lo que
  SI espera al PC"**.
- Por tanto, instalar Codex en Windows adelanta un paso que el plan situaba al
  final, y en el sustrato equivocado. No esta "roto"; esta fuera de plan.

## Estado real (fuente de verdad a hoy)

| Elemento | Estado |
|---|---|
| Codex en disco Linux (Odysseus) | NO hecho |
| Codex CLI en Windows | Instalado, a medio configurar (MCP caidos, version vieja) |
| Contexto de la sesion previa | Perdido (nunca se hizo commit) |
| Plan bridge-linux | Intacto y vigente como diseno de referencia |
| Hub / estado vivo del barco | No alcanzable desde infra remota |

## Proximo paso (a decidir por el Capitan)

Dos rumbos, no excluyentes:

1. **Arreglar el Codex de Windows** como puente temporal: exportar el PAT de
   GitHub a la variable que Codex espera, `codex mcp login notion`, y actualizar
   a 0.144.1.
2. **Montar la integracion en Linux (Odysseus)** siguiendo bridge-linux, cuando el
   PC/disco este confirmado operativo. Requiere el estado real del PC.

## Blockers

- Sin acceso al hub desde esta infra remota (no se puede leer estado vivo).
- Sin confirmacion de si el PC/disco Linux esta ya operativo o sigue en reparacion.

## Checkpoint (para mirror al sumidero)

- **title:** Recuperacion de contexto — integracion Codex Linux
- **summary:** La sesion previa de integracion de Codex no persistio nada en git
  (rama vacia). El Codex real corre en Windows (no Linux), es CLI (no app) y tiene
  los MCP github/notion caidos. Plan bridge-linux intacto: Codex pertenece a
  Odysseus (PC Linux), que estaba en reparacion. Se deja esta bitacora para no
  perder el contexto otra vez.
- **project:** thousand_sunny_operativo
- **actor:** claude-code
- **tag:** bridge-linux, codex, recuperacion
- **next:** Decidir entre arreglar Codex en Windows (conectar MCP + actualizar) o
  montar Odysseus en el disco Linux segun HITO_0.
- **blocker:** Hub no alcanzable desde infra remota; estado del PC Linux sin
  confirmar.
