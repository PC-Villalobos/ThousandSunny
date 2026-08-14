// Nucleo epistemico compartido de la Cubierta.
//
// POR QUE EXISTE, Y AQUI
// Hay dos superficies que se llaman Cubierta: `state/cubierta_ui/` (contrato
// pedagogico reconciliado contra sunny-control-bridge) y `cubierta/` (el barco
// isometrico). Sus dominios son distintos y no tienen por que converger. Su
// nucleo epistemico si: ausencia, estatuto, traduccion y temporalidad.
//
// Este modulo vive fuera de las dos a proposito. Meterlo dentro de una le
// regalaria autoridad accidental sobre la otra.
//
// AUTORIDAD
// El vocabulario, los titulos y los avisos son copia literal del canon fijado en
// `state/cubierta_ui/CONTRATO_PEDAGOGICO.md` y `state/cubierta_ui/render.mjs`
// (rama agent/cubierta-not-recorded-preview, 1f80c84). No se mejoran, no se
// abrevian y no se traducen otra vez: se reproducen.
//
// Sin builtins de Node: lo importan igual el servidor y el navegador.

/** Version del contrato que esta superficie declara implementar. */
export const CONTRATO_VERSION = "cubierta-epistemico-v1";

/**
 * Umbral canonico de `observed`, tomado literalmente del contrato:
 * "El agente miro el sistema directamente y hay al menos dos referencias de
 * evidencia." Una sola lectura directa NO alcanza `observed`.
 */
export const REFERENCIAS_MINIMAS_OBSERVED = 2;

export const AVISO_AUSENCIA_ESTRUCTURAL =
  "Este campo no fue registrado. La ausencia se conserva y no se interpreta como desconocimiento declarado.";

export const SIN_MARCA_TEMPORAL = "Sin marca temporal en el registro.";

export const AVISO_TURNO = "El turno termino. Esto no significa que la orden se ejecutara.";

export const AVISO_EVIDENCIA_INSUFICIENTE =
  "Lectura directa con una sola referencia de evidencia. El vocabulario exige dos para "
  + "`observed`, asi que el estatuto no se afirma en vez de rebajarse a otro valor.";

/**
 * Los siete estatutos epistemicos. Mapa CERRADO: un valor no listado no se deja
 * pasar en crudo, se traduce a un aviso de vocabulario no reconocido.
 *
 * Las claves van en ingles porque son las del canon; los titulos y detalles son
 * los del contrato, literales.
 */
export const EPISTEMICO = Object.freeze({
  observed: {
    titulo: "Observado",
    detalle: "El agente miro el sistema directamente y hay al menos dos referencias de evidencia.",
  },
  calculated: {
    titulo: "Calculado",
    detalle: "Se obtuvo mediante una operacion reproducible sobre datos.",
  },
  inferred: {
    titulo: "Inferido",
    detalle: "El agente razono con el contexto disponible; no observo directamente el sistema.",
  },
  evaluated: {
    titulo: "Evaluado",
    detalle: "Es una valoracion, no un hecho observado.",
  },
  proposed: {
    titulo: "Propuesto",
    detalle: "Es una propuesta del agente, no una comprobacion.",
  },
  unknown: {
    titulo: "Desconocido",
    detalle: "El agente declaro explicitamente que no conoce el estatuto.",
  },
  not_recorded: {
    titulo: "No registrado",
    detalle: AVISO_AUSENCIA_ESTRUCTURAL,
  },
});

/**
 * Traduccion de un valor de un mapa cerrado.
 *
 * Invariante 2 del contrato: ningun enum crudo llega al lector. Un valor fuera
 * del mapa NO se deja pasar y NO se reinterpreta al vecino semantico: se marca
 * `reconocido: false` y se muestra como no interpretable, "en vez de empujar al
 * autor a mentir para pasar una guarda".
 */
export function traducir(valor, mapa, { nombreMapa = "vocabulario" } = {}) {
  if (valor === null || valor === undefined) {
    return {
      clave: null,
      titulo: EPISTEMICO.not_recorded.titulo,
      detalle: AVISO_AUSENCIA_ESTRUCTURAL,
      reconocido: true,
      ausente: true,
    };
  }
  const entrada = Object.prototype.hasOwnProperty.call(mapa, valor) ? mapa[valor] : null;
  if (!entrada) {
    return {
      clave: valor,
      titulo: "No interpretable",
      detalle: `El ${nombreMapa} no reconoce este valor. No se traduce al mas parecido.`,
      reconocido: false,
      ausente: false,
    };
  }
  return { clave: valor, titulo: entrada.titulo, detalle: entrada.detalle, reconocido: true, ausente: false };
}

/**
 * Estatuto epistemico de un valor, a partir de su naturaleza y de sus
 * referencias de evidencia.
 *
 * `referencias` es la lista de pruebas concretas que sostienen el valor: una
 * lectura de sonda, una muestra del almacen, una entrada de ledger. Se cuentan,
 * no se ponderan.
 *
 * Naturalezas admitidas:
 *   directa    -> el sistema se miro. Exige el umbral de dos referencias.
 *   derivada   -> operacion reproducible sobre datos -> calculated
 *   razonada   -> se razono con contexto, sin mirar -> inferred
 *   valoracion -> juicio, no hecho -> evaluated
 *   propuesta  -> propuesta, no comprobacion -> proposed
 */
export function estatuto({
  ausente = false,
  desconocidoDeclarado = false,
  naturaleza = "directa",
  referencias = [],
} = {}) {
  if (ausente) {
    return { clave: "not_recorded", referencias: [], motivo: AVISO_AUSENCIA_ESTRUCTURAL, reconocido: true };
  }
  if (desconocidoDeclarado) {
    return { clave: "unknown", referencias, motivo: EPISTEMICO.unknown.detalle, reconocido: true };
  }
  const porNaturaleza = { derivada: "calculated", razonada: "inferred", valoracion: "evaluated", propuesta: "proposed" };
  if (porNaturaleza[naturaleza]) {
    return { clave: porNaturaleza[naturaleza], referencias, motivo: null, reconocido: true };
  }
  if (naturaleza !== "directa") {
    return { clave: null, referencias, motivo: `naturaleza no reconocida: ${naturaleza}`, reconocido: false };
  }
  if (referencias.length >= REFERENCIAS_MINIMAS_OBSERVED) {
    return { clave: "observed", referencias, motivo: null, reconocido: true };
  }
  // Una sola lectura directa. No se afirma `observed` y tampoco se degrada a
  // `inferred` o `calculated`, que serian falsos: se declara el hueco.
  return { clave: null, referencias, motivo: AVISO_EVIDENCIA_INSUFICIENTE, reconocido: false };
}

/**
 * Presenta un estatuto al lector. Nunca devuelve la clave cruda como texto
 * visible: el titulo es lo que se pinta y el detalle es su explicacion.
 */
export function presentarEstatuto(est) {
  if (!est) return traducir(null, EPISTEMICO, { nombreMapa: "vocabulario epistemico" });
  if (!est.reconocido) {
    return {
      clave: est.clave,
      titulo: est.clave ? "No interpretable" : "Sin estatuto afirmado",
      detalle: est.motivo || "El vocabulario epistemico no reconoce este valor.",
      reconocido: false,
      ausente: false,
      referencias: est.referencias || [],
    };
  }
  const t = traducir(est.clave, EPISTEMICO, { nombreMapa: "vocabulario epistemico" });
  return { ...t, referencias: est.referencias || [] };
}

/**
 * Marca temporal: se muestra o su ausencia se declara (invariante 4).
 * Nunca se pinta un valor medido sin decir de cuando es.
 */
export function sello(tsIso, ahoraMs = Date.now()) {
  const t = Date.parse(tsIso || "");
  if (!Number.isFinite(t)) return { texto: SIN_MARCA_TEMPORAL, edad_ms: null, ts: null };
  const edad = ahoraMs - t;
  return { texto: `medido hace ${Math.round(edad / 1000)}s`, edad_ms: edad, ts: tsIso };
}

/**
 * Version de contrato de un registro ajeno. La ausencia NO se convierte en v1
 * ni v2, y no autoriza a inferir que algo sea historico (invariante 5).
 */
export function versionDeContrato(registro) {
  const v = registro?.contract_version ?? registro?.schema ?? null;
  return { valor: v ?? null, permite_inferir_historico: false };
}
