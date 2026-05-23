# NLM-20260523-02 Manifest

Estado: ready_to_run
Dominio: sistema
Contrato: state/deckard/WP-007_NOTEBOOKLM_PROMPT_CONTRACT.md
Batch anterior: NLM-20260523-01

## Objetivo

Extraer las piezas canonicas del cuaderno NLM-SYS-SUNNY_CORE_MIGRATION_PLAN__CORE_CANDIDATE:
decisiones locked-in, Escala Deckard N0-N5, protocolo de limpieza de humo y reglas de trazabilidad.
Comparar resultado contra candidatos de NLM-20260523-01.

## Fuentes del Lote

1. N2-PEN-SIS - 05 PLAN MIGRACION DECKARD 20260507T125533Z
   Drive ID: 1UCTDAIjhkLfjSuCgrGzySbXl9JjXbSTk
   Funcion: Plan de migracion principal con decisiones locked-in.

2. N2-PEN-NEX - 004 escala deckard certeza epistemica
   Drive ID: 19t6K5K2pUwRIpATkqN1g7ln42qhMlwuQ
   Funcion: Definicion formal de la escala N0-N5.

3. N2-PEN-NEX - 003 deckard segundo cerebro operativo
   Drive ID: 18OAcXO2F8S8aN8vbKbeT5Pm_iEVOdt4n
   Funcion: Deckard como sistema operativo de segundo cerebro.

4. N4-ACT-SIS - Sunny Core Architecture SUN-0002
   Drive ID: 19VC0NDhIDDpc2a17SNt8dmvcOaNVOvwB
   Funcion: Decisiones arquitectonicas locked-in del Sunny Core.

## Restricciones

- No usar material clinico, trading ni sesiones personales.
- No elevar salidas a CANON, N4 o N5.

## Proxima Accion

1. Abrir NotebookLM, crear cuaderno NLM-20260523-02_migracion_deckard_canon.
2. Cargar las 4 fuentes por Drive ID.
3. Pegar el prompt de NLM-20260523-02_prompt.md.
4. Guardar output en NLM-20260523-02_output.md.
