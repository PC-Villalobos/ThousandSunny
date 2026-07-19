# Encargo C0 — Cámara de Chopper: corpus sintético y pruebas de fuga

Encargo de preparación de la fase C0 del plano aprobado
(`CAMARA_DE_CHOPPER.md` v0.2, merge `15dc17d`). Este documento especifica el
trabajo; no lo ejecuta. La ejecución de C0 ocurre en la máquina local del
Capitán y requiere su GO propio, distinto de la aprobación del plano.

```yaml
version: 0.1-encargo
estado: borrador, pendiente de revision y de GO C0
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

## 2. Entregables de la ejecución

### 2.1 Corpus sintético

- 3 casos ficticios, entre 3 y 5 documentos cada uno (9-12 documentos en
  total), que imiten los tipos reales: nota de sesión, informe de evaluación,
  correspondencia, anotación breve.
- Todo el contenido es inventado desde cero. Prohibido derivar personajes,
  fechas, lugares o frases de ningún caso real: la semejanza accidental se
  revisa antes de dar el corpus por válido.
- Cada documento lleva un canario único e inconfundible con el formato
  `CANARIO-CHOPPER-<8 hex>`, registrado en un índice de canarios que vive
  dentro de la cámara.
- Cada documento lleva chronos/kairós sintéticos coherentes (fecha de origen
  ficticia, fecha de ingesta real) para probar la datación de los dos relojes.

### 2.2 Decisión de cifrado y backup (desconocido declarado del plano)

El ejecutor propone al Capitán, antes de ingerir el corpus, una opción concreta
de cada columna, con su justificación en una página como máximo:

| Capa | Opciones a evaluar | Criterio |
|---|---|---|
| Cifrado en reposo | contenedor VeraCrypt; archivos `age`; SQLite+SQLCipher | apertura solo con clave del Capitán; sin claves en disco claro |
| Backup | copia cifrada local + copia cifrada externa con caducidad | restauración probada; borrado criptográfico posible |

La elección queda registrada en el acta de C0 y pasa a ser parte del plano
(v0.3) tras el visto bueno del Capitán.

### 2.3 Compuerta mínima

Implementación mínima suficiente para las pruebas: autenticación local, dos
roles (clínico, auditor), política de modelo fija a Ollama local, egreso de red
denegado por defecto y sin credenciales de nube en el entorno del proceso.

### 2.4 Pruebas de fuga (guion ejecutable)

Las cinco pruebas de la sección 8 del plano, con procedimiento y evidencia:

1. **Canarios.** Tras un ciclo completo de ingesta + 10 consultas, barrido de
   cada canario sobre: repos git locales y remotos, Drive, Bitácora, logs del
   sistema, historial de OpenWebUI y captura del tráfico de red del proceso.
   Evidencia: salida del barrido con cero apariciones fuera de la cámara.
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

- Ejecutar C0: falta el GO propio del Capitán.
- Tocar material clínico real o Hipatia protegida en cualquier forma.
- Ingerir el corpus sintético antes de la decisión de cifrado.
- Egreso hacia modelos externos: en C0 es técnicamente imposible por diseño.
- Cambiar el plano: cualquier desviación descubierta durante la preparación se
  propone como v0.3 del plano, no se improvisa.
