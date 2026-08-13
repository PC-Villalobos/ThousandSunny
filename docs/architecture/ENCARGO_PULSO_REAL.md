# Encargo — Pulso real: separar `declarado` de `observado` en la Cubierta

Encargo del siguiente corte de la Cubierta. Este documento **especifica** el
trabajo; no lo ejecuta. La aprobación de este encargo no es su GO: ejecutarlo
requiere un GO propio del Capitán, como en el encargo de C0.

```yaml
version: 0.1-encargo
estado: borrador, pendiente de revision y de GO propio
chronos:
  occurred_at: 2026-08-13
  recorded_at: 2026-08-13
  sequence_after: cubierta_v0 (PR 101, baseline 747b8c1)
provenance:
  class: propuesto  # diseno derivado de la auditoria de la Cubierta y de la frontera fijada por el Capitan
autoridad:
  diseno: autorizado por el Capitan (2026-08-13)
  ejecucion: requiere GO propio del Capitan
  endurecimientos: Codex (2026-08-13) — contrato de `discordante`, parcialidad por eje, cota del almacen medido
```

## 1. Objetivo

Cerrar en runtime la diferencia entre **`declarado`**, **`observado`** y
**`sin_senal`**, antes de añadir ninguna superficie visual nueva.

Hoy la Cubierta se mueve casi enteramente sobre autodeclaración: los vitales que
pinta los escribe el propio agente en su `POST /api/senal`. Sólo `residencia` y
`fusion` salen de medir algo externo. Mientras eso siga así, cualquier capa
visual adicional amplifica una semántica todavía débil.

El corte termina cuando el barco pueda decir, por cada nakama y por cada
dimensión, **quién afirma qué y quién lo ha comprobado**.

## 2. Principio rector: `observado` es por eje, nunca por nakama

`observado` **no es un booleano del personaje**. Es un estado por **eje de
medición**. Un mismo nakama puede estar, a la vez:

- `observado` en liveness (su proceso existe),
- `no_observable` en memoria (la plataforma no lo expone),
- `declarado` en throughput (lo dice él, nadie lo ha comprobado),
- `sin_dato` en escritura (no ha tocado la bitácora en la ventana).

Colapsar esto en un único indicador de "verificado sí/no" reintroduce
exactamente el booleano disfrazado que este encargo existe para eliminar. La
estructura por eje es **normativa**, no una sugerencia de implementación.

### 2.1 Los cinco ejes

| Eje | Qué afirma | Sonda que lo puede observar |
|---|---|---|
| `liveness` | hay un proceso vivo detrás | sonda de proceso |
| `residencia` | hay un modelo cargado que puede producir | sonda de Ollama (`/api/ps`) |
| `throughput` | está produciendo tokens ahora | almacén medido (`hablar.mjs`) |
| `memoria` | cuánto ocupa | sonda de proceso (RSS) / `/api/ps` |
| `escritura` | ha dejado rastro en el spine | sonda de bitácora (delta de eventos) |

### 2.2 Estados de un eje

| Estado | Significa |
|---|---|
| `observado` | una sonda alcanzable lo midió dentro de la ventana |
| `declarado` | sólo consta en la señal del agente |
| `no_observable` | ninguna sonda puede alcanzarlo (plataforma, remoto, permisos) |
| `sin_dato` | la sonda respondió y no hay nada que reportar |

`no_observable` y `sin_dato` **no son lo mismo** y no pueden fundirse: el primero
dice que el instrumento no llega; el segundo, que llega y no ve nada.

## 3. Modelo de presencia

`presencia` deja de ser una cadena y pasa a llevar los dos ejes separados más el
veredicto derivado:

```
presencia: {
  declarado: { latido, edad_ms, estado },      // lo que dice el agente
  observado: { <eje>: { estado, fuente, edad_ms, valor } },
  veredicto: <ver 3.2>,
  motivo: "<frase que explica el veredicto>"
}
```

### 3.1 El cruce

| | con algún eje `observado` | sin ningún eje `observado` |
|---|---|---|
| **latido fresco** | `a_bordo` — concuerda | `declarado` — creíble, no verificado |
| **sin latido** | `mudo` — vivo pero callado | `fantasma` |

### 3.2 Derivación del veredicto

Se evalúa **en este orden**, y el primero que se cumple gana:

1. `en_puerto` — nunca emitió señal.
2. `discordante` — se confirma alguna contradicción de la sección 4.
3. `mudo` — sin latido fresco, pero `liveness` está `observado`.
4. `a_bordo` — latido fresco y al menos un eje `observado`.
5. `declarado` — latido fresco y ningún eje `observado`.
6. `amarrado` — sin latido, último estado de cierre limpio (sin cambios).
7. `no_observable` — sin latido y **todos** los ejes en `no_observable`.
8. `fantasma` — sin latido, algún eje alcanzable, ninguno `observado`.
9. `a_la_deriva` — como `fantasma`, silencio mayor que la ventana (sin cambios).

`mudo` va **antes** que `a_bordo` a propósito: un proceso vivo que dejó de
reportar es información más urgente que la ausencia de reporte a secas, y es el
estado que hoy no existe.

### 3.3 Qué suena en la campana

| Veredicto | ¿Suena? |
|---|---|
| `mudo`, `fantasma`, `a_la_deriva`, `discordante` | sí |
| `no_observable` | **nunca** |
| `en_puerto`, `a_bordo`, `declarado`, `amarrado` | no |

Una rutina en la nube no es un fantasma: es que la sonda no llega hasta ahí.
Hacerla sonar sería la alerta sin target que prohíbe la ley de la casa.

## 4. Contrato de `discordante`

### 4.1 Regla que gobierna toda la sección

> **La ausencia de medición nunca es contradicción.**
> Un `discordante` sólo puede nacer cuando un instrumento **alcanzable** afirma
> lo contrario de lo declarado. Si el instrumento no responde, el eje queda
> `no_observable` y no se emite nada.

Sin esta regla, el sistema se convierte en una máquina de falsas alarmas la
primera vez que se caiga una sonda.

### 4.2 Las tres contradicciones que cuentan

Sólo estas tres. Cualquier otra queda fuera del encargo.

**D1 — Proceso declarado inexistente.**
- Condición: la señal declara `pid` y la comprobación de liveness devuelve
  "no existe" (`ESRCH`).
- **No cuenta** si la comprobación devuelve "existe pero no es accesible"
  (`EPERM`): eso es `no_observable`, no contradicción.
- **No cuenta** si el `pid` declarado no es del mismo host que el barco.

**D2 — Residencia declarada incompatible con la observación.**
- Condición: el `actor` declarado identifica un modelo de Ollama, Ollama
  responde, y `/api/ps` no muestra ningún modelo residente que corresponda.
- Guarda antirruido: sólo cuenta si la muestra de `/api/ps` tiene como mucho
  `FRESCURA_SONDA_PS` de antigüedad **y** es posterior al latido declarado. Un
  modelo puede ser desalojado entre el trabajo y la comprobación; eso es una
  carrera, no una mentira.

**D3 — Producción declarada sin ninguna corroboración.**
- Condición: la señal declara `tokens_por_s > 0` y, dentro de
  `VENTANA_CORROBORACION`, **las tres** sondas están alcanzables y ninguna
  corrobora: sin modelo residente, sin muestra medida en el almacén para ese
  nakama, y sin delta de eventos en la bitácora.
- Si **cualquiera** de las tres sondas está inalcanzable, D3 no se evalúa.

### 4.3 Umbrales, con nombre

El implementador no inventa ninguno:

| Constante | Valor | Uso |
|---|---|---|
| `VENTANA_LATIDO_FRESCO` | 120 s | ya existe; define latido fresco |
| `VENTANA_CORROBORACION` | 120 s | ventana en la que D3 busca corroboración |
| `FRESCURA_SONDA_PS` | 15 s | antigüedad máxima de la muestra de `/api/ps` para D2 |
| `VENTANA_ALMACEN_MEDIDO` | 600 s | ventana útil del almacén (sección 6) |
| `MUESTRAS_MINIMAS_PARA_TASA` | 3 | mínimo para publicar una tasa (sección 6) |

### 4.4 Qué hace y qué no hace un `discordante`

- **No se mueve.** Es la única excepción a "mover exige latido fresco": ahí el
  movimiento sería activamente engañoso, y eso es peor que el silencio.
- **Suena** en la campana del puente, con la contradicción concreta (D1, D2 o
  D3) y los dos valores que no cuadran.
- **No se bloquea, no se revoca, no se congela.** Es un desvío más: lo sentencia
  el Capitán con la gramática del canon — `fertil` (JoyBoy) o `decae` (Buggy).
  El vigía sigue sin ser la Marina.

## 5. Las tres sondas

### 5.1 Sonda de proceso

Un agente puede declarar `pid` en su señal. El barco comprueba **liveness**, y
sólo liveness.

- Portabilidad: la comprobación es `process.kill(pid, 0)` — verifica existencia
  sin enviar señal y funciona en Linux, macOS y Windows. **No usar `/proc`**: la
  máquina del Capitán es Windows.
- `EPERM` (existe, no accesible) → `no_observable`, nunca `discordante`.
- RSS: específica de plataforma. Donde no se pueda leer, el eje `memoria` degrada
  a `no_observable`. **No se estima.**

**Límite duro:** sólo se observan PIDs que el propio agente declaró **para sí
mismo**, y sólo su existencia. Esto no es el barco inspeccionando la máquina del
Capitán; es el nakama dándole al barco un punto donde tomarle el pulso. Si esa
distinción se pierde, esto se convierte en la Marina por la puerta de atrás.

### 5.2 Sonda de Ollama, pasiva

Dos partes, y la segunda es gratis:

1. **Contraste con `/api/ps`** — residentes, VRAM, caducidad. Ya se lee; lo que
   falta es usarla para **contradecir** una afirmación (D2), no sólo para
   adornar la ficha.
2. **Cosecha de `hablar.mjs`** — el barco ya llama a Ollama cuando el Capitán
   conversa con un nakama, y ya recibe `eval_count`, `eval_duration`,
   `load_duration` y `total_duration`. Hoy **se descartan**. Persistirlos
   convierte cada conversación en una muestra medida: el barco puede medir lo
   que él mismo causa.

### 5.3 Sonda de bitácora

Delta del contador de eventos de `GET /api/health` entre muestras. Es la única
medida que sobrevive cuando el agente es remoto, y alimenta el eje `escritura`.

### 5.4 Fuera del alcance de este encargo

- **Sondeo sintético** a Ollama (mandar un prompt fijo para medir). Gasta GPU y
  mide la sonda, no el trabajo. Si alguna vez entra, va etiquetado como
  `sondeo` y **jamás** se presenta como el pulso de un nakama.
- **Medir rutinas cloud.** No es medible desde la máquina del Capitán: se queda
  `declarado` y se etiqueta como tal.
- Cualquier sala, sprite, mar o isla.

## 6. El almacén medido: ventana, agregación y caducidad

Persistir muestras crea un problema semántico nuevo — **datos medidos viejos
aparentando pulso actual** — y este encargo lo cierra por escrito:

- **Ventana útil:** `VENTANA_ALMACEN_MEDIDO` (600 s) deslizante. Una muestra
  fuera de ventana **se descarta**, no se atenúa ni se arrastra.
- **Agregación mínima:** para publicar una **tasa** hacen falta al menos
  `MUESTRAS_MINIMAS_PARA_TASA` muestras en ventana. Con una o dos se publica la
  **última muestra cruda**, etiquetada `muestra_unica`; nunca una media que
  aparente tendencia.
- **Caducidad:** sin muestra fresca, el vital vale `null`, tinta `desconocido` y
  motivo `"última muestra hace <n>s, fuera de ventana"`.
- **Prohibido el último valor conocido** sin sello de antigüedad visible. Un
  número medido hace nueve minutos, pintado sin fecha, es una mentira con
  procedencia falsificada.
- **Cota de tamaño:** el almacén es por nakama y acotado en número de muestras;
  no crece sin fin (mismo criterio que la poda de recados).

## 7. Consecuencia visual mínima

Sin arte nuevo. Sólo cómo se dibuja lo que ya existe:

| Veredicto | Se mueve | Se dibuja |
|---|---|---|
| `a_bordo` | sí | aro sólido (como hoy) |
| `declarado` | sí | **aro hueco**: creíble, no verificado |
| `mudo` | no | sólido y congelado, marca propia |
| `discordante` | **no** | marca de contradicción, suena |
| `no_observable` | sí, si hay latido | aro hueco con marca de fuera de alcance |
| `fantasma` / `a_la_deriva` | no | translúcido sin sombra (como hoy) |

**La regla dura no se toca.** Nunca dijo "medido", dijo **latido verificado**.
Este encargo añade un eje, no sustituye el existente: la verificación cambia
**cómo se dibuja**, no **si se mueve** — con la única excepción de
`discordante`.

## 8. `chopper-salud` y su prueba de aceptación

Primer consumidor del pulso real, y la prueba de que el corte sirve.

**Contrato:**

- Reporta, por nakama: veredicto de presencia, estado de cada eje, y vitales con
  tinta y **sonda de origen** de cada número.
- **No puede leer `senal.vitales` como fuente primaria.** Sólo salida de sonda.
  Si lo único disponible es el autoinforme, la respuesta es
  `"declarado, no observado"` — nunca un número pelado.
- Sabe decir **"no puedo medirte"** de forma **granular**: por nakama y por eje.
  Un médico que sólo sabe decir "no sé nada" cuando se le cae un instrumento
  tampoco está midiendo.

**Prueba de aceptación, literal y automatizable:** con todas las sondas caídas,
ningún vital puede volver con valor no nulo. Si sobrevive un solo número, el
skill falla. Se escribe como test, no como promesa.

## 9. No-regresión

Dos frases literales, que cualquier revisión posterior puede citar como criterio:

> **Ningún veredicto `observado` puede nacer sólo de `POST /api/senal`.**
>
> **Ningún valor operativo o clínico de `chopper-salud` puede salir de
> `senal.vitales` como fuente primaria.**

Y la frontera general que las gobierna: *ningún comportamiento visible nuevo debe
depender sólo de `POST /api/senal` si puede depender de una fuente medida.*

## 10. Criterios de salida

1. `presencia` lleva `declarado` y `observado` separados, con `observado`
   desglosado por los cinco ejes.
2. Los nueve veredictos se derivan por el orden de 3.2, y hay prueba de cada uno.
3. `no_observable` no aparece nunca en la campana. Con prueba.
4. `discordante` implementa D1, D2 y D3 con los umbrales de 4.3, no se mueve, y
   no dispara ninguna consecuencia automática. Con prueba de cada contradicción
   **y de cada no-caso** (`EPERM`, carrera de desalojo, sonda inalcanzable).
5. Los tiempos de `hablar.mjs` alimentan el almacén medido en vez de perderse.
6. El almacén respeta ventana, agregación mínima, caducidad y cota. Con prueba
   de que una muestra fuera de ventana no se publica.
7. `chopper-salud` responde granularmente y pasa la prueba de sondas caídas.
8. Cero salas, sprites, mar o islas nuevos.

## 11. Riesgos

- **La sonda de proceso deslizándose hacia vigilar la máquina.** Mitigación en
  5.1: sólo PIDs autodeclarados, sólo liveness.
- **La sonda convirtiéndose en el trabajo.** Un sondeo sintético mide el sondeo.
  Fuera del encargo, y etiquetado si algún día entra.
- **Falsas alarmas por sonda caída.** Mitigación: la regla de 4.1, y la
  separación estricta entre `no_observable` y `sin_dato`.
- **Proliferación de estados.** Nueve veredictos es mucho. Si en uso real
  `a_la_deriva` no aporta sobre `fantasma`, consolidarlos es candidato al
  siguiente corte — **no a éste**.

## 12. Lo que este encargo no autoriza

- Ejecutarse: falta el GO propio del Capitán.
- Tocar mar, islas, arte, salas nuevas o cualquier superficie visual más allá de
  la tabla de la sección 7.
- Sondeo sintético a modelos, en ninguna forma.
- Leer del proceso nada que no sea existencia y, donde se pueda, RSS.
- Cambiar la regla dura del movimiento más allá de la excepción de
  `discordante`.
- Tocar la Cámara de Chopper ni ninguna de sus fases. Este encargo no roza C0.

## 13. Desconocidos declarados

- Si `process.kill(pid, 0)` en Windows distingue de forma fiable entre "no
  existe" y "sin permiso" en todos los casos: **evaluado, no medido**. Debe
  comprobarse en la máquina del Capitán antes de dar D1 por bueno; ante la duda,
  el caso ambiguo cae en `no_observable`.
- Cuántas muestras produce en la práctica la cosecha de `hablar.mjs`: depende de
  cuánto converse el Capitán. Si conversa poco, `throughput` estará casi siempre
  `sin_dato`, y eso es una respuesta honesta, no un fallo.
- Coste real de la sonda de proceso con muchos agentes: desconocido.

## Registro de versiones

- v0.1 (2026-08-13): encargo inicial. Incorpora los tres endurecimientos de
  Codex sobre el diseño previo: (1) contrato de `discordante` cerrado en tres
  contradicciones con umbrales con nombre y no-casos explícitos, gobernado por
  la regla "la ausencia de medición nunca es contradicción"; (2) `observado`
  elevado a estado **por eje**, no por nakama, como principio rector; (3) cota
  del almacén medido — ventana, agregación mínima, caducidad y prohibición del
  último valor conocido sin sello. Añade las dos frases literales de
  no-regresión.
