# Jardín — runtime independiente

Fecha: 2026-08-17
Packet: pendiente de asignación por el Capitán
Estado: criterio declarado, sin implementación

## Decisión

El Jardín del Thousand Sunny debe poder usarse **sin Codex y sin Claude Code**.

Hoy el Jardín solo existe mientras un taller de construcción está abierto. La
decisión del Capitán del 2026-08-17 separa dos cosas que estaban fundidas:

- **Uso diario**: el Jardín funciona por sí mismo, con su propio presupuesto de
  créditos contra un motor LLM.
- **Construcción**: Codex y Claude Code amplían el mundo, reparan una isla o
  construyen una herramienta. Son talleres. **No son dependencias de runtime.**

Si el Jardín deja de funcionar cuando se cierra el taller, esta decisión no está
implementada.

## Jerarquía

```
Sites / navegador
       |
Runtime del Jardín en enclave local o VM
       |-- Biblioteca Hipatia + Bitácora
       |-- gestor de permisos, GOs y presupuesto
       |-- adaptador de motor LLM con créditos
       |-- adaptadores salientes: Obsidian, GitHub, Discord/Telegram
       |
Codex y Claude Code
       |
talleres: modifican y versionan el producto, no lo sostienen
```

1. **Navegador** — superficie de entrada. No custodia nada.
2. **Runtime privado** — enclave o VM del Capitán. Aquí vive todo lo que decide.
3. **Talleres** — entran a construir, salen sin dejar al Jardín sin piernas.

## Invariantes

1. **La API key no vive nunca en la web del navegador.** Vive en el runtime
   privado. Una clave enviada al cliente es una clave publicada, incluso si la
   interfaz no la muestra.
2. El runtime es el único que llama al motor. La web pide; el runtime decide si
   la llamada ocurre.
3. **El runtime aplica cuatro controles antes de cada llamada**, y ninguno es
   opcional:
   - límite de gasto contra el presupuesto de créditos;
   - registro de cada llamada;
   - filtro de qué contexto puede salir del enclave;
   - GO explícito antes de dar "manos" a un agente.
4. El motor LLM entra por **adaptador intercambiable**. Ningún proveedor concreto
   queda cableado en el producto.
5. Hipatia Local conserva la autoridad operativa (`POSICION.md` §4). El Jardín es
   superficie de uso, no libro mayor — la misma frontera que
   `state/usopp/monitor-coronal/ESTATUTO_COHERENCIA.md` §6 fija para los Sites.
6. Los adaptadores salientes no inventan protocolo. Heredan la regla de
   `SUNNY_CORE.md`: reflejan, traducen y notifican.

## Dos ranuras que no se confunden

El diseño tiene dos huecos distintos, y meter una pieza en el hueco equivocado es
el error de arquitectura más fácil de cometer aquí:

| Ranura | Qué es | Qué aporta |
| :---- | :---- | :---- |
| **Motor** | Inferencia con créditos propios detrás de una API key | Sostiene el uso diario del Jardín |
| **Taller** | Agente que construye y versiona el producto | Amplía el mundo; prescindible en el día a día |

Codex y Claude Code son talleres. Un agente de programación **no puede ocupar la
ranura de motor**, por muy bien que configure proveedores: no vende inferencia.

## Motor: DeepSeek

**Decisión del Capitán, 2026-08-17: el motor es DeepSeek.** Corrige "Vixic",
nombre que no designa ningún proveedor verificable — la búsqueda del mismo día no
devolvió ninguno, y `get-vix/vix` es un agente de programación AGPL-3.0 que exige
clave propia del usuario y no tiene inferencia ni créditos, es decir, un taller y
no un motor.

Lo verificado el 2026-08-17 que encaja con el diseño:

| Rasgo | Estado | Consecuencia para el runtime |
| :---- | :---- | :---- |
| Interfaz compatible con OpenAI | Verificado | El adaptador del invariante 4 es una capa fina: cambia `base_url` y clave |
| `base_url` `https://api.deepseek.com` (`/v1` para SDK de OpenAI) | Verificado | El `/v1` no indica versión de modelo; no leerlo como tal |
| Saldo prepago, sin tramo gratuito en la API de pago | Verificado | Encaja literalmente con "una API key con créditos" |
| `402` mientras no haya saldo | Verificado | El gestor de presupuesto debe distinguir "sin saldo" de "fallo del motor" |
| `GET /user/balance` | Verificado | El runtime puede leer su propio saldo en lugar de estimarlo |

`GET /user/balance` es la pieza que cierra el invariante 3: el límite de gasto se
aplica contra saldo real consultado, no contra un contador local que puede
desincronizarse.

**Sin verificar desde esta sesión:** los identificadores de modelo y los precios
vigentes. `api-docs.deepseek.com` está bloqueado por el proxy de egreso de este
entorno, y las fuentes indexadas que los citan no son documentación oficial. Se
leen de la documentación viva al implementar; no se copian de aquí.

El invariante 4 sigue en pie con el motor ya elegido: DeepSeek ocupa la ranura, no
se cablea. Es lo que permite cambiar de proveedor sin rehacer el Jardín.

## Enclave: la VM Ubuntu

**Decisión del Capitán, 2026-08-17: el enclave es la VM Ubuntu.** El motivo
declarado es no arrastrar los permisos y las interfaces de Windows.

Precisión que conviene no perder: Ubuntu **no salta** los permisos de Windows. Lo
que evita es que la lógica de agentes dependa de interfaces de escritorio, sesiones
abiertas o automatismos frágiles. La independencia que compra es de sustrato, no de
autoridad.

### Reparto

| Lado | Qué aloja |
| :---- | :---- |
| **VM Ubuntu** | Gateway privado del Jardín y la clave de DeepSeek; trabajadores y agentes; cola de misiones, presupuestos, registros y verificaciones; conectores con GitHub, Discord y Telegram; la API que consume Sites |
| **Windows** | Estación de construcción y biblioteca física. Codex y Claude Code siguen modificando el proyecto desde aquí |

El uso diario del Jardín no depende de que esas aplicaciones estén abiertas. Es la
misma decisión del apartado 1, ahora con sustrato asignado.

### Frontera de archivos

```
Biblioteca Windows / disco externo
        |  solo lectura o zona de admisión explícita
VM Ubuntu
        |
digestión, propuestas y ejecución autorizada
        |
Bitácora y proyección Sites
```

**Invariante 7: no se monta el disco de Windows con acceso de escritura dentro de
la VM.** Entra por zona de admisión controlada y staging. Así Groot digiere
cargamentos sin poder alterar la biblioteca original.

Esta frontera es la implementación física del estado `PENDING_ADMISSION` que
`state/usopp/monitor-coronal/ESTATUTO_COHERENCIA.md` §5 fija para Drive: misma
regla de admisión explícita, otro sustrato. Y concuerda con `CATALOGO_NUDOS.md`,
que ya preveía a Groot interpretando la tripulación completa con un solo actor
disponible, "DeepSeek + OpenClaw/Open WebUI".

### Lo que hereda de la recepción del 2026-07-27

`state/recepcion/RECEPCION_CUBIERTA_20260727.md` cierra con una exclusión que
parece chocar con esta decisión: *"No conecta OpenClaw, no admite DeepSeek como
destino"*. **No es contradicción: era alcance de aquel GO**, no una prohibición
permanente. Esta decisión es precisamente el GO propio al que esa lista remitía.

Tres cosas de aquella recepción sí siguen vinculando, y son las que evitan repetir
el fallo:

1. **Precedente de desborde hacia esta misma VM.** El asiento R2 registra que un GO
   que decía "local y reversible" acabó alcanzando la VM con
   `sunny-flota-bridge.service`. La VM ya tiene huella previa: **inventariar qué
   corre en ella antes de instalar el gateway**, no suponerla limpia.
2. **Declarado no es observado (R6).** El motor de OpenClaw se rebajó a *no
   verificado* porque la configuración no prueba qué motor respondió. Aplica igual
   a DeepSeek: que la clave esté puesta no demuestra que DeepSeek contestó. El
   registro del invariante 3 debe guardar la traza de la respuesta, no la
   configuración.
3. **OpenClaw sigue requiriendo GO propio.** Puede vivir en el enclave, pero su
   conexión no viaja incluida en esta decisión.

## Bloqueos reales del sustrato

El enclave designado **es hoy la pieza congelada**. Esto no es una dependencia
futura difusa, está en la posición verificada:

| Pieza | Estado en `POSICION.md` §5 |
| :---- | :---- |
| VM Ubuntu / Synthetic Lab | **Congelada.** VDI de 21 GB parado |
| Franky Build Kit (Linux) | **Bloqueado**: requiere USB booteable y backup verificado |
| Rocket Raccoon / Ubuntu | `unknown` en el Monitor: sin canal de salud identificado |

Con la VM Ubuntu designada como enclave, **descongelarla pasa a ser el camino
crítico del Jardín**, no un detalle de despliegue: es la primera misión, y va antes
de cualquier gateway, adaptador o presupuesto. Un plan que dé el enclave por hecho
está construyendo sobre una VM parada.

Nota de coherencia entre fuentes: `POSICION.md` §5 la declara congelada y el Monitor
la ve `unknown` por falta de canal de salud, mientras el asiento R2 del 2026-07-27
registra un servicio desplegado en ella. Las tres cosas pueden ser ciertas a la vez
—VDI parado, sin observabilidad, con huella de un despliegue previo—, pero el estado
real solo se sabe arrancándola y mirando. Hasta entonces es `unknown`, no "limpia".

## Lo que este documento no hace

No implementa nada, no fija presupuesto y no toca el Jardín. Registra la separación
uso/construcción, los invariantes de custodia de la clave y el motor elegido.

Pendiente del Capitán: con qué presupuesto de créditos arranca el Jardín. Y antes de
todo, descongelar la VM e inventariar qué corre ya en ella. Cada paso requiere misión
y GO separados; conectar OpenClaw también.

---

*Este documento registra criterio madurado del Capitán. Se actualiza cuando cambie
el criterio, no cuando cambie la implementación.*
