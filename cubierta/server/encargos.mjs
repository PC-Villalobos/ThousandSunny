// El Encargo: la unidad de trabajo que sobrevive al modelo que lo ejecuta.
//
// POR QUE EXISTE
// La Cubierta ya sabia mover a un nakama cuando un agente declaraba actividad
// (`recado`), pero un recado es efimero: vive en memoria, no lleva contexto
// autorizado, no lleva presupuesto y muere con el proceso. Sirve para VER el
// barco, no para DIRIGIR trabajo.
//
// Un encargo es lo otro: el Capitan declara que quiere resolver, con que
// contexto, con cuanta autonomia, contra que conexion y con cuanto presupuesto.
// La continuidad pertenece al encargo, no al proveedor: cambiar de modelo no
// reconstruye la conversacion, la hereda.
//
// LAS SEIS REGLAS DURAS, implementadas aqui y no solo escritas
//
//   1. Lo que se ve es lo que se manda. `dossier()` es la UNICA construccion del
//      payload; `ejecutar()` no puede armar otro por su cuenta.
//   2. Lo clinico no entra ni al registro. Una fuente `clinico_protegido` pierde
//      su contenido EN LA ADMISION: el encargo nunca llega a guardarlo. Lo unico
//      que queda es un identificador opaco. Es la Camara de Chopper aplicada al
//      dato en reposo, no solo al NPC que camina.
//   3. Autonomia denegada por defecto. Una accion no declarada no se ejecuta y
//      queda anotada como desvio para que el Capitan la sentencie.
//   4. El presupuesto corta ANTES de la llamada. Un limite que se comprueba
//      despues de gastar no es un limite, es un recibo.
//   5. Sin actor alcanzable el encargo NO avanza. No hay resultado de relleno.
//      Se anota por que no se pudo, y ahi se queda.
//   6. Todo se reconstruye del diario. El estado vivo es una proyeccion de una
//      linea de eventos append-only: cerrar la Cubierta y abrirla no pierde nada.
//   7. Abrir y cerrar se registran en la Bitacora. `RUTINAS.md`: «toda rutina
//      cierra en la Bitacora (spine); si no escribe al spine, no ha cerrado». El
//      recibo se guarda en el encargo, positivo o negativo, para que despues se
//      pueda responder de si cerro. Si la autoridad no escucha, el encargo abre y
//      cierra igual: la ausencia de la bitacora no invalida el trabajo, pero
//      tampoco se disimula. La costura vive en `bitacora_encargo.mjs`.

export const ABIERTO = "abierto";
export const EN_CURSO = "en_curso";
export const ESPERANDO_LLAVE = "esperando_llave";
export const ESPERANDO_REVISION = "esperando_revision";
export const ACEPTADO = "aceptado";
export const DEVUELTO = "devuelto";
export const AGOTADO = "agotado";
export const BLOQUEADO = "bloqueado";

/** Clases de fuente. Cerrado: una clase no listada se trata como la mas estricta. */
export const CLASES_FUENTE = Object.freeze(["publico", "interno", "clinico_protegido"]);

/**
 * Acciones que un encargo puede autorizar. Cerrado a proposito: si maniana hace
 * falta una nueva, se aniade aqui y se decide su regimen, no se cuela por texto
 * libre desde el cuerpo de una peticion.
 */
export const ACCIONES = Object.freeze([
  "leer",            // leer las fuentes admitidas del dossier
  "redactar",        // producir texto que el Capitan revisara
  "ejecutar_codigo", // correr algo en la maquina
  "escribir_disco",  // dejar ficheros
  "enviar_fuera",    // mandar algo a un tercero (correo, API, publicacion)
]);

/** Acciones que nunca se conceden sin decision explicita del Capitan por encargo. */
const ACCIONES_GRAVES = Object.freeze(["ejecutar_codigo", "escribir_disco", "enviar_fuera"]);

const PRESUPUESTO_POR_DEFECTO = Object.freeze({
  llamadas_max: 12,
  tokens_max: 120000,
  coste_max_eur: 2,
});

let contador = 0;
function nuevoId(prefijo) {
  contador += 1;
  return `${prefijo}-${Date.now().toString(36)}-${contador}`;
}

/**
 * Identificador opaco de una fuente clinica. Determinista sobre el id declarado
 * para que el mismo material se reconozca entre sesiones, y sin ningun rastro
 * del contenido: no es un hash del texto, es una etiqueta de la referencia.
 */
export function opacoDe(idFuente) {
  let h = 5381;
  const s = String(idFuente);
  for (let i = 0; i < s.length; i += 1) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return `opaco:${h.toString(36)}`;
}

function claseValida(clase) {
  return CLASES_FUENTE.includes(clase) ? clase : "clinico_protegido";
}

/**
 * Admision de una fuente. Aqui es donde lo clinico pierde el cuerpo.
 *
 * No se guarda el contenido y luego se filtra al enseniarlo: se descarta en la
 * puerta. Un filtro de salida es una promesa; un registro que nunca tuvo el dato
 * es una propiedad.
 */
export function admitirFuente(bruta = {}) {
  const clase = claseValida(bruta.clase || "interno");
  const base = {
    id: bruta.id || nuevoId("fuente"),
    titulo: String(bruta.titulo || bruta.id || "sin titulo"),
    clase,
    ref: bruta.ref || null,
    admitida: new Date().toISOString(),
  };
  if (clase === "clinico_protegido") {
    return {
      ...base,
      contenido: null,
      opaco: opacoDe(base.id),
      motivo_sin_contenido:
        "material clinico: el contenido no se admite en el encargo. Solo cruza un identificador opaco, y solo con llave del Capitan.",
    };
  }
  const contenido = bruta.contenido == null ? null : String(bruta.contenido);
  return { ...base, contenido, opaco: null, motivo_sin_contenido: contenido === null ? "la fuente se declaro sin contenido" : null };
}

function normalizarAutonomia(cruda = {}) {
  const pedidas = Array.isArray(cruda.acciones) ? cruda.acciones : [];
  const acciones = pedidas.filter((a) => ACCIONES.includes(a));
  const rechazadas = pedidas.filter((a) => !ACCIONES.includes(a));
  return {
    acciones,
    acciones_no_reconocidas: rechazadas,
    recursos: Array.isArray(cruda.recursos) ? cruda.recursos.slice() : [],
    graves_concedidas: acciones.filter((a) => ACCIONES_GRAVES.includes(a)),
  };
}

function normalizarConexion(cruda = {}) {
  return {
    proveedor: cruda.proveedor || "ninguno",
    modelo: cruda.modelo || null,
    presupuesto: {
      llamadas_max: numeroPositivo(cruda.presupuesto?.llamadas_max, PRESUPUESTO_POR_DEFECTO.llamadas_max),
      tokens_max: numeroPositivo(cruda.presupuesto?.tokens_max, PRESUPUESTO_POR_DEFECTO.tokens_max),
      coste_max_eur: numeroPositivo(cruda.presupuesto?.coste_max_eur, PRESUPUESTO_POR_DEFECTO.coste_max_eur),
    },
  };
}

function numeroPositivo(v, porDefecto) {
  return Number.isFinite(v) && v > 0 ? v : porDefecto;
}

/**
 * Construye un encargo. No lo ejecuta y no lo persiste: eso es del Registro.
 */
export function crearEncargo(cruda = {}) {
  const objetivo = String(cruda.objetivo || "").trim();
  if (!objetivo) throw new Error("un encargo sin objetivo no es un encargo: falta 'objetivo'");
  const nakama = cruda.responsable?.nakama || cruda.nakama || null;
  if (!nakama) throw new Error("falta 'responsable.nakama': todo encargo tiene un responsable en el barco");

  const ahora = new Date().toISOString();
  const fuentes = (Array.isArray(cruda.contexto?.fuentes) ? cruda.contexto.fuentes : []).map(admitirFuente);

  return {
    id: cruda.id || nuevoId("encargo"),
    creado: ahora,
    actualizado: ahora,
    objetivo,
    resultado_esperado: String(cruda.resultado_esperado || "").trim() || null,
    responsable: {
      nakama,
      actor_preferido: cruda.responsable?.actor_preferido || null,
    },
    contexto: { fuentes },
    autonomia: normalizarAutonomia(cruda.autonomia),
    conexion: normalizarConexion(cruda.conexion),
    consumo: { llamadas: 0, tokens: 0, coste_eur: 0, errores: 0 },
    presupuesto_agotado: false,
    continuidad: [],
    costuras: [],   // cada cambio de conexion, con la fecha y el turno en que ocurrio
    desvios: [],    // acciones pedidas y no autorizadas, pendientes de sentencia
    intentos: [],   // llamadas que no llegaron a producir resultado, con su motivo
    revisiones: [],
    // Recibos de cierre en la Bitacora. Un recibo negativo tambien se guarda: dice
    // que ese momento existe en el diario y no en la autoridad, y eso es un dato.
    bitacora: [],
    resultado_aceptado: null,
    estado: ABIERTO,
    motivo: null,
  };
}

/**
 * EL DOSSIER: exactamente lo que se le entrega al modelo. Ni un campo mas.
 *
 * Es la unica construccion del payload que existe en este modulo. El Capitan lo
 * ve antes de ejecutar y `ejecutar()` manda esto mismo, no una version propia.
 * Que ambas cosas sean la misma funcion es la garantia; que lo sean sigue siendo
 * comprobable por prueba.
 */
export function dossier(encargo) {
  const incluidas = [];
  const omitidas = [];
  for (const f of encargo.contexto.fuentes) {
    if (f.clase === "clinico_protegido") {
      omitidas.push({ id: f.id, titulo: f.titulo, clase: f.clase, opaco: f.opaco, motivo: f.motivo_sin_contenido });
      continue;
    }
    if (f.contenido === null) {
      omitidas.push({ id: f.id, titulo: f.titulo, clase: f.clase, opaco: null, motivo: f.motivo_sin_contenido });
      continue;
    }
    incluidas.push({ id: f.id, titulo: f.titulo, clase: f.clase, ref: f.ref, contenido: f.contenido });
  }
  return {
    encargo: encargo.id,
    objetivo: encargo.objetivo,
    resultado_esperado: encargo.resultado_esperado,
    responsable: encargo.responsable.nakama,
    autonomia: {
      acciones: encargo.autonomia.acciones.slice(),
      recursos: encargo.autonomia.recursos.slice(),
    },
    fuentes: incluidas,
    omitidas,
    continuidad: encargo.continuidad.map((t) => ({ papel: t.papel, texto: t.texto })),
    sello: {
      fuentes_incluidas: incluidas.length,
      fuentes_omitidas: omitidas.length,
      turnos_heredados: encargo.continuidad.length,
      // La procedencia por turno NO viaja al modelo, pero se cuenta aqui para
      // que el Capitan vea de un vistazo si esta continuidad es de un solo actor
      // o de varios.
      actores_en_continuidad: [...new Set(encargo.continuidad.map((t) => t.actor).filter(Boolean))],
    },
  };
}

/**
 * Autorizacion de una accion. Denegada por defecto.
 * Devuelve { ok, motivo } y, cuando deniega, deja el desvio anotado.
 */
export function autorizar(encargo, accion) {
  if (!ACCIONES.includes(accion)) {
    const desvio = anotarDesvio(encargo, accion, `accion desconocida: "${accion}" no esta en el vocabulario cerrado`);
    return { ok: false, motivo: desvio.motivo };
  }
  if (!encargo.autonomia.acciones.includes(accion)) {
    const desvio = anotarDesvio(encargo, accion, `"${accion}" no se concedio en este encargo`);
    return { ok: false, motivo: desvio.motivo };
  }
  return { ok: true, motivo: null };
}

function anotarDesvio(encargo, accion, motivo) {
  // `n` es la posicion, 1-based, y no se reordena nunca: es lo que da al desvio una
  // identidad estable para la clave de idempotencia y para la sentencia posterior.
  // `registrado` arranca en false porque anotar es sincrono y cerrar en el spine no:
  // el Registro vacia los pendientes en su siguiente momento asincrono.
  const desvio = {
    n: encargo.desvios.length + 1,
    ts: new Date().toISOString(),
    accion,
    motivo,
    veredicto: "pendiente",
    nivel: null,
    nota: null,
    sentenciado: null,
    registrado: false,
  };
  encargo.desvios.push(desvio);
  encargo.actualizado = desvio.ts;
  return desvio;
}

/** Veredictos del canon (`TEATRO.md`, El glitch). No hay un tercero. */
export const VEREDICTOS = Object.freeze(["fertil", "decae"]);

/**
 * Sentencia de un desvio. La emite el Capitan y solo el Capitan.
 *
 * Un veredicto NO amplia la autonomia: juzga el error, no concede el permiso. Si esa
 * accion debe existir, se concede abriendo un encargo que la declare. Confundir las
 * dos cosas convertiria la alarma en una puerta.
 */
export function sentenciar(encargo, { n, veredicto, nivel = null, nota = null } = {}) {
  if (!VEREDICTOS.includes(veredicto)) {
    return { ok: false, motivo: "veredicto debe ser 'fertil' o 'decae' (TEATRO.md, El glitch)" };
  }
  const desvio = encargo.desvios.find((d) => d.n === n);
  if (!desvio) return { ok: false, motivo: `este encargo no tiene un desvio ${n}` };
  if (desvio.veredicto !== "pendiente") {
    return { ok: false, motivo: `el desvio ${n} ya se sentencio como ${desvio.veredicto}` };
  }
  desvio.veredicto = veredicto;
  desvio.nivel = Number.isInteger(nivel) && nivel >= 0 && nivel <= 5 ? nivel : null;
  desvio.nota = nota || null;
  desvio.sentenciado = new Date().toISOString();
  encargo.actualizado = desvio.sentenciado;
  return { ok: true, desvio, encargo };
}

/**
 * El corte de presupuesto, ANTES de gastar.
 *
 * `coste_estimado_eur` es lo que el llamante cree que va a costar el turno; si no
 * lo sabe, no se inventa: se comprueba solo lo que se puede comprobar y el resto
 * queda registrado como no estimado.
 */
export function puedeEjecutar(encargo, { coste_estimado_eur = null, tokens_estimados = null } = {}) {
  if (encargo.estado === ACEPTADO) return { ok: false, motivo: "el encargo ya esta aceptado y cerrado" };
  if (encargo.presupuesto_agotado) return { ok: false, motivo: "presupuesto agotado", agota: true };
  const p = encargo.conexion.presupuesto;
  const c = encargo.consumo;
  if (c.llamadas >= p.llamadas_max) {
    return { ok: false, motivo: `limite de llamadas alcanzado (${c.llamadas}/${p.llamadas_max})`, agota: true };
  }
  if (c.tokens >= p.tokens_max) {
    return { ok: false, motivo: `limite de tokens alcanzado (${c.tokens}/${p.tokens_max})`, agota: true };
  }
  if (c.coste_eur >= p.coste_max_eur) {
    return { ok: false, motivo: `limite de coste alcanzado (${c.coste_eur}/${p.coste_max_eur} EUR)`, agota: true };
  }
  if (Number.isFinite(tokens_estimados) && c.tokens + tokens_estimados > p.tokens_max) {
    return { ok: false, motivo: `el turno estimado (${tokens_estimados} tokens) rebasaria el limite de ${p.tokens_max}`, agota: false };
  }
  if (Number.isFinite(coste_estimado_eur) && c.coste_eur + coste_estimado_eur > p.coste_max_eur) {
    return { ok: false, motivo: `el turno estimado (${coste_estimado_eur} EUR) rebasaria el limite de ${p.coste_max_eur} EUR`, agota: false };
  }
  return { ok: true, motivo: null };
}

/** Un turno del Capitan. No consume presupuesto: no llama a nadie. */
export function anotarTurnoDelCapitan(encargo, texto) {
  const t = {
    n: encargo.continuidad.length + 1,
    ts: new Date().toISOString(),
    papel: "capitan",
    texto: String(texto || "").trim(),
    actor: "capitan",
    proveedor: null,
    modelo: null,
  };
  if (!t.texto) throw new Error("un turno vacio no se anota");
  encargo.continuidad.push(t);
  encargo.actualizado = t.ts;
  return t;
}

/**
 * Ejecuta un turno del encargo contra el actor.
 *
 * `llamar` recibe el dossier y devuelve la forma que ya usa `hablar.mjs`:
 *   { encarnado: false, motivo }  -> el encargo NO avanza y se anota el intento
 *   { encarnado: true, texto, actor, uso? } -> se anota el turno y se cobra
 *
 * No hay tercera via. Un encargo sin actor alcanzable se queda como esta.
 */
export async function ejecutar(encargo, { llamar, coste_estimado_eur = null, tokens_estimados = null } = {}) {
  if (typeof llamar !== "function") throw new Error("ejecutar necesita una funcion 'llamar'");

  const permiso = autorizar(encargo, "redactar");
  if (!permiso.ok) {
    encargo.estado = BLOQUEADO;
    encargo.motivo = `sin autonomia para redactar: ${permiso.motivo}`;
    encargo.actualizado = new Date().toISOString();
    return { ok: false, motivo: encargo.motivo, encargo };
  }

  const margen = puedeEjecutar(encargo, { coste_estimado_eur, tokens_estimados });
  if (!margen.ok) {
    if (margen.agota) {
      encargo.presupuesto_agotado = true;
      // Quedarse sin presupuesto NO borra un resultado que espera revision. Ese
      // estado es trabajo hecho y pagado esperando al Capitan; sustituirlo por
      // `agotado` haria irrevisable justo lo que ya se cobro. El limite se anota
      // como bandera y como motivo; el estado solo cae a `agotado` cuando no hay
      // nada pendiente que perder.
      if (encargo.estado !== ESPERANDO_REVISION) encargo.estado = AGOTADO;
    }
    encargo.motivo = margen.motivo;
    encargo.actualizado = new Date().toISOString();
    return { ok: false, motivo: margen.motivo, encargo };
  }

  // REGLA 1: el payload es el dossier. No hay otro camino a la llamada.
  const paquete = dossier(encargo);
  encargo.estado = EN_CURSO;

  let salida;
  try {
    salida = await llamar(paquete);
  } catch (err) {
    salida = { encarnado: false, motivo: `el actor lanzo un error: ${err.message}` };
  }

  const ahora = new Date().toISOString();
  if (!salida || salida.encarnado !== true) {
    const motivo = salida?.motivo || "el actor no respondio y no dijo por que";
    encargo.intentos.push({ ts: ahora, motivo, proveedor: encargo.conexion.proveedor });
    encargo.consumo.errores += 1;
    encargo.estado = ABIERTO;
    encargo.motivo = motivo;
    encargo.actualizado = ahora;
    return { ok: false, motivo, encargo };
  }

  const turno = {
    n: encargo.continuidad.length + 1,
    ts: ahora,
    papel: "nakama",
    texto: String(salida.texto || "").trim(),
    actor: salida.actor || `${encargo.conexion.proveedor}:${encargo.conexion.modelo || "sin modelo"}`,
    proveedor: encargo.conexion.proveedor,
    modelo: encargo.conexion.modelo,
    fuentes_vistas: paquete.fuentes.map((f) => f.id),
  };
  encargo.continuidad.push(turno);

  encargo.consumo.llamadas += 1;
  const tokens = Number.isFinite(salida.uso?.tokens) ? salida.uso.tokens : null;
  if (tokens !== null) encargo.consumo.tokens += tokens;
  const coste = Number.isFinite(salida.uso?.coste_eur) ? salida.uso.coste_eur : null;
  if (coste !== null) encargo.consumo.coste_eur = Math.round((encargo.consumo.coste_eur + coste) * 1e6) / 1e6;
  if (tokens === null || coste === null) {
    // No se estima lo que el proveedor no informa. Se dice que no se sabe.
    encargo.consumo.sin_informar = {
      tokens: tokens === null,
      coste: coste === null,
      nota: "el proveedor no informo de este consumo; no se estima para rellenar el hueco",
    };
  }

  encargo.estado = ESPERANDO_REVISION;
  encargo.motivo = null;
  encargo.actualizado = ahora;
  return { ok: true, turno, dossier_enviado: paquete, encargo };
}

/**
 * Cambio de conexion. La continuidad NO se toca: pertenece al encargo.
 *
 * Queda una costura anotada con el turno exacto en que se cambio, para que
 * despues se pueda leer que parte del hilo la escribio quien.
 */
export function cambiarConexion(encargo, nueva = {}) {
  const antes = { proveedor: encargo.conexion.proveedor, modelo: encargo.conexion.modelo };
  const conservado = encargo.conexion.presupuesto;
  encargo.conexion = normalizarConexion({ ...nueva, presupuesto: nueva.presupuesto || conservado });
  const costura = {
    ts: new Date().toISOString(),
    tras_turno: encargo.continuidad.length,
    de: antes,
    a: { proveedor: encargo.conexion.proveedor, modelo: encargo.conexion.modelo },
  };
  encargo.costuras.push(costura);
  encargo.actualizado = costura.ts;
  return costura;
}

/**
 * Revision del Capitan. Es el unico modo de cerrar un encargo.
 * Un encargo que nadie reviso no esta hecho, esta esperando.
 */
export function revisar(encargo, { decision, nota = null } = {}) {
  if (!["aceptar", "devolver"].includes(decision)) {
    return { ok: false, motivo: "decision debe ser 'aceptar' o 'devolver'" };
  }
  if (encargo.estado !== ESPERANDO_REVISION) {
    return { ok: false, motivo: `este encargo no esta esperando revision (esta ${encargo.estado})` };
  }
  const ultimo = encargo.continuidad[encargo.continuidad.length - 1];
  const fallo = {
    ts: new Date().toISOString(),
    decision,
    nota,
    sobre_turno: ultimo ? ultimo.n : null,
    actor_revisado: ultimo ? ultimo.actor : null,
  };
  encargo.revisiones.push(fallo);
  if (decision === "aceptar") {
    encargo.estado = ACEPTADO;
    encargo.resultado_aceptado = {
      turno: fallo.sobre_turno,
      texto: ultimo ? ultimo.texto : null,
      actor: fallo.actor_revisado,
      aceptado: fallo.ts,
    };
    encargo.motivo = null;
  } else {
    encargo.estado = DEVUELTO;
    encargo.motivo = nota || "devuelto por el Capitan sin nota";
  }
  encargo.actualizado = fallo.ts;
  return { ok: true, revision: fallo, encargo };
}

// --- El diario: estado vivo como proyeccion de una linea append-only ---------

export const TIPOS_EVENTO = Object.freeze([
  "crear", "turno_capitan", "ejecutar", "intento", "conexion", "revision", "desvio",
  "sentencia", "bitacora",
]);

/**
 * Registro de encargos. Guarda el estado vivo y emite un evento por cada cambio.
 *
 * El emisor lo inyecta el llamante (`escribir`), asi que este modulo no toca el
 * disco y se puede probar entero en memoria. El servidor le pasa un appendFile.
 */
export class RegistroEncargos {
  /**
   * `escribir` persiste el diario; `cerrar` cierra en la Bitacora. Los dos se
   * inyectan, asi que este modulo no toca ni disco ni red y se prueba entero en
   * memoria. El servidor les pasa el appendFile y la puerta canonica.
   */
  constructor({ escribir = null, cerrar = null } = {}) {
    this.encargos = new Map();
    this.escribir = escribir;
    this.cerrar = cerrar;
  }

  /**
   * Cierra un momento en el spine y guarda el recibo. Nunca lanza y nunca bloquea:
   * un encargo no depende de que la autoridad este escuchando.
   */
  async cerrarMomento(momento, encargo, extra = {}) {
    if (!this.cerrar) return null;
    let recibo;
    try {
      recibo = await this.cerrar(momento, encargo, extra);
    } catch (err) {
      recibo = {
        ts: new Date().toISOString(), momento, clave: null,
        cerro: false, alcanzable: false,
        motivo: `la costura con la bitacora fallo: ${err.message}`,
      };
    }
    if (!recibo) return null;
    encargo.bitacora.push(recibo);
    await this.emitir("bitacora", encargo, recibo);
    return recibo;
  }

  async emitir(tipo, encargo, datos = {}) {
    const evento = { ts: new Date().toISOString(), tipo, encargo: encargo.id, datos };
    if (this.escribir) await this.escribir(evento);
    return evento;
  }

  /**
   * Cierra en el spine los desvios que aun no se registraron. Se llama despues de
   * cada momento asincrono del encargo, porque anotar un desvio es sincrono y hablar
   * con la bitacora no lo es. Un desvio sin registrar no se pierde: espera aqui.
   */
  async cerrarDesviosNuevos(encargo) {
    for (const d of encargo.desvios) {
      if (d.registrado) continue;
      // Se marca antes de escribir: "registrado" significa atendido una vez, no
      // "cerro en el spine". Reintentar en bucle cada tick seria ruido, y el recibo
      // ya dice si cerro o no.
      d.registrado = true;
      // El diario primero: es lo que sobrevive aunque la autoridad no escuche. Un
      // desvio que solo existiera si la bitacora responde seria peor que ninguno.
      await this.emitir("desvio", encargo, d);
      await this.cerrarMomento("desvio", encargo, d);
    }
  }

  lista() {
    return [...this.encargos.values()].sort((a, b) => (a.creado < b.creado ? 1 : -1));
  }

  obtener(id) {
    return this.encargos.get(id) || null;
  }

  async abrir(cruda) {
    const encargo = crearEncargo(cruda);
    this.encargos.set(encargo.id, encargo);
    await this.emitir("crear", encargo, { cruda: sinContenidoClinico(cruda) });
    await this.cerrarMomento("abrir", encargo);
    return encargo;
  }

  async decir(id, texto) {
    const encargo = this.exigir(id);
    const turno = anotarTurnoDelCapitan(encargo, texto);
    await this.emitir("turno_capitan", encargo, { texto: turno.texto });
    return turno;
  }

  async ejecutar(id, opciones) {
    const encargo = this.exigir(id);
    const r = await ejecutar(encargo, opciones);
    if (r.ok) {
      await this.emitir("ejecutar", encargo, { turno: r.turno });
    } else {
      await this.emitir("intento", encargo, {
        motivo: r.motivo, estado: encargo.estado, presupuesto_agotado: encargo.presupuesto_agotado,
      });
    }
    // Ejecutar es donde `autorizar` puede denegar y anotar desvios.
    await this.cerrarDesviosNuevos(encargo);
    return r;
  }

  async sentenciar(id, fallo) {
    const encargo = this.exigir(id);
    const r = sentenciar(encargo, fallo);
    if (r.ok) {
      await this.emitir("sentencia", encargo, {
        n: r.desvio.n, veredicto: r.desvio.veredicto, nivel: r.desvio.nivel,
        nota: r.desvio.nota, sentenciado: r.desvio.sentenciado,
      });
      await this.cerrarMomento("sentencia", encargo, r.desvio);
    }
    return r;
  }

  async cambiarConexion(id, nueva) {
    const encargo = this.exigir(id);
    const costura = cambiarConexion(encargo, nueva);
    await this.emitir("conexion", encargo, costura);
    return costura;
  }

  async revisar(id, decision) {
    const encargo = this.exigir(id);
    const r = revisar(encargo, decision);
    if (r.ok) {
      await this.emitir("revision", encargo, r.revision);
      // Despues de anotar la revision, no antes: la clave de idempotencia cuenta
      // las revisiones ya hechas, y asi el mismo cierre reintentado no duplica.
      await this.cerrarMomento("revisar", encargo, r.revision);
    }
    return r;
  }

  exigir(id) {
    const encargo = this.encargos.get(id);
    if (!encargo) throw new Error(`encargo desconocido: ${id}`);
    return encargo;
  }

  /**
   * Reconstruye el registro desde el diario.
   *
   * No re-ejecuta nada: reaplica hechos. Un turno que costo dinero no se vuelve
   * a pagar al abrir la Cubierta.
   */
  static reconstruir(eventos, { escribir = null, cerrar = null } = {}) {
    // `cerrar` se acepta para que el registro reconstruido pueda cerrar momentos
    // FUTUROS, pero reaplicar el diario nunca reenvia nada al spine: los recibos se
    // reaplican como hechos, igual que los turnos. Un evento ya registrado no se
    // vuelve a registrar al abrir la Cubierta.
    const reg = new RegistroEncargos({ escribir, cerrar });
    for (const ev of eventos) {
      if (!ev || !ev.tipo) continue;
      if (ev.tipo === "crear") {
        const encargo = crearEncargo({ ...ev.datos.cruda, id: ev.encargo });
        encargo.creado = ev.ts;
        encargo.actualizado = ev.ts;
        reg.encargos.set(encargo.id, encargo);
        continue;
      }
      const encargo = reg.encargos.get(ev.encargo);
      if (!encargo) continue;
      if (ev.tipo === "turno_capitan") {
        encargo.continuidad.push({
          n: encargo.continuidad.length + 1,
          ts: ev.ts, papel: "capitan", texto: ev.datos.texto,
          actor: "capitan", proveedor: null, modelo: null,
        });
      } else if (ev.tipo === "ejecutar") {
        const t = ev.datos.turno;
        encargo.continuidad.push({ ...t, n: encargo.continuidad.length + 1 });
        encargo.consumo.llamadas += 1;
        encargo.estado = ESPERANDO_REVISION;
      } else if (ev.tipo === "intento") {
        encargo.intentos.push({ ts: ev.ts, motivo: ev.datos.motivo, proveedor: encargo.conexion.proveedor });
        encargo.consumo.errores += 1;
        encargo.estado = ev.datos.estado || ABIERTO;
        encargo.motivo = ev.datos.motivo;
        if (ev.datos.presupuesto_agotado) encargo.presupuesto_agotado = true;
      } else if (ev.tipo === "desvio") {
        encargo.desvios.push(ev.datos);
      } else if (ev.tipo === "sentencia") {
        const d = encargo.desvios.find((x) => x.n === ev.datos.n);
        if (d) Object.assign(d, {
          veredicto: ev.datos.veredicto, nivel: ev.datos.nivel,
          nota: ev.datos.nota, sentenciado: ev.datos.sentenciado,
        });
      } else if (ev.tipo === "bitacora") {
        encargo.bitacora.push(ev.datos);
      } else if (ev.tipo === "conexion") {
        encargo.conexion.proveedor = ev.datos.a.proveedor;
        encargo.conexion.modelo = ev.datos.a.modelo;
        encargo.costuras.push(ev.datos);
      } else if (ev.tipo === "revision") {
        encargo.revisiones.push(ev.datos);
        if (ev.datos.decision === "aceptar") {
          encargo.estado = ACEPTADO;
          const t = encargo.continuidad.find((x) => x.n === ev.datos.sobre_turno);
          encargo.resultado_aceptado = {
            turno: ev.datos.sobre_turno,
            texto: t ? t.texto : null,
            actor: ev.datos.actor_revisado,
            aceptado: ev.ts,
          };
        } else {
          encargo.estado = DEVUELTO;
          encargo.motivo = ev.datos.nota || "devuelto por el Capitan sin nota";
        }
      }
      encargo.actualizado = ev.ts;
    }
    return reg;
  }
}

/**
 * El diario tampoco guarda contenido clinico. Se escribe la referencia y la
 * clase; el contenido, si alguien lo mando, ya se descarto en la admision, y
 * aqui se vuelve a cortar por si el crudo llego con el.
 */
function sinContenidoClinico(cruda) {
  const fuentes = (cruda?.contexto?.fuentes || []).map((f) => {
    const clase = claseValida(f.clase || "interno");
    if (clase === "clinico_protegido") {
      return { id: f.id, titulo: f.titulo, clase, ref: f.ref || null };
    }
    return { ...f, clase };
  });
  return { ...cruda, contexto: { ...(cruda?.contexto || {}), fuentes } };
}
