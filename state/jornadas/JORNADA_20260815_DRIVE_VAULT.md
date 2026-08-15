# Jornada 2026-08-15 — digestion Drive -> Vault

Objetivo unico del dia: **convertir a texto verificable el estante mitico completo
y dejar corriendo un pipeline reproducible que sirva para los demas estantes.**

Prohibicion del dia: ninguna feature nueva de Cubierta 2.5D salvo que sirva
directamente a la digestion. La Cubierta no esta prohibida por capricho: esta
prohibida porque el censo de hoy dice que el corpus **no es texto todavia**
(ver `state/maceta_groot/biblioteca_hipatia/CENSO_DRIVE_20260815.md`).

Regla de prioridad, en este orden estricto:

```
corpus operativo > textualizacion > procedencia/metadatos > recuperacion > UI
```

Si una tarea no mueve una de las cuatro primeras, hoy no entra.

## Punto de partida (ya hecho, no repetir)

- **Censo por conector ejecutado.** 144 piezas barridas, 5 en texto plano, 139
  Google Docs. 27 falsos `.md`. 7 duplicados exactos. Contaminacion de fecha
  del 2026-06-13 en ACA y NAR. Detalle y limites en el censo.
- **Paseo configurado** en el PC del Capitan: workspace unico
  `ThousandSunny — migracion y digestion`, cinco scripts supervisados,
  `paseo.json` + wrapper de preview en el arbol local. Sin schedules.

Lo que **no** esta hecho y el dia asume: sonda mecanica local, deduplicacion,
`fecha_origen_resuelta`, y cero conversion real.

## Bloques

Duraciones, no relojes. Empezad cuando empeceis y desplazad el resto.

---

### B1 — Corte de alcance (20 min) · Capitan

Tres decisiones, por escrito, antes de que nadie ejecute nada:

1. **Ola 1 = estante mitico** (65 piezas, 64 por convertir). Confirmar o cambiar.
2. **Que se hace con los 7 duplicados**: se descartan por `createdTime` mas
   antiguo, o se conservan ambos con marca. Decision del Capitan, no del agente.
3. **Umbral de re-apertura de Cubierta** (ver GO/NO-GO al final). Fijarlo hoy,
   no cuando apetezca.

Salida: tres lineas en este fichero, bajo "Decisiones del Capitan".

---

### B2 — Contrapeso del censo (45 min) · Codex

La regla 4 de `robin-cronos` no admite una sola sonda. El censo de la nube es
la sonda por conector; falta la mecanica.

- Barrer con Drive montado o API local **los cuatro estratos sin barrer**:
  `SOF`, `ETH`, `OPE`, `NEX`. Mismo formato de tabla que el censo.
- Re-barrer `MYT`, `ACA`, `NAR`, `SIS` por el **eje `createdTime`** y contrastar
  con el barrido por `modifiedTime` de la nube (regla 2: ningun censo es completo
  hasta barrer ambos ejes).
- Registrar el desacuerdo entre sondas. El desacuerdo es informacion sobre el
  alcance de cada ventana, no un fallo.

Salida: seccion "Contrapeso" anexada al censo, con el denominador real del corpus.
Hasta que exista, **nadie dice un porcentaje de avance global**.

No descender a `02_CLINICA` ni a `00_BOVEDA_NEXUS`. La boveda sigue sellada por
GO C0 del 2026-07-05.

---

### B3 — Pipeline de conversion (2 h) · Codex, en paralelo con B4

El entregable no es "los 64 docs convertidos". Es **el script que los convierte
y que se puede volver a lanzar manana sobre otro estante**.

Contrato minimo por pieza, tomado de `zoro-migrate` y `robin-cronos`:

- Fuente intacta: `source_mutations: 0`. No mover, no renombrar, no borrar en Drive.
- Salida en texto plano real, verificable por `mimeType`, no por nombre.
- Frontmatter obligatorio: `id` Deckard, `estado`, `dominio`, `fuente`,
  `fecha_original`, `fecha_origen_resuelta`, `kairos`, `hash_sha256`,
  `github_publish: false`.
- Deduplicacion aplicada segun la decision de B1.
- Idempotente: relanzarlo dos veces no duplica salida.

Exponerlo como script de Paseo en el workspace ya limpio, junto a los cinco
existentes. Un script mas, no una arquitectura nueva.

---

### B4 — Traduccion ontologica del estante mitico (2 h) · Claude Code

Cortar el formato es el primer paso, no el trabajo. Sobre la salida de B3:

- `fecha_origen_resuelta` pieza a pieza. Las fechas internas del texto mandan
  sobre el metadato cuando se contradicen.
- `kairos` por pieza: `fundacional` / `germinal` / `crisis` / `cosecha` / `rutina`.
  La antiguedad es cronos; la importancia es kairos.
- Reclasificacion en caliente (regla 7): si al abrir una pieza el contenido
  contradice su clasificacion, sube al nivel mas protector **en el acto** y se
  anota. La metadata propone, el contenido dispone.
- Wikilinks entre piezas del mismo estante. Sin enlaces no es memoria.

Aviso operativo: los titulos del estante mitico incluyen nombres propios de
terceros. Si el `owner` de alguna pieza no es el Capitan, esa pieza **para** y
pide GO explicito, aunque el contenido parezca inocuo.

---

### B5 — Verificacion por muestreo (45 min) · Capitan + Claude Code

No basta con que el script diga OK. Muestreo manual de **15 piezas** de las 64,
elegidas al azar, no las primeras. Por cada una:

- [ ] Se abre como texto plano en Obsidian, no como objeto.
- [ ] El `mimeType` es texto, no Google Doc con nombre `.md`.
- [ ] Frontmatter completo, sin campos vacios.
- [ ] La fuente en Drive sigue intacta y en su sitio.
- [ ] `fecha_origen_resuelta` no es la fecha de migracion.
- [ ] Ninguna pieza sensible ha cruzado la membrana.

Si falla **una sola** de las 15, la ola no se cierra: se corrige el pipeline y
se remuestrea. Un lote a medias es peor que un lote no empezado, porque parece hecho.

---

### B6 — Pausa de diseno de Cubierta (45 min, techo duro) · Capitan + Codex

Una sola decision, no las dos:

- **A)** contrato de UI para mostrar artefactos ya digeridos, o
- **B)** como una ROOM cambia politica de recuperacion sin arrastrar el contexto entero.

No se construye mar, ni islas, ni combate, ni animacion, ni narrativa. Sale una
nota de diseno, no codigo. Si a los 45 minutos hay codigo, el bloque ha fallado.

---

### B7 — Cierre operativo (30 min) · Claude Code

- Escribir el checkpoint: que quedo demostrado, que sigue pendiente, que no se
  toca manana sin GO.
- Anexar el contrapeso al censo si B2 lo produjo.
- Dejar una cola corta para el siguiente slice. Un slice, no una vision.
- Si el hub local esta levantado: `npm --prefix "$SUNNY_HUB_PATH" run checkpoint`.
  Si la sesion es remota y no lo alcanza: checkpoint en el cuerpo del PR bajo
  `## Checkpoint`. Sin checkpoint la jornada es invisible para el resto de la
  tripulacion.

## Reparto

| Carril | Hace | No hace |
|---|---|---|
| **Capitan** | decisiones de B1, muestreo de B5, GO/NO-GO | ejecutar scripts |
| **Codex** (PC, Paseo) | sondas locales, pipeline, validadores, tests | clasificacion semantica |
| **Claude Code** (nube) | censo, traduccion ontologica, kairos, sintesis, cierre | tocar el disco del Capitan |

Claude Code no ve `D:\`, ni el hub, ni la Biblioteca real. Todo lo que afirme
sobre el arbol local es de segunda mano y debe decirlo.

## GO / NO-GO de final de dia

Marcar al cierre. **Todo GO o la Cubierta no se abre.**

- [ ] Contrapeso ejecutado y denominador real del corpus conocido
- [ ] Estante mitico convertido: 64 piezas en texto plano verificado por `mimeType`
- [ ] Cero `source_mutations` en Drive
- [ ] Los 7 duplicados resueltos segun la decision de B1
- [ ] 15 de 15 piezas del muestreo pasan las seis casillas de B5
- [ ] Pipeline relanzable: corre dos veces sin duplicar salida
- [ ] Lista explicita de sensibles que no se exponen, escrita
- [ ] Una sola decision de Cubierta, sin ampliacion de alcance

**Umbral para abrir fase fuerte de Cubierta** (no es de hoy, es de la fase):

- 80% del corpus prioritario textualizado, medido por `mimeType`
- 100% con procedencia minima (`fuente` + `fecha_origen_resuelta`)
- politica de sensibles cerrada
- recuperacion por ROOM demostrada en pequeno, sobre corpus real

## Decisiones del Capitan

_(B1 escribe aqui. Vacio a proposito.)_

---

*El rapado se hace una vez; el peine, todos los dias. Esto es peine: una ola
pequena, reversible y repetible manana. Si el plan no cabe en un dia y no se
puede repetir, es una tijera disfrazada.*
