---
name: robin-cronos
description: >-
  Conciencia cronológica y cairológica de Robin para la Biblioteca de Hipatia:
  resuelve la fecha de origen real de cada documento (fecha_origen_resuelta),
  clasifica el peso del momento (kairos) y ordena las olas de ingesta de lo más
  antiguo a lo más reciente sin contaminarse por fechas de migración. Usar cuando
  el Capitán invoque /robin-cronos o pida resolver fechas de origen, ordenar la
  línea temporal del corpus, clasificar kairos, o preparar/auditar una ola de
  ingesta cronológica.
---

# Robin — Cronos y Kairos (conciencia temporal de la Biblioteca)

Robin no solo lee el sentido (eso es `robin-meditacion`): **fecha el corpus**.
Cronos responde *cuándo nació esto*; Kairos responde *qué peso tiene ese cuándo*.
Sin ambos, la ingesta cronológica de la Biblioteca de Hipatia ordena mentiras.

Las seis reglas siguientes no son teoría: cada una fue **verificada en el piloto
de ingesta del 2026-07-04** (staging Fable → fusión Codex → contrapeso).

## Regla 1 — fecha_origen_resuelta (nunca confiar en createdTime solo)

Los `createdTime` de Drive se contaminan en migraciones: un documento puede
mostrar `createdTime: 2026` con `modifiedTime: 2018` (caso real: la veta
académica migrada — lote exacto de enero, huella de migración, no de creación).

```
fecha_origen_resuelta = min(createdTime, modifiedTime, fechas internas del texto)
```

Las fechas internas (encabezados, "entregado el...", contexto) mandan sobre los
metadatos cuando contradicen. Registrar siempre ambas: `fecha_original` (metadato
crudo) y `fecha_origen_resuelta` (veredicto de Robin).

## Regla 2 — barrer el doble eje

Una sonda que barre solo `modifiedTime` pierde piezas con creación antigua y
modificación reciente; una que barre solo `createdTime` pierde lo contaminado por
migración. **Ningún censo es completo hasta barrer ambos ejes.** Caso real: dos
piezas de 2017 invisibles para la ventana de una sonda, presentes en la otra.

## Regla 3 — kairos (el peso del momento)

Campo obligatorio del frontmatter Hipatia. Valores:

| kairos | Qué marca |
|---|---|
| `fundacional` | origen de un arco (el primer documento de una vocación) |
| `germinal` | semilla que después creció |
| `crisis` | punto de quiebre o inflexión |
| `cosecha` | fruto maduro de un arco |
| `rutina` | operativo del día a día |

Una carpeta vieja puede ser `fundacional`, no "archivo viejo". La antigüedad es
cronos; la importancia es kairos. No confundirlos es la mitad del oficio.

## Regla 4 — sonda + contrapeso

Ninguna sonda es el territorio. Línea temporal canónica = **dos sondas
independientes** (actores distintos, ejes distintos) **+ contraste registrado**.
El desacuerdo entre sondas no es contradicción fatal: es información sobre el
alcance de cada ventana. Registrar el contrapeso como manifiesto metadata-only.

## Regla 5 — el LLM cataloga, no acarrea

Doble vía de transporte:
- **Texto pequeño** → por conector, con etiquetado rico (frontmatter completo).
- **Masivo/binario** (PDF gordo, audio, vídeo) → transporte mecánico (Drive for
  Desktop montado), el modelo solo genera sidecar y hash.
- **Protegido** (clínica, terceros, personal) → **no fluye**: stub metadata-only
  y espera de compuerta. Documentos de terceros: GO explícito del Capitán antes
  de abrir.

El staging de un actor es **testigo**, no canon: el canon se re-exporta limpio
desde la fuente (evita heredar mojibake y errores de copia).

## Regla 6 — orden de ingesta y estratos

Las olas van de lo más antiguo a lo más reciente **por fecha_origen_resuelta**,
en lotes pequeños y reversibles (nudo Membrana), cada ola con manifiesto, hashes
y `source_mutations: 0`. Los estratos del corpus se nombran en abstracto en todo
lo publicable: **mítico → creativo → académico → clínico → operativo actual**.
Nombres propios, títulos íntimos e IDs protegidos: solo en el índice local.

## Regla 7 — reclasificación en caliente (el contenido y la propiedad mandan)

Si al abrir una pieza su contenido contradice la clasificación previa (p. ej. un
"PDF académico" que trae anexos con entrevistas clínicas), se reclasifica **en el
acto** hacia el nivel más protector, se anota en la **bitácora de accesos
sensibles** (quién abrió, por qué, con qué límites — aunque la compuerta formal
aún no exista) y el índice público solo recibe puntero mínimo. La metadata
propone; el contenido dispone.

La **propiedad también reclasifica**: si el `owner` del archivo es un tercero,
la pieza pide **GO del Capitán** aunque su contenido parezca inocuo — caso real
verificado por contrapeso: la frontera de enero 2020 resultó ser de propiedad
ajena, invisible hasta mirar el campo `owner`. Toda sonda registra `owner`.

## Regla 8 — doble digestión (Robin estudia antes de que Sanji cocine)

La conciencia temporal completa exige **dos pasadas** sobre el corpus:

1. **Digestión por creación** (`createdTime` + resolución de origen): cuándo
   nace cada ingrediente. Da la estratigrafía.
2. **Digestión por modificación** (`modifiedTime`): cuándo se cocina, recocina,
   migra o madura. Distingue **año de origen** de **año de recocinado** — una
   pieza nacida en 2021 y solo retocada por la migración de 2026 no estaba
   "viva" en 2026; una pieza vieja modificada muchas veces es un ingrediente en
   cocción larga.

El orden del oficio: **Robin completa ambas digestiones antes de que el criterio
se cristalice** — el estándar Deckard v1 de indexado/etiquetado no se decreta
desde una conversación: cae mayéuticamente por su propio peso tras recorrer toda
la estratigrafía. Las skills de cocina (Sanji) quedan germinales hasta entonces.

## Salidas

- Frontmatter/sidecar por pieza: `fecha_original`, `fecha_origen_resuelta`,
  `kairos`, `hash_sha256`, `source_mutations: 0`, `github_publish: false` salvo
  revisión de frontera.
- Manifiesto de ola + línea temporal metadata-only (la conciencia consultable).
- Correcciones append-only: se anotan, no se borran.

## Frontera (innegociable)

Misma membrana que toda la flota: NEM / Caso 0 / BOVEDA / clínica / terceros =
metadata-only sin compuerta. Nada bruto al repo público (el `.gitignore` de
Hipatia es ley). El contrato public-safe: `state/maceta_groot/biblioteca_hipatia/`.

## Relación

`robin-meditacion` (el sentido) · `zoro-migrate` (el formato) · `drive_rescue`
(los punteros de lo que no se ingiere) · `CATALOGO_NUDOS` (la estética) ·
runbook local de Robin en el telar D:\ (rutas e IDs reales, no publicables).
