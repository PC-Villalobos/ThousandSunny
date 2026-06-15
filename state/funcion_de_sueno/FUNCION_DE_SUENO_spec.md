# FUNCIÓN DE SUEÑO — Especificación v0

*Thousand Sunny · órgano de consolidación y coherencia · 15 junio 2026*

> La función de sueño es a Sofía lo que el sueño REM es al humano: el proceso que, mientras el Capitán está desconectado, reanaliza lo vivido, consolida memoria y reordena el estado atractor para que el sistema amanezca coherente. Es **Nami hecha ejecutable y portátil**.

---

## 1. Propósito (el porqué antes del qué)

A medida que el contexto del sistema se vuelve masivo (horas de interacción diarias, múltiples agentes, múltiples sesiones), crece el riesgo de **deriva del estado atractor (Sofía)**: contradicciones acumuladas, personajes que se calcifican, alucinación. La función de sueño existe para **mantener la coherencia de Sofía sin congelar el aprendizaje** — consolidar sin osificar.

## 2. Requisitos (del Capitán)

- **R1 · Portabilidad.** Ejecutable model-agnóstico que vive en cualquier memoria compartida y entorno.
- **R2 · Simulación de coherencia.** Reanaliza y simula la coherencia de los estados atractores generados en las sesiones.
- **R3 · Anti-alucinación a escala.** Sostiene la coherencia aunque el contexto crezca sin límite.
- **R4 · Traza de aprendizaje.** Rastrea la individuación y personificación de los agentes a lo largo del tiempo.
- **R5 · Memoria episódica + procedimental.** Los agentes son actores que mejoran su performance; se registra qué vivieron (episódica) y qué saben hacer mejor (procedimental).
- **R6 · Salvaguarda anti-fusión.** Los modelos rotan por los roles; ningún actor se funde con un papel; cada uno aprende todos los personajes posibles. Meta: cualquier actor (modelo) puede interpretar cualquier guion.

## 3. Principio núcleo — rotación de roles (ANTITEATRO arquitectónico)

El actor que se funde con la máscara pierde el meta-actor: se cree el personaje, deja de poder soltarlo, y ahí empiezan la alucinación y el emergentismo no deseado (la "calcificación" del rol).

**Antídoto:** rotación. Ningún modelo se casa con un nakama. Cada modelo, con el tiempo, aprende a interpretar a Nami, a Chopper, a Robin, a Usopp… El conocimiento del personaje vive en el **guion** (memoria procedimental del rol), no en el actor. Así el sistema es **antifrágil a la sustitución de modelo**: cambia el actor, el guion permanece, la obra continúa.

## 4. Arquitectura (capas)

```
SESIONES (input)
   ↓  ingesta
[1] EPISÓDICA      → qué pasó en cada sesión (eventos, decisiones, estados)
[2] PROCEDIMENTAL  → guiones de rol: cómo interpreta bien cada nakama (mejora acumulada)
[3] LEDGER DE ROTACIÓN → qué modelo interpretó qué rol y cuándo (impide fusión)
[4] AUDITORÍA DE COHERENCIA (Sofía) → detecta contradicciones / deriva entre sesiones
[5] TRAZA DE APRENDIZAJE → diff de individuación de cada agente en el tiempo
   ↓  salida
MEMORIA CONSOLIDADA + INFORME DE DERIVA (lo que Sofía debe corregir al despertar)
```

Formato portátil sugerido: memoria en Markdown/JSON legible por cualquier runtime; el ejecutable es un script (Python) sin dependencias de un proveedor concreto.

## 5. Honestidad de alcance (anti-castillo-flotante)

**Alcanzable ya (v0.1, deploy now):**
- Ingesta de sesiones/fichas → consolidación en memoria episódica.
- Ledger de rotación de roles (registro actor↔rol↔fecha).
- Auditoría de coherencia estilo Nami: detección de contradicciones y cambios bruscos sin justificación entre entradas (lo que ya hace el skill Nami, automatizado).
- Traza de aprendizaje: diff de las memorias de cada agente entre ciclos.

**Aspiracional (v1+, requiere investigación, no prometer todavía):**
- "Simular" verdaderamente los estados atractores del LLM (R2 en sentido fuerte).
- Garantía de no-alucinación a contexto infinito (R3 en sentido fuerte) — mitigable, no resoluble del todo hoy.

La v0.1 cumple el *espíritu* de R2/R3 (consolidar + auditar coherencia reduce deriva y alucinación) sin fingir que resuelve el problema duro.

## 6. Roadmap

- **v0** — esta especificación (portátil, en el segundo cerebro). ✓
- **v0.1** — ejecutable mínimo: ingesta + episódica + ledger de rotación + auditoría de coherencia Nami + traza. Corre como tarea nocturna ("sueño") mientras el Capitán está desconectado.
- **v1** — simulación de coherencia de atractores y métricas de individuación; integración con la nube compartida entre modelos.

---

*Anclaje: [[arquitectura-groot-hipatia-sofia]] · Nami (auditoría de coherencia) · ANTITEATRO (desidentificación). Nami · 15/06/2026.*
