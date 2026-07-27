# Contrato pedagogico de la Cubierta

**Fecha:** 2026-07-27
**Autor:** claude-code (sesion cloud), rol Nami / Robin / Vivi
**GO:** Capitan, 2026-07-27 — materializar la superficie minima de la Cubierta, aplicar los ajustes
pedagogicos, probarla localmente y abrir PR draft; **sin desplegar en Ubuntu**.

---

## 0. Que es esto, y sobre todo que no es

**Esto no es una proyeccion de la Cubierta desplegada.**

La superficie viva corre en la VM (`sunny-flota-bridge`) desde
`D:\SunnyFranky\linux-llm-control-plane\apps\sunny-control-bridge`. Esta sesion no alcanza ninguno
de los dos arboles. Todo lo que sabe de la Cubierta procede de lo que el Capitan leyo en pantalla y
pego en el hilo.

Por eso aqui **no** se hace lo que el PR #95 hizo con el servidor de Hipatia. Alli hubo proyeccion
real: 13 artefactos leidos del runtime, con sus SHA-256 probandolo. Escribir un HTML a partir de una
captura y llamarlo proyeccion seria un artefacto inventado con etiqueta de fiel, y dejaria **dos
Cubiertas divergentes** — el fallo de los dos espejos de OneDrive de `POSICION.md` §7, en otro
subsistema.

Lo que si es:

- **Un contrato ejecutable** de como se traduce cada campo del ciclo gobernado a lenguaje humano,
  con 19 pruebas que lo sostienen.
- **Una superficie de referencia** que lo implementa y se puede mirar.

Lo que queda pendiente y declarado: **la reconciliacion contra la Cubierta desplegada.** Quien tenga
acceso a ese arbol —hoy, Codex— compara, aplica y verifica. Esa parte del GO no la puede cumplir
quien escribe esto, y fingir que si seria exactamente lo que este contrato existe para impedir.

---

## 1. La regla que gobierna todo

> **La traduccion hereda el estatuto del origen y nunca lo mejora.**

Si el registro no sabe, la interfaz dice que no sabe **y dice por que**. Un hueco honesto vale mas
que un dato reconstruido hacia atras. De ahi salen los seis ajustes.

---

## 2. Los seis ajustes

Nacen de la lectura de la Cubierta desplegada del 2026-07-27. Los tres primeros son defectos
observados; los tres siguientes, ausencias.

### Ajuste 1 · La ejecucion pertenece a la orden, no a un trabajador

**Lo observado.** La linea `Ejecucion:` aparecia **dentro del bloque del ultimo worker**: bajo
`codex` en las cuatro ordenes, nunca bajo `claude`. En `ORD-TG-567384347` eso hacia leer
«Ejecucion: Ejecutada» como si Codex hubiera ejecutado algo, sobre una orden cuyo texto pedia
**deliberar si procedia** consultar.

**Por que importa mas que los otros cinco.** No confunde una etiqueta: **atribuye una accion a un
actor**. Es la fusion actor/capa —R5— con una ejecucion por medio, que es el dato mas caro de
equivocar en todo el sistema.

**El contrato.** `renderOrden()` devuelve `ejecucion` al nivel de la orden. Ningun objeto de agente
lleva campo de ejecucion, y una prueba recorre todos los agentes de todas las ordenes para
comprobarlo.

*Sigue abierto, y no lo resuelve este fichero:* si en la superficie desplegada aquel «Ejecutada» era
un fallo de maquetacion o una ejecucion real. En la contextualizacion del 2026-07-27 no constaba
`execution_executed` para esa orden. Verificarlo exige leer el ledger vivo.

### Ajuste 2 · Ningun enum en crudo llega al lector

**Lo observado.** El estado de la orden salia sin traducir —`deliberated`, `not_authorized`—
mientras todo lo de abajo estaba en castellano. Y es la linea que mas pesa: es el titular.
`not_authorized` con ambos agentes en «Pendiente» no se deja leer — no autorizada por quien, a
quien, es rechazo o es que nunca hubo GO.

**El contrato.** Vocabularios cerrados para los cinco campos. `not_authorized` dice explicitamente
*«No es un rechazo de los agentes: es que nunca se autorizo»*. Una prueba barre todo el texto
visible buscando los trece identificadores tecnicos y falla si alguno se filtra.

### Ajuste 3 · El titular es lo que se pidio

**Lo observado.** `ORD-TG-567384347` en grande, el texto de la orden debajo. Para escanear, el
identificador es clave de busqueda, no titulo. Es la diferencia entre un visor de log y una cubierta.

**El contrato.** `titular` es el texto; `referencia` es el identificador.

### Ajuste 4 · Sin tiempo no hay posicion

**Lo observado.** Ni una fecha en las cuatro ordenes. «Pendiente: el agente todavia no ha acusado la
orden» significa cosas opuestas si es de hace tres minutos o de hace cinco dias.

**El contrato.** La ausencia se declara —`Sin marca temporal en el registro`—, nunca se deja en
blanco. Una marca ilegible se nombra como ilegible en vez de silenciarse. En el fixture los cuatro
`createdAt` van a `null` **a proposito**: su ausencia es el dato.

### Ajuste 5 · El «desconocido» historico se explica, o parece averia

**Lo observado.** Tres de cuatro ordenes salian casi enteras en «desconocido». Es **correcto** —son
anteriores al contrato v3 y no se reconstruye hacia atras—, pero el panel no lo decia. Un lector ve
un muro de huecos y concluye que el sistema no funciona, cuando lo que ve es al sistema **negandose
a inventar**, que es su mejor propiedad.

**El contrato.** Toda orden `v1`/`v2` lleva el aviso, y cada `unknown` de agente lo arrastra. Una
prueba comprueba tambien lo inverso: una orden v3 **no** puede llevar la coartada historica, para
que no se convierta en excusa universal.

### Ajuste 6 · El aviso no se acorta nunca

**Lo observado.** Esto ya estaba bien y es lo mas dificil de acertar: *«El turno termino. Esto no
significa que la orden se ejecutara»* iba pegado a cada respuesta, sin excepcion.

**El contrato.** Se fija como invariante para que ninguna edicion futura lo abrevie por brevedad.
Una prueba cuenta las seis respuestas del fixture y exige el aviso literal en las seis. Y comprueba
lo contrario: un agente `pending` **no** recibe aviso de turno terminado.

---

## 3. R10 aplicado a este propio contrato

`traducir()` no obliga a que un valor futuro encaje en el vocabulario de hoy. Un valor no listado
produce `reconocido:false` y un aviso legible que lo cita, **no** un fallo que empuje al siguiente
autor a etiquetarlo con lo que haya a mano.

Es la leccion de la guarda de bindings de #95: una prueba que exige `boundary == "synced_vault"`
para todo binding fuerza a mentirle en el primero que no lo sea. Una guarda mal formada no falla en
voz alta; corrompe la declaracion siguiente en voz baja.

---

## 4. Verificacion

| Comprobacion | Resultado |
|---|---|
| `node --test state/cubierta_ui/render.test.mjs` | **19/19** |
| Superficie servida y renderizada en Chromium headless | 4 ordenes, sin errores |
| Ajuste 1 en el DOM: ejecucion dentro de bloques de agente | **cero** |
| Aviso de turno en el DOM | 12 apariciones (6 detalle + 6 aviso), las 6 respuestas |
| Aviso historico en el DOM | 3, las tres ordenes pre-v3 |
| Enums crudos en el texto visible | **ninguno** |

Nota sobre el conteo: `--dump-dom` vuelca tambien el codigo del `<script>` como texto, asi que una
busqueda ingenua de `<article>` da 5. Las tarjetas son 4.

La prueba de DOM **no** se commitea como parte de la suite: dependeria de que Chromium exista en la
maquina, y una suite que falla por el entorno acaba desactivada. Queda como verificacion manual
reproducible con `python3 -m http.server` desde este directorio.

---

## 5. Lo que este incremento NO hace

- **No despliega en Ubuntu.** Explicitamente fuera del GO.
- **No sustituye a la Cubierta desplegada** ni afirma coincidir con ella.
- **No resuelve** si el «Ejecutada» de `ORD-TG-567384347` era maquetacion o ejecucion real.
- **No conecta el STOP**, no compone ordenes, no porta credencial de emision.
- **No decide** las escrituras heredadas al vault sincronizado (`inherited_pending_review` en
  `state/hipatia_bridge_runtime/deploy/runtime-manifest.json`).

---

## 6. La prueba humana sigue pendiente

El Capitan midio la superficie desplegada con tres palabras: **respondido**, **ejecutado**,
**pendiente**. Su lectura, y la mia coincidiendo: las dos primeras se distinguian; **ejecutado no**,
por el ajuste 1.

`posicion()` responde las tres por separado y explicito, para que la siguiente prueba humana tenga
contra que contrastarse en vez de depender de la impresion general.

Hasta que el Capitan mire una superficie con estos ajustes aplicados y diga si las distingue, la
legibilidad sigue en `proposed`. Cuando lo diga, sube a `evaluated` —no a `observed`: un lector, una
lectura, y es el lector que ya conoce el sistema.
