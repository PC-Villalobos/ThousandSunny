// Agregador de las suites de Cubierta.
//
// POR QUE EXISTE
// Hay dos superficies que se llaman Cubierta y viven en ramas distintas:
//
//   state/cubierta_ui/  contrato pedagogico y superficie de referencia,
//                       reconciliada contra sunny-control-bridge (rama agent/*)
//   cubierta/           el barco isometrico: mundo, vigia, pulso real
//
// Las dos reclamaban el script `test:cubierta`. Al fusionar, la definicion de una
// pisaba a la otra y `npm test` seguia en verde con la mitad de las pruebas sin
// ejecutar. Una regresion puede esconderse ahi sin hacer ruido, que es justo lo
// que ninguna de las dos Cubiertas se permite en su propio dominio.
//
// REGLA DE ESTE FICHERO
// La ausencia de una suite es un estado informativo y se declara. Nunca se pasa
// por alto en silencio. Si una superficie no esta en este arbol, se dice cual,
// donde se la esperaba y por que puede faltar; si no esta NINGUNA, es que el
// cableado esta roto y se sale con error.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Ficheros `*.test.mjs` directamente dentro de un directorio. */
function pruebasDe(relativo) {
  const dir = path.join(RAIZ, relativo);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".test.mjs"))
    .map((f) => path.join(relativo, f));
}

/** Un fichero es de pruebas si se llama `*.test.mjs` o `test_*.mjs`. */
function esFicheroDePrueba(relativo) {
  const base = path.basename(relativo);
  return base.endsWith(".test.mjs") || /^test_.*\.mjs$/.test(base);
}

/** Separadores a `/` para poder comparar rutas en Windows y en Linux igual. */
function normalizar(relativo) {
  return relativo.split(path.sep).join("/");
}

/** Ficheros de prueba bajo un directorio, a cualquier profundidad. */
function barrer(relativo) {
  const dir = path.join(RAIZ, relativo);
  if (!existsSync(dir)) return [];
  const encontrados = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === "node_modules" || entrada.name.startsWith(".")) continue;
    const hijo = path.join(relativo, entrada.name);
    if (entrada.isDirectory()) encontrados.push(...barrer(hijo));
    else if (esFicheroDePrueba(hijo)) encontrados.push(normalizar(hijo));
  }
  return encontrados;
}

// Superficies que este agregador reclama. Si aparece un fichero de pruebas aqui
// dentro que ninguna suite ejecuta, es una huerfana y se declara como fallo: una
// prueba que nadie corre no protege nada, y descubrirlo mas tarde cuesta mas.
const RECLAMADAS = ["shared", "cubierta", "state/cubierta_ui", "scripts"];

const SUITES = [
  {
    id: "epistemico",
    titulo: "Nucleo epistemico compartido",
    ancla: "shared/epistemico.test.mjs",
    comando: () => ["node", ["--test", "shared/epistemico.test.mjs"]],
    ausente: "el nucleo compartido vive en claude/convergencia-epistemica",
  },
  {
    id: "cubierta-barco",
    titulo: "Cubierta — mundo, camara sellada y vigia",
    ancla: "cubierta/test/test_cubierta.mjs",
    comando: () => ["node", ["cubierta/test/test_cubierta.mjs"]],
    ausente: "el barco isometrico vive en claude/baseo-workspace-agents-*",
  },
  {
    id: "cubierta-pulso",
    titulo: "Cubierta — pulso real (declarado / observado)",
    ancla: "cubierta/test/test_pulso.mjs",
    comando: () => ["node", ["cubierta/test/test_pulso.mjs"]],
    ausente: "el corte de pulso real vive en claude/baseo-workspace-agents-*",
  },
  {
    id: "cubierta-estado",
    titulo: "Cubierta — estado del barco (afirmado / comprobado)",
    ancla: "cubierta/test/test_estado.mjs",
    comando: () => ["node", ["--test", "cubierta/test/test_estado.mjs"]],
    ausente: "la pantalla de estado entra con la rama del 2026-10-18",
  },
  {
    id: "cubierta-contrato",
    titulo: "Cubierta — contrato OpenAPI contra rutas y respuestas reales",
    ancla: "cubierta/test/test_openapi.mjs",
    comando: () => ["node", ["--test", "cubierta/test/test_openapi.mjs"]],
    ausente: "el contrato OpenAPI entra con la rama del 2026-10-18",
  },
  {
    id: "cubierta-ui",
    titulo: "Cubierta — contrato pedagogico y superficie de referencia",
    ancla: "state/cubierta_ui",
    comando: () => {
      const ficheros = [
        ...pruebasDe("state/cubierta_ui"),
        ...pruebasDe("state/cubierta_ui/baseline/server"),
        ...pruebasDe("state/cubierta_ui/runtime_candidate/server"),
        ...pruebasDe("state/cubierta_ui/preview"),
      ];
      return ficheros.length ? ["node", ["--test", ...ficheros]] : null;
    },
    ausente: "el contrato pedagogico vive en agent/cubierta-not-recorded-preview",
  },
  {
    // Los propios corredores viven aqui. Mientras `scripts/` quedo fuera del
    // perimetro reclamado, un fichero de pruebas suyo no era huerfana para nadie:
    // el agregador decia "4 de 4, sin huerfanas" con 11 pruebas sin ejecutar. El
    // mismo agujero que este guardia existe para cerrar, un nivel mas arriba.
    id: "herramientas",
    titulo: "Herramientas del repo — preservacion y corredores",
    ancla: "scripts",
    comando: () => {
      const ficheros = pruebasDe("scripts");
      return ficheros.length ? ["node", ["--test", ...ficheros]] : null;
    },
    ausente: "no hay pruebas de herramientas en scripts/ en este arbol",
  },
];

let ejecutadas = 0;
let fallidas = 0;
const ausentes = [];
const cubiertos = new Set();

for (const suite of SUITES) {
  const hay = existsSync(path.join(RAIZ, suite.ancla));
  const comando = hay ? suite.comando() : null;
  if (!comando) {
    ausentes.push(suite);
    continue;
  }
  process.stdout.write(`\n=== ${suite.titulo} (${suite.id}) ===\n`);
  const [bin, args] = comando;
  for (const arg of args) if (esFicheroDePrueba(arg)) cubiertos.add(normalizar(arg));
  const r = spawnSync(bin, args, { cwd: RAIZ, stdio: "inherit" });
  ejecutadas += 1;
  if (r.status !== 0) fallidas += 1;
}

process.stdout.write("\n--- agregador de Cubierta ---\n");
process.stdout.write(`suites ejecutadas: ${ejecutadas} de ${SUITES.length}\n`);

for (const suite of ausentes) {
  // Declarada, no omitida. Si esto aparece despues de una fusion, alguien perdio
  // una superficie por el camino.
  process.stdout.write(`AUSENTE  ${suite.id}: no existe ${suite.ancla} en este arbol\n`);
  process.stdout.write(`         ${suite.ausente}\n`);
}

const huerfanas = RECLAMADAS.flatMap((raiz) => barrer(raiz)).filter((f) => !cubiertos.has(f));
for (const f of huerfanas) {
  process.stdout.write(`HUERFANA ${f}: existe y ninguna suite lo ejecuta\n`);
  process.stdout.write("         engancha el fichero a una suite de este agregador\n");
}

if (!ejecutadas) {
  process.stdout.write("\nNinguna suite de Cubierta encontrada: el cableado esta roto.\n");
  process.exit(1);
}
if (fallidas) {
  process.stdout.write(`\n${fallidas} suite(s) con fallos.\n`);
  process.exit(1);
}
if (huerfanas.length) {
  process.stdout.write(`\n${huerfanas.length} fichero(s) de pruebas sin suite.\n`);
  process.exit(1);
}
process.stdout.write("todas las suites presentes pasan, sin huerfanas\n");
