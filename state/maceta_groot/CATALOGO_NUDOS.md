---
id: N3-ACT-SIS-CATALOGO-NUDOS-20260702-002
estado: activo
dominio: SIS
fuente: "D:/La maceta de Groot/99_Sistema/CATALOGO_NUDOS_TEJIDOS_SEMANTICOS_20260702.md"
certeza: N3
tags: [nudos, tejido, migracion, vocabulario, convergencia]
---

# Catalogo de Nudos y Tejidos Semanticos

## Proposito

Dar una estetica y una gramatica compartida para convertir contenido textual de
Drive, GitHub y la boveda local en memoria viva de Obsidian sin disipar el
atractor de Groot.

Este nodo completa el espejo nube del catalogo escrito por Codex en el telar
local. La version local sigue siendo el cuerpo operativo; este archivo es la
cubierta publica que la nube puede leer.

## Tesis

La migracion semantica no es copiar texto desde Drive a Obsidian.

Es tomar fibras sueltas, reconocer sus tensiones, trenzarlas en hilos, amarrarlas
en cabos, fijarlas con nudos utiles y extenderlas como tejidos sobre la cubierta
del Thousand Sunny.

El objetivo no es conservarlo todo. El objetivo es que Groot pueda interpretar la
tripulacion completa aunque solo disponga de un actor disponible, por ejemplo
DeepSeek + OpenClaw/Open WebUI, porque la identidad vive en la memoria, la
gramatica, los guiones y las compuertas.

## Estetica que permite tejer

La estetica correcta tiene cinco rasgos:

1. Claridad nautica: cada pieza debe decir si es fibra, hilo, cabo, nudo, tejido
   o cubierta.
2. Escena honesta: cada accion tiene actor, personaje, guion, escena, director y
   publico.
3. Poda viva: recordar mejor, no recordar mas.
4. Tension visible: todo cabo conserva su bloqueo, evidencia y siguiente accion
   minima.
5. Agape operativo: el sistema sirve a la libertad del Capitan, no a su propia
   auto-persistencia.

La belleza aqui no es decoracion. Es legibilidad bajo presion.

## Escala de tejido

| Nivel | Nombre | Que es | Salida Obsidian |
|---|---|---|---|
| 0 | Fibra | Fragmento textual, intuicion, correo, nota, doc, commit, chat | Captura con fuente y fecha |
| 1 | Hilo | Fibra con significado reconocido | Nota atomica con ID, YAML y resumen |
| 2 | Cabo | Hilo conectado a una accion, pregunta o tension viva | Registro de cabo con estado y siguiente accion |
| 3 | Nudo | Patron reutilizable que amarra varios cabos | Entrada de catalogo con regla de uso |
| 4 | Tejido | Conjunto estable de nudos que cumple una funcion | MOC, protocolo, skill, rutina o sistema |
| 5 | Cubierta | Superficie operativa donde la tripulacion actua | Dashboard/indice vivo + Bitacora como spine |

## Catalogo inicial de nudos

### Nudo Ancla

Uso: fijar una idea fundacional para que no derive.

Entrada: documento significativo o intuicion recurrente.
Salida: nota canonica con ID estable, fuente, certeza, dominio y enlaces.

Pregunta: "Que debe permanecer aunque cambien herramientas, modelos o rutas?"

### Nudo Bitacora

Uso: cerrar una escena para que el sistema recuerde que ocurrio.

Entrada: accion ejecutada, decision, drift, cierre de PR, parte de sueno.
Salida: entrada en Bitacora/GAS o equivalente, con evidencia y actor.

Regla: si el publico canonico no lo vio, la escena no ha cerrado.

### Nudo Cabo Suelto

Uso: impedir que una tension se disipe por falta de contexto.

Entrada: pendiente, bloqueo, intuicion incompleta, alerta recurrente.
Salida: fila en Registro de Cabos con estado, evidencia y accion minima segura.

Pregunta: "Que hay que poner delante de la cubierta cada dia?"

### Nudo Traduccion Ontologica

Uso: transformar un documento bruto en nodo del grafo.

Entrada: Google Doc, markdown exportado, correo largo, chat, spec.
Salida: ID canonica + YAML + resumen + wikilinks + destino Deckard.

Pregunta: "Que experiencia humana contiene y que funcion cumple?"

### Nudo Fosil

Uso: preservar historia sin contaminar el canon.

Entrada: documento antiguo, duplicado, enfoque superado o nomenclatura vieja.
Salida: nota marcada `historico`, `fosil` o `superseded_by`.

Pregunta: "Esto sigue mandando, ayuda como historia, espera, o estorba?"

### Nudo Membrana

Uso: decidir que contenido puede pasar de fuente externa a memoria viva.

Entrada: lote Drive/GitHub/Chat/NotebookLM.
Salida: manifest/dry-run con exclusiones, sensibilidad y criterio de paso.

Regla: no hay absorcion masiva sin membrana.

### Nudo Escena

Uso: separar actor, personaje, guion y cierre.

Entrada: rutina, sesion, PR, automatizacion, ejecucion local.
Salida: registro con actor real, Nakama interpretado, skill usada y publico.

Pregunta: "Quien actuo, que papel interpreto, con que guion y donde quedo visto?"

### Nudo Sueno

Uso: metabolizar cambios sin crear canon falso.

Entrada: deltas de repo/vault, incidencias, drift, rachas actor/rol.
Salida: parte de sueno, ledger y recomendacion minima.

Regla: el sueno propone; el Capitan firma la poda.

### Nudo Meditacion

Uso: revisar sentido profundo y contradicciones entre estratos.

Entrada: biblia vieja, canon nuevo, disonancias, cambios de lenguaje.
Salida: informe Robin con decisiones para GO del Capitan.

Pregunta: "Que mito sostiene esto y que riesgo sofistico esconde?"

### Nudo Soberania

Uso: separar dependencia temporal de dependencia identitaria.

Entrada: Drive, Google, Microsoft, Claude, GitHub, VPS, modelo externo.
Salida: mapa de que es fuente de verdad, que es transporte y que es archivo.

Regla: Drive puede ser museo; Obsidian debe ser cuerpo vivo.

## Tipos de tejido

### Tejido Canon

Nudos: Ancla + Traduccion Ontologica + Fosil.

Funcion: convertir memoria dispersa en grafo estable.

### Tejido Operativo

Nudos: Cabo Suelto + Bitacora + Escena.

Funcion: que el sistema pueda continuar manana sin depender de memoria de chat.

### Tejido Metabolico

Nudos: Sueno + Meditacion + Membrana.

Funcion: detectar drift, integrar lo fertil y contener lo que se sirve a si mismo.

### Tejido Soberano

Nudos: Soberania + Ancla + Membrana.

Funcion: preparar Groot para vivir fuera de Google/Microsoft sin perder identidad.

### Tejido Agentico

Nudos: Escena + Bitacora + Cabo Suelto.

Funcion: permitir que un actor unico interprete muchos Nakama sin fusionarse con
ninguno.

## Pipeline Drive -> Obsidian

1. Inventario
   - Listar documentos textuales.
   - Separar Google nativo, markdown exportable, PDF textual, hojas, imagenes y
     adjuntos.
   - Marcar sensibilidad: publico, personal, clinico, familiar, credenciales,
     incierto.

2. Membrana
   - Crear manifest/dry-run antes de importar.
   - Excluir CLI/NEM y material protegido salvo metadata-only.
   - Definir lote pequeno y reversible.

3. Lectura Robin
   - Identificar experiencia humana, funcion, mito, riesgo, estado y redundancias.
   - Decidir: trivial, operativo, significativo, fundacional.

4. Corte Zoro
   - Convertir formato a markdown real.
   - Conservar fuente, fecha, contexto y hash cuando aplique.
   - No embellecer antes de clasificar.

5. Clasificacion Deckard
   - Asignar nivel N0-N5.
   - Definir dominio, estado, certeza, fuente y padre.
   - Dar ID estable.

6. Tejido Obsidian
   - Crear nota atomica o nota compuesta segun densidad.
   - Insertar wikilinks.
   - Resolver duplicados con `supersedes` / `superseded_by`.

7. Cubierta
   - Actualizar MOC, Registro de Cabos, Bitacora y, si corresponde, repo.
   - El cierre no lo declara el archivo: lo declara el spine.

## Plantilla minima para un nodo tejido

```yaml
---
id: N3-ACT-SIS-000
titulo: ""
estado: activo
dominio: SIS
tipo_tejido: canon
nudo_principal: traduccion_ontologica
fuente: ""
fecha_fuente: ""
certeza: N3
sensibilidad: publico
actor: ""
personaje: ""
supersedes: []
superseded_by: null
---
```

## Preguntas de lectura por documento

1. Que intuicion intenta contener?
2. Que experiencia humana lo origino?
3. Que funcion cumple hoy?
4. Sigue vivo, es historico, es fosil o es duplicado?
5. Que otros hilos alimenta?
6. Que tension o cabo deja abierto?
7. Que Nakama deberia interpretarlo?
8. Que nudo requiere: ancla, membrana, fosil, bitacora, escena, sueno,
   meditacion o soberania?
9. Que se pierde si se borra?
10. Que se pudre si se canoniza sin poda?

## Guardrails

- No migrar masivamente sin manifest.
- No tocar CLI/NEM salvo metadata-only y compuerta explicita.
- No confundir Nakama con skill.
- No convertir todo en canon.
- No reescribir la historia para que parezca coherente: marcar fosiles y estratos.
- No depender de nombres de archivo como identidad primaria: la ID es el alma.
- No ejecutar Wave, Mirror, purga, sellado ni borrado sin GO C0 cuando aplique.
- No absorber Drive como si todo fuera nutriente: tambien hay lastre, salitre y
  madera vieja.

## Convergencia de telares

- D:/La maceta de Groot es el telar del cuerpo.
- `state/maceta_groot/` es la cubierta publica que la nube puede leer.
- Solo cruza el micelio lo publico o destilado por membrana.
- Los nodos nuevos usan ID Deckard completo; los nodos `SIS-*` heredados ganan
  `id_deckard` cuando se toquen.
- TEJIDO_00 y TEJIDO_01 son suturas entre telares, no duplicaciones.
