// Constantes vitales y clima del barco.
//
// CONVERGENCIA EPISTEMICA
// Antes este fichero tenia DOS ejes: `tinta` (como se derivo) y `origen` (quien
// responde). La auditoria contra `state/cubierta_ui/` mostro que eso duplicaba
// un solo eje canonico: su `observed` ya significa "el agente miro el sistema
// directamente y hay al menos dos referencias de evidencia" -- es decir, el
// canon ya encierra el "quien verifico" dentro del estatuto.
//
// Ahora hay un unico eje, el del canon, con su umbral literal: una sola lectura
// directa NO alcanza `observed`. Cuando no llega, no se rebaja al vecino
// semantico: se declara el hueco.
//
// `desconocido` deja de usarse para la ausencia. El canon reserva `unknown` para
// un desconocimiento DECLARADO y tiene `not_recorded` para lo que no se
// registro. Usar uno por otro era ocupar un termino reservado.

import { estatuto, presentarEstatuto, sello, CONTRATO_VERSION } from "../../shared/epistemico.mjs";

export { CONTRATO_VERSION };

/**
 * Un vital lleva su valor, su estatuto epistemico presentado (nunca la clave
 * cruda) y su sello temporal. Sin valor no hay numero: hay ausencia declarada.
 */
function vital({ nombre, valor, unidad, est, fuente, motivo = null, ts = null, ahoraMs = Date.now() }) {
  const presentado = presentarEstatuto(est);
  return {
    nombre,
    valor: valor ?? null,
    unidad,
    estatuto: presentado,
    sello: ts ? sello(ts, ahoraMs) : null,
    fuente,
    motivo,
  };
}

function ausente(nombre, unidad, fuente, motivo) {
  return vital({ nombre, valor: null, unidad, est: estatuto({ ausente: true }), fuente, motivo });
}

/** Referencias que aporta una lectura del almacen: una por muestra en ventana. */
function referenciasDeAlmacen(lectura, campo) {
  if (!lectura || lectura.valor === null) return [];
  return Array.from({ length: lectura.n }, (_, i) => ({
    tipo: "muestra_medida",
    campo,
    indice: i,
    fuente: "hablar.mjs",
  }));
}

function deAlmacen(nombre, unidad, lectura, campo, ahoraMs) {
  if (!lectura || lectura.valor === null) {
    return ausente(nombre, unidad, "almacen medido (hablar.mjs)", lectura?.motivo || "sin muestras medidas");
  }
  const referencias = referenciasDeAlmacen(lectura, campo);
  // Una tasa es una operacion reproducible sobre datos -> `calculated`.
  // Una muestra cruda es lectura directa y se somete al umbral de dos referencias.
  const est = lectura.tipo === "tasa"
    ? estatuto({ naturaleza: "derivada", referencias })
    : estatuto({ naturaleza: "directa", referencias });
  return vital({
    nombre, valor: lectura.valor, unidad, est,
    fuente: `almacen medido (${lectura.tipo}, n=${lectura.n})`,
    ts: new Date(ahoraMs - (lectura.edad_ms || 0)).toISOString(),
    ahoraMs,
    motivo: lectura.motivo,
  });
}

function deEje(nombre, unidad, eje, extraReferencias = []) {
  if (!eje || eje.estado === "no_observable") {
    return ausente(nombre, unidad, eje?.fuente || null, eje?.motivo || "sin instrumento para este eje");
  }
  if (eje.estado === "sin_dato" || eje.valor === null || eje.valor === false) {
    return ausente(nombre, unidad, eje.fuente, eje.motivo || "la sonda responde y no hay nada que reportar");
  }
  const referencias = [{ tipo: "lectura_de_sonda", fuente: eje.fuente }, ...extraReferencias];
  return vital({
    nombre, valor: eje.valor, unidad,
    est: estatuto({ naturaleza: "directa", referencias }),
    fuente: eje.fuente,
    motivo: eje.motivo,
  });
}

/**
 * Vitales de un personaje.
 *
 * Lo que el agente afirma de si mismo NO produce un valor: se adjunta aparte,
 * como nota declarada. Antes se pintaba con el mismo aspecto que una medida y
 * esa era la mentira de fondo del tablero.
 */
export function calcularVitales({
  senal = null,
  ejes = null,
  lecturas = null,
  sueno = null,
  nakamaId = null,
  ahoraMs = Date.now(),
} = {}) {
  // Corroboracion cruzada: los ejes observados de este mismo personaje sirven
  // como segunda referencia de evidencia entre si. Es la lectura literal de
  // "al menos dos referencias" aplicada a un sujeto.
  const corroborantes = ["liveness", "residencia", "memoria", "escritura"]
    .filter((e) => ejes?.[e]?.estado === "observado" && ejes[e].valor !== null && ejes[e].valor !== false)
    .map((e) => ({ tipo: "corroboracion_de_eje", eje: e, fuente: ejes[e].fuente }));

  const cruzadas = (propio) => corroborantes.filter((c) => c.eje !== propio);

  const vitales = [
    deAlmacen("pulso", "tok/s", lecturas?.tokens_por_s, "tokens_por_s", ahoraMs),
    deAlmacen("latencia", "ms", lecturas?.latencia_ms, "latencia_ms", ahoraMs),
    deEje("residencia", "MB", ejes?.residencia, cruzadas("residencia")),
    deEje("memoria", "MB", ejes?.memoria, cruzadas("memoria")),
  ];

  const aplicaFusion = sueno && nakamaId
    && String(sueno.personaje || "").toLowerCase() === String(nakamaId).toLowerCase();
  vitales.push(aplicaFusion
    ? vital({
        nombre: "fusion",
        valor: sueno.racha,
        unidad: "ciclos seguidos",
        est: estatuto({
          naturaleza: "derivada",
          referencias: [{ tipo: "ledger", fuente: "sleep_ledger.jsonl" }],
        }),
        fuente: "sleep_ledger.jsonl",
        ts: sueno.ultimo_ciclo || null,
        ahoraMs,
      })
    : ausente("fusion", "ciclos seguidos", "sleep_ledger.jsonl",
        "este personaje no aparece en el ultimo ciclo de sueno"));

  return {
    contract_version: CONTRATO_VERSION,
    vitales,
    // Lo declarado viaja aparte y etiquetado, nunca como valor.
    declarado: senal?.vitales
      ? { ...senal.vitales, aviso: "Cifras declaradas por el actor. Ningun instrumento las ha comprobado." }
      : null,
  };
}

function media(numeros) {
  const validos = numeros.filter((n) => Number.isFinite(n));
  if (!validos.length) return null;
  return validos.reduce((a, b) => a + b, 0) / validos.length;
}

/**
 * Clima del barco. No es animo: cuatro ejes operativos desplegables hasta sus
 * hechos. Sin con que calcularlos, valen `not_recorded` y lo dicen.
 */
export function calcularClima({ fuentes = [], encarnaciones = [], recados = [], nakamas = [] } = {}) {
  const fuentesOk = fuentes.filter((f) => f.estado === "ok");
  const senales = encarnaciones.map((e) => e.senal).filter(Boolean);

  const eje = (valor, unidad, base, naturaleza = "derivada") => ({
    valor,
    unidad,
    base,
    estatuto: presentarEstatuto(
      valor === null
        ? estatuto({ ausente: true })
        : estatuto({ naturaleza, referencias: [{ tipo: "agregado", fuente: base }] }),
    ),
  });

  const disponibilidad = nakamas.length
    ? eje(Math.round((encarnaciones.length / nakamas.length) * 100), "%",
        `${encarnaciones.length} de ${nakamas.length} personajes tienen actor encarnandolos`)
    : eje(null, "%", "no hay tripulacion definida");

  const cargaMedia = media(senales.map((s) => s.vitales?.contexto_pct));
  const carga = cargaMedia === null
    ? eje(null, "%", "ninguna senal reporta carga de contexto")
    : eje(Math.round(cargaMedia), "%", `media de ${senales.length} senales DECLARADAS por sus actores`, "razonada");

  const errores = senales.reduce((a, s) => a + (s.vitales?.errores || 0), 0);
  const integridad = fuentes.length === 0
    ? eje(null, "%", "no hay fuentes configuradas")
    : eje(Math.max(0, Math.round((fuentesOk.length / fuentes.length) * 100) - errores * 5), "%",
        `${fuentesOk.length}/${fuentes.length} fuentes responden; ${errores} errores declarados en ventana`);

  const bloqueados = recados.filter((r) => r.estado === "bloqueado" || r.estado === "esperando_llave");
  const coordinacion = recados.length === 0
    ? eje(null, "n", "no hay recados en curso")
    : eje(bloqueados.length, "esperando al Capitan", `${bloqueados.length} de ${recados.length} recados detenidos`);

  const ejes = { disponibilidad, carga, integridad, coordinacion };
  const conocidos = Object.values(ejes).filter((e) => e.valor !== null);

  return {
    contract_version: CONTRATO_VERSION,
    ejes,
    resumen: conocidos.length === 0
      ? { estado: "desconocido", motivo: "ninguna fuente responde: el barco no puede decir como esta" }
      : { estado: describirClima(ejes), motivo: `calculado sobre ${conocidos.length} de 4 ejes; el resto sin registrar` },
    nota: "Clima no es animo. Es la sintesis de cuatro ejes operativos, cada uno desplegable hasta sus hechos.",
  };
}

function describirClima({ disponibilidad, integridad, coordinacion }) {
  if (integridad.valor !== null && integridad.valor < 50) return "mar gruesa";
  if (coordinacion.valor) return "al pairo, esperando al Capitan";
  if (disponibilidad.valor === 0) return "en calma, sin nadie encarnado";
  if (disponibilidad.valor !== null && disponibilidad.valor > 0) return "en travesia";
  return "indeterminado";
}
