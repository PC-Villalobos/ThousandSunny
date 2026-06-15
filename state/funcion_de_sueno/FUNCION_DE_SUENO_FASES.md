# Funcion de sueno v0.1

## Proposito

Ejecutable portable para consolidar memoria compartida durante la noche operativa del sistema. Su funcion no es generar canon nuevo, sino revisar deltas, simular coherencia de estados atractores y prevenir fusion actor/rol mediante rotacion.

## Principio

El conocimiento del personaje vive en el guion, no en el actor. Un modelo puede interpretar a Nami, Robin, Chopper, Vivi o Usopp, pero no debe fundirse con ningun papel. La rotacion preserva el meta-actor y reduce deriva emergentista.

## Fases

### Fase 0 - Boot

Carga contrato, configuracion, estado anterior, compuertas y ledger de roles.

### Fase 1 - Hipnagogia

Inventaria la memoria compartida, calcula hashes y detecta deltas episodicos: archivos nuevos, cambiados o desaparecidos.

### Fase 2 - NREM indice

Extrae enlaces, headings, frontmatter, marcadores pendientes y huellas de atractores donde sea seguro leer contenido. Material protegido queda en metadata-only.

### Fase 3 - NREM profundo

Audita coherencia: enlaces huerfanos, notas sin frontmatter, acumulacion de pendientes y distribucion de atractores Sofia/Hipatia/Groot/Robin/Nami/Vivi/Chopper/Usopp.

### Fase 4 - REM / teatro de roles

Registra que actor interpreto que rol. Si un actor repite el mismo rol demasiados ciclos, dispara aviso de fusion y sugiere el siguiente papel.

### Fase 5 - Despertar

Escribe reporte, eventos JSONL y nuevo estado persistente. El reporte debe ser legible por cualquier modelo antes de arrancar una sesion nueva.

## Limite honesto

La v0.1 no garantiza ausencia total de alucinacion ni resuelve contexto infinito. Hace lo verificable ahora: trazabilidad, deteccion de deriva, auditoria de enlaces, memoria episodica/procedimental y rotacion de roles. La simulacion fuerte de atractores queda como investigacion v1.

## Ejecucion local

```bash
node state/funcion_de_sueno/funcion_de_sueno.mjs --config state/funcion_de_sueno/sleep_config.repo.json --actor codex --role Usopp --cloud-request
```

## Ejecucion portable

Copiar la carpeta `funcion_de_sueno` a cualquier memoria compartida y ejecutar:

```bash
node state/funcion_de_sueno/funcion_de_sueno.mjs --config state/funcion_de_sueno/sleep_config.repo.json --actor cloud --role Nami --cloud-request
```
