# Contrato del actor contratado

> Un **actor contratado** es un modelo externo por API (DeepSeek hoy) que encarna
> personajes de la tripulación sin vivir dentro del barco. En la gramática de
> `TEATRO.md` es un **actor**, nunca un personaje y nunca el director. Este contrato
> dice qué puede tocar, qué puede afirmar y por dónde pasan sus manos.

## 1. Lo que recibe

**Solo el paquete de Z3.** Nunca una ruta, nunca la bodega, nunca el compartimento
de identidad, nunca una credencial. El paquete lo construye el puerto y lleva, por
cada pieza, su nivel y su recibo. De las clases guardadas recibe **derivado**: clase,
recuento, marcadores, huella. No recibe el texto.

Si necesita más contexto, la respuesta correcta es pedir un GO que amplíe el paquete
— no pedir la ruta.

## 2. Lo que puede afirmar

Puede **razonar** y **redactar**. No puede **aplicar** ni **afirmar que algo ocurrió**.

> **Regla del recibo:** un actor nunca dice que un registro se escribió si lo único
> que produjo fue un borrador. "Propongo este evento para Bitácora" es verdad.
> "He registrado el evento" es falso hasta que alguien con manos lo aplicó y lo
> verificó.

Esta regla no es cortesía: es la diferencia entre la Bitácora como público canónico
(`TEATRO.md`, ley 3) y la Bitácora como decorado.

## 3. Cadena de constancia — quién redacta, quién valida, quién autoriza

```
actor contratado  ->  redacta dos borradores separados:
                        (a) evento público-seguro para Bitácora
                        (b) registro de cambio para GitHub
       |
supervisión       ->  valida el borrador contra el material y las reglas
       |
manos autenticadas ->  aplican SOLO en el repositorio, rama y rutas que nombre el GO
       |
verificación      ->  se comprueba el resultado y se redacta la constancia real
       |
Capitán           ->  conserva el veto y el cierre
```

**Borrador ≠ constancia.** El actor produce (a) y (b); nada más. Quien aplica es
quien tiene credenciales, y las credenciales **no se comparten con el actor**: viven
en el entorno del Capitán y nunca viajan en un prompt, un paquete ni un log.

## 4. Manos mediadas — cómo se le dan herramientas sin darle la cuenta

El actor puede llegar a trabajar a un nivel parecido al de un agente de la casa
(leer un repositorio autorizado, buscar un fichero, proponer y aplicar un parche en
una rama de trabajo, preparar un commit, abrir un borrador de PR, redactar
constancia). Lo que cambia no es la capacidad: es **por dónde pasan las manos**.

```
actor razona y propone una herramienta
  -> el puente local comprueba GO, repositorio, rama y ruta permitida
    -> ejecuta con la sesión autenticada del Capitán
      -> supervisión revisa el resultado
        -> el Capitán conserva veto y cierre
```

**"Todos los repositorios de mi cuenta" no es un alcance.** Cada aplicación real
nombra: repositorio, rama, rutas permitidas, y si el resultado es borrador, commit o
publicación. Un GO sin esos cuatro campos no se ejecuta.

**Acciones irreversibles** —push a rama protegida, merge, despliegue, escritura en
Bitácora canónica— siguen requiriendo el circuito de revisión completo, tenga el
actor herramientas o no.

## 5. Lo que nunca sale hacia el actor

Identidad real · credenciales y tokens · rutas absolutas de la bóveda o de la
Biblioteca de Hipatia · transcripciones · Doctoralia, Plaud, Noa Note · contenido
literal de clase `asistencial` o `intimo` · cualquier fuente real mientras la Fase 0
esté abierta.

## 6. Lo que se conserva de cada encargo

El **recibo técnico** y la **huella** de la salida. No la salida en claro y no la
cadena de razonamiento: si el material de entrada estaba guardado, guardar el
razonamiento sobre él lo reintroduce por la puerta de atrás.

## 7. Estado

Contrato **verificado contra canario sintético** (lectura, razonamiento supervisado
y redacción de constancia en borrador, sin escritura). **No verificado** para manos
mediadas: el puente de herramientas del §4 es diseño, no código. Ese es un GO
posterior y su propio experimento.
