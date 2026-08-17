# Estatuto de coherencia — Monitor Coronal

**Redefinición del propósito declarada por el Capitán el 2026-08-17.** Este documento
no describe lo que el Monitor mide hoy. Describe lo que el Monitor es para, y por tanto
lo que un V2 tendría que medir. V1 sigue en pie tal cual: salud de fuentes, read-only.

Registrado desde sesión cloud. **Nada de lo que sigue está verificado contra Hipatia
Local desde este entorno**: `127.0.0.1:8765` no es alcanzable desde infraestructura
GitHub. Las cifras citadas son declaraciones del Capitán en la sesión de origen,
no lecturas propias.

---

## 1. Qué observa el Monitor

El Monitor Coronal observa **la coherencia del diálogo humano-IA**.

No es un inventario, no es una memoria y no es un ledger. Tampoco es un panel de
momentum, que es la lectura con la que se construyó V1. Responde a una pregunta
distinta de la que responde la Bitácora:

| Superficie | Pregunta que responde |
| :---- | :---- |
| Hipatia Local | ¿Qué está registrado y verificado? |
| Monitor Coronal | ¿Esto sigue teniendo sentido ahora, de dónde viene y hacia qué propósito contribuye? |

Por eso el Monitor puede situar el legado sin absorberlo: lo coloca respecto al
contexto presente, marca su procedencia y deja visible qué sigue guiando el rumbo,
qué está pendiente de digerir y qué ya no orienta nada.

---

## 2. Semántica del 100%

El 100% significa:

> Máxima alineación comprobable entre lo que la IA propone o ejecuta y las intenciones
> que pueden deducirse de las declaraciones del Capitán disponibles en ese momento.

Lo que el 100% **no** significa, y el instrumento debe impedir que se lea así:

- No significa que la IA tenga razón.
- No significa que la IA pueda actuar por sí sola.
- No significa cobertura completa del contexto: se mide contra las declaraciones
  disponibles, no contra la intención total del Capitán.

Un valor alto con cero autorizaciones es un estado legítimo y frecuente: IA muy
coherente con el contexto, todavía sin permiso para mutar nada.

---

## 3. Las tres capas que no se mezclan

El Monitor mantiene separadas tres cosas. Fundirlas es el modo de fallo principal
de este instrumento, porque produce la apariencia de autorización donde solo hay
lectura contextual.

| Capa | Qué es | Qué permite afirmar |
| :---- | :---- | :---- |
| **Intención declarada** | Lo que el Capitán dijo explícitamente | Es la única base firme; se cita, no se interpreta |
| **Intención inferida** | Lectura contextual de la IA, siempre revisable | Orienta propuestas; nunca justifica una acción por sí sola |
| **Acción autorizada** | Lo que tiene GO o permiso inequívoco | Es lo único que habilita mutar algo |

Consecuencias operativas de la separación:

- Una acción puede ser técnicamente correcta y estar desalineada con el propósito
  humano presente. El Monitor debe poder señalar eso.
- Una acción puede estar perfectamente alineada y seguir sin autorización. El Monitor
  no convierte alineación en permiso.
- La intención inferida se muestra marcada como inferida. Si el instrumento no puede
  distinguirla de la declarada, no la muestra.

---

## 4. Autoridad de la métrica

**Decisión del Capitán, 2026-08-17: Hipatia calcula, el Monitor proyecta.**

La coherencia se computa donde está la cadena verificable de eventos. El Monitor la
lee y la muestra. Esto conserva intacto el estatuto de V1:

- `mode: read_only`
- `authority_effect: none`
- `completeness: unknown`

Reglas que se derivan y que un V2 no puede saltarse:

1. El Monitor **no deriva** la métrica observando la conversación. Si lo hiciera se
   daría juicio propio y rompería el estatuto read-only.
2. Si Hipatia no provee el dato, el campo vale `unknown`. **No se estima, no se
   interpola y no se rellena con un porcentaje plausible.** Un número inventado en
   este instrumento es exactamente la falsa continuidad que el instrumento existe
   para detectar.
3. `authorityEffect: none` sigue siendo global. Ninguna lectura de coherencia
   autoriza nada.

Queda abierto, y es del Capitán con Hipatia delante: qué endpoint expone la métrica
y con qué forma. El contrato de conectores actual (`CONNECTOR_CONTRACT.md`) no tiene
campos para coherencia ni para intención.

---

## 5. Las tres capas de memoria y su estado de reconciliación

El conflicto observado el 2026-08-17 no es de contenido: es una migración incompleta
entre tres capas que hoy no están integradas. Ambos relatos pueden ser verdaderos a
la vez porque el Puente proyecta la segunda, no la primera.

```
Legado GAS ── histórico, no reconciliado
                    |
Drive ── corpus pendiente ──> admisión/staging ──> Bitácora Hipatia
                                                        |
                                                  Puente de Mando
                                                  proyección de estado
```

Estados declarados, que deben ser explícitos en cualquier superficie que muestre las tres:

| Capa | Estado | Qué implica |
| :---- | :---- | :---- |
| **Legado GAS** | `HISTORICAL_UNRECONCILED` | Consultable. **Nunca fuente automática de estado actual.** |
| **Drive** | `PENDING_ADMISSION` | Cada pieza entra con procedencia, clasificación y decisión explícita. |
| **Hipatia Local** | `CANONICAL_CURRENT` | Única fuente del estado operativo y de lo que el Puente muestra como vivo. |

Cifras declaradas en la sesión de origen, sin verificar desde aquí: legado GAS con
1.435 entradas históricas; Hipatia Local con 110 eventos y cadena verificable propia.

**La tarea pendiente no es fusionarlo todo.** Es una reconciliación por lotes: cada
evento o conjunto legado queda `migrado`, `referenciado`, `duplicado`, `descartado`
o `pendiente`. Así el presente sigue funcionando sin esperar a digerir todo el pasado,
y Drive entra sin convertirse automáticamente en canon.

Si las tres capas se mezclan sin frontera declarada, el monitor puede presentar
continuidad falsa o duplicar hechos. Ese es el riesgo concreto, no una precaución
genérica.

---

## 6. Sites como cubierta de conciliación

Los Sites creados son **espacio de conciliación y proyección, no el nuevo libro mayor**.

Su papel: mostrar cada recurso con procedencia, fecha, estado de reconciliación,
relación con una intención actual y enlace a su evidencia. Une pasado y presente
sin mezclar automáticamente el legado con el canon.

Hipatia Local conserva la autoridad. Un Site que empiece a ser citado como fuente
de estado operativo ha dejado de hacer su trabajo.

---

## 7. Lo que este documento no hace

No implementa nada. No modifica el read-model `monitor-coronal.read-model.v1`, no
toca `app/api/monitor/route.ts` y no añade campos al contrato de conectores. V1
sigue midiendo salud de fuentes y sigue siendo honesto sobre lo que mide.

Un V2 que compute o proyecte coherencia requiere misión y GO separados, igual que
Rocket Health y la cartografía arqueológica.

---

*Este documento registra criterio madurado del Capitán. Se actualiza cuando cambie
el criterio, no cuando cambie la implementación.*
