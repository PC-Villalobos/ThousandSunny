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
    id: "cubierta-ui",
    titulo: "Cubierta — contrato pedagogico y superficie de referencia",
    ancla: "state/cubierta_ui",
    comando: () => {
      const ficheros = [
        ...pruebasDe("state/cubierta_ui"),
        ...pruebasDe("state/cubierta_ui/runtime_candidate/server"),
        ...pruebasDe("state/cubierta_ui/preview"),
      ];
      return ficheros.length ? ["node", ["--test", ...ficheros]] : null;
    },
    ausente: "el contrato pedagogico vive en agent/cubierta-not-recorded-preview",
  },
];

let ejecutadas = 0;
let fallidas = 0;
const ausentes = [];

for (const suite of SUITES) {
  const hay = existsSync(path.join(RAIZ, suite.ancla));
  const comando = hay ? suite.comando() : null;
  if (!comando) {
    ausentes.push(suite);
    continue;
  }
  process.stdout.write(`\n=== ${suite.titulo} (${suite.id}) ===\n`);
  const [bin, args] = comando;
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

if (!ejecutadas) {
  process.stdout.write("\nNinguna suite de Cubierta encontrada: el cableado esta roto.\n");
  process.exit(1);
}
if (fallidas) {
  process.stdout.write(`\n${fallidas} suite(s) con fallos.\n`);
  process.exit(1);
}
process.stdout.write("todas las suites presentes pasan\n");
