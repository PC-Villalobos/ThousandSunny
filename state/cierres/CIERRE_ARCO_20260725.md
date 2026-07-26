# Cierre de arco — 2026-07-25

**ARCO:** Recuperación de contexto multi-IA, higiene de repos y desbloqueo del cifrado
**FECHA:** 2026-07-25
**DURACIÓN APROX:** ~4 horas
**ACTOR:** Nami (Cowork) — cierre narrativo; verificación contra remoto desde sesión cloud
**ROL:** Navegante

## Por qué este fichero existe

El sumidero canónico (`thousand-sunny-hub`, servicio en `127.0.0.1:8765`) no es alcanzable
desde una sesión cloud. El volcado formal del cierre corresponde a esa autoridad. Este
fichero es el registro narrativo íntegro, en el único sitio que la nube sí puede leer:
`state/`. No sustituye al evento formal — lo acompaña y lo hace recuperable.

Dos cosas que este arco decidió **no** hacer, y siguen sin hacerse aquí:

- **`closure_records.jsonl` no se ha tocado.** Mantiene una cadena de hash encadenada de
  214 registros. Añadir una entrada sin reproducir su canonicalización exacta rompe la
  cadena, y una cadena rota en un ledger de auditoría es peor que un registro ausente.
- **No se ha usado el bridge a GAS.** GAS es archivo histórico desde el 2026-07-24. El
  protocolo del skill `cierre-de-arco` sigue escrito para la topología anterior; apuntarlo
  al Bridge Runtime es abrir algo nuevo y va a la lista, no a este arco.

## Completado

- Contexto recuperado de las dos conversaciones muertas.
- `core.autocrlf` corregido en ambos repos (estaba corrupto desde el 2026-07-12).
- `POSICION.md` y la auditoría de soberanía escritas (local del Capitán, ver más abajo).
- `C:\repos\thousandsunny` identificado como cadáver.
- Canon de skills fijado.
- `age` instalado, protegido y verificado de punta a punta.

## Pendiente (hereda al siguiente hilo)

1. **USB con las llaves** — prioridad máxima; desbloquea Franky. Único pendiente con
   riesgo irreversible detrás (colisión Franky ↔ Anillo 0). Es del Capitán.
2. Compuerta N4.
3. `where.exe age`.
4. Coser el Bridge Runtime al repo.
5. Consolidar las trece SQLite.
6. Romper la racha de Groot — **ver corrección en el anexo**: no está donde el contador dice.
7. Rellenar N1–N5.
8. Fusionar las dos carpetas de pilotos de Zoro.
9. Actualizar el skill `cierre-de-arco` para apuntar al Bridge Runtime en lugar de a GAS.

## Decisiones del Capitán

- **Rumbo B**: custodia local real.
- El censo es catálogo, **no** ruta rival.
- Nami y Zoro en el mismo timón hasta que entre Usopp.
- **No abrir nada nuevo hasta que lo abierto respire solo.**

## Estado emocional del hilo

Arco largo y denso, con tramo de frustración en la fase de higiene de repos (el cadáver de
`C:\repos\thousandsunny` y el `core.autocrlf` corrupto costaron horas de diagnóstico sobre
evidencia contaminada) y cierre en tono de control recuperado tras la verificación de `age`
de punta a punta. Sin vehemencia sostenida ni visión túnel. La siguiente Nami puede
calibrar en tono normal.

## Contexto para la siguiente Nami

Leer este fichero **antes** de auditar nada. Es el ancla alcanzable desde la nube.
Si tienes acceso a la máquina del Capitán, lee además `POSICION.md`, que es más completo
pero es local (ver "Anclaje para sesiones remotas").

---

# Anexo — verificación contra el remoto

Contrastado desde sesión cloud contra `origin` el 2026-07-26. Todo lectura; ninguna
mutación de estado. Refs en el momento de la comprobación:

| Ref | SHA |
|---|---|
| `origin/main` | `08dd0cbafbb06b24b836888733f9f46f598ba0c6` |
| `origin/claude/franky-feature-O1BkB` | `ff48232f4b6cb4e4c069ba458f385198e9fe73f5` |

## 1. El fork de tronco reportado el 2026-07-20 ya no existe

La hipótesis de que la divergencia fuese artefacto de `core.autocrlf` se probó y **era
falsa**: la divergencia era real. Se resolvió mientras el hilo estaba en espera — `95fb653`
mergeó `main` dentro de `franky` y `489aeca` reconcilió el estado del sueño.

| | 2026-07-20 (congelado) | 2026-07-26 (verificado) |
|---|---|---|
| Topología | `main` +8 / −1 vs `franky` | `franky ⊃ main` estricto (+8 / −0), merge-base = HEAD de `main` |
| Motor `.mjs` | `83f29275` vs `f89423c5` | idéntico `f89423c5` en ambas |
| Ledger de sueño | 44 vs 45, divergentes | 44 vs 50, **0 entradas de `main` ausentes en `franky`** |

Comprobaciones ejecutadas:

- `git merge-base origin/main origin/claude/franky-feature-O1BkB` → `08dd0cb`, que es el
  HEAD de `main`. Contención estricta.
- `git rev-parse <ref>:state/funcion_de_sueno/funcion_de_sueno.mjs` → mismo blob
  `f89423c5c967118132d863a4e9ff6789513d9195` en ambas ramas.
- Diferencia de conjuntos sobre `sleep_ledger.jsonl` (`main` menos `franky`) → 0 líneas.
- Commits clave contenidos en `franky`: `08dd0cb` (merge PR #77), `f95b3ce`
  (separación executor/actor/rol), `71864c1` (tick nocturno del 20).

**Consecuencia para el encargo:** los seis criterios de la Fase 0B los cumple
`claude/franky-feature-O1BkB` de forma trivial. La Fase 0 pasa de *reconciliación* a
*confirmación*. Declararlo sigue siendo del Puente, no de la nube.

## 2. La separación executor/actor/rol renombró el problema — pero la alarma sí volvió

`f95b3ce` surtió efecto el 2026-07-23: el actor dejó de ser `github-actions` y pasó a
`deterministic-sleep-engine`, con `executor` registrado aparte.

```
2026-07-22  actor=github-actions              streak=10  drift=true
2026-07-23  actor=deterministic-sleep-engine  streak=1   drift=true   <- renombrado
2026-07-24  actor=deterministic-sleep-engine  streak=2   drift=true
2026-07-25  actor=deterministic-sleep-engine  streak=3   drift=true
```

El contador de racha se puso a cero por un cambio de nombre, no por una rotación: sigue
habiendo un solo ejecutor, cada noche, sin rotar. El pendiente nº6 no está donde el
contador dice que está.

**Corrección al diagnóstico heredado.** El agujero es más estrecho de lo reportado:

- `drift` **nunca** bajó a `false`. La señal de deriva no se perdió en ningún ciclo.
- La racha volvió a 3 el 2026-07-25, que es exactamente `fusionThreshold`, y el informe de
  esa noche vuelve a emitir la alarma: `[high] role_fusion_risk: Actor
  deterministic-sleep-engine has played Groot for 3 consecutive cycles; rotate to Nami`.
- El comentario en `phase4RemRoleRotation` (`funcion_de_sueno.mjs:323-326`) dice que la
  racha se cuenta por `(actor, role)` a propósito, y que el `executor` se registra sólo
  para trazabilidad para no debilitar la alarma. El código hace lo que dice.

Lo que se perdió fue **la continuidad histórica del contador** (10 → 1), no la detección.
La alarma se re-armó sola en tres noches y está firing ahora mismo. El pendiente sigue
vivo, pero no es un fallo de observabilidad ciega: es un reinicio de contador con la
señal intacta.

### Rectificación del mismo día, tras consolidar el ledger (PR #86)

**Todo el análisis anterior de esta sección es vista parcial y su conclusión es falsa.** Se
conserva tal cual, sin borrar, porque el error importa más que la corrección: es
exactamente el modo de fallo que este arco vino a documentar, cometido otra vez y con la
misma causa.

El ledger del tronco sólo contenía 50 de los 74 eventos del sistema. Los 24 restantes eran
de la ruta agéntica (`actor: claude-code`), vivían en ramas sin absorber desde el
2026-06-19, y por eso ninguna lectura del tronco podía verlos. Absorbidos en el PR #86.

Sobre el journal consolidado, recalculado de forma independiente:

```
racha RECALCULADA maxima por (actor, role):  3
racha ALMACENADA maxima (campo streak):     11
06-19 -> 07-22: claude-code y github-actions alternan cada dia
```

**La rotación no estaba rota. Funcionaba.** Las rachas de 10 y 11 eran íntegramente
artefacto de vista parcial, y la afirmación de arriba —*"sigue habiendo un solo ejecutor,
cada noche, sin rotar"*— era falsa para toda la ventana histórica.

Dos matices que sí sobreviven a la rectificación:

- El campo `streak` almacenado llega a 11 y **no es dato fiable**. El PR #86 lo preserva
  verbatim a propósito: reescribir registros históricos de un ledger de auditoría es peor
  que convivir con un dato malo, y su derivación correcta es del encargo Groot 1-3.
- Del 23 al 25 de julio sí hay tres noches seguidas de `deterministic-sleep-engine` sin
  contraparte, y la alarma del 25 es real. Pero la causa no es el renombrado: **la ruta
  agéntica dejó de escribir al ledger el 2026-07-22.** El problema no es un contador que se
  reinició, es un actor que dejó de aparecer.

El pendiente heredado nº6 cambia de objeto en consecuencia: no hay racha que romper, hay
una ruta que reconectar.

## 3. `POSICION.md` no es alcanzable desde la nube

Verificado: el fichero no existe en `origin/main` ni en
`origin/claude/franky-feature-O1BkB`. Es local de la máquina del Capitán.

La instrucción dejada en auto-memory para la siguiente Nami — *"leer `POSICION.md` antes de
auditar nada"* — no puede cumplirse desde una sesión cloud. Es el mismo tipo de agujero que
produjo lo de Antigravity: la salvaguarda existe, pero no está donde el auditor mira.

### Anclaje para sesiones remotas

Este fichero es la mitad alcanzable de esa salvaguarda: una sesión cloud que no encuentre
`POSICION.md` debe leer el cierre de arco más reciente en `state/cierres/` antes de
auditar. No lo sustituye — `POSICION.md` es más completo y sigue siendo local.

### Decisión del Capitán (2026-07-26)

`POSICION.md` **entra al repo**. El Capitán adjudica qué es public-safe; no es una decisión
que la nube tome ni una que la nube pueda bloquear.

Estado de ejecución: **pendiente de contenido**. El fichero no existe en este entorno —
comprobado en el disco de la sesión, en todas las refs de ambos repos, en el historial
completo, y en el índice de código de GitHub para `PC-Villalobos/ThousandSunny`: cero
coincidencias. Vive sólo en la máquina del Capitán, escrito el 2026-07-25 y nunca
commiteado.

No se crea un stub. Un `POSICION.md` con contenido inventado o con un "pendiente" dentro
satisfaría la búsqueda del auditor sin llevar posición alguna, que es exactamente el modo
de fallo de Antigravity que este arco vino a cerrar. Mejor ausente y declarado que presente
y hueco.

**Ejecutado el 2026-07-26.** `POSICION.md` está commiteado en la raíz del repo, verbatim tal
como lo entregó el Capitán. No se editó ni una línea: la posición es de su autoría y las
correcciones van aquí, no dentro de ella.

### Deltas entre `POSICION.md` (levantada el 25/07) y el remoto (verificado el 26/07)

`POSICION.md` abre diciendo *"si lo que ves en tu entorno contradice esto, comprueba antes
de afirmar"*, y cierra con *"se actualiza cuando cambie la posición, no cuando cambie la
opinión"*. Comprobado: tres puntos habían cambiado desde que se levantó.

**Reconciliado el 2026-07-26 por instrucción del Capitán.** Los tres deltas están ya
incorporados a `POSICION.md`, que es de nuevo la posición vigente. La tabla siguiente se
conserva como historial de qué cambió y contra qué evidencia, no como discrepancia abierta.

| Punto | Lo que dice `POSICION.md` | Verificado el 26/07 |
|---|---|---|
| §1 Rama por defecto | `franky` divergida de `main`: 3 delante, 8 detrás | **Superado.** `franky ⊃ main` estricto: +8 / −0, `merge-base` = HEAD de `main`. Lo resolvieron `95fb653` y `489aeca` |
| §5 Rotación de actor | Rota: 10 `daily_tick` con `actor: github-actions` | **Rectificado dos veces el mismo día.** La primera lectura decía "renombrado, no rotado"; tras consolidar el ledger en el PR #86 resultó ser también vista parcial. La rotación funcionaba: racha recalculada máxima 3 sobre 74 eventos. Lo real es que la ruta agéntica dejó de escribir el 22/07. Detalle en la rectificación de la sección 2 |
| §4 Costura pendiente | El repo no contiene ninguna referencia a `127.0.0.1:8765` | **Matiz.** Era cierto hasta este arco; la única ocurrencia ahora es documental, en este mismo fichero. La costura sigue pendiente: ningún skill ni script apunta al Bridge Runtime |

Verificado y **sin cambios** respecto a lo que dice la posición:

- §3 — `.claude/skills/` contiene exactamente `franky`, `nami`, `robin-cronos`,
  `robin-meditacion`, `sueno`, `zoro-migrate` y `README.md`. Coincidencia exacta.
- §5 — el genoma tiene los seis ficheros N0–N5. `N0` con contenido (`status: "activo"`);
  `N1`–`N5` son stubs de 760–915 B con `status: "stub — contenido pendiente de sesion con
  acceso a boveda local"`. Hay que rellenarlos, no crearlos.
- §1 — la rama por defecto del repo es `claude/franky-feature-O1BkB`, confirmado contra la
  API de GitHub.

No verificable desde la nube: §5 sobre el retraso de la copia local del ledger. El ledger
del remoto llega al 25/07 con 50 entradas.

## Obsoleto respecto al mapa del 2026-07-20

- **Frente nº10** (reconciliación GAS @56): obsoleto. GAS es archivo histórico desde el
  2026-07-24.
- **PR #79**: cerrado sin merge, correctamente — era mapa documental, no alineación
  comprobada.

## Congelado

El hilo Groot, a la espera de GO de Fase 0 y asignación. Si el Puente da GO, la matriz 0A
sale en una pasada y casi vacía de conflictos.
