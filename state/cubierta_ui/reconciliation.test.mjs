import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { translateOrder } from "./baseline/server/control-plane-snapshot.mjs";
import { adaptarOrdenViva, esHistorica, renderOrdenViva } from "./render.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const MANIFEST = JSON.parse(readFileSync(join(AQUI, "reconciliation-manifest.json"), "utf8"));

test("el baseline conserva exactamente los cuatro artefactos observados", () => {
  assert.equal(MANIFEST.baseline.length, 4);
  for (const artifact of MANIFEST.baseline) {
    const bytes = readFileSync(join(AQUI, "baseline", ...artifact.path.split("/")));
    const actual = createHash("sha256").update(bytes).digest("hex");
    assert.equal(actual, artifact.sha256, artifact.path);
  }
});

const ORDEN_VIVA = {
  order_id: "ORD-TG-PRUEBA",
  instruction: "Comprobar compatibilidad sin ejecutar.",
  proposed_at: "2026-07-27T11:51:10.641Z",
  deliberation_status: "authorized",
  targets: ["claude", "codex"],
  deliveries: {
    claude: {
      delivery_status: "responded",
      deliberation_outcome: "assessment_provided",
      epistemic_status: "calculated"
    },
    codex: {
      delivery_status: "blocked",
      deliberation_outcome: "cannot_assess",
      epistemic_status: "evaluated"
    }
  },
  execution: {
    action_type: "bridge_health_read",
    shell: false,
    execution_status: "authorized"
  }
};

test("el adaptador consume la salida real de translateOrder sin inventar campos", () => {
  const traducida = translateOrder(ORDEN_VIVA);
  const adaptada = adaptarOrdenViva(traducida);
  assert.equal(adaptada.orderId, ORDEN_VIVA.order_id);
  assert.equal(adaptada.createdAt, ORDEN_VIVA.proposed_at);
  assert.equal(adaptada.execution.status, "authorized");
  assert.equal(adaptada.execution.actor, null);
  assert.equal(adaptada.contractVersion, null);
  assert.deepEqual(adaptada.workers.map((w) => w.epistemicStatus), ["calculated", "evaluated"]);
});

test("todos los valores vivos de este caso quedan reconocidos", () => {
  const modelo = renderOrdenViva(translateOrder(ORDEN_VIVA));
  assert.equal(modelo.estado.reconocido, true);
  assert.equal(modelo.ejecucion.reconocido, true);
  assert.equal(modelo.ejecucion.valorCrudo, "authorized");
  assert.ok(modelo.agentes.every((a) =>
    a.entrega.reconocido && a.resultado.reconocido && a.evidencia.reconocido
  ));
});

test("el modelo vivo no afirma historia cuando no recibe version de contrato", () => {
  const traducida = translateOrder(ORDEN_VIVA);
  assert.equal(esHistorica(adaptarOrdenViva(traducida)), false);
  assert.equal(renderOrdenViva(traducida).avisoHistorico, null);
});

test("la ejecucion adaptada sigue fuera de los agentes", () => {
  const modelo = renderOrdenViva(translateOrder(ORDEN_VIVA));
  for (const agente of modelo.agentes) {
    const campos = Object.keys(agente).join(" ").toLowerCase();
    assert.ok(!campos.includes("ejecuc") && !campos.includes("execution"));
  }
});

test("authorized y blocked son ejecuciones reconocidas; decided no se canoniza", () => {
  const base = translateOrder(ORDEN_VIVA);
  assert.equal(renderOrdenViva(base).ejecucion.reconocido, true);
  assert.equal(renderOrdenViva({ ...base, execution: { value: "blocked" } }).ejecucion.reconocido, true);
  assert.equal(renderOrdenViva({ ...base, execution: { value: "decided" } }).ejecucion.reconocido, false);
});
