// Corredor de las superficies de `state/` que ninguna tanda ejecutaba.
//
// POR QUE EXISTE
// El 2026-10-16 se cerro el agujero de las huerfanas en las superficies de
// Cubierta, y el propio acta dejo dicho lo que quedaba fuera: 8 pruebas en
// `state/melampo_lab/` y 7 ficheros de Python en `state/hipatia_bridge_runtime/`,
// que nadie corria. `npm test` seguia verde con ellos dentro.
//
// Este corredor reclama `state/` entero menos lo que ya tiene dueno, y no se
// limita a los dos casos conocidos: barre, y cualquier fichero con forma de
// prueba que aparezca ahi dentro tiene que caer en una de estas cuatro cajas o
// sale con error. Asi se cierra la clase de fallo, no dos instancias de ella.
//
//   SE EJECUTA        la prueba corre aqui
//   YA TIENE DUENO    otra tanda la corre, y se dice cual
//   NO ES UNA SUITE   el nombre engana; se dice por que
//   SIN CONFIG LOCAL  la proyeccion excluye lo que necesita, a proposito
//
// DOS COSAS APRENDIDAS EJECUTANDO, QUE ESTAN AQUI POR ESO
//
// 1. Las pruebas de Hipatia **escriben en su propio arbol**: ejecutar
//    `test_closure_core_ola2_1.py` en su sitio creo `closure/` y un fichero con
//    nombre de ruta de Obsidian dentro de `state/hipatia_bridge_runtime/`. Eso
//    viola la regla de la casa —no se muta `state/` fuera de las tres rutas
//    permitidas— y encima rompe su propia prueba del manifiesto, que comprueba
//    que ninguna raiz de datos soberanos este proyectada. Por eso la mitad de
//    Python corre sobre una **copia** y nunca en su sitio.
// 2. Dos de las siete necesitan `config/bridge_roots.json` y
//    `config/git_repositories.json`, configuracion local que la proyeccion
//    excluye deliberadamente. No se inventan: se declaran, con el fichero que
//    les falta y por que no esta.

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Superficies de `state/` que ya tienen su propio corredor. */
export const CON_DUENO = {
  "state/funcion_de_sueno": "npm run test:sueno",
  "state/cubierta_ui": "npm run test:cubierta",
};

/** Ficheros que ya corre otra entrada de `npm test`. */
export const YA_EN_NPM_TEST = {
  "state/usopp/odysseus-extraction/phase0-local-test/test_phase0_security_kernel.js": "npm run test:security",
  "state/usopp/odysseus-extraction/phase0-local-test/test_hub_utils.js": "npm run test:hub-utils",
};

/** Tiene forma de prueba por el nombre y no lo es. */
export const NO_ES_SUITE = {
  "state/usopp/odysseus-extraction/phase0-local-test/hub-server.phase0-local-test.js":
    "es el servidor del hub v2.0, no una suite: lo disfraza el nombre del directorio, y pide express y ws",
};

/** Necesitan configuracion local que la proyeccion excluye a proposito. */
export const SIN_CONFIG_LOCAL = {
  "state/hipatia_bridge_runtime/tests/test_bridge_core_ola2.py": "config/bridge_roots.json",
  "state/hipatia_bridge_runtime/tests/test_git_evidence_ola3a.py": "config/git_repositories.json",
};

/** Superficies cuyas pruebas escriben en su arbol: corren sobre una copia. */
export const EN_COPIA = {
  "state/hipatia_bridge_runtime":
    "sus pruebas crean closure/ y vistas de Obsidian en su raiz; en su sitio mutarian state/",
};

const esPruebaNode = (base) => base.endsWith(".test.mjs") || /^test_.*\.mjs$/.test(base);
const esPruebaPython = (base) => /^test_.*\.py$/.test(base);
const esPruebaJs = (base) => base.endsWith(".js") && base.includes("test");
export const esPrueba = (base) => esPruebaNode(base) || esPruebaPython(base) || esPruebaJs(base);

const normalizar = (relativo) => relativo.split(path.sep).join("/");

/**
 * Ficheros con forma de prueba bajo `relativo`, a cualquier profundidad,
 * saltando las superficies con dueno. `raiz` se puede cambiar para probar el
 * barrido sin plantar ficheros dentro de `state/`.
 */
export function barrer(relativo, raiz = RAIZ, conDueno = CON_DUENO) {
  const dir = path.join(raiz, relativo);
  if (!existsSync(dir)) return [];
  const encontrados = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === "node_modules" || entrada.name.startsWith(".")) continue;
    const hijo = normalizar(path.join(relativo, entrada.name));
    if (entrada.isDirectory()) {
      if (Object.hasOwn(conDueno, hijo)) continue;
      encontrados.push(...barrer(hijo, raiz, conDueno));
    } else if (esPrueba(entrada.name)) encontrados.push(hijo);
  }
  return encontrados;
}

/** Reparte lo barrido en las cuatro cajas. Pura: no ejecuta nada. */
export function clasificar(ficheros) {
  const reparto = { ejecutar: [], conDueno: [], noSuite: [], sinConfig: [] };
  for (const f of ficheros) {
    if (Object.hasOwn(YA_EN_NPM_TEST, f)) reparto.conDueno.push(f);
    else if (Object.hasOwn(NO_ES_SUITE, f)) reparto.noSuite.push(f);
    else if (Object.hasOwn(SIN_CONFIG_LOCAL, f)) reparto.sinConfig.push(f);
    else reparto.ejecutar.push(f);
  }
  return reparto;
}

function buscarPython() {
  for (const bin of [process.env.PYTHON, "python3", "python"].filter(Boolean)) {
    const r = spawnSync(bin, ["--version"], { stdio: "ignore" });
    if (!r.error && r.status === 0) return bin;
  }
  return null;
}

/** La superficie en copia a la que pertenece un fichero, si alguna. */
function copiaDe(relativo) {
  return Object.keys(EN_COPIA).find((s) => relativo === s || relativo.startsWith(`${s}/`)) || null;
}

function main() {
  const ficheros = barrer("state").sort();
  const reparto = clasificar(ficheros);
  let fallidos = 0;

  const nodes = reparto.ejecutar.filter((f) => !f.endsWith(".py"));
  if (nodes.length) {
    process.stdout.write(`\n=== state/ — pruebas de Node (${nodes.length} fichero(s)) ===\n`);
    const r = spawnSync("node", ["--test", ...nodes], { cwd: RAIZ, stdio: "inherit" });
    if (r.status !== 0) fallidos += 1;
  }

  const pythons = reparto.ejecutar.filter((f) => f.endsWith(".py"));
  if (pythons.length) {
    const bin = buscarPython();
    if (!bin) {
      process.stdout.write("\nAUSENTE  ningun interprete de Python responde\n");
      process.stdout.write("         remedio: instala Python o apunta PYTHON al binario, p. ej. PYTHON=py npm run test:estado\n");
    } else {
      process.stdout.write(`\n=== state/ — pruebas de Python (${pythons.length} fichero(s), ${bin}) ===\n`);
      for (const f of pythons) {
        const superficie = copiaDe(f);
        // Una copia NUEVA por fichero, no una por superficie. Compartirla hace
        // la tanda dependiente del orden: `test_closure_core_ola2_1.py` crea
        // `closure/` en la raiz donde corre, y `test_projection_manifest.py`
        // comprueba justo que ninguna raiz de datos soberanos este presente.
        // Alfabeticamente closure va antes, asi que en una copia compartida la
        // primera rompe a la segunda. Observado el 2026-10-16.
        let base = RAIZ;
        let fichero = path.join(RAIZ, f);
        const entorno = { ...process.env };
        if (superficie) {
          base = mkdtempSync(path.join(os.tmpdir(), "estado-"));
          cpSync(path.join(RAIZ, superficie), base, { recursive: true });
          fichero = path.join(base, path.relative(superficie, f));
          entorno.PYTHONPATH = path.join(base, "server");
        }
        const r = spawnSync(bin, ["-X", "utf8", fichero], { cwd: base, stdio: "inherit", env: entorno });
        process.stdout.write(`${r.status === 0 ? "OK      " : "FALLA   "} ${f}${superficie ? " (en copia limpia)" : ""}\n`);
        if (r.status !== 0) fallidos += 1;
        if (superficie) rmSync(base, { recursive: true, force: true });
      }
    }
  }

  process.stdout.write("\n--- superficies de state/ ---\n");
  process.stdout.write(`ficheros barridos: ${ficheros.length}\n`);
  for (const [superficie, duenno] of Object.entries(CON_DUENO)) {
    process.stdout.write(`CON DUENO ${superficie}: la corre ${duenno}\n`);
  }
  for (const f of reparto.conDueno) process.stdout.write(`YA CORRE  ${f}: ${YA_EN_NPM_TEST[f]}\n`);
  for (const f of reparto.noSuite) process.stdout.write(`NO SUITE  ${f}: ${NO_ES_SUITE[f]}\n`);
  for (const f of reparto.sinConfig) {
    // Declarada, no omitida: lo que falta se nombra y se dice por que falta.
    process.stdout.write(`SIN CONFIG ${f}\n`);
    process.stdout.write(`          necesita ${SIN_CONFIG_LOCAL[f]}, excluido de la proyeccion a proposito\n`);
  }

  if (fallidos) {
    process.stdout.write(`\n${fallidos} tanda(s) con fallos.\n`);
    return 1;
  }
  process.stdout.write("todas las superficies de state/ tienen dueno, y lo que corre pasa\n");
  return 0;
}

const invocadoDirecto =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invocadoDirecto) process.exit(main());
