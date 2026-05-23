# 01_CANON

Version: 0.1
Estado: canon minimo
Ultima actualizacion: 2026-05-01

## Decisiones estables

1. Sunny Core es la fuente de verdad del sistema.
2. Drive es espejo, archivo compartido y superficie de navegacion.
3. GAS es adaptador Google legacy activo, no cerebro.
4. PuenteDeMando es consola operacional, no memoria total.
5. NotebookLM digiere fuentes; no decide canon.
6. WorkFlowy mapea pensamiento; no es archivo final.
7. n8n automatiza piezas clasificadas; no interpreta caos.
8. Claude es taller de produccion larga; no debe cargar memoria total.
9. Codex/ChatGPT puede hacer cirugia tactica y crear artefactos versionables.
10. Todo output importante termina en handoff.
11. Todo documento util debe tener pilar, estado, fuente y nivel de certeza.
12. Material clinico, trading y personal no se mezclan con canon general.

## Regla Deckard de certeza

- `N0`: vision o intuicion sin externalizar.
- `N1`: chat crudo o fuente no verificada.
- `N2`: sintesis provisional.
- `N3`: documento estructurado.
- `N4`: documento auditado.
- `N5`: protocolo consolidado y repetible.

No se eleva una pieza a `N4` o `N5` por elegancia narrativa. Necesita criterio,
fuente y auditoria.

## Membrana minima

Toda pieza nueva debe pasar por:

`INBOX -> CUARENTENA o ACTIVO -> CANON / LEGACY / DUPLICADO / BASURA`

## Principio de automatizacion

Antes de n8n en produccion, cada workflow debe responder:

- Que lee.
- Que escribe.
- Que puede tocar.
- Que no puede tocar.
- Donde deja log.
- Como se revierte.
- Que pasa si falla.

Si falta una respuesta, el workflow queda en `DRY_RUN`.

## Regla de ingestion

No se integra todo. Se pregunta a cada pieza:

`manda, ayuda, espera, estorba o debe aislarse`.

Solo `manda` se vuelve CANON.
