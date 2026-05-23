# WP-007 - NotebookLM Prompt Contract

Version: 0.1
Estado: operativo
Fecha local: 2026-05-23
Owner: ChatGPT / Nami
Executor: Codex / Usopp

## Proposito

Conectar Claude Code con NotebookLM sin convertir NotebookLM en memoria total,
autoridad canonica ni chat general del sistema.

NotebookLM se usa como digestor de fuentes: resume, contrasta y propone
candidatos. Sunny Core decide canon.

## Regla Madre

NotebookLM no recibe "todo mi sistema".

Cada ejecucion recibe un lote pequeno, cerrado y nombrado:

- 3 a 5 fuentes por lote.
- Solo una pregunta de trabajo.
- Un manifiesto de fuentes.
- Un prompt fijo.
- Una salida con candidatos, no decisiones canonicas.

## Rutas Permitidas

### Ruta A - NotebookLM Enterprise API

Usar solo si el Capitan tiene habilitado Google Cloud / Gemini Enterprise con
NotebookLM Enterprise.

Flujo:

1. Claude Code prepara `WP-007_NOTEBOOKLM_BATCH_TEMPLATE.md`.
2. Claude Code genera o localiza las fuentes en Drive/local.
3. Autenticacion local: `gcloud auth login --enable-gdrive-access`.
4. Crear notebook mediante API Enterprise.
5. Anadir fuentes mediante `notebooks.sources.batchCreate` o `uploadFile`.
6. Guardar el resultado en Sunny Core como handoff.

Guardia: no usar esta ruta si no hay proyecto Google Cloud, numero de proyecto,
location y permisos Enterprise confirmados.

### Ruta B - NotebookLM normal por navegador local

Ruta por defecto para cuenta normal.

Flujo:

1. Claude Code prepara una carpeta/lote con 3 a 5 fuentes y un manifiesto.
2. El Capitan o el navegador local abre NotebookLM.
3. Se crea o abre un cuaderno con nombre `NLM_YYYYMMDD_<tema>`.
4. Se anaden las fuentes.
5. Se pega el prompt fijo de este contrato.
6. La respuesta de NotebookLM se guarda como nota o se exporta a Drive.
7. Claude Code ingiere solo el output exportado/pasteado y lo convierte en
   candidatos Deckard.

Guardia: si no hay automatizacion de navegador fiable, no se fuerza. Se entrega
un paquete listo para pegar.

## Entradas

Cada lote debe incluir:

- `batch_id`: `NLM-YYYYMMDD-XX`
- `tema`: pregunta operativa concreta.
- `fuentes`: 3 a 5 rutas o URLs.
- `dominio`: sistema, operativo, academico, narrativa, archivo, clinica,
  trading o personal.
- `restricciones`: datos que no deben cruzar dominio.
- `salida_esperada`: tabla + JSON de candidatos.

## Prohibido

- Pedir a NotebookLM "entiende todo mi sistema".
- Mezclar material clinico, trading o personal con canon general.
- Elevar salidas de NotebookLM a `CANON`, `N4` o `N5`.
- Usar respuestas de NotebookLM sin trazabilidad a fuentes.
- Tratar duplicados generados por NotebookLM como piezas nuevas.
- Pedir conclusiones sobre identidad, salud, pacientes o finanzas sin
  frontera explicita del dominio.

## Prompt Fijo Para NotebookLM

```text
Actua como digestor de fuentes, no como autoridad canonica.

Objetivo del lote:
[OBJETIVO_CONCRETO]

Fuentes del lote:
[LISTA_DE_3_A_5_FUENTES]

Reglas:
1. No intentes reconstruir "todo el sistema".
2. No canonices nada.
3. No asumas contexto externo fuera de estas fuentes.
4. Si una fuente mezcla dominios sensibles, marcala como CUARENTENA.
5. Si dos fuentes repiten la misma idea, marca DUPLICADO y explica cual parece primaria.
6. Usa niveles de certeza solo entre N1, N2 y N3.
7. Nunca uses N4, N5 ni CANON.
8. Toda afirmacion importante debe apuntar a una fuente concreta.

Devuelve dos secciones:

SECCION A - Sintesis breve
- 5 a 8 bullets maximo.
- Solo lo que este soportado por las fuentes.
- Indica dudas o huecos.

SECCION B - Candidatos Deckard
Devuelve una tabla con estas columnas:
- source_id provisional
- titulo
- tipo
- pilar
- resumen
- nivel_certeza
- estado_sugerido
- fuente_base
- razon
- accion_siguiente

Estados permitidos:
ACTIVO, CUARENTENA, LEGACY, DUPLICADO, BASURA.

Al final devuelve tambien un bloque JSON con esta forma:

{
  "batch_id": "[BATCH_ID]",
  "objective": "[OBJETIVO_CONCRETO]",
  "candidates": [
    {
      "source_id": "PIECE-0000",
      "title": "",
      "type": "",
      "pillar": "",
      "summary": "",
      "certainty_level": "N2",
      "status": "ACTIVO",
      "source_url": "",
      "allowed_actions": ["resumir", "comparar", "proponer"],
      "forbidden_actions": ["canonizar", "mezclar_dominios"],
      "next_action": ""
    }
  ],
  "open_questions": [],
  "quarantine_flags": []
}
```

## Prompt Para Claude Code Antes De NotebookLM

```text
Prepara un lote NotebookLM segun WP-007.

Tema: [TEMA]
Dominio: [DOMINIO]
Fuentes candidatas: [RUTAS_O_URLS]

Tareas:
1. Selecciona maximo 5 fuentes.
2. Rechaza material clinico, trading o personal si no esta autorizado.
3. Genera un manifiesto `NLM-YYYYMMDD-XX_manifest.md`.
4. Genera el prompt NotebookLM final con objetivo, fuentes y restricciones.
5. No llames a NotebookLM si falta autorizacion o si el lote mezcla dominios.
```

## Prompt Para Claude Code Despues De NotebookLM

```text
Ingiere esta salida de NotebookLM bajo WP-007.

Reglas:
1. Tratar la salida como N2 maximo salvo evidencia estructurada N3.
2. No canonizar.
3. Validar contra `04_PIEZAS_SCHEMA.json`.
4. Marcar duplicados y cuarentena.
5. Crear handoff con contexto, decision y continuidad.

Salida NotebookLM:
[PEGAR_OUTPUT]
```

## Salida Esperada En Sunny Core

Cada ejecucion genera:

- `state/notebooklm/NLM-YYYYMMDD-XX_manifest.md`
- `state/notebooklm/NLM-YYYYMMDD-XX_prompt.md`
- `state/notebooklm/NLM-YYYYMMDD-XX_output.md`
- `state/notebooklm/NLM-YYYYMMDD-XX_candidates.json`
- handoff registrado en Bitacora si el lote produce accion.

## Criterio De Exito

WP-007 esta funcionando cuando:

1. Claude Code puede preparar un lote en menos de 5 minutos.
2. NotebookLM recibe fuentes limitadas y devuelve candidatos trazables.
3. Ningun output de NotebookLM entra a canon sin revision humana o Nami/Robin.
4. El resultado puede convertirse en piezas Deckard sin cargar memoria total.

## Handoff

Contexto: el Puente de Mando quedo reparado, pero no es la via correcta para
NotebookLM. La via correcta es lote pequeno, prompt fijo y retorno como
candidatos.

Decision: NotebookLM queda como digestor externo. Sunny Core mantiene la fuente
de verdad.

Continuidad: ejecutar un primer lote piloto no sensible con 3 fuentes del dominio
`sistema` y guardar `NLM-20260523-01`.

Session ref: 2026-05-23 | Codex / Usopp | WP-007
