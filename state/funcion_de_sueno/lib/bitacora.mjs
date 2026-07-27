// Costura con el Hipatia Bridge Runtime — la autoridad operativa de la bitacora.
//
// POR QUE EXISTE
// El 2026-07-24 el Capitan declaro que la Bitacora de Hipatia en 127.0.0.1:8765 es la
// autoridad operativa y GAS queda como antecedente historico. Hasta hoy el repo
// canonico no contenia NINGUNA referencia ejecutable a ese servicio: solo prosa. Eran
// dos sistemas que no se conocian. Este modulo es la costura, y es deliberadamente
// pequena: un cliente que sabe hablar con la bitacora y sabe callarse cuando no esta.
//
// CONTRATO — leido del codigo fuente del servidor, no supuesto
// Fuente: `_bitacora/scripts/bitacora_server.py` de la Biblioteca de Hipatia.
//   GET  /api/health  -> { ok, version, events, schemas, bind }
//   POST /api/events  -> { ok, kind:"ai_event", write_verified, event:{ event_id, event_hash, ... } }
//   Con idempotency_key estable:
//     - primer POST: write_performed=true, idempotent_replay=false;
//     - mismo payload: mismo event_id, write_performed=false, idempotent_replay=true;
//     - payload distinto: HTTP 409 idempotency_key_conflict.
//   Un recibo perdido se recupera con GET /api/events?idempotency_key=... antes de
//   decidir cualquier reintento. Nunca se reenvia un POST ambiguo desde este cliente.
//   Ese GET verifica existencia, pero no distingue si el POST perdido escribio o
//   reprodujo: writePerformed e idempotentReplay quedan en null.
// El log es una cadena de hashes encadenada: el servidor reverifica la cadena y
// relee tras escribir antes de responder `write_verified`. No se escribe el fichero
// de eventos a mano desde aqui: se habla con el servicio o no se escribe nada.
//
// Campos obligatorios de POST /api/events, con sus enums permitidos:
//   actor, role, topic, title, message  (texto)
//   event_kind        ∈ observation|decision|action|result|learning|transition|projection
//   epistemic_status  ∈ observed|calculated|inferred|evaluated|proposed|unknown
//   sensitivity       ∈ public_safe|internal            (por defecto internal)
//   status            ∈ observed|decided|executed|verified|blocked|superseded
//   source            ∈ captain|codex|claude|github|obsidian|local_runtime|other
//
// REGLA DE DEGRADACION
// El workflow nocturno corre en GitHub Actions, que NO alcanza el localhost del
// Capitan. Por diseno, este modulo NUNCA lanza por fallo de red y NUNCA rompe el
// ciclo de sueno: devuelve `{ ok:false, reachable:false }` y el ciclo sigue. La
// bitacora es la autoridad cuando esta presente; su ausencia no es un error del sueno.
//
// MEMBRANA
// Aqui solo viaja metadata del parte: contador de ficheros, deltas, incidencias,
// score y rotacion de rol. Nunca contenido de ficheros, nunca material clinico,
// nunca rutas resolubles a `_protegido`. `sensitivity` va fijada a "internal".

export const DEFAULT_BITACORA_URL = "http://127.0.0.1:8765";
export const DEFAULT_TIMEOUT_MS = 2000;

export const ALLOWED_EVENT_KIND = Object.freeze([
  "observation", "decision", "action", "result", "learning", "transition", "projection"
]);
export const ALLOWED_EPISTEMIC_STATUS = Object.freeze([
  "observed", "calculated", "inferred", "evaluated", "proposed", "unknown"
]);
export const ALLOWED_SOURCE = Object.freeze([
  "captain", "codex", "claude", "github", "obsidian", "local_runtime", "other"
]);
export const ALLOWED_SENSITIVITY = Object.freeze(["public_safe", "internal"]);
export const ALLOWED_STATUS = Object.freeze([
  "observed", "decided", "executed", "verified", "blocked", "superseded"
]);

// La URL se resuelve del entorno para que un despliegue distinto (Odysseus, VPS) no
// exija tocar codigo. Si no hay variable, el localhost canonico.
export function bitacoraUrl(env = process.env) {
  const raw = (env && env.HIPATIA_BITACORA_URL) || DEFAULT_BITACORA_URL;
  return String(raw).replace(/\/+$/, "");
}

// Construye el payload del parte de sueno. Puro: no toca red, es testeable solo.
export function buildSleepEvent({ executor, actor, role, streak, nextRole, summary, reportPath }) {
  const deltas = summary?.deltas ?? 0;
  const files = summary?.files ?? 0;
  const issues = summary?.issues ?? 0;
  const score = summary?.coherenceScore;
  const scoreText = typeof score === "number" ? score.toFixed(3) : "n/d";

  return {
    actor: actor || "unknown-actor",
    role: role || "unknown-role",
    topic: "funcion_de_sueno",
    title: `Ciclo de sueno ${role || "?"} — ${deltas} deltas, ${issues} incidencias`,
    message: [
      `Ciclo de la Funcion de Sueno completado.`,
      `Executor: ${executor || actor}. Actor: ${actor}. Rol: ${role}.`,
      `Ficheros inventariados: ${files}. Deltas episodicos: ${deltas}.`,
      `Incidencias de coherencia: ${issues}. Score: ${scoreText}.`,
      `Racha del par (actor, rol): ${streak ?? "n/d"}. Siguiente rol sugerido: ${nextRole || "n/d"}.`
    ].join(" "),
    scope: "metadata del parte de sueno; sin contenido de ficheros",
    sensitivity: "internal",
    status: "executed",
    source: "local_runtime",
    event_kind: "result",
    epistemic_status: "calculated",
    project: "ThousandSunny",
    phase: "funcion_de_sueno",
    change: `Parte de sueno generado en ${reportPath || "reports/"}.`,
    after: `Rotacion registrada en roleLedger; siguiente rol sugerido ${nextRole || "n/d"}.`,
    next_safe_action: streak >= 3
      ? "Rotar de actor, no solo de nombre de rol: la racha alta indica fusion real."
      : "Ninguna; el ciclo cerro limpio.",
    relations: [`executor:${executor || actor}`, `role:${role}`],
    evidence: reportPath ? [String(reportPath)] : []
  };
}

async function request(url, { method = "GET", body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    let parsed = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = { raw: text }; }
    return { ok: response.ok, reachable: true, httpStatus: response.status, payload: parsed };
  } catch (error) {
    // Red caida, servicio apagado, CI sin acceso al localhost del Capitan, timeout.
    // Todos son el mismo caso operativo: la autoridad no esta escuchando.
    return {
      ok: false,
      reachable: false,
      reason: error?.name === "AbortError" ? "timeout" : (error?.code || error?.message || "unreachable")
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function health({ url = bitacoraUrl(), timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  return request(`${url}/api/health`, { timeoutMs });
}

async function recoverByIdempotencyKey(idempotencyKey, { url, timeoutMs }) {
  if (!idempotencyKey) return null;
  const lookup = await request(
    `${url}/api/events?idempotency_key=${encodeURIComponent(idempotencyKey)}&limit=2`,
    { timeoutMs }
  );
  if (!lookup.ok || !Array.isArray(lookup.payload) || lookup.payload.length !== 1) return null;
  return lookup.payload[0];
}

export async function appendEvent(payload, {
  url = bitacoraUrl(),
  timeoutMs = DEFAULT_TIMEOUT_MS,
  idempotencyKey = ""
} = {}) {
  const body = idempotencyKey ? { ...payload, idempotency_key: idempotencyKey } : payload;
  const result = await request(`${url}/api/events`, { method: "POST", body, timeoutMs });
  if (!result.reachable) {
    const recovered = await recoverByIdempotencyKey(idempotencyKey, { url, timeoutMs });
    if (!recovered) return result;
    return {
      ok: true,
      reachable: true,
      recoveredAfterAmbiguousReceipt: true,
      writeVerified: true,
      writePerformed: null,
      idempotentReplay: null,
      eventId: recovered.event_id,
      eventHash: recovered.event_hash,
      payload: { ok: true, event: recovered },
    };
  }
  if (result.ok && !result.payload?.write_verified && idempotencyKey) {
    const recovered = await recoverByIdempotencyKey(idempotencyKey, { url, timeoutMs });
    if (recovered) {
      return {
        ...result,
        recoveredAfterAmbiguousReceipt: true,
        writeVerified: true,
        writePerformed: null,
        idempotentReplay: null,
        eventId: recovered.event_id,
        eventHash: recovered.event_hash,
      };
    }
  }
  return {
    ...result,
    writeVerified: Boolean(result.payload?.write_verified),
    writePerformed: Boolean(result.payload?.write_performed),
    idempotentReplay: Boolean(result.payload?.idempotent_replay),
    eventId: result.payload?.event?.event_id || null,
    eventHash: result.payload?.event?.event_hash || null
  };
}

// Envoltura de conveniencia para el motor: construye, envia y resume en una linea
// legible para el parte. Nunca lanza.
export async function reportSleepCycle(context, options = {}) {
  const payload = buildSleepEvent(context);
  const idempotencyKey = options.idempotencyKey
    || (context.reportPath ? `sleep:${context.reportPath}` : "");
  const result = await appendEvent(payload, { ...options, idempotencyKey });
  if (!result.reachable) {
    return { ok: false, reachable: false, note: `bitacora no alcanzable (${result.reason}); parte solo en repo` };
  }
  if (!result.ok) {
    return { ok: false, reachable: true, note: `bitacora rechazo el evento (HTTP ${result.httpStatus})`, payload: result.payload };
  }
  return {
    ok: true,
    reachable: true,
    eventId: result.eventId,
    writeVerified: result.writeVerified,
    note: `evento ${result.eventId} registrado; write_verified=${result.writeVerified}`
  };
}
