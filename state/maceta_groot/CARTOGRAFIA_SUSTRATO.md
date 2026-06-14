# CARTOGRAFIA DE SUSTRATO - reconciliacion de tracks

Estado: track de reconocimiento (no es una fase de ontogenia)
Fecha de reconciliacion: 2026-06-14
Origen: sesiones de escritorio en el vault local (2026-06-12 y 2026-06-14)

## Por que existe este documento

Aparecieron dos numeraciones "GERMINACION_NN" que significan cosas distintas:

1. **Ontogenia (este repo, canon).** GERMINACION_00/01/02 son fases del
   desarrollo de La Maceta: radicula que emerge, radicula anclada, micorriza.
   Eje de madurez del organismo. Cerrojo activo: GERMINACION_03 (el hipocotilo)
   requiere GO explicito del Capitan.

2. **Cartografia de sustrato (vault local).** En `C:\La maceta de Groot`, las
   sesiones del 2026-06-12 y 2026-06-14 crearon `00_Semilla/GERMINACION_00/` con
   un trabajo distinto: no es una fase de madurez, es un reconocimiento del
   suelo. Reuso la etiqueta "GERMINACION" y por eso colisiona con la ontogenia.

Este documento corrige la colision: la cartografia de sustrato **no es** una
fase paralela de ontogenia. Es un eje perpendicular -- una actividad de
reconocimiento que **alimenta** GERMINACION_03, no que compite con ella.

## Que es la cartografia de sustrato

Mapear los nutrientes alrededor de la semilla sin tragarselos de golpe: saber
que memoria existe (Drive, OneDrive, local, Bitacora, repos, outputs), de que
tipo es, que se puede tocar, que solo se observa, que requiere permiso
(Chopper/Vivi) y que permanece sellado. Indice vivo, sin mover archivos, sin
ingesta masiva, source_mutations = 0.

## Artefactos del track (viven en el vault local, no en este repo)

Estos archivos existen en `C:\La maceta de Groot\00_Semilla\GERMINACION_00\` y
todavia no estan empujados a ningun repo. Quedan aqui catalogados para que el
canon sepa que existen y donde:

| Artefacto (vault) | Que contiene |
|---|---|
| `SUSTRATO_FERTIL_INVESTIGACION_20260612.md` | Primer inventario por metadatos del sustrato distribuido |
| `PROTOCOLO_ENT_MEMORIA_COMPARTIDA.md` | Principio operativo del Ent sobre memoria compartida |
| `PARTE_CLIMA_SEMILLA_20260614.md` | Parte meteorologico: densidad de la semilla de evidencia |
| `README.md` | Indice del brote GERMINACION_00 del vault |

## Hallazgos registrados (fuente: sesiones de escritorio + Bitacora 1358..1379)

- Principio del Ent:
  `memoria compartida + trazabilidad + compuertas + accion gradual = Ent operativo`.
- Reparto de roles: Jimbe decide corriente, Franky construye casco, el Ent
  conserva memoria y criterio, el Capitan da rumbo.
- Estado de la semilla de evidencia (parte del 2026-06-14): 40 registros --
  7 activos, 21 pending_validation, 6 historical_not_current_go, 6 sin estado.
  Lectura: hay alimento, pero todavia mas hipotesis que certezas.
- Diagnostico de riego: poco, frecuente y trazable; no se riega con todo Drive,
  sino con nutrientes seleccionados, evidencia, compuertas y Bitacora.
- Bitacora: brote sembrado en id 1358; parte de clima en id 1379.

## Relacion con la ontogenia

```
cartografia de sustrato (reconocimiento)
        |
        v  alimenta / da forma a
GERMINACION_03 (el hipocotilo: estacion meteorologica Jimbe como primer
                gesto usable hacia afuera)   <-- requiere GO del Capitan
```

La "estacion meteorologica Jimbe" propuesta en el vault no es una fase rival: es
el boceto de lo que puede ser GERMINACION_03. Cuando haya GO, este track es su
materia prima.

## Regla de nomenclatura (para no volver a divergir)

- "GERMINACION_NN" se reserva para fases de ontogenia en este repo.
- El trabajo de reconocimiento del vault se nombra "cartografia de sustrato", no
  "GERMINACION". Si necesita sub-indices, usar CARTO_NN, no GERMINACION_NN.

---
*Reconocer el suelo no es crecer. Es saber donde puede entrar la raiz.*
