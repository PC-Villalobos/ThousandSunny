// Pruebas del corredor de `state/`.
//
// La que importa es la ultima: que ejecutar las pruebas de Hipatia NO escriba
// dentro de `state/`. Ese fallo se cometio de verdad el 2026-10-16 —correr
// `test_closure_core_ola2_1.py` en su sitio creo `closure/` y una vista de
// Obsidian en la raiz de la proyeccion—, asi que aqui queda un guardia que lo
// vigila en vez de la buena intencion de no repetirlo.

import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  barrer, clasificar, esPrueba, CON_DUENO, NO_ES_SUITE, RAIZ,
  SIN_CONFIG_LOCAL, YA_EN_NPM_TEST,
} from "./test-estado.mjs";

test("reconoce las cuatro formas de nombrar una prueba en este repo", () => {
  assert.ok(esPrueba("melampo.test.mjs"));
  assert.ok(esPrueba("test_sleep_journal.py"));
  assert.ok(esPrueba("test_algo.mjs"));
  assert.ok(esPrueba("test_hub_utils.js"), "las de usopp son .js y tambien cuentan");
  assert.ok(!esPrueba("melampo.mjs"));
  assert.ok(!esPrueba("README.md"));
});

test("el barrido entra a cualquier profundidad y salta lo que ya tiene dueno", () => {
  const raiz = mkdtempSync(path.join(os.tmpdir(), "barrido-"));
  mkdirSync(path.join(raiz, "state", "hondo", "mas_hondo"), { recursive: true });
  mkdirSync(path.join(raiz, "state", "ajena"), { recursive: true });
  writeFileSync(path.join(raiz, "state", "hondo", "mas_hondo", "x.test.mjs"), "");
  writeFileSync(path.join(raiz, "state", "ajena", "y.test.mjs"), "");
  writeFileSync(path.join(raiz, "state", "hondo", "no_es.md"), "");

  const todo = barrer("state", raiz, {});
  assert.deepEqual(todo.sort(), ["state/ajena/y.test.mjs", "state/hondo/mas_hondo/x.test.mjs"]);

  const sinAjena = barrer("state", raiz, { "state/ajena": "otro corredor" });
  assert.deepEqual(sinAjena, ["state/hondo/mas_hondo/x.test.mjs"], "la superficie con dueno no se pisa");
});

test("sobre el arbol real, ningun fichero se queda sin caja", () => {
  const ficheros = barrer("state");
  const r = clasificar(ficheros);
  const repartidos = [...r.ejecutar, ...r.conDueno, ...r.noSuite, ...r.sinConfig];
  assert.equal(repartidos.length, ficheros.length, "cada fichero cae en una caja y solo una");
  assert.deepEqual([...new Set(repartidos)].sort(), [...ficheros].sort());
  // Si manana aparece una prueba nueva en state/, entra sola en `ejecutar`: no
  // hay lista a mano que se pueda olvidar de actualizar.
  assert.ok(r.ejecutar.includes("state/melampo_lab/melampo.test.mjs"), "melampo se ejecuta");
  assert.ok(r.ejecutar.some((f) => f.endsWith("test_projection_manifest.py")), "el manifiesto se ejecuta");
});

test("lo que no se ejecuta esta nombrado con su razon, nunca omitido", () => {
  for (const [f, razon] of Object.entries({ ...YA_EN_NPM_TEST, ...NO_ES_SUITE, ...SIN_CONFIG_LOCAL })) {
    assert.ok(razon && razon.length > 3, `${f} sin razon declarada`);
    assert.ok(existsSync(path.join(RAIZ, f)), `${f} ya no existe: la lista miente`);
  }
  for (const superficie of Object.keys(CON_DUENO)) {
    assert.ok(existsSync(path.join(RAIZ, superficie)), `${superficie} ya no existe`);
  }
});

test("correr las pruebas de state/ no escribe dentro de state/", () => {
  const sucio = () =>
    spawnSync("git", ["status", "--porcelain", "state"], { cwd: RAIZ, encoding: "utf8" }).stdout.trim();
  assert.equal(sucio(), "", "el arbol ya venia sucio: esta prueba no puede decidir nada");

  const r = spawnSync("node", ["scripts/test-estado.mjs"], { cwd: RAIZ, encoding: "utf8" });
  assert.equal(r.status, 0, `el corredor fallo:\n${r.stdout}\n${r.stderr}`);

  // El fallo exacto del 2026-10-16: una raiz de datos soberanos creada dentro
  // de la proyeccion por su propia prueba.
  assert.ok(!existsSync(path.join(RAIZ, "state", "hipatia_bridge_runtime", "closure")), "aparecio closure/");
  assert.equal(sucio(), "", "el corredor dejo ficheros dentro de state/");
});
