# Indice Miceliar Drive Public Safe

Creado: 2026-07-04 03:26:12 +02:00
Actor: Codex
Estado: publicable en GitHub
Dominio: SIS / ETH / OPE
Calendario:
  timezone: Europe/Madrid
  civil_date: 2026-07-04
  project_phase: compactacion / migracion textual Drive -> Obsidian/GitHub por punteros
  personal_cycle: ano personal no calculado
  source_dialogue_time: 2026-07-04 03:26:12 +02:00

## Proposito

Este indice permite orientar solicitudes en lenguaje natural sin publicar IDs protegidos de Drive.

El indice completo con IDs vive en:

- `D:\La maceta de Groot\99_Sistema\INDICE_MICELIAR_DRIVE_v0_20260704_023000.md`

GitHub puede decir que rama consultar. Obsidian local decide si hay compuerta y entrega el puntero vivo al conector Drive.

## Regla de exposicion

- Publicable: nombres de dominios, rutas canonicas del vault, niveles de sensibilidad y reglas de acceso.
- No publicable: IDs de carpetas/personas/casos protegidos, nombres clinicos o intimos, transcripciones crudas, datos de WhatsApp, historiales, cartas personales y payloads astrologicos personales.
- Operativo: si una consulta toca un dominio protegido, responder con `requiere compuerta` y continuar solo desde el vault local.

## Ramas publicables

| Dominio | Nivel | Ruta local canonica | Accion NL |
|---|---|---|---|
| Sistema / canon | interno | `D:\La maceta de Groot\99_Sistema` | Buscar protocolos, sutras, cierres y reglas. |
| Micelio operativo | interno | `D:\La maceta de Groot\99_Sistema\micelio` | Resolver como skill local antes de abrir Drive. |
| Drive rescue completo | interno/protegido | `D:\La maceta de Groot\99_Sistema\INDICE_MICELIAR_DRIVE_v0_20260704_023000.md` | Abrir solo en entorno local, no publicar IDs. |
| Clinica | protegido | indice local | Pedir compuerta antes de leer punteros o contenido. |
| Personal | protegido | indice local | Pedir compuerta antes de leer punteros o contenido. |
| Modelo semantico de usuario | protegido | indice local | Pedir compuerta y minimizar contexto. |
| Proyectos | interno | indice local | Buscar rama por intencion; elevar si aparece material personal. |
| Bitacora | interno | indice local / Drive | Usar para trazabilidad, no como fuente de secretos. |
| Sutras / Ananda | interno | `D:\La maceta de Groot\99_Sistema\ananda_sutras_20260704_020506.md` | Consultar regla canonica y espejo Drive si procede. |
| Inbox / migracion | triage | indice local | Reclasificar con plan reversible. |

## Flujo NL seguro

1. Clasificar la solicitud: sistema, proyecto, bitacora, clinica, personal, modelo usuario, inbox.
2. Si el dominio es `protegido`, pedir compuerta y usar solo el indice local de Obsidian.
3. Si el dominio es `interno`, consultar el vault y despues Drive si el puntero local lo exige.
4. Si el dominio es `triage`, registrar accion reversible antes de mover o fusionar.
5. No copiar contenido sensible a GitHub. Servirlo solo en conversacion con la compuerta adecuada.

## Estado

Este archivo reemplaza para GitHub al indice completo con IDs. La recuperacion real de contenido protegido depende de acceso local al vault canonico y de la frase de compuerta elegida por el Capitan.
