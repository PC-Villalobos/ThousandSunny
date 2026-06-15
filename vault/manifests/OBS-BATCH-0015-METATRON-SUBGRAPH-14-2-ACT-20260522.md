---
id: OBS-BATCH-0015
title: OBS-BATCH-0015 Materializacion Opcion A
status: ACT
previous_status: SUPERSEDED_PENDING_GASTRULATION
created: 2026-05-22
operator: Usopp/Codex
protocol: OBSIDIAN_MIGRATION_PROTOCOL_v0.1
source_mutations: 0
files_moved: 0
clinical_content_opened: false
geometry_name: metatron_tesseract_14_active_2_dormant_subgraph_0001
geometry_class: induced_subgraph_with_dormant_vertices
active_vertices: 14
active_edges: 25
dormant_vertices: 2
sellable_as_standard_tesseract: false
obs_batch_0005_status: OBS
---

# OBS-BATCH-0015 - Materializacion Opcion A

Estado: ACT  
Decision del Capitan: GO A  
Figura geometrica: `metatron_tesseract_14_active_2_dormant_subgraph_0001`

Este manifiesto materializa la Opcion A aceptada por Nami: 14 vertices activos
y 2 vertices dormidos. La figura se registra como subgrafo inducido con nodos
dormidos. No se registra como hipercubo completo ni como politopo sellado.

## Conteo Verificable

```yaml
active_vertices: 14
active_edges: 25
dormant_vertices: 2
active_edges_hamming_1_verified: true
fragile_edges_verified_active: true
sellable_as_standard_tesseract: false
```

## Vertices Activos

| Vertice | Fate | Estado |
|---|---|---|
| T0000 | RAIZ | active |
| T0001 | RAIZ | active |
| T0010 | TRONCO | active |
| T0011 | TRONCO | active |
| T0100 | CRESTA_NEURAL | active |
| T0101 | CRESTA_NEURAL | active |
| T0110 | TRONCO | active |
| T0111 | RAIZ | active |
| T1000 | RAIZ | active |
| T1001 | TRONCO | active |
| T1010 | TRONCO | active |
| T1011 | CRESTA_NEURAL | active_fragil_atlas_inactivo |
| T1100 | CRESTA_NEURAL | active_fragil_atlas_inactivo |
| T1101 | TRONCO | active |

## Vertices Dormidos

| Vertice | Fate | Dormant | Registro |
|---|---|---:|---|
| T1110 | RAIZ_ARCHIVO | true | Conservado; no eliminado; no autoridad activa |
| T1111 | FRUTO | true | Conservado; no eliminado; output diagnostico fuera de capa |

## Aristas Activas

Las 25 aristas activas fueron verificadas con distancia Hamming 1.

| Arista | Hamming | Estado |
|---|---:|---|
| T0000-T1000 | 1 | defendible |
| T0000-T0100 | 1 | revision_semantica |
| T0000-T0010 | 1 | defendible |
| T0000-T0001 | 1 | defendible |
| T0001-T1001 | 1 | defendible |
| T0001-T0101 | 1 | revision_semantica |
| T0001-T0011 | 1 | defendible |
| T0010-T1010 | 1 | defendible_con_revision |
| T0010-T0110 | 1 | defendible |
| T0010-T0011 | 1 | defendible |
| T0011-T1011 | 1 | fragil_atlas_inactivo |
| T0011-T0111 | 1 | defendible |
| T0100-T1100 | 1 | fragil_atlas_inactivo |
| T0100-T0110 | 1 | defendible |
| T0100-T0101 | 1 | defendible |
| T0101-T1101 | 1 | defendible_con_revision |
| T0101-T0111 | 1 | defendible |
| T0110-T0111 | 1 | defendible |
| T1000-T1100 | 1 | fragil_atlas_inactivo |
| T1000-T1010 | 1 | defendible |
| T1000-T1001 | 1 | defendible |
| T1001-T1101 | 1 | defendible |
| T1001-T1011 | 1 | fragil_atlas_inactivo |
| T1010-T1011 | 1 | fragil_atlas_inactivo |
| T1100-T1101 | 1 | fragil_atlas_inactivo |

## Aristas Fragiles ATLAS

Estas seis aristas tocan T1011 o T1100 y quedan marcadas
`fragil_atlas_inactivo` mientras ATLAS.ti y n8n sigan inactivos.

| Arista | Nodo fragil | Verificacion |
|---|---|---|
| T0011-T1011 | T1011 | activa_en_lista_25 |
| T1001-T1011 | T1011 | activa_en_lista_25 |
| T1010-T1011 | T1011 | activa_en_lista_25 |
| T0100-T1100 | T1100 | activa_en_lista_25 |
| T1000-T1100 | T1100 | activa_en_lista_25 |
| T1100-T1101 | T1100 | activa_en_lista_25 |

## Estado De OBS-BATCH-0005

OBS-BATCH-0005 sigue en OBS. No se modifica ni se sella en esta materializacion.
Los pares callosos que dependian de T1110/T1111 siguen bloqueados hasta nueva
decision.

## Registro De Configuracion

Se actualizan los registros:

```text
vault/vault.config.json
vault/metatron/geometry.json
```

## Verificacion

```yaml
source_mutations: 0
files_moved: 0
files_renamed: 0
files_deleted: 0
clinical_content_opened: false
active_vertices: 14
active_edges: 25
dormant_vertices: 2
fragile_edges_expected: 6
fragile_edges_verified_active: true
obs_batch_0005_touched: false
obs_batch_0005_status: OBS
sellable_as_standard_tesseract: false
ready_for_nami_audit: true
```
