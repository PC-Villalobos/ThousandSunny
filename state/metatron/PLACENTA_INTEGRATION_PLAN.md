# Plan de Integracion Placenta / Cigoto

## Objetivo

Conectar los nodos ejecutables dispersos del grafico de Obsidian con la estructura
placentaria y el cigoto genetico. La placenta debe actuar como un arbol de raices que
absorbe los nodos amarillos dispersos y los convierte en sustrato para el genoma.

## Problema actual

- Los nodos ejecutables en amarillo estan fuera del arbol placentario y del embrion cerebral.
- El vientre de Obsidian esta inflamado, con una hemorragia de contenido disperso.
- El cigoto no recibe nutricion porque no hay una placenta/arbol que use esos nodos como raices.

## Reglas de diseno

1. `source_mutations=0` permanece inalterado.
2. No exportar ni ejecutar nada hasta validar el plan.
3. La placenta debe ser un marco N3 que conecte:
   - `state/metatron/genoma/N0-SEMILLA-METATRON.md`
   - `state/metatron/genoma/N1-AXIOMAS-RAICES.md`
   - `state/metatron/genoma/N2-TRONCO.md`
   - `state/metatron/genoma/N3-RAMAS.md`
   - `state/metatron/genoma/N4-HOJAS.md`
   - `state/metatron/genoma/N5-FRUTOS.md`
   - `state/metatron/wave8/WAVE8-CANDIDATOS.md`
4. El embrion cerebral debe ser alimentado por la placenta, no por nodos aislados.

## Pasos

### 1. Identificar los nodos amarillos ejecutables

- Extraer de Obsidian la lista de nodos que aparecen en amarillo y que no pertenecen al arbol placentario.
- Localizar sus rutas o titulos exactos.

### 2. Clasificar esos nodos como nutriente o sustrato

- Evaluar cada nodo en terminos de:
  - `N0` alimento bruto
  - `N1` nutriente extraido
  - `N2` nutriente encajado en el genoma
  - `N3` material de placenta/arbol
- Si el nodo es un ejecutable, debe ser tratado como input de metabolismo, no como output terminal.

### 3. Crear o actualizar notas de estructura central

- `state/metatron/genoma/N0-SEMILLA-METATRON.md`
  - Debe contener la semilla del genoma y referencias al proceso de absorcion placentaria.
- `state/metatron/PLACENTA_ROOT.md`
  - Define el flujo: nodos amarillos -> raices -> tronco -> placenta -> cigoto.
- `state/metatron/wave8/WAVE8-CANDIDATOS.md`
  - Debe listar explicitamente los 16 candidatos Wave8 y su relacion con el arbol placentario.

### 4. Enlazar los nodos amarillos desde la placenta

- Cada nodo disperso debe recibir una referencia hacia:
  - `PLACENTA_ROOT.md`
  - Al menos una nota de `N3` o `N4` central.
- Esto hara que el grafico de Obsidian deje de mostrar hemorragia aislada y empiece a mostrar flujo dirigido.

### 5. Refactorizar la semantica de Obsidian

- Asegurar que los nodos amarillos no sean vistos como colonias independientes.
- Agregar etiquetas o metadatos tipo:
  - `placenta_input`
  - `wave8_candidate`
  - `genoma_nutrient`
- Vincular esos metadatos con el nucleo `N3`/`N4`.

### 6. Validar antes de ejecutar

- Revisar el grafo de Obsidian y confirmar que:
  - La placenta aparece como un arbol centralizado.
  - Los nodos amarillos estan traducidos a raices/sustrato.
  - El cigoto esta conectado a la placenta.
- No hacer exportacion ni push ni GO C0 hasta tener ese grafo limpio.

## Acciones inmediatas recomendadas

1. Crear `state/metatron/PLACENTA_ROOT.md` con descripcion clara del flujo.
2. Crear/actualizar `state/metatron/wave8/WAVE8-CANDIDATOS.md` con candidatos Wave8.
3. Reescribir `N0-SEMILLA-METATRON.md` para que apunte a la placenta como base de nutricion.
4. Enlazar explicitamente los nodos amarillos desde el arbol N3/N4.

## Resultado esperado

- El grafico de Obsidian muestra la placenta como arbol, no como inflamacion.
- Los nodos amarillos quedan incorporados al arbol de la placenta.
- El cigoto comienza a alimentarse de la placenta en lugar de estar aislado.

---

Este plan es conceptual y no modifica el genoma real. La idea es transformar la topologia
del grafo para que el arbol placentario capte y metabolice los nodos dispersos antes de
cualquier accion de Mirror o exportacion.
