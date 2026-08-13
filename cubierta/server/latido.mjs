// El Vigia: presencia con los dos ejes separados, y contradicciones.
//
// Encargo: docs/architecture/ENCARGO_PULSO_REAL.md (secciones 3 y 4).
//
// ESTO NO ES LA MARINA. No bloquea, no revoca, no congela nada. Su trabajo es
// que el Capitan SEPA, no que la tripulacion obedezca. Un nakama puede tomar un
// camino que nadie habia previsto; eso es tripulacion, no averia.
//
// Lo que este modulo separa y antes mezclaba:
//   DECLARADO  = lo que el agente dice de si mismo en su POST
//   OBSERVADO  = lo que el barco midio por su cuenta, por eje
// El veredicto sale del cruce, no de una sola de las dos fuentes.
//
// NO-REGRESION (encargo, seccion 9): ningun veredicto `observado` puede nacer
// solo de POST /api/senal. Este fichero no lee `senal.vitales` en ninguna linea.

import { OBSERVADO, NO_OBSERVABLE, EJES, FRESCURA_SONDA_PS_MS } from "./sondas.mjs";

export const EN_PUERTO = "en_puerto";
export const A_BORDO = "a_bordo";
export const DECLARADO_V = "declarado";
export const MUDO = "mudo";
export const DISCORDANTE = "discordante";
export const NO_OBSERVABLE_V = "no_observable";
export const AMARRADO = "amarrado";
export const FANTASMA = "fantasma";
export const A_LA_DERIVA = "a_la_deriva";

export const LATIDO_FRESCO_MS = 2 * 60 * 1000;
export const VENTANA_CORROBORACION_MS = 2 * 60 * 1000;

/** Veredictos que hacen sonar la campana del puente. `no_observable` JAMAS. */
export const SUENAN = Object.freeze([MUDO, FANTASMA, A_LA_DERIVA, DISCORDANTE]);

// ---------------------------------------------------------------------------
// Seccion 4 — contrato de `discordante`
// ---------------------------------------------------------------------------

/**
 * REGLA QUE GOBIERNA TODA ESTA SECCION (encargo 4.1):
 *
 *   La ausencia de medicion nunca es contradiccion.
 *
 * Un `discordante` solo nace cuando un instrumento ALCANZABLE afirma lo
 * contrario de lo declarado. Si el instrumento no responde, el eje queda
 * `no_observable` y no se emite nada. Sin esta regla, el sistema se convierte en
 * una maquina de falsas alarmas la primera vez que se cae una sonda.
 *
 * PRECONDICION COMUN A D1, D2 y D3 (refinamiento v0.2 del encargo):
 * las tres exigen LATIDO FRESCO. Sin ella, un agente que termina limpiamente y
 * cierra su proceso quedaria marcado `discordante` para siempre -- exactamente
 * la falsa alarma que 4.1 prohibe. Una contradiccion solo tiene sentido contra
 * una afirmacion viva.
 */
export function detectarContradicciones({
  senal,
  ejes,
  latidoFresco,
  almacen = null,
  nakamaId = null,
  ahoraMs = Date.now(),
  ventanaCorroboracionMs = VENTANA_CORROBORACION_MS,
} = {}) {
  if (!senal || !latidoFresco) return [];
  // Segunda guarda de la precondicion comun: un agente que declara cierre limpio
  // y apaga su proceso esta comportandose bien. Acusarlo durante los dos minutos
  // que su ultimo latido sigue fresco seria la falsa alarma de 4.1 por la puerta
  // de atras. Solo se contradice una afirmacion de trabajo EN CURSO.
  const cerroLimpio = senal.estado === "termino" || senal.estado === "disponible";
  if (cerroLimpio) return [];
  const fuera = [];

  // D1 — proceso declarado inexistente.
  // No cuenta EPERM (el eje sale `no_observable`, no `observado`).
  const liveness = ejes.liveness;
  if (liveness?.estado === OBSERVADO && liveness.valor === false) {
    fuera.push({
      codigo: "D1",
      titulo: "proceso declarado inexistente",
      declarado: `pid ${senal.pid} trabajando`,
      observado: liveness.motivo,
    });
  }

  // D2 — residencia declarada incompatible con la observacion.
  // Guarda antirruido: la muestra de /api/ps debe ser fresca y POSTERIOR al
  // latido. Un modelo desalojado entre el trabajo y la comprobacion es una
  // carrera, no una mentira.
  const residencia = ejes.residencia;
  if (residencia?.estado === OBSERVADO && residencia.valor === null) {
    const muestraFresca = residencia.edad_ms !== null && residencia.edad_ms <= FRESCURA_SONDA_PS_MS;
    const tsLatido = Date.parse(senal.ts);
    const tsMuestra = residencia.edad_ms !== null ? ahoraMs - residencia.edad_ms : null;
    const posterior = tsMuestra !== null && Number.isFinite(tsLatido) && tsMuestra >= tsLatido;
    if (muestraFresca && posterior) {
      fuera.push({
        codigo: "D2",
        titulo: "residencia declarada incompatible con la observacion",
        declarado: `actor ${senal.actor}`,
        observado: residencia.motivo,
      });
    }
  }

  // D3 — produccion declarada sin ninguna corroboracion.
  // Exige que LAS TRES sondas esten alcanzables. Si alguna no lo esta, no se
  // evalua: no hay contradiccion posible contra un instrumento mudo.
  const declaraProduccion = Number(senal.vitales?.tokens_por_s) > 0;
  if (declaraProduccion) {
    const alcanzables = ["residencia", "escritura"].every((e) => ejes[e]?.estado !== NO_OBSERVABLE)
      && Boolean(almacen);
    if (alcanzables) {
      const sinResidente = ejes.residencia.estado === OBSERVADO && ejes.residencia.valor === null;
      const sinMuestra = !almacen.corrobora(nakamaId, ventanaCorroboracionMs, ahoraMs);
      const sinEscritura = ejes.escritura.estado !== OBSERVADO;
      if (sinResidente && sinMuestra && sinEscritura) {
        fuera.push({
          codigo: "D3",
          titulo: "produccion declarada sin ninguna corroboracion",
          declarado: `${senal.vitales.tokens_por_s} tok/s`,
          observado: "sin modelo residente, sin muestra medida y sin eventos nuevos en la bitacora",
        });
      }
    }
  }

  return fuera.map((c) => ({
    ...c,
    nakama: nakamaId,
    actor: senal.actor || null,
    ts: senal.ts,
    // Gramatica del canon: lo sentencia el Capitan. Ninguna consecuencia
    // automatica, igual que con los desvios de constitucion.
    veredicto: "pendiente",
    nivel: null,
    consecuencia_automatica: null,
  }));
}

// ---------------------------------------------------------------------------
// Seccion 3 — presencia
// ---------------------------------------------------------------------------

function hayObservacionUtil(ejes) {
  // liveness `observado` con valor false es una observacion de AUSENCIA: no
  // cuenta como senal de que el personaje este a bordo.
  return EJES.some((e) => ejes[e]?.estado === OBSERVADO && ejes[e]?.valor !== false && ejes[e]?.valor !== null)
    || ejes.liveness?.estado === OBSERVADO && ejes.liveness?.valor === true;
}

/**
 * Deriva el veredicto por el orden de la seccion 3.2 del encargo. El primero
 * que se cumple gana. `mudo` va ANTES que `a_bordo` a proposito: un proceso vivo
 * que dejo de reportar es mas urgente que la ausencia de reporte a secas.
 */
export function evaluarPresencia({
  senal = null,
  ejes,
  contradicciones = [],
  ahoraMs = Date.now(),
  ventanaMs = 15 * 60 * 1000,
} = {}) {
  const declarado = senal
    ? {
        latido: senal.ts,
        edad_ms: Number.isFinite(Date.parse(senal.ts)) ? ahoraMs - Date.parse(senal.ts) : null,
        estado: senal.estado || null,
        actor: senal.actor || null,
      }
    : { latido: null, edad_ms: null, estado: null, actor: null };

  const salida = (veredicto, motivo) => ({ declarado, observado: ejes, veredicto, motivo, contradicciones });

  if (!senal) {
    return salida(EN_PUERTO, "ningun actor ha emitido senal por este personaje");
  }
  if (contradicciones.length) {
    const c = contradicciones[0];
    return salida(DISCORDANTE, `${c.codigo}: declara "${c.declarado}" y se observa que ${c.observado}`);
  }

  const fresco = declarado.edad_ms !== null && declarado.edad_ms <= LATIDO_FRESCO_MS;
  const vivo = ejes.liveness?.estado === OBSERVADO && ejes.liveness?.valor === true;

  if (!fresco && vivo) {
    return salida(MUDO, `su proceso sigue vivo y lleva ${segundos(declarado.edad_ms)} sin reportar: vivo pero callado`);
  }
  if (fresco && hayObservacionUtil(ejes)) {
    return salida(A_BORDO, "latido fresco y al menos un eje observado: concuerda");
  }
  if (fresco) {
    return salida(DECLARADO_V, "latido fresco pero ningun eje observado: creible, no verificado");
  }

  const cerroLimpio = declarado.estado === "termino" || declarado.estado === "disponible";
  if (cerroLimpio && declarado.edad_ms <= ventanaMs) {
    return salida(AMARRADO, "cerro su tarea antes de callarse");
  }
  if (EJES.every((e) => ejes[e]?.estado === NO_OBSERVABLE)) {
    return salida(
      NO_OBSERVABLE_V,
      "sin latido y fuera del alcance de todos los instrumentos: no es un fantasma, es que la sonda no llega",
    );
  }
  if (declarado.edad_ms > ventanaMs) {
    return salida(A_LA_DERIVA, `sin latido desde hace ${Math.round(declarado.edad_ms / 60000)} min, mas que la ventana`);
  }
  return salida(
    FANTASMA,
    `declaro "${declarado.estado || "actividad"}" y lleva ${segundos(declarado.edad_ms)} sin latir; sigue dibujado pero no esta verificado`,
  );
}

function segundos(ms) {
  return `${Math.round((ms || 0) / 1000)}s`;
}

// ---------------------------------------------------------------------------
// Desvios de constitucion (sin cambios de contrato respecto al corte anterior)
// ---------------------------------------------------------------------------

export function detectarDesvios({ senal, constitucion, nakama }) {
  if (!senal) return [];
  const permitidos = new Set(constitucion.recursos || []);
  const desvios = [];

  for (const recurso of senal.recursos || []) {
    if (!permitidos.has(recurso)) {
      desvios.push({
        clase: "recurso_fuera_de_constitucion",
        detalle: `${nakama.nombre} declaro necesitar "${recurso}", que no figura en su constitucion`,
      });
    }
  }
  if (senal.sala && !(senal.recursos || []).length) {
    desvios.push({
      clase: "sala_sin_recurso_declarado",
      detalle: `${nakama.nombre} dice estar en "${senal.sala}" sin declarar que recurso fue a buscar`,
    });
  }
  if (senal.egreso) {
    desvios.push({
      clase: "egreso_declarado",
      detalle: `salida hacia ${senal.egreso}; util saber a donde va el barco, no motivo de nada por si solo`,
    });
  }

  return desvios.map((d) => ({
    ...d,
    nakama: nakama.id,
    actor: senal.actor || null,
    ts: senal.ts,
    veredicto: "pendiente",
    nivel: null,
    consecuencia_automatica: null,
  }));
}

// ---------------------------------------------------------------------------
// El vigia completo
// ---------------------------------------------------------------------------

export function vigia({
  nakamas,
  senales = [],
  constitucionDe,
  observarDe,
  ahoraMs = Date.now(),
  ventanaMs = 15 * 60 * 1000,
  almacen = null,
}) {
  const ultimaPorNakama = new Map();
  for (const s of senales) {
    if (!s.nakama) continue;
    const previa = ultimaPorNakama.get(s.nakama);
    if (!previa || Date.parse(s.ts) >= Date.parse(previa.ts)) ultimaPorNakama.set(s.nakama, s);
  }

  const filas = nakamas.map((n) => {
    const senal = ultimaPorNakama.get(n.id) || null;
    const ejes = observarDe(n.id, senal);
    const edad = senal && Number.isFinite(Date.parse(senal.ts)) ? ahoraMs - Date.parse(senal.ts) : null;
    const latidoFresco = edad !== null && edad <= LATIDO_FRESCO_MS;
    const contradicciones = detectarContradicciones({
      senal, ejes, latidoFresco, almacen, nakamaId: n.id, ahoraMs,
    });
    const presencia = evaluarPresencia({ senal, ejes, contradicciones, ahoraMs, ventanaMs });
    const desvios = detectarDesvios({ senal, constitucion: constitucionDe(n.id), nakama: n });
    return {
      nakama: n.id,
      nombre: n.nombre,
      actor: senal?.actor || null,
      presencia: presencia.veredicto,
      declarado: presencia.declarado,
      observado: presencia.observado,
      motivo: presencia.motivo,
      contradicciones,
      desvios,
      ultima_tarea: senal?.tarea || null,
      latido: presencia.declarado.latido,
      edad_ms: presencia.declarado.edad_ms,
    };
  });

  // `no_observable` nunca entra aqui: una rutina en la nube no es un fantasma,
  // y hacerla sonar seria la alerta sin target que prohibe la ley de la casa.
  const campana = filas
    .filter((f) => SUENAN.includes(f.presencia) || f.desvios.length)
    .map((f) => ({
      nakama: f.nakama,
      nombre: f.nombre,
      clase: f.contradicciones.length
        ? `contradiccion ${f.contradicciones[0].codigo}`
        : (f.desvios.length && !SUENAN.includes(f.presencia) ? "desvio" : f.presencia),
      motivo: f.contradicciones.length
        ? f.motivo
        : (f.desvios.length ? f.desvios.map((d) => d.detalle).join(" | ") : f.motivo),
      pendiente_de: "veredicto del Capitan (Concilio): fertil o decae",
    }));

  return {
    filas,
    campana,
    nota: "El vigia ve y avisa. No detiene, no revoca y no clasifica solo: el veredicto de cada desvio o contradiccion es del Capitan.",
  };
}
