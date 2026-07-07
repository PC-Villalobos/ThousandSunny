# Protocolo Rescate NL Drive v0

Creado: 2026-07-04 02:30:00 +02:00
Actor: Nami/Claude, fusionado por Codex
Estado: activo como semilla
Dominio: SIS / ETH / OPE
Calendario:
  timezone: Europe/Madrid
  civil_date: 2026-07-04
  project_phase: compactacion / migracion textual Drive -> Obsidian/GitHub por punteros
  personal_cycle: ano personal no calculado
  source_dialogue_time: 2026-07-04 02:30:00 +02:00

## Objetivo

Que cualquier LLM con acceso a Obsidian y GitHub pueda, ante una solicitud en lenguaje natural del Capitan, localizar contenido que hoy vive solo en Drive sin copiar Drive al vault.

El sistema debe recuperar informacion por mapa, puntero y conector, no por ingestion masiva.

## Principio atractor

El vault no contiene Drive: contiene el mapa de Drive.

Drive conserva contenido pesado, privado y sensible bajo autenticacion de Google. Obsidian/GitHub conservan punteros, metadatos, sensibilidad y reglas de acceso.

Flujo:

```text
solicitud NL -> indice miceliar -> puntero -> conector Drive -> entrega
```

Nunca inundacion. Nunca copia masiva. Nunca escribir contenido protegido al vault o GitHub.

## Flujo de rescate

1. Recibir solicitud en lenguaje natural.
2. Resolver dominio contra `INDICE_MICELIAR_DRIVE_v0_20260704_023000`.
3. Bajar solo por la rama necesaria del indice.
4. Clasificar sensibilidad:
   - `publico`: puede servirse directo.
   - `interno`: puede servirse al usuario, no publicar fuera.
   - `protegido`: detener, pedir compuerta y registrar acceso.
5. Recuperar por conector Drive usando ID verificado.
6. Entregar con cita del puntero: titulo, ID, URL y nivel de sensibilidad.

## Compuerta protegida

Para entradas `protegido`, el agente debe:

1. Pedir frase de compuerta al Capitan.
2. Compararla contra un hash registrado.
3. Registrar acceso con fecha, hora, agente, motivo y puntero.
4. Servir el contenido solo en la conversacion.
5. No escribir contenido protegido en Obsidian, GitHub ni logs publicables.

## Contrasena: v0 y v1

v0 es compuerta operativa:

- hash SHA-256 de frase elegida por el Capitan;
- hash guardado fuera de notas sensibles;
- frase nunca escrita en claro;
- registro de acceso obligatorio.

Esto no es cifrado real. Solo frena a agentes, deja trazabilidad y evita accesos por inercia.

v1 pendiente:

- cifrado real de extractos sensibles con `age`, `gpg` o plugin seguro;
- clave fuera del repo;
- no versionar secretos;
- no replicar datos clinicos/personales a GitHub.

## Datos protegidos

Se consideran protegidos:

- datos clinicos;
- sesiones;
- personas identificables;
- WhatsApp o conversaciones privadas;
- finanzas;
- historiales;
- lecturas simbolicas personales no autorizadas;
- cualquier rama marcada `personal_guarded`, `clinical_guarded` o `HOLD`.

## Mantenimiento del indice

Reglas:

- append-only;
- timestamp obligatorio;
- `source_mutations=0` salvo GO explicito;
- cada entrada incluye titulo, ID, parentId, nivel, dominio, fecha y notas;
- correcciones se anotan, no se borran silenciosamente;
- si un ID no resuelve, marcar `id_muerto` y proponer actualizacion reversible.

## No hacer

- No absorber Drive en bloque.
- No publicar punteros sensibles sin clasificacion.
- No mover, renombrar o borrar en Drive sin plan reversible y GO.
- Frase de compuerta v0: **elegida por el Capitan el 2026-07-04**. Materializar
  `_compuertas.md` **solo en el vault local** (hash SHA-256 + receta de
  normalizacion + registro de accesos). Ni la pregunta, ni la frase, ni el hash
  entran en GitHub publico — el hash viajo al telar local por canal privado.
- No crear `GERMINACION_03` por el hecho de cartografiar sustrato.

## Relacion con GitHub

GitHub publico puede contener:

- protocolo;
- indices con metadatos minimizados;
- punteros internos no sensibles;
- rutas locales canonicas para que Obsidian resuelva la compuerta.

GitHub publico no debe contener:

- contenido clinico;
- texto de sesiones;
- conversaciones privadas;
- IDs de Drive de ramas protegidas;
- contrasenas;
- claves;
- hashes junto a pistas obvias de la frase.
