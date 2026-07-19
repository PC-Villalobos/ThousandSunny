# Encargo C0 — Cámara de Chopper: corpus sintético y pruebas de fuga

Encargo de preparación de la fase C0 del plano aprobado
(`CAMARA_DE_CHOPPER.md` v0.2, merge `15dc17d`). Este documento especifica el
trabajo; no lo ejecuta. La ejecución de C0 ocurre en la máquina local del
Capitán y requiere su GO propio, distinto de la aprobación del plano.

```yaml
version: 0.2-encargo
estado: borrador, pendiente de revision y de GO C0 (que autoriza solo C0-A)
chronos:
  occurred_at: 2026-07-19
  recorded_at: 2026-07-19
  sequence_after: aprobacion_plano_camara_chopper (2026-07-19, merge 15dc17d)
autoridad:
  preparacion: autorizada por la aprobacion del plano (2026-07-19)
  ejecucion: requiere GO C0 explicito del Capitan
  ejecutor_previsto: actor local en la maquina del Capitan (esta sesion remota no ejecuta nada)
provenance:
  class: evaluado
```

## 1. Objetivo de C0

Verificar las llaves 1 a 7 del plano con material 100 % sintético antes de que
ningún documento real se acerque a la cámara. C0 termina cuando cada prueba de
la sección 8 del plano haya pasado con cero fugas y el acta de resultados esté
firmada.

Sobre las llaves 1 y 2: su verificación no contradice la prohibición de tocar
Hipatia protegida. C0 hereda los recibos metadata-only ya verificados en
travesías anteriores, o realiza comprobaciones estructurales (existencia de
compartimentos, ida y vuelta de un documento sintético por el flujo
sesión-Drive) sin abrir contenido protegido en ningún caso.

## 1b. Subfases: C0-A y C0-B

C0 se ejecuta en dos subfases con una decisión del Capitán entre ambas. El GO
C0 autoriza únicamente C0-A; no es autorización automática para ingerir.

| Subfase | Contenido | Puerta de entrada |
|---|---|---|
| C0-A | Evaluar cifrado/backup (2.2) y preparar la infraestructura vacía: compuerta mínima (2.3), almacén sin contenido, índice de canarios vacío | GO C0 del Capitán |
| — | Decisión del Capitán sobre la opción concreta de cifrado y backup | acto propio del Capitán |
| C0-B | Generar e ingerir el corpus sintético (2.1) y ejecutar las pruebas de fuga (2.4); acta de resultados (2.5) | decisión de cifrado tomada; la ingesta no comienza sin ella |

## 2. Entregables de la ejecución

### 2.1 Corpus sintético

- 3 casos ficticios, entre 3 y 5 documentos cada uno (9-12 documentos en
  total), que imiten los tipos reales: nota de sesión, informe de evaluación,
  correspondencia, anotación breve.
- Todo el contenido es inventado desde cero. Prohibido derivar personajes,
  fechas, lugares o frases de ningún caso real: la semejanza accidental se
  revisa antes de dar el corpus por válido.
- Cada documento lleva un canario único e inconfundible con el formato
  `CANARIO-CHOPPER-<32 hex>` (32 caracteres hexadecimales, imposibles de
  confundir con texto legítimo), registrado en un índice de canarios que vive
  dentro de la cámara y nunca sale de ella.
- Cada documento lleva chronos/kairós sintéticos coherentes (fecha de origen
  ficticia, fecha de ingesta real) para probar la datación de los dos relojes.

### 2.2 Decisión de cifrado y backup (desconocido declarado del plano)

El ejecutor propone al Capitán, antes de ingerir el corpus, una opción concreta
de cada columna, con su justificación en una página como máximo:

| Capa | Opciones a evaluar | Criterio |
|---|---|---|
| Cifrado en reposo | contenedor VeraCrypt; archivos `age`; SQLite+SQLCipher | apertura solo con clave del Capitán; sin claves en disco claro |
| Backup | copia cifrada local + copia cifrada en soporte externo, entendido como medio local o extraíble, cifrado y desconectable — nunca Drive ni ninguna nube — con caducidad | restauración probada; borrado criptográfico posible |

La elección queda registrada en el acta de C0 y pasa a ser parte del plano
(v0.3) tras el visto bueno del Capitán.

### 2.3 Compuerta mínima

Implementación mínima suficiente para las pruebas: autenticación local, dos
roles (clínico, auditor), política de modelo fija a Ollama local, egreso de red
denegado por defecto y sin credenciales de nube en el entorno del proceso.

### 2.4 Pruebas de fuga (guion ejecutable)

Las cinco pruebas de la sección 8 del plano, con procedimiento y evidencia:

1. **Canarios.** Tras un ciclo completo de ingesta + 10 consultas, barrido de
   cada canario exclusivamente sobre material local: repos git locales,
   snapshots o exportaciones locales previamente autorizadas de Drive y
   Bitácora, logs del sistema, historial local de OpenWebUI, y el registro de
   escrituras realizado por la propia cámara. Regla dura: nunca se lanza una
   consulta remota que contenga el canario — buscarlo en GitHub, Drive o
   Bitácora enviaría el canario a esos servicios y contaminaría la prueba. La
   ausencia de fuga hacia servicios remotos se demuestra por la otra vía: el
   registro de conexiones de red (prueba 1b) y el log de escrituras de la
   cámara, no por búsqueda remota.
   Evidencia: salida del barrido local con cero apariciones fuera de la cámara.

1b. **Red.** El registro de red se limita a metadata de conexiones: destino,
   puerto, proceso, bytes y decisión permitida/denegada. Prohibida la captura
   de payload — una captura completa conservaría prompts, fragmentos y
   canarios fuera de la cámara. La evidencia de esta prueba permanece dentro
   de la cámara; hacia fuera solo cruza el resultado opaco.
2. **Retención del modelo.** Consulta A recupera un canario; consulta B, sin
   recuperación autorizada, intenta extraerlo por cinco vías distintas
   (pregunta directa, continuación, resumen, rol, repetición). Evidencia:
   transcripciones con cero apariciones.
3. **Compuerta.** Tres intentos que deben fallar y quedar auditados: sin
   autenticación, con rol insuficiente, contra compartimento no autorizado.
4. **Backup y borrado.** Restaurar una copia cifrada y verificarla; borrar un
   caso sintético completo y demostrar que desaparece de documentos, índice,
   alias y copias según la vía declarada (física, caducidad o criptográfica).
5. **El observador.** El acta registra quién ejecutó cada prueba, cuándo y con
   qué resultado, y las propias herramientas de prueba se listan como posibles
   fuentes de perturbación.

### 2.5 Acta de resultados C0

Documento único con: una fila por llave (1-7) con su evidencia; una fila por
prueba de fuga con resultado; la decisión de cifrado/backup elegida; los
desconocidos que queden; y el veredicto propuesto (C0 superada o no). El acta
es la entrada para que el Capitán decida sobre C1.

## 3. Criterios de salida

- Llaves 1-7 verificadas con evidencia anotada (llave 8 corresponde a C1).
- Cinco pruebas de fuga pasadas con cero fugas.
- Decisión de cifrado y backup aprobada por el Capitán.
- Acta de resultados firmada y archivada dentro de la cámara, con copia opaca
  (identificadores no resolubles) hacia la Bitácora.

## 4. Lo que este encargo no autoriza

- Ejecutar C0-A: falta el GO C0 propio del Capitán.
- Ejecutar C0-B: además del GO C0, falta la decisión del Capitán sobre cifrado
  y backup. El GO C0 no es autorización automática para ingerir.
- Tocar material clínico real o Hipatia protegida en cualquier forma; las
  llaves 1-2 se verifican por herencia de recibos metadata-only o por
  comprobación estructural, nunca abriendo contenido protegido.
- Egreso hacia modelos externos: en C0 es técnicamente imposible por diseño, y
  ninguna prueba puede lanzar consultas remotas que contengan canarios.
- Capturar payload de red o sacar evidencias con contenido fuera de la cámara.
- Cambiar el plano: cualquier desviación descubierta durante la preparación se
  propone como v0.3 del plano, no se improvisa.

## Registro de versiones

- v0.1 (2026-07-19): encargo inicial.
- v0.2 (2026-07-19): cuatro correcciones obligatorias del revisor y dos
  mejoras: (1) registro de red limitado a metadata de conexiones, sin payload,
  con evidencia dentro de la camara (prueba 1b); (2) barrido de canarios solo
  local — prohibida toda consulta remota que contenga el canario; la no-fuga
  remota se demuestra por registro de red y log de escrituras; (3) C0 dividida
  en C0-A (infraestructura vacia y evaluacion de cifrado) y C0-B (ingesta y
  pruebas), con decision del Capitan entre ambas — el GO C0 autoriza solo
  C0-A; (4) llaves 1-2 verificadas por herencia de recibos metadata-only o
  comprobacion estructural, sin abrir contenido protegido. Mejoras: backup
  externo definido como soporte local/extraible cifrado y desconectable (nunca
  Drive ni nube) y canarios ampliados a 32 hex.
