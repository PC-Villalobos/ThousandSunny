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
- Almacen de propuestas **idempotente y reanudable** (ids estables; re-correr no duplica).
- Ninguna propuesta se promueve a canon: todas quedan `status: "propuesta"`.
- Recuperacion minima que explica su porque.

## Qué NO hace todavia (proximos GO)

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
