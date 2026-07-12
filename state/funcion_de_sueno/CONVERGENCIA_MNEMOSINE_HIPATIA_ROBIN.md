# Convergencia MNEMOSINE - Hipatia - Robin

Fecha: 2026-07-12

## Dictamen

MNEMOSINE, la compuerta de Hipatia y las fases Robin no son tres sistemas.

Son una sola membrana vista desde tres puntos:

- MNEMOSINE define como entra el raw y como queda anclado.
- Hipatia define que puede cruzar hacia `public_safe`.
- Robin define como ordenar cronologia, estratos y peso semantico.

La funcion de sueno no debe duplicar esa membrana. Debe recibir sus destilados y auditar coherencia.

## Regla de membrana

El eje operativo no es "clinica vs contexto".

Ese eje falla porque la experiencia vivida mezcla contexto, lenguaje, cuerpo, relaciones, historia y circunstancia.

El eje operativo es:

```text
mio / no identificante  -> puede destilarse y cruzar si es public-safe
tercero identificable   -> protegido por defecto
duda                    -> protegido por defecto
```

Regla corta:

> La verdad no se recorta. Se guarda entera en local y solo cruza filtrada.

Nota: esto es un criterio operativo de proteccion y arquitectura, no asesoramiento juridico.

## Correspondencias canonicas

| Funcion | Canon |
| --- | --- |
| Raw local, cifrado, con anclas | `state/funcion_de_sueno/MNEMOSINE_v0.md` |
| Biblioteca local y compuerta public-safe | `state/maceta_groot/biblioteca_hipatia/README.md` |
| Contrato public-safe de Hipatia | `state/maceta_groot/biblioteca_hipatia/BIBLIOTECA_HIPATIA_PUBLIC_SAFE_20260704_034210.md` |
| Estudio cronologico y estratos semanticos | Robin / robin-cronos / robin-meditacion |
| Migracion Drive -> Markdown literal | Zoro / zoro-migrate |
| Proteccion clinica y terceros | Chopper + HOLD_CLINICO / Caso 0 |
| Consumo operativo del vault | `bridge-linux/ARQUITECTURA.md` |
| Auditoria nocturna | `state/funcion_de_sueno/` |

## Flujo unico

```text
Drive/raw local
  -> Zoro: Markdown literal con IDs
  -> MNEMOSINE: anchor_id + destilado
  -> Chopper: marca terceros identificables / duda / protegido
  -> Robin: fecha, kairos, estrato semantico, peso
  -> Hipatia: compuerta public-safe
  -> Vault/RAG: solo destilado seguro
  -> bridge-linux: Open WebUI + DeepSeek leen mapa, no territorio
  -> funcion_de_sueno: audita deriva y consolida
```

No invertir el flujo.

En particular:

- Open WebUI no lee bruto intimo.
- DeepSeek no recibe terceros identificables.
- GitHub no recibe el indice real `anchor_id -> fichero local`.
- La Routine no necesita raw para auditar coherencia.

## Membrana local

Material que queda local:

- bruto de Drive
- transcripts completos
- notas clinicas
- material personal identificante
- tablas de traduccion de IDs
- rutas de ficheros reales
- audio, imagen y video originales

Zonas equivalentes:

- MNEMOSINE Anillo 0
- Hipatia `_protegido/`
- Chopper HOLD_CLINICO / Caso 0

Estas zonas pueden ser ricas, contradictorias y completas. No son para publicar. Son para conservar verdad.

## Membrana public-safe

Material que puede cruzar:

- patrones no identificantes
- decisiones arquitectonicas
- indices sin IDs protegidos
- destilados sobre el propio Capitan sin terceros identificables
- aprendizajes generalizados
- mapas de flujo
- reportes de coherencia

Zonas equivalentes:

- MNEMOSINE Anillo 1 si no contiene raw
- Hipatia `_public_safe/`
- documentos de arquitectura en `state/`
- specs y runbooks de `bridge-linux/`

## Roles

### Zoro

Convierte material disperso en Markdown literal y estructura minima.

No decide publicacion. Prepara material.

### Robin

Resuelve fecha, olas de ingesta, kairos y estratos.

Su pregunta no es "esto es publico", sino "donde vive en la historia del sistema".

### Chopper

Marca riesgo humano.

Su pregunta operativa:

```text
Hay un tercero identificable o inferible?
```

Si la respuesta es si o no esta clara, el material queda protegido.

### Hipatia

Custodia la biblioteca.

Su compuerta decide que destilados cruzan a `public_safe`.

### MNEMOSINE

Mantiene anclas.

Permite razonar con destilados sin perder la posibilidad de volver al origen bajo permiso local.

### Funcion de sueno

Audita despues.

No debe abrir raw salvo que exista una tarea explicita y permiso local.

## Reglas duras

1. Nada crudo sale de casa.
2. Nada operativo depende de recordar todo.
3. Toda sintesis durable debe tener ancla opaca.
4. El indice de anclas real no se sube.
5. La duda protege.
6. Terceros identificables quedan en local.
7. Los modelos cloud solo ven destilado seguro o parafraseo no identificante.
8. GitHub conserva arquitectura, no territorio.
9. La funcion de sueno audita destilados, no raw.
10. Un concepto de membrana debe citar a los otros; no crear membranas paralelas.

## Decision para el probe

El probe de 10 conversaciones debe comprobar la membrana, no solo la calidad del resumen.

Checks minimos:

- Cada destilado tiene `anchor_id`.
- Ningun destilado contiene ruta local.
- Ningun destilado contiene tercero identificable sin proteccion.
- Robin puede ordenar la pieza en cronologia.
- Chopper puede explicar por que cruza o no cruza.
- Hipatia puede clasificarlo como `_protegido`, `_compost` o `_public_safe`.
- La funcion de sueno puede leerlo sin abrir raw.

## Pendiente operativo

Cuando `MNEMOSINE_v0.md` y este documento aterricen en canon, actualizar los docs de Hipatia para citar esta convergencia.

No duplicar contratos. Coserlos.
