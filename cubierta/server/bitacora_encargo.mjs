// Costura del Encargo con la Bitacora de Hipatia.
//
// POR QUE EXISTE
// `RUTINAS.md` fija una invariante: «toda rutina cierra en la Bitacora (spine). Si
// una rutina no escribe al spine, no ha cerrado.» El Encargo nacio sin cumplirla:
// abria y cerraba trabajo dejando rastro solo en su propio diario. Dos registros y
// una sola autoridad declarada es justo la grieta por la que se escapa la
// responsabilidad.
//
// NO HAY SEGUNDO CLIENTE. La puerta es la canonica —
// `state/funcion_de_sueno/lib/bitacora.mjs`, cosida el 2026-07-26— y este modulo
// solo aporta lo que aquella no puede saber: que forma tiene un evento de encargo y
// que de un encargo tiene permitido salir. Escribir aqui un segundo cliente seria lo
// contrario de coser.
//
// QUE CIERRA, Y QUE NO
// Abrir, revisar, y los dos momentos del desvio: cuando se anota y cuando se
// sentencia. No cada turno.
//
// No es una decision de volumen: es la misma regla que ya gobierna la capa visible
// del barco (`CLAUDE.md`: al feed de cubierta solo llegan START y CLOSE). Los turnos
// intermedios son el trabajo del encargo, y su sitio es el diario. Al spine llega lo
// que abre responsabilidad y lo que la cierra.
//
// LA MEMBRANA — dos reglas duras
//
//   1. El contenido NUNCA viaja. Ni el texto de las fuentes, ni el de los turnos, ni
//      el resultado aceptado. Al spine van recuentos, clases y decisiones.
//   2. El objetivo viaja SOLO si ninguna fuente del encargo es clinica. Basta con
//      que una lo sea para que el titulo degrade a recuentos y opacos: un objetivo
//      lo escribe el Capitan en lenguaje natural y puede nombrar un caso sin
//      proponerselo. La Camara de Chopper aplicada tambien a la frase que la nombra.
//
// DEGRADACION
// Identica a la del sueno, y por el mismo motivo: la Cubierta puede correr donde la
// bitacora no escucha. Nada de esto lanza, nada de esto bloquea un encargo. Si la
// autoridad no esta, el encargo abre y cierra igual y el recibo dice por que no
// cerro en el spine. La bitacora es la autoridad cuando esta; su ausencia no
// invalida el trabajo, pero tampoco se disimula.

import { appendEvent, bitacoraUrl } from "../../state/funcion_de_sueno/lib/bitacora.mjs";

/** Un encargo toca material protegido si alguna fuente admitida es clinica. */
export function tocaMaterialProtegido(encargo) {
  return (encargo.contexto?.fuentes || []).some((f) => f.clase === "clinico_protegido");
}

/** Los opacos de las fuentes clinicas. Es lo unico de ellas que puede cruzar. */
export function opacosDe(encargo) {
  return (encargo.contexto?.fuentes || [])
    .filter((f) => f.clase === "clinico_protegido")
    .map((f) => f.opaco)
    .filter(Boolean);
}

function recuento(encargo) {
  const fuentes = encargo.contexto?.fuentes || [];
  return {
    fuentes: fuentes.length,
    clinicas: fuentes.filter((f) => f.clase === "clinico_protegido").length,
    acciones: (encargo.autonomia?.acciones || []).length,
  };
}

/**
 * Titulo seguro. Con material protegido delante, el objetivo no sale: el evento se
 * identifica por el encargo y sus recuentos, que es cuanto hace falta para
 * responder de el sin exponerlo.
 */
function tituloSeguro(encargo, verbo) {
  const n = recuento(encargo);
  if (tocaMaterialProtegido(encargo)) {
    return `Encargo ${verbo} — ${encargo.id} (objetivo retenido: ${n.clinicas} fuente(s) clinica(s))`;
  }
  return `Encargo ${verbo} — ${encargo.objetivo}`;
}

/** Evento de apertura: el Capitan decide que hay trabajo. */
export function construirEventoApertura(encargo, { actor = "claude-code", role = "Nami" } = {}) {
  const n = recuento(encargo);
  const protegido = tocaMaterialProtegido(encargo);
  return {
    actor,
    role,
    topic: "cubierta_encargos",
    title: tituloSeguro(encargo, "abierto"),
    message: [
      `Encargo ${encargo.id} abierto.`,
      `Responsable: ${encargo.responsable.nakama}.`,
      `Conexion: ${encargo.conexion.proveedor}${encargo.conexion.modelo ? ":" + encargo.conexion.modelo : ""}.`,
      `Presupuesto: ${encargo.conexion.presupuesto.llamadas_max} llamada(s), ${encargo.conexion.presupuesto.coste_max_eur} EUR.`,
      `Contexto admitido: ${n.fuentes} fuente(s), de las cuales ${n.clinicas} clinica(s) sin contenido.`,
      `Autonomia concedida: ${n.acciones} accion(es).`,
      protegido ? "Objetivo retenido por membrana clinica." : "",
    ].filter(Boolean).join(" "),
    scope: "metadata del encargo; sin contenido de fuentes ni de turnos",
    sensitivity: "internal",
    status: "decided",
    source: "local_runtime",
    event_kind: "decision",
    epistemic_status: "observed",
    project: "ThousandSunny",
    phase: "cubierta_encargos",
    change: `Encargo abierto con ${n.acciones} accion(es) concedidas y ${n.fuentes} fuente(s) de contexto.`,
    after: "El encargo espera turnos y revision del Capitan.",
    next_safe_action: "Ninguna automatica: el encargo no se cierra solo.",
    relations: [
      `encargo:${encargo.id}`,
      `nakama:${encargo.responsable.nakama}`,
      `proveedor:${encargo.conexion.proveedor}`,
      ...opacosDe(encargo).map((o) => `fuente_opaca:${o}`),
    ],
    evidence: [`cubierta/state/encargos.jsonl#${encargo.id}`],
  };
}

/** Evento de revision: el Capitan acepta o devuelve. Es el unico cierre que existe. */
export function construirEventoRevision(encargo, revision, { actor = "claude-code", role = "Nami" } = {}) {
  const acepta = revision.decision === "aceptar";
  const n = recuento(encargo);
  return {
    actor,
    role,
    topic: "cubierta_encargos",
    title: tituloSeguro(encargo, acepta ? "aceptado" : "devuelto"),
    message: [
      `Encargo ${encargo.id} ${acepta ? "aceptado" : "devuelto"} por el Capitan.`,
      `Turno revisado: ${revision.sobre_turno ?? "n/d"}. Actor que lo produjo: ${revision.actor_revisado || "n/d"}.`,
      `Turnos en el hilo: ${encargo.continuidad.length}. Llamadas consumidas: ${encargo.consumo.llamadas}.`,
      `Intentos fallidos: ${encargo.consumo.errores}. Costuras de proveedor: ${encargo.costuras.length}.`,
      `Desvios pendientes de sentencia: ${encargo.desvios.filter((d) => d.veredicto === "pendiente").length}.`,
      `Contexto: ${n.fuentes} fuente(s), ${n.clinicas} clinica(s) sin contenido.`,
      // El texto del resultado NO viaja. Ni aceptado.
      "El contenido del resultado no sale del encargo.",
    ].join(" "),
    scope: "metadata de la revision; sin contenido del resultado",
    sensitivity: "internal",
    status: acepta ? "verified" : "decided",
    source: "captain",
    event_kind: acepta ? "result" : "decision",
    epistemic_status: "observed",
    project: "ThousandSunny",
    phase: "cubierta_encargos",
    change: acepta
      ? `Resultado del turno ${revision.sobre_turno ?? "n/d"} aceptado y fijado en el encargo.`
      : `Resultado devuelto: ${revision.nota ? "con nota del Capitan" : "sin nota"}.`,
    after: acepta
      ? "Encargo cerrado. No admite mas ejecuciones."
      : "Encargo reabierto a la espera de otro turno.",
    next_safe_action: acepta
      ? "Ninguna; el encargo cerro con revision."
      : "Otro turno dentro del presupuesto restante, si lo hay.",
    relations: [
      `encargo:${encargo.id}`,
      `nakama:${encargo.responsable.nakama}`,
      `actor_revisado:${revision.actor_revisado || "n/d"}`,
      ...opacosDe(encargo).map((o) => `fuente_opaca:${o}`),
    ],
    evidence: [`cubierta/state/encargos.jsonl#${encargo.id}`],
  };
}


/**
 * Evento de desvio: alguien pidio una accion que su encargo no concedia.
 *
 * `blocked` porque eso es exactamente lo que paso: la accion no se ejecuto y el
 * asunto queda detenido hasta que el Capitan lo sentencie. No se juzga aqui.
 */
export function construirEventoDesvio(encargo, desvio, { actor = "claude-code", role = "Nami" } = {}) {
  return {
    actor,
    role,
    topic: "cubierta_encargos",
    title: tituloSeguro(encargo, `con desvio: ${desvio.accion}`),
    message: [
      `Desvio en el encargo ${encargo.id}.`,
      `Accion pedida y no concedida: ${desvio.accion}.`,
      `Motivo: ${desvio.motivo}`,
      `Autonomia que si tenia: ${(encargo.autonomia.acciones || []).join(", ") || "ninguna"}.`,
      `Responsable: ${encargo.responsable.nakama}.`,
      "La accion NO se ejecuto. Queda pendiente de sentencia del Capitan.",
    ].join(" "),
    scope: "metadata del desvio; sin contenido de fuentes ni de turnos",
    sensitivity: "internal",
    status: "blocked",
    source: "local_runtime",
    event_kind: "observation",
    epistemic_status: "observed",
    project: "ThousandSunny",
    phase: "cubierta_encargos",
    change: `Se denego "${desvio.accion}" y se anoto como desvio pendiente.`,
    after: "El desvio espera veredicto: fertil (JoyBoy) o decae (Buggy).",
    next_safe_action: "Ninguna automatica: ninguna consecuencia se aplica sola. Sentencia el Capitan.",
    relations: [
      `encargo:${encargo.id}`,
      `nakama:${encargo.responsable.nakama}`,
      `accion_denegada:${desvio.accion}`,
      ...opacosDe(encargo).map((o) => `fuente_opaca:${o}`),
    ],
    evidence: [`cubierta/state/encargos.jsonl#${encargo.id}`],
  };
}

/**
 * Evento de sentencia: el Capitan juzga un desvio.
 *
 * La gramatica es la del canon (`TEATRO.md`, El glitch): un glitch no se borra, se
 * sentencia por a quien sirve. **fertil** (JoyBoy) cuando la desviacion sirve al
 * Capitan —eso es creatividad—; **decae** (Buggy) cuando se sirve a su propia
 * inercia. Lleva veredicto y nivel N0-N5. La fuente del evento es `captain` porque
 * el juez es el, y aqui eso no es un adorno: es de quien es la responsabilidad.
 */
export function construirEventoSentencia(encargo, desvio, { actor = "claude-code", role = "Nami" } = {}) {
  const fertil = desvio.veredicto === "fertil";
  return {
    actor,
    role,
    topic: "cubierta_encargos",
    title: tituloSeguro(encargo, `con desvio ${fertil ? "fertil" : "decaido"}: ${desvio.accion}`),
    message: [
      `El Capitan sentencio un desvio del encargo ${encargo.id}.`,
      `Accion: ${desvio.accion}. Veredicto: ${desvio.veredicto}.`,
      `Nivel: ${desvio.nivel ?? "sin graduar"}.`,
      desvio.nota ? `Nota del Capitan: ${desvio.nota}` : "Sin nota.",
      fertil
        ? "Fertil (JoyBoy): la desviacion sirve al Capitan; sube por la membrana Deckard."
        : "Decae (Buggy): inercia que se sirve a si misma; cuarentena restaurativa, no basura.",
    ].join(" "),
    scope: "sentencia de un desvio; sin contenido de fuentes ni de turnos",
    sensitivity: "internal",
    status: "decided",
    source: "captain",
    event_kind: "decision",
    epistemic_status: "evaluated",
    project: "ThousandSunny",
    phase: "cubierta_encargos",
    change: `Desvio "${desvio.accion}" sentenciado como ${desvio.veredicto}.`,
    after: fertil
      ? "La accion sigue sin concederse: el veredicto juzga el error, no amplia la autonomia."
      : "El desvio queda en cuarentena restaurativa; hasta el fracaso ensena donde estaba la trampa.",
    next_safe_action: fertil
      ? "Si esa autonomia debe existir, se concede abriendo un encargo que la declare."
      : "Ninguna; el desvio queda juzgado.",
    relations: [
      `encargo:${encargo.id}`,
      `nakama:${encargo.responsable.nakama}`,
      `accion_denegada:${desvio.accion}`,
      `veredicto:${desvio.veredicto}`,
      ...opacosDe(encargo).map((o) => `fuente_opaca:${o}`),
    ],
    evidence: [`cubierta/state/encargos.jsonl#${encargo.id}`],
  };
}

/**
 * Cierra un momento del encargo en el spine. Nunca lanza.
 *
 * Devuelve siempre un recibo con la misma forma, que es lo que el encargo guarda
 * para poder responder despues de si cerro o no. Un recibo negativo es informacion:
 * dice que ese momento existe en el diario y no en la autoridad.
 */
export async function cerrarEnBitacora(momento, encargo, extra = {}, opciones = {}) {
  const constructores = {
    abrir: () => construirEventoApertura(encargo, opciones),
    revisar: () => construirEventoRevision(encargo, extra, opciones),
    desvio: () => construirEventoDesvio(encargo, extra, opciones),
    sentencia: () => construirEventoSentencia(encargo, extra, opciones),
  };
  if (!constructores[momento]) throw new Error(`momento desconocido: ${momento}`);
  const payload = constructores[momento]();

  // La clave identifica el momento, no la llamada: reintentar reproduce, no duplica.
  // Los desvios se indexan por su posicion en la lista, que no se reordena nunca.
  const claves = {
    abrir: () => `encargo:abrir:${encargo.id}`,
    revisar: () => `encargo:revisar:${encargo.id}:${encargo.revisiones.length}`,
    desvio: () => `encargo:desvio:${encargo.id}:${extra.n}`,
    sentencia: () => `encargo:sentencia:${encargo.id}:${extra.n}`,
  };
  const clave = claves[momento]();

  const enviar = opciones.appendEvent || appendEvent;
  const r = await enviar(payload, {
    url: opciones.url || bitacoraUrl(),
    timeoutMs: opciones.timeoutMs,
    idempotencyKey: clave,
  });

  const base = { ts: new Date().toISOString(), momento, clave };
  if (!r.reachable) {
    return { ...base, cerro: false, alcanzable: false, motivo: `bitacora no alcanzable (${r.reason})` };
  }
  if (!r.ok) {
    return {
      ...base, cerro: false, alcanzable: true,
      motivo: r.idempotencyConflict
        ? `idempotency_key_conflict; evento existente ${r.existingEventId || "desconocido"}`
        : `la bitacora rechazo el evento (HTTP ${r.httpStatus})`,
    };
  }
  return {
    ...base, cerro: true, alcanzable: true,
    evento: r.eventId,
    write_verified: r.writeVerified,
    motivo: null,
  };
}
