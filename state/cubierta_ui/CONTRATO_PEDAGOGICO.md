# Contrato pedagógico de la Cubierta

**Primera materialización:** 2026-07-27, Claude Code, como superficie de referencia.

**Reconciliación:** 2026-07-28, Codex, contra D y la VM.

**Límite del GO:** actualizar contrato, baseline y pruebas en la rama de PR #96; **sin desplegar**.

## 1. Estatuto del artefacto

Esta carpeta contiene un contrato ejecutable y una superficie de referencia reconciliada. No es
el artefacto desplegable de la Cubierta.

La reconciliación leyó:

- `D:\SunnyFranky\linux-llm-control-plane\apps\sunny-control-bridge`
- `/home/ascuas/sunny-flota-bridge`

Los cuatro artefactos incorporados bajo `baseline/` eran idénticos byte a byte en ambos árboles.
`reconciliation-manifest.json` fija sus SHA-256 y la suite vuelve a calcularlos. Una deriva
silenciosa rompe la prueba.

La regla central sigue siendo:

> La traducción hereda el estatuto del origen y nunca lo mejora.

## 2. Rectificaciones tras observar el código y el ledger vivos

### 2.1 Ejecución y agentes

La primera recepción afirmó que `Ejecución` estaba dentro del bloque del último worker. Era falso:
el HTML vivo hace `e.append(head,p,grid,ex)`, por lo que ejecución y `agent-grid` son hermanos.

El defecto real es de jerarquía visual. La ejecución aparece inmediatamente después del último
agente y, especialmente en móvil, puede atribuirse visualmente a ese agente. El contrato conserva
la ejecución al nivel de la orden y prohíbe que un objeto de agente la cargue, pero este PR no
despliega el ajuste visual.

### 2.2 La orden 347 sí se ejecutó

La pregunta quedó cerrada mediante el ledger vivo: `ORD-TG-567384347` alcanzó
`execution_executed`, con actor `sunny-control-bridge:typed-executor` y evidencia `observed`.
La pantalla no inventó la ejecución; la presentó con una jerarquía ambigua.

El snapshot vivo no proyecta todavía actor ni `executed_at`. El adaptador deja ambos campos
ausentes; no los reconstruye desde el testimonio.

### 2.3 La marca temporal existe

`proposed_at` sí viaja en la salida real de `translateOrder()`. Que la captura inicial no mostrara
fecha era una omisión de interfaz, no ausencia del registro. El adaptador la conserva y las pruebas
lo exigen.

Los `createdAt: null` del fixture conservan la lectura inicial de pantalla. No describen la
capacidad real del runtime.

## 3. Vocabularios reconciliados

El contrato reconoce los valores observados en la implementación viva:

- Orden: `deliberated`, `authorized`, `not_authorized`, `pending`, `blocked`.
- Entrega: `pending`, `claimed`, `responded`, `blocked`.
- Deliberación: `assessment_provided`, `clarification_required`, `cannot_assess`, `unknown`.
- Epistémico: `observed`, `calculated`, `inferred`, `evaluated`, `proposed`, `unknown`.
- Ejecución: `not_requested`, `proposed`, `authorized`, `executed`, `blocked`.

`decided` no se canoniza: el runtime observado no lo produce. Un valor futuro queda
`reconocido:false` y se muestra como no interpretable, en vez de empujar al autor a mentir para
pasar una guarda.

## 4. Seis invariantes pedagógicos

1. La ejecución pertenece a la orden, no a un agente.
2. Ningún enum crudo llega al lector.
3. El titular es la instrucción; el ID es referencia.
4. La marca temporal se muestra o su ausencia se declara.
5. Lo histórico solo se etiqueta cuando existe versión de contrato; no se infiere por antigüedad.
6. Toda respuesta conserva literalmente: “El turno terminó. Esto no significa que la orden se
   ejecutara.”

## 5. Integración todavía abierta

La salida viva no transporta `contract_version`. Por tanto, el adaptador no puede distinguir de
forma fiable una orden histórica. La ausencia de versión no se convierte en `v1` ni `v2`.

Tampoco transporta actor ni momento de ejecución. El modelo de referencia admite esos campos,
pero los deja vacíos cuando la fuente no los entrega.

La superficie de referencia no sustituye a `public/cubierta.html` y no se ha copiado a D ni a la
VM. Aplicar la mejora visual exige otro incremento y otro GO de despliegue.

## 6. Verificación

| Comprobación | Resultado |
|---|---:|
| `node --test state/cubierta_ui/*.test.mjs` | 25/25 |
| Hashes del baseline | 4/4 |
| Adaptación de salida real de `translateOrder()` | verificada |
| `authorized`, `blocked`, `calculated`, `evaluated` | reconocidos |
| `decided` | rechazado sin reinterpretación |
| Ejecución dentro de objetos de agente | cero |

La prueba humana de legibilidad sigue pendiente hasta que el ajuste se aplique a una superficie
visible. Este PR demuestra el contrato y su compatibilidad; no demuestra una UI desplegada.
