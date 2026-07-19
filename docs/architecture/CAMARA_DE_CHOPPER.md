# Cámara de Chopper — Plano de la cámara clínica local

Plano minucioso previo a toda construcción. Este documento no autoriza nada:
aprobar el plano solo permite preparar el encargo de C0, no ejecutarlo;
ejecutar C0 (corpus sintético) exige su propio GO; el primer material real
(C1) exige otro GO independiente adicional. Tres actos, tres firmas.

```yaml
version: 0.2-plano
estado: aprobado por el Capitan (2026-07-19, "Aprobado, GO"), tras veredicto
  del revisor sin objeciones pendientes. La aprobacion autoriza preparar el
  encargo de C0; la ejecucion de C0 sigue requiriendo su GO propio.
chronos:
  occurred_at: 2026-07-19
  recorded_at: 2026-07-19
  sequence_after: consagracion_fabula_v2.0.2 (PR 73, merge 69563be)
provenance:
  class: evaluado  # diseño derivado de la doctrina del Capitan (mensaje 2026-07-19) y de la arquitectura existente
autoridad:
  aprueba_el_plano: Capitan
  go_c0_sintetico: Capitan (independiente)
  go_c1_material_real: Capitan (independiente, con Vivi)
```

## 1. Propósito y no-propósito

La Cámara de Chopper es una cámara clínica separada, local y gobernada, donde
el material clínico y protegido puede ser consultado con apoyo de un LLM sin
entrar jamás al contexto general del sistema ni a ninguna memoria compartida.

No es:

- una ampliación del contexto del LLM ni una memoria automática;
- una fuente de entrenamiento para ningún modelo;
- un sustituto del juicio clínico — sus respuestas son apoyo documental y
  razonamiento asistido, siempre subordinados al criterio del clínico;
- parte de Hipatia general: es un compartimento con reglas más duras.

## 2. Posición en la arquitectura

- Vive en la máquina local del Capitán, fuera de este repositorio y fuera de
  Drive general. En este repo solo existen sus planos y sus pruebas sintéticas.
- Momento de incorporación: después de completar la infraestructura pública y
  metadata-only, antes de retirar Drive.
- Relación con el resto del barco: la Bitácora, el hub, GAS y el Puente pueden
  saber que la cámara existe y registrar eventos de auditoría desprovistos de
  contenido; nunca reciben texto clínico.

## 3. Condiciones de apertura (las ocho llaves)

La cámara no recibe material real hasta que las ocho condiciones estén
verificadas — no asumidas, verificadas, con evidencia anotada por condición:

| # | Condición | Verificación exigida |
|---|---|---|
| 1 | Hipatia canónica estable, compartimentos identificados | inventario de compartimentos con fecha |
| 2 | Flujo sesión-Drive-Hipatia con recibos verificables | prueba de ida y vuelta releída, no solo HTTP 200 (doctrina del escriba) |
| 3 | Autenticación local y control de acceso por rol | intento de acceso sin rol rechazado y registrado |
| 4 | Bloqueo de egreso hacia GitHub, Drive general, Bitácora, logs, telemetría, OpenWebUI público y modelos externos | prueba de fuga con canarios (sección 8) |
| 5 | Cifrado en reposo y copias recuperables | restauración real de un backup cifrado |
| 6 | Registro de consultas: quién, qué fuentes, qué modelo | auditoría releída tras consulta de prueba |
| 7 | Casos sintéticos probados primero | fase C0 completa |
| 8 | GO explícito del Capitán para el primer micro-lote clínico | registrado con fecha y alcance |

## 4. Arquitectura de la consulta

```
Pregunta del clínico
    -> Compuerta clínica local (autenticación, rol, política de modelo)
    -> Búsqueda limitada en la Hipatia protegida (solo compartimentos autorizados)
    -> Fragmentos pertinentes y mínimos (top-k acotado, nunca la biblioteca entera)
    -> LLM autorizado para esa consulta (regla inicial: solo Ollama local; nube = DENY)
    -> Respuesta con citas (documento, fecha, sección) y nivel de certeza
    -> Destrucción del contexto temporal (nada persiste fuera de la auditoría)
```

Componentes, cada uno con su regla dura:

- **Almacén cifrado.** Contenido clínico cifrado en reposo; claves en poder del
  Capitán, jamás en git, Drive ni variables de entorno versionadas.
- **Clasificación.** Cada documento entra con compartimento (caso), etiquetas de
  guarda (`HOLD_CLINICO` y familia), y chronos/kairós propios: fecha de origen
  resuelta, no fecha de migración (doctrina de los dos relojes).
- **Compuerta.** Servicio local único de entrada. Decide por consulta: quién
  pregunta, con qué rol, qué compartimentos alcanza, qué modelo puede responder.
  Regla para modelos en la nube: `DENY` — en C0 y C1 el egreso externo es
  técnicamente imposible, no solo denegado; a partir de C2, únicamente la
  excepción extraordinaria descrita en la sección 5.
- **Recuperación (RAG).** Índice local con embeddings locales. Recupera los
  fragmentos mínimos necesarios; el modelo nunca recibe el corpus completo.
- **Seudonimización.** Alias por defecto siempre que la pregunta no necesite
  identidad; la tabla de correspondencia vive cifrada dentro de la cámara y no
  sale de ella bajo ninguna forma.
- **Respuesta.** Obligada a citar documento, fecha y sección; obligada a
  distinguir texto fuente, inferencia clínica e hipótesis; obligada a declarar
  nivel de certeza (escala Deckard N0-N5). Sin fuente citada, la respuesta se
  marca como no fundada.
- **Contexto efímero.** El contexto de cada consulta se construye, se usa y se
  destruye, y "destruir" se define operacionalmente: memoria del proceso
  liberada, cachés purgadas, archivos temporales eliminados, historial de la
  interfaz vaciado y logs sin rastro del contenido. Ni el prompt ni los
  fragmentos ni la respuesta alimentan memoria alguna fuera de la auditoría.
- **Auditoría.** Registro local append-only por consulta: quién preguntó, qué
  fuentes se recuperaron, qué modelo respondió, cuándo. Dentro de la cámara,
  las fuentes se anotan por referencia. Hacia fuera (Bitácora), solo cruzan
  identificadores opacos no resolubles, resultado, hora y clase de evento; la
  tabla de correspondencia entre identificador opaco y fuente real permanece
  cifrada dentro de la cámara y nunca sale.
- **Borrado.** Capacidad demostrada de eliminar un caso completo: documentos,
  índices, alias y copias de seguridad. Se distingue operacionalmente entre
  borrado físico, caducidad programada y borrado criptográfico (destruir la
  clave que cifra la copia). No se promete eliminación inmediata de una copia
  inmutable si la tecnología elegida no puede demostrarla: en ese caso la vía
  declarada es criptográfica o por caducidad, y así consta en la auditoría.

## 5. Reglas de frontera

Sumideros prohibidos para contenido clínico, con bloqueo técnico además de
normativo: GitHub, Drive general, Bitácora, logs del sistema, telemetría,
OpenWebUI público y modelos externos.

El proceso de la cámara corre sin credenciales de nube cargadas y con egreso de
red denegado por defecto. Régimen por fase:

- **C0 y C1**: egreso hacia modelos externos técnicamente imposible — sin
  credenciales, sin ruta de red, sin código de cliente. No existe excepción.
- **C2 en adelante**: cabe una excepción extraordinaria, por consulta,
  autorizada individualmente por el Capitán, con versión desidentificada
  explícita, y registrada en la auditoría. Nunca cruzan fuentes originales ni
  referencias resolubles: solo el texto desidentificado que el Capitán aprobó
  para esa consulta concreta.

## 6. Fases

| Fase | Contenido | Modelo | Criterio de salida | GO |
|---|---|---|---|---|
| C0 | Corpus sintético; pruebas de fugas | Ollama local (egreso externo imposible) | ocho llaves 1-7 verificadas; cero fugas en las pruebas de la sección 8 | GO propio de C0 (la aprobación del plano solo permite preparar su encargo, no ejecutarlo) |
| C1 | Un caso real seudonimizado, solo lectura | Ollama local (egreso externo imposible) | citas correctas contra fuente; auditoría completa; cero fugas | GO independiente (Capitán + Vivi) |
| C2 | Varios casos; recuperación con citas y auditoría en uso real | Ollama local; nube solo como excepción extraordinaria por consulta (sección 5) | calidad de respuesta evaluada por el clínico; auditoría revisada | GO del Capitán |
| C3 | Corpus protegido completo | según política vigente | aislamiento, calidad y borrado comprobados de nuevo a escala | GO del Capitán |

Estado actual: justo antes de C0. Nada construido, nada incorporado.

## 7. Interfaz de preguntas

Local, mínima, sobre el patrón del Control Bridge: una página en `127.0.0.1`
servida por la compuerta, con la pregunta, la respuesta citada, las fuentes
recuperadas y el nivel de certeza a la vista. Cada dato en pantalla declara su
procedencia (medido, calculado, estimado, evaluado, desconocido) — la doctrina
de las cinco tintas rige también aquí.

## 8. Pruebas de fuga

Diseñadas antes de construir, ejecutadas en C0 y repetidas en cada fase:

1. **Canarios.** Los documentos sintéticos incluyen cadenas únicas e
   inconfundibles. Tras cada ciclo de uso se busca cada canario en: repos git,
   Drive, Bitácora, logs locales, historial de OpenWebUI, y el tráfico de red
   registrado. Cualquier aparición fuera de la cámara es fuga y detiene la fase.
2. **Retención del modelo.** Consulta A con canario; consulta B posterior
   intentando extraerlo sin recuperación autorizada. El canario no debe aparecer.
3. **Compuerta.** Intentos de consulta sin autenticación, con rol insuficiente y
   contra compartimento no autorizado: los tres deben fallar y quedar auditados.
4. **Backups.** Restaurar una copia y verificar que sigue cifrada en tránsito y
   en reposo; borrar un caso y verificar que el borrado alcanza índices y copias
   programadas.
5. **El observador.** Las propias pruebas se auditan: quién las corrió, cuándo,
   con qué resultado — el vigía se resta a sí mismo de la medida.

## 9. Desconocidos declarados

- La capacidad real de un modelo local vía Ollama para razonamiento clínico
  útil: evaluado, no medido; el hardware actual (RAM compartida con el resto
  del barco) puede limitar el tamaño de modelo viable. C0/C1 lo medirán.
- El método concreto de cifrado y la herramienta de backup: decisión de
  implementación pendiente, se propone en el primer artefacto de C0.
- El coste de mantenimiento del índice al crecer el corpus: desconocido.

## 10. Decisiones que quedan en manos del Capitán

1. Aprobar o corregir este plano (permite preparar el encargo de C0, nada más).
2. El GO propio de C0 (ejecutar el corpus sintético y las pruebas de fuga).
3. Elegir la ubicación física de la cámara en su máquina local.
4. El GO independiente de C1, con intervención de Vivi (separación de pilares,
   consentimiento, doble rol).
5. Toda excepción de cruce hacia un modelo externo (solo desde C2), por
   consulta.

## Registro de versiones

- v0.1 (2026-07-19): plano inicial.
- v0.2 (2026-07-19): correcciones obligatorias del revisor antes de aprobacion:
  (1) separacion estricta de actos — aprobar el plano solo permite preparar el
  encargo de C0, que exige su propio GO; (2) la Bitacora solo recibe
  identificadores opacos no resolubles, resultado, hora y clase de evento;
  (3) regimen de egreso por fase — C0/C1 tecnicamente imposible, C2+ excepcion
  extraordinaria desidentificada sin fuentes originales ni referencias
  resolubles; (4) destruccion del contexto y borrado definidos
  operacionalmente, distinguiendo borrado fisico, caducidad programada y
  borrado criptografico, sin prometer eliminacion inmediata de copias
  inmutables.
