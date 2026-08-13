// El Vigia: presencia verificada y desvios.
//
// ESTO NO ES LA MARINA. No bloquea, no revoca, no congela nada. Su trabajo es
// que el Capitan SEPA, no que la tripulacion obedezca. Un nakama puede tomar un
// camino que nadie habia previsto; eso es tripulacion, no averia.
//
// La distincion que hace falta y que la pantalla sola no da:
//   lo que SE VE  = un sprite en el barco
//   lo que SE SABE = que hay un proceso vivo detras, con latido reciente
// Un sprite quieto no prueba nada. Por eso un personaje puede seguir en el mapa
// y estar declarado FANTASMA: se le ve, no se le verifica.
//
// El desvio se trata con la gramatica del canon (TEATRO.md, El glitch): se nombra,
// se gradua, y lo sentencia el Concilio -- el Capitan. La pregunta no es "ha roto
// una regla" sino "a quien sirve este error: a tu disfrute o a su propia inercia".
// Hasta que haya veredicto, el desvio queda ANOTADO y PENDIENTE. Nunca ejecutado.

export const EN_PUERTO = "en_puerto";     // nunca ha emitido senal: no ha embarcado, no ha desertado
export const A_BORDO = "a_bordo";         // latido fresco
export const AMARRADO = "amarrado";       // cerro su tarea y callo: silencio limpio
export const FANTASMA = "fantasma";       // dijo que trabajaba y dejo de latir: se le ve, no se le verifica
export const A_LA_DERIVA = "a_la_deriva"; // silencio mas largo que la ventana, sin cierre

export const LATIDO_FRESCO_MS = 2 * 60 * 1000;

/**
 * Presencia de un personaje a partir de su ultima senal.
 * `ultima` es la senal mas reciente de ese nakama, o null si no hay ninguna.
 */
export function presenciaDe(ultima, { ahoraMs = Date.now(), ventanaMs = 15 * 60 * 1000 } = {}) {
  if (!ultima) {
    return { estado: EN_PUERTO, latido: null, edad_ms: null, motivo: "ningun actor ha emitido senal por este personaje" };
  }
  const t = Date.parse(ultima.ts);
  const edad = Number.isFinite(t) ? ahoraMs - t : null;
  if (edad === null) {
    return { estado: A_LA_DERIVA, latido: ultima.ts, edad_ms: null, motivo: "la ultima senal no trae hora legible" };
  }
  const cerro = ultima.estado === "termino" || ultima.estado === "disponible";
  if (edad <= LATIDO_FRESCO_MS) {
    return { estado: A_BORDO, latido: ultima.ts, edad_ms: edad, motivo: null };
  }
  if (cerro && edad <= ventanaMs) {
    return { estado: AMARRADO, latido: ultima.ts, edad_ms: edad, motivo: "cerro su tarea antes de callarse" };
  }
  if (!cerro && edad <= ventanaMs) {
    return {
      estado: FANTASMA,
      latido: ultima.ts,
      edad_ms: edad,
      motivo: `declaro "${ultima.estado || "actividad"}" y lleva ${Math.round(edad / 1000)}s sin latir; sigue dibujado pero no esta verificado`,
    };
  }
  return {
    estado: A_LA_DERIVA,
    latido: ultima.ts,
    edad_ms: edad,
    motivo: `sin latido desde hace ${Math.round(edad / 60000)} min, mas que la ventana de observacion`,
  };
}

/**
 * Desvios: lo que una senal declara y su constitucion no contempla.
 * Se anotan. No se impiden. El veredicto es del Capitan.
 */
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
    // Gramatica del canon: veredicto (fertil / decae) + nivel Deckard. Pendiente
    // hasta que el Concilio se pronuncie. Ninguna consecuencia automatica.
    veredicto: "pendiente",
    nivel: null,
    consecuencia_automatica: null,
  }));
}

/**
 * Estado del vigia para toda la tripulacion. Devuelve tambien la campana del
 * puente: lo unico que el vigia hace por su cuenta es sonar.
 */
export function vigia({ nakamas, senales = [], constitucionDe, ahoraMs = Date.now(), ventanaMs = 15 * 60 * 1000 }) {
  const ultimaPorNakama = new Map();
  for (const s of senales) {
    if (!s.nakama) continue;
    const previa = ultimaPorNakama.get(s.nakama);
    if (!previa || Date.parse(s.ts) >= Date.parse(previa.ts)) ultimaPorNakama.set(s.nakama, s);
  }

  const filas = nakamas.map((n) => {
    const ultima = ultimaPorNakama.get(n.id) || null;
    const presencia = presenciaDe(ultima, { ahoraMs, ventanaMs });
    const desvios = detectarDesvios({ senal: ultima, constitucion: constitucionDe(n.id), nakama: n });
    return {
      nakama: n.id,
      nombre: n.nombre,
      actor: ultima?.actor || null,
      presencia: presencia.estado,
      latido: presencia.latido,
      edad_ms: presencia.edad_ms,
      motivo: presencia.motivo,
      ultima_tarea: ultima?.tarea || null,
      desvios,
    };
  });

  const campana = filas
    .filter((f) => f.presencia === FANTASMA || f.presencia === A_LA_DERIVA || f.desvios.length)
    .map((f) => ({
      nakama: f.nakama,
      nombre: f.nombre,
      motivo: f.desvios.length
        ? f.desvios.map((d) => d.detalle).join(" | ")
        : f.motivo,
      clase: f.desvios.length ? "desvio" : f.presencia,
      pendiente_de: "veredicto del Capitan (Concilio): fertil o decae",
    }));

  return {
    filas,
    campana,
    nota: "El vigia ve y avisa. No detiene, no revoca y no clasifica solo: el veredicto de cada desvio es del Capitan.",
  };
}
