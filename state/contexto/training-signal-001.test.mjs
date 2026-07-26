// Prueba de aceptacion de `context-capsule.v1` draft-r4, con un caso real.
//
// QUE SE ACEPTA
// draft-r4 anadio dos cosas al contrato: el bloque `contract` (identidad verificable
// de la revision exacta) y `training_signals` (senales de episodio con la evaluacion
// separada de la observacion). Hasta aqui existian escritas y sin ejercitar. Un
// contrato que nadie ejecuta es prosa: se cumple mientras nadie lo mira.
//
// EL CASO
// El episodio del 2026-07-26 documentado en `CONTEXT_CAPSULE_v1.md` seccion 3: la
// misma confusion de capas aparecio dos veces, la segunda dentro del commit que
// corregia la primera. Se materializa en `training-signal-001.fixture.json`.
//
// DOS LIMITES QUE LA PRUEBA IMPONE
// 1. No se canonizan causas. Las positivas comprueban que la evaluacion se queda en
//    `inferred` / `proposed` / `causes: unknown`; las negativas comprueban que el
//    contrato RECHAZA promoverla o atribuirle un porque. Sin las negativas la senal
//    seria una acusacion con forma de dato.
// 2. No se modifican los eventos originales. Los commits, el documento y el esquema
//    de r4 se leen; ninguno se toca. La primera prueba fija sus blobs para que una
//    edicion silenciosa rompa la suite.
//
// Lo que esta prueba NO puede comprobar: los identificadores de Bitacora. El Bridge
// de Hipatia solo es alcanzable desde superficie local. Viajan como cita en el
// fixture y la aceptacion no se apoya en ellos.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { validate, UnsupportedKeyword } from "./json-schema-subset.mjs";

const HERE = import.meta.dirname;
const REPO_ROOT = path.resolve(HERE, "..", "..");

const SCHEMA_PATH = "state/contexto/context-capsule.v1.schema.json";
const DOC_PATH = "state/contexto/CONTEXT_CAPSULE_v1.md";
const CITED_ARTIFACT_PATH = "state/funcion_de_sueno/lib/bitacora.mjs";

// Blobs Git de los dos artefactos de r4 tal y como los dejo `66bea1d`. Son pines, no
// canon: si alguien edita el contrato, esta prueba cae antes que nada mas y obliga a
// declarar el cambio en vez de deslizarlo.
const R4_BLOBS = {
  [SCHEMA_PATH]: "6ec02bc042d442cb48a523f6c54d6ef03b9ca8c6",
  [DOC_PATH]: "afdec33519484b13effd7d1c74025cbd593e3b11"
};

// Como se leia el mismo parrafo en cada uno de los tres commits del episodio.
const MARK_FIRST_ERROR = "ya obliga a cada evento a llevar before, change, after, meaning";
const MARK_RELAPSE = "obliga a diez campos, cinco de ellos con enum cerrado";
const MARK_SECOND_CORRECTION = "required_input: siete campos";

const schema = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, SCHEMA_PATH), "utf8"));
const fixture = JSON.parse(fs.readFileSync(path.join(HERE, "training-signal-001.fixture.json"), "utf8"));
const episode = fixture.provenance.episode;

const signal = () => structuredClone(fixture.training_signals[0]);
const signalErrors = (candidate) => validate(schema.$defs.training_signal, candidate, { root: schema });

function git(...args) {
  return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

function gitOrNull(...args) {
  try {
    return git(...args);
  } catch {
    return null;
  }
}

// Normaliza para comparar prosa: el marcador no debe depender de donde parte la linea
// ni del enfasis Markdown.
const flatten = (text) => text.replace(/[*`]/g, "").replace(/\s+/g, " ");

const readAt = (commit, filePath) => gitOrNull("show", `${commit}:${filePath}`);
const hasHistory = () => episode.first_error_commit === gitOrNull("rev-parse", "--verify", `${episode.first_error_commit}^{commit}`);

test("contrato r4: los artefactos originales siguen intactos", () => {
  for (const [filePath, blob] of Object.entries(R4_BLOBS)) {
    assert.equal(
      git("hash-object", filePath),
      blob,
      `${filePath} ya no es el artefacto de draft-r4; esta prueba lee el contrato, no lo reescribe`
    );
  }
});

test("contrato r4: el bloque contract valida y apunta al esquema de este arbol", () => {
  assert.deepEqual(validate(schema.properties.contract, fixture.contract, { root: schema }), []);
  assert.equal(fixture.contract.revision, "draft-r4");
  assert.equal(
    fixture.contract.schema_blob,
    git("hash-object", SCHEMA_PATH),
    "el fixture declara un esquema distinto del que se acaba de validar"
  );
});

test("contrato r4: la etiqueta resuelve a commit y el commit al blob", (t) => {
  const tagged = gitOrNull("rev-parse", "--verify", `${fixture.contract.schema_tag}^{commit}`);
  if (tagged === null) {
    t.skip("etiquetas no disponibles en este clon; ejecutar `git fetch --tags` para comprobar la cadena completa");
    return;
  }
  assert.equal(tagged, fixture.contract.schema_commit);
  assert.equal(git("rev-parse", `${tagged}:${SCHEMA_PATH}`), fixture.contract.schema_blob);
});

test("aceptacion: la senal del episodio valida contra $defs/training_signal", () => {
  assert.deepEqual(signalErrors(signal()), []);
});

test("aceptacion: la evaluacion se queda inferida, propuesta y sin causa", () => {
  const { assessment, observations } = signal();
  assert.equal(observations.epistemic_status, "observed");
  assert.equal(assessment.epistemic_status, "inferred");
  assert.equal(assessment.status, "proposed");
  assert.equal(assessment.causes, "unknown");
  assert.ok(
    assessment.claim.length <= 240 && !/no aprend|no interioriz|ignor[oó]|neglig/i.test(assessment.claim),
    "la afirmacion describe el registro, no el estado interno del actor"
  );
});

test("observaciones: los tres commits del episodio existen y van en orden", (t) => {
  if (!hasHistory()) {
    t.skip("historia no disponible en este clon (clon superficial)");
    return;
  }
  const chain = [episode.first_error_commit, episode.correcting_commit_that_relapsed, episode.second_correction_commit];
  for (const sha of chain) {
    assert.equal(git("cat-file", "-t", sha), "commit", `${sha} no es un commit de este repositorio`);
  }
  for (let i = 0; i < chain.length - 1; i += 1) {
    assert.doesNotThrow(
      () => git("merge-base", "--is-ancestor", chain[i], chain[i + 1]),
      `${chain[i]} no precede a ${chain[i + 1]}`
    );
  }
});

test("observaciones: correccion y recaida son el mismo commit, por eso la ventana es 0 s", (t) => {
  if (!hasHistory()) {
    t.skip("historia no disponible en este clon (clon superficial)");
    return;
  }
  // El commit que corrige el primer error se recomputa: es el primero que toca el
  // documento despues de el, no un dato que el fixture pueda afirmar por su cuenta.
  const [firstCorrection] = git(
    "rev-list", "--reverse", `${episode.first_error_commit}..${episode.second_correction_commit}`, "--", DOC_PATH
  ).split("\n");
  assert.equal(firstCorrection, episode.correcting_commit_that_relapsed);

  const atFirst = flatten(readAt(episode.first_error_commit, DOC_PATH));
  const atRelapse = flatten(readAt(episode.correcting_commit_that_relapsed, DOC_PATH));
  const atSecond = flatten(readAt(episode.second_correction_commit, DOC_PATH));

  assert.ok(atFirst.includes(MARK_FIRST_ERROR), "el primer error no esta donde el fixture lo situa");
  assert.ok(!atRelapse.includes(MARK_FIRST_ERROR), "ese commit no corrigio el primer error");
  assert.ok(atRelapse.includes(MARK_RELAPSE), "la recaida no esta en el commit que corrigio");
  assert.ok(!atSecond.includes(MARK_RELAPSE) && atSecond.includes(MARK_SECOND_CORRECTION));

  assert.equal(
    signal().observations.correction_to_relapse_seconds,
    0,
    "corregir y recaer ocurren en el mismo artefacto: la ventana medible es cero"
  );
  assert.equal(signal().observations.recurrence_after_correction, true);
});

test("observaciones: el dato que desmentia la lectura estaba dentro del artefacto citado", () => {
  const cited = fs.readFileSync(path.join(REPO_ROOT, episode.cited_artifact), "utf8");
  assert.ok(
    cited.includes("Campos obligatorios de POST /api/events, con sus enums permitidos"),
    "la cabecera citada ya no agrupa requisitos y enums bajo un solo epigrafe"
  );
  assert.ok(
    cited.includes(episode.refuting_datum_in_cited_artifact),
    "el dato que desmentia la lectura ya no esta en el artefacto que se estaba citando"
  );
  assert.equal(signal().observations.correction_inside_cited_artifact, true);
});

test("observaciones: el documento nombra un unico modo de fallo para las dos veces", () => {
  const doc = flatten(fs.readFileSync(path.join(REPO_ROOT, DOC_PATH), "utf8"));
  assert.ok(doc.includes(episode.failure_mode_phrase), "el modo de fallo declarado no aparece en el documento");
  assert.ok(doc.includes("El patrón es el mismo las dos veces"));
  assert.equal(signal().observations.same_failure_mode, true);
});

test("negativa: la evaluacion no puede promoverse a observada ni a verificada", () => {
  for (const status of ["observed", "calculated", "evaluated"]) {
    const mutated = signal();
    mutated.assessment.epistemic_status = status;
    assert.notDeepEqual(signalErrors(mutated), [], `el contrato admitio promover la evaluacion a ${status}`);
  }
  for (const status of ["verified", "executed", "observed"]) {
    const mutated = signal();
    mutated.assessment.status = status;
    assert.notDeepEqual(signalErrors(mutated), [], `el contrato admitio elevar el veredicto a ${status}`);
  }
});

test("negativa: no se puede atribuir ninguna causa distinta de unknown", () => {
  const attempts = [
    "el correctivo no fue interiorizado",
    "sesgo de anclaje",
    "unknown_but_probably_attention",
    null,
    { primary: "unknown" }
  ];
  for (const causes of attempts) {
    const mutated = signal();
    mutated.assessment.causes = causes;
    assert.notDeepEqual(signalErrors(mutated), [], `el contrato admitio la causa ${JSON.stringify(causes)}`);
  }
});

test("negativa: la evidencia no puede reducirse a una sola fuente", () => {
  const mutated = signal();
  mutated.observations.evidence = ["git:bcf93360418c79a93d424de83a81909b0adaae28"];
  assert.notDeepEqual(signalErrors(mutated), [], "una sola cita basto para sostener la senal");

  const empty = signal();
  empty.observations.evidence = [];
  assert.notDeepEqual(signalErrors(empty), []);
});

test("negativa: no se puede colar un evento narrativo sustituto", () => {
  const narrated = signal();
  narrated.narrative = "Claude reincidio pese a la correccion";
  assert.notDeepEqual(signalErrors(narrated), [], "el contrato admitio un campo narrativo no declarado");

  const inside = signal();
  inside.assessment.explanation = "porque no leyo la cabecera entera";
  assert.notDeepEqual(signalErrors(inside), [], "el contrato admitio una explicacion dentro de la evaluacion");
});

test("negativa: las observaciones no pueden dejar de ser observadas", () => {
  for (const status of ["inferred", "proposed", "unknown"]) {
    const mutated = signal();
    mutated.observations.epistemic_status = status;
    assert.notDeepEqual(signalErrors(mutated), [], `una observacion ${status} no es recomputable y aun asi paso`);
  }

  const missing = signal();
  delete missing.observations.correction_to_relapse_seconds;
  assert.notDeepEqual(signalErrors(missing), []);
});

test("validador: lanza ante una asercion que no implementa, en vez de aprobarla", () => {
  assert.throws(() => validate({ type: "string", oneOf: [] }, "x"), UnsupportedKeyword);
  assert.deepEqual(validate({ type: "string", description: "anotacion, no asercion" }, "x"), []);
});
