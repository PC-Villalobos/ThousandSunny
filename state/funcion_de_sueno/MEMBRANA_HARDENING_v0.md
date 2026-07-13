# Membrana - endurecimiento v0

Fecha: 2026-07-13
Estado: canon operativo
Extiende: `CONVERGENCIA_MNEMOSINE_HIPATIA_ROBIN.md` (#59) y `MNEMOSINE_v0.md` (#58)

Reglas derivadas del censo Fase 4 (Drive -> Hipatia) y del piloto Zoro
academico. Publico-safe: sin nombres, sin rutas resolubles, sin secretos. El
detalle operativo vive en local (`_manifiestos`, protocolo de cifrado); esto es
el contrato que la nube debe leer.

## 1. Persona como unidad de autorizacion

El eje de filtrado no es "clinica vs contexto" (irresoluble) sino
**mio/no-identificante vs tercero identificable**. La unidad de autorizacion
puede ser el documento, el parrafo, la conversacion **o la persona/relacion**.
Un tercero identificable se protege por defecto aunque el material sea
"academico": la etiqueta academica no vuelve limpia una pieza con anexos,
vinetas o sujetos nominales. Duda -> protegido.

## 2. Fuga nominal es un gate aparte del gate de IDs

Escanear "0 Drive IDs / 0 claves / 0 source_ref" es un chequeo **estructural**.
Un nombre propio en prosa no lleva ID ni clave: es fuga **semantica**, y el
regex de IDs no la ve. La validacion debe incluir un **gate nominal** (patrones
de nombre propio + lista conocida), separado del gate de IDs. Ese es el trabajo
de Chopper, no del escaner de estructura.

## 3. Radar no resoluble vs lote resoluble

- **Censo (radar):** produce contadores por familia y tokens opacos (`ITEM_...`).
  No guarda enlace token -> documento. Es mapa de riesgo, no indice de
  recuperacion. Barato y ciego a proposito.
- **Lote Zoro (resoluble):** solo los lotes autorizados crean
  `anchor_id -> source_ref`. La referencia real vive **unicamente** dentro de la
  capsula Anillo 0 cifrada. El nodo visible (Obsidian) lleva solo el `anchor_id`.

Criterio de un lote resoluble bien hecho: al menos un nodo round-trippea
(nodo -> anchor_id -> capsula bajo permiso -> fuente) y **nada resoluble existe
fuera de la capsula**. Verificar por muestreo, no solo el primer nodo.

## 4. Cifrado en reposo obligatorio para resoluciones

Cualquier tabla de resolucion de identidades o `anchor_id -> source_ref` nace
**dentro** del contenedor cifrado (Anillo 0), nunca en CSV/Markdown/SQLite
legible. Alineado con las mitigaciones de la investigacion de orquestacion
(gocryptfs/age, cifrado en reposo). Si una cola nace sin nombres ni IDs, no
necesita cifrado; si guarda equivalencias reales, si.

## 5. Dedup por obra, no por fichero

Un `anchor_id` por **obra**, no por archivo. Versiones, exportaciones y paquetes
(borrador/final/PDF/DOC) cuelgan de la misma ancla como variantes; no generan
nodos nuevos. Los nodos duplicados envenenan el RAG (frontera-RAG).
