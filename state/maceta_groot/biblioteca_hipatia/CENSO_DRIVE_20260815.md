# Censo Drive -> Vault — 2026-08-15

Actor: claude-code (sesion cloud, sin hub ni monturas locales)
Metodo: conector Google Drive, **metadata-only**. Cero lecturas de contenido.
Alcance: parcial y declarado. Este censo no barre el corpus entero (ver Limites).
Estado: sonda 1 de 2. Falta contrapeso (regla 4 de `robin-cronos`).

## Titular

De las **189 piezas barridas, 7 estan en texto plano**. El resto son 180 Google
Docs nativos y 2 objetos que ni siquiera son documentos. **El 96,3% del corpus
barrido no es texto**, es un objeto propietario que ninguna herramienta local
lee sin conversion.

No es una estimacion. Es el `mimeType` que devuelve Drive pieza a pieza.

**`04_Raices` esta barrida entera** (raiz + los siete estratos): 124 piezas,
6 en texto plano. Es el primer arbol del corpus con denominador real conocido.

## Lo barrido

| Carpeta Drive | Piezas | Texto plano | Google Docs | Otros |
|---|---:|---:|---:|---:|
| `[N1-MYT-BIB] BIBLIOTECA_HIPATIA__MYTHOS` | 65 | 1 | 64 | 0 |
| `04_Raices` (raiz) | 12 | 2 | 10 | 0 |
| `04_Raices/SOF` (soberania) | 1 | 0 | 0 | 1 |
| `04_Raices/ETH` (etica) | 5 | 1 | 4 | 0 |
| `04_Raices/OPE` (operativo) | 7 | 1 | 5 | 1 |
| `04_Raices/NEX` (nexus) | 32 | 0 | 32 | 0 |
| `04_Raices/ACA` (academico) | 22 | 0 | 22 | 0 |
| `04_Raices/NAR` (narrativo) | 5 | 0 | 5 | 0 |
| `04_Raices/SIS` (sistema) | 40 | 2 | 38 | 0 |
| **Total** | **189** | **7** | **180** | **2** |

Cuatro de los siete estratos —`SOF`, `NEX`, `ACA`, `NAR`— **no tienen ni una
sola pieza en texto plano**. El unico texto de la estanteria mitica es su propio
LEEME.

## Hallazgos que cambian el plan

### 1. Treinta y cinco ficheros mienten en el nombre

**35 Google Docs llevan `.md` en el titulo.** Diez en la raiz de `04_Raices`,
diecisiete en `SIS`, cuatro en `ETH`, cuatro en `OPE`. Son las series
`digestion_local_*.md` y `ananda_sutras_*.md`, mas `vivi_auditoria_semanal_*.md`,
`VALIDACION_PREDICTIVA.md`, `RUNBOOK_ALTA_AUTONOMO_*.md`, `HANDOFF_DESPACHO_*.md`,
`ESTUDIO_DISENO_DOCFAV_*.md` y `cierre_arco_docfav_*.md`.

Un inventario que cuente por extension del titulo los dara por migrados. Un
`ls` los da por migrados. Obsidian los abre y no ve nada. Es exactamente el
nudo que `zoro-migrate` existe para cortar (`.md.gdoc` y Docs nativos con
nombre de markdown), y sigue sin cortar en estas dos series.

**Consecuencia operativa:** cualquier metrica de avance basada en nombres de
fichero esta inflada. La unica metrica valida es `mimeType`.

### 2. Ocho pares duplicados exactos

Mismo titulo, dos IDs, creados con segundos de diferencia:

- Estanteria mitica: 3 pares (huella de re-ejecucion del 2026-07-04).
- Estanteria academica: 4 pares, uno de ellos marcado `(1)` por el propio Drive.
- `NEX`: 1 par — "Arquitectura del Segundo Cerebro: Chunking y Eficiencia
  Cognitiva", **identico byte a byte** (4.178 B las dos copias).

No son versiones: son colisiones de tiradas repetidas. Ingerir sin deduplicar
mete ocho piezas fantasma en la Biblioteca y contamina cualquier grafo posterior.

### 3. La estratigrafia esta contaminada por la migracion

En `ACA`, `NAR` y `NEX` **todas** las piezas tienen `modifiedTime` del
2026-06-13 a las 03:22 — la marca de un movimiento masivo de carpetas, no de
edicion real. En `NEX` son 32 de 32. Sus `createdTime` van de mayo a junio de 2026.

Es el caso que anticipa la regla 1 de `robin-cronos`: la fecha del metadato es
huella de migracion, no de origen. **Ordenar las olas por `modifiedTime` ordena
mentiras.** Hace falta `fecha_origen_resuelta` antes de decidir el orden de ingesta.

### 4. Dos piezas que el pipeline de conversion no puede tragar

El contrato de `zoro-migrate` es Google Doc -> Markdown. Dos piezas no son
documentos:

- `SOF`: un **Google Apps Script**. Es el unico habitante del estrato.
- `OPE`: una **hoja de calculo** (`servicios_doctoralia`).

Ninguna entra por el pipeline de Docs. Necesitan decision de formato de destino
antes de que nadie las cuente como pendientes de conversion, porque no lo son
en el mismo sentido.

### 5. `SOF` es un estante vacio

Un estrato declarado en la estructura, con una sola pieza dentro, y esa pieza es
codigo, no corpus. La estanteria de soberania **no tiene contenido**. No es que
falte convertir: es que no hay nada que convertir.

### 6. La politica de sensibles ya existe a medias — leerla antes de escribirla

`ETH` contiene `[N4-ACT-ETH] H007_CLI_NAR_ACA_GUARDRAIL_20260614.md` — **el unico
markdown real del estrato**, marcado `ACT` (canon vivo), y por su nombre es un
guardrail entre lo clinico, lo narrativo y lo academico.

Quien vaya a redactar la lista de sensibles de la jornada **lee H007 primero**.
Escribir una politica nueva sin leer el guardrail vigente es fabricar una
contradiccion, no cerrar un pendiente.

### 7. `NEX` toca material sellado — señalar, no tocar

Los 32 documentos de `NEX` son material Metatron, incluido "El Genoma Metatron:
Semilla, Axiomas y la Placenta del Conocimiento".

`POSICION.md` §5 dice que las capas N1–N5 del genoma son stubs pendientes de
"sesion con acceso a boveda local". Aqui hay material Metatron **fuera** de la
boveda. La tentacion evidente es usarlo para rellenar N1–N5.

**No se hace.** Metatron esta SELLADA e HIBERNADA por GO C0 del Capitan desde el
2026-07-05 (`state/metatron/RETOMAR.md`). Escribir capas de genoma es exactamente
lo que el sello prohibe. Este censo lo registra como hallazgo y para ahi.

Si el Capitan quiere abrir esa via, es una decision suya y requiere levantar el
sello explicitamente. No es un efecto colateral de una ola de ingesta.

## La contraparte: que hay en el Vault

En este repo, `vault/` tiene **9 ficheros y cero corpus**: tres plantillas, cuatro
manifiestos de lotes Metatron, una geometria y la config. Todo andamiaje.

`state/maceta_groot/biblioteca_hipatia/` tiene **2 ficheros**, ambos contrato
public-safe. Ninguno es contenido.

**Piezas del corpus barrido presentes en el Vault de este repo: 0 de 189.**

Esto no dice que la Biblioteca local este vacia: la raiz real es
`D:\Biblioteca de Hipatia\` y esta sesion no la ve. Lo que si queda demostrado
es que **la copia que la nube puede leer no tiene ni una pieza del corpus**, y
que el barrido de Drive no encuentra el texto convertido junto a su fuente.

## Limites de este censo (leer antes de citarlo)

Lo que **no** se ha barrido, y por que:

- `00_BOVEDA_NEXUS` — sellada e hibernada por GO C0 desde el 2026-07-05. No se toca.
- `[N2-PEN-INB] 02_CLINICA` — membrana clinica. Metadata-only sin compuerta; no se
  ha descendido ni a nivel de titulos.
- `01_SISTEMA`, `03_PROYECTOS`, `04_PERSONAL`, `90_ARCHIVO`, `00_INBOX` y el resto
  de raices — sin barrer.
- Dentro de lo barrido, **solo primer nivel**: si algun estrato tiene subcarpetas
  no declaradas, no estan contadas. `04_Raices` no las tenia; los demas no se
  han comprobado.

El total real del corpus es **mayor** que 189. `04_Raices` si tiene denominador
cerrado (124). El resto del universo sigue sin medir.

Ademas, por regla 4 de `robin-cronos`, **una sonda no es el territorio**. Esto es
la sonda por conector. Falta la sonda mecanica local (Codex, Drive montado) y el
contraste registrado. Hasta entonces estos numeros son indicativos, no canon.

## Lo que este censo autoriza a decidir

1. La conversion a texto **no esta empezada** en cuatro de los siete estratos ni
   en la estanteria mitica. No es "casi"; es cero.
2. El cuello no es el volumen. 187 piezas convertibles de 1-14 KB son minutos de
   conversion. El cuello es que **no hay pipeline reproducible corriendo**, y que
   lo que parece hecho por el nombre no lo esta.
3. Antes de ingerir hace falta, en este orden: deduplicar (8 pares), resolver
   `fecha_origen_resuelta` (contaminacion del 06-13) y solo despues ordenar olas.
4. `04_Raices` tiene denominador cerrado: **124 piezas, 6 en texto**. Sobre ese
   arbol si se puede medir avance sin inventar.
5. La ola 1 puede ampliarse mas alla del estante mitico sin riesgo de alcance:
   `NAR` (5) y `ETH` (4 convertibles) son lotes pequeños y cerrados.

## Lo que NO autoriza

- **No autoriza porcentaje de avance global del corpus.** Fuera de `04_Raices`
  el denominador sigue sin medir. Cualquier "vamos por el X%" del total es invencion.
- **No autoriza tocar Metatron.** El hallazgo 7 es un dato, no un permiso.
- **No autoriza contar `SOF` y la hoja de `OPE` como pendientes de conversion**
  hasta que exista decision de formato de destino.

---

*Metadata-only. Sin IDs de Drive, sin titulos clinicos, sin contenido. Frontera
`robin-cronos` regla 5 respetada: el LLM cataloga, no acarrea.*

---

## Contrapeso Codex — 2026-08-15

Actor: Codex, sesion local del Capitan. Metodo: conector Drive de esta sesion,
**metadata-only**; no hubo descarga ni lectura de contenido, y
`source_mutations: 0`.

Este corte es una segunda lectura de metadatos desde una sesion distinta; **no**
es aun la sonda mecanica de una montura local de Drive. Tampoco cierra el
denominador global: el alcance es las cinco raices que faltaban, a dos niveles,
con una exclusión conservadora de un subarbol protegido detectado por su nombre.

| Raiz | Entradas directas | Carpetas en segundo nivel | Entradas observadas bajo segundo nivel | Alcance |
|---|---:|---:|---:|---|
| `01_SISTEMA` | 16 | 8 | 289 | dos niveles |
| `03_PROYECTOS` | 13 | 13 | 144 | una carpeta protegida excluida |
| `04_PERSONAL` | 14 | 7 | 130 | dos niveles |
| `90_ARCHIVO` | 4 | 2 | 58 | dos niveles |
| `00_INBOX` | 10 | 4 | 37 | dos niveles |
| **Total observado** | **57** | **34** | **658** | no recursivo |

Las 658 entradas son las hijas de las carpetas de segundo nivel ya elegibles;
incluyen carpetas y objetos no documentales. No son un total de corpus ni una
medida de avance. La exploracion ha encontrado mas profundidad en las cinco
raices, por lo que declararlas cerradas ahora seria una inferencia falsa.

### Contraste temporal por ambos ejes

El re-barrido de los dos estantes ya censados confirma la advertencia sobre
`modifiedTime`:

| Estante | Piezas observadas | `createdTime` | `modifiedTime` | Veredicto |
|---|---:|---|---|---|
| `04_Raices` | 124 | repartido entre 2026-04-23 y 2026-06-14 | 119 piezas el 2026-06-13 | la fecha de modificacion es huella de movimiento, no orden de origen |
| `MYTHOS` | 65 | 2026-06-16..2026-07-05 | coincide por dia con `createdTime` | sin contaminacion equivalente en este estante |

El censo anterior acertaba en el fenomeno de `04_Raices`; el contrapeso lo
reproduce desde otra sesion y precisa su magnitud: 119 de 124 piezas comparten
la fecha de modificacion. En consecuencia, ninguna ola se ordena por
`modifiedTime`; conserva ambos ejes y deja `fecha_origen_resuelta` para la
lectura semantica autorizada.

### Estado de B2

- **Demostrado:** existen subcarpetas y objetos fuera del primer nivel en las
  cinco raices antes no medidas; no se puede derivar el denominador global de
  las 189 piezas iniciales.
- **Demostrado:** la contaminacion de fechas de `04_Raices` es reproducible;
  MYTHOS no la comparte en la misma forma.
- **Protegido:** no se descendio al subarbol marcado como sensible, ni a
  `02_CLINICA` ni a `00_BOVEDA_NEXUS`.
- **Pendiente:** recorrido recursivo con allowlist por dominio y sonda mecanica
  local. Hasta entonces, B2 sigue `PARCIAL` y el porcentaje global es
  `NO_DEMOSTRADO`.
