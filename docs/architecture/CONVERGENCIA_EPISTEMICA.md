# Convergencia epistémica de las dos Cubiertas

Registro de lo decidido y ejecutado bajo el GO del Capitán (2026-08-13), tras la
auditoría comparativa entre `state/cubierta_ui/` y `cubierta/`.

```yaml
version: 1.0
estado: ejecutado
chronos:
  occurred_at: 2026-08-13
  recorded_at: 2026-08-13
  sequence_after: fix_colision_test_cubierta (144848b)
provenance:
  class: observado  # el vocabulario se leyo del canon, no se propuso
autoridad:
  go: Capitan (2026-08-13)
  endurecimientos previos: Codex
```

## 1. La regla de autoridad

`state/cubierta_ui/` **no manda por dominio funcional**: su §1 se autolimita
("no es el artefacto desplegable de la Cubierta") y su vocabulario de órdenes,
entregas y deliberaciones pertenece al `sunny-control-bridge`.

**Sí manda por núcleo epistémico.** Ausencia, estatuto, traducción y
temporalidad son transversales: cualquier superficie que se llame Cubierta las
hereda. `cubierta/` puede seguir siendo otra cosa; no puede divergir en esto.

## 2. Dónde vive el núcleo

`shared/epistemico.mjs`, en la raíz del repo. **Fuera de las dos superficies a
propósito**: meterlo dentro de una le regalaría autoridad accidental sobre la
otra. Mismo criterio que `scripts/test-cubierta.mjs`.

El vocabulario, los títulos y los avisos son **copia literal** del canon
(`CONTRATO_PEDAGOGICO.md` y `render.mjs`, rama `agent/cubierta-not-recorded-preview`,
`1f80c84`). No se mejoran, no se abrevian, no se vuelven a traducir.

## 3. Lo que cambió en `cubierta/`

### 3.1 Un solo eje epistémico, no dos

`cubierta/` tenía `tinta` (cómo se derivó) y `origen` (quién responde). Era una
duplicación: el `observed` del canon ya encierra el "quién verificó" — *"el
agente miró el sistema directamente y hay al menos dos referencias de
evidencia"*. Ahora hay un único eje, el canónico.

### 3.2 `medido` deja de existir

Era el término divergente: donde el canon dice `observed`, `cubierta/` decía
`medido`, que no dice quién midió. Eliminado.

### 3.3 `desconocido` deja de ocupar un término reservado

El canon reserva `unknown` para un desconocimiento **declarado** y tiene
`not_recorded` para la ausencia estructural. `cubierta/` usaba `desconocido`
para lo segundo. Corregido, con el aviso canónico:

> Este campo no fue registrado. La ausencia se conserva y no se interpreta como
> desconocimiento declarado.

### 3.4 Ningún enum crudo llega al lector (invariante 2)

Era incumplimiento normativo, no estético: el HUD pintaba `no_observable`,
`sin_dato` y `discordante` como insignias. Ahora todo pasa por mapas cerrados
(`cubierta/shared/vocabulario.mjs`) con título y detalle. Un valor fuera del
mapa se marca no interpretable y **no se traduce al vecino semántico**.

### 3.5 Lo declarado deja de producir vitales

Consecuencia más fuerte de la convergencia. Antes, un `tokens_por_s` que el
actor escribía sobre sí mismo aparecía como vital con etiqueta `medido`. Ahora
no produce vital ninguno: viaja aparte, en `declarado_por_actor`, con su aviso.

### 3.6 `contract_version`

Toda salida declara `cubierta-epistemico-v1`. Al consumir registros ajenos, la
ausencia de versión **no** se convierte en v1 ni v2 y no autoriza a inferir que
algo sea histórico (invariante 5).

## 4. El umbral de `observed` — la convergencia delicada

Codex avisó de que no basta renombrar `medido` a `observado` sin adoptar el
listón. Se ha adoptado **literalmente**: `REFERENCIAS_MINIMAS_OBSERVED = 2`.

Cada valor transporta sus `referencias` (lecturas de sonda, muestras del
almacén, corroboraciones cruzadas entre ejes del mismo sujeto). Con una sola
referencia **no se afirma `observed`** — y tampoco se degrada a `inferred` o
`calculated`, que serían falsos. Se declara el hueco, que es el mecanismo que el
propio canon sanciona para no *"empujar al autor a mentir para pasar una
guarda"*.

Consecuencia práctica y aceptada: una lectura directa aislada (por ejemplo
`liveness` sola, en Windows, donde la RSS no es legible) queda **sin estatuto
afirmado**. Es más honesto y más incómodo. Es el precio del listón.

## 5. Lo que NO se ha tocado

- Los vocabularios de dominio del Control Bridge (orden, entrega, deliberación,
  ejecución). No aplican a esta superficie.
- El invariante 6 (`AVISO_TURNO`, literal). Escrito para respuestas a órdenes;
  si aplica a los cierres de recado es decisión del Capitán, no de esta pasada.
- El invariante 1 (la ejecución pertenece a la orden, no al trabajador). Los
  artefactos de `cubierta/` siguen firmados por nakama. Es la misma ambigüedad
  de atribución que el contrato corrigió en su dominio; queda anotada.
- `state/cubierta_ui/` no se ha modificado en absoluto. Cuando ambas ramas
  converjan, puede importar `shared/epistemico.mjs` sin cambiar su semántica.
- La vigencia de los SHA-256 del `baseline/` contra `D:` y `/home/ascuas/`:
  sólo verificable desde la máquina del Capitán.

## 6. Verificación

| Comprobación | Resultado |
|---|---|
| `node --test shared/epistemico.test.mjs` | 13/13 |
| `cubierta/test/test_cubierta.mjs` | 24/24 |
| `cubierta/test/test_pulso.mjs` | 38/38 |
| Una referencia no afirma `observed` | probado |
| La ausencia no ocupa `unknown` | probado |
| Valor fuera del mapa no pasa en crudo ni se reinterpreta | probado |
| HUD sin enums crudos | verificado en navegador |
| Alcance de estáticos tras servir dos raíces `shared/` | traversal y `server/` siguen en 404 |

## Registro de versiones

- v1.0 (2026-08-13): convergencia ejecutada. Núcleo compartido en
  `shared/epistemico.mjs`; vocabulario de dominio traducido en
  `cubierta/shared/vocabulario.mjs`; umbral de `observed` adoptado literalmente;
  `not_recorded` sustituye a `desconocido` para la ausencia; lo declarado deja
  de producir vitales; `contract_version` en toda salida.
