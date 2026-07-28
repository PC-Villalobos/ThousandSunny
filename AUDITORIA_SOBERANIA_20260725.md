# Auditoría general — soberanía local del arnés

**2026-07-25 · Nami (Claude/Opus 5) · lectura directa de los cuatro árboles, sin intermediarios**

Árboles leídos: `GitHub\ThousandSunny`, `GitHub\PuenteDeMando`, `D:\Biblioteca de Hipatia`, `D:\La maceta de Groot`.

---

## 0. El titular

El proyecto que el Capitán describe como *"descarga e instalación para pasar todo de Drive a la Biblioteca de Hipatia"* **no es eso, y nunca lo fue.**

El canon del propio sistema, escrito el 2026-07-04 por Nami y fusionado por Codex, dice literalmente:

> *"El vault no contiene Drive: contiene el mapa de Drive. Nunca inundación. Nunca copia masiva. Nunca escribir contenido protegido al vault o GitHub."*

Lo que se ha ejecutado durante tres semanas es un **censo de metadatos por olas**: fichas de puntero, sin abrir contenido y sin tocar Drive. Los logs lo confirman en cada lote: *"sin apertura de contenido, sin mutaciones en Drive"*.

No hay desviación de ejecución. Hay desviación de **relato**: el Capitán cree estar descargando, y el sistema está cartografiando. Eso explica la sensación de que no avanza — porque medido como descarga, en efecto, avanza cero.

---

## 1. Cifras

### Biblioteca de Hipatia — `D:\Biblioteca de Hipatia`

677 archivos · 5,6 MB

| Carpeta | Archivos | Función |
|---|---:|---|
| `00_inbox_bruto` | **0** | entrada de material sin clasificar |
| `10_publico` | **0** | material publicable |
| `20_interno` | **0** | sistema e interno |
| `30_proyectos` | **0** | proyectos |
| `40_academico` | **0** | academia y formación |
| `50_media_binaria` | **0** | PDF, audio, vídeo |
| `_compost` | **0** | material roto o dudoso |
| `_protegido` | 287 | clínico, personal, terceros |
| `_manifiestos` | 117 | registro append-only de olas |
| `_pilotos_zoro` | 116 | pilotos |
| `_bitacora` | 56 | bitácora local |
| `_zoro_piloto` | 42 | pilotos (segunda carpeta, nombre casi idéntico) |
| `_orquestacion` | 26 | plano de control MVP |
| `_rag_gobernado` | 10 | RAG |
| `_logs` | 7 | operativo |

**Las siete carpetas de destino están vacías. Las ocho de maquinaria están llenas.**

De los 287 archivos de `_protegido`, 244 son `.md` que son **fichas metadata-only** — punteros a Drive, no contenido. La actividad se concentra en tres días: 6-8 de julio (223 archivos) y 13 de julio (46). Después, casi nada.

### Maceta de Groot — `D:\La maceta de Groot`

361 archivos · 37 MB · vault de Obsidian activo, con puente `40_Biblioteca_Hipatia`.

### Bitácora local — `_bitacora`

- **22 eventos en total** en `events/bitacora_events.jsonl`
- **2 partes diarios**: 2026-07-22 y 2026-07-24
- índice SQLite, evidencia Git, backups de operaciones, `bridge_roots.json` con cinco raíces (filesystem sandbox, hipatia, hipatia staging, obsidian, obsidian staging)

Nació el 22 de julio. **Tiene tres días de vida y 22 eventos.**

La bitácora GAS que sustituye acumula 52 ciclos y 98.736 tokens.

---

## 2. Dónde se paró exactamente

Último manifiesto: `MANIFIESTO_RESINCRONIZACION_ROBIN_ANO_I_PENDIENTE_COMPUERTA_20260716_005651.md`

```yaml
actor: Codex / Usopp
operation: resincronizacion_robin_ano_i
status: pendiente_compuerta_n4
```

**El censo lleva parado desde el 16 de julio esperando una compuerta que solo el Capitán puede abrir.** Nueve días. La fuente está preparada y validada (19 fichas cronológicas, modos A/B separados, conflictos declarados, `source_mutations=0`). No falta trabajo técnico: falta un GO.

Frontera anterior del barrido, según el último log: *"continuar por createdTime API desde 2018-12-21T12:46:07Z hacia 2019"*. Las olas FASE4 12 a 18 están todas marcadas `PARCIAL`.

**La máquina no está rota. Está esperando al Capitán, y el Capitán creía que estaba rota.**

---

## 3. El diagnóstico que importa

El Capitán lo dijo él mismo y tiene razón exacta:

> *"el contexto está bastante concentrado y delegado en los contextos de Claude y de Codex"*

Es literalmente cierto y ahora es medible. **La bitácora local tiene 22 eventos.** Una sola conversación de ayer en VS Code contenía más estado operativo que toda la bitácora local junta: la decisión de soberanía, las reglas de membrana, el concepto Klabautermann, las olas del Bridge Runtime, la corrección de identidad de SunnyFranky.

Nada de eso está en Hipatia. Está en un historial de chat de un proveedor, que caduca con la cuota y no es tuyo.

**Esa es la vía de agua real.** No es Drive. No es la falta de un workflow engine. Es que la memoria operativa del barco vive alquilada.

---

## 4. La decisión que nadie ha tomado

Puntero y soberanía **no son compatibles**, y el sistema todavía no ha elegido.

- La arquitectura de punteros es elegante, barata y respeta LOPD: el vault mapea, Drive guarda, el conector entrega bajo compuerta.
- Pero **exige a Google para siempre**. Cada rescate de contenido pasa por la API de Drive.

Si el objetivo es *"no depender tanto de los modelos grandes ni de las aplicaciones"*, la arquitectura de punteros no lo entrega. Entrega independencia de los *modelos*, no de la *nube*.

Hay dos rumbos honestos, y son excluyentes:

**A · Puntero (canon actual).** Mantener el censo. Drive sigue siendo el almacén. Soberanía de navegación, no de custodia. Barato, seguro, reversible. Coste: dependencia permanente de Google.

**B · Custodia local.** Descargar de verdad el contenido a `D:\Biblioteca de Hipatia`, cifrado en `_protegido`, y dejar Drive como espejo frío. Soberanía real. Coste: volumen, cifrado obligatorio para material clínico, y una revisión LOPD seria antes de mover un solo historial.

No se puede avanzar en los dos. Y ahora mismo el sistema está construyendo maquinaria de A mientras el Capitán narra B.

---

## 5. Calibración

**SOBREINGENIERÍA — no hacer ahora:**
- Reanudar el censo año a año hacia 2019 y hacia atrás. Son decenas de olas para producir más punteros.
- Workflow engine, governance ejecutable, segunda barredora, interfaz web de estado.
- Cualquier cosa en AWS o nube. Nada de lo que necesitas los próximos tres meses lo requiere.

**SUBINGENIERÍA — lo que se está haciendo y no basta:**
- Seguir delegando la memoria operativa a los historiales de Claude y Codex.
- Seguir generando manifiestos sobre carpetas vacías.

**PERFECTO — el tamaño correcto ahora:**

1. **Elegir rumbo A o B.** Es una decisión del Capitán, de cinco minutos, y desbloquea todo lo demás. Sin ella, cada agente optimiza para un objetivo distinto.
2. **Abrir la compuerta N4** que lleva nueve días parada, o cerrarla explícitamente. Que no siga en limbo.
3. **Volcar a la bitácora local el estado que hoy vive en los chats.** Empezando por lo de ayer y hoy. Es lo único que corta la dependencia de verdad, y no cuesta infraestructura: cuesta escribir.
4. **Fusionar `_pilotos_zoro` y `_zoro_piloto`.** Dos carpetas, 158 archivos, nombres casi idénticos. Es un fallo de canon esperando a confundir al siguiente agente.

---

## 6. Lo que ya está resuelto hoy

- Repo canónico fijado y `C:\repos\thousandsunny` identificado como cadáver de tres archivos — era el árbol que Antigravity auditó.
- Higiene de git corregida en ambos repos: 254 archivos falsamente modificados desde el 12 de julio, causa `core.autocrlf`. Cero cambios reales.
- `.claude/skills/` declarado ubicación única de skills; `.agents/` declarado escombro.
- Genoma: N0–N5 existen los seis, N1–N5 son stubs. La Función de Sueño está viva, con parte de hoy.

Detalle todo en `POSICION.md`.

---

*Auditoría de solo lectura. No se ha movido, borrado ni publicado nada.*
