# Drive Rescue

Creado: 2026-07-04 02:30:00 +02:00
Actor: Codex
Estado: preparado para GitHub publico, pendiente de publicacion
Dominio: SIS / ETH / OPE
Calendario:
  timezone: Europe/Madrid
  civil_date: 2026-07-04
  project_phase: compactacion / migracion textual Drive -> Obsidian/GitHub por punteros
  personal_cycle: ano personal no calculado
  source_dialogue_time: 2026-07-04 02:30:00 +02:00

## Proposito

Este paquete permite recuperar contenido textual de Drive mediante lenguaje natural sin copiar Drive al repo ni exponer punteros sensibles en GitHub publico.

GitHub contiene protocolo y mapa publicable. El vault local de Obsidian conserva el indice completo, permisos, compuertas y datos protegidos.

## Archivos

- `PROTOCOLO_RESCATE_NL_DRIVE_v0_20260704_023000.md`: flujo NL -> indice -> puntero -> conector Drive -> entrega.
- `INDICE_MICELIAR_DRIVE_PUBLIC_SAFE_20260704_032612.md`: semilla publicable por dominios, sin IDs protegidos.

El indice completo vive solo en el vault local:

- `D:\La maceta de Groot\99_Sistema\INDICE_MICELIAR_DRIVE_v0_20260704_023000.md`

## Regla

No usar este paquete para saltarse compuertas.

Si una entrada esta marcada como `protegido`, el agente debe usar el indice local de Obsidian, pedir compuerta, registrar acceso y servir contenido solo en conversacion. No se escriben IDs ni contenido protegido en GitHub publico.

## Estado de publicacion

Pendiente: commit y push en la rama viva de ThousandSunny.
