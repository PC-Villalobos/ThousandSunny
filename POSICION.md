# POSICIÓN — punto verificado del Thousand Sunny

**Levantada el 2026-07-25 por Nami (Claude/Opus 5\) leyendo los árboles reales, no resúmenes.**

**Actualizada el 2026-07-26 desde sesión cloud, verificando contra `origin`.** Cambiaron tres puntos: §1 (la divergencia de tronco), §4 (la literalidad de la costura) y §5 (la racha de Groot). El historial del contraste está en `state/cierres/CIERRE_ARCO_20260725.md`.

**Segunda corrección, el mismo día, tras consolidar el ledger (PR #86).** La primera lectura de §5 seguía siendo vista parcial y concluía que la rotación de actor estaba rota. Es falso: la rotación funcionaba, y las rachas de 10 y 11 eran artefacto de leer sólo el tronco. §5 y el pendiente §6.3 quedan reescritos en consecuencia.

Cualquier nakama —Claude, Codex, Antigravity, Copilot, Gemini— lee este archivo **antes** de auditar, proponer o ejecutar nada. Si lo que ves en tu entorno contradice esto, tu entorno está mirando el árbol equivocado. Comprueba antes de afirmar.

---

## 1\. Árbol canónico

|  |  |
| :---- | :---- |
| **Repo canónico** | `C:\Users\usuario\OneDrive\Documentos\GitHub\ThousandSunny` |
| Remoto | `https://github.com/PC-Villalobos/ThousandSunny.git` |
| Rama por defecto | `claude/franky-feature-O1BkB`. **Ya no diverge de `main`:** lo contiene de forma estricta, 8 delante y 0 detrás, con `merge-base` en el HEAD de `main` (`08dd0cb`). Reconciliado el 2026-07-23 por `95fb653` y `489aeca`; verificado contra el remoto el 2026-07-26 |
| Repo hermano | `...\GitHub\PuenteDeMando` → `PC-Villalobos/PuenteDeMando`, rama `main` |

### Árboles que NO son el repo

- **`C:\repos\thousandsunny` — CADÁVER. No usar.** Contiene 3 archivos, **cero commits**, sin remoto, rama `claude/fervent-edison-GM0NB` sin historial. Solo tiene `state/metatron/genoma/N0-SEMILLA-METATRON.md`, `PLACENTA_ROOT.md` y `PLACENTA_INTEGRATION_PLAN.md`. La auditoría de Antigravity del 2026-07-24 leyó **este** árbol y por eso concluyó, erróneamente, que "solo existe N0".  
    
- **`D:\SunnyFranky\linux-llm-control-plane`** — `.git` vacío, sin HEAD ni índice. Workspace local no versionado, declarado `github=null`, `git_actions_allowed=false`. No es un clon de ThousandSunny.

---

## 2\. Higiene de git — resuelto el 2026-07-25

Desde el 2026-07-12 ambos repos aparecían con el árbol entero modificado: ThousandSunny mostraba 254 archivos y 22.912 inserciones contra 22.912 borrados, exactamente simétrico.

**Era falso.** Los blobs commiteados están en LF; los archivos en disco se reescribieron en CRLF y `core.autocrlf` estaba en `false`. Ni un solo cambio de contenido real.

Corregido: `core.autocrlf = true` en ThousandSunny y en PuenteDeMando. Ambos repos dan ahora **cero cambios**. Están limpios y sincronizados con su rama.

No revertir este ajuste. Era la causa de que los PR aparecieran `DIRTY`, de que ningún agente pudiera saber qué había cambiado de verdad, y del bloqueo de tres días de julio.

---

## 3\. Skills — una sola ubicación

**Canónica: `.claude/skills/`** dentro del repo canónico. Contiene: `franky`, `nami`, `robin-cronos`, `robin-meditacion`, `sueno`, `zoro-migrate`, más `README.md`.

**`.agents/` no es una convención de este sistema.** Es escombro: cada agente que pasó por aquí se inventó su propia carpeta. `D:\.agents` está vacío en unos sitios y poblado en otros; hay varias por el disco. Ninguna es autoridad.

Las 8 plantillas `SKILL.md` generadas el 2026-07-24 por Copilot y por Antigravity en `.agents/skills/` (`bitacora-cowork`, `contexto-sunny`, `push-genoma`, `drive-ops`, `guardia-nami`, `deckard-indexado`, `sient-etico`, `policy-franky`) **quedan obsoletas antes de nacer**: codifican GAS como backend de la bitácora, y eso contradice la decisión de soberanía del mismo día (§4). No se rescatan ni se fusionan. Se reescriben en `.claude/skills/` contra la bitácora local.

---

## 4\. Bitácora — autoridad

Decisión del Capitán, 2026-07-24, registrada como evento `BIT-20260724T134345Z`:

> La Bitácora de Hipatia en `http://127.0.0.1:8765` es la **autoridad operativa**. GAS queda como **antecedente histórico**. Google, Anthropic, OpenAI y Microsoft son apoyo puntual, no columna vertebral.

Circuito soberano: Klabautermann / Puente de Mando / Hipatia / vault / GitHub. JSONL es la fuente soberana; SQLite y Markdown se reconstruyen; Obsidian es vista.

**Costura pendiente:** ningún skill, script ni configuración del repo canónico apunta a `127.0.0.1:8765`. Desde el 2026-07-26 el repo sí lo **menciona**, pero sólo en prosa —este archivo y `state/cierres/`—, nunca en código ejecutable. El Hipatia Bridge Runtime vive fuera de ThousandSunny y el código del repo todavía no sabe que existe. Hasta que se cosa, cualquier skill o script que escriba en GAS está escribiendo en el archivo histórico, no en la bitácora viva.

---

## 5\. Estado real de las piezas

| Pieza | Estado verificado |
| :---- | :---- |
| Genoma Metatrón | Los **seis** archivos N0–N5 existen en `state/metatron/genoma/`. N0 tiene contenido (2.967 B). **N1–N5 son stubs** de \~850 B con `status: "stub — contenido pendiente de sesión con acceso a bóveda local"`. No hay que crearlos: hay que rellenarlos. |
| Función de Sueño | **Viva.** El remoto tiene parte nocturno del 2026-07-25. El ledger local llega al 07-22 solo porque la copia local va 13 commits por detrás. |
| Rotación de actor | **No estaba rota: era vista parcial.** Sobre el ledger consolidado (74 eventos, tras absorber en el PR #86 los 24 huérfanos de la ruta agéntica), la racha **recalculada** por `(actor, role)` no supera **3** en toda la historia del sistema. De 06-19 a 07-22 hubo alternancia diaria real entre `claude-code` y `github-actions`. Las rachas de 10 y 11 eran artefacto de leer sólo el tronco, que no veía la mitad agéntica de los eventos. El campo `streak` almacenado sigue llegando a 11 y **no es dato fiable**: se preservó verbatim a propósito. **Lo que sí es real hoy:** la ruta agéntica dejó de escribir el 2026-07-22, así que del 23 al 25 de julio hay tres noches seguidas de `deterministic-sleep-engine` sin contraparte, y el parte del 25 emite `[high] role_fusion_risk … rotate to Nami`. El problema no es un contador que se reinició: es que un actor dejó de aparecer. |
| Meditación semántica | Muda 12+ días, con 3 disonancias sin atender. |
| PLACENTA\_ROOT | Existe (2.316 B), conceptual. |
| Franky Build Kit (Linux) | Bloqueado: requiere USB booteable \+ backup verificado. |
| VM Ubuntu / Synthetic Lab | Congelada. VDI de 21 GB parado. |
| Telegram inbound | Incompleto (outbound OK). Health-monitor de `whatsapp:default` en bucle de reinicio cada 10 min. |

---

## 6\. Lo que falta de verdad

No es lo que decían las auditorías. Es esto:

1. **Coser el Hipatia Bridge Runtime al repo** — hoy son dos sistemas que no se conocen.  
2. **Rellenar N1–N5** con contenido real. Requiere al Capitán y acceso a la bóveda local.  
3. **~~Romper la racha de Groot~~ — reconectar la ruta agéntica al sueño.** El pendiente cambia de objeto: no había racha que romper (§5), la rotación funcionaba. Lo que hay que arreglar es que la ruta agéntica dejó de escribir al ledger el 2026-07-22, dejando un solo actor por noche desde el 23.  
4. **Atender las 3 disonancias** de la meditación semántica.  
5. **Reescribir las skills** que faltan, en `.claude/skills/`, contra la bitácora local.

Lo que **no** hace falta: nube, AWS, workflow engine nuevo, ni una segunda barredora. El arnés existente aguanta.

---

*Este archivo se actualiza cuando cambie la posición, no cuando cambie la opinión.*  
