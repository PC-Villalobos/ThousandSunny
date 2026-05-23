# NotebookLM Batch Template - WP-007

Batch ID: NLM-YYYYMMDD-XX
Estado: draft
Dominio: sistema
Owner: Claude Code / Codex

## Objetivo

[Una pregunta concreta. Ejemplo: extraer candidatos operativos para mejorar la
membrana Sunny Core sin canonizar.]

## Fuentes

1. `[TITULO]` - `[RUTA_O_URL]`
2. `[TITULO]` - `[RUTA_O_URL]`
3. `[TITULO]` - `[RUTA_O_URL]`

Opcionales:

4. `[TITULO]` - `[RUTA_O_URL]`
5. `[TITULO]` - `[RUTA_O_URL]`

## Restricciones

- No usar material clinico sin autorizacion explicita.
- No usar trading en lotes de sistema.
- No mezclar personal con canon general.
- No pedir a NotebookLM que reconstruya todo el sistema.
- No aceptar `CANON`, `N4` o `N5` como salida de NotebookLM.

## Prompt NotebookLM

```text
Actua como digestor de fuentes, no como autoridad canonica.

Objetivo del lote:
[OBJETIVO]

Fuentes del lote:
[FUENTES]

Reglas:
1. No intentes reconstruir "todo el sistema".
2. No canonices nada.
3. No asumas contexto externo fuera de estas fuentes.
4. Si una fuente mezcla dominios sensibles, marcala como CUARENTENA.
5. Si dos fuentes repiten la misma idea, marca DUPLICADO y explica cual parece primaria.
6. Usa niveles de certeza solo entre N1, N2 y N3.
7. Nunca uses N4, N5 ni CANON.
8. Toda afirmacion importante debe apuntar a una fuente concreta.

Devuelve:
SECCION A - Sintesis breve.
SECCION B - Candidatos Deckard en tabla.
SECCION C - JSON con candidates, open_questions y quarantine_flags.
```

## Resultado NotebookLM

Pegar o enlazar aqui la salida exportada:

`[RUTA_O_URL_OUTPUT]`

## Handoff Claude Code

Contexto:

Decision:

Continuidad:

Session ref:
