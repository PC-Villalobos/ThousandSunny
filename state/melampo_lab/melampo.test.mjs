// Pruebas del trabajador Melampo Lab (Ola M0.6). Ejecutar con:
//   node --test state/melampo_lab/melampo.test.mjs
//
// Verdades plantadas en el corpus sintetico:
//   - alpha_v1.md y alpha_dup.md son duplicado exacto (mismo hash).
//   - alpha_v1/alpha_v2/alpha_dup comparten titulo "Proyecto Alpha" (familia version).
//   - alpha_* y gamma co-referencian [[beta]] (relacion candidata).
//   - HOLD_CLINICO/clinico.md es protegido: stat_only, nunca abierto, sin contenido.

import { test, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { digest, propose, run, recover } from "./melampo.mjs";
import { ACCESS } from "../funcion_de_sueno/lib/scan.mjs";

const CORPUS = path.join(path.dirname(new URL(import.meta.url).pathname), "corpus");

function tmp() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "melampo-lab-"));
  return { proposalsPath: path.join(d, "proposals.jsonl"), statePath: path.join(d, "state.json") };
}

afterEach(() => mock.restoreAll());

test("membrana estricta: el protegido queda stat_only, sin hash ni contenido, y no se abre", () => {
  const spy = mock.method(fs, "readFileSync");
  const seeds = digest(CORPUS);
  const gated = seeds.find((s) => s.rel.includes("HOLD_CLINICO"));
  assert.ok(gated, "debe inventariar el fichero protegido");
  assert.equal(gated.access, ACCESS.STAT_ONLY);
  assert.equal(gated.gated, true);
  assert.equal(gated.hash, undefined);
  assert.equal(gated.title, undefined);
  const opened = spy.mock.calls.some((c) => String(c.arguments[0]).includes("HOLD_CLINICO"));
  assert.equal(opened, false, "el protegido NUNCA debe abrirse");
});

test("familia por duplicado exacto: alpha_v1 y alpha_dup", () => {
  const props = propose(digest(CORPUS));
  const dup = props.find((p) => p.type === "family_exact_dup");
  assert.ok(dup, "debe proponer una familia de duplicado exacto");
  assert.equal(dup.confidence, 1.0);
  assert.ok(dup.members.includes("alpha_v1.md") && dup.members.includes("alpha_dup.md"));
  assert.ok(dup.evidence.sharedHash, "la propuesta debe llevar evidencia");
});

test("familia por version: los tres alpha comparten stem de titulo", () => {
  const props = propose(digest(CORPUS));
  const ver = props.find((p) => p.type === "family_version");
  assert.ok(ver, "debe proponer una familia de version");
  assert.ok(["alpha_v1.md", "alpha_v2.md", "alpha_dup.md"].every((m) => ver.members.includes(m)));
});

test("relacion candidata por co-referencia a [[beta]] incluye alpha_v2 y gamma", () => {
  const props = propose(digest(CORPUS));
  const beta = props.filter((p) => p.type === "relation_coref" && p.evidence.sharedLink === "beta");
  assert.ok(beta.length > 0, "debe haber relaciones por co-referencia a beta");
  const pairs = beta.map((p) => p.members.join("+"));
  assert.ok(pairs.some((x) => x.includes("alpha_v2.md") && x.includes("gamma.md")));
});

test("ninguna propuesta promueve a canon: todas quedan en estado 'propuesta'", () => {
  const props = propose(digest(CORPUS));
  assert.ok(props.length > 0);
  assert.ok(props.every((p) => p.status === "propuesta"));
});

test("idempotencia: correr dos veces no duplica propuestas", () => {
  const { proposalsPath, statePath } = tmp();
  const first = run({ root: CORPUS, proposalsPath, statePath });
  const second = run({ root: CORPUS, proposalsPath, statePath });

  assert.ok(first.appended > 0, "la primera corrida escribe propuestas");
  assert.equal(second.appended, 0, "la segunda corrida no anade nada");
  assert.equal(first.total, second.total, "el conjunto total es estable");

  const lines = fs.readFileSync(proposalsPath, "utf8").trim().split("\n");
  assert.equal(lines.length, first.total, "el fichero no crece en la segunda corrida");
  const ids = lines.map((l) => JSON.parse(l).id);
  assert.equal(new Set(ids).size, ids.length, "no hay ids duplicados");
});

test("recuperacion: 'alpha' devuelve los documentos alpha con evidencia", () => {
  const hits = recover("alpha", CORPUS);
  const rels = hits.map((h) => h.rel);
  assert.ok(rels.includes("alpha_v1.md") && rels.includes("alpha_v2.md"));
  assert.ok(hits.every((h) => h.why.length > 0), "cada acierto explica su porque");
});
