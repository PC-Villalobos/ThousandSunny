# Alineacion de sesiones — 2026-07-20

Documento de arranque para poner al dia diez sesiones de Claude Code a la vez.
Cada bloque es un **prompt listo para pegar** al abrir una sesion nueva sobre el
frente correspondiente: fija identidad/rol, dice que canon cargar, cual es el
estado real, cual es la proxima accion minima y sus guardrails.

Reconstruido desde el canon del repo, los PRs abiertos y el estado (`RETOMAR`,
Sueno, Camara de Chopper, Hipatia/MNEMOSINE, bridge-linux, Metatron, NotebookLM,
PuenteDeMando). No fabrica estado: si un frente espera un GO del Capitan, lo dice.

> Contexto comun que conviene recordar en toda sesion: el hub (`$SUNNY_HUB_PATH`)
> no es alcanzable desde la nube; usar los ficheros de `state/` como fuente. Toda
> sesion remota cierra con un bloque `## Checkpoint` en el cuerpo del PR (no hay
> `npm run checkpoint`). Sin emoji en ficheros commiteados salvo que el Capitan lo pida.

---

## Orden recomendado (hilo mas inminente y conveniente)

1. **Sueno / disparador de la Routine (CABO-012 + CABO-013)** — accion mas barata y
   de mayor palanca: dos minutos de manos del Capitan en `claude.ai/code/routines`.
   Cada parte nocturno desde el 07-05 la vuelve a senalar; es el unico fallo
   *estructural* del sistema nervioso autonomo. No es trabajo de una sesion de
   Claude Code (es UI), pero desbloquea a todas las demas. **Hacerlo primero, en paralelo.**
2. **Camara de Chopper -> C0-A** — el hilo de construccion mas inminente y ya teed-up:
   plano aprobado (07-19), encargo C0 v0.2.1 revisado; solo espera el **GO C0** del
   Capitan para ejecutar C0-A (infraestructura vacia + evaluar cifrado/backup). Es la
   sesion por la que conviene **seguir trabajando** en cuanto haya GO.
3. El resto (Maceta 03, bridge-linux D2-D4, Hipatia/MNEMOSINE, Robin, Usopp/Odysseus,
   NotebookLM, Metatron, Puente/GAS) segun aparezca el GO o la ventana de cada uno.

---

## 1 — Funcion de Sueno: reparar el disparador de la Routine

**Estado:** la via determinista (GitHub Actions, 01:09 UTC) corre cada noche sin
falta; la via agentica (Routine, 03:09 Madrid) solo dispara cuando se lanza a mano
(4 veces en 15 dias). Consecuencia: `github-actions/Groot` acumula rachas de fusion
actor/rol (llego a 7 ciclos). CABO-012 (anadir trigger API) y CABO-013 (el prompt vivo
aun pasa `role=Nami` en vez de `role=Groot`) siguen abiertos, ambos "manos del Capitan".

**Prompt:**
```
Sesion: Funcion de Sueno — reparar disparador de la Routine agentica.
Lee state/funcion_de_sueno/ROUTINE_SETUP.md, RUTINAS.md (seccion "Cabos de esta capa")
y el ultimo parte en state/funcion_de_sueno/reports/. Contexto: la Routine programada
no dispara sola; CABO-012 (falta trigger API) y CABO-013 (prompt con role=Nami en vez
de role=Groot) llevan abiertos desde 07-02/07-05. Tarea: (1) darme el bloque exacto
"PROMPT DE LA RUTINA" actualizado de ROUTINE_SETUP.md que debo pegar en
claude.ai/code/routines (ya debe decir "Eres Groot" / role=Groot); (2) listar los
pasos UI para anadir el trigger API y guardar el token en la keystone, nunca en el repo.
No edites la Routine tu (es UI del Capitan); prepara el material y verifica coherencia
con el canon. Guardrails de /sueno intactos.
```

## 2 — Camara de Chopper: preparar C0-A  [HILO RECOMENDADO]

**Estado:** plano `docs/architecture/CAMARA_DE_CHOPPER.md` v0.2 aprobado por el
Capitan (07-19, "Aprobado, GO" al plano). Encargo `ENCARGO_C0_CAMARA_DE_CHOPPER.md`
v0.2.1 en borrador, revisado (PRs #75/#76 aterrizados). Tres actos, tres firmas: la
aprobacion del plano solo autoriza *preparar* C0; ejecutar C0-A exige GO C0 propio;
C1 (material real) exige otro GO con Vivi.

**Prompt:**
```
Sesion: Camara de Chopper — fase C0-A.
Lee docs/architecture/CAMARA_DE_CHOPPER.md (v0.2, aprobado) y
docs/architecture/ENCARGO_C0_CAMARA_DE_CHOPPER.md (v0.2.1). Recuerda: tres actos, tres
firmas; el plano aprobado solo autoriza preparar C0; C0-A necesita GO C0 explicito del
Capitan; nada se ejecuta en esta sesion remota (la ejecucion es en la maquina local).
Tarea sin GO: dejar listo el plan de ejecucion de C0-A (evaluar opciones de
cifrado/backup 2.2, compuerta minima 2.3, almacen vacio, indice de canarios vacio) y la
lista de decisiones que el Capitan debe tomar entre C0-A y C0-B. Si el Capitan da GO C0,
proceder solo con C0-A. Guardrails: cero material clinico real, cero egreso, metadata-only
en Hipatia protegida.
```

## 3 — La Maceta de Groot: GERMINACION_03 (hipocotilo)

**Estado:** fase Germinacion (2), `sealed:false`. GERMINACION_02 mergeado (PR #15).
Proxima fase GERMINACION_03 = primer gesto hacia afuera; candidato de forma: la
estacion meteorologica Jimbe de solo lectura (lee Bitacora + GAS + semilla de evidencia
y emite un parte de clima con la accion minima segura). **Requiere GO explicito del
Capitan**; sin GO no se crea GERMINACION_03.

**Prompt:**
```
Sesion: La Maceta de Groot — GERMINACION_03.
Lee state/maceta_groot/RETOMAR.md y state/maceta_groot/CARTOGRAFIA_SUSTRATO.md. Estado:
fase 2 (Germinacion), GERMINACION_02 ya mergeado; GERMINACION_03 (el hipocotilo, primer
gesto hacia afuera) NO se crea sin GO explicito del Capitan. Candidato: estacion
meteorologica Jimbe read-only. Tarea sin GO: bosquejar el diseno minimo del hipocotilo
(que lee, que emite, accion minima segura) para que el Capitan decida el GO. Guardrails:
biologia vegetal gobierna la forma; no saltarse fases (produce teratoma); no renombrar
carpetas historicas del vault; no abrir material clinico.
```

## 4 — bridge-linux: cerrar el fleco D2-D4 y Hito 0

**Estado:** el pliegue D2-D4 en `bridge-linux/ARQUITECTURA.md` lleva ~15 dias senalado
por los partes de sueno sin dueno explicito: hay que decidir si sigue vivo o se da de
baja. Contexto adyacente: `HITO_0_FAST_START.md`, `ROADMAP_SECUENCIA_LINUX.md`,
`LAB_VM_STATUS_20260715.md`, `PRE_LINUX_KEY_GATE.md`.

**Prompt:**
```
Sesion: bridge-linux — fleco D2-D4 + estado Hito 0.
Lee bridge-linux/ARQUITECTURA.md, ROADMAP_SECUENCIA_LINUX.md, HITO_0_FAST_START.md y
LAB_VM_STATUS_20260715.md. Contexto: los partes de sueno arrastran ~15 dias un "pliegue
D2-D4 sin plegar" en ARQUITECTURA.md sin dueno. Tarea: localizar exactamente que es ese
pliegue D2-D4, proponer al Capitan una de dos: (a) plegarlo con el cambio concreto, o
(b) darlo de baja explicitamente con razon. Ademas: resumir el estado real de Hito 0 /
Laboon VM segun LAB_VM_STATUS. No inventar estado de la VPS que no este en los ficheros.
```

## 5 — Biblioteca de Hipatia / MNEMOSINE: cerrar la convergencia

**Estado:** el 07-12 convergio el dictamen de que MNEMOSINE + la compuerta Hipatia +
las fases Robin son una sola membrana privacidad-cronologia
(`state/funcion_de_sueno/CONVERGENCIA_MNEMOSINE_HIPATIA_ROBIN.md`). Dos pendientes no
bloqueantes: (1) los docs de Hipatia aun no citan de vuelta a la Convergencia;
(2) MNEMOSINE no tiene fila en CREW/OPERACIONES/RUTINAS (es capa/protocolo, no skill).

**Prompt:**
```
Sesion: Hipatia / MNEMOSINE — cerrar convergencia.
Lee state/funcion_de_sueno/CONVERGENCIA_MNEMOSINE_HIPATIA_ROBIN.md,
state/funcion_de_sueno/MNEMOSINE_v0.md y
state/maceta_groot/biblioteca_hipatia/README.md. Pendientes elevados en el parte del
07-13: (1) anadir la cita cruzada desde el README de Hipatia hacia la Convergencia;
(2) decidir con el Capitan si MNEMOSINE entra como fila en CREW.md/OPERACIONES.md (es
capa/protocolo, no skill invocable) o se documenta como membrana aparte. Tarea: preparar
ambos cambios como propuesta concreta y pedir GO. Ojo con las rutas canonicas
reconciliadas el 07-12 (raiz real D:\Biblioteca de Hipatia\, fuera de la Maceta).
```

## 6 — Robin: meditacion semantica + cronos

**Estado:** `robin-meditacion` viva (1a meditacion 2026-06-25, precedente Drive);
`robin-cronos` embarcada 2026-07-04 (fecha_origen_resuelta + kairos + orden de olas de
ingesta). Cadencia semanal / a demanda.

**Prompt:**
```
Sesion: Robin — meditacion + cronos sobre el corpus.
Cargas la skill /robin-meditacion (auditoria semantica de los docs fundacionales:
contradicciones, estratos temporales, canon vivo vs fosil) o /robin-cronos (fechar
origen real del corpus y ordenar olas de ingesta de lo mas antiguo a lo mas reciente).
Lee state/meditacion/MEDITACION_spec.md y el ultimo informe en
state/meditacion/reports/. Tarea: correr una meditacion nueva sobre los docs
fundacionales (CLAUDE.md, CREW.md, canon en state/deckard/01_CANON.md, RETOMAR) y
reportar contradicciones o deriva de sentido nuevas desde 2026-06-25. Guardrail: audita
sentido, no superficie; no canon nuevo sin pilar/status/fuente/certeza.
```

## 7 — Usopp: extraccion Odysseus (kernel de seguridad) + indexar la fabula

**Estado:** `state/usopp/odysseus-extraction/` tiene el Phase 0 (security kernel,
pruebas locales, HANDOFF_C_TO_A del 2026-06-02) y un backlog de refinamiento. Aparte, la
fabula `LA_FIEBRE_DEL_CATALEJO.md` (consagrada v2.0.2, PR #73) sigue **sin indexar** en
CREW.md / README.md (hallazgo repetido en los partes 07-18/07-19).

**Prompt:**
```
Sesion: Usopp — Odysseus Phase 0 + indexar la fabula.
Lee state/usopp/odysseus-extraction/HANDOFF_C_TO_A_20260602.md,
sunny_refinement_backlog_20260602.json y los tests de phase0-local-test/. Tarea A:
resumir el estado del kernel de seguridad Phase 0 y que exige el handoff C->A para
avanzar. Tarea B (barata, cierra deriva senalada por el sueno): enlazar
state/usopp/fabulas/LA_FIEBRE_DEL_CATALEJO.md desde CREW.md (entrada de Usopp) o un
indice propio de state/usopp/fabulas/, para que deje de aparecer como huerfana. Guardrail:
no tocar material clinico; el kernel es codigo de seguridad defensivo/autorizado.
```

## 8 — NotebookLM: aplicar el triage y la ingesta pendiente

**Estado:** triage 2026-05-23 en `phase_2_reviewed_pending_apply`: 14 cuadernos, 13
renombrados, merge review completada, **renombrados de fase 2 pendientes de aplicar**.
Contrato WP-007 (done) fija el prompt de extraccion de candidatos sin canonizar.

**Prompt:**
```
Sesion: NotebookLM — aplicar triage + siguiente lote WP-007.
Lee state/notebooklm/NOTEBOOKLM_TRIAGE_20260523.md,
NOTEBOOKLM_MERGE_REVIEW_20260523.md y state/deckard/WP-007_NOTEBOOKLM_PROMPT_CONTRACT.md.
Estado: los renombrados de fase 2 quedaron revisados pero sin aplicar. Tarea: darme la
lista exacta de renombrados/movimientos pendientes por cuaderno (dominio NLM-SYS/OPS/
ACA/NAR/TRD/LEG) para ejecutarlos en NotebookLM, y preparar el prompt del siguiente lote
segun el contrato WP-007. Regla dura: no eliminar ningun cuaderno sin confirmacion
explicita; no pedir "que es todo mi sistema".
```

## 9 — Metatron: WP-009 (gastrulacion Wave8)

**Estado:** WP-009 en `plan_ready`. Wave8 en Plan con 16 candidatos y `source_mutations=0`.
**Mirror bloqueado hasta GO C0 explicito del Capitan.** Guardrail duro: material clinico
en `HOLD_CLINICO` es metadata-only.

**Prompt:**
```
Sesion: Metatron — WP-009 gastrulacion Wave8.
Lee state/deckard/05_WORK_PACKETS.md (WP-009) y state/metatron/. Estado: plan_ready,
Wave8 con 16 candidatos, source_mutations=0, Mirror BLOQUEADO hasta GO C0 del Capitan.
Tarea sin GO: revisar la coherencia del plan de gastrulacion y los 16 candidatos, y
preparar el resumen de decision para que el Capitan valore el GO C0. No ejecutar Mirror,
no mover fuentes, no publicar contenido clinico; metadata-only en todo lo marcado
HOLD_CLINICO / clinical_guarded / 00_BOVEDA_NEXUS.
```

## 10 — PuenteDeMando: reconciliacion GAS (@56)

**Estado:** dictamen vigente (2026-07-12): **traer @56 al repo, no llevar el repo antiguo
a @56**. Produccion @56 tiene un guard `COWORK_TOKEN` que no existe ni en el repo ni en la
copia D:; desplegar el repo encima seria una regresion de seguridad. GAS es adaptador de
espejo, no scheduler.

**Prompt:**
```
Sesion: PuenteDeMando — reconciliacion GAS @56.
Repo PuenteDeMando. Lee RECONCILIACION_GAS.md, INSTALACION-PATCH-V2.md y
thousand-sunny-patch-v2.js. Regla de oro vigente (07-12): traer @56 al repo, NO empujar
el repo/copia D: sobre @56 (eliminaria el guard COWORK_TOKEN — regresion de seguridad).
Tarea: proponer el procedimiento para extraer @56 al repo de forma no destructiva y
reconciliar log_cowork/COWORK_TOKEN, dejando GAS como adaptador de espejo (no scheduler).
No desplegar nada sobre el deploy vivo; el token vive solo en el editor, no se versiona.
```

---

_Sesion remota (Claude Code en la nube), sin acceso al hub. Este documento vive en la
rama `claude/alineacion-sesiones-5e50ax` para que el Capitan lo pueda pegar frente por
frente y para que otro actor lo espeje al sumidero._
