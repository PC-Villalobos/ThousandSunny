// Corredor de las pruebas de la funcion de sueno.
//
// POR QUE EXISTE
// `test:sueno` invocaba `python3 -m unittest` directamente. Dos consecuencias:
//
//   1. En Windows `python3` no suele estar en PATH y `npm test` moria con un
//      ENOENT opaco, por el nombre del interprete y no por el contenido.
//   2. Las pruebas de Node de esta misma funcion —`lib/*.test.mjs`— no las
//      ejecutaba nadie. Existian, pasaban, y no protegian nada: 19 pruebas
//      invisibles, entre ellas la degradacion de la Bitacora de Hipatia.
//
// REGLA DE ESTE FICHERO
// La misma que el agregador de Cubierta: la ausencia se declara, nunca se pasa
// por alto. Un interprete que falta se dice con su remedio; un fichero de
// pruebas que ninguna tanda ejecuta es una huerfana y sale con error. Los
// ficheros se descubren por barrido, no por lista a mano: asi un fichero nuevo
// entra solo y no nace huerfano.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUENO = "state/funcion_de_sueno";

const esPruebaNode = (base) => base.endsWith(".test.mjs") || /^test_.*\.mjs$/.test(base);
const esPruebaPython = (base) => /^test_.*\.py$/.test(base);
const normalizar = (relativo) => relativo.split(path.sep).join("/");

/** Ficheros de prueba bajo un directorio, a cualquier profundidad. */
function barrer(relativo) {
  const dir = path.join(RAIZ, relativo);
  if (!existsSync(dir)) return [];
  const encontrados = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === "node_modules" || entrada.name.startsWith(".")) continue;
    const hijo = path.join(relativo, entrada.name);
    if (entrada.isDirectory()) encontrados.push(...barrer(hijo));
    else if (esPruebaNode(entrada.name) || esPruebaPython(entrada.name)) {
      encontrados.push(normalizar(hijo));
    }
  }
  return encontrados;
}

/**
 * Primer interprete de Python que responde. `PYTHON` manda sobre todo: es el
 * remedio para quien lo tenga con otro nombre o fuera del PATH.
 */
function buscarPython() {
  const candidatos = [process.env.PYTHON, "python3", "python"].filter(Boolean);
  for (const bin of candidatos) {
    const r = spawnSync(bin, ["--version"], { stdio: "ignore" });
    if (!r.error && r.status === 0) return bin;
  }
  return null;
}

const ficheros = barrer(SUENO);
const pruebasNode = ficheros.filter((f) => esPruebaNode(path.basename(f)));
const pruebasPython = ficheros.filter((f) => esPruebaPython(path.basename(f)));

// `unittest discover` recorre con fiabilidad los ficheros que cuelgan de la raiz
// que se le da; mas abajo solo entra en paquetes. Lo que quede mas profundo no se
// da por ejecutado: se declara.
const cubiertosPython = new Set(
  pruebasPython.filter((f) => path.posix.dirname(f) === SUENO),
);

let tandas = 0;
let fallidas = 0;
const ausentes = [];

const python = buscarPython();
if (python && pruebasPython.length) {
  process.stdout.write(`\n=== Funcion de sueno — pruebas de Python (${python}) ===\n`);
  const r = spawnSync(python, ["-m", "unittest", "discover", "-s", SUENO, "-p", "test_*.py"], {
    cwd: RAIZ,
    stdio: "inherit",
  });
  tandas += 1;
  if (r.status !== 0) fallidas += 1;
} else if (!pruebasPython.length) {
  ausentes.push(["python", `no hay test_*.py en ${SUENO} en este arbol`]);
} else {
  ausentes.push([
    "python",
    "ningun interprete de Python responde (probados: PYTHON, python3, python)\n" +
      "         remedio: instala Python o apunta PYTHON al binario, p. ej. PYTHON=py npm run test:sueno",
  ]);
}

if (pruebasNode.length) {
  process.stdout.write("\n=== Funcion de sueno — pruebas de Node (lib) ===\n");
  const r = spawnSync("node", ["--test", ...pruebasNode], { cwd: RAIZ, stdio: "inherit" });
  tandas += 1;
  if (r.status !== 0) fallidas += 1;
} else {
  ausentes.push(["node", `no hay *.test.mjs bajo ${SUENO} en este arbol`]);
}

const huerfanas = pruebasPython.filter((f) => !cubiertosPython.has(f));

process.stdout.write("\n--- funcion de sueno ---\n");
process.stdout.write(`tandas ejecutadas: ${tandas} de 2\n`);
process.stdout.write(`ficheros de Node ejecutados: ${pruebasNode.length}\n`);

for (const [id, motivo] of ausentes) {
  process.stdout.write(`AUSENTE  ${id}: ${motivo}\n`);
}
for (const f of huerfanas) {
  process.stdout.write(`HUERFANA ${f}: cuelga mas abajo de ${SUENO} y discover no lo alcanza\n`);
  process.stdout.write(`         subelo a ${SUENO}/ o hazlo paquete con __init__.py\n`);
}

if (!tandas) {
  process.stdout.write("\nNinguna tanda de la funcion de sueno se pudo ejecutar.\n");
  process.exit(1);
}
if (fallidas) {
  process.stdout.write(`\n${fallidas} tanda(s) con fallos.\n`);
  process.exit(1);
}
if (huerfanas.length) {
  process.stdout.write(`\n${huerfanas.length} fichero(s) de pruebas sin ejecutar.\n`);
  process.exit(1);
}
process.stdout.write("todas las tandas presentes pasan, sin huerfanas\n");
