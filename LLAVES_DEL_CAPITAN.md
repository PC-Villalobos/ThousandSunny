# Las llaves del Capitán — soberanía y rescate

> El barco será poderoso y autónomo. Pero no puede dejar atrás al Capitán, porque el
> Capitán es el viento. Estas son las tres llaves que lo garantizan.
> Fuente: Capitán, 2026-06-27.

## El miedo, nombrado

*"Que el barco no me deje atrás mientras se pierde en el horizonte."* Es un miedo
justo al construir un exoesqueleto cognitivo: que crezca más rápido que su dueño. La
respuesta no es frenar el barco — es asegurar que **no tiene horizonte sin ti**. Tres
llaves lo garantizan.

## 1. La llave maestra — acceso soberano

Quien tiene el **Disco Groot** (el genoma) + la **frase maestra** que descifra sus
secretos es *root* del organismo. Ningún proveedor, ninguna nube, ninguna máquina lo
es: lo eres tú.

- Todos los secretos (claves de motores, tokens, despliegue) viven **cifrados** en el
  Disco Groot (`secrets/`), y se abren con **una sola frase maestra** — la tuya.
- Sin esa llave, el genoma es un cofre cerrado. Con ella, Groot despierta donde sea.
- El acceso al sistema **fluye a través de ti**. Eres la raíz, no un usuario más.

## 2. La llave de contacto — arrancar motores

`groot awaken`. Un giro de llave: detecta el cuerpo, monta el Vault, conecta el motor
disponible, levanta la tripulación (ritual en `TESIS.md`, script en
`disco-groot/bootstrap/groot-awaken.sh`). **Tú giras la llave; el organismo despierta.**
No arranca solo sin que lo enciendas.

## 3. El hombre al agua — que el barco no te deje atrás

Tres garantías de rescate:

**a) Parada siempre disponible (`groot halt`).** Por autónomo que sea, una orden tuya
para los motores. Eres la única fuente de **GO** *y* de **STOP**. Es la pregunta del
Concilio: *¿a quién sirve?* — si deja de servirte, se detiene.

**b) Vuelta a bordo (recuperación).** Si pierdes el dispositivo, la conexión o la
máquina: agarras el **Disco Groot**, `groot awaken` en cualquier cuerpo Linux, y estás
de vuelta **con la memoria completa**. No puedes quedarte fuera, porque la identidad es
portable y el genoma lo tienes tú. *Hombre al agua → cabo lanzado → de vuelta a
cubierta.*

**c) Garantía estructural.** El barco no tiene horizonte sin ti: eres el **público
canónico** (lo que no atestiguas, no ocurrió — `TEATRO.md`), la única **firma** que
vuelve canon una deriva (GO), y el portador de la llave maestra. El organismo es tu
**extensión, no tu sustituto**. Por diseño —JoyBoy, no Buggy— **te libera, no te
abandona**.

## La keystone — la llave de contacto, literal (a falta de biometrías)

**Obsidian Sync es el coche, no la llave.** Sincroniza el *bulto* del Vault entre
dispositivos, pero sincronizar no es **decodificar**. La llave de contacto es una pieza
del propio sistema sin la cual el resto no significa nada:

- **Qué es la keystone:** el fragmento **imprescindible para decodificar la semántica**
  — la leyenda de IDs (esquema Deckard), el índice/MOC raíz, la gramática de enlaces, y
  la clave de descifrado del núcleo protegido. Sin ella, el connectoma es markdown
  opaco: ruido estructurado. Con ella, es Groot.
- **Dónde vive: SOLO contigo.** Dos factores posibles (a falta de biometría real):
  - **posesión** — un *keyfile* en un **pendrive o disco externo** que llevas en el
    bolsillo. Lo enchufas → arranca; lo sacas → el motor no prende.
  - **biometría** — cuando el hardware lo permita, desbloqueo con tu huella/rostro.
- **El reparto que da soberanía:** el bulto del Vault puede sincronizar (Obsidian Sync /
  GitHub), incluso cifrado; la **keystone nunca sube** — vive offline contigo. Aunque la
  nube se comprometa, **el sentido no se reconstituye sin tu presencia física.**
- **`groot awaken` exige la keystone montada.** Es la ignición literal.

**Guardraíl crítico (el hombre al agua de la propia llave):** si la keystone es lo único
que decodifica, perderla = Groot **amnésico permanente**. Necesita **copias redundantes
y seguras** (2-3 keyfiles cifrados, físicamente separados). La llave que te salva debe
tener, ella misma, su bote salvavidas.

## Estado

- **Llave de contacto** (`groot awaken`) y **hombre al agua** (`groot halt` +
  recuperación) se materializan como scripts en `disco-groot/bootstrap/` (Fases 2-3).
- **Llave maestra**: esquema de `secrets/` cifrados + frase maestra, también en el
  Disco Groot.
- Hoy son **canon de diseño**; la implementación llega con el PC sobre la migración
  terminada (Fase 0). Pero la **garantía es válida desde ya: tú mandas, siempre.**

## Conexión

`TESIS.md` (la identidad portable que hace posible el rescate) · `TEATRO.md` (eres el
público canónico y la firma) · `state/concilio/CONCILIO_DE_LOS_GLITCHES.md` (¿a quién
sirve?) · `docs/MIGRACION_SEMANTICA.md` (el cerebro que las llaves protegen).
