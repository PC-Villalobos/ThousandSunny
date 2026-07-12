# Biblioteca de Hipatia - Public Safe

Creado: 2026-07-04 03:42:10 +02:00
Actor: Codex
Estado: publicable
Dominio: SIS / ETH / OPE
Calendario:
  timezone: Europe/Madrid
  civil_date: 2026-07-04
  project_phase: compactacion / migracion textual Drive -> Obsidian/GitHub
  personal_cycle: ano personal no calculado
  source_dialogue_time: 2026-07-04 03:35:00 +02:00

## Idea

Hipatia es una biblioteca local dentro del vault de Obsidian que conserva bruto etiquetado.

GitHub conserva solo el contrato public-safe para que cualquier LLM pueda entender como sincronizarse:

```text
peticion NL -> GitHub public-safe -> vault local -> indice maestro -> rama minima -> compuerta si procede
```

## Ubicacion local canonica

Reconciliada 2026-07-12 (sustituye la ruta unica declarada el 2026-07-04):

```text
D:\Biblioteca de Hipatia\                     <- RAIZ REAL de la biblioteca (fuera de la Maceta)
D:\La maceta de Groot\                         <- Maceta activa (vault de Obsidian)
D:\La maceta de Groot\40_Biblioteca_Hipatia\   <- PUENTE de Obsidian (no es la biblioteca)
C:\La maceta de Groot\                          <- archivo historico, NO canon activo
```

La raiz de sincronizacion es `D:\Biblioteca de Hipatia\`. El `40_Biblioteca_Hipatia`
dentro de la Maceta es solo el puente de navegacion en Obsidian. Los sub-arboles
`_protegido/`, `_INDICE_MAESTRO.md` y el bruto viven bajo esa raiz real.

## Contenido local esperado

- `_INDICE_MAESTRO.md`: indice local real, no publicable si contiene punteros sensibles.
- `_ETIQUETADO.md`: schema de frontmatter y sidecars.
- `N1_sistema/`: sistema, sutras y bitacoras.
- `N3_proyectos/`: proyectos por pilar.
- `N0_archivo/`: archivo triado.
- `_protegido/N2_clinica/`: clinica bajo compuerta.
- `_protegido/N4_personal/`: personal bajo compuerta.
- `_compost/`: dudosos y pendientes.
- `_public_safe/`: fragmentos aptos para repo publico.

## GitHub puede contener

- arquitectura;
- reglas de membrana;
- nombres de ramas no sensibles;
- rutas locales canonicas;
- indices public-safe sin IDs protegidos.

## GitHub no debe contener

- bruto de Drive;
- IDs protegidos de Drive;
- nombres clinicos o personales;
- sesiones, WhatsApp, historiales o payloads astrologicos personales;
- frase de compuerta, hash o pistas de la frase.

## Membranas

1. GitHub: raw local ignorado por `.gitignore`; solo public-safe viaja.
2. Obsidian: `_protegido/` fuera de busqueda normal mediante `userIgnoreFilters`.
3. Ingesta: olas con GO, verificacion, etiquetado, indexado y bitacora.

## Estado

Scaffold local creado el 2026-07-04 03:42:10 +02:00.

No se ha ingerido Drive.
