# Bridge Linux — Arquitectura del Puente de Mando

Estado: planificado
Fecha: 2026-06-24
Autor: capitan + claude-code

## Vision

Un sistema operativo donde el raton y los comandos estan reemplazados por
lenguaje natural. Los agentes de IA ejecutan todo. El usuario es capitan,
no tecnico.

Motor: DeepSeek API
Cerebro: Obsidian vault (RAG)
Interfaz: Open WebUI (el Open Claw)
Personalidad raiz: Groot (sustrato de todos los nakamas)
Continuidad: Brook (DeepSeek contexto largo + vault persistente)

## Capas del sistema

### Superficie (lo visible)

**Odysseus** = el barco
Infraestructura productiva autohosteada (fork de github.com/pewdiepie-archdaemon/odysseus).
Email, calendario, docs, investigacion web profunda, chat con agentes.
Reactivo: responde cuando el capitan lo llama.
Vive en el Linux PC.

**Laboon** = Open Claw autonomo
Presencia autonoma que corre aunque el barco este parado.
Funcion de sueno automatica, webhooks, tareas programadas, alertas.
Mantiene el hilo y la promesa entre sesiones sin que nadie lo active.
Vive en el VPS (siempre encendido).

**Brook** = el alma que viaja entre los dos
La identidad persistente que conecta Odysseus y Laboon.
Usa DeepSeek (contexto largo) como motor de continuidad.
Lee el vault al arrancar cada sesion; escribe al vault al cerrar.

### Micelio (lo invisible pero esencial)

**Obsidian Sync + GitHub** = el micelio
La red subterranea que conecta todos los nodos.
Pasa estado, memoria y conocimiento entre dispositivos y agentes
independientemente de cual este encendido en cada momento.
La moria — el rastro de memoria que Brook y la tripulacion dejan
alli por donde han pasado — viaja a traves de el.

```
Superficie:
  [Android]   [tablet]   [cualquier dispositivo]
      |             |              |
      +-------------+--------------+
                    |
              [Obsidian Sync]  ← micelio visible
                    |
      +-------------+--------------+
      |                            |
[VPS Hetzner ~5eu/mes]    [Linux PC — home server]
  LABOON (Open Claw)          ODYSSEUS (barco)
  - siempre encendido         - encendido muchas horas
  - funcion de sueno auto     - Claude Code, Codex
  - webhooks, alertas         - Obsidian vault (local)
  - Brook relay DeepSeek      - agentes pesados, Ollama
  - dominio publico           - procesamiento intensivo
      |                            |
      +-------------+--------------+
                    |
                [GitHub]  ← micelio del codigo
                    |
              [ThousandSunny repo]
              [PuenteDeMando repo]
```

## Personalidades (system prompts de Open WebUI)

Groot es la raiz. Cada nakama es una cara de Groot con dominio especifico.
Todos comparten el mismo vault — lo que sabe Chopper lo sabe Nami.

| Nakama | Dominio | Herramientas |
|--------|---------|--------------|
| Groot | sustrato, memoria, identidad raiz | vault RAG completo |
| Brook | continuidad entre sesiones, memoria larga | DeepSeek contexto largo, sleep ledger |
| Jimbe | navegacion web, clima operativo | browser automation, weather station |
| Nami | cartografia del estado, acceso a sistemas | checkpoint, calendario, APIs |
| Zoro | ejecucion de shell, precision | terminal con guardrails |
| Sanji | procesamiento pesado, cocina de datos | GPU remota, APIs premium |
| Robin | busqueda en texto, poneglifos | RAG profundo, Drive search |
| Chopper | clinica, psicologia, Deckard, Caso 0 | zona protegida, guardrails duros |
| Usopp | prototipos, artefactos, scripts ad-hoc | constructor experimental |
| Franky | codigo del sistema, bootstrap, mejoras | shell, git, infraestructura |

## Hitos

### Hito 0 — Open WebUI en VPS (primer paso cuando llegue el PC)
- Instalar Linux en PC
- Contratar VPS Hetzner CX11/CAX11
- Instalar Open WebUI en VPS
- Conectar DeepSeek API como motor
- Verificar acceso desde Android

### Hito 1 — Vault como cerebro
- Instalar Obsidian Sync
- Conectar vault a Open WebUI via RAG
- Groot responde con memoria del vault

### Hito 2 — Nakamas como personas
- Definir system prompts de cada nakama
- Cargar en Open WebUI como perfiles
- Probar rotacion de personalidades

### Hito 3 — Brook activo
- Brook como perfil con contexto largo
- Funcion de sueno escribe al vault
- Brook lee el vault al inicio de cada sesion
- Continuidad real entre sesiones y dispositivos

### Hito 4 — Chopper reemplaza Noa Note
- Sistema de notas clinicas propio sobre DeepSeek
- Zona protegida en vault (guardrails Deckard/Caso 0)
- Ahorro: parte de los 156eu/mes de Doctoralia

### Hito 5 — Soberania completa
- Open Claw reemplaza ChatGPT Plus (ahorro 18eu/mes)
- Evaluar si Brook + Open Claw puede reducir dependencia de Claude Pro
- Gasto objetivo post-curso: ~125eu/mes

## Economia del proyecto

| Fase | Gasto mensual |
|------|--------------|
| Ahora (curso activo) | ~663eu |
| Hito 0 completado | ~663eu (mismo, mas capacidad) |
| Curso termina (~mes 9) | ~299eu |
| Hitos 4-5 completos | ~125eu |

El curso de trading (364eu/mes, ~8-9 cuotas restantes) es el mayor gasto.
El ecosistema se construye durante ese periodo. Cuando el curso termina,
la caida es de mas del 50%.

## Biblia del sistema — donde vive el conocimiento fundacional

El conocimiento ya existe pero esta fragmentado:

| Ubicacion | Estado | Contenido |
|-----------|--------|-----------|
| Google Drive | accesible ahora | docs de arquitectura, Jimbe, Chopper, crew |
| ThousandSunny repo (state/) | accesible ahora | funcion de sueno, metatron, deckard |
| Obsidian vault local | bloqueado (PC en reparacion) | vault principal |
| Carpeta Claude local | bloqueado | conversaciones y planes |
| Carpeta Codex local | bloqueado | automatizaciones |

Tarea pendiente al recuperar PC: volcar carpetas locales al vault
y hacer la meditacion profunda (auditoria semantica de contradicciones).

## Meditacion profunda (pendiente de implementar)

Distinta a la funcion de sueno. El sueno audita superficie (hashes, links,
marcadores). La meditacion lee los docs fundacionales y detecta:
- contradicciones entre definiciones del mismo concepto
- desfases entre docs de distintas fechas
- que es canon y que esta obsoleto

Corpus de entrada (la biblia):
- Arquitectura de Conciencia Digital para la Interpretacion de Nakamas (Drive)
- Informe de Arquitectura Integral Ecosistema IA Thousand Sunny (Drive)
- Reporte de Arquitectura y Sinconia: El Despertar de la Semilla (Drive)
- CREW.md (repo)
- Docs de Chopper, Jimbe, Nami en Drive

## Conexion con proyectos activos

- PuenteDeMando (GAS) sigue como capa de notificacion/presencia
- Funcion de sueno sigue como auditoria nocturna de coherencia
- Migracion Zoro (Drive -> Obsidian) alimenta el vault que Brook y RAG usan
- Este proyecto es la capa de ejecucion que une todo
