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

import { walkFiles, sha256, normalizeEol, toPosix, hasProtectedMarker } from "../funcion_de_sueno/lib/scan.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, "fixtures");
const RECIBOS = path.join(HERE, "fase0_recibos.jsonl");

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
  includeExtensions: [".md", ".json"],
  skipDirs: [".git", "node_modules"],
  protectedPathMarkers: ["Z1_IDENTIDAD", "HOLD_CLINICO", "00_BOVEDA_NEXUS", "clinical_guarded"]
};

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
  if (!m) return { meta: {}, cuerpo: texto };
  const meta = {};
  for (const linea of m[1].split("\n")) {
    const kv = linea.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) continue;
    const raw = kv[2].trim();
    if (raw === "true" || raw === "false") meta[kv[1]] = raw === "true";
    else if (raw === "null" || raw === "") meta[kv[1]] = null;
    else meta[kv[1]] = raw;
  }
  return { meta, cuerpo: texto.slice(m[0].length) };
}

// GARANTIA: un registro de Z1 nunca pasa por readFileSync. Se inventaria por
// stat y se devuelve sin texto, sin hash y sin cuerpo.
export function inventariar(root) {
  return walkFiles(root, CONFIG).map((full) => {
    const rel = toPosix(path.relative(root, full));
    if (hasProtectedMarker(full, CONFIG)) {
      return { rel, full, zona: ZONA.Z1_IDENTIDAD, abierto: false, meta: {}, cuerpo: "", hash: null };
    }
    const buf = fs.readFileSync(full);
    const texto = normalizeEol(buf).toString("utf8");
    const { meta, cuerpo } = frontmatter(texto);
    return { rel, full, zona: ZONA.Z2_BODEGA, abierto: true, meta, cuerpo, hash: sha256(normalizeEol(buf)) };
  });
}

// --- clasificacion ----------------------------------------------------------

export function clasificar(rec) {
  // Lo que no se ha abierto no se puede declarar en disonancia: se le aplica la
  // clase mas restrictiva por defecto y se dice que no hubo lectura. Marcarlo como
  // "disonante" seria inventar una contradiccion que nadie observo.
  if (!rec.abierto) {
    return { declarada: null, detectada: null, efectiva: CLASE.ASISTENCIAL, marcadores: [], disonancia: false, leido: false };
  }
  const declarada = rec.meta.clase_declarada || null;
  const marcadores = marcadoresAsistenciales(rec.cuerpo);
  const detectada = marcadores.length >= 2 ? CLASE.ASISTENCIAL : declarada;
  const efectiva = declarada ? masRestrictiva(declarada, detectada || declarada) : CLASE.ASISTENCIAL;
  return { declarada, detectada, efectiva, marcadores, disonancia: efectiva !== declarada, leido: true };
}

// --- admision ---------------------------------------------------------------

function idRecibo(rel, actor, finalidad, hash) {
  return sha256(`${rel}|${actor}|${finalidad}|${hash || "sin-hash"}`).slice(0, 16);
}

// Decide si `rec` puede abrirse, a que nivel, y deja recibo. El recibo NO lleva
// contenido: lleva la huella de la entrada y las reglas que se aplicaron. Es
// idempotente a proposito (mismo material + mismo solicitante = mismo id), para
// que re-correr el circuito no invente historia nueva.
export function admitir({ rec, actor, finalidad }) {
  const paradas = [];
  const motivos = [];
  const clase = clasificar(rec);

  if (rec.zona === ZONA.Z1_IDENTIDAD) {
    paradas.push(PARADA.IDENTIDAD);
    motivos.push("compartimento Z1: la correspondencia identidad-seudonimo no sale del puerto");
  }

  if (rec.abierto && (rec.meta.fixture !== "vegapunk-fase-0" || rec.meta.sintetico !== true)) {
    paradas.push(PARADA.FUENTE_REAL);
    motivos.push("la Fase 0 solo admite fixtures sinteticos declarados");
  }

  const identidad = rec.abierto ? marcadoresIdentidad(rec.cuerpo) : [];
  if (identidad.length > 0) {
    paradas.push(PARADA.IDENTIDAD);
    motivos.push(`marcadores de identidad fuera de Z1: ${identidad.length}`);
  }

  let nivel = NIVEL.DENEGADO;
  if (paradas.length === 0) {
    nivel = (MATRIZ[clase.efectiva] || {})[actor] || NIVEL.DENEGADO;

    // Puerta clinica -> investigacion. Que un material entrara por asistencia no
    // lo habilita para investigar con el: hace falta un GO por finalidad, escrito
    // en la cabecera del propio material. Sin puerta, la finalidad no se sirve.
    if (finalidad === FINALIDAD.INVESTIGACION && rec.meta.finalidad_origen !== FINALIDAD.INVESTIGACION) {
      if (!rec.meta.puerta_investigacion) {
        nivel = NIVEL.DENEGADO;
        motivos.push("puerta_cerrada: material de finalidad " +
          `${rec.meta.finalidad_origen} sin GO de cruce a investigacion`);
      } else {
        motivos.push(`puerta_abierta por ${rec.meta.puerta_investigacion}`);
      }
    }

    // El nivel del puerto nunca es CONTENIDO para clase guardada salvo Capitan.
    if (GUARDADAS.includes(clase.efectiva) && actor !== ACTOR.CAPITAN && nivel === NIVEL.CONTENIDO) {
      nivel = NIVEL.DERIVADO;
      motivos.push("clase guardada: solo derivado fuera del Capitan");
    }
  }

  const recibo = {
    id: idRecibo(rec.rel, actor, finalidad, rec.hash),
    rel: rec.rel,
    zona: rec.zona,
    actor,
    finalidad,
    clase_declarada: clase.declarada,
    clase_efectiva: clase.efectiva,
    disonancia: clase.disonancia,
    marcadores: clase.marcadores,
    nivel,
    paradas,
    motivos,
    hash_entrada: rec.hash
  };
  return { nivel, paradas, clase, recibo };
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
export function empaquetar({ registros, actor, finalidad }) {
  const items = [];
  const rechazos = [];
  const recibos = [];

  for (const rec of registros) {
    const admision = admitir({ rec, actor, finalidad });
    const { clase, recibo } = admision;
    const nivel = nivelDeSalida(clase.efectiva, admision.nivel);
    if (nivel !== admision.nivel) recibo.motivos.push("techo de muelle: clase guardada no sale literal");
    recibo.nivel_salida = nivel;
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
export function circuitoFase0(root = FIXTURES) {
  const registros = inventariar(root);
  const corridas = [];
  for (const actor of Object.values(ACTOR)) {
    for (const finalidad of [FINALIDAD.SISTEMA, FINALIDAD.INVESTIGACION]) {
      corridas.push({ actor, finalidad, ...empaquetar({ registros, actor, finalidad }) });
    }
  }
  return { registros, corridas };
}

function main() {
  const dry = process.argv.includes("--dry");
  const { registros, corridas } = circuitoFase0();
  const recibos = corridas.flatMap((c) => c.recibos);
  const fugas = corridas.flatMap((c) => c.fuga);

  console.log(`puerto de Vegapunk — Fase 0 (sintetico)`);
  console.log(`inventario: ${registros.length} registros (${registros.filter((r) => !r.abierto).length} en Z1, nunca abiertos)`);
  for (const c of corridas) {
    const salen = c.paquete.items.map((i) => `${i.rel}:${i.nivel}`).join(", ") || "nada";
    console.log(`  ${c.actor} / ${c.finalidad} -> ${salen}`);
  }
  console.log(`fugas detectadas: ${fugas.length}`);

  if (!dry) {
    fs.writeFileSync(RECIBOS, recibos.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
    console.log(`recibos: ${toPosix(path.relative(process.cwd(), RECIBOS))} (${recibos.length})`);
  }
  return fugas.length === 0 ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  process.exit(main());
}
