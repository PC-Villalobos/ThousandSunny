// Servidor de la Cubierta. Un proceso, sin dependencias, atado a 127.0.0.1.
//
//   node cubierta/server/server.mjs
//   node cubierta/server/server.mjs --replay cubierta/fixtures/travesia-demo.jsonl
//
// En modo replay el barco se mueve con datos de fixture y TODA respuesta lo
// declara (`modo: "replay"`), para que nadie confunda un ensayo con el barco.

import { createServer } from "node:http";
import { readFile, writeFile, appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Mundo } from "./mundo.mjs";
import { leerFuentes, leerSenales } from "./adaptadores.mjs";
import { calcularVitales, calcularClima, CONTRATO_VERSION } from "./vitales.mjs";
import { vigia, A_BORDO, DECLARADO_V } from "./latido.mjs";
import { AlmacenMedido } from "./almacen.mjs";
import { observarEjes } from "./sondas.mjs";
import { informeSalud } from "./salud.mjs";
import { hablar, backendConfigurado } from "./hablar.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CUBIERTA = path.resolve(AQUI, "..");
const RAIZ = path.resolve(CUBIERTA, "..");
const FICHERO_SENALES = path.join(CUBIERTA, "state", "senales.jsonl");
const FICHERO_VEREDICTOS = path.join(CUBIERTA, "state", "veredictos.jsonl");
const FICHERO_RECADOS = path.join(CUBIERTA, "state", "recados.jsonl");

const args = process.argv.slice(2);
const puerto = Number(process.env.CUBIERTA_PUERTO || 8788);
const host = process.env.CUBIERTA_HOST || "127.0.0.1";
const iReplay = args.indexOf("--replay");
const ficheroReplay = iReplay >= 0 ? args[iReplay + 1] : null;
const VENTANA_SENAL_MS = 15 * 60 * 1000;

const barco = JSON.parse(await readFile(path.join(CUBIERTA, "world", "barco.json"), "utf8"));
const tripulacion = JSON.parse(await readFile(path.join(CUBIERTA, "world", "tripulacion.json"), "utf8"));
const constituciones = JSON.parse(await readFile(path.join(CUBIERTA, "world", "constituciones.json"), "utf8"));

const mundo = new Mundo({ barco, tripulacion, constituciones });
const almacen = new AlmacenMedido();
let contadorBitacoraPrevio = null;

let fuentes = [];
let senalesReplay = [];
let arranque = Date.now();
const veredictos = [];

// --- Fixture de replay -------------------------------------------------------
let guionReplay = [];
if (ficheroReplay) {
  const texto = await readFile(path.resolve(process.cwd(), ficheroReplay), "utf8");
  guionReplay = texto.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
}

function reproducirGuion() {
  if (!guionReplay.length) return;
  const duracion = Math.max(...guionReplay.map((g) => g.t || 0)) + 20000;
  const transcurrido = Date.now() - arranque;

  // Al dar la vuelta hay que reiniciar el reloj del guion, no solo el indice:
  // si se conservase `arranque`, las horas de las senales envejecerian ciclo a
  // ciclo y toda la tripulacion quedaria fantasma para siempre en la segunda
  // vuelta. El replay tiene que poder repetirse siendo igual de honesto.
  if (transcurrido >= duracion) {
    arranque = Date.now();
    mundo.recados = [];
    mundo.artefactos = [];
    senalesReplay = [];
    return;
  }

  senalesReplay = guionReplay
    .filter((g) => (g.t || 0) <= transcurrido)
    .map((g) => ({ ...g.senal, ts: new Date(arranque + (g.t || 0)).toISOString() }));
  for (const g of guionReplay) {
    if ((g.t || 0) > transcurrido || !g.recado) continue;
    const yaEsta = mundo.recados.some((r) => r.origen_guion === g.id);
    if (!yaEsta) {
      const recado = mundo.crearRecado({ ...g.recado, actor: g.senal?.actor || null });
      recado.origen_guion = g.id;
    }
  }
}

// --- Sondeo de fuentes -------------------------------------------------------
async function sondear() {
  if (ficheroReplay) {
    reproducirGuion();
    fuentes = [{
      id: "replay",
      estado: "ok",
      ts: new Date().toISOString(),
      motivo: null,
      datos: { fichero: ficheroReplay, eventos: senalesReplay.length },
    }];
    return;
  }
  // El delta de escritura compara contra la pasada anterior, no contra si mismo.
  const anterior = fuente("bitacora")?.datos?.eventos;
  fuentes = await leerFuentes({
    raiz: RAIZ,
    ficheroSenales: FICHERO_SENALES,
    ollamaUrl: process.env.OLLAMA_URL,
    bitacoraUrl: process.env.BITACORA_URL,
  });
  if (Number.isFinite(anterior)) contadorBitacoraPrevio = anterior;
}

function fuente(id) {
  return fuentes.find((f) => f.id === id) || null;
}

function senalesVivas() {
  if (ficheroReplay) {
    // El replay no relaja la regla: una senal vieja deja de contar tambien aqui.
    const corte = Date.now() - VENTANA_SENAL_MS;
    return senalesReplay.filter((s) => Date.parse(s.ts) >= corte);
  }
  const agentes = fuente("agentes");
  return agentes?.datos?.vivas || [];
}

// El vigia mira mas atras que el mundo: necesita ver a quien dejo de latir.
function todasLasSenales() {
  if (ficheroReplay) return senalesReplay;
  return fuente("agentes")?.datos?.todas || [];
}

/**
 * Observa los cinco ejes de un personaje. Esta funcion es la UNICA puerta por la
 * que puede entrar un `observado`, y no toca `senal.vitales` en ningun punto
 * (no-regresion del encargo, seccion 9).
 */
function observarDe(nakamaId, senal) {
  return observarEjes({
    senal,
    fuenteOllama: fuente("ollama"),
    fuenteBitacora: fuente("bitacora"),
    contadorBitacoraPrevio,
    lecturaThroughput: almacen.lectura(nakamaId, "tokens_por_s"),
  });
}

function pasarVigia() {
  return vigia({
    nakamas: tripulacion.nakamas,
    senales: todasLasSenales(),
    constitucionDe: (id) => mundo.constitucionDe(id),
    observarDe,
    ventanaMs: VENTANA_SENAL_MS,
    almacen,
  });
}

/**
 * Quien puede moverse.
 *
 * La regla dura nunca dijo "medido", dijo LATIDO VERIFICADO, y sigue intacta:
 * mueven `a_bordo` y `declarado`, que son los dos veredictos con latido fresco.
 * La verificacion cambia COMO se dibuja, no SI se mueve.
 *
 * Unica excepcion, y esta si es nueva: `discordante` NO se mueve. Ahi el
 * movimiento seria activamente enganoso, y eso es peor que el silencio.
 */
function encarnadosVerificados(guardia = pasarVigia()) {
  return new Set(
    guardia.filas
      .filter((f) => f.presencia === A_BORDO || f.presencia === DECLARADO_V)
      .map((f) => f.nakama),
  );
}

function construirSnapshot() {
  const vivas = senalesVivas();
  const encarnaciones = mundo.encarnaciones(vivas);
  const guardia = pasarVigia();
  const encarnados = encarnadosVerificados(guardia);
  const sueno = fuente("sueno")?.datos || null;

  const porNakama = new Map(guardia.filas.map((f) => [f.nakama, f]));

  const nakamas = mundo.estadoNakamas(encarnaciones).map((n) => {
    const enc = encarnaciones.find((e) => e.nakama === n.id) || null;
    const fila = porNakama.get(n.id) || null;
    const verificado = encarnados.has(n.id);
    const lecturas = {
      tokens_por_s: almacen.lectura(n.id, "tokens_por_s"),
      latencia_ms: almacen.lectura(n.id, "latencia_ms"),
    };
    return {
      ...n,
      estado: verificado ? n.estado : (fila?.presencia === "en_puerto" ? "apagado" : "sin_verificar"),
      verificado,
      ...(() => {
        const v = calcularVitales({
          senal: enc?.senal || null,
          ejes: fila?.observado || null,
          lecturas, sueno, nakamaId: n.id,
        });
        // `declarado_por_actor` y no `declarado`: este ultimo es el bloque de
        // presencia declarada del vigia, y sobrescribirlo perderia uno de los dos.
        return { vitales: v.vitales, declarado_por_actor: v.declarado };
      })(),
      presencia: fila?.presencia || "en_puerto",
      declarado: fila?.declarado || null,
      observado: fila?.observado || null,
      contradicciones: fila?.contradicciones || [],
      latido: fila?.latido || null,
      latido_edad_ms: fila?.edad_ms ?? null,
      presencia_motivo: fila?.motivo || null,
      desvios: fila?.desvios || [],
      ultima_senal: enc?.desde || null,
      silencio_ms: enc?.desde ? Date.now() - Date.parse(enc.desde) : null,
    };
  });

  return {
    ts: new Date().toISOString(),
    contract_version: CONTRATO_VERSION,
    modo: ficheroReplay ? "replay" : "vivo",
    aviso_replay: ficheroReplay
      ? `MODO REPLAY sobre ${path.basename(ficheroReplay)}: lo que ves es un fixture, no el estado del barco.`
      : null,
    ventana_senal_ms: VENTANA_SENAL_MS,
    fuentes,
    encarnaciones: encarnaciones.map((e) => ({ nakama: e.nakama, actor: e.actor, desde: e.desde, tarea: e.tarea, estado: e.estado })),
    nakamas,
    recados: mundo.recados.slice(-12),
    artefactos: mundo.artefactos.slice(0, 12),
    clima: calcularClima({
      fuentes,
      encarnaciones,
      recados: mundo.recados.filter((r) => r.estado !== "hecho"),
      nakamas: tripulacion.nakamas,
    }),
    vigia: { campana: guardia.campana, nota: guardia.nota },
    veredictos: veredictos.slice(0, 12),
    backend_habla: (() => { const b = backendConfigurado(); return { tipo: b.tipo, modelo: b.modelo || null }; })(),
    encarnados: [...encarnados],
  };
}

// --- Recados: lo abierto sobrevive al reinicio --------------------------------
//
// `senales.jsonl` y `veredictos.jsonl` ya se persistian; los recados no. Vivian
// en memoria, asi que cualquier reinicio se llevaba por delante TODO el trabajo
// abierto: al volver, el barco no sabia que estaba haciendo.
//
// El log es JSONL append-only, como el resto del circuito soberano: una
// instantanea del recado cada vez que cambia su estado logico. Al arrancar se
// reproduce -- ultima entrada por id gana -- y se compacta, para que no crezca
// sin fin.
//
// Lo que NO se persiste, a proposito: la coreografia. Posiciones, rumbo y ruta
// se vuelven a derivar. Ver `Mundo.rehidratarRecados`.
async function cargarRecados() {
  let texto;
  try {
    texto = await readFile(FICHERO_RECADOS, "utf8");
  } catch (err) {
    if (err.code !== "ENOENT") {
      process.stderr.write(`No se pudo leer ${FICHERO_RECADOS}: ${err.message}. La Cubierta arranca sin recados previos.\n`);
    }
    return;
  }

  const instantaneas = [];
  let ilegibles = 0;
  for (const linea of texto.split("\n")) {
    if (!linea.trim()) continue;
    try { instantaneas.push(JSON.parse(linea)); } catch { ilegibles += 1; }
  }

  const { cargados, descartados } = mundo.rehidratarRecados(instantaneas);
  process.stdout.write(`Recados recuperados del disco: ${cargados}\n`);
  // Una perdida se declara, nunca se traga: si el log traia algo que no se pudo
  // cargar, aqui se dice cual y por que.
  if (ilegibles) process.stdout.write(`  ${ilegibles} linea(s) ilegibles en el log, saltadas\n`);
  for (const d of descartados) {
    process.stdout.write(`  descartado ${d.id || "(sin id)"}: ${d.motivo}\n`);
  }

  await mkdir(path.dirname(FICHERO_RECADOS), { recursive: true });
  await writeFile(FICHERO_RECADOS, mundo.recados.map((r) => `${JSON.stringify(r)}\n`).join(""), "utf8");
}

async function persistirRecados(recados) {
  if (!recados.length) return;
  await mkdir(path.dirname(FICHERO_RECADOS), { recursive: true });
  await appendFile(FICHERO_RECADOS, recados.map((r) => `${JSON.stringify(r)}\n`).join(""), "utf8");
}

// Antes del primer tick: al volver, el barco tiene que saber que estaba haciendo.
await cargarRecados();

// --- Bucle -------------------------------------------------------------------
const clientes = new Set();

setInterval(() => {
  // Solo se escribe cuando cambia el estado logico de un recado -- su estado o
  // el paso en que va --, no en cada tick: la coreografia no se persiste.
  const antes = new Map(mundo.recados.map((r) => [r.id, `${r.estado}|${r.indice}`]));
  mundo.tick(encarnadosVerificados());
  almacen.podar();
  const cambiados = mundo.recados.filter((r) => antes.get(r.id) !== `${r.estado}|${r.indice}`);
  if (cambiados.length) {
    persistirRecados(cambiados).catch((err) => {
      process.stderr.write(`No se pudo persistir el recado: ${err.message}\n`);
    });
  }
}, 250);

setInterval(() => { sondear().catch(() => {}); }, 3000);
// Un sondeo inicial que falle no puede impedir el arranque. Si una fuente cae
// -- la bitacora de Hipatia entre ellas --, la Cubierta abre igual y lo declara
// en /api/snapshot. Morir aqui seria justo el acoplamiento que no se permite:
// la autoridad operativa puede estar callada sin llevarse la navegacion por
// delante.
await sondear().catch((err) => {
  process.stderr.write(`Sondeo inicial incompleto: ${err.message}. La Cubierta abre igual.\n`);
});

setInterval(() => {
  if (!clientes.size) return;
  const carga = `data: ${JSON.stringify(construirSnapshot())}\n\n`;
  for (const res of clientes) res.write(carga);
}, 500);

// --- HTTP --------------------------------------------------------------------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function json(res, codigo, cuerpo) {
  const texto = JSON.stringify(cuerpo, null, 2);
  res.writeHead(codigo, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(texto) });
  res.end(texto);
}

/**
 * Guarda de origen para todo lo que muta estado.
 *
 * El servidor esta atado a 127.0.0.1, pero eso no basta: cualquier pagina que el
 * Capitan abra en su navegador puede lanzar un POST a localhost. Sin esta
 * comprobacion, una web cualquiera podria conceder la llave de la camara
 * clinica desde otra pestana. Exigimos JSON explicito (mata la peticion simple
 * sin preflight) y rechazamos todo origen que no sea el propio.
 */
function mismoOrigen(req) {
  const tipo = String(req.headers["content-type"] || "");
  if (!tipo.toLowerCase().startsWith("application/json")) {
    return { ok: false, motivo: "se exige content-type: application/json" };
  }
  const destino = req.headers["sec-fetch-site"];
  if (destino && destino !== "same-origin" && destino !== "none") {
    return { ok: false, motivo: `peticion de otro sitio (sec-fetch-site: ${destino})` };
  }
  const origen = req.headers.origin;
  if (origen) {
    let host;
    try { host = new URL(origen).hostname; } catch { host = null; }
    if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
      return { ok: false, motivo: `origen no permitido: ${origen}` };
    }
  }
  return { ok: true };
}

async function leerCuerpo(req, limite = 256 * 1024) {
  const trozos = [];
  let total = 0;
  for await (const trozo of req) {
    total += trozo.length;
    if (total > limite) throw new Error("cuerpo demasiado grande");
    trozos.push(trozo);
  }
  if (!trozos.length) return {};
  return JSON.parse(Buffer.concat(trozos).toString("utf8"));
}

async function servirEstatico(res, rutaRelativa) {
  const permitidas = ["client", "shared", "world"];
  const normal = path.normalize(rutaRelativa).replace(/^([/\\])+/, "");
  if (!permitidas.includes(normal.split(path.sep)[0])) return false;

  // Dos raices para `shared/`: la del barco (mapa, vocabulario) y la del repo
  // (nucleo epistemico compartido con state/cubierta_ui). El navegador colapsa
  // `../../shared/x.mjs` en `/shared/x.mjs`, asi que ambas se sirven bajo el
  // mismo prefijo. Los nombres no colisionan y el alcance sigue cerrado: solo
  // estos dos directorios, nunca un padre arbitrario.
  const candidatas = [path.join(CUBIERTA, normal)];
  if (normal.split(path.sep)[0] === "shared") {
    candidatas.push(path.join(RAIZ, normal));
  }

  for (const absoluta of candidatas) {
    const raizPermitida = absoluta.startsWith(`${CUBIERTA}${path.sep}`)
      || absoluta.startsWith(`${path.join(RAIZ, "shared")}${path.sep}`);
    if (!raizPermitida) continue;
    try {
      const datos = await readFile(absoluta);
      res.writeHead(200, { "content-type": MIME[path.extname(absoluta)] || "application/octet-stream" });
      res.end(datos);
      return true;
    } catch { /* siguiente candidata */ }
  }
  return false;
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${host}:${puerto}`);
  const ruta = url.pathname;

  try {
    if (req.method === "POST") {
      const guarda = mismoOrigen(req);
      if (!guarda.ok) return json(res, 403, { ok: false, motivo: guarda.motivo });
    }

    if (ruta === "/" || ruta === "/index.html") {
      const html = await readFile(path.join(CUBIERTA, "client", "index.html"));
      res.writeHead(200, { "content-type": MIME[".html"] });
      return res.end(html);
    }

    if (ruta === "/favicon.ico") { res.writeHead(204); return res.end(); }

    if (ruta === "/api/snapshot") return json(res, 200, construirSnapshot());

    if (ruta === "/api/barco") return json(res, 200, { barco, tripulacion, constituciones });

    // El parte de chopper-salud. No lee senal.vitales en ningun punto: con las
    // sondas caidas devuelve "no puedo medirte" por eje, no numeros.
    if (ruta === "/api/salud") {
      return json(res, 200, informeSalud({ filas: pasarVigia().filas, almacen }));
    }

    if (ruta === "/stream") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      });
      res.write(`data: ${JSON.stringify(construirSnapshot())}\n\n`);
      clientes.add(res);
      req.on("close", () => clientes.delete(res));
      return undefined;
    }

    // Canal por el que un agente real declara que esta trabajando. Sin esto, el
    // barco esta quieto, y esa quietud es informacion.
    if (ruta === "/api/senal" && req.method === "POST") {
      const cuerpo = await leerCuerpo(req);
      if (!cuerpo.actor) return json(res, 400, { ok: false, motivo: "falta 'actor': quien encarna" });
      const senal = { ...cuerpo, ts: new Date().toISOString() };
      await mkdir(path.dirname(FICHERO_SENALES), { recursive: true });
      await appendFile(FICHERO_SENALES, `${JSON.stringify(senal)}\n`, "utf8");
      let recado = null;
      let reutilizado = false;
      if (senal.nakama && Array.isArray(senal.recursos) && senal.recursos.length) {
        const objetivo = senal.tarea || "sin objetivo declarado";
        // Un latido que repite la misma tarea no abre un recado nuevo.
        recado = mundo.recadoEquivalente({ nakama: senal.nakama, objetivo, recursos: senal.recursos });
        reutilizado = Boolean(recado);
        if (!recado) {
          recado = mundo.crearRecado({
            nakama: senal.nakama,
            actor: senal.actor,
            objetivo,
            recursos: senal.recursos,
            evidencia: senal.evidencia || null,
          });
        }
      }
      const agentes = await leerSenales({ fichero: FICHERO_SENALES, ventanaMs: VENTANA_SENAL_MS });
      fuentes = [...fuentes.filter((f) => f.id !== "agentes"), agentes];
      return json(res, 200, { ok: true, senal, recado, recado_reutilizado: reutilizado });
    }

    if (ruta === "/api/recado" && req.method === "POST") {
      const cuerpo = await leerCuerpo(req);
      try {
        return json(res, 200, { ok: true, recado: mundo.crearRecado(cuerpo) });
      } catch (err) {
        return json(res, 400, { ok: false, motivo: err.message });
      }
    }

    // La llave de la camara sellada. Solo el Capitan, y desde el puente.
    if (ruta === "/api/llave" && req.method === "POST") {
      const { recado, decision, nota } = await leerCuerpo(req);
      if (!["conceder", "denegar"].includes(decision)) {
        return json(res, 400, { ok: false, motivo: "decision debe ser 'conceder' o 'denegar'" });
      }
      return json(res, 200, mundo.resolverLlave(recado, decision, nota || null));
    }

    // Sentencia del Concilio sobre un desvio. El vigia lo anota; solo aqui se
    // juzga, y solo lo juzga el Capitan: fertil (JoyBoy) o decae (Buggy).
    if (ruta === "/api/veredicto" && req.method === "POST") {
      const { nakama: id, clase, veredicto, nivel, nota } = await leerCuerpo(req);
      if (!["fertil", "decae"].includes(veredicto)) {
        return json(res, 400, { ok: false, motivo: "veredicto debe ser 'fertil' o 'decae' (TEATRO.md, El glitch)" });
      }
      const fallo = {
        ts: new Date().toISOString(),
        nakama: id || null,
        clase: clase || null,
        veredicto,
        nivel: Number.isInteger(nivel) ? nivel : null,
        nota: nota || null,
        juez: "capitan",
      };
      veredictos.unshift(fallo);
      await mkdir(path.dirname(FICHERO_VEREDICTOS), { recursive: true });
      await appendFile(FICHERO_VEREDICTOS, `${JSON.stringify(fallo)}\n`, "utf8");
      return json(res, 200, { ok: true, veredicto: fallo });
    }

    if (ruta === "/api/hablar" && req.method === "POST") {
      const { nakama: id, texto } = await leerCuerpo(req);
      const nakama = mundo.nakama(id);
      if (!nakama) return json(res, 404, { ok: false, motivo: `nakama desconocido: ${id}` });
      const snapshot = construirSnapshot();
      const estado = snapshot.nakamas.find((n) => n.id === id);
      const percepcion = {
        sala_actual: mundo.mapas.get(estado.cubierta)?.sala(...estado.tile) || "intemperie",
        cubierta: estado.cubierta,
        estado: estado.estado,
        encarnado_por: estado.actor,
        recado_actual: estado.recado,
        clima_del_barco: snapshot.clima.resumen,
        fuentes_del_barco: snapshot.fuentes.map((f) => ({ id: f.id, estado: f.estado, motivo: f.motivo })),
        companeros: snapshot.nakamas.filter((n) => n.id !== id).map((n) => ({ id: n.id, sala: n.cubierta, estado: n.estado })),
      };
      const salida = await hablar({
        nakama,
        constitucion: mundo.constitucionDe(id),
        percepcion,
        texto: String(texto || "").slice(0, 4000),
      });
      // COSECHA: el barco mide lo que el mismo causa. Estos tiempos venian de
      // Ollama y hasta ahora se tiraban; ahora son la unica fuente `observada`
      // de pulso y latencia que existe (encargo 5.2).
      if (salida.encarnado && salida.vitales) {
        almacen.registrar(id, {
          tokens_por_s: salida.vitales.tokens_por_s,
          latencia_ms: salida.vitales.latencia_ms,
          carga_ms: salida.vitales.carga_ms,
          modelo: salida.actor,
          fuente: "hablar.mjs",
        });
      }
      if (salida.encarnado && salida.recado_propuesto) {
        try {
          salida.recado = mundo.crearRecado({
            nakama: id,
            actor: salida.actor,
            objetivo: salida.recado_propuesto.objetivo,
            recursos: salida.recado_propuesto.recursos,
          });
        } catch (err) {
          salida.recado_error = err.message;
        }
      }
      return json(res, 200, salida);
    }

    if (await servirEstatico(res, ruta.slice(1))) return undefined;
    return json(res, 404, { ok: false, motivo: `no existe ${ruta}` });
  } catch (err) {
    return json(res, 500, { ok: false, motivo: err.message });
  }
});

// Si el puerto no se puede tomar, el fallo se explica y se nombra la variable
// con la que se cambia. Sin esto Node tira un 'error' sin manejar y el Capitan
// ve una traza cruda en vez de saber que hacer.
servidor.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    process.stderr.write(
      `El puerto ${puerto} de ${host} ya esta ocupado.\n` +
      `Si es otra Cubierta, ya la tienes abierta en http://${host}:${puerto}\n` +
      `Si es otro proceso, arranca en otro puerto:  CUBIERTA_PUERTO=8789 npm run cubierta\n`
    );
  } else if (err.code === "EACCES") {
    process.stderr.write(
      `Sin permiso para escuchar en ${host}:${puerto}.\n` +
      `Elige un puerto por encima de 1024 con CUBIERTA_PUERTO.\n`
    );
  } else {
    process.stderr.write(`La Cubierta no pudo escuchar en ${host}:${puerto}: ${err.message}\n`);
  }
  process.exit(1);
});

servidor.listen(puerto, host, () => {
  process.stdout.write(`Cubierta escuchando en http://${host}:${puerto}\n`);
  process.stdout.write(ficheroReplay ? `MODO REPLAY: ${ficheroReplay}\n` : "MODO VIVO: sin senal, el barco no se mueve.\n");
});
