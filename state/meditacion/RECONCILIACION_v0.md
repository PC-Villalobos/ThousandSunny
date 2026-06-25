# RECONCILIACIÓN v0 — biblia ↔ canon

Estado: **PROPUESTA · requiere ratificación del Capitán**
Fuente: `state/meditacion/reports/MEDITACION_2026-06-25.md`
Doctrina: Robin propone, no impone. Nada de esto es canon hasta tu GO; ningún
documento fuente (Drive o repo) se reescribe sin ratificación.

Vara de medir: `bridge-linux/ARQUITECTURA.md` (2026-06-24).

---

## D1 · Qué significa "Nakama"

**Problema:** el término designa dos cosas que chocan — *agente de la tripulación*
(Informe Integral, CREW.md, canon) y *cliente/audiencia* (docs de mayo/junio).

**Recomendación (alta confianza):**
- **Nakama = agente-tripulación.** Es el uso del canon entero (CREW.md, la tabla de
  personalidades de bridge-linux, las skills `<nakama>-*`). Se queda.
- El sentido *cliente/audiencia* se renombra a **"Avatar de audiencia"** para
  deconflictar. (Si prefieres otro término — "perfil de cliente", "persona" — dilo.)

**Alternativa:** mantener ambos con calificador explícito ("Nakama-tripulante" vs
"Nakama-audiencia"). Menos limpio; no recomendado.

## D2 · Mapeo de nomenclatura (viejo → canon)

**Clave:** los **nakamas** (Jimbe, Nami, Robin, Zoro…) son *personas* y persisten.
Las **capas** (Odysseus/Laboon/Brook) son *infraestructura* y son nuevas. La biblia
mezclaba ambas; aquí se separan.

| Concepto viejo (biblia) | → Canon | Tipo |
|---|---|---|
| "Local Hub" / "Sunny Core" / `hub-server.js` | **Odysseus** (productivo, Linux PC) | capa |
| "Open Claws" / presencia autónoma / siembra Moltbook cada 4h | **Laboon** (VPS, siempre encendido) | capa |
| continuidad entre sesiones / memoria larga | **Brook** (DeepSeek contexto largo) | capa |
| Jimbe "timonel remoto que navega el bosque web" | **Jimbe** (nakama: navegación web/clima) — *persiste*; la presencia autónoma se va a **Laboon** | nakama |
| GAS / "Den Den Mushi" como motor | legacy → notificación/presencia opcional | infra histórica |
| Drive como repositorio canónico | espejo navegable, **no** fuente de verdad | infra |
| motores Gemini/GPT-4/Claude | **DeepSeek** (motor único) | stack |

## D3 · Estratos de la biblia y qué hacer con ellos

| Estrato | Docs | Veredicto |
|---|---|---|
| A (mayo, v5.0: GAS+Drive+Gemini/GPT) | Informe de Arquitectura Integral | **histórico (N3).** No describe el sistema actual. Conservar como registro, no como arquitectura vigente. |
| B (junio, doctrina Obsidian-Groot) | los 6 fundacionales + Despertar de la Semilla | **parcialmente vigente.** Conservar: cerebro=vault, Groot, capa semántica, Liderazgo de Contexto, Nemesis/Fénix, Tonal/Nahual. Retirar: GAS como cerebro, multi-modelo como eje. |
| C (canon, 24-jun) | bridge-linux/ARQUITECTURA.md | **fuente de verdad.** |

**Regla de Oro — forma canónica propuesta:**
de *"GAS no piensa, GAS transporta; Obsidian recuerda"*
→ **"El micelio (Obsidian Sync + GitHub) transporta; Obsidian recuerda."**
(El "transporte" ya no es GAS, es el micelio.)

**Importante (guardrail):** los 8 docs de Drive **no se editan**. Son fuente
histórica. El canon vive en el repo; la biblia se *anota por referencia*, no se
reescribe.

---

## Qué aplico al ratificar (GO)

Solo tras tu ratificación, y solo en el **repo** (nunca en los docs de Drive):

1. Añadir a `bridge-linux/ARQUITECTURA.md` una sección breve **"Nomenclatura y
   estratos"** con la tabla D2 + la marca de estratos D3, para que el canon lleve
   su propio glosario de equivalencias.
2. Fijar **Nakama = agente** (D1) en `CREW.md` con una nota de desambiguación.
3. Registrar la Regla de Oro canónica donde corresponda.
4. Cerrar en la Bitácora (spine) vía `crew-cerrar-bitacora` cuando el GAS reviva.

Si corriges alguna decisión (p.ej. el término para "audiencia", o un mapeo),
ajusto antes de aplicar.
