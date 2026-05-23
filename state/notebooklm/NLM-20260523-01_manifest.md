# NLM-20260523-01 Manifest

Estado: candidates_ready
Dominio: sistema
Contrato: `state/deckard/WP-007_NOTEBOOKLM_PROMPT_CONTRACT.md`

## Objetivo

Extraer candidatos operativos para mejorar la membrana Sunny Core sin canonizar
ninguna salida de NotebookLM.

## Fuentes Del Lote

1. `state/deckard/00_BOOTSTRAP_SUNNY_CORE.md`
   - Funcion: contexto minimo del Sunny Core.
   - Motivo: define como iniciar sin cargar memoria total.

2. `state/deckard/01_CANON.md`
   - Funcion: reglas estables y limites de canon.
   - Motivo: fija que NotebookLM digiere fuentes y no decide canon.

3. `state/deckard/05_WORK_PACKETS.md`
   - Funcion: backlog operativo de piezas pequenas.
   - Motivo: contiene WP-007 y los siguientes paquetes abiertos.

## Restricciones

- No usar material clinico.
- No usar trading.
- No usar sesiones personales.
- No elevar salidas a CANON, N4 o N5.
- No mezclar con Drive completo ni Bitacora completa.

## Salida Esperada

- Sintesis breve de 5 a 8 bullets.
- Tabla de candidatos Deckard.
- JSON de candidatos con estados permitidos:
  ACTIVO, CUARENTENA, LEGACY, DUPLICADO, BASURA.

## Proxima Accion

1. Revisar `NLM-20260523-01_candidates.json`.
2. Decidir si `PIECE-0001` y `PIECE-0002` pasan a inventario activo.
3. Mantener `quarantine_flags` como guardia de dominio.

## Ejecucion

- Cuaderno NotebookLM:
  `https://notebooklm.google.com/notebook/dd18f429-974c-4993-ab50-acd592992917`
- Fuentes cargadas: 3
- Output local: `NLM-20260523-01_output.md`
- Candidatos locales: `NLM-20260523-01_candidates.json`
- Nota guardada dentro del cuaderno: si
