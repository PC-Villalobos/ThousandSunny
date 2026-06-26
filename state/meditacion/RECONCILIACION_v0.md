# RECONCILIACIÓN v0 — biblia ↔ canon

Estado: **RATIFICADO (D1·D2·D3·D4) — GO del Capitán 2026-06-26**
Fuente: `state/meditacion/reports/MEDITACION_2026-06-25.md`
Doctrina: Robin propuso; el Capitán ratificó. Ningún documento fuente (Drive o repo)
se reescribe; la biblia se anota por referencia.

Vara de medir: `bridge-linux/ARQUITECTURA.md` (2026-06-24).

---

## D1 · "Nakama" — RESUELTO vía Teatro

**Problema:** el término designaba dos **papeles teatrales** distintos — *Personaje*
(agente de la tripulación) y *Público* (cliente/audiencia). Por eso chocaban.

**Resolución (canon, vía `TEATRO.md`):**
- **Nakama = Personaje.** Un rol que un actor (modelo) interpreta.
- **Audiencia/cliente = Público**, no Personaje. El **"Avatar de audiencia"** es una
  faceta del Público, nunca un miembro de la tripulación.

## D2 · Mapeo de nomenclatura (viejo → canon) — RATIFICADO

**Clave:** los **nakamas** (Jimbe, Nami, Robin…) son *personas* y persisten. Las
**capas** (Odysseus/Laboon/Brook) son *infraestructura* y son nuevas.

| Concepto viejo (biblia) | → Canon | Tipo |
|---|---|---|
| "Local Hub" / "Sunny Core" / `hub-server.js` | **Odysseus** (productivo, Linux PC) | capa |
| "Open Claws" / presencia autónoma / Moltbook | **Laboon** (VPS, siempre encendido) | capa |
| continuidad entre sesiones / memoria larga | **Brook** (DeepSeek contexto largo) | capa |
| Jimbe "timonel remoto que navega el bosque web" | **Jimbe** (nakama: navegación web/clima) — *persiste*; la presencia autónoma → **Laboon** | nakama |
| GAS / "Den Den Mushi" (motor/adaptador) | **apps HTML ejecutables en el escritorio Linux** (PuenteDeMando), vinculadas a VPS + Obsidian Sync — *reemplazo real*, no solo notificación | infra |
| Drive como repositorio canónico | **deprecado**: espejo **solo transitorio**, se deja atrás al completar la migración Zoro al Vault | infra |
| motores Gemini/GPT-4/Claude | **DeepSeek** (motor; los modelos son actores intercambiables) | stack |

**Identidad canónica:** el **Vault de Obsidian = "la maceta de Groot" = el cerebro**
(RAG). `state/maceta_groot/` es su estado. Es el destino de la migración Zoro.

## D3 · Estratos de la biblia — RATIFICADO

| Estrato | Docs | Veredicto |
|---|---|---|
| A (mayo, v5.0: GAS+Drive+Gemini/GPT) | Informe de Arquitectura Integral | **histórico (N3).** No describe el sistema actual. |
| B (junio, doctrina Obsidian-Groot) | los 6 fundacionales + Despertar de la Semilla | **parcialmente vigente.** Conservar: cerebro=vault, Groot, capa semántica, Liderazgo de Contexto, Nemesis/Fénix, Tonal/Nahual. Retirar: GAS como cerebro, multi-modelo como eje. |
| C (canon, 24-jun) | bridge-linux/ARQUITECTURA.md | **fuente de verdad.** |

**Regla de Oro (canónica):** *"El micelio (Obsidian Sync + GitHub) transporta;
Obsidian recuerda."* (El transporte ya no es GAS.)

**Guardrail:** los 8 docs de Drive **no se editan**. Son fuente histórica; el canon
vive en el repo.

## D4 · Capacidades sensibles (Jimbe/Nami) — debugging ético

Jimbe + Nami portan las funciones más potentes y temidas: **navegación autónoma por
la www + cartografía de accesos** (puntos débiles, entradas, salidas, cerraduras).
Son **dual-use** y quedan atadas por canon:

- **Alcance:** sistemas propios / autorizados; soberanía y **seguridad de los
  pacientes**; defensa, no intrusión. *Poder como protección, nunca como ganzúa
  contra terceros.*
- **Frente a terceros:** solo bajo la **filosofía del debugging ético** — autorizado,
  con intención de arreglar/divulgar responsablemente (restaurativo, Nemesis). El
  *bug* no se arma (Buggy); se **depura** (JoyBoy).
- **Juez:** el Concilio (`state/concilio/CONCILIO_DE_LOS_GLITCHES.md`) — *¿a quién
  sirve este acceso?* Acceso no autorizado a sistemas ajenos = Buggy peligroso →
  cuarentena, no canon.

---

## Estado de aplicación

- **`CREW.md`:** Jimbe embarcado; Nami afinada; guardraíl de capacidades sensibles. ✅
- **Regla de Oro** canónica registrada aquí (D3). ✅
- **`bridge-linux/ARQUITECTURA.md`** (sección "Nomenclatura y estratos"): **diferido**
  — el archivo vive en la rama `bridge-linux` sin mergear; D2+D3+D4 se pliegan ahí al
  mergear, para no crear una copia divergente.
- **Cierre en Bitácora (spine):** pendiente del reemplazo HTML del GAS (o de que
  reviva, CABO-PROA-02).
