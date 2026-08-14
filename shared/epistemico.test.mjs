// Pruebas del nucleo epistemico compartido.
//   node --test shared/epistemico.test.mjs
//
// Lo que se prueba aqui es que el vocabulario canonico no se pueda diluir: que
// `observed` no se afirme sin sus dos referencias de evidencia, que la ausencia
// no ocupe el termino reservado `unknown`, y que ningun valor fuera del mapa se
// deje pasar en crudo ni se traduzca al vecino semantico.

import test from "node:test";
import assert from "node:assert/strict";

import {
  EPISTEMICO, traducir, estatuto, presentarEstatuto, sello, versionDeContrato,
  AVISO_AUSENCIA_ESTRUCTURAL, SIN_MARCA_TEMPORAL, REFERENCIAS_MINIMAS_OBSERVED,
  CONTRATO_VERSION,
} from "./epistemico.mjs";

const dosRefs = [{ tipo: "a" }, { tipo: "b" }];

test("el vocabulario tiene los siete valores del canon, ni uno mas", () => {
  assert.deepEqual(
    Object.keys(EPISTEMICO),
    ["observed", "calculated", "inferred", "evaluated", "proposed", "unknown", "not_recorded"],
  );
});

test("los titulos y detalles son los del contrato, literales", () => {
  assert.equal(EPISTEMICO.observed.titulo, "Observado");
  assert.equal(
    EPISTEMICO.observed.detalle,
    "El agente miro el sistema directamente y hay al menos dos referencias de evidencia.",
  );
  assert.equal(EPISTEMICO.not_recorded.detalle, AVISO_AUSENCIA_ESTRUCTURAL);
});

test("una sola referencia NO alcanza `observed` y no se degrada al vecino", () => {
  const e = estatuto({ naturaleza: "directa", referencias: [{ tipo: "sonda" }] });
  assert.equal(e.clave, null, "no se afirma ningun estatuto");
  assert.equal(e.reconocido, false);
  assert.match(e.motivo, /una sola referencia/i);
  // Lo importante: NO se ha convertido en inferred ni en calculated.
  assert.notEqual(e.clave, "inferred");
  assert.notEqual(e.clave, "calculated");
});

test("dos referencias si alcanzan `observed`", () => {
  const e = estatuto({ naturaleza: "directa", referencias: dosRefs });
  assert.equal(e.clave, "observed");
  assert.equal(e.reconocido, true);
  assert.equal(REFERENCIAS_MINIMAS_OBSERVED, 2);
});

test("la ausencia es `not_recorded`, nunca `unknown`", () => {
  const e = estatuto({ ausente: true });
  assert.equal(e.clave, "not_recorded");
  assert.notEqual(e.clave, "unknown", "`unknown` esta reservado al desconocimiento declarado");
  assert.equal(e.motivo, AVISO_AUSENCIA_ESTRUCTURAL);
});

test("`unknown` solo aparece cuando se declara explicitamente", () => {
  assert.equal(estatuto({ desconocidoDeclarado: true }).clave, "unknown");
});

test("una operacion reproducible es `calculated`", () => {
  assert.equal(estatuto({ naturaleza: "derivada", referencias: [] }).clave, "calculated");
});

test("un valor fuera del mapa no se deja pasar en crudo ni se reinterpreta", () => {
  const t = traducir("decided", EPISTEMICO, { nombreMapa: "vocabulario epistemico" });
  assert.equal(t.reconocido, false);
  assert.equal(t.titulo, "No interpretable");
  assert.match(t.detalle, /No se traduce al mas parecido/);
});

test("traducir null declara la ausencia en vez de romperse", () => {
  const t = traducir(null, EPISTEMICO);
  assert.equal(t.ausente, true);
  assert.equal(t.detalle, AVISO_AUSENCIA_ESTRUCTURAL);
});

test("presentar nunca devuelve la clave cruda como texto visible", () => {
  const p = presentarEstatuto(estatuto({ naturaleza: "directa", referencias: dosRefs }));
  assert.equal(p.titulo, "Observado");
  assert.notEqual(p.titulo, "observed");
  const sinAfirmar = presentarEstatuto(estatuto({ naturaleza: "directa", referencias: [{ tipo: "x" }] }));
  assert.equal(sinAfirmar.titulo, "Sin estatuto afirmado");
});

test("la marca temporal se muestra o su ausencia se declara", () => {
  const ahora = Date.now();
  assert.match(sello(new Date(ahora - 5000).toISOString(), ahora).texto, /medido hace 5s/);
  assert.equal(sello(null, ahora).texto, SIN_MARCA_TEMPORAL);
  assert.equal(sello("no es una fecha", ahora).edad_ms, null);
});

test("la ausencia de version de contrato no autoriza a inferir historico", () => {
  const v = versionDeContrato({});
  assert.equal(v.valor, null);
  assert.equal(v.permite_inferir_historico, false);
  assert.equal(versionDeContrato({ schema: "v2" }).valor, "v2");
});

test("esta superficie declara su version de contrato", () => {
  assert.equal(typeof CONTRATO_VERSION, "string");
  assert.ok(CONTRATO_VERSION.length > 0);
});
