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

---

## Cuarta lectura — `03_PROYECTOS` por dentro (claude-code, 2026-08-15)

Actor: claude-code, sesion cloud. Metadata-only, `source_mutations: 0`.
Alcance: **primer nivel de los trece hijos** de `03_PROYECTOS`.

| Hijo | Entradas | Ficheros | Texto plano | Google Docs | Otros | Carpetas |
|---|---:|---:|---:|---:|---:|---:|
| `NEXUS` | 65 | 62 | **26** | 36 | 0 | 3 |
| `AGAPE` | 24 | 5 | 0 | 5 | 0 | 19 |
| `BIOSFERA` | 17 | 16 | 0 | 16 | 0 | 1 |
| `SOFIA` | 16 | 2 | 0 | 2 | 0 | 14 |
| `DOCTORADO` | 9 | 1 | 0 | 1 | 0 | 8 |
| `NEMESIS_SISTEMA` | 7 | *no descendido* | — | — | — | 7 |
| `TRADING` (b) | 4 | 4 | 0 | 4 | 0 | 0 |
| `TRADING` (a) | 4 | 0 | 0 | 0 | 0 | 4 |
| `DECKARD` | 3 | 0 | 0 | 0 | 0 | 3 |
| `OPERATIVO` | 2 | 2 | 0 | 0 | 2 `.docx` | 0 |
| `PAPELERA_HIPATIA` | 0 | 0 | 0 | 0 | 0 | 0 |
| `Proyectos_corto_plazo` | 0 | 0 | 0 | 0 | 0 | 0 |
| `Proyectos_largo_plazo` | 0 | 0 | 0 | 0 | 0 | 0 |
| **Total** | **151** | **92** | **26** | **64** | **2** | **59** |

**26 de 92 ficheros en texto plano — el 28%.** Un orden de magnitud por encima de
todo lo demas, y concentrado entero en `NEXUS`.

Acumulado de las cuatro lecturas: **304 ficheros medidos, 34 en texto plano
(11,2%)**. La cifra sube respecto al 3,7% anterior, y sube por una razon concreta.

### Hallazgo 12 — la conversion YA se ejecuto una vez, y funciono

Es el hallazgo que desbloquea B3.

En `NEXUS` hay **14 pares**: un Google Doc y, junto a el, su markdown real de la
serie `WP010_<ID-Deckard>_<slug>_v1.md`, todos creados el **2026-05-24** en una
sola tanda. Ejemplos de par: "Matriz Nexus Ayurveda DSM-5", "Protocolo Deckard
Mapa del Micelio", "Blindaje Sofia", "Agent Bridge", "Poda Ontologica",
"Personhood Jardines", "OKRs Scale-Up".

**No es cierto que la conversion no se haya empezado nunca.** Se hizo una vez,
sobre 14 piezas, en una carpeta, y se paro. Existe precedente ejecutable y
nomenclatura ya elegida.

Consecuencia para B3: **no se disena el pipeline desde cero, se reproduce y se
extiende WP010.** Antes de escribir codigo, mirar como quedaron esas 14 piezas —
si su calidad es aceptable, el contrato ya esta demostrado y solo falta escalarlo.

Correccion honesta al titular de este censo: "la conversion no esta empezada" era
cierto para los estantes de la Biblioteca, y **falso para `NEXUS`**. La sonda
anterior no habia mirado ahi.

### Hallazgo 13 — el contrato de migracion existe, en texto, y esta localizado

`OBSIDIAN_MIGRATION_PROTOCOL_v0_1.md` esta en `NEXUS` como markdown real.
`vault/vault.config.json` de este repo lo cita como
`"protocol": "OBSIDIAN_MIGRATION_PROTOCOL_v0.1"`.

El contrato que B3 necesita **ya esta escrito**, y hasta hoy nadie sabia donde
vivia. Se lee antes de redactar contrato nuevo.

Junto a el, la serie `OBSIDIAN_BATCH_0002..0004` y `OBSIDIAN_PILOT_0001` en
markdown: son los manifiestos de los lotes que `vault.config.json` lista como
`SEALED` / `MIRROR` / `OBS`. La trazabilidad de los lotes existe en Drive.

### Hallazgo 14 — `BIOSFERA` es un apelmazamiento de versiones

Dieciseis Google Docs, **todos** titulados "Valoracion Biosferica: Modelo
Matematico" con sufijos de version (sin sufijo ×3, 1.2, 1.3, 1.3.2 … 1.3.9.2,
1.4.2, 1.4.3). Creados **todos en unas cuatro horas** del 2026-02-17/18. Tamanos
de 92 KB a 222 KB: alrededor de 2 MB en total.

Tres comparten titulo identico. Y **las dieciseis estan marcadas `ACT`**, es
decir activas: ninguna esta senalada como canonica.

Es el mayor apelmazamiento del corpus. Ingerirlo sin resolver version mete
dieciseis copias del mismo modelo en la Biblioteca. No es trabajo de deduplicado
por hash —los bytes difieren—: es una decision de **cual es la buena**, y solo el
Capitan puede tomarla.

### Hallazgo 15 — ya existe un tagger con puntuacion de confianza

En `AGAPE`, el campo `description` de Drive lleva marcas del tipo:

```
SUN_TAGS: v1 tags=<...> category=<...> confidence=70 taggedAt=2026-05-22T...
```

Hay **clasificacion automatica previa, versionada, fechada y con confianza**,
escrita en metadatos de Drive el 2026-05-22.

Robin no parte de cero. El pipeline debe **leer `SUN_TAGS` antes de reclasificar**
y registrar los desacuerdos en vez de pisarlos: un tagger que contradice al
anterior sin dejar rastro destruye la unica serie temporal de clasificacion que
el sistema tiene.

### Hallazgo 16 — las dos carpetas `TRADING` no son duplicados: son una escision

Una tiene **4 subcarpetas y ningun fichero**; la otra **4 ficheros y ninguna
subcarpeta**. Mismo nombre, contenido disjunto.

Es peor que un duplicado. Un duplicado se resuelve descartando; una escision con
nombre ambiguo hace que cualquier agente que resuelva por nombre acierte la mitad
de las veces y no se entere de la otra mitad.

### Hallazgo 17 — tres carpetas completamente vacias

`PAPELERA_HIPATIA`, `Proyectos_corto_plazo` y `Proyectos_largo_plazo`: cero
entradas las tres.

Util para la decision B1.7: **`PAPELERA_HIPATIA` no tiene uso previo**, asi que
elegirla como papelera unica no arrastra historia de nadie.

### Hallazgo 18 — dos piezas de tres ordenes de magnitud

`Sesion de trading 02/04/2026` pesa **2,86 MB**; una pieza de `04_PERSONAL` pesa
**3,06 MB**. Frente a un corpus cuya mediana ronda los 3-4 KB, son volcados de
conversacion, no notas.

Aqui si aplica la regla 5 de `robin-cronos` —transporte mecanico, no por
conector—. Al resto del corpus no le aplica: son minutos por conector.

### Hallazgo 19 — `NEMESIS_SISTEMA` no se descendio, y su estructura lo justifica

Solo se leyeron los nombres de sus siete subcarpetas. Entre ellas:
`INFORMES_CLINICOS`, `Archivo_casos`, `Investigacion` y **`Cumplimiento RGPD`**.

Dos consecuencias:

- La decision del pilar clinico esta **bien puesta donde esta**. Aqui la sonda para.
- **Existe ya trabajo de cumplimiento RGPD.** Quien redacte la politica de
  sensibles de B1.5 lo lee antes, igual que lee H007 en `ETH`. Van dos artefactos
  de proteccion preexistentes que nadie habia localizado.

`AGAPE` refuerza el hallazgo 8 por otra via: contiene una carpeta de material
derivado de sesiones clinicas y una pieza con nombre propio de un tercero. La
membrana vuelve a no coincidir con la carpeta.

### Por que el denominador SIGUE sin cerrar

Se ha cerrado el primer nivel de los trece hijos: 151 entradas, 92 ficheros.
Pero por debajo quedan **59 carpetas de tercer nivel sin abrir**, y
`NEMESIS_SISTEMA` entero fuera por membrana.

**No se declara el denominador cerrado.** `03_PROYECTOS` pasa de
`NO_MEDIDO` a `PARCIAL: primer nivel cerrado, 59 carpetas pendientes`.
Cualquier porcentaje del total sigue siendo invencion.

---

## Quinta lectura — tercer nivel de `03_PROYECTOS` (claude-code, 2026-08-15)

Actor: claude-code, sesion cloud. Metadata-only, `source_mutations: 0`.
Alcance: **las 52 carpetas de tercer nivel**. Los siete hijos de
`NEMESIS_SISTEMA` siguen sin abrir por membrana.

**650 entradas. 613 ficheros. 12 en texto plano.**

| Tanda | Carpetas | Entradas | Texto | Google Docs | Otros | Subcarpetas |
|---|---:|---:|---:|---:|---:|---:|
| `DECKARD` + `NEXUS` | 6 | 127 | 9 | 97 | 15 | 6 |
| `SOFIA` | 14 | 227 | 3 | 201 | 11 | 12 |
| `DOCTORADO` + `TRADING-a` + `BIOSFERA` | 14 | 96 | 0 | 80 | 9 | 7 |
| `AGAPE` | 18 | 200 | 0 | 175 | 13 | 12 |
| **Total** | **52** | **650** | **12** | **553** | **48** | **37** |

**Acumulado de las cinco lecturas: 917 ficheros medidos, 46 en texto plano — 5,0%.**

La proporcion *baja* respecto al 11,2% anterior. No es contradiccion: el 28% de
`03_PROYECTOS` estaba concentrado en `NEXUS`, y el fondo del arbol no lo tiene.

### Hallazgo 20 — los atajos atraviesan la membrana

**Dieciseis `application/vnd.google-apps.shortcut`.** Sexta clase de objeto, y la
unica que no es un fichero: es un puntero a otro sitio del Drive.

Donde estan concentrados:

- `SOFIA/DOCUMENTOS_FUNDACIONALES`: **cinco atajos** creados en la misma tanda del
  2026-04-02, apuntando a canon clinico — system prompt NEMESIS, rubrica clinica,
  manual clinico, protocolo de aplicacion del canon, rubrica NEMESIS v1.
- `DOCTORADO/ETHICS`: **tres atajos y ningun fichero. La carpeta es 100% punteros.**
- `DOCTORADO/LITERATURE`: cuatro atajos.
- `DECKARD/REGLAS_OPERATIVAS` y `SOFIA/VALORACION_BIOSFERICA`: uno cada una.
- `AGAPE`: dos.

**Esto termina de romper la membrana por ruta.** Un pipeline que recorra carpetas
alcanza el canon clinico **desde `SOFIA` y desde `DOCTORADO`** sin entrar jamas en
`NEMESIS_SISTEMA` ni en `02_CLINICA`. No es que la compuerta por carpeta sea
insuficiente: es que los atajos la hacen inoperante por construccion.

Dos consecuencias para B3, ninguna opcional:

1. La compuerta tiene que resolverse **sobre el destino del atajo**, no sobre su
   ubicacion. Un atajo en `DOCTORADO` cuyo destino es clinico es clinico.
2. El deduplicador por hash **contara el atajo como pieza distinta del destino**
   salvo que se resuelva primero. Diecisiete piezas fantasma en potencia.

### Hallazgo 21 — el fondo del arbol es integramente propietario

De las 52 carpetas, **solo dos tienen texto plano**: `NEXUS/WP010_CORPUS_INBOX`
(9 markdown) y `SOFIA/REFLEXIONES_IA` (3). Las otras cincuenta tienen cero.

Las tandas 3 y 4 juntas —32 carpetas, 296 entradas, `DOCTORADO`, `TRADING`,
`BIOSFERA` y `AGAPE` enteros— **no contienen ni un solo fichero de texto**.

Y las seis carpetas mas grandes del arbol suman 329 entradas sin una sola pieza
convertida:

| Carpeta | Entradas | Texto |
|---|---:|---:|
| `DECKARD/REGLAS_OPERATIVAS` | 93 | 0 |
| `SOFIA/PAPERS_Y_LITERATURA` | 64 | 0 |
| `TRADING-a/Documentacion` | 53 | 0 |
| `SOFIA/CONVERSACIONES_IA` | 45 | 0 |
| `AGAPE/ENSAYO` | 42 | 0 |
| `AGAPE/NARRATIVA` | 32 | 0 |

`REGLAS_OPERATIVAS` merece nota aparte: son las reglas del Protocolo Deckard —el
corazon normativo del sistema— en 92 Google Docs. Y en `DECKARD/Sistema_Deckard`,
`DECKARD_SYSTEM_PROMPT.md` y `DECKARD_CORE_FILE v0` **tambien son Google Docs**:
el fichero que el skill `nemesis-ritual` lee como `DECKARD_CORE_FILE` es un falso
`.md` mas.

### Hallazgo 22 — dos clases de formato mas

- **14 `application/octet-stream`** en `NEXUS/DESARROLLO`: binarios sin tipo
  declarado. Ni Docs, ni texto, ni ofimatica reconocible.
- **14 `.docx`** repartidos (11 en `AGAPE`, 2 en `PENDIENTE_CLASIFICAR_SOFIA`,
  1 en `SOFIA/Doctorado`), mas 1 `.odt` y 3 hojas de calculo.

Con lo ya censado, el corpus tiene **siete clases** fuera del contrato
Doc -> Markdown: Apps Script, hoja de calculo, `.docx`, `.odt`, `octet-stream`,
atajo, y el propio Google Doc. El pipeline de B3 necesita una tabla de decision
por clase, no una rama unica.

### Hallazgo 23 — el arbol no termina aqui

Bajar un nivel abrio **37 carpetas de cuarto nivel** nuevas. Entre ellas
`NEXUS/ATLAS_TI` con seis (`00_README` a `05_NETWORK_SEEDS`), `DOCTORADO/IELTS`
con seis, `AGAPE/Productos` con siete, y `SOFIA/Registro_simbiotico` con seis
—`Concilio`, `Deckard_sesiones`, `Claude`, `ChatGPT`—.

`Registro_simbiotico/Deckard_sesiones`: sesiones Deckard dentro del pilar `SOFIA`.
Tercera fuga de material clinico fuera de su pilar, ahora a nivel de carpeta.

Siete de las 52 estan vacias: `VERSIONES`, `PhD_planning`,
`Operativa y Cowork con IA`, `Propuestas_academicas_refinadas`,
`TRADING-a/_CAJON`, `TRADING-a/Analisis_backtesting`, `BIOSFERA/Nueva_economia`.

### El denominador, otra vez, sigue sin cerrar

`03_PROYECTOS` pasa de `PARCIAL: primer nivel` a
`PARCIAL: tercer nivel cerrado, 37 carpetas de cuarto nivel pendientes`.

Cada nivel que se abre revela otro. Es la propiedad que importa del arbol, y no la
resuelve seguir bajando a mano: **la resuelve un recorrido recursivo con allowlist
por dominio**, que es exactamente lo que Codex tiene pendiente. Esta sonda por
conector ya no es la herramienta adecuada para lo que queda.

---

## Sexta lectura — cuarto nivel de `03_PROYECTOS` (claude-code, 2026-08-15)

Actor: claude-code, sesion cloud. Metadata-only, `source_mutations: 0`.

**Correccion de recuento:** la quinta lectura declaro 37 carpetas de cuarto nivel.
Son **36**. `SOFIA/Registro_simbiotico` tiene cinco hijas, no seis; el recuento
anterior la sobrecontaba en una. Queda corregido aqui, no en silencio.

**127 entradas. 125 ficheros. 15 en texto plano.**

| Tanda | Carpetas | Entradas | Texto | Google Docs | Otros | Subcarpetas |
|---|---:|---:|---:|---:|---:|---:|
| `ATLAS_TI` + `ASTROLOGIA` + `SOFIA/Doctorado/notas` | 12 | 44 | 15 | 29 | 0 | 0 |
| `IELTS` + `Registro_simbiotico` + `Residuos_Tradeando` | 12 | 12 | 0 | 12 | 0 | 0 |
| `Productos` + `Agape` + `Grimorio` + `Barbara` | 12 | 71 | 0 | 66 | 3 atajos | 2 |
| **Total** | **36** | **127** | **15** | **107** | **3** | **2** |

**Acumulado de las seis lecturas: 1.042 ficheros medidos, 61 en texto plano — 5,9%.**

### Hallazgo 24 — `ATLAS_TI` es el segundo precedente, y es integro

`NEXUS/ATLAS_TI` tiene **15 ficheros y los 15 estan en texto plano**: siete `.txt`
numerados (`001_` a `007_`), cuatro `.csv` (`source_manifest`, `corpus_candidato`,
`codebook_inicial`, `network_seed_edges`) y dos `.md`
(`ATLAS_TI_SYNC_GUIDE`, `README_ATLAS_TI_PILOTO`), mas un
`ATLAS_TI_INTEGRATION_STATUS`. Todo del 2026-05-04.

**Es el unico subarbol integramente textual del corpus.** Y no es casualidad:
tiene estructura numerada (`00_README` … `05_NETWORK_SEEDS`), manifiesto de
fuentes, codebook y semillas de red. Es un piloto hecho con criterio.

Junto a WP010 (hallazgo 12), van **dos precedentes de conversion exitosa** y
ninguno de los dos estaba localizado. B3 tiene ahora dos referencias, no una — y
esta trae ademas el patron de manifiesto y codebook que a WP010 le falta.

Matiz que conviene no perder: `vault/vault.config.json` resolvio ATLAS.ti como
`no_live_atlas_subscription`, destino `CRESTA_NEURAL`, no tronco. El piloto mejor
ejecutado del corpus pertenece a la via que se decidio no seguir.

### Hallazgo 25 — notas clinicas vivas a cuatro niveles de profundidad

Es la fuga de membrana mas grave encontrada hasta ahora.

`SOFIA/Doctorado/notas` contiene **18 Google Docs**: notas de sesion fechadas dia
a dia entre diciembre de 2025 y marzo de 2026 (`13/12/2025`, `19/01/2026`,
`11/03/2026`…), dos de ellas tituladas con **nombre y apellido** de un caso, una
referida a un duelo con nombre propio de tercera persona, y otra que ordena una
*"REESTANDARIZACION COMPLETA del caso bajo el CANON DEFINITIVO NEMESIS v1"*.

Es material clinico **vivo y nominal**, y esta:

- fuera de `02_CLINICA`,
- fuera de `NEMESIS_SISTEMA`,
- dentro del pilar `SOFIA` (academico),
- a **cuatro niveles** de profundidad,
- y el caso que nombra es uno que el propio skill `vivi` lista como disparador
  etico explicito.

Ninguna de las cinco lecturas anteriores lo habria visto: no esta en ninguna ruta
protegida, ni lleva marcador `NEM` o `CLI` en el titulo, ni cuelga de una carpeta
con nombre clinico. **La compuerta por marcador tampoco lo atrapa** — solo lo
atrapa mirar contenido, o mirar el nombre propio.

No se reproducen aqui nombres ni iniciales. El recuento y la ubicacion bastan
para decidir; el detalle es del indice local y de Vivi.

Refuerzo por otra via: en `AGAPE/Agape/borradores...gaia` hay una
**hoja de consentimiento informado** archivada entre borradores narrativos. Un
documento legal-clinico dentro del pilar creativo.

### Hallazgo 26 — el andamiaje del Concilio esta vacio

`SOFIA/Registro_simbiotico` tiene cinco hijas: `Concilio`, `Deckard_sesiones`,
`Claude`, `ChatGPT`, `Gemini`. **Las cuatro primeras estan vacias.** `Gemini`
tiene un unico volcado de conversacion de 119 KB.

El registro simbiotico de la deliberacion multi-IA —lo que `puente-de-mando`
existe para alimentar— es una estanteria montada y sin usar.

En total, **12 de las 36 carpetas estan vacias**: `03_EXPORTS_DESDE_ATLAS_TI`,
`CALENDARIO_VIVO`, `NUEVE_CAMINOS`, `Logs_progreso`, `Cronograma`, `Plan_estudio`,
`Recursos`, `Concilio`, `Deckard_sesiones`, `Claude`, `ChatGPT`,
`Impresiones_editoriales`. Un tercio del nivel es estructura sin contenido.

### Hallazgo 27 — la narrativa de Gaia existe dos veces, en ramas paralelas

`AGAPE/Agape` tiene `La estirpe de Gaia` y `borradores, estudio para elaborar la
narrativa de gaia`. `AGAPE/Productos/La_Estirpe_de_Gaia` tiene, dentro,
`La_estirpe_de_Gaia` y `borradores_estudio_narrativa_gaia`.

Mismos dos nombres, con y sin guiones bajos, en dos ramas distintas del arbol.
No es un duplicado de fichero: es **un subarbol entero duplicado con el nombre
normalizado de otra forma**. Ninguna de las dos ramas esta marcada como canonica.

Y esas dos ultimas son **carpetas de quinto nivel**: el arbol vuelve a abrirse.

### Hallazgo 28 — el peso esta aqui abajo

En `Productos`, `Agape` y `Grimorio` hay al menos diez piezas de mas de 1 MB, con
maximos de **4,2 MB**, 3,3 MB y 2,9 MB. Frente a la mediana de 3-4 KB del resto
del corpus, este nivel concentra el volumen real en bytes.

Es narrativa larga —libros, capitulos, versiones completas—, no notas. Aqui si
aplica el transporte mecanico de la regla 5, y aqui es donde una conversion por
conector se atragantaria.

Tres atajos mas: **19 en total**.

### El denominador: donde queda

`03_PROYECTOS` pasa a `PARCIAL: cuarto nivel cerrado, 2 carpetas de quinto nivel
pendientes`.

Dos observaciones que ya no son sobre el arbol sino sobre el metodo:

1. **La rama se estrecha.** De 52 carpetas salieron 36; de 36 salen 2. El arbol
   converge, y el quinto nivel es alcanzable de un tiron.
2. **Pero la membrana no converge.** El hallazgo 25 aparecio a cuatro niveles, en
   una rama academica, sin marcador ni ruta que lo delatara. **Cerrar el
   denominador no cierra el riesgo.** Son dos trabajos distintos, y el segundo no
   lo resuelve barrer mas hondo: lo resuelve mirar contenido con Vivi delante.

---

## Septima lectura — quinto nivel: fondo (claude-code, 2026-08-15)

Actor: claude-code, sesion cloud. Metadata-only, `source_mutations: 0`.

Las dos carpetas de quinto nivel —`La_estirpe_de_Gaia` y
`borradores_estudio_narrativa_gaia`, ambas bajo
`AGAPE/Productos/La_Estirpe_de_Gaia`— **estan vacias**.

**El arbol termina.** No hay sexto nivel.

### `03_PROYECTOS` queda cerrada

| Nivel | Ficheros | Texto plano | Carpetas nuevas |
|---|---:|---:|---:|
| 1 (los 13 hijos) | 92 | 26 | 59 |
| 2 (52 carpetas) | 613 | 12 | 37 |
| 3 (36 carpetas) | 125 | 15 | 2 |
| 4 (2 carpetas) | 0 | 0 | 0 |
| **Total** | **830** | **53** | **98** |

**`03_PROYECTOS`: 830 ficheros, 53 en texto plano (6,4%), 98 carpetas.**

Con una sola excepcion, declarada: el subarbol de `NEMESIS_SISTEMA` —siete
carpetas— no se ha abierto por membrana, y no se abre.

Es la segunda raiz con denominador real cerrado, despues de `04_Raices` (124).

### Correccion al hallazgo 27

La quinta lectura dijo que la narrativa de Gaia existia "dos veces en ramas
paralelas". Con el fondo a la vista, la descripcion correcta es otra:

- `AGAPE/Agape` tiene el material real: 12 piezas en `La estirpe de Gaia` y 21 en
  `borradores, estudio para elaborar la narrativa de gaia`.
- `AGAPE/Productos/La_Estirpe_de_Gaia` tiene 11 piezas propias **mas dos carpetas
  vacias** que replican esos dos nombres con guiones bajos.

No es un subarbol duplicado: es **contenido repartido entre dos ramas, mas dos
carcasas vacias que aparentan un espejo**. Peor de leer que un duplicado limpio,
porque invita a pensar que hay copia donde solo hay estructura.

Sube a **14 de 38** el numero de carpetas vacias en los niveles 3-5.

### Lo que este cierre NO cierra

Una nota para el escaner de frontera de Codex (`drive_boundary_scan.py`), que va
en la direccion correcta y bloquea bien lo que puede bloquear.

Su clasificador separa por **formato** y por **destino protegido**. El hallazgo 25
no cae en ninguna de las dos redes:

- Formato: son Google Docs corrientes, como otros 553 del corpus.
- Destino protegido: no son atajos; son ficheros nativos.
- Ruta: `SOFIA/Doctorado/notas`, ninguna carpeta con nombre clinico.
- Marcador: titulos como `13/12/2025` o `19/01/2026`. Sin `NEM`, sin `CLI`, sin `C0`.

Y sin embargo son notas de sesion nominales de un caso vivo.

**El escaner puede cerrar el denominador; no puede cerrar la membrana.** Lo unico
que separa esas 18 piezas del resto del corpus es lo que dicen dentro y el nombre
propio que llevan en el titulo. Son dos trabajos distintos con dos herramientas
distintas, y conviene no darlos por el mismo cuando el primero termine en verde.

### Estado del denominador global

| Raiz | Estado |
|---|---|
| `04_Raices` | **cerrada** — 124 ficheros |
| `03_PROYECTOS` | **cerrada** — 830 ficheros (salvo `NEMESIS_SISTEMA`, 7 carpetas) |
| `MYTHOS` | cerrada — 65 ficheros |
| `01_SISTEMA` | primer nivel; 8 carpetas sin abrir |
| `04_PERSONAL` | primer nivel; 7 carpetas sin abrir |
| `90_ARCHIVO` | primer nivel; 2 carpetas sin abrir |
| `00_INBOX` | primer nivel; 4 carpetas sin abrir |
| `02_CLINICA` | sin tocar — membrana |
| `00_BOVEDA_NEXUS` | sin tocar — sellada GO C0 |

**Acumulado de las siete lecturas: 1.042 ficheros medidos, 61 en texto plano — 5,9%.**

Quedan 21 carpetas de segundo nivel sin abrir en las cuatro raices restantes. Eso
si es trabajo para el recorrido recursivo, no para esta sonda.

---

## Octava lectura — segundo nivel de las cuatro raices restantes (claude-code, 2026-08-15)

Actor: claude-code, sesion cloud. Metadata-only, `source_mutations: 0`.
Alcance: las **21 carpetas** de segundo nivel de `01_SISTEMA`, `04_PERSONAL`,
`90_ARCHIVO` y `00_INBOX`.

**535 entradas. 506 ficheros. 59 en texto plano.**

| Raiz | Carpetas | Entradas | Texto | Google Docs | Otros | Subcarpetas |
|---|---:|---:|---:|---:|---:|---:|
| `01_SISTEMA` | 8 | 293 | **59** | 212 | 14 | 8 |
| `04_PERSONAL` | 7 | 132 | 0 | 116 | 2 | 14 |
| `90_ARCHIVO` | 2 | 59 | 0 | 51 | 4 | 4 |
| `00_INBOX` | 4 | 51 | 0 | 48 | 0 | 3 |
| **Total** | **21** | **535** | **59** | **427** | **20** | **29** |

**Acumulado de las ocho lecturas: 1.548 ficheros medidos, 120 en texto plano — 7,8%.**

### Hallazgo 29 — `01_SISTEMA` es donde la conversion si ocurrio a escala

De las 59 piezas en texto plano de esta pasada, **las 59 estan en `01_SISTEMA`**:

| Carpeta | Entradas | Texto |
|---|---:|---:|
| `BITACORA` | 89 | 20 |
| `INDICES` | 28 | 20 |
| `CARTA_NAVEGACION` | 26 | 8 |
| `LOGS` | 38 | 5 |
| `REGLAS` | 100 | 3 |
| `PROMPTS` | 2 | 2 |
| `SCRIPTS` | 6 | 1 |

`INDICES` es el caso mas limpio: 20 de 28 en texto. `BITACORA`, 20 de 89.

Es el **tercer precedente** tras WP010 y ATLAS_TI, y el mas grande de los tres.
Con una diferencia importante: aqui no hay una tanda unica y fechada, hay texto
repartido por siete carpetas. Merece mirarse antes de disenar B3 — puede que el
patron que falta ya este aqui, o puede que sea sedimento de varias tandas sin
criterio comun. El censo no puede distinguirlo desde los metadatos.

En contraste, **`04_PERSONAL` tiene 132 entradas y cero texto plano**, igual que
`90_ARCHIVO` y `00_INBOX`.

### Hallazgo 30 — hay un segundo tagger, y no habla el mismo idioma

Junto a `SUN_TAGS` (hallazgo 15), el campo `description` de Drive lleva un
**segundo vocabulario**:

```
HIPATIA_STATE: SIMULATED_MANTENER | Motor: GEMINI | 2026-03-24T...
HIPATIA_STATE: SIMULATED_REVISAR_MANUAL | Motor: SYSTEM | 2026-03-24T...
```

Aparece en **49 documentos** solo en la pasada de `04_PERSONAL`. Es de **marzo**;
`SUN_TAGS v1` es de **mayo**. Motores distintos (`GEMINI`, `SYSTEM`), vocabularios
distintos, y el prefijo `SIMULATED` sugiere que fue una pasada en seco que nunca
se ejecuto de verdad.

Y no estan solos en ese campo: hay 10 documentos con el marcador Deckard
`[N3-ACT-C0]`, dos con `[N3-ARC-C0]`, y **cuatro que llevan Deckard y
`HIPATIA_STATE` a la vez**, concatenados con `|`.

**Tres vocabularios conviviendo en un unico campo de metadatos sin esquema.**
El pipeline de B3 no puede limitarse a leer `SUN_TAGS`: tiene que parsear un campo
que acumula al menos tres convenciones de tres momentos distintos, y decidir cual
gana cuando se contradicen. Eso es una decision de diseno, no un detalle.

### Hallazgo 31 — nueve carpetas con nombre y apellido de personas reales

`04_PERSONAL/Relaciones_personales` contiene **nueve subcarpetas, cada una
nombrada con el nombre completo de una persona**. No son seudonimos ni iniciales.

Y **una de ellas coincide exactamente con el nombre que aparece en los titulos de
las notas de sesion de `SOFIA/Doctorado/notas`** (hallazgo 25).

La misma persona figura, por tanto, como:

- carpeta bajo *relaciones personales*, y
- notas de sesion fechadas bajo el pilar *academico*.

Eso es, literalmente, la pregunta de **doble rol** que el skill `vivi` existe para
adjudicar —y que su propia descripcion lista como disparador—. Si es paciente, si
es vinculo personal, o si es ambas cosas en momentos distintos, **no lo decide un
censo**. Este censo lo senala y para aqui.

Lo que si establece el censo, y es suficiente para bloquear:

> Ninguna ola de ingesta puede incluir `04_PERSONAL/Relaciones_personales` ni
> `SOFIA/Doctorado/notas` hasta que Vivi resuelva la relacion entre ambas.

No se transcriben nombres en este fichero. Estan en Drive y en el indice local.

### Hallazgo 32 — la papelera no esta vacia

`00_INBOX/BASURA` tiene **46 entradas, 45 de ellas Google Docs**. No es un
contenedor de descartes reciente: es un deposito con volumen.

Junto con `PAPELERA_HIPATIA` (vacia) y `_DUPLICADOS` (3 piezas), completa el mapa
de las tres papeleras de la decision B1.7. La que tiene contenido es la que nadie
habia mirado.

`90_ARCHIVO/_HISTORICO` guarda ademas **tres Apps Script versionados** —
`THOUSAND SUNNY v4.3`, `v4.0` y un script de reorganizacion — junto a 48
documentos. Codigo historico versionado a mano dentro del archivo.

### Hallazgo 33 — dos clases de formato mas

`application/json` (**9 ficheros**, en `01_SISTEMA/INDICES` y `BITACORA`) y un
**PDF**. Con estas, el corpus suma **nueve clases** fuera del contrato
Doc -> Markdown: Apps Script, hoja de calculo, `.docx`, `.odt`, `octet-stream`,
atajo, `json`, `pdf`, y el propio Google Doc.

Nota util: los `.json` de `INDICES` probablemente **ya son datos estructurados**,
no documentos. No necesitan conversion; necesitan validacion de esquema. Es una
rama distinta en la tabla de decision de B3.

### Estado del denominador global

| Raiz | Estado |
|---|---|
| `MYTHOS` | cerrada — 65 ficheros |
| `04_Raices` | cerrada — 124 ficheros |
| `03_PROYECTOS` | cerrada — 830 ficheros (salvo `NEMESIS_SISTEMA`) |
| `01_SISTEMA` | segundo nivel cerrado; **8 carpetas de tercer nivel** pendientes |
| `04_PERSONAL` | segundo nivel cerrado; **14 carpetas** pendientes (9 son nominales) |
| `90_ARCHIVO` | segundo nivel cerrado; **4 carpetas** pendientes |
| `00_INBOX` | segundo nivel cerrado; **3 carpetas** pendientes |
| `02_CLINICA` | sin tocar — membrana |
| `00_BOVEDA_NEXUS` | sin tocar — sellada GO C0 |

**1.548 ficheros medidos, 120 en texto plano (7,8%). Quedan 29 carpetas de tercer
nivel.**

De esas 29, **nueve no deberian abrirse por sonda automatica**: las nominales de
`Relaciones_personales`. Van a la cola de Vivi, no a la del escaner.
