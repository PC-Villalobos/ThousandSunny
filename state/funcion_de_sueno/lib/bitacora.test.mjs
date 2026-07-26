// Pruebas de la costura con el Hipatia Bridge Runtime.
//
// Se prueba sin bitacora viva, a proposito: el caso que mas importa es la
// degradacion. Un ciclo de sueno en CI nunca alcanza el localhost del Capitan y no
// debe romperse por ello. Para el camino feliz se levanta un servidor local que
// imita el contrato leido de `bitacora_server.py`.

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import {
  DEFAULT_BITACORA_URL,
  ALLOWED_EVENT_KIND,
  ALLOWED_EPISTEMIC_STATUS,
  ALLOWED_SOURCE,
  ALLOWED_SENSITIVITY,
  ALLOWED_STATUS,
  bitacoraUrl,
  buildSleepEvent,
  health,
  appendEvent,
  reportSleepCycle
} from "./bitacora.mjs";

const CONTEXT = {
  executor: "cowork-sandbox",
  actor: "claude-opus-5-nami",
  role: "Nami",
  streak: 1,
  nextRole: "Robin",
  summary: { files: 130, deltas: 8, issues: 25, coherenceScore: 0.8076923076923077 },
  reportPath: "state/funcion_de_sueno/reports/sleep_report_x.md"
};

test("bitacoraUrl: localhost canonico por defecto, entorno tiene prioridad", () => {
  assert.equal(bitacoraUrl({}), DEFAULT_BITACORA_URL);
  assert.equal(bitacoraUrl({ HIPATIA_BITACORA_URL: "http://odysseus.local:9000/" }), "http://odysseus.local:9000");
});

test("buildSleepEvent: cumple los campos obligatorios del servidor", () => {
  const event = buildSleepEvent(CONTEXT);
  for (const field of ["actor", "role", "topic", "title", "message", "event_kind", "epistemic_status"]) {
    assert.ok(event[field], `falta el campo obligatorio ${field}`);
  }
  assert.ok(ALLOWED_EVENT_KIND.includes(event.event_kind));
  assert.ok(ALLOWED_EPISTEMIC_STATUS.includes(event.epistemic_status));
  assert.ok(ALLOWED_SOURCE.includes(event.source));
  assert.ok(ALLOWED_SENSITIVITY.includes(event.sensitivity));
  assert.ok(ALLOWED_STATUS.includes(event.status));
});

test("buildSleepEvent: respeta los limites de longitud del servidor", () => {
  const event = buildSleepEvent(CONTEXT);
  assert.ok(event.title.length <= 160, "title excede 160");
  assert.ok(event.message.length <= 20000);
  assert.ok(event.scope.length <= 500);
});

test("buildSleepEvent: racha alta pide rotar de actor, no de nombre de rol", () => {
  const alerted = buildSleepEvent({ ...CONTEXT, streak: 3 });
  assert.match(alerted.next_safe_action, /rotar de actor/i);
  assert.doesNotMatch(buildSleepEvent(CONTEXT).next_safe_action, /rotar de actor/i);
});

test("buildSleepEvent: no filtra contenido de ficheros ni marca material protegido", () => {
  const event = buildSleepEvent(CONTEXT);
  assert.equal(event.sensitivity, "internal");
  assert.doesNotMatch(JSON.stringify(event), /_protegido|HOLD_CLINICO|00_BOVEDA_NEXUS/);
});

test("degradacion: bitacora apagada no lanza y el ciclo puede seguir", async () => {
  // Puerto cerrado a proposito.
  const url = "http://127.0.0.1:9";
  const h = await health({ url, timeoutMs: 250 });
  assert.equal(h.ok, false);
  assert.equal(h.reachable, false);

  const appended = await appendEvent(buildSleepEvent(CONTEXT), { url, timeoutMs: 250 });
  assert.equal(appended.reachable, false);

  const reported = await reportSleepCycle(CONTEXT, { url, timeoutMs: 250 });
  assert.equal(reported.ok, false);
  assert.equal(reported.reachable, false);
  assert.match(reported.note, /no alcanzable/);
});

test("camino feliz: contrato de /api/events segun bitacora_server.py", async () => {
  let received = null;
  const server = http.createServer((req, res) => {
    if (req.url === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, version: "v1.1", events: 22, schemas: ["hipatia-bitacora-v1.1"], bind: "127.0.0.1:8765" }));
      return;
    }
    if (req.url === "/api/events" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        received = JSON.parse(body);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          ok: true,
          kind: "ai_event",
          write_verified: true,
          event: { event_id: "BIT-20260726T103527Z-abc123def456", event_hash: "f".repeat(64) }
        }));
      });
      return;
    }
    res.writeHead(404); res.end("{}");
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const h = await health({ url });
    assert.equal(h.ok, true);
    assert.equal(h.payload.version, "v1.1");

    const reported = await reportSleepCycle(CONTEXT, { url });
    assert.equal(reported.ok, true);
    assert.equal(reported.writeVerified, true);
    assert.equal(reported.eventId, "BIT-20260726T103527Z-abc123def456");
    assert.equal(received.topic, "funcion_de_sueno");
    assert.equal(received.actor, "claude-opus-5-nami");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("rechazo del servidor: no lanza, informa el HTTP", async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, write_verified: false, error: "event_kind no permitido" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const reported = await reportSleepCycle(CONTEXT, { url });
    assert.equal(reported.ok, false);
    assert.equal(reported.reachable, true);
    assert.match(reported.note, /rechazo el evento \(HTTP 400\)/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
