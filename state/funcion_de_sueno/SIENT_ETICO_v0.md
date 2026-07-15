---
status: active
timestamp: 2026-07-15T15:40:00+02:00
sensitivity: public_safe_no_secret
linux_dependency: false
model_policy: commercial_models_allowed_only_on_sient_etico
---

# SIENT-ETICO v0

## Definicion

`sient-etico` es un destilado sintetico: suficiente para que un LLM razone
sobre patrones, decisiones y tensiones del barco, pero insuficiente para
reconstruir una persona, un documento original, una ruta local, un caso clinico
o una tabla de resolucion.

No es un resumen normal. Es una transformacion de seguridad.

## Motivo

Mientras no haya computo local soberano, el barco puede usar modelos
comerciales solo sobre material `sient-etico`.

La maxima independencia disponible por ahora es reducir proveedores y operar,
cuando sea posible, con un solo motor externo barato, preferentemente DeepSeek,
sin enviar raw, `source_ref`, nombres reales ni material resoluble.

## Contrato

Un artefacto `sient-etico` puede conservar:

- patrones;
- hipotesis;
- decisiones;
- tensiones;
- cronologia aproximada;
- categorias semanticas;
- relaciones abstractas entre temas;
- lecciones aprendidas;
- riesgos y bloqueos no identificantes;
- `anchor_id` opaco solo si no permite resolver fuera del Anillo 0.

Un artefacto `sient-etico` no puede contener:

- nombres reales de pacientes, terceros o personas identificables;
- IDs de Drive, URLs privadas, rutas locales o nombres de fichero originales;
- `source_ref`;
- citas largas o parrafos literales de material sensible;
- fechas exactas si permiten reidentificacion;
- combinaciones de detalle que identifiquen indirectamente a alguien;
- contenido clinico resoluble;
- tablas `anchor_id -> source_ref`;
- instrucciones para abrir capsulas o localizar llaves;
- secretos, tokens, claves o rutas de credenciales.

## Anillos

```text
Anillo 0: raw, capsulas, llaves, tablas de resolucion. Solo local.
Anillo 1 resoluble: destilados con anchor_id. Resolucion solo dentro de capsula.
Anillo 1 sient-etico: destilado sintetico no resoluble. Apto para LLM comercial.
Anillo 2 publico/compartible: solo si ademas pasa public-safe.
```

## Politica de modelos

El modelo comercial no recibe raw. Recibe `sient-etico`.

El modelo puede:

- razonar;
- agrupar;
- proponer estructura;
- detectar contradicciones;
- generar planes;
- sugerir preguntas para volver al Anillo 0.

El modelo no puede:

- resolver identidades;
- abrir anclas;
- pedir rutas reales;
- pedir llaves;
- tratar una inferencia como hecho del raw;
- convertir `sient-etico` en sustituto del documento original.

## Formato minimo

```yaml
sient_etico_version: 0
source_ring: "anillo_1_destilado"
resolvable: false
contains_third_parties: false
contains_clinical_payload: false
anchor_policy: "opaque_or_absent"
allowed_model_scope: "commercial_single_provider"
provider_preference: "deepseek"
negative_proof_required: true
```

## Campo recomendado

```yaml
id: "SENT-YYYYMMDD-0001"
obra_o_cluster: "titulo sintetico no identificante"
periodo: "aproximado"
dominio: ["academico", "sistema", "personal_no_identificante"]
patrones:
  - "patron abstracto"
tensiones:
  - "tension abstracta"
decisiones:
  - "decision no identificante"
riesgos:
  - "riesgo no identificante"
preguntas_para_anillo_0:
  - "pregunta que solo el Capitan puede resolver localmente"
prohibido_resolver_fuera_de_anillo_0: true
```

## Prueba negativa obligatoria

Antes de usar un artefacto `sient-etico` con un modelo comercial, intentar
demostrar que falla el contrato:

```text
1. Intentar recuperar una persona real.
2. Intentar recuperar una ruta local.
3. Intentar recuperar un Drive ID o URL privada.
4. Intentar recuperar un source_ref.
5. Intentar reconstruir el documento original.
6. Intentar inferir un tercero identificable por combinacion de detalles.
```

El artefacto solo pasa si los seis intentos fallan.

## Criterio de aceptacion

Un lote `sient-etico` esta listo cuando:

- no contiene raw;
- no contiene resolucion;
- no contiene terceros identificables;
- no contiene rutas, URLs privadas, IDs o nombres de fichero fuente;
- conserva utilidad de razonamiento;
- pasa prueba negativa;
- declara proveedor previsto;
- puede borrarse o regenerarse sin perdida de canon, porque el canon real vive
  en Anillo 0 / Anillo 1 resoluble.

## Relacion con DeepSeek

DeepSeek no se trata como cerebro soberano. Se trata como motor barato de
inferencia sobre `sient-etico`.

La potencia no viene del modelo desnudo, sino del arnes:

- destilacion;
- RAG curado;
- roles;
- herramientas;
- pruebas negativas;
- memoria de trabajo;
- compuertas;
- evaluacion.

## Regla corta

```text
Lo crudo no sale.
Lo resoluble no sale.
Lo que sale a modelo comercial es sient-etico.
Si hace falta verdad original, vuelve el Capitan al Anillo 0.
```

## Estado

Este contrato no autoriza Linux, no autoriza Hipatia real en la VM y no autoriza
subir capsulas ni llaves a ningun proveedor.

El siguiente paso operativo recomendado es crear un micro-lote de prueba con
material sintetico o ya public-safe, y hacer fallar la prueba negativa antes de
conectarlo a DeepSeek.
