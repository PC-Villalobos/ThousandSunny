# Rama tecnica `state/sleep-ledger-v1`

Esta rama **no es codigo**. Es el soporte persistente del journal global de la
funcion de sueno: la fuente de verdad del **estado operacional** del ciclo
nocturno.

Es una rama **huerfana**: no comparte historia con el arbol de fuentes. Esa
separacion es deliberada — el journal se escribe cada noche, el codigo no, y
mezclar ambos ritmos fue exactamente lo que produjo el fallo que este journal
existe para impedir.

## Contenido

```
state/funcion_de_sueno/sleep_events.jsonl
```

Nada mas. Cualquier otro fichero en esta rama es un error.

## Que NO hacer

- **No mergear esta rama en la rama de codigo, ni al reves.** Si el journal
  aterriza en el tronco de fuentes, vuelve a estar sujeto al ritmo de los merges
  y reaparece el problema original: cada rama viendo una copia parcial.
- **No editar el fichero a mano.** El journal es append-only y encadenado por
  hash; una edicion manual rompe la cadena y la rompe en silencio.
- **No borrar ni reescribir registros historicos.** Una corrida que ocurrio,
  ocurrio. Las correcciones se expresan anadiendo transiciones, no alterando las
  existentes.

## Contrato

El esquema, las etapas, la identidad de corrida, las reglas de deduplicacion y
la derivacion de la racha estan definidos en la rama de codigo:

```
state/funcion_de_sueno/JOURNAL_v1.md
```

Motores de referencia, en paridad byte a byte:

```
state/funcion_de_sueno/sleep_journal.py
state/funcion_de_sueno/sleep_journal.mjs
```

## Disciplina de escritura

Un **unico consolidador serializado** escribe aqui. Antes de anadir, lee la
cabeza actual y la pasa como `expected_head`: si el journal cambio bajo sus
pies, la operacion se rechaza en vez de sobrescribir.

La racha **jamas se persiste**. Se deriva al leer, sobre los eventos globales de
etapa `executed` ordenados por `scheduled_at`.

## Estado inicial

Migracion desde `sleep_ledger.jsonl` consolidado (74 eventos, PR #86), generada
por ambos motores con resultado byte-identico:

| | |
|---|---|
| Registros | 292 |
| Ejecuciones globales | 73 |
| Racha maxima | 3 |
| Ejecuciones sin absorber | 0 |
| Incidencias de migracion | 0 |
| Cadena de integridad | verifica |

El ledger original no se borra: pasa a ser observacion local, nunca evidencia
global por si sola.

## Verificar la cadena

Desde un arbol con la rama de codigo disponible:

```
python3 -c "import sys; sys.path.insert(0,'state/funcion_de_sueno'); \
from sleep_journal import Journal; \
j=Journal.loads(open('state/funcion_de_sueno/sleep_events.jsonl').read()); \
print('cadena:', j.verify_chain(), '| racha max:', j.max_streak())"
```
