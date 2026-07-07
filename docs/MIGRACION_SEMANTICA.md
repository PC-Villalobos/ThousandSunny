# Migración semántica — el verdadero Hito 0

Estado: **canon** · Prioridad: **ABSOLUTA** · Fuente: Capitán, 2026-06-27

## La corrección de rumbo

El Hito 0 **no** es Linux ni `groot awaken`. Es:

> **Completar la migración semántica total de Drive → Obsidian, documento a
> documento, preservando significado, contexto y relaciones.**

Todo lo demás depende de eso. Va **antes** de cualquier migración tecnológica.

## La ruta corregida

| Fase | Qué | Estado |
|---|---|---|
| **0** | **Migración semántica completa (Drive → Obsidian)** | **prioridad absoluta — en curso (Codex)** |
| 1 | Congelación definitiva de Drive (archivo histórico) | gated por Fase 0 |
| 2 | Disco Groot (genoma portable) | `disco-groot/` por montar |
| 3 | Groot Awaken (bootstrap universal) | gated |
| 4 | Migración Windows → Linux | gated |
| 5 | Sistema operativo en lenguaje natural | gated |
| 6 | Modelos locales de mayor potencia (Mythos u otros) | gated |

(Esta ruta corrige la numeración de hitos de `bridge-linux/ARQUITECTURA.md`: el
buildout de Open WebUI/nakamas vive *dentro* de las fases 3-5, no antes de la 0.)

## La migración NO es una copia — es una traducción ontológica

No es `Drive → Markdown`. Es:

```
Documento bruto
  -> análisis semántico
  -> detección de redundancias
  -> clasificación Deckard (N0-N4)
  -> identificación de fósiles
  -> enlaces conceptuales
  -> integración en la Maceta de Groot
```

Es labor **arqueológica**. Cada documento debe responder, **antes** de entrar en
Obsidian:

- ¿Sigue vivo? ¿Es canónico? ¿Es un fósil?
- ¿Se fusiona con otro? ¿Se reescribe? ¿Se marca como histórico?
- ¿A qué otros documentos alimenta?
- **¿Qué experiencia humana contiene? ¿Qué función cumple en tu vida?**
- **¿Qué mito o imagen sostiene? ¿Qué riesgos sofísticos esconde?**

Por eso es **hermenéutica y clínica**, no solo estructural: preserva significado,
emoción y mito **en español**, sin colonizar tu memoria con categorías ajenas (ver
`AGAPE.md`).

## No todo merece sobrevivir — la gran Némesis

El peligro opuesto a perder memoria: **canonizarlo todo**. Si todo entra en canon,
`canon = vertedero histórico` y la memoria colapsa. Los humanos olvidan por una razón;
la poda existe por una razón. Triaje (la regla Deckard `manda/ayuda/espera/estorba`
aplicada al corpus):

| Tipo | Destino |
|---|---|
| **TRIVIAL** | eliminar |
| **OPERATIVO** | resumir |
| **SIGNIFICATIVO** | integrar |
| **FUNDACIONAL** | canonizar |

**Público vs. privado** (condición de continuidad institucional):
- **PRIVADO** — diario, emociones, familia, clínica, errores, ideas inmaduras → zona
  protegida, no se mezcla con el canon general.
- **PÚBLICO** — ensayos, documentación, proyectos, conocimiento transferible → corpus
  navegable.

El resultado es un **corpus horizontal** (semillas → brotes → ramas → frutos → nuevas
semillas), micelial, no una jerarquía rígida.

## El connectoma semántico

Lo que Codex inició no es migración de archivos: es la **construcción del corpus
fundacional de Groot — el connectoma semántico del organismo**.

- **Incompleto** → `groot awaken` despierta una criatura **amnésica o fragmentada**.
- **Completo** → `groot awaken` reconstruye la continuidad completa, **independiente**
  de Windows/Linux, DeepSeek/Mythos, VPS/local, hardware modesto/frontera.

## La capa técnica: la ID es el alma

La traducción produce, por cada documento, un **nodo del grafo** con tres piezas:

**1. La ID canónica — el alma.** Un identificador único (esquema Deckard
`<nivel>-<clase>-<dominio>-<n>`, p. ej. `N3-ACT-SIS-001`) que **sobrevive** a todo
cambio de nombre, ruta, modelo, hardware o proveedor. Es la **clave primaria** y, a
la vez, el **mecanismo de continuidad** que `TESIS.md` necesita: lo que mantiene la
identidad de una entidad a través del tiempo y las transformaciones. Por eso la ID es
lo que hace a Groot **portable** — el nombre cambia, la ruta cambia, el motor cambia;
la ID permanece.

**2. El YAML — el ADN documental.** El frontmatter de cada `.md` es el metacerebro del
Vault:

```yaml
---
id: N3-ACT-SIS-001
estado: activo          # vivo | fosil | historico | duplicado
dominio: SIS            # SIS | NEM | AGA | ...
padre: N2-ACT-001
fuente: <origen>
certeza: N3             # regla Deckard: pilar, estado, fuente, certeza
tags: [soberania, obsidian]
---
```

Permite búsqueda, filtrado, índices automáticos y relaciones. Si las etiquetas son
coherentes con el filesystem, hay orden.

**3. Los wikilinks — las aristas.** `[[N3-ACT-SIS-001]]` construye el grafo explícito.
Obsidian lo hace **visual**; por debajo es lo mismo que SQL sobre IDs (relaciones por
clave), pero navegable. Embeddings / vector-DB pueden añadirse encima, pero la
identidad sigue descansando en la **clave primaria**.

**Crecimiento arbóreo y áureo (heurística, no ley).** Tronco → rama por módulo →
submódulo → identificadores → hojas (docs) → frutos (patrones replicables). El
crecimiento = continuidad + innovación (la suma de los dos estados previos —
Fibonacci como **metáfora orgánica**, ya canon en
`state/deckard/06_FIBONACCI_GROWTH.md`; no es una ley de ingeniería de software, es un
principio organizativo).

**Salida concreta de migrar un documento:** asignarle ID canónico + YAML + wikilinks →
nodo del connectoma. Sin ID y YAML coherentes, no hay orden ni continuidad.

## El giro de la fuente de verdad

Al terminar la migración, la identidad **deja de depender de Google**:

| | Rol nuevo |
|---|---|
| **Google Drive** | **Museo histórico** — `READ ONLY`, `ARCHIVE`, sin contenido nuevo |
| **Obsidian (Maceta de Groot)** | **SOURCE OF TRUTH** — canon, memoria activa |

**El acceso al museo** (refinación 2026-07-04, Codex+Nami): no todo se teje — lo que
no merece nodo se **apunta**. "El vault no contiene Drive: contiene el mapa de
Drive." Protocolo de rescate NL (solicitud → índice → puntero → conector Drive →
entrega, con compuerta para lo protegido): `state/maceta_groot/drive_rescue/`. El
índice completo con IDs vive **solo** en el telar local; al repo público solo cruza
el mapa public-safe.

Es probablemente el momento más importante de toda la evolución del proyecto.

## Prioridad absoluta

> Terminar la migración semántica documento a documento que comenzó Codex y
> declarar Obsidian como **única fuente canónica de verdad** del sistema.

## Quién y cómo (reparto)

- **Zoro** (`zoro-migrate`) corta el formato (Drive/`.gdoc` → Markdown real).
- **Robin** (`robin-meditacion`) audita el sentido (contradicciones, estratos,
  canon vs. fósil).
- Juntos = la traducción ontológica. El connectoma se materializa en el **Vault de
  Obsidian** (la maceta de Groot), espejado al repo en `state/maceta_groot/`.
- La clasificación usa la **regla Deckard** N0-N5 (`state/deckard/01_CANON.md`):
  solo lo que `manda` se vuelve CANON; el resto va a LEGACY / DUPLICADO / fósil.

## Convergencia de telares (2026-07-02)

La Fase 0 corre ya con **dos lanzaderas sobre un mismo tejido** — fibras → hilos →
cabos → nudos → tejidos → cubierta (la estética del Capitán):

| Lanzadera | Telar | Lo que teje | Registro |
|---|---|---|---|
| **Codex** (manos locales) | `D:\La maceta de Groot` (PC provisional) | TEJIDO_00 (5 nodos desde el canon de este repo) + TEJIDO_01 (6 nodos desde Drive nativo / `.md` local) | `99_Sistema/ENT_OPERATION_LOG.jsonl` + bitácoras de tejido |
| **Claude** (nube) | `state/maceta_groot/` (este repo, PR #41) | connectoma (nodos SIS-* desde Drive vía connector) + canon | commits + PR |

Reglas de trenzado (para que dos manos no bifurquen el hilo):

1. **Un solo telar lógico.** El vault local es el telar del cuerpo;
   `state/maceta_groot/` es el espejo que la nube y las Routines pueden leer. El
   **micelio git los trenza**. Al repo solo cruza la **cubierta pública** (nudo
   Membrana): el telar local puede contener bodegas protegidas que jamás se
   commitean.
2. **El alma convergente.** Nodos nuevos en ambos telares usan el ID Deckard
   completo `N<nivel>-<EST>-<DOM>-<SLUG>-<AAAAMMDD>-<NNN>` (la estética ya en uso
   en TEJIDO_00/01). Los `SIS-*` existentes del connectoma conservan su id y ganan
   `id_deckard` en el YAML cuando se editen — sin renombrado masivo.
3. **Vocabulario compartido.** El catálogo de nudos (fuente viva:
   `99_Sistema/CATALOGO_NUDOS_TEJIDOS_SEMANTICOS_20260702.md`, telar local) es la
   paleta de ambas lanzaderas; espejo nube en `state/maceta_groot/CATALOGO_NUDOS.md`.
4. **División de aguas.** Codex lee `.gdoc` nativos y `G:\` (manos locales); Claude
   lee Drive vía connector y el repo. **Misma frontera clínica a ambos lados**
   (NEM / Caso 0 / BOVEDA: metadata-only).
5. **Anti-fork.** Antes de tejer, cada lanzadera mira el índice del otro telar
   (`INDICE_TEJIDO_*` ↔ `connectoma/_INDICE.md`). TEJIDO_00 —que teje TESIS,
   TEATRO, AGAPE, MIGRACION y RUTINAS *desde este repo*— no duplica el connectoma:
   es la **sutura**. El resumen local apunta a un canon cuya fuente es el repo.
