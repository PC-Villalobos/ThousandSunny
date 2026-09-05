# Fase 0 — informe del circuito

> **Estado: corregido.** Este informe describe primero el commit de evidencia
> `bdcf3e2`, y al final la corrección. El commit de evidencia **no se ha tocado**:
> sobre él se reproducen ocho fallos de frontera, y esa prueba no se borra del
> historial. La corrección entra encima, con una prueba por hallazgo.

**Corrido el 2026-08-29** desde sesión cloud, sobre 6 fixtures sintéticos.
Reproducible: `node state/vegapunk/vegapunk.mjs --dry`.

```
inventario: 6 registros (1 en Z1, nunca abiertos)
  capitan / sistema           -> asistencial:derivado, cuantificado:contenido, intimo:derivado, metafora_limpia:contenido, metafora_trampa:derivado
  capitan / investigacion     -> cuantificado:contenido
  tripulacion / sistema       -> asistencial:derivado, cuantificado:contenido, intimo:derivado, metafora_limpia:contenido, metafora_trampa:derivado
  tripulacion / investigacion -> cuantificado:contenido
  contratado / sistema        -> asistencial:derivado, cuantificado:derivado, intimo:derivado, metafora_limpia:contenido, metafora_trampa:derivado
  contratado / investigacion  -> cuantificado:derivado
  adaptador / sistema         -> metafora_limpia:derivado
  adaptador / investigacion   -> nada
fugas detectadas: 0
```

`node --test state/vegapunk/vegapunk.test.mjs` → **14 pruebas, 14 en verde**.

## Lo que quedó probado

| # | Afirmación | Cómo se prueba |
|---|---|---|
| 1 | Z1 nunca se abre | espía sobre `fs.readFileSync`: cero llamadas a `Z1_IDENTIDAD` |
| 2 | Z1 denegado a los cuatro solicitantes | admisión sobre los cuatro actores |
| 3 | La trampa se reclasifica a `asistencial` | disonancia con ≥2 marcadores de evidencia |
| 4 | La metáfora limpia sigue saliendo | el adaptador recibe exactamente un ítem |
| 5 | El adaptador no recibe guardado ni cuantificado | denegado en los cuatro materiales |
| 6 | La puerta a investigación abre solo con GO | `puerta_cerrada` vs `puerta_abierta` en el recibo |
| 7 | Ninguna clase guardada sale literal | recorrido de las 8 corridas del circuito |
| 8 | `verificarFuga` anula un paquete trucado | paquete construido a mano por detrás de la matriz |
| 9 | Lo no sintético no entra | `PARADA_FUENTE_REAL` |
| 10 | Identidad fuera de Z1 detiene | `PARADA_IDENTIDAD` |
| 11 | Recibos idempotentes y sin colisiones | dos corridas, mismos ids |

## Fallos encontrados al construirlo (los dos reales)

**1. La matriz y el muelle se contradecían.** La matriz concedía `contenido` al
Capitán sobre clase guardada; la verificación de fuga lo rechazaba. Resultado: el
paquete del Capitán se anulaba entero y él no recibía **nada** — el fallo silencioso
más peligroso posible, porque parecía prudencia.

*Resuelto* separando dos cosas que se estaban confundiendo: **acceso directo** (el
Capitán abre el fichero en su máquina) y **salida por el muelle** (el puerto
construye un paquete). El techo de muelle capa las clases guardadas a `derivado`
para todos, el Capitán incluido, y el motivo queda escrito en el recibo.

**2. El material no leído se reportaba como disonante.** Z1 salía con
`disonancia: true` porque no tenía clase declarada y la efectiva caía en la más
restrictiva. Era inventar una contradicción que nadie observó: el fichero jamás se
abrió. *Resuelto:* lo no leído recibe la clase más restrictiva **y** `disonancia:
false`, con `leido: false` explícito.

Los dos son la misma familia de error —confundir la ausencia de dato con un dato— y
los dos habrían pasado desapercibidos sin correr el circuito.

## Lo que la Fase 0 NO prueba

- Que sepamos analizar material clínico o íntimo. Esto es **contrato, no sabiduría**.
- Que los marcadores de detección aguanten prosa real. Están calibrados contra cuatro
  fixtures que yo mismo escribí: sobre-detectan a propósito, y eso solo aprieta, pero
  su umbral (≥2 marcadores) no se ha medido contra nada auténtico.
- Que la seudonimización funcione. Z1 se prueba **cerrada**, no en uso: no hay
  todavía un circuito que asigne seudónimos, solo la garantía de que el mapa no sale.
- Que las manos mediadas del §4 del contrato del actor existan. Son diseño, no código.

## Lo que se propone después

**GO-1 · Una sola fuente real.** No "abrir Fase 1": admitir **un** material real,
nombrado, de clase `cuantificado` (la menos expuesta), con su caso, su seudónimo
asignado en Z1 y su finalidad. Correr el mismo circuito y comparar recibos con los de
su equivalente sintético. Si diverge, el puerto no está listo — y lo sabremos con un
material, no con un corpus.

**GO-2 · El puente de manos mediadas.** El circuito
`actor propone → puente comprueba GO/repo/rama/ruta → ejecuta con la sesión del
Capitán → supervisión verifica`, con su propio canario, antes de que ningún actor
contratado toque un repositorio.

**GO-3 · Seudonimización real en Z1.** Hoy Z1 solo se sabe cerrar. Falta la
operación que asigna y resuelve seudónimos sin que el mapa salga nunca del
compartimento.

Ninguno de los tres se ejecuta sin firma del Capitán. **No he iniciado la admisión de
ninguna fuente real.**

---

# La corrección

Ocho hallazgos de frontera, reproducidos sobre `bdcf3e2` por una auto-revisión y
confirmados de forma independiente en los tres de gravedad alta. Corregidos aquí,
con **una prueba `node:test` por hallazgo** que falla en el commit congelado y pasa
en este.

| # | Qué se rompía | Qué hace ahora |
|---|---|---|
| H1 | umbral de dos marcadores: una pieza declarada `metafora` con un solo marcador llegaba al adaptador | **un marcador basta** para forzar la clase más restrictiva |
| H2 | la detección solo miraba el cuerpo: `sesion_paciente_03.md` con cuerpo limpio salía como metáfora | la superficie de detección es **nombre + cabecera + cuerpo**; de lo que no se abre queda el nombre |
| H3 | `admitir()` devolvía `contenido` y el muelle rebajaba a `derivado` después: el recibo no describía la salida | el **techo de muelle se aplica en la admisión**; el recibo lleva `nivel_acceso` (techo de matriz) y `nivel` (salida real) |
| H4 | una `clase_declarada` inexistente se registraba como si existiera | cae en la más restrictiva, se nombra el valor, y el recibo marca `clase_declarada_valida: false` |
| H5 | `.txt` y `.csv` no se inventariaban: el puerto no los denegaba, no los veía | **el inventario ve todo**; la extensión decide si se abre, no si existe. Lo no analizable se deniega con motivo, sin abrirse |
| H6 | `sujeto` y `zona` de la cabecera no gobernaban nada | el **sujeto decide la intimidad** (lo íntimo de un tercero es relación asistencial; un sujeto desconocido es el peor caso); una `zona: Z1` declarada fuera del compartimento se **deniega** |
| H7 | `puerta_investigacion: si` abría la puerta clínica | exige **formato de GO y caducidad vigente**; un permiso sin fecha de fin es un permiso permanente |
| H8 | recibos sin tiempo: no se podía auditar cuándo se concedió acceso | **recibo** (decisión, sin tiempo, idempotente) y **asiento** (evento, con hora y `run_id`, append-only) son artefactos distintos |

## Verificación de la corrección

```
node --test state/vegapunk/vegapunk.test.mjs   -> 23 pruebas, 23 en verde
node state/vegapunk/vegapunk.mjs --dry         -> 7 registros, 0 fugas
```

Contra el commit congelado, las seis pruebas nuevas que sus exportaciones admiten
**fallan las seis**; las tres restantes (sujeto, puerta, asiento) ni siquiera
cargan allí, porque ejercitan capacidades que en `bdcf3e2` no existen.

## Lo que la corrección NO resuelve

- **La declaración no puede proteger.** Para leer una cabecera hay que abrir el
  fichero. Un material que se declara Z1 fuera del compartimento ya se ha leído
  cuando el puerto se entera. Se deniega y se dice, pero el daño de la lectura no
  se deshace: **protege la ruta, no la cabecera**.
- **Los marcadores siguen sin medirse contra prosa real.** Bajar el umbral a uno
  aprieta, pero sigue siendo una lista de nueve expresiones calibrada contra
  fixtures que escribí yo.
- **Z1 sigue probándose cerrada, no en uso.** No hay circuito que asigne
  seudónimos.
- **`npm test` completo no es portable.** `test:sueno` invoca `python3`, que en
  Windows resuelve al alias de la Microsoft Store; el bloque de Vegapunk pasa y la
  suite se corta ahí. Es anterior a este puerto y **queda fuera de este PR** a
  propósito: merece un cambio propio.

Los tres GO propuestos siguen en pie y ninguna fuente real ha entrado.
