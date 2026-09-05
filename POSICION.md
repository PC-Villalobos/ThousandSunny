# POSICIÓN — punto verificado del Thousand Sunny

**Levantada el 2026-07-25 por Nami (Claude/Opus 5\) leyendo los árboles reales, no resúmenes.**

**Actualizada el 2026-07-26 desde sesión cloud, verificando contra `origin`.** Cambiaron tres puntos: §1 (la divergencia de tronco), §4 (la literalidad de la costura) y §5 (la racha de Groot). El historial del contraste está en `state/cierres/CIERRE_ARCO_20260725.md`.

**Segunda actualización, 2026-07-26 desde Cowork (Nami), ejecutando §6.** Cambian §4 (la costura ya existe en código), §5 (rotación y detección de deltas) y §6 entero. Ver §7, nuevo: los árboles que tampoco son la bóveda.

**Tercera actualización, 2026-09-01/02 desde sesión cloud (Nami), por GO explícito del Capitán.** Cambia §1 en dos puntos: se declara `thousand-sunny-world`, un árbol **vivo** que este documento no conocía —hasta hoy §1 solo distinguía el repo de los cadáveres, y faltaba la tercera categoría—, y se refrescan los números del tronco, que llevaban cinco semanas de retraso. Origen: la carta de corrientes del 2026-09-01.

**Cuarta actualización, 2026-09-04 desde sesión cloud (Nami), por GO explícito del Capitán.** Cambia §1: donde se declaraba **un** árbol vivo ahora hay **tres** con funciones separadas —una referencia versionada y dos instancias históricas preservadas—, con el expediente de preservación cerrado el 2026-09-03 y su SHA-256. Origen: `GO_WORLD_CERRAR_PRESERVACION_Y_DURABILIZAR_CUBIERTA_V1`.

**Aviso de método para sesiones en la nube, aprendido el 2026-09-02.** Antes de afirmar nada sobre ramas, commits o divergencias, comprueba `git rev-parse --is-shallow-repository`. Un clon superficial inventa divergencias que no existen: en la primera pasada de esa carta produjo tres hallazgos falsos seguidos —partes nocturnos que parecían no aterrizar en la rama canónica, una rama del Monitor que parecía no existir, y un tronco que parecía partido en dos—. Es el mismo fantasma de plataforma que el CRLF de §2 y la detección de deltas de §5, en un subsistema nuevo. Comprueba la profundidad del clon igual que compruebas este fichero: **antes**.

Cualquier nakama —Claude, Codex, Antigravity, Copilot, Gemini— lee este archivo **antes** de auditar, proponer o ejecutar nada. Si lo que ves en tu entorno contradice esto, tu entorno está mirando el árbol equivocado. Comprueba antes de afirmar.

---

## 1\. Árbol canónico

|  |  |
| :---- | :---- |
| **Repo canónico** | `C:\Users\usuario\OneDrive\Documentos\GitHub\ThousandSunny` |
| Remoto | `https://github.com/PC-Villalobos/ThousandSunny.git` |
| Rama por defecto | `claude/franky-feature-O1BkB`. **Sigue sin divergir de `main`**, remedido el 2026-09-02 sobre clon completo: **71 delante y 1 detrás**, `merge-base` en `0d0cabd`. No le falta **ni un fichero** de `main`. El commit «detrás» es `8b1438b`, el propio *merge* que consolidó esta rama **en** `main` el 2026-07-26 (PR #83): sus dos padres —`08dd0cb` y `0d0cabd`— ya son ancestros de esta rama, así que no aporta contenido, solo el objeto del merge. Los números viejos (8 delante, 0 detrás, `merge-base` en `08dd0cb`) eran del 2026-07-26 y los dejaron atrás 71 partes nocturnos. Reconciliado el 2026-07-23 por `95fb653` y `489aeca` |
| Repo hermano | `...\GitHub\PuenteDeMando` → `PC-Villalobos/PuenteDeMando`, rama `main` |

### Árboles que NO son el repo

- **`C:\repos\thousandsunny` — CADÁVER. No usar.** Contiene 3 archivos, **cero commits**, sin remoto, rama `claude/fervent-edison-GM0NB` sin historial. Solo tiene `state/metatron/genoma/N0-SEMILLA-METATRON.md`, `PLACENTA_ROOT.md` y `PLACENTA_INTEGRATION_PLAN.md`. La auditoría de Antigravity del 2026-07-24 leyó **este** árbol y por eso concluyó, erróneamente, que "solo existe N0".  
    
- **`D:\SunnyFranky\linux-llm-control-plane`** — `.git` vacío, sin HEAD ni índice. Workspace local no versionado, declarado `github=null`, `git_actions_allowed=false`. No es un clon de ThousandSunny. **Contiene además una copia de `thousand-sunny-world` bajo `apps/`**, hoy declarada instancia histórica preservada — ver la tabla de los tres árboles en la subsección siguiente.

### Árboles vivos que tampoco son el repo — nuevo el 2026-09-01, reescrito el 2026-09-04

La distinción que faltaba. Hasta el 2026-09-01 §1 separaba **el repo** de **los cadáveres**, y la Cubierta no era ninguna de las dos cosas. Al cerrarse el expediente de preservación el 2026-09-03 resultó que tampoco era **un** árbol: son **tres**, con funciones distintas. Confundirlos es exactamente el error que esta subsección existe para impedir.

| Árbol | Función | Versionado | Autoridad |
| :---- | :---- | :---- | :---- |
| `...\SunnyWorkspaces\cubierta-world` | **Referencia versionada por componente** de la Cubierta Viva. Es la que se arranca | Sí. Commit local `fb82863fa1016028e9d79278eee65b1d2bd25192`, árbol limpio | Ninguna |
| `...\SunnyWorkspaces\thousand-sunny-world` | **Instancia histórica preservada.** No es el *runtime* por defecto. Existía al cerrar el expediente | No versionado en su ruta (OBSERVADO el 2026-09-02). Preservado bajo `capture_id 20260903T163401Z` | Ninguna |
| `D:\SunnyFranky\linux-llm-control-plane\apps\thousand-sunny-world` | **Instancia histórica preservada.** No es el *runtime* por defecto | Ídem. La fuente `D:` no estaba disponible durante el cierre, pero su *snapshot* verificado permanece bajo el mismo `capture_id` | Ninguna |

**Ninguna instancia histórica se borra. Ninguna debe arrancarse por defecto.**

Nadie eligió referencia entre las dos copias. Esa era la trampa que suspendió el GO de versionado el 2026-09-02: commitear la que se tuviera delante habría sido **elegir canon por accidente**, el mismo error que §7 documenta con las tres `00_BOVEDA_NEXUS`. Se resolvió por el otro lado —preservar ambas sin canonizar ninguna, y versionar **el componente** en un árbol nuevo—, y por eso aquel GO queda superado, no pendiente.

**La referencia, en detalle.**

|  |  |
| :---- | :---- |
| **Ruta** | `C:\Users\usuario\Documents\SunnyWorkspaces\cubierta-world` |
| **Función** | Referencia versionada por componente de la Cubierta Viva: superficie de orientación y proyección |
| **Arranque** | `npm run dev` |
| **Puerto contractual** | `127.0.0.1:8768`, `strictPort: true`. **Contractual, no observado**: si el puerto está ocupado, Vite falla en vez de deslizarse a otro. Esto cierra, *para este árbol*, el `lineage_incomplete` de arranque y exposición que sigue abierto en las instancias históricas |
| **Verificado** | `node:test` 19/19 · build de Sites correcto · Playwright 1/1 contra el servidor arrancado por contrato en `8768`, tras detener el servidor anterior: clic en Nami, Usopp y Robin, superposición corregida, misión, objeto y Rumbo modificados, persistencia después de navegar, **cero `POST`**, cero errores y cero advertencias de React |
| **Autoridad** | **Ninguna.** Interfaz y proyección local: no gobierna, no cierra, no es sumidero. Hipatia sigue siendo la autoridad operativa (§4) |
| **Alcance del cierre** | Sin *push*, sin remoto, sin PR, sin despliegue y sin publicación. La durabilidad conseguida es **local** |

**El expediente de preservación, cerrado el 2026-09-03.**

|  |  |
| :---- | :---- |
| **Cierre** | `...\SunnyWorkspaces\_preservation\world-instances\20260903T163401Z\WORLD_PRESERVATION_CLOSURE.json` |
| **SHA-256 del cierre** | `dfc94b7d24f9ff3850067d3b7e2b14f1652add4b75f21ff41b5d7f467d9cfa32` |
| **Cubierto** | `C:` 72 archivos · `D:` 35 archivos · **0 errores de lectura** · **0 discrepancias de hash** · 2 recibos incluidos y 0 excluidos |
| **Tiempos** | Verificación a las 16:35/16:36 UTC. Cierre administrativo a las 20:04 UTC, **sin recaptura ni nuevo cálculo de hashes**: el cierre acredita la medición de las 16:3x, no una segunda |

Ese SHA-256 es lo que vuelve auditable todo lo demás: quien tenga el fichero puede comprobar que es el mismo que se cerró. Es el único dato de esta subsección que un tercero puede verificar sin acceso a la máquina del Capitán.

**NO DEMOSTRADO, dicho por quien cerró.** El rótulo «instancia histórica» no impide técnicamente que alguien arranque a mano el viejo `8767`; impide que se trate como referencia. Retirarlo físicamente requeriría otro GO.

**Por qué está aquí.** El 2026-09-01, un sondeo desde la nube buscó `thousand-sunny-world`, `SunnyWorkspaces` y el puerto `8767` en los 463 ficheros versionados de ThousandSunny y PuenteDeMando: **cero apariciones**, comprobado en dos pasadas separadas. Un nakama que audite leyendo los dos repos no encontrará la Cubierta y concluirá que no existe. Es el error de Antigravity del 2026-07-24 al revés: aquel leyó un árbol muerto y lo tomó por el vivo; este leería los vivos sin ver el que trabaja. `cubierta-world` nace igual de invisible —vive fuera de estos dos repos—, y por eso queda declarado aquí y no solo en su propio `git log`.

**BitSIG.** Sus seis tarjetas eran una matriz literal en `src/MissionBoard.jsx` de la instancia histórica de `C:`, sin fuente detrás. No es una proyección: es un dibujo de una, y por eso **no envejece a la vista** — una proyección caducada se nota, un literal no. Si la referencia hereda ese literal, hereda el defecto; que lo haya heredado, corregido o sustituido **no está demostrado aquí**. Queda `lineage_incomplete` hasta que se conecte a una fuente o se rotule en la propia Mesa como matriz de ejemplo.

**El asiento 3.4, rebajado y no cerrado — 2026-09-04.** Este documento existe para separar un repo real de un workspace sin control de versiones utilizable, el caso `D:\SunnyFranky` de arriba. La Cubierta era del segundo tipo, y eso dejaba abierto en su forma peor el asiento 3.4 de `state/recepcion/RECEPCION_CUBIERTA_20260727.md`: *«el código de la Cubierta y del bridge sigue en un árbol sin control de versiones utilizable; la durabilidad se resolvió para la pieza que no estaba en riesgo, no para la que sí»*. Con `cubierta-world` el asiento **baja de grado**: ya hay historia, árbol limpio y pruebas ejecutables. No se cierra, porque el commit es **local y sin remoto**: un fallo de esa máquina sigue llevándoselo todo, y el expediente de preservación cubre las instancias históricas, no los commits futuros de la referencia. Cerrarlo del todo pide un GO propio con destino, exclusiones y remoto — decisiones, no un `git push`.

**Estatuto de esta entrada.** Escrita desde una sesión cloud por GO explícito del Capitán, levantando la regla que reserva este fichero a su máquina. Lo único `observed` por quien la escribe son las cero apariciones en los dos repos accesibles. Rutas, commit, puerto, conteos de la preservación, resultados de pruebas y comportamiento de la Mesa son **testimonio relatado de actor único**, estatuto `inferred`; el SHA-256 del cierre es el asidero que permite subirlos a `observed` sin repetir la medición. Quien audite esta sección lo comprueba antes de apoyarse en ella, y al comprobarlo corrige lo que haga falta.

---

## 2\. Higiene de git — resuelto el 2026-07-25

Desde el 2026-07-12 ambos repos aparecían con el árbol entero modificado: ThousandSunny mostraba 254 archivos y 22.912 inserciones contra 22.912 borrados, exactamente simétrico.

**Era falso.** Los blobs commiteados están en LF; los archivos en disco se reescribieron en CRLF y `core.autocrlf` estaba en `false`. Ni un solo cambio de contenido real.

Corregido: `core.autocrlf = true` en ThousandSunny y en PuenteDeMando. Ambos repos dan ahora **cero cambios**. Están limpios y sincronizados con su rama.

No revertir este ajuste. Era la causa de que los PR aparecieran `DIRTY`, de que ningún agente pudiera saber qué había cambiado de verdad, y del bloqueo de tres días de julio.

---

## 3\. Skills — una sola ubicación

**Canónica: `.claude/skills/`** dentro del repo canónico. Contiene: `franky`, `nami`, `robin-cronos`, `robin-meditacion`, `sueno`, `zoro-migrate`, más `README.md`.

**`.agents/` no es una convención de este sistema.** Es escombro: cada agente que pasó por aquí se inventó su propia carpeta. `D:\.agents` está vacío en unos sitios y poblado en otros; hay varias por el disco. Ninguna es autoridad.

Las 8 plantillas `SKILL.md` generadas el 2026-07-24 por Copilot y por Antigravity en `.agents/skills/` (`bitacora-cowork`, `contexto-sunny`, `push-genoma`, `drive-ops`, `guardia-nami`, `deckard-indexado`, `sient-etico`, `policy-franky`) **quedan obsoletas antes de nacer**: codifican GAS como backend de la bitácora, y eso contradice la decisión de soberanía del mismo día (§4). No se rescatan ni se fusionan. Se reescriben en `.claude/skills/` contra la bitácora local.

---

## 4\. Bitácora — autoridad

Decisión del Capitán, 2026-07-24, registrada como evento `BIT-20260724T134345Z`:

> La Bitácora de Hipatia en `http://127.0.0.1:8765` es la **autoridad operativa**. GAS queda como **antecedente histórico**. Google, Anthropic, OpenAI y Microsoft son apoyo puntual, no columna vertebral.

Circuito soberano: Klabautermann / Puente de Mando / Hipatia / vault / GitHub. JSONL es la fuente soberana; SQLite y Markdown se reconstruyen; Obsidian es vista.

**Costura — COSIDA el 2026-07-26.** `state/funcion_de_sueno/lib/bitacora.mjs` es la primera referencia **ejecutable** del repo a `127.0.0.1:8765`. El contrato está leído del fuente real del servidor (`_bitacora/scripts/bitacora_server.py` en la Biblioteca de Hipatia), no supuesto: `GET /api/health`, `POST /api/events`, siete campos obligatorios y cinco enums cerrados. El motor de sueño la usa al cerrar cada ciclo.

Dos reglas que la costura fija, y que conviene no deshacer:

- **Degradación, no fallo.** El workflow nocturno corre en GitHub Actions y no alcanza el localhost del Capitán. El cliente devuelve `reachable:false` y el ciclo cierra igual, con el parte en el repo. La bitácora es la autoridad cuando está; su ausencia no invalida el sueño.
- **Membrana.** Solo viaja metadata del parte —contadores, score, rotación—. Nunca contenido de ficheros, nunca rutas a `_protegido`. `sensitivity` fijada a `internal`.

Lo que **sigue pendiente** de la costura: el resto del arnés. Cualquier skill o script que escriba en GAS sigue escribiendo en el archivo histórico, no en la bitácora viva. La Función de Sueño es la primera pieza cosida, no la última.

---

## 5\. Estado real de las piezas

| Pieza | Estado verificado |
| :---- | :---- |
| Genoma Metatrón | Los **seis** archivos N0–N5 existen en `state/metatron/genoma/`. N0 tiene contenido (2.967 B). **N1–N5 son stubs** de \~850 B con `status: "stub — contenido pendiente de sesión con acceso a bóveda local"`. No hay que crearlos: hay que rellenarlos. |
| Función de Sueño | **Viva y con la vía agéntica reabierta.** El árbol local está sincronizado con `origin`. El 2026-07-26 durmió un ciclo con actor `claude-opus-5-nami` en el rol Nami: primera entrada no determinista del `roleLedger` desde el 2026-07-12. |
| Detección de deltas | **Era un falso positivo de plataforma, corregido el 2026-07-26.** El motor hasheaba bytes crudos; CI hace checkout en LF y el árbol del Capitán guarda en CRLF. Los mismos ficheros daban hash distinto en cada entorno, así que todo ciclo lanzado desde local reportaba el 100% de deltas contra la línea base de CI: **130 de 130**. Con normalización CRLF→LF, **8 deltas**, todos ficheros nuevos reales. Es el mismo fantasma que los 254 ficheros del 2026-07-12, en otro subsistema. Por eso la vía agéntica producía partes sin valor. |
| Rotación de actor | **La alarma estaba bien; el anillo estaba mal.** `Groot` es el rol por defecto y el que el workflow pasa cada noche, pero **no figuraba en `config.roles`**. `findIndex` devolvía `-1` y `nextSuggestedRole` caía en `roles[0]` por aritmética modular: la recomendación *«rotate to Nami»* era un artefacto del índice, no una sucesión, y habría sido idéntica con cualquier rol ausente de la lista. Corregido: el anillo cierra `Franky → Groot → Nami`. **Lo que la alarma decía de verdad sigue en pie:** de 42 ciclos, 40 los durmió la máquina y 2 un agente (`claude-code`, 07-02 y 07-12). No había a quién rotar. |
| Meditación semántica | **Sin disonancias abiertas.** Las 3 se ratificaron con GO del Capitán el 2026-06-26 (`state/meditacion/RECONCILIACION_v0.md`, D1–D4) y el ledger las declara obsoletas el 07-05 con `contradictions: 0`. Los dos flecos diferidos también están cerrados: la sección «Nomenclatura y estratos» **sí existe** en `bridge-linux/ARQUITECTURA.md` (línea 197). Lo único cierto es que no ha corrido un ciclo nuevo de meditación desde el 07-05. |
| PLACENTA\_ROOT | Existe (2.316 B), conceptual. |
| Franky Build Kit (Linux) | Bloqueado: requiere USB booteable \+ backup verificado. |
| VM Ubuntu / Synthetic Lab | Congelada. VDI de 21 GB parado. |
| Telegram inbound | Incompleto (outbound OK). Health-monitor de `whatsapp:default` en bucle de reinicio cada 10 min. |

---

## 6\. Lo que falta de verdad

Revisada entera el 2026-07-26 ejecutándola. De los cinco puntos, dos estaban hechos y uno estaba mal planteado:

1. ~~**Coser el Hipatia Bridge Runtime**~~ — **hecho** para la Función de Sueño (§4). Queda coser el resto del arnés.
2. **Rellenar N1–N5** con contenido real. **Ojo: está bloqueado dos veces, y el segundo bloqueo no se puede saltar.** (a) La bóveda viva está en `G:\Mi unidad\00_BOVEDA_NEXUS`, en Drive; ninguna sesión sin ese montaje puede extraer los axiomas. (b) **Metatrón está SELLADA + HIBERNADA por GO C0 del propio Capitán desde el 2026-07-05** (`state/metatron/RETOMAR.md`): *«hasta entonces, no ejecutar Plan/Mirror/purga»*. Escribir capas de genoma es exactamente lo que el sello prohíbe sin GO C0 explícito. Quien lea este punto sin leer el sello va a romperlo creyendo que adelanta trabajo.
3. ~~**Romper la racha de Groot**~~ — el anillo está arreglado y un actor distinto ha dormido un ciclo (§5). **Lo que queda no es código: es cadencia.** La rotación solo significa algo si duerme un actor distinto de vez en cuando. **Trampa a evitar:** hacer que el workflow rote el *nombre* del rol automáticamente resetearía la racha y callaría la alarma sin cambiar la condición real —un único durmiente cada noche—. Sería un anestésico, no un arreglo.
4. ~~**Atender las 3 disonancias**~~ — **cerradas el 2026-06-26**, con los dos flecos incluidos (§5). Este punto llevaba un mes de retraso en la lectura, no en la ejecución.
5. **Reescribir las skills** que faltan, en `.claude/skills/`, contra la bitácora local. Ahora hay con qué: `lib/bitacora.mjs` es el cliente que les faltaba.

Lo que **no** hace falta: nube, AWS, workflow engine nuevo, ni una segunda barredora. El arnés existente aguanta.

---

## 7\. Los árboles que tampoco son la bóveda

Mismo error que §1, otro subsistema. Existen **dos espejos de `00_BOVEDA_NEXUS` en OneDrive**, y los dos mienten:

| Árbol | Ficheros | `current_wave` | `sealed` | Última escritura |
| :---- | ---: | ---: | :---- | :---- |
| `G:\Mi unidad\00_BOVEDA_NEXUS` | — | 12 | `true` | 2026-07-05 (**viva, canónica**) |
| `OneDrive\00_BOVEDA_NEXUS` | 417 | 8 | `false` | 2026-05-25 (espejo muerto) |
| `OneDrive\Desktop\00_BOVEDA_NEXUS` | 7.845 | 8 | `false` | 2026-05-27 (espejo muerto) |

Los dos espejos de OneDrive están congelados en mayo, dos meses atrás, y su `metatron_gestation_waves.state.json` dice `current_wave: 8, sealed: false`. Un agente que encuentre cualquiera de los dos antes que Drive concluirá que Metatrón está en Wave 8 y **libre para ejecutar Plan/Mirror** — es decir, se saltará el sello de hibernación creyendo estar al día. Es el `C:\repos\thousandsunny` de la bóveda.

El de `Desktop` tiene además `00_DRIVE_EXPORT` con 7.845 ficheros: no es un espejo del vault, es un volcado de Drive dentro de un vault. Decidir cuál de los tres sobrevive es del Capitán; hasta entonces, **el estado de Metatrón se lee en Drive o no se lee**.

---

*Este archivo se actualiza cuando cambie la posición, no cuando cambie la opinión.*  
