# Roadmap de secuencia Linux

Fecha: 2026-07-12

## Dictamen

El salto de GAS a programas HTML ejecutables en Linux esta bloqueado por el PC Linux.

No se jubila GAS hasta que Odysseus exista, Linux este instalado y configurado, el vault este sincronizado, la seguridad este cerrada y el Capitan pueda operar el sistema con soltura.

Regla corta:

> Primero sustrato Linux. Luego puente HTML. GAS queda como presencia y notificacion hasta que haya reemplazo probado.

## Dos vias

### Via A - Bloqueada por Linux PC

Objetivo:

- Odysseus en el PC Linux.
- programas HTML ejecutables como puente de mando local.
- uso del PC por lenguaje natural.
- acceso seguro al vault local, Hipatia y zonas protegidas.
- integracion con GitHub, Obsidian y funcion de sueno.

Bloqueo actual:

- falta instalacion real de Linux.
- `E:` era una ISO montada como CD-ROM/CDFS, no un USB booteable.
- sin USB booteable no hay arranque real desde firmware.

Compuerta fisica:

1. Crear USB booteable real con Rufus o balenaEtcher.
2. No usar el Toshiba externo de 2 TB como destino salvo confirmacion explicita.
3. Backup de `C:` antes de tocar particiones.
4. Decidir dual boot vs instalacion limpia.
5. Arrancar ASUS con `Esc` para boot menu o `F2` para BIOS/UEFI.
6. Instalar Linux.
7. Configurar usuario, cifrado, SSH, Git, Obsidian, seguridad y backups.
8. Solo entonces empezar Odysseus / HTML ejecutable local.

### Via B - Avanzable sin Linux PC

Objetivo:

- que el cerebro y los contratos esten listos antes de que Odysseus arranque.

Puede avanzar ahora:

- migracion del campo semantico Drive -> Hipatia.
- Zoro: Drive -> Markdown literal.
- Robin: cronologia, kairos, estratos semanticos.
- Chopper: proteccion de terceros identificables y duda conservadora.
- MNEMOSINE: Anillo 0 local + anclas + destilados.
- Hipatia: compuerta `_protegido` / `_public_safe`.
- Laboon en VPS: Open WebUI + DeepSeek API + acceso seguro.
- contratos y runbooks en GitHub.

No depende del PC:

- levantar VPS.
- instalar Open WebUI.
- conectar DeepSeek por API.
- cerrar registro abierto.
- proteger acceso con Tailscale o equivalente.
- preparar perfiles de nakamas.

## Reparto honesto del hardware

El ASUS tiene RTX 3050 Laptop GPU con 4 GB VRAM.

Implicacion:

- DeepSeek pesado no es objetivo local realista.
- el motor grande vive por API o VPS.
- el PC local conserva raw, vault, seguridad, Obsidian y ejecucion.
- los modelos locales deben ser ligeros o cuantizados.

El PC es el sustrato soberano. No tiene que ser el motor grande.

## Relacion con GAS

GAS sigue vivo mientras:

- Linux no este instalado.
- Odysseus no exista.
- el puente HTML local no este probado.
- el vault no este sincronizado.
- la seguridad no este cerrada.
- no haya rollback claro.

GAS puede seguir sirviendo:

- Telegram.
- notificaciones.
- Bitacora.
- presencia minima.
- puente temporal.

Prohibido:

- desplegar hacia atras.
- borrar guardrails vivos.
- reemplazar GAS por una teoria no probada.

## Criterios para pasar de GAS a HTML Linux

No iniciar migracion funcional hasta cumplir:

- Linux instalado y estable.
- usuario del Capitan operativo.
- GitHub autenticado.
- Obsidian vault sincronizado.
- Hipatia local con zonas protegidas.
- MNEMOSINE Anillo 0 definido localmente.
- Laboon/Open WebUI accesible y cerrado.
- DeepSeek API o motor equivalente funcionando.
- bridge-linux puede leer el vault sin exponer raw.
- prueba de tarea simple por lenguaje natural completada.
- rollback a GAS documentado.

Cuando se cumpla:

1. elegir un flujo GAS pequeno.
2. reimplementarlo como HTML ejecutable local.
3. probarlo con datos no sensibles.
4. registrar resultado.
5. solo despues migrar el siguiente flujo.

## Orden recomendado

### Ahora

1. Mantener GAS estable.
2. Mergear o revisar contratos de MNEMOSINE / Hipatia / Robin.
3. Avanzar migracion Drive -> Hipatia por lotes.
4. Levantar Laboon en VPS si se quiere progreso sin PC.
5. Preparar USB booteable real.

### Siguiente compuerta

1. Backup.
2. decision dual boot vs limpio.
3. instalacion Linux.
4. hardening basico.
5. Obsidian + GitHub + vault.

### Despues de Linux

1. Odysseus.
2. HTML ejecutables.
3. control por lenguaje natural.
4. sustitucion gradual de GAS.

## Regla final

La migracion semantica no espera al PC.

La soberania operativa si.

No mezclar esos relojes.

## Documentos relacionados

- `PRE_LINUX_KEY_GATE.md` - compuerta dura de la Via A: no instalar Linux sobre C:
  sin backup offline **verificado** de las dos llaves de las capsulas Anillo 0
  (academica + Caso 0), los fosiles exclusivos de Groot y las sesiones. Sin la
  llave, la capsula clinica cifrada es irrecuperable para siempre.
- `LAB_VM_STATUS_20260715.md` - estado del laboratorio Ubuntu/Open WebUI/Ollama:
  circuito sintetico probado, 25 GB extra para Docker, compuertas cerradas, sin
  permiso para Hipatia real ni material resoluble.
