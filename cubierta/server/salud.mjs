// chopper-salud: el parte medico de la tripulacion.
//
// Encargo: docs/architecture/ENCARGO_PULSO_REAL.md (seccion 8).
//
// REGLA DURA, inversa a la habitual: este modulo NO PUEDE leer `senal.vitales`
// como fuente primaria. Solo salida de sonda y almacen medido. Si lo unico
// disponible es el autoinforme del agente, la respuesta es "declarado, no
// observado" -- nunca un numero pelado.
//
// Y sabe decir "no puedo medirte" de forma GRANULAR: por nakama y por eje. Un
// medico que solo sabe decir "no se nada" cuando se le cae un instrumento
// tampoco esta midiendo.
//
// Estructuralmente, la prueba de aceptacion se cumple por construccion: como
// aqui no entra ni una lectura de `senal.vitales`, con todas las sondas caidas
// no queda ningun numero que publicar.

import { OBSERVADO, NO_OBSERVABLE, SIN_DATO, EJES } from "./sondas.mjs";
import { DISCORDANTE, MUDO, A_BORDO, DECLARADO_V, NO_OBSERVABLE_V } from "./latido.mjs";

const NO_PUEDO = "no puedo medirte";

function vitalDeEje(nombre, unidad, ejeEstado, tinta = "medido") {
  if (!ejeEstado || ejeEstado.estado === NO_OBSERVABLE) {
    return {
      nombre,
      valor: null,
      unidad,
      tinta: "desconocido",
      origen: NO_OBSERVABLE,
      sonda: ejeEstado?.fuente || null,
      motivo: `${NO_PUEDO}: ${ejeEstado?.motivo || "sin instrumento para este eje"}`,
    };
  }
  if (ejeEstado.estado === SIN_DATO || ejeEstado.valor === null) {
    return {
      nombre,
      valor: null,
      unidad,
      tinta: "desconocido",
      origen: ejeEstado.estado,
      sonda: ejeEstado.fuente,
      motivo: ejeEstado.motivo || "la sonda responde y no hay nada que reportar",
    };
  }
  return {
    nombre,
    valor: ejeEstado.valor,
    unidad,
    tinta,
    origen: OBSERVADO,
    sonda: ejeEstado.fuente,
    motivo: ejeEstado.motivo,
  };
}

function vitalDeAlmacen(nombre, unidad, lectura) {
  if (!lectura || lectura.valor === null) {
    return {
      nombre,
      valor: null,
      unidad,
      tinta: "desconocido",
      origen: SIN_DATO,
      sonda: "almacen medido (hablar.mjs)",
      motivo: `${NO_PUEDO}: ${lectura?.motivo || "sin muestras medidas"}`,
    };
  }
  return {
    nombre,
    valor: lectura.valor,
    unidad,
    tinta: lectura.tipo === "tasa" ? "calculado" : "medido",
    origen: OBSERVADO,
    sonda: `almacen medido (${lectura.tipo}, n=${lectura.n})`,
    // El sello de antiguedad es obligatorio: un numero medido sin fecha es una
    // mentira con procedencia falsificada (encargo 6).
    motivo: `muestra de hace ${Math.round((lectura.edad_ms || 0) / 1000)}s${lectura.motivo ? `; ${lectura.motivo}` : ""}`,
  };
}

/**
 * Parte de salud de un nakama. `fila` es la fila del vigia; `almacen` el
 * almacen medido. En ningun punto se consulta lo que el agente afirma de si.
 */
export function saludDe(fila, almacen, ahoraMs = Date.now()) {
  const ejes = fila.observado || {};
  const vitales = [
    vitalDeAlmacen("pulso", "tok/s", almacen?.lectura(fila.nakama, "tokens_por_s", ahoraMs)),
    vitalDeAlmacen("latencia", "ms", almacen?.lectura(fila.nakama, "latencia_ms", ahoraMs)),
    vitalDeAlmacen("despertar", "ms", almacen?.lectura(fila.nakama, "carga_ms", ahoraMs)),
    vitalDeEje("residencia", "MB", ejes.residencia),
    vitalDeEje("memoria", "MB", ejes.memoria),
    vitalDeEje("escritura", "eventos", ejes.escritura),
  ];

  const noPuedoMedir = EJES.filter((e) => ejes[e]?.estado === NO_OBSERVABLE)
    .map((e) => ({ eje: e, motivo: ejes[e].motivo }));

  return {
    nakama: fila.nakama,
    nombre: fila.nombre,
    veredicto: fila.presencia,
    motivo: fila.motivo,
    actor_declarado: fila.actor,
    ejes: Object.fromEntries(EJES.map((e) => [e, {
      estado: ejes[e]?.estado || SIN_DATO,
      fuente: ejes[e]?.fuente || null,
      motivo: ejes[e]?.motivo || null,
    }])),
    vitales,
    no_puedo_medirte: noPuedoMedir,
    contradicciones: fila.contradicciones || [],
    // Lo que el agente afirma se adjunta SOLO como referencia declarada, jamas
    // como valor del parte, y siempre etiquetado.
    nota_declarada: fila.ultima_tarea
      ? { tarea: fila.ultima_tarea, origen: "declarado por el agente, no verificado" }
      : null,
  };
}

export function informeSalud({ filas = [], almacen = null, ahoraMs = Date.now() } = {}) {
  const tripulacion = filas.map((f) => saludDe(f, almacen, ahoraMs));
  const cuenta = (v) => tripulacion.filter((t) => t.veredicto === v).length;

  const medidos = tripulacion.reduce(
    (a, t) => a + t.vitales.filter((v) => v.valor !== null).length, 0,
  );

  return {
    ts: new Date(ahoraMs).toISOString(),
    generado_por: "chopper-salud",
    regla: "Este parte no lee lo que el agente afirma de si mismo. Todo numero sale de una sonda o del almacen medido; lo que no se pudo medir se dice, eje por eje.",
    resumen: {
      a_bordo: cuenta(A_BORDO),
      declarado: cuenta(DECLARADO_V),
      mudo: cuenta(MUDO),
      discordante: cuenta(DISCORDANTE),
      no_observable: cuenta(NO_OBSERVABLE_V),
      vitales_con_valor_medido: medidos,
    },
    tripulacion,
  };
}
