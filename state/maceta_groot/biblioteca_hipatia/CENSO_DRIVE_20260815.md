# Censo Drive -> Vault — 2026-08-15

Actor: claude-code (sesion cloud, sin hub ni monturas locales)
Metodo: conector Google Drive, **metadata-only**. Cero lecturas de contenido.
Alcance: parcial y declarado. Este censo no barre el corpus entero (ver Limites).
Estado: sonda 1 de 2. Falta contrapeso (regla 4 de `robin-cronos`).

## Titular

De las **144 piezas barridas, 5 estan en texto plano**. El resto —139— son
Google Docs nativos. **El 96,5% del corpus barrido no es texto**, es un objeto
propietario que ninguna herramienta local lee sin conversion.

No es una estimacion. Es el `mimeType` que devuelve Drive pieza a pieza.

## Lo barrido

| Carpeta Drive | Piezas | Texto plano | Google Docs |
|---|---:|---:|---:|
| `[N1-MYT-BIB] BIBLIOTECA_HIPATIA__MYTHOS` | 65 | 1 | 64 |
| `04_Raices` (raiz) | 12 | 2 | 10 |
| `04_Raices/ACA` (academico) | 22 | 0 | 22 |
| `04_Raices/NAR` (narrativo) | 5 | 0 | 5 |
| `04_Raices/SIS` (sistema) | 40 | 2 | 38 |
| **Total** | **144** | **5** | **139** |

El unico texto plano de la estanteria mitica es su propio LEEME. La estanteria
academica y la narrativa no tienen ni una sola pieza en texto.

## Tres hallazgos que cambian el plan

### 1. Veintisiete ficheros mienten en el nombre

**27 Google Docs llevan `.md` en el titulo.** Diez en la raiz de `04_Raices`,
diecisiete en `SIS`. Son las series `digestion_local_*.md` y `ananda_sutras_*.md`.

Un inventario que cuente por extension del titulo los dara por migrados. Un
`ls` los da por migrados. Obsidian los abre y no ve nada. Es exactamente el
nudo que `zoro-migrate` existe para cortar (`.md.gdoc` y Docs nativos con
nombre de markdown), y sigue sin cortar en estas dos series.

**Consecuencia operativa:** cualquier metrica de avance basada en nombres de
fichero esta inflada. La unica metrica valida es `mimeType`.

### 2. Siete piezas duplicadas exactas

Mismo titulo, dos IDs, creados con segundos de diferencia:

- Estanteria mitica: 3 pares (huella de re-ejecucion del 2026-07-04).
- Estanteria academica: 4 pares, uno de ellos marcado `(1)` por el propio Drive.

No son versiones: son colisiones de una tirada repetida. Ingerir sin deduplicar
mete siete piezas fantasma en la Biblioteca y contamina cualquier grafo posterior.

### 3. La estratigrafia esta contaminada por la migracion

En `04_Raices/ACA` y `NAR` **todas** las piezas tienen `modifiedTime` del
2026-06-13 a las 03:22 — la marca de un movimiento masivo de carpetas, no de
edicion real. Sus `createdTime` van de mayo a junio de 2026.

Es el caso que anticipa la regla 1 de `robin-cronos`: la fecha del metadato es
huella de migracion, no de origen. **Ordenar las olas por `modifiedTime` ordena
mentiras.** Hace falta `fecha_origen_resuelta` antes de decidir el orden de ingesta.

## La contraparte: que hay en el Vault

En este repo, `vault/` tiene **9 ficheros y cero corpus**: tres plantillas, cuatro
manifiestos de lotes Metatron, una geometria y la config. Todo andamiaje.

`state/maceta_groot/biblioteca_hipatia/` tiene **2 ficheros**, ambos contrato
public-safe. Ninguno es contenido.

**Piezas del corpus barrido presentes en el Vault de este repo: 0 de 144.**

Esto no dice que la Biblioteca local este vacia: la raiz real es
`D:\Biblioteca de Hipatia\` y esta sesion no la ve. Lo que si queda demostrado
es que **la copia que la nube puede leer no tiene ni una pieza del corpus**, y
que el barrido de Drive no encuentra el texto convertido junto a su fuente.

## Limites de este censo (leer antes de citarlo)

Lo que **no** se ha barrido, y por que:

- `00_BOVEDA_NEXUS` — sellada e hibernada por GO C0 desde el 2026-07-05. No se toca.
- `[N2-PEN-INB] 02_CLINICA` — membrana clinica. Metadata-only sin compuerta; no se
  ha descendido ni a nivel de titulos.
- `04_Raices/SOF`, `/ETH`, `/OPE`, `/NEX` — cuatro estratos sin barrer.
- `01_SISTEMA`, `03_PROYECTOS`, `04_PERSONAL`, `90_ARCHIVO`, `00_INBOX` y el resto
  de raices — sin barrer.

El total real del corpus es **mayor** que 144. Este censo mide una muestra
dirigida a los estantes que la Biblioteca declara suyos, no el universo.

Ademas, por regla 4 de `robin-cronos`, **una sonda no es el territorio**. Esto es
la sonda por conector. Falta la sonda mecanica local (Codex, Drive montado) y el
contraste registrado. Hasta entonces estos numeros son indicativos, no canon.

## Lo que este censo autoriza a decidir

1. La conversion a texto **no esta empezada** en los estantes mitico, academico
   y narrativo. No es "casi"; es cero y cinco.
2. El cuello no es el volumen. 144 piezas de 2-6 KB son minutos de conversion.
   El cuello es que **no hay pipeline reproducible corriendo**, y que lo que
   parece hecho por el nombre no lo esta.
3. Antes de ingerir hace falta, en este orden: deduplicar (7 pares),
   resolver `fecha_origen_resuelta` (contaminacion del 06-13) y solo despues
   ordenar olas.

## Lo que NO autoriza

No autoriza a declarar porcentaje de avance global del corpus: el denominador
real no esta medido. Cualquier "vamos por el X%" hoy es invencion.

---

*Metadata-only. Sin IDs de Drive, sin titulos clinicos, sin contenido. Frontera
`robin-cronos` regla 5 respetada: el LLM cataloga, no acarrea.*
