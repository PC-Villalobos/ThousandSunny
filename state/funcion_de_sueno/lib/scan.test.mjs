// Pruebas del modulo de escaneo read-only (Ola M0). Ejecutar con:
//   node --test state/funcion_de_sueno/lib/
//
// El foco es la FRONTERA DE ACCESO: probar que stat_only nunca abre el fichero,
// que hash_authorized/content_readable si lo hashean, y que la politica estricta
// mantiene los protegidos cerrados. Estas pruebas negativas son las que fuerzan
// que el arreglo sea real (reordenar el read bajo autorizacion) y no cosmetico.

import { test, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  ACCESS,
  scanOne,
  scanFiles,
  sleepLegacyClassify,
  readContentIfAllowed,
  hasProtectedMarker
} from "./scan.mjs";

const CONFIG = {
  includeExtensions: [".md", ".txt"],
  maxFileBytes: 1000,
  skipDirs: [".git", "node_modules"],
  protectedPathMarkers: ["HOLD_CLINICO", "00_BOVEDA_NEXUS"]
};

function makeCorpus() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "melampo-scan-"));
  fs.writeFileSync(path.join(root, "normal.md"), "# normal\ncontenido");
  fs.mkdirSync(path.join(root, "HOLD_CLINICO"));
  fs.writeFileSync(path.join(root, "HOLD_CLINICO", "secret.md"), "sensible");
  fs.writeFileSync(path.join(root, "big.md"), "x".repeat(2000)); // > maxFileBytes
  return root;
}

afterEach(() => mock.restoreAll());

test("sleepLegacyClassify: protegido y grande -> hash_authorized; normal -> content_readable", () => {
  assert.equal(sleepLegacyClassify({ protected: true, tooLarge: false }), ACCESS.HASH_AUTHORIZED);
  assert.equal(sleepLegacyClassify({ protected: false, tooLarge: true }), ACCESS.HASH_AUTHORIZED);
  assert.equal(sleepLegacyClassify({ protected: false, tooLarge: false }), ACCESS.CONTENT_READABLE);
});

test("content_readable: hashea y abre el fichero", () => {
  const root = makeCorpus();
  const spy = mock.method(fs, "readFileSync");
  const rec = scanOne(root, path.join(root, "normal.md"), CONFIG, () => ACCESS.CONTENT_READABLE);
  assert.equal(rec.access, ACCESS.CONTENT_READABLE);
  assert.match(rec.hash, /^[0-9a-f]{64}$/);
  const opened = spy.mock.calls.some((c) => String(c.arguments[0]).endsWith("normal.md"));
  assert.equal(opened, true, "content_readable debe abrir el fichero");
});

test("hash_authorized: hashea (abre) pero es un nivel distinto", () => {
  const root = makeCorpus();
  const rec = scanOne(root, path.join(root, "big.md"), CONFIG, () => ACCESS.HASH_AUTHORIZED);
  assert.equal(rec.access, ACCESS.HASH_AUTHORIZED);
  assert.match(rec.hash, /^[0-9a-f]{64}$/);
});

test("NEGATIVA: stat_only NUNCA abre el fichero y no produce hash", () => {
  const root = makeCorpus();
  const spy = mock.method(fs, "readFileSync");
  const rec = scanOne(root, path.join(root, "normal.md"), CONFIG, () => ACCESS.STAT_ONLY);
  assert.equal(rec.access, ACCESS.STAT_ONLY);
  assert.equal(rec.hash, null, "stat_only no debe calcular hash");
  const opened = spy.mock.calls.some((c) => String(c.arguments[0]).endsWith("normal.md"));
  assert.equal(opened, false, "stat_only NO debe llamar a readFileSync");
});

test("NEGATIVA membrana estricta: politica que manda protegidos a stat_only no abre el protegido", () => {
  const root = makeCorpus();
  const strict = (meta) => (hasProtectedMarker(meta.rel, CONFIG) ? ACCESS.STAT_ONLY : ACCESS.CONTENT_READABLE);
  const spy = mock.method(fs, "readFileSync");
  const records = scanFiles(root, CONFIG, strict);

  const protectedRec = records.find((r) => r.rel.includes("HOLD_CLINICO"));
  assert.ok(protectedRec, "debe encontrar el fichero protegido");
  assert.equal(protectedRec.access, ACCESS.STAT_ONLY);
  assert.equal(protectedRec.hash, null);

  const openedProtected = spy.mock.calls.some((c) => String(c.arguments[0]).includes("HOLD_CLINICO"));
  assert.equal(openedProtected, false, "el protegido no debe abrirse bajo membrana estricta");

  // control positivo: el normal si se leyo
  const openedNormal = spy.mock.calls.some((c) => String(c.arguments[0]).endsWith("normal.md"));
  assert.equal(openedNormal, true);
});

test("readContentIfAllowed: contenido solo para content_readable", () => {
  const root = makeCorpus();
  const readable = scanOne(root, path.join(root, "normal.md"), CONFIG, () => ACCESS.CONTENT_READABLE);
  const gated = scanOne(root, path.join(root, "HOLD_CLINICO", "secret.md"), CONFIG, () => ACCESS.STAT_ONLY);
  assert.match(readContentIfAllowed(root, readable), /contenido/);
  assert.equal(readContentIfAllowed(root, gated), "");
});
