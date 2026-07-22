# Melampo Lab

Banco de pruebas aislado del motor de digestion "Melampo" del Thousand Sunny.
Trabaja **solo sobre corpus sintetico** (`corpus/`) y produce **solo propuestas con
evidencia**. No escribe canon, no toca fuentes reales, no toca el genoma de Metatron.

Nace de la Ola M0 (ver `docs/architecture/` y la conversacion de arranque): antes de
digerir corpus reales, demostrar de extremo a extremo el nucleo del metabolismo sobre
material inventado con verdades conocidas.

## Reparto (dónde encaja Melampo)

- **Drive Rescue** = puerta y punteros de fuentes.
- **Metatron** = precedente y contrato de waves/gating (no se toca desde aqui).
- **Funcion de Sueno** = reloj/consumidor nocturno + **libreria de primitivas**
  (`../funcion_de_sueno/lib/scan.mjs`), que este lab reutiliza.
- **Melampo Lab** = motor nuevo, aislado, con estado de propuestas propio.
- **Connectoma** = corpus de referencia para pruebas de recuperacion (real, no aqui).

## Membrana de acceso

Reutiliza `scan.mjs` con una politica **estricta**:

- protegido (marcador de ruta) -> `stat_only`: **nunca se abre**, sin hash ni contenido.
- sobredimensionado -> `hash_authorized`: se hashea, no se analiza.
- resto -> `content_readable`.

Es la diferencia con el CLI de sueno, que hashea todo para detectar deltas. Aqui el
protegido no se abre en absoluto.

## Qué demuestra hoy

- Membrana estricta: el protegido nunca se lee.
- Deteccion de familias: duplicado exacto (por hash) y version (por titulo).
- Relaciones candidatas por co-referencia, **con evidencia** (`sharedLink`, etc.).
- Almacen de propuestas con **idempotencia secuencial** (ids estables; re-correr una
  ejecucion completa no duplica).
- Ninguna propuesta se promueve a canon: todas quedan `status: "propuesta"`.
- Recuperacion minima que explica su porque.

## Qué NO hace todavia (proximos GO)

- **Membrana sensible a mayusculas** (deuda, hallazgo #1 del code-review): la
  deteccion de rutas protegidas (`hasProtectedMarker` en `scan.mjs`) hace un
  `includes` exacto. Una carpeta protegida con distinta caja (`hold_clinico`) no se
  detectaria y su contenido se leeria. No afecta al corpus sintetico (mayusculas),
  pero **debe resolverse antes de conectar corpus real/clinico**.
- **Crash-consistency**: `run()` hace `append(proposals.jsonl)` y luego
  `write(state.json)` de forma **no atomica**. Un fallo entre ambas escrituras puede
  dejar propuestas anexadas sin sus ids en el estado (re-anexado al reiniciar), o el
  estado con ids pero el fichero truncado (no se reconstruye). Lo demostrado es
  idempotencia **secuencial**, no reanudacion segura tras fallo. Resolverlo exige
  escritura transaccional (temp+rename o log con marca de commit).
- Concurrencia multi-trabajador y colisiones deliberadas.
- Rollback / rechazo interactivo de propuestas.
- Metricas completas de recuperacion (precision/recall) sobre corpus real.
- Consumo del mapa real de Drive Rescue.

## Uso

```bash
node state/melampo_lab/melampo.mjs                   # digiere corpus -> propuestas
node state/melampo_lab/melampo.mjs --recover alpha   # consulta de recuperacion
node --test state/melampo_lab/melampo.test.mjs       # pruebas
```

`proposals.jsonl` y `melampo_state.json` son salida regenerable (git-ignored).
