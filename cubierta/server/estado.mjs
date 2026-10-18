// El estado del barco: que hay, que funciona, que falta y si esto ya se resolvio.
//
// El registro (cubierta/estado/registro.json) es lo que se AFIRMA, escrito a
// mano. Este modulo no lo repite tal cual: comprueba cada prueba que cita contra
// el arbol y contra git en el momento de pedirlo, y devuelve la afirmacion junto
// a lo que de verdad se pudo comprobar. Una afirmacion cuya prueba no aparece no
// se borra ni se maquilla: sale marcada como rota.
//
// Tres distinciones que la pantalla no puede perder:
//   - el estado tecnico (que hay) y la espera (que falta de parte del Capitan)
//     son campos distintos: algo puede estar probado Y esperar una decision;
//   - "visto funcionando" lleva fecha y entorno: una observacion de septiembre
//     en un contenedor no dice que hoy funcione en la maquina del Capitan;
//   - una busqueda vacia dice que fuentes se miraron, nunca que algo sea nuevo.

import { execFile } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export const ESTADOS = {
  observado: { etiqueta: "Visto funcionando", nivel: "alguien lo vio funcionar, en la fecha y el entorno que se indican" },
  probado: { etiqueta: "Probado", nivel: "hecho y con pruebas que pasaron en la fecha que se indica" },
  rama: { etiqueta: "Hecho en una rama", nivel: "existe, pero no esta en el tronco" },
  escrito: { etiqueta: "Solo escrito", nivel: "disenado o contratado por escrito, sin ejecutar" },
  solo_en_disco: { etiqueta: "Solo en un disco", nivel: "existe en una maquina y nadie fuera puede verlo" },
  falta: { etiqueta: "Falta", nivel: "no existe todavia" },
};

export const QUIEN = { capitan: "Capitan", tripulacion: "Tripulacion" };

const TIPOS_ESPERA = new Set(["decision", "observacion"]);
const DIA_MS = 24 * 60 * 60 * 1000;

/** Ruta relativa y dentro del arbol, o null. Nunca se sigue un `..` ni una absoluta. */
function rutaSegura(raiz, relativa) {
  if (typeof relativa !== "string" || !relativa || path.isAbsolute(relativa)) return null;
  const absoluta = path.resolve(raiz, relativa);
  return absoluta.startsWith(`${raiz}${path.sep}`) ? absoluta : null;
}

/** Comprobador de git por defecto: `git cat-file -e <sha>^{commit}` en la raiz. */
export function gitDelArbol(raiz) {
  const correr = (args) => new Promise((resolve) => {
    execFile("git", args, { cwd: raiz, timeout: 5000 }, (err, stdout) => {
      if (err && err.code === "ENOENT") return resolve({ disponible: false });
      resolve({ disponible: true, ok: !err, salida: String(stdout || "").trim() });
    });
  });
  return {
    async existeCommit(sha) {
      if (!/^[0-9a-f]{7,40}$/i.test(String(sha))) return { disponible: true, ok: false };
      return correr(["cat-file", "-e", `${sha}^{commit}`]);
    },
    async cabeza() {
      const r = await correr(["rev-parse", "--short", "HEAD"]);
      return r.disponible && r.ok ? r.salida : null;
    },
  };
}

function enlaceGithub(repositorio, ev, rama) {
  if (!repositorio) return null;
  if (ev.tipo === "pr") return `${repositorio}/pull/${ev.ref}`;
  // Un commit que se afirma ausente no tiene pagina que abrir.
  if (ev.tipo === "commit") return ev.debe === "faltar" ? null : `${repositorio}/commit/${ev.ref}`;
  if (["fichero", "doc", "prueba"].includes(ev.tipo)) return `${repositorio}/blob/${rama}/${ev.ref}`;
  if (ev.tipo === "ultimo") return `${repositorio}/tree/${rama}/${ev.dir}`;
  return null;
}

/** Comprueba una prueba citada. `comprobada`: true, false (citada y no aparece) o null (no comprobable aqui). */
async function comprobarEvidencia(ev, { raiz, git }) {
  if (ev.tipo === "fichero" || ev.tipo === "prueba" || ev.tipo === "doc") {
    const absoluta = rutaSegura(raiz, ev.ref);
    if (!absoluta) return { comprobada: false, motivo: `ruta no valida: ${ev.ref}` };
    let texto;
    try {
      if (ev.tipo !== "doc") {
        await stat(absoluta);
        return { comprobada: true, motivo: "esta en este arbol" };
      }
      texto = await readFile(absoluta, "utf8");
    } catch {
      return { comprobada: false, motivo: `no esta en este arbol: ${ev.ref}` };
    }
    if (ev.ancla && !texto.includes(ev.ancla)) {
      return { comprobada: false, motivo: `el documento ya no dice: "${ev.ancla}"` };
    }
    return { comprobada: true, motivo: ev.ancla ? "el documento lo sigue diciendo" : "esta en este arbol" };
  }

  if (ev.tipo === "commit") {
    const r = await git.existeCommit(ev.ref);
    if (!r.disponible) return { comprobada: null, motivo: "git no esta disponible aqui" };
    // `debe: "faltar"` afirma una ausencia: trabajo que vive fuera de este repo.
    // El dia que aparezca, la comprobacion cambia sola y pide corregir el registro.
    if (ev.debe === "faltar") {
      return r.ok
        ? { comprobada: false, motivo: `${ev.ref} ya es alcanzable en este git: el registro esta desfasado` }
        : { comprobada: true, motivo: `${ev.ref} no esta en este git` };
    }
    return r.ok
      ? { comprobada: true, motivo: "el commit esta en este git" }
      : { comprobada: false, motivo: `el commit ${ev.ref} no esta en este git` };
  }

  if (ev.tipo === "ultimo") {
    const dir = rutaSegura(raiz, ev.dir);
    let patron;
    try { patron = new RegExp(ev.patron); } catch { patron = null; }
    if (!dir || !patron) return { comprobada: false, motivo: "prueba mal declarada en el registro" };
    let nombres;
    try { nombres = await readdir(dir); } catch { return { comprobada: false, motivo: `no existe ${ev.dir}` }; }
    const fechas = nombres.map((n) => n.match(patron)?.[1]).filter(Boolean).sort();
    if (!fechas.length) return { comprobada: false, motivo: `ningun fichero de ${ev.dir} encaja` };
    const ultima = fechas[fechas.length - 1];
    return { comprobada: true, motivo: `el ultimo es del ${ultima}`, fecha: ultima };
  }

  if (ev.tipo === "pr") {
    return { comprobada: null, motivo: "GitHub no se consulta desde la Cubierta" };
  }

  return { comprobada: false, motivo: `tipo de prueba desconocido: ${ev.tipo}` };
}

function edadEnDias(fecha, ahora) {
  const t = Date.parse(`${fecha}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  const hoy = Date.parse(`${new Date(ahora).toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.round((hoy - t) / DIA_MS);
}

function respaldoDe(evidencias) {
  if (!evidencias.length) return "sin_pruebas";
  if (evidencias.some((e) => e.comprobada === false)) return "roto";
  if (evidencias.every((e) => e.comprobada === null)) return "sin_comprobar";
  return "comprobado";
}

/** Valida una entrada del registro. Devuelve la lista de problemas; vacia si esta bien. */
export function validarEntrada(e) {
  const problemas = [];
  if (!e || typeof e.id !== "string" || !e.id) problemas.push("entrada sin id");
  if (!e || typeof e.que !== "string" || !e.que) problemas.push(`${e?.id || "?"}: sin 'que'`);
  if (!ESTADOS[e?.estado]) problemas.push(`${e?.id || "?"}: estado desconocido '${e?.estado}'`);
  if (e?.espera) {
    if (!TIPOS_ESPERA.has(e.espera.tipo)) problemas.push(`${e.id}: espera.tipo debe ser decision u observacion`);
    if (!e.espera.pregunta) problemas.push(`${e.id}: espera sin pregunta`);
    // Pedirle una decision al Capitan exige ponerle delante las alternativas.
    if (e.espera.tipo === "decision" && !(Array.isArray(e.espera.alternativas) && e.espera.alternativas.length >= 2)) {
      problemas.push(`${e.id}: una decision necesita al menos dos alternativas con su consecuencia`);
    }
  }
  if (e?.siguiente && !QUIEN[e.siguiente.quien]) problemas.push(`${e.id}: siguiente.quien debe ser capitan o tripulacion`);
  return problemas;
}

/** El estado completo: cada afirmacion con lo que se pudo comprobar de ella. */
export async function construirEstado({ raiz, registro, ahora = Date.now(), git = gitDelArbol(raiz) }) {
  const rama = registro.rama || "main";
  const problemas = [];
  const filas = [];
  for (const e of registro.entradas || []) {
    const fallos = validarEntrada(e);
    if (fallos.length) {
      problemas.push(...fallos);
      continue;
    }
    const evidencias = [];
    for (const ev of e.evidencias || []) {
      const r = await comprobarEvidencia(ev, { raiz, git });
      evidencias.push({ ...ev, ...r, enlace: enlaceGithub(registro.repositorio, ev, rama) });
    }
    const derivada = evidencias.find((x) => x.fecha);
    const fecha = e.fecha === "derivada" ? (derivada?.fecha || null) : (e.fecha || null);
    filas.push({
      id: e.id,
      que: e.que,
      estado: e.estado,
      etiqueta: ESTADOS[e.estado].etiqueta,
      nivel: ESTADOS[e.estado].nivel,
      detalle: e.detalle || null,
      fecha,
      edad_dias: fecha ? edadEnDias(fecha, ahora) : null,
      entorno: e.entorno || null,
      evidencias,
      respaldo: respaldoDe(evidencias),
      siguiente: e.siguiente ? { ...e.siguiente, quien_etiqueta: QUIEN[e.siguiente.quien] } : null,
      espera: e.espera || null,
      palabras: e.palabras || "",
    });
  }
  return {
    leido: new Date(ahora).toISOString(),
    arbol: await git.cabeza(),
    aviso: "Lo que se afirma viene de cubierta/estado/registro.json, escrito a mano. "
      + "Lo que se comprueba, del arbol y de git en el momento de esta lectura. "
      + "Los PR de GitHub no se consultan desde aqui.",
    estados: ESTADOS,
    filas,
    esperas: filas.filter((f) => f.espera),
    problemas,
  };
}

// --- Busqueda --------------------------------------------------------------

const VACIAS = new Set([
  "que", "los", "las", "del", "con", "para", "una", "uno", "por", "esto", "eso", "esta", "este",
  "como", "entre", "sin", "sus", "mas", "pero", "hay", "ser", "son", "fue", "todo", "cada", "desde",
]);

export function normalizar(texto) {
  return String(texto).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function palabrasDe(consulta) {
  return [...new Set(normalizar(consulta).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !VACIAS.has(w)))];
}

/** Coincidencias por raiz: "modelo" encuentra "modelos" y "encargo" encuentra "encargos". */
function aciertos(texto, palabras) {
  const t = normalizar(texto);
  return palabras.filter((w) => t.includes(w.length > 4 ? w.slice(0, -1) : w)).length;
}

function trozo(texto, palabras) {
  const t = normalizar(texto);
  const i = Math.min(...palabras.map((w) => t.indexOf(w.length > 4 ? w.slice(0, -1) : w)).filter((x) => x >= 0));
  const inicio = Math.max(0, i - 80);
  const limpio = texto.replace(/\s+/g, " ");
  return `${inicio > 0 ? "..." : ""}${limpio.slice(inicio, inicio + 260).trim()}${limpio.length > inicio + 260 ? "..." : ""}`;
}

/** Parrafos (lineas seguidas no vacias) con la linea en que empiezan. */
function parrafosDe(texto) {
  const parrafos = [];
  let actual = null;
  texto.split(/\r?\n/).forEach((l, i) => {
    if (l.trim()) {
      if (!actual) actual = { linea: i + 1, lineas: [] };
      actual.lineas.push(l);
    } else if (actual) {
      parrafos.push({ linea: actual.linea, texto: actual.lineas.join("\n") });
      actual = null;
    }
  });
  if (actual) parrafos.push({ linea: actual.linea, texto: actual.lineas.join("\n") });
  return parrafos;
}

async function documentosBuscables(raiz, registro) {
  const rutas = [...(registro.buscar_en?.ficheros || [])];
  for (const dir of registro.buscar_en?.directorios || []) {
    const abs = rutaSegura(raiz, dir);
    if (!abs) continue;
    try {
      for (const n of (await readdir(abs)).sort()) if (n.endsWith(".md")) rutas.push(`${dir}/${n}`);
    } catch { /* un directorio que falta se declara abajo como no consultado */ }
  }
  const docs = [];
  for (const ruta of rutas) {
    const abs = rutaSegura(raiz, ruta);
    if (!abs) continue;
    try { docs.push({ ruta, texto: await readFile(abs, "utf8") }); } catch { docs.push({ ruta, texto: null }); }
  }
  return docs;
}

/**
 * Busca en el registro y en los documentos declarados. Cada resultado dice de
 * donde sale y a que nivel llega: una mencion en un documento no es una solucion.
 */
export async function buscar({ raiz, registro, estado, consulta }) {
  const palabras = palabrasDe(consulta);
  const docs = await documentosBuscables(raiz, registro);
  const consultadas = [
    { fuente: "cubierta/estado/registro.json", tipo: "registro", leida: true },
    ...docs.map((d) => ({ fuente: d.ruta, tipo: "documento", leida: d.texto !== null })),
  ];
  const nota = "No se consultan PR abiertos, otras ramas ni otros discos: una busqueda vacia no prueba que algo no exista.";
  if (!palabras.length) return { consulta, palabras, consultadas, resultados: [], nota };

  const minimo = Math.min(2, palabras.length);
  const resultados = [];
  for (const f of estado.filas) {
    const n = aciertos(`${f.que} ${f.detalle || ""} ${f.palabras}`, palabras);
    if (n >= minimo) {
      resultados.push({
        tipo: "registro", fuente: "cubierta/estado/registro.json", id: f.id, que: f.que,
        estado: f.estado, etiqueta: f.etiqueta, nivel: f.nivel, fecha: f.fecha, respaldo: f.respaldo, aciertos: n,
      });
    }
  }
  for (const d of docs) {
    if (d.texto === null) continue;
    for (const { linea, texto } of parrafosDe(d.texto)) {
      const n = aciertos(texto, palabras);
      if (n >= minimo) {
        resultados.push({
          tipo: "documento", fuente: d.ruta, linea, etiqueta: "Mencionado en un documento",
          nivel: "esta escrito; eso no dice si existe ni si funciona", trozo: trozo(texto, palabras), aciertos: n,
        });
      }
    }
  }
  // Primero lo del registro, que dice su estado; luego las menciones, por aciertos.
  resultados.sort((a, b) => (a.tipo === b.tipo ? b.aciertos - a.aciertos : a.tipo === "registro" ? -1 : 1));
  return { consulta, palabras, consultadas, resultados: resultados.slice(0, 20), total: resultados.length, nota };
}
