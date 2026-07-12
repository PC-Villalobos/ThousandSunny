# Biblioteca de Hipatia

Creado: 2026-07-04 03:42:10 +02:00
Actor: Codex
Estado: public-safe para GitHub
Dominio: SIS / ETH / OPE
Calendario:
  timezone: Europe/Madrid
  civil_date: 2026-07-04
  project_phase: compactacion / migracion textual Drive -> Obsidian/GitHub
  personal_cycle: ano personal no calculado
  source_dialogue_time: 2026-07-04 03:35:00 +02:00

## Proposito

Esta carpeta declara la arquitectura public-safe de la Biblioteca de Hipatia.

La biblioteca real vive localmente. Rutas canonicas (reconciliadas 2026-07-12,
sustituyen la ruta unica declarada el 2026-07-04):

```text
D:\Biblioteca de Hipatia\                     <- RAIZ REAL de la biblioteca (fuera de la Maceta)
D:\La maceta de Groot\                         <- Maceta activa (vault de Obsidian)
D:\La maceta de Groot\40_Biblioteca_Hipatia\   <- PUENTE de Obsidian hacia Hipatia (no es la biblioteca)
C:\La maceta de Groot\                          <- archivo historico (junio), NO canon activo
```

La raiz real de la biblioteca es `D:\Biblioteca de Hipatia\`, **fuera** de la Maceta.
La subcarpeta `40_Biblioteca_Hipatia` dentro de la Maceta es solo el puente que Obsidian
usa para navegar; no es la biblioteca completa. Cualquier agente que sincronice debe leer
la raiz real, no el puente. Este arbol local puede contener bruto de Drive y queda fuera de
GitHub publico.

## Archivos

- `BIBLIOTECA_HIPATIA_PUBLIC_SAFE_20260704_034210.md`: descripcion publicable del flujo, membranas y limite de exposicion.

## Regla

GitHub solo conserva la arquitectura y el contrato de sincronizacion.

El indice maestro real, los IDs protegidos, el bruto de Drive y cualquier material clinico/personal permanecen en el vault local bajo compuerta.
