# 00_BOOTSTRAP_SUNNY_CORE

Version: 0.1
Estado: canon minimo
Ultima actualizacion: 2026-05-01

## Que es este sistema

Sunny Core es la fuente canonica local del Thousand Sunny: misiones, estado,
handoffs, feed, cuarentena, actores y contratos. Drive es memoria compartida y
espejo navegable; no es la autoridad final.

## Regla de entrada

Ningun modelo recibe "todo el sistema". Cada IA recibe solo:

1. Este bootstrap.
2. Un work packet concreto.
3. Las fuentes necesarias para esa tarea.
4. Un formato de salida obligatorio.
5. Un handoff final.

## Que no se toca sin permiso

- Material clinico o de pacientes.
- Sesiones personales con nombres propios.
- Trading o finanzas personales.
- Tokens, claves, Script Properties o credenciales.
- Organizacion masiva de Drive.
- Automatizaciones n8n con escritura real si no estan en dry-run validado.

## Dominios

- `sistema`: arquitectura, protocolos, Core, Drive, GAS, n8n, NotebookLM.
- `clinica`: Nemesis, casos, sesiones, evaluaciones, pacientes.
- `trading`: diario, lecciones, datos financieros.
- `narrativa`: identidad, simbolico, escritura.
- `operativo`: tareas personales, calendario, preparacion.
- `archivo`: historico o legacy.

## Estados de piezas

- `CANON`: regla activa.
- `ACTIVO`: util en curso.
- `CUARENTENA`: sensible, clinico, personal o dudoso.
- `LEGACY`: historico, ya no manda.
- `DUPLICADO`: copia de fuente mejor.
- `BASURA`: ruido eliminable cuando el Capitan lo apruebe.

## Herramientas y rango

- Sunny Core: canon y estado.
- Drive: espejo y memoria compartida.
- WorkFlowy: mapa provisional.
- NotebookLM: digestion de fuentes, no canon.
- Claude: taller de produccion larga.
- ChatGPT/Codex: cirugia tactica, protocolos, artefactos.
- Gemini: ecosistema Google.
- n8n: automatizacion solo sobre piezas ya clasificadas.

## Cierre obligatorio

Todo trabajo importante cierra con handoff:

- `contexto`: marco y tension inicial.
- `decision`: decision clave y por que.
- `continuidad`: siguiente accion y responsable.
- `session_ref`: fecha ISO, actor, interfaz e ID si existe.

## Tri-Log

Al cerrar una mision, registrar:

- `Log`: que se hizo.
- `Sombra`: riesgo, coste o tension no resuelta.
- `Glitch`: fallo recurrente o punto fragil.

## Principio operativo

Menos contexto, mejor empaquetado. El sistema no necesita que una IA recuerde
todo; necesita saber donde mirar, que pieza tocar y como devolverla al canon.
