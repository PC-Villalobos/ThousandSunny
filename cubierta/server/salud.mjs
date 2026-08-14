// chopper-salud: el parte medico de la tripulacion.
//
// REGLA DURA, inversa a la habitual: este modulo NO PUEDE leer lo que el actor
// afirma de si mismo. Solo salida de sonda y almacen medido. Si lo unico
// disponible es el autoinforme, la respuesta es que no se ha comprobado --
// nunca un numero pelado.
//
// Sabe decir "no puedo medirte" de forma GRANULAR: por nakama y por eje. Un
// medico que solo sabe decir "no se nada" cuando se le cae un instrumento
// tampoco esta midiendo.
//
// CONVERGENCIA EPISTEMICA
// Todo estatuto sale del nucleo compartido `shared/epistemico.mjs`, con el
// umbral canonico de `observed` (dos referencias de evidencia) y `not_recorded`
// para la ausencia. Ningun enum crudo sale de aqui hacia el lector: cada valor
// viaja traducido con titulo y detalle.

import { EJES } from "./sondas.mjs";
import { calcularVitales, CONTRATO_VERSION } from "./vitales.mjs";
import { presentarPresencia, presentarEje, presentarContradiccion } from "../shared/vocabulario.mjs";
import { AVISO_AUSENCIA_ESTRUCTURAL } from "../../shared/epistemico.mjs";

const NO_PUEDO = "no puedo medirte";

/**
 * Parte de salud de un nakama. `fila` es la fila del vigia; `almacen` el
 * almacen medido. En ningun punto se consulta lo que el actor afirma de si.
 */
export function saludDe(fila, almacen, ahoraMs = Date.now()) {
  const ejes = fila.observado || {};
  const lecturas = almacen
    ? {
        tokens_por_s: almacen.lectura(fila.nakama, "tokens_por_s", ahoraMs),
        latencia_ms: almacen.lectura(fila.nakama, "latencia_ms", ahoraMs),
      }
    : null;

  // Se pasa `ejes` y `lecturas`, jamas la fuente declarada.
  const { vitales } = calcularVitales({ ejes, lecturas, nakamaId: fila.nakama, ahoraMs });

  const noPuedoMedir = EJES
    .filter((e) => ejes[e]?.estado === "no_observable")
    .map((e) => ({
      eje: e,
      presentacion: presentarEje("no_observable"),
      motivo: `${NO_PUEDO}: ${ejes[e].motivo || AVISO_AUSENCIA_ESTRUCTURAL}`,
    }));

  return {
    nakama: fila.nakama,
    nombre: fila.nombre,
    presencia: presentarPresencia(fila.presencia),
    motivo: fila.motivo,
    actor_declarado: fila.actor,
    ejes: Object.fromEntries(EJES.map((e) => [e, {
      presentacion: presentarEje(ejes[e]?.estado ?? null),
      fuente: ejes[e]?.fuente || null,
      motivo: ejes[e]?.motivo || null,
    }])),
    vitales,
    no_puedo_medirte: noPuedoMedir,
    contradicciones: (fila.contradicciones || []).map((c) => ({
      ...c,
      presentacion: presentarContradiccion(c.codigo),
    })),
    nota_declarada: fila.ultima_tarea
      ? { tarea: fila.ultima_tarea, aviso: "Declarado por el actor. Ningun instrumento lo ha comprobado." }
      : null,
  };
}

export function informeSalud({ filas = [], almacen = null, ahoraMs = Date.now() } = {}) {
  const tripulacion = filas.map((f) => saludDe(f, almacen, ahoraMs));
  const cuenta = (clave) => tripulacion.filter((t) => t.presencia.clave === clave).length;
  const conValor = tripulacion.reduce((a, t) => a + t.vitales.filter((v) => v.valor !== null).length, 0);
  const afirmadosObservados = tripulacion.reduce(
    (a, t) => a + t.vitales.filter((v) => v.estatuto.clave === "observed").length, 0,
  );

  return {
    ts: new Date(ahoraMs).toISOString(),
    contract_version: CONTRATO_VERSION,
    generado_por: "chopper-salud",
    regla: "Este parte no lee lo que el actor afirma de si mismo. Todo numero sale de una sonda o del almacen medido; "
      + "lo que no se pudo medir se dice, eje por eje. `observed` exige dos referencias de evidencia.",
    resumen: {
      a_bordo: cuenta("a_bordo"),
      declarado: cuenta("declarado"),
      mudo: cuenta("mudo"),
      discordante: cuenta("discordante"),
      no_observable: cuenta("no_observable"),
      vitales_con_valor: conValor,
      vitales_afirmados_observados: afirmadosObservados,
    },
    tripulacion,
  };
}
