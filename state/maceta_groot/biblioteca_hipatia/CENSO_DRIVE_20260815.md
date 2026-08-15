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

---

## Tercera lectura — cinco raices por mimeType (claude-code, 2026-08-15)

Actor: claude-code, sesion cloud. Metodo: conector Drive, **metadata-only**,
primer nivel de las cinco raices. `source_mutations: 0`.

Codex midio **estructura** (entradas, carpetas, profundidad). Esta pasada mide
lo que faltaba: **de que estan hechos** esos ficheros.

### El contraste estructural PASA

Mis cifras de primer nivel coinciden **exactamente** con las de Codex: 57
entradas directas y 34 carpetas de segundo nivel, raiz por raiz. Dos sesiones
distintas, mismo resultado. La regla 4 queda satisfecha en el eje estructural.

Lo que Codex no reporto, y es donde estaba el dato:

| Raiz | Ficheros (1er nivel) | Texto plano | Google Docs | Otros |
|---|---:|---:|---:|---:|
| `01_SISTEMA` | 8 | 1 | 6 | 1 script |
| `03_PROYECTOS` | 0 | 0 | 0 | 0 |
| `04_PERSONAL` | 7 | 0 | 6 | 1 RTF |
| `90_ARCHIVO` | 2 | 0 | 2 | 0 |
| `00_INBOX` | 6 | 0 | 6 | 0 |
| **Total** | **23** | **1** | **20** | **2** |

**De 23 ficheros sueltos en las cinco raices, uno esta en texto plano.** El
patron se sostiene fuera de la Biblioteca.

`03_PROYECTOS` no tiene ni un fichero suelto: son 13 carpetas y nada mas. Y son
las que importan — `NEMESIS_SISTEMA`, `SOFIA`, `AGAPE`, `DECKARD`, `DOCTORADO`.
El grueso del corpus operativo vive ahi debajo, sin medir.

### Hallazgo 8 — la membrana clinica no coincide con `02_CLINICA`

Este es el hallazgo grave de la pasada.

Hay material clinico **fuera** de `02_CLINICA`, en raices que nadie trata como
protegidas:

- `01_SISTEMA` contiene una alerta etica con **iniciales de paciente** y la nota
  de consentimiento sin formalizar, mas un `INTEGRACIONES_CLINICAS.md`.
- `90_ARCHIVO` contiene dos documentos que referencian el pipeline de sesion de
  un caso identificado por iniciales.
- `04_PERSONAL` contiene siete piezas marcadas `[N3-ACT-C0]` / `[N3-LAT-C0]`,
  es decir **Caso 0**: el propio Capitan como paciente.

**Consecuencia:** cualquier compuerta que vigile solo `02_CLINICA` no protege
nada. La proteccion tiene que ser por marcador (`C0`, `NEM`, `CLI`, iniciales)
y por contenido, no por ruta. Es la regla 7 aplicada a nivel de arbol entero.

No se listan aqui titulos ni iniciales. La existencia y el recuento bastan para
decidir; el detalle es del indice local.

### Hallazgo 9 — el orden cronologico choca con la membrana

La regla 6 de `robin-cronos` ordena las olas **de lo mas antiguo a lo mas
reciente**. Aplicada literalmente al Drive real, la ola 1 empieza por
`04_PERSONAL`: carpetas de **2018** (dos libros, canciones, escritos a medias) y
documentos de 2020, 2021, 2023 y 2025.

Es el unico estrato del Drive con profundidad cronologica real — y es tambien el
mas protegido: Caso 0, relaciones personales, venta de vivienda.

**La regla del orden y la regla de la membrana se contradicen aqui.** No es un
detalle de implementacion: es una decision del Capitan con Vivi delante, y hay
que tomarla **antes** de ordenar ninguna ola por fecha de origen.

Corolario util: la contaminacion del 2026-06-13 **no es universal**. Ninguna de
las cinco raices la muestra. Esta localizada en `04_Raices` (119 de 124, segun
el contrapeso de Codex). El resto del corpus conserva cronos utilizable.

### Hallazgo 10 — los duplicados cruzan raices

Dos piezas aparecen en dos raices distintas con nombre casi identico:

- `vivi_auditoria_semanal_20260608.md` — en `01_SISTEMA` y en `04_Raices/ETH`.
- `HANDOFF_DESPACHO_20260526` — en `01_SISTEMA` sin extension, en `04_Raices/OPE`
  con `.md` en el titulo.

Una deduplicacion por nombre exacto dentro de cada carpeta **no los encuentra**.
El deduplicador de B3 tiene que comparar por hash y a lo ancho del arbol, no por
titulo dentro de carpeta.

Ademas hay una **carpeta** duplicada: `TRADING` existe dos veces bajo
`03_PROYECTOS`, con dos IDs distintos.

Y hay al menos **tres papeleras** compitiendo: `PAPELERA_HIPATIA`
(`03_PROYECTOS`), `BASURA` (`00_INBOX`) y `_DUPLICADOS` (`90_ARCHIVO`). Decidir
cual recibe los descartes es parte de la decision B1 sobre duplicados.

### Hallazgo 11 — si hay markdown en Drive, pero no es la Biblioteca

Correccion de alcance al titular, hecha antes de que alguien la haga mal.

Una consulta global por `mimeType = 'text/markdown'` devuelve **mas de 100
ficheros** (la primera pagina se agota con `nextPageToken`). Leido sin cuidado,
eso parece contradecir "solo 7 piezas en texto".

No lo contradice: **ese markdown no es corpus digerido, es el repo volcado**.
Son `SLEEP_*.md`, `SKILL.md`, `CREW.md`, `RUTINAS.md`, `README.md`,
`ARQUITECTURA.md` y companeros — codigo y documentacion del sistema subidos a
Drive, y subidos **al menos dos veces** (tandas del 2026-07-02/04 y del
2026-07-07, los mismos ficheros bajo padres distintos).

Las dos afirmaciones conviven:

- En las carpetas de la Biblioteca, el corpus no esta convertido. Sigue en pie.
- En Drive en general si hay markdown, pero es espejo de GitHub, no Biblioteca.

Quien mida "markdown en Drive" sin filtrar por carpeta se dara por migrado otra
vez, por tercera via distinta. Van tres: la extension del titulo, el `ls`, y ahora
el recuento global de `mimeType`.

### Estado tras esta pasada

- **Demostrado:** el patron de no-conversion se sostiene fuera de la Biblioteca
  (1 de 23 en el primer nivel de las cinco raices).
- **Demostrado:** el contraste estructural entre dos sesiones independientes
  coincide (57 / 34).
- **Demostrado:** hay material clinico y de Caso 0 fuera de `02_CLINICA`.
- **Demostrado:** la contaminacion de fechas esta localizada en `04_Raices`.
- **Sigue PARCIAL:** el denominador global. `03_PROYECTOS` guarda los cinco
  pilares y no se ha medido por dentro.
- **Sigue pendiente:** la sonda mecanica con Drive montado. Las tres lecturas
  hechas hasta ahora usan el mismo conector; coinciden entre si, pero comparten
  ventana. Coincidir no es lo mismo que ser completo.
