// Contrato pedagogico de la Cubierta, ejercitado.
//
// Cada bloque corresponde a uno de los seis ajustes. Un ajuste que solo este escrito
// en prosa se cumple mientras nadie lo mira; estas pruebas son las que lo sostienen.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  AVISO_HISTORICO,
  AVISO_TURNO,
  SIN_MARCA_TEMPORAL,
  esHistorica,
  formatearMomento,
  posicion,
  renderOrden,
  renderOrdenes,
  traducir
} from "./render.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const FIXTURE = JSON.parse(
  readFileSync(join(AQUI, "fixtures", "ordenes_observadas.json"), "utf8")
);
const ORDENES = FIXTURE.ordenes;
const porId = (id) => ORDENES.find((orden) => orden.orderId === id);

// --------------------------------------------------------------------------
// AJUSTE 1 — la ejecucion pertenece a la orden, no a un trabajador
// --------------------------------------------------------------------------
// En la superficie desplegada la linea "Ejecucion:" se pintaba dentro del bloque del
// ultimo worker. Aparecia bajo `codex` en las cuatro ordenes y nunca bajo `claude`,
// de modo que el lector atribuia a Codex una ejecucion que era de la orden, o de
// nadie. Es la confusion actor/capa con una accion por medio.

test("la ejecucion vive al nivel de la orden", () => {
  const modelo = renderOrden(porId("ORD-TG-567384347"));
  assert.equal(modelo.ejecucion.titulo, "Ejecutada");
});

test("ningun agente carga estado de ejecucion", () => {
  for (const modelo of renderOrdenes(ORDENES)) {
    for (const agente of modelo.agentes) {
      const campos = Object.keys(agente).join(" ").toLowerCase();
      assert.ok(
        !campos.includes("ejecuc") && !campos.includes("execution"),
        `el agente ${agente.actor} de ${modelo.referencia} carga ejecucion`
      );
    }
  }
});

test("una orden que prohibe ejecutar no muestra ejecucion afirmada", () => {
  const modelo = renderOrden(porId("ORD-TG-567384331"));
  assert.equal(modelo.ejecucion.valorCrudo, "not_requested");
  assert.equal(modelo.ejecucion.titulo, "Sin ejecucion solicitada");
});

// --------------------------------------------------------------------------
// AJUSTE 2 — ningun enum en crudo llega al lector
// --------------------------------------------------------------------------

test("los estados de orden salen traducidos, no en crudo", () => {
  assert.equal(renderOrden(porId("ORD-TG-567384347")).estado.titulo, "Deliberada");
  assert.equal(renderOrden(porId("ORD-TG-567384333")).estado.titulo, "Sin autorizacion");
});

test("not_authorized explica que nunca hubo GO, no que los agentes rechazaran", () => {
  const modelo = renderOrden(porId("ORD-TG-567384333"));
  assert.match(modelo.estado.detalle, /nunca se autorizo/);
  assert.match(modelo.estado.detalle, /No es un rechazo de los agentes/);
});

test("ningun titulo visible repite el identificador tecnico del enum", () => {
  const crudos = [
    "deliberated", "not_authorized", "responded", "pending",
    "assessment_provided", "clarification_required", "cannot_assess",
    "observed", "inferred", "proposed", "unknown", "executed", "not_requested"
  ];
  for (const modelo of renderOrdenes(ORDENES)) {
    const visibles = [
      modelo.estado.titulo, modelo.estado.detalle,
      modelo.ejecucion.titulo, modelo.ejecucion.detalle,
      ...modelo.agentes.flatMap((a) => [
        a.entrega.titulo, a.entrega.detalle,
        a.resultado.titulo, a.resultado.detalle,
        a.evidencia.titulo, a.evidencia.detalle
      ])
    ].join(" ").toLowerCase();
    for (const crudo of crudos) {
      assert.ok(!visibles.includes(crudo), `"${crudo}" se filtra al texto visible`);
    }
  }
});

// --------------------------------------------------------------------------
// AJUSTE 3 — el titular es lo que se pidio; el identificador es referencia
// --------------------------------------------------------------------------

test("el titular es el texto de la orden y el id queda como referencia", () => {
  const modelo = renderOrden(porId("ORD-TG-567384347"));
  assert.match(modelo.titular, /^Deliberad si procede/);
  assert.equal(modelo.referencia, "ORD-TG-567384347");
  assert.ok(!modelo.titular.includes("ORD-TG"));
});

// --------------------------------------------------------------------------
// AJUSTE 4 — sin tiempo no hay posicion; su ausencia se declara
// --------------------------------------------------------------------------

test("la falta de marca temporal se dice, no se deja en blanco", () => {
  for (const modelo of renderOrdenes(ORDENES)) {
    assert.equal(modelo.momento.conocido, false);
    assert.equal(modelo.momento.texto, SIN_MARCA_TEMPORAL);
    assert.notEqual(modelo.momento.texto.trim(), "");
  }
});

test("una marca temporal ilegible no se silencia ni se inventa", () => {
  const roto = formatearMomento("no-es-una-fecha");
  assert.equal(roto.conocido, false);
  assert.match(roto.texto, /ilegible/);
});

test("una marca valida se formatea de forma legible", () => {
  const bueno = formatearMomento("2026-07-27T13:03:01Z");
  assert.equal(bueno.conocido, true);
  assert.match(bueno.texto, /2026-07-27 13:03:01 UTC/);
});

// --------------------------------------------------------------------------
// AJUSTE 5 — el "desconocido" historico se explica, o parece averia
// --------------------------------------------------------------------------

test("las ordenes anteriores a v3 se marcan como historicas", () => {
  assert.equal(esHistorica(porId("ORD-TG-567384343")), true);
  assert.equal(esHistorica(porId("ORD-TG-567384331")), true);
  assert.equal(esHistorica(porId("ORD-TG-567384347")), false);
});

test("todo desconocido de una orden historica viaja con su explicacion", () => {
  for (const modelo of renderOrdenes(ORDENES).filter((m) => m.historica)) {
    assert.equal(modelo.avisoHistorico, AVISO_HISTORICO);
    for (const agente of modelo.agentes) {
      if (agente.resultado.valorCrudo === "unknown") {
        assert.equal(agente.avisoHistorico, AVISO_HISTORICO);
      }
    }
  }
});

test("una orden v3 no arrastra la coartada historica", () => {
  const modelo = renderOrden(porId("ORD-TG-567384347"));
  assert.equal(modelo.avisoHistorico, null);
  for (const agente of modelo.agentes) assert.equal(agente.avisoHistorico, null);
});

// --------------------------------------------------------------------------
// AJUSTE 6 — el estatuto nunca sube, y el aviso nunca se acorta
// --------------------------------------------------------------------------

test("toda respuesta lleva el aviso de que responder no es ejecutar", () => {
  let respuestas = 0;
  for (const modelo of renderOrdenes(ORDENES)) {
    for (const agente of modelo.agentes) {
      if (agente.entrega.valorCrudo !== "responded") continue;
      respuestas += 1;
      assert.equal(agente.avisoTurno, AVISO_TURNO);
      assert.equal(agente.entrega.detalle, AVISO_TURNO);
    }
  }
  assert.equal(respuestas, 6);
});

test("un agente pendiente no recibe aviso de turno terminado", () => {
  const modelo = renderOrden(porId("ORD-TG-567384333"));
  for (const agente of modelo.agentes) {
    assert.equal(agente.entrega.titulo, "Pendiente");
    assert.equal(agente.avisoTurno, null);
  }
});

test("inferido no se presenta como observado", () => {
  const modelo = renderOrden(porId("ORD-TG-567384347"));
  for (const agente of modelo.agentes) {
    assert.equal(agente.evidencia.titulo, "Inferido");
    assert.match(agente.evidencia.detalle, /no observo directamente/);
  }
});

// --------------------------------------------------------------------------
// R10 — la guarda no debe empujar a una declaracion falsa
// --------------------------------------------------------------------------
// El vocabulario de hoy no es el de manana. Un valor nuevo tiene que producir una
// senal legible, no un fallo que presione al autor a etiquetarlo con lo que haya.

test("un valor fuera del vocabulario se nombra, no se filtra ni se silencia", () => {
  const nuevo = traducir({ a: { titulo: "A", detalle: "a" } }, "valor_futuro");
  assert.equal(nuevo.reconocido, false);
  assert.equal(nuevo.titulo, "Estado no reconocido");
  assert.match(nuevo.detalle, /valor_futuro/);
  assert.match(nuevo.detalle, /No se interpreta/);
});

test("un campo ausente se distingue de un campo con valor desconocido", () => {
  const ausente = traducir({ unknown: { titulo: "U", detalle: "u" } }, undefined);
  assert.equal(ausente.reconocido, false);
  assert.match(ausente.detalle, /no trae valor/);
});

// --------------------------------------------------------------------------
// Las tres palabras con las que el Capitan mide la superficie
// --------------------------------------------------------------------------

test("respondido, ejecutado y pendiente se responden por separado", () => {
  const p = posicion(renderOrden(porId("ORD-TG-567384347")));
  assert.equal(p.respondido, "2 de 2 agentes terminaron su turno.");
  assert.equal(p.ejecutado, "Ejecutada");
  assert.equal(p.pendiente, "Ningun agente queda sin acusar.");

  const q = posicion(renderOrden(porId("ORD-TG-567384333")));
  assert.equal(q.respondido, "0 de 2 agentes terminaron su turno.");
  assert.equal(q.ejecutado, "Ejecucion propuesta");
  assert.equal(q.pendiente, "2 agentes sin acusar la orden.");
});
