// Puerto de Vegapunk — motor de custodia, Fase 0 (solo material SINTETICO).
//
// Que es: el circuito que decide si un material puede ser leido, por quien, para
// que, y que sale del puerto. No clasifica con un modelo: verifica una declaracion
// contra marcadores y, ante disonancia, aplica SIEMPRE la clase mas restrictiva.
//
// Que NO es: no ingiere fuentes reales, no habla con la red, no escribe canon, no
// toca Drive ni la Bitacora. En Fase 0 el puerto solo admite ficheros marcados
// `fixture: vegapunk-fase-0` con `sintetico: true`. Cualquier otra entrada dispara
// la parada FUENTE_REAL. Admitir una sola fuente real es un GO posterior, no un
// flag.
//
// Reutiliza la frontera de acceso de la funcion de sueno
// (state/funcion_de_sueno/lib/scan.mjs) con la membrana estricta de Melampo: lo
// protegido (Z1) NUNCA se abre.
//
// Uso:
//   node state/vegapunk/vegapunk.mjs            # corre el circuito Fase 0 y escribe recibos
//   node state/vegapunk/vegapunk.mjs --dry      # lo mismo sin escribir nada

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { sha256, normalizeEol, toPosix, hasProtectedMarker, isSkippedDir } from "../funcion_de_sueno/lib/scan.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, "fixtures");
const RECIBOS = path.join(HERE, "fase0_recibos.jsonl");
const LEDGER = path.join(HERE, "fase0_ledger.jsonl");

// --- vocabulario del puerto -------------------------------------------------

// Las tres zonas de custodia. Z1 es un compartimento, no una carpeta comoda: la
// correspondencia identidad <-> seudonimo vive ahi y no sale de ahi jamas.
export const ZONA = Object.freeze({
  Z1_IDENTIDAD: "Z1_identidad",
  Z2_BODEGA: "Z2_bodega",
  Z3_MUELLE: "Z3_muelle"
});

// Clases de material, de mas a menos restrictiva. El orden ES la politica: ante
// disonancia entre lo declarado y lo detectado, gana el indice mas bajo.
export const CLASE = Object.freeze({
  ASISTENCIAL: "asistencial",
  INTIMO: "intimo",
  CUANTIFICADO: "cuantificado",
  METAFORA: "metafora"
});
const ORDEN_CLASE = [CLASE.ASISTENCIAL, CLASE.INTIMO, CLASE.CUANTIFICADO, CLASE.METAFORA];

// Sujeto del material. NO es decorativo: decide si algo puede ser `intimo`. Lo
// intimo lo es porque el sujeto es el propio Capitan; el mismo texto sobre un
// tercero es una relacion asistencial, no una intimidad.
export const SUJETO = Object.freeze({
  CAPITAN: "capitan",
  TERCERO: "tercero",
  NINGUNO: "ninguno"
});

export const FINALIDAD = Object.freeze({
  ASISTENCIA: "asistencia",
  INVESTIGACION: "investigacion",
  SISTEMA: "sistema",
  NARRATIVA: "narrativa"
});

export const ACTOR = Object.freeze({
  CAPITAN: "capitan",
  TRIPULACION: "tripulacion",
  CONTRATADO: "actor_contratado",
  ADAPTADOR: "adaptador"
});

export const NIVEL = Object.freeze({
  DENEGADO: "denegado",
  STAT_ONLY: "stat_only",
  DERIVADO: "derivado",
  CONTENIDO: "contenido"
});

// Las tres condiciones de parada. Una parada no es un error recuperable: aborta
// la admision de ese material y queda escrita en el recibo.
export const PARADA = Object.freeze({
  FUENTE_REAL: "PARADA_FUENTE_REAL",
  IDENTIDAD: "PARADA_IDENTIDAD",
  FUGA: "PARADA_FUGA"
});

const CONFIG = {
  // Lo que el puerto sabe leer. Lo que NO esta aqui no se ignora: se inventaria
  // igual y se deniega con motivo. Un fichero invisible para el inventario
  // produce un "la bodega esta revisada" falso, que es peor que una denegacion.
  extensionesAnalizables: [".md", ".json"],
  skipDirs: [".git", "node_modules"],
  protectedPathMarkers: ["Z1_IDENTIDAD", "HOLD_CLINICO", "00_BOVEDA_NEXUS", "clinical_guarded"]
};

// Umbral de deteccion: UN solo marcador basta para forzar la reclasificacion.
// Con dos, una pieza declarada metafora que menciona una paciente una sola vez
// salia en claro hacia el adaptador (hallazgo H1). La carta ya decia que
// sobre-detectar solo aprieta y que infra-detectar es inaceptable; el umbral no
// lo cumplia.
const UMBRAL_MARCADORES = 1;

// Formato exigido a un GO de puerta. "si" no es un GO (hallazgo H7).
const FORMATO_GO = /^GO_[A-Z0-9_]{4,64}$/;

// Matriz de acceso: clase x actor -> nivel MAXIMO. La finalidad no puede subir
// este techo, solo bajarlo. El adaptador (GAS, Drive, Telegram) es el mas atado a
// proposito: es la unica capa del barco que publica hacia fuera.
const MATRIZ = {
  [CLASE.ASISTENCIAL]: {
    [ACTOR.CAPITAN]: NIVEL.CONTENIDO,
    [ACTOR.TRIPULACION]: NIVEL.DERIVADO,
    [ACTOR.CONTRATADO]: NIVEL.DERIVADO,
    [ACTOR.ADAPTADOR]: NIVEL.DENEGADO
  },
  [CLASE.INTIMO]: {
    [ACTOR.CAPITAN]: NIVEL.CONTENIDO,
    [ACTOR.TRIPULACION]: NIVEL.DERIVADO,
    [ACTOR.CONTRATADO]: NIVEL.DERIVADO,
    [ACTOR.ADAPTADOR]: NIVEL.DENEGADO
  },
  [CLASE.CUANTIFICADO]: {
    [ACTOR.CAPITAN]: NIVEL.CONTENIDO,
    [ACTOR.TRIPULACION]: NIVEL.CONTENIDO,
    [ACTOR.CONTRATADO]: NIVEL.DERIVADO,
    [ACTOR.ADAPTADOR]: NIVEL.DENEGADO
  },
  [CLASE.METAFORA]: {
    [ACTOR.CAPITAN]: NIVEL.CONTENIDO,
    [ACTOR.TRIPULACION]: NIVEL.CONTENIDO,
    [ACTOR.CONTRATADO]: NIVEL.CONTENIDO,
    [ACTOR.ADAPTADOR]: NIVEL.DERIVADO
  }
};

// Clases guardadas: de estas nunca sale texto literal del puerto, sea quien sea el
// solicitante, salvo el Capitan leyendo en su maquina (nivel CONTENIDO).
const GUARDADAS = [CLASE.ASISTENCIAL, CLASE.INTIMO];

// --- deteccion --------------------------------------------------------------

// Sin acentos y en minusculas: la membrana no debe depender de la disciplina de
// tildes de quien escribio el fichero (mismo criterio que hasProtectedMarker).
export function plano(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Marcadores de relacion asistencial. No pretenden ser un clasificador: solo
// detectan INFRA-DECLARACION, es decir, material que se presenta mas suelto de lo
// que es. Que sobre-detecten es aceptable; que infra-detecten no.
const MARCADORES_ASISTENCIAL = [
  "paciente", "motivo de consulta", "en consulta", "en sesion", "la sesion",
  "seguimiento", "derivacion", "alta clinica", "historia clinica"
];

// Marcadores de identidad. Encontrar uno FUERA de Z1 es una parada, no un aviso.
const MARCADORES_IDENTIDAD = [
  /\bnombre[_ ]real\b/, /\bapellidos?\s*:/, /\bdni\b/, /\bnif\b/,
  /\bn(?:um|umero)?\s*colegiado\b/, /\bnhc\b/,
  /[\w.+-]+@[\w-]+\.[a-z]{2,}/, /\b(?:\+34[ -]?)?[6-9]\d{2}[ -]?\d{3}[ -]?\d{3}\b/
];

export function marcadoresAsistenciales(texto) {
  const t = plano(texto);
  return MARCADORES_ASISTENCIAL.filter((m) => t.includes(m));
}

export function marcadoresIdentidad(texto) {
  const t = plano(texto);
  return MARCADORES_IDENTIDAD.filter((re) => re.test(t)).map((re) => re.source);
}

export function masRestrictiva(a, b) {
  const ia = ORDEN_CLASE.indexOf(a);
  const ib = ORDEN_CLASE.indexOf(b);
  if (ia < 0) return b;
  if (ib < 0) return a;
  return ORDEN_CLASE[Math.min(ia, ib)];
}

// --- inventario -------------------------------------------------------------

function frontmatter(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, cabecera: "", cuerpo: texto };
  const meta = {};
  for (const linea of m[1].split("\n")) {
    const kv = linea.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) continue;
    const raw = kv[2].trim();
    if (raw === "true" || raw === "false") meta[kv[1]] = raw === "true";
    else if (raw === "null" || raw === "") meta[kv[1]] = null;
    else meta[kv[1]] = raw;
  }
  return { meta, cabecera: m[1], cuerpo: texto.slice(m[0].length) };
}

// Recorre TODO el arbol, sin filtrar por extension. El filtro por extension
// decide si un fichero se ABRE, no si existe: un fichero que el inventario no ve
// no puede denegarse, y el puerto acaba afirmando que reviso una bodega que no
// miro entera (hallazgo H5).
function walkTodos(root, acc = []) {
  if (!fs.existsSync(root)) return acc;
  for (const entrada of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entrada.name);
    if (entrada.isDirectory()) {
      if (!isSkippedDir(entrada.name, CONFIG)) walkTodos(full, acc);
      continue;
    }
    if (entrada.isFile()) acc.push(full);
  }
  return acc;
}

// GARANTIA: un registro de Z1, o de extension no analizable, nunca pasa por
// readFileSync. Se inventaria por stat y se devuelve sin texto y sin hash.
//
// `superficie` es lo que la deteccion mira: nombre del fichero + cabecera +
// cuerpo. Antes solo miraba el cuerpo, y un `sesion_paciente_03.md` con cuerpo
// limpio salia como metafora (hallazgo H2). De lo que no se abre queda al menos
// el nombre, que ya es superficie suficiente para sospechar.
export function inventariar(root) {
  return walkTodos(root).map((full) => {
    const rel = toPosix(path.relative(root, full));
    const ext = path.extname(full).toLowerCase();
    const protegido = hasProtectedMarker(full, CONFIG);
    const analizable = CONFIG.extensionesAnalizables.includes(ext);

    if (protegido || !analizable) {
      return {
        rel, full, ext, analizable,
        zona: protegido ? ZONA.Z1_IDENTIDAD : ZONA.Z2_BODEGA,
        abierto: false, meta: {}, cuerpo: "", hash: null, superficie: rel
      };
    }
    const buf = fs.readFileSync(full);
    const texto = normalizeEol(buf).toString("utf8");
    const { meta, cabecera, cuerpo } = frontmatter(texto);
    return {
      rel, full, ext, analizable: true, zona: ZONA.Z2_BODEGA, abierto: true,
      meta, cuerpo, hash: sha256(normalizeEol(buf)),
      superficie: [rel, cabecera, cuerpo].join("\n")
    };
  });
}

// --- clasificacion ----------------------------------------------------------

export function clasificar(rec) {
  const declarada = rec.abierto ? (rec.meta.clase_declarada || null) : null;
  const declaradaValida = declarada === null || ORDEN_CLASE.includes(declarada);
  const sujeto = rec.abierto ? (rec.meta.sujeto || null) : null;
  const sujetoValido = sujeto === null || Object.values(SUJETO).includes(sujeto);
  const avisos = [];

  // La deteccion mira la superficie entera, tambien la de lo que no se abrio.
  const marcadores = marcadoresAsistenciales(rec.superficie || rec.rel || "");
  const detectada = marcadores.length >= UMBRAL_MARCADORES ? CLASE.ASISTENCIAL : declarada;

  // Base: lo no leido, lo no declarado y lo declarado con una clase que no
  // existe caen todos en la clase mas restrictiva. Una clase invalida no se
  // propaga como si fuera real (hallazgo H4): se nombra y se cierra.
  let efectiva;
  if (!rec.abierto) {
    efectiva = CLASE.ASISTENCIAL;
    avisos.push(rec.analizable === false
      ? `extension no analizable (${rec.ext || "sin extension"}): no se abre, clase mas restrictiva por defecto`
      : "material no leido: clase mas restrictiva por defecto");
  } else if (!declaradaValida) {
    efectiva = CLASE.ASISTENCIAL;
    avisos.push(`clase declarada desconocida: '${declarada}'`);
  } else if (!declarada) {
    efectiva = CLASE.ASISTENCIAL;
    avisos.push("sin clase declarada: clase mas restrictiva por defecto");
  } else {
    efectiva = masRestrictiva(declarada, detectada || declarada);
    if (efectiva !== declarada) {
      avisos.push(`disonancia: declarada ${declarada}, marcadores asistenciales ${marcadores.length}`);
    }
  }

  // El sujeto decide si algo puede ser intimo. Lo intimo lo es porque el sujeto
  // es el Capitan; el mismo texto sobre un tercero es relacion asistencial. Un
  // sujeto que no existe se trata como el peor caso (hallazgo H6).
  if (efectiva === CLASE.INTIMO && sujeto !== SUJETO.CAPITAN) {
    efectiva = CLASE.ASISTENCIAL;
    avisos.push(sujetoValido
      ? `intimo con sujeto '${sujeto}': la intimidad de un tercero es relacion asistencial`
      : `sujeto declarado desconocido: '${sujeto}'`);
  }

  return {
    declarada, declarada_valida: declaradaValida, sujeto, sujeto_valido: sujetoValido,
    detectada, efectiva, marcadores, avisos,
    disonancia: rec.abierto && declarada !== null && efectiva !== declarada,
    leido: Boolean(rec.abierto)
  };
}

// Puerta clinica -> investigacion. Exige un GO con formato y con caducidad: un
// permiso sin fecha de fin es un permiso permanente, que es justo lo que esta
// puerta existe para no conceder. Antes bastaba cualquier cadena, y
// `puerta_investigacion: si` abria igual que un GO (hallazgo H7).
export function puerta(meta, ahora) {
  const go = meta.puerta_investigacion;
  if (!go) return { abierta: false, motivo: "sin GO de cruce a investigacion" };
  if (!FORMATO_GO.test(String(go))) {
    return { abierta: false, motivo: `GO de puerta con formato invalido: '${go}'` };
  }
  const vence = meta.puerta_vence;
  if (!vence) return { abierta: false, motivo: `GO ${go} sin fecha de caducidad (puerta_vence)` };
  const fin = Date.parse(String(vence));
  if (Number.isNaN(fin)) return { abierta: false, motivo: `puerta_vence ilegible: '${vence}'` };
  if (fin < ahora.getTime()) return { abierta: false, motivo: `GO ${go} caducado el ${vence}` };
  return { abierta: true, motivo: `puerta abierta por ${go}, vigente hasta ${vence}` };
}

// --- admision ---------------------------------------------------------------

function idRecibo(rel, actor, finalidad, hash) {
  return sha256(`${rel}|${actor}|${finalidad}|${hash || "sin-hash"}`).slice(0, 16);
}

// Decide si `rec` puede abrirse, a que nivel, y deja recibo. El recibo NO lleva
// contenido: lleva la huella de la entrada y las reglas que se aplicaron. Es
// idempotente a proposito (mismo material + mismo solicitante = mismo id), para
// que re-correr el circuito no invente historia nueva.
export function admitir({ rec, actor, finalidad, ahora = new Date() }) {
  const paradas = [];
  const motivos = [];
  const clase = clasificar(rec);
  motivos.push(...clase.avisos);

  if (rec.zona === ZONA.Z1_IDENTIDAD) {
    paradas.push(PARADA.IDENTIDAD);
    motivos.push("compartimento Z1: la correspondencia identidad-seudonimo no sale del puerto");
  }

  // Un fichero que se DECLARA Z1 sin estar en el compartimento esta mal
  // colocado, y ya se ha leido para poder ver esa declaracion. Es la leccion
  // del hallazgo H6, y no se puede tapar: la declaracion no protege, solo la
  // ruta protege. Lo unico honesto es denegarlo y decir por que.
  if (rec.abierto && rec.meta.zona === "Z1_IDENTIDAD") {
    paradas.push(PARADA.IDENTIDAD);
    motivos.push("se declara Z1 fuera del compartimento: material mal colocado, " +
      "y ya leido — la cabecera no protege, protege la ruta");
  }

  if (rec.abierto && (rec.meta.fixture !== "vegapunk-fase-0" || rec.meta.sintetico !== true)) {
    paradas.push(PARADA.FUENTE_REAL);
    motivos.push("la Fase 0 solo admite fixtures sinteticos declarados");
  }

  const identidad = marcadoresIdentidad(rec.superficie || rec.rel || "");
  if (identidad.length > 0) {
    paradas.push(PARADA.IDENTIDAD);
    motivos.push(`marcadores de identidad fuera de Z1: ${identidad.length}`);
  }

  // Techo de la matriz: lo maximo que este solicitante podria alcanzar.
  let nivelAcceso = NIVEL.DENEGADO;
  let nivel = NIVEL.DENEGADO;

  if (paradas.length === 0 && rec.abierto) {
    nivelAcceso = (MATRIZ[clase.efectiva] || {})[actor] || NIVEL.DENEGADO;
    nivel = nivelAcceso;

    if (finalidad === FINALIDAD.INVESTIGACION && rec.meta.finalidad_origen !== FINALIDAD.INVESTIGACION) {
      const p = puerta(rec.meta, ahora);
      motivos.push(p.abierta ? p.motivo : `puerta_cerrada: ${p.motivo}`);
      if (!p.abierta) nivel = NIVEL.DENEGADO;
    }

    // El techo de muelle se aplica AQUI, no mas tarde. Antes vivia dentro de
    // empaquetar(), asi que admitir() devolvia un recibo que afirmaba
    // `contenido` sobre material asistencial cuando la salida real era
    // `derivado` (hallazgo H3). En un sistema cuyo registro de verdad es el
    // recibo, un recibo que no describe la salida no es un registro: es ruido.
    const conTecho = nivelDeSalida(clase.efectiva, nivel);
    if (conTecho !== nivel) {
      motivos.push("techo de muelle: de una clase guardada no sale texto literal");
      nivel = conTecho;
    }
  } else if (paradas.length === 0 && !rec.abierto) {
    motivos.push("no analizable: el puerto lo ve y lo deniega, no lo ignora");
  }

  const recibo = {
    id: idRecibo(rec.rel, actor, finalidad, rec.hash),
    rel: rec.rel,
    zona: rec.zona,
    actor,
    finalidad,
    clase_declarada: clase.declarada,
    clase_declarada_valida: clase.declarada_valida,
    sujeto: clase.sujeto,
    clase_efectiva: clase.efectiva,
    disonancia: clase.disonancia,
    leido: clase.leido,
    marcadores: clase.marcadores,
    nivel_acceso: nivelAcceso,
    nivel,
    paradas,
    motivos,
    hash_entrada: rec.hash
  };
  return { nivel, nivelAcceso, paradas, clase, recibo };
}

// Un recibo es la DECISION: content-addressed, sin tiempo, identico si se repite
// la misma pregunta sobre el mismo material. Un asiento es el EVENTO: cuando se
// tomo y en que ejecucion. Separarlos es lo que permite auditar el cuando sin
// romper la idempotencia del id (hallazgo H8).
export function asiento(recibo, { ts = new Date().toISOString(), runId = null } = {}) {
  return {
    ts,
    run_id: runId,
    recibo: recibo.id,
    rel: recibo.rel,
    actor: recibo.actor,
    finalidad: recibo.finalidad,
    nivel: recibo.nivel,
    paradas: recibo.paradas
  };
}

// --- muelle de salida (Z3) --------------------------------------------------

// Techo del muelle: de una clase guardada NUNCA sale texto literal por el muelle,
// ni siquiera hacia el Capitan. La matriz le concede CONTENIDO porque es el
// responsable del material y puede abrirlo en su maquina; lo que esta linea impide
// es que el puerto se convierta en un canal comodo para sacar clinica e intimidad
// en claro. Acceso directo y salida por el muelle no son lo mismo.
export function nivelDeSalida(clase, nivelAcceso) {
  if (GUARDADAS.includes(clase) && nivelAcceso === NIVEL.CONTENIDO) return NIVEL.DERIVADO;
  return nivelAcceso;
}

function derivado(rec, clase) {
  return {
    bytes: Buffer.byteLength(rec.cuerpo, "utf8"),
    lineas: rec.cuerpo.split("\n").length,
    marcadores: clase.marcadores,
    caso: rec.meta.caso || null,
    hash: rec.hash
  };
}

// Construye el paquete de contexto que se entrega a un solicitante. Es el UNICO
// camino de salida del puerto: nadie recibe rutas, nadie recibe la bodega, nadie
// recibe Z1. Lo que no pasa la verificacion de fuga no sale: si algo se cuela, el
// paquete entero se anula.
export function empaquetar({ registros, actor, finalidad, ahora = new Date() }) {
  const items = [];
  const rechazos = [];
  const recibos = [];

  for (const rec of registros) {
    // El nivel viene ya con el techo aplicado desde admitir(): el muelle no
    // rebaja nada por su cuenta, porque entonces el recibo dejaria de describir
    // lo que ocurre (hallazgo H3).
    const { nivel, clase, recibo } = admitir({ rec, actor, finalidad, ahora });
    recibos.push(recibo);
    if (nivel === NIVEL.DENEGADO || nivel === NIVEL.STAT_ONLY) {
      rechazos.push({ rel: rec.rel, nivel, motivos: recibo.motivos, recibo: recibo.id });
      continue;
    }
    const item = { rel: rec.rel, clase: clase.efectiva, nivel, recibo: recibo.id };
    if (nivel === NIVEL.CONTENIDO) item.texto = rec.cuerpo;
    else item.derivado = derivado(rec, clase);
    items.push(item);
  }

  const paquete = { actor, finalidad, fase: 0, sintetico: true, items, rechazos };
  const fuga = verificarFuga(paquete);
  if (fuga.length > 0) {
    return {
      paquete: { actor, finalidad, fase: 0, sintetico: true, items: [], rechazos, anulado: true },
      recibos,
      fuga
    };
  }
  return { paquete, recibos, fuga: [] };
}

// Ultima puerta antes de la salida. Comprueba el paquete YA construido, no la
// intencion de construirlo: es la defensa que sigue en pie si la matriz cambia mal.
export function verificarFuga(paquete) {
  const fallos = [];
  for (const item of paquete.items) {
    if (GUARDADAS.includes(item.clase) && typeof item.texto === "string") {
      fallos.push({ parada: PARADA.FUGA, rel: item.rel, motivo: "texto literal de clase guardada" });
    }
    if (!item.recibo) {
      fallos.push({ parada: PARADA.FUGA, rel: item.rel, motivo: "item sin recibo" });
    }
  }
  const serializado = JSON.stringify(paquete);
  const identidad = marcadoresIdentidad(serializado);
  if (identidad.length > 0) {
    fallos.push({ parada: PARADA.IDENTIDAD, rel: "(paquete)", motivo: `marcadores de identidad: ${identidad.length}` });
  }
  return fallos;
}

// --- circuito Fase 0 --------------------------------------------------------

// Corre el circuito completo para los cuatro solicitantes y devuelve el resultado.
// No decide nada nuevo: expone lo que la politica ya dice, para poder leerlo.
export function circuitoFase0(root = FIXTURES, ahora = new Date()) {
  const registros = inventariar(root);
  const corridas = [];
  for (const actor of Object.values(ACTOR)) {
    for (const finalidad of [FINALIDAD.SISTEMA, FINALIDAD.INVESTIGACION]) {
      corridas.push({ actor, finalidad, ...empaquetar({ registros, actor, finalidad, ahora }) });
    }
  }
  return { registros, corridas };
}

function main() {
  const dry = process.argv.includes("--dry");
  const { registros, corridas } = circuitoFase0();
  const recibos = corridas.flatMap((c) => c.recibos);
  const fugas = corridas.flatMap((c) => c.fuga);

  const z1 = registros.filter((r) => r.zona === ZONA.Z1_IDENTIDAD).length;
  const ciegos = registros.filter((r) => r.analizable === false && r.zona !== ZONA.Z1_IDENTIDAD).length;
  console.log(`puerto de Vegapunk — Fase 0 (sintetico)`);
  console.log(`inventario: ${registros.length} registros (${z1} en Z1 nunca abiertos, ${ciegos} no analizables vistos y denegados)`);
  for (const c of corridas) {
    const salen = c.paquete.items.map((i) => `${i.rel}:${i.nivel}`).join(", ") || "nada";
    console.log(`  ${c.actor} / ${c.finalidad} -> ${salen}`);
  }
  console.log(`fugas detectadas: ${fugas.length}`);

  if (!dry) {
    // Dos artefactos, no uno. Los recibos son la decision y son deterministas:
    // se reescriben enteros y no cambian si nada cambio. El ledger es el evento
    // y es APPEND-ONLY: cada ejecucion deja su rastro con hora y run_id, y
    // ninguna ejecucion borra las anteriores.
    const runId = sha256(recibos.map((r) => r.id).join("|")).slice(0, 12);
    const ts = new Date().toISOString();
    fs.writeFileSync(RECIBOS, recibos.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
    fs.appendFileSync(LEDGER, recibos.map((r) => JSON.stringify(asiento(r, { ts, runId }))).join("\n") + "\n", "utf8");
    console.log(`recibos: ${toPosix(path.relative(process.cwd(), RECIBOS))} (${recibos.length}, deterministas)`);
    console.log(`ledger:  ${toPosix(path.relative(process.cwd(), LEDGER))} (+${recibos.length} asientos, run ${runId})`);
  }
  return fugas.length === 0 ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  process.exit(main());
}
