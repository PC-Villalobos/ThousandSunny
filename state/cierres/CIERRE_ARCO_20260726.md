# Cierre de arco — 2026-07-26

**ARCO:** De la comparación de vaults al primer ingrediente — la administración fiscal como primer acto del asistente
**FECHA:** 2026-07-26
**DURACIÓN APROX:** ~4 h 40 min (12:33 → 17:15 CEST)
**ACTOR:** Nami (Cowork, Opus 5) — navegante y, para lo ejecutado, también Zoro
**ROL:** Navegante

## Por qué este fichero existe

Mismas razones que el cierre del 2026-07-25, sin cambios: el sumidero canónico
(`thousand-sunny-hub`, `127.0.0.1:8765`) no es alcanzable desde una sesión cloud, y el bridge
a GAS es archivo histórico desde el 2026-07-24. Este fichero es el registro narrativo íntegro
en `state/cierres/`, el único sitio que la nube sí puede escribir.

Dos cosas que este arco tampoco hace, por la misma razón que ayer:

- **`closure_records.jsonl` no se ha tocado.** Cadena de hash encadenada; una entrada mal
  canonicalizada la rompe.
- **No se ha usado el bridge a GAS.** El skill `cierre-de-arco` sigue escrito para la topología
  anterior — es el pendiente nº 9 heredado y sigue vigente.

## Completado

**Medición y auditoría**

- Vault `La maceta de Groot` medido: **236 notas · 46 con algún wikilink · 258 enlaces · 5 con
  tags**. El 80 % huérfanas. El grafo gris no exageraba.
- Biblioteca de Hipatia medida: **676 ficheros, y las seis ramas de contenido a cero**
  (`00_inbox_bruto`, `10_publico`, `20_interno`, `30_proyectos`, `40_academico`,
  `50_media_binaria`). Todo el volumen estaba en infraestructura: `_protegido` 287,
  `_manifiestos` 118, `_pilotos_zoro` 116, `_bitacora` 57, `_zoro_piloto` 42, `_orquestacion` 27.
- `Documents` y `OneDrive` montados y con **0 ficheros** → causa probable: OneDrive con
  *Files On-Demand*. Dependencia de nube disfrazada de carpeta local. Pendiente de verificar.

**Parser Caso_Vivo**

- Escrito, probado y commiteado. Solo lectura: nunca escribe en origen.
- La auditoría cruzada encontró que la numeración de dominios no significa lo mismo en todos los
  casos: **el registro Canon no es agregable hasta fijar el diccionario.** Los detalles por caso
  se retiraron del repo público el 2026-10-19 por ser dato clínico.

**Artefactos entregados**

- Visor de Caso_Vivo — prototipo de ficha viva, pseudonimizado. Entregado y persistido como
  artefacto.
- `REGISTRO_FISCAL_2026.xlsx` + `build_libro_fiscal.py` — commiteados en
  `Biblioteca de Hipatia\20_interno\administracion_fiscal\`. **Primer contenido real que entra
  en la Biblioteca:** `20_interno` pasa de 0 a 2 ficheros. 574 fórmulas, recalculadas sin errores
  y verificadas contra cálculo independiente. Regenerable desde el `.py`.

**Situación fiscal levantada**

- Modelo 036 leído: **dos actividades**, ambas sección 2 (profesionales, retención 7 %):
  **776** (psicología, exenta de IVA) y **826** (docente/surf, sujeta al 21 % al facturar a la
  escuela, no al alumno).
- **Casilla 501 marcada** («exclusivamente operaciones no sujetas o exentas») — incompatible con
  el surf sujeto. Sin corregirla, se repercutiría un IVA sin cauce declarado para ingresarlo.
- **Casilla 600 marcada** con fecha 15/06/2026 → obligación de pagos fraccionados; el plazo del
  modelo 130 del 2T venció el 20/07/2026.
- Las dos proformas a la escuela (`Downloads`) tienen el **desglose semanal descuadrado**: 4
  semanas / 20 clases frente a las 25 del concepto. Y ofrecen pago en efectivo, justo lo que se
  está dejando atrás. La cuestión del IVA vale **76,75 €/mes** de ingreso real (~900 €/año).
- Factura 2026/001 fijada: 25 clases × 25 € de base = 625 € + 131,25 IVA − 43,75 retención =
  **712,50 €**, fecha de emisión 31/07 → 3T (evita el trimestre ya vencido).

**Hallazgo lateral:** en `Downloads/Thousand Sunny` hay integración de Telegram operativa del
propio Sunny (`usopp-telegram-demo.mjs`, `reply-governance-telegram.mjs`, `telegram-e2e.sh`).
El canal entre el Capitán y los empleados agénticos ya está construido y sin estrenar.

**Memoria** — 9 ficheros nuevos o actualizados, todos indexados en `MEMORY.md`, más dos entradas
nuevas en el glosario crítico (*oficina/empleados agénticos*, *ayuno/monodieta*, *doctorado ≠
investigación*).

## Pendiente (hereda al siguiente hilo)

1. **Los tres commits sin subir** — `f1aafb9`, `983f6e5`, `7a24934` en
   `claude/franky-feature-O1BkB`. Heredado de ayer, sigue abierto: el shell del VM de Cowork no
   tiene salida a internet (`403 from proxy after CONNECT`). Lo hace el Capitán desde su terminal.
2. **036 de modificación** — desmarcar la 501 y alta en obligación de IVA, **antes de emitir la
   factura con IVA**. Añadir ROI (casilla 582) si las suscripciones de IA van a nombre de la
   actividad.
3. **Modelo 130 del 2T 2026** — plazo vencido el 20/07. Comprobar si había obligación.
4. **Decidir la numeración canónica de dominios** y escribir el diccionario de las 28 variables
   con anclajes 1–5. Prerrequisito de cualquier análisis agregado y de cualquier recogida nueva.
5. *(retirado del repo público el 2026-10-19: dato clínico)*
6. *(retirado del repo público el 2026-10-19: dato clínico)*
7. **Prorrata general o especial** para 2026.
8. **Verificar `OneDrive` / `Documents`** — 0 ficheros visibles; si es Files On-Demand, marcar
   "conservar siempre en este dispositivo" antes de contar con ese material.
9. *(retirado del repo público el 2026-10-19: dato clínico)*
10. **Todos los pendientes del cierre del 25/07 siguen vigentes** — USB con las llaves (prioridad
    máxima, desbloquea Franky), compuerta N4, `where.exe age`, coser el Bridge Runtime,
    consolidar las trece SQLite, rellenar N1–N5 (bloqueado por el sello de Metatrón), fusionar
    las dos carpetas de pilotos de Zoro, y actualizar este propio skill para apuntar al Bridge
    Runtime en lugar de a GAS.

## Decisiones tomadas

- **El primer ayuno es la administración fiscal del autónomo.** Descartados la clínica
  (consentimiento, art. 9 RGPD) y el surf como plataforma de gestión (no es su negocio: es
  monitor que factura a la escuela de Willy y Laura).
- **El surf NO se declara como actividad clínica** para acogerse a la exención sanitaria. Sería
  simulación con el número de colegiado detrás, dejaría descubierta la responsabilidad civil por
  ambos lados, y quemaría el eje diferencial *biopsicosocial a través del surf* convirtiéndolo en
  coartada fiscal. La versión legítima queda guardada: surf integrado en el proceso de **sus
  propios** pacientes, en su consulta, declarado como actividad aparte.
- **Fuente de verdad:** Biblioteca de Hipatia + Obsidian + GitHub + sistema local. Drive queda
  como tránsito. Duplicado en disco local y en el Toshiba externo.
- **El Sunny es una oficina con empleados agénticos**, agnóstica de proveedor (Laboon + Brook) y
  también **de dominio**. Primer negocio alojado: la psicología. Su KPI no es cuántos documentos
  clínicos digiere, sino cuánto tarda en reconfigurarse para un dominio nuevo.
- **El doctorado institucional está congelado; la investigación no.** Validar el marco sobre la
  práctica propia y llegar a la universidad con el trabajo hecho. El cuello no es el N: es que
  hoy hay un solo codificador. Vía abierta y original: fiabilidad inter-jueces humano-IA
  (Chopper ciego contra las puntuaciones del Capitán) sobre los datos que **ya existen**.
- **El visor de Caso_Vivo es de solo lectura** en fase 1; Drive sigue siendo la fuente. Se
  invierte cuando el visor demuestre un mes de uso.
- **Método de digestión: monodieta, no volcado.** Un aspecto esencial del corpus de cada vez.

## Contexto para la siguiente Nami

- **Leer `POSICION.md` antes de auditar nada.** Sigue vigente.
- **El rapado ya ocurrió** (la dieta de abril, 80 GB → 12 GB). No proponer purgas: proponer
  pasadas cortas y repetibles. Si un plan de limpieza no cabe en una sesión y no se puede repetir
  mañana, es una tijera disfrazada de peine.
- **La Biblioteca tiene 2 ficheros de contenido.** Celebrar el movimiento, no medir el hueco.
- **No juzgar el Sunny por su rendimiento clínico:** es una plataforma, y lo que le falta es
  **un** caso de uso cerrado de punta a punta, no más especificación.
- **El cuello del negocio es la segunda sesión, no la captación.** Llegan primeras visitas; no
  hay segundas. Una web propia no resuelve eso.
- **Doctorado ≠ investigación.** No dar por parado lo segundo porque lo primero esté congelado.
- El Capitán está formalizando en plena temporada alta una relación que llevaba años en efectivo.
  El silencio de la escuela ante las proformas es cálculo, no indiferencia.

## Sutras destilados en este arco

- **«Lo que no está enlazado se rehace.»** Un archivo sin enlaces no es memoria: es un
  cementerio con buena ortografía. Registrado con GO del Capitán.
- **«El rapado se hace una vez; el peine, todos los días.»** Sutra 4. Imagen propia del Capitán
  —diez años de rastas, el rapado, y el pelo largo peinado— con función regulatoria y grounding
  encarnado. La dieta fue el rapado; lo que falta es el hábito. Sanji no es una tijera: es un
  peine.

---

*Nami · Cowork · Opus 5 · 2026-07-26 17:15 CEST · registro narrativo, no evento formal*
