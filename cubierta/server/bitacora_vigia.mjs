// Costura del Vigia con la Bitacora: la sentencia de un desvio del barco.
//
// POR QUE ESTA APARTE DE `bitacora_encargo.mjs`
// Son dos desvios distintos con la misma gramatica. El del encargo es una accion que
// un trabajo pidio sin tenerla concedida. El del Vigia es una senal que declara algo
// que la constitucion de ese nakama no contempla. El primero pertenece a una unidad
// de trabajo; el segundo, al barco. Meterlos en el mismo modulo los haria parecer la
// misma cosa, y no lo son: cambian el sujeto, el alcance y quien responde.
//
// QUE CIERRA
// Solo el veredicto, no la deteccion. `detectarDesvios` recalcula en cada tick: un
// desvio detectado es un estado, no un suceso, y cerrarlo cada dos segundos llenaria
// el spine de la misma frase. El suceso es la SENTENCIA — el momento en que el
// Capitan asigna responsabilidad—, y ese es el que se registra.
//
// GRAMATICA — la del canon, no una propia
// `TEATRO.md`, El glitch: un glitch no se borra, se sentencia por a quien sirve.
// **fertil** (JoyBoy) cuando la desviacion sirve al Capitan; **decae** (Buggy) cuando
// se sirve a su propia inercia, y entonces es cuarentena restaurativa, no basura.
// Veredicto mas nivel N0-N5. Ninguna consecuencia es automatica.

import { appendEvent, bitacoraUrl } from "../../state/funcion_de_sueno/lib/bitacora.mjs";

export function construirEventoVeredicto(fallo, { actor = "cubierta", role = "Nami" } = {}) {
  const fertil = fallo.veredicto === "fertil";
  const nakama = fallo.nakama || "sin nakama";
  return {
    actor,
    role,
    topic: "cubierta_vigia",
    title: `Desvio ${fertil ? "fertil" : "decaido"} — ${nakama}${fallo.clase ? ` (${fallo.clase})` : ""}`,
    message: [
      `El Capitan sentencio un desvio del Vigia.`,
      `Nakama: ${nakama}. Clase: ${fallo.clase || "sin clasificar"}.`,
      `Veredicto: ${fallo.veredicto}. Nivel: ${fallo.nivel ?? "sin graduar"}.`,
      fallo.nota ? `Nota del Capitan: ${fallo.nota}` : "Sin nota.",
      fertil
        ? "Fertil (JoyBoy): la desviacion sirve al Capitan; sube por la membrana Deckard."
        : "Decae (Buggy): inercia que se sirve a si misma; cuarentena restaurativa.",
    ].join(" "),
    scope: "sentencia de un desvio del vigia; sin contenido de senales",
    sensitivity: "internal",
    status: "decided",
    source: "captain",
    event_kind: "decision",
    epistemic_status: "evaluated",
    project: "ThousandSunny",
    phase: "cubierta_vigia",
    change: `Desvio de ${nakama} sentenciado como ${fallo.veredicto}.`,
    after: fertil
      ? "La rebeldia util no se castiga: queda registrada y juzgada."
      : "El desvio queda en cuarentena restaurativa; hasta el fracaso ensena donde estaba la trampa.",
    next_safe_action: "Ninguna: ninguna consecuencia del veredicto se aplica sola.",
    relations: [
      `nakama:${nakama}`,
      `veredicto:${fallo.veredicto}`,
      ...(fallo.clase ? [`clase:${fallo.clase}`] : []),
    ],
    evidence: ["cubierta/state/veredictos.jsonl"],
  };
}

/**
 * Cierra un veredicto en el spine. Nunca lanza, misma degradacion que el resto:
 * si la autoridad no escucha, el veredicto se emitio igual y el recibo dice por que
 * no cerro. La clave usa la hora del fallo, que es lo unico que lo identifica de
 * forma estable en el fichero de veredictos.
 */
export async function cerrarVeredictoEnBitacora(fallo, opciones = {}) {
  const enviar = opciones.appendEvent || appendEvent;
  const r = await enviar(construirEventoVeredicto(fallo, opciones), {
    url: opciones.url || bitacoraUrl(),
    timeoutMs: opciones.timeoutMs,
    idempotencyKey: `vigia:veredicto:${fallo.nakama || "?"}:${fallo.ts}`,
  });
  if (!r.reachable) return { cerro: false, alcanzable: false, motivo: `bitacora no alcanzable (${r.reason})` };
  if (!r.ok) return { cerro: false, alcanzable: true, motivo: `la bitacora rechazo el evento (HTTP ${r.httpStatus})` };
  return { cerro: true, alcanzable: true, evento: r.eventId, write_verified: r.writeVerified, motivo: null };
}
