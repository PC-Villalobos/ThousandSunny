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
// score y repeticion declarada. Nunca contenido de ficheros, nunca material clinico,
// nunca rutas resolubles a `_protegido`. `sensitivity` va fijada a "internal".

import { normalizeRoleIdentity } from "../role_assignment.mjs";

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
export function buildSleepEvent({
  scopeId,
  executor,
  actor,
  role,
  supervisorModel = null,
  executionStreak,
  dayStreak,
  nextCandidateRole,
  rotationDecision,
  summary,
  reportPath
}) {
  const identity = normalizeRoleIdentity({ scopeId, executor, actor, role, supervisorModel });
  const deltas = summary?.deltas ?? 0;
  const files = summary?.files ?? 0;
  const issues = summary?.issues ?? 0;
  const score = summary?.coherenceScore;
  const scoreText = typeof score === "number" ? score.toFixed(3) : "n/d";

  return {
    actor: identity.actor,
    role: identity.role,
    topic: "funcion_de_sueno",
    title: `Ciclo de sueno ${role || "?"} — ${deltas} deltas, ${issues} incidencias`,
    message: [
      `Ciclo de la Funcion de Sueno completado.`,
      `Perfil: ${identity.scopeId}. Executor: ${identity.executor}. Actor: ${identity.actor}. Rol: ${identity.role}. Modelo supervisor: ${identity.supervisorModel || "ninguno"}.`,
      `Ficheros inventariados: ${files}. Deltas episodicos: ${deltas}.`,
      `Incidencias de coherencia: ${issues}. Score: ${scoreText}.`,
      `Repeticion: ${executionStreak ?? "n/d"} ejecuciones, ${dayStreak ?? "n/d"} fechas UTC. Rol candidato: ${nextCandidateRole || "n/d"}. Decision: ${rotationDecision || "n/d"}.`
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
    after: `Asignacion declarada registrada; ninguna rotacion automatica. Rol candidato ${nextCandidateRole || "n/d"}.`,
    next_safe_action: dayStreak >= 3
      ? "Revision humana requerida antes de cualquier cambio de rol."
      : "Ninguna; el ciclo cerro limpio.",
    relations: [
      `scope:${identity.scopeId}`,
      `executor:${identity.executor}`,
      `actor:${identity.actor}`,
      `role:${identity.role}`,
      ...(identity.supervisorModel ? [`supervisor_model:${identity.supervisorModel}`] : [])
    ],
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
  if (!idempotencyKey) return { status: "not_requested" };
  const lookup = await request(
    `${url}/api/events?idempotency_key=${encodeURIComponent(idempotencyKey)}&limit=2`,
    { timeoutMs }
  );
  if (!lookup.reachable) return { status: "lookup_unreachable", lookup };
  if (!lookup.ok) return { status: "lookup_failed", lookup };
  if (!Array.isArray(lookup.payload)) return { status: "lookup_invalid", lookup };
  if (lookup.payload.length === 0) return { status: "not_found", lookup };
  if (lookup.payload.length > 1) {
    return {
      status: "duplicate_idempotency_records",
      lookup,
      eventIds: lookup.payload.map((event) => event?.event_id).filter(Boolean)
    };
  }
  return { status: "found", lookup, event: lookup.payload[0] };
}

export async function appendEvent(payload, {
  url = bitacoraUrl(),
  timeoutMs = DEFAULT_TIMEOUT_MS,
  idempotencyKey = ""
} = {}) {
  const body = idempotencyKey ? { ...payload, idempotency_key: idempotencyKey } : payload;
  const result = await request(`${url}/api/events`, { method: "POST", body, timeoutMs });
  if (!result.reachable) {
    const recovery = await recoverByIdempotencyKey(idempotencyKey, { url, timeoutMs });
    if (recovery.status === "duplicate_idempotency_records") {
      return {
        ok: false,
        reachable: true,
        reason: "duplicate_idempotency_records",
        recoveryStatus: recovery.status,
        duplicateIdempotencyRecords: true,
        duplicateEventIds: recovery.eventIds,
        writeVerified: null,
        writePerformed: null,
        idempotentReplay: null,
        payload: {
          ok: false,
          error: recovery.status,
          event_ids: recovery.eventIds
        }
      };
    }
    if (recovery.status !== "found") return { ...result, recoveryStatus: recovery.status };
    const recovered = recovery.event;
    return {
      ok: true,
      reachable: true,
      recoveredAfterAmbiguousReceipt: true,
      recoveryStatus: recovery.status,
      writeVerified: true,
      writePerformed: null,
      idempotentReplay: null,
      eventId: recovered.event_id,
      eventHash: recovered.event_hash,
      payload: { ok: true, event: recovered },
    };
  }
  const idempotencyConflict = result.httpStatus === 409
    && result.payload?.error === "idempotency_key_conflict";
  return {
    ...result,
    writeVerified: typeof result.payload?.write_verified === "boolean"
      ? result.payload.write_verified
      : null,
    writePerformed: typeof result.payload?.write_performed === "boolean"
      ? result.payload.write_performed
      : null,
    idempotentReplay: typeof result.payload?.idempotent_replay === "boolean"
      ? result.payload.idempotent_replay
      : null,
    idempotencyConflict,
    existingEventId: idempotencyConflict
      ? (result.payload?.existing_event_id || null)
      : null,
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
    return {
      ok: false,
      reachable: result.reachable,
      note: result.reason === "duplicate_idempotency_records"
        ? "bitacora bloqueo la recuperacion: duplicate_idempotency_records"
        : `bitacora rechazo el evento (HTTP ${result.httpStatus})`,
      idempotencyConflict: Boolean(result.idempotencyConflict),
      existingEventId: result.existingEventId || null,
      duplicateIdempotencyRecords: Boolean(result.duplicateIdempotencyRecords),
      duplicateEventIds: result.duplicateEventIds || [],
      recoveryStatus: result.recoveryStatus || null,
      payload: result.payload
    };
  }
  return {
    ok: true,
    reachable: true,
    eventId: result.eventId,
    writeVerified: result.writeVerified,
    note: `evento ${result.eventId} registrado; write_verified=${result.writeVerified}`
  };
}
