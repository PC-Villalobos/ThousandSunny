// Adaptadores: traducen actividad REAL a senales del mundo.
//
// Regla unica de este fichero: ninguna funcion inventa nada. Si la fuente no
// responde, devuelve estado "sin_senal" con el motivo y la hora del intento. El
// mundo se encarga de que eso signifique quietud en pantalla, no animacion de
// relleno. Honest silence > false noise (ley de la casa).

import { readFile } from "node:fs/promises";
import path from "node:path";

export const ESTADO_OK = "ok";
export const ESTADO_SIN_SENAL = "sin_senal";
export const ESTADO_ERROR = "error";

function ahora() {
  return new Date().toISOString();
}

function sinSenal(id, motivo) {
  return { id, estado: ESTADO_SIN_SENAL, ts: ahora(), motivo, datos: null };
}

async function pedirJson(url, timeoutMs) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Ollama: modelos cargados en memoria ahora mismo. Es la fuente de las unicas
 * constantes que se pueden llamar "medidas" sin mentir.
 *   GET /api/ps    -> modelos residentes, tamano en VRAM, caducidad
 *   GET /api/tags  -> inventario instalado (esta en la despensa, no encarnando)
 */
export async function leerOllama({ url = "http://127.0.0.1:11434", timeoutMs = 1500 } = {}) {
  try {
    const [ps, tags] = await Promise.all([
      pedirJson(`${url}/api/ps`, timeoutMs),
      pedirJson(`${url}/api/tags`, timeoutMs).catch(() => ({ models: [] })),
    ]);
    const residentes = (ps.models || []).map((m) => ({
      nombre: m.name || m.model,
      bytes: m.size ?? null,
      bytes_vram: m.size_vram ?? null,
      caduca: m.expires_at ?? null,
      parametros: m.details?.parameter_size ?? null,
      cuantizacion: m.details?.quantization_level ?? null,
    }));
    return {
      id: "ollama",
      estado: ESTADO_OK,
      ts: ahora(),
      motivo: null,
      datos: { url, residentes, instalados: (tags.models || []).map((m) => m.name) },
    };
  } catch (err) {
    return sinSenal("ollama", `Ollama no responde en ${url}: ${err.message}`);
  }
}

/**
 * Bitacora de Hipatia (127.0.0.1:8765), autoridad operativa desde el 2026-07-24.
 * Reutiliza el cliente ya cosido por la Funcion de Sueno en vez de abrir un
 * segundo camino al mismo servicio.
 */
export async function leerBitacora({ raiz, url, timeoutMs = 1500 } = {}) {
  try {
    const mod = await import(
      path.join(raiz, "state", "funcion_de_sueno", "lib", "bitacora.mjs")
    ).catch(() => null);
    if (!mod) return sinSenal("bitacora", "cliente state/funcion_de_sueno/lib/bitacora.mjs no encontrado");
    const destino = url || mod.bitacoraUrl();
    const salud = await mod.health({ url: destino, timeoutMs });
    if (!salud || salud.reachable === false || salud.ok === false) {
      return sinSenal("bitacora", `bitacora no alcanzable en ${destino}`);
    }
    return {
      id: "bitacora",
      estado: ESTADO_OK,
      ts: ahora(),
      motivo: null,
      datos: { url: destino, eventos: salud.events ?? salud.body?.events ?? null, version: salud.version ?? salud.body?.version ?? null },
    };
  } catch (err) {
    return sinSenal("bitacora", `error hablando con la bitacora: ${err.message}`);
  }
}

/**
 * Funcion de Sueno: el ledger nocturno. De aqui sale el unico dato de fusion
 * actor/personaje que existe en el sistema, y por tanto el aviso de rotacion.
 */
export async function leerSueno({ raiz } = {}) {
  const fichero = path.join(raiz, "state", "funcion_de_sueno", "sleep_ledger.jsonl");
  try {
    const texto = await readFile(fichero, "utf8");
    const lineas = texto.split("\n").filter((l) => l.trim());
    if (!lineas.length) return sinSenal("sueno", "el ledger existe pero esta vacio");
    const ultimo = JSON.parse(lineas[lineas.length - 1]);
    return {
      id: "sueno",
      estado: ESTADO_OK,
      ts: ahora(),
      motivo: null,
      datos: {
        ultimo_ciclo: ultimo.ts,
        actor: ultimo.actor,
        personaje: ultimo.role,
        ejecutor: ultimo.executor,
        racha: ultimo.streak ?? 0,
        deriva: Boolean(ultimo.drift),
        rotar: (ultimo.streak ?? 0) >= 3,
        ciclos: lineas.length,
      },
    };
  } catch (err) {
    return sinSenal("sueno", `no se pudo leer el ledger de sueno: ${err.message}`);
  }
}

/**
 * Senales de agentes: el canal por el que una rutina en la nube, Codex, Claude
 * Code o un VPS declaran que estan trabajando. Es un fichero append-only que
 * escribe POST /api/senal. Sin fichero no hay actividad que mostrar, y eso es
 * una respuesta valida.
 */
export async function leerSenales({ fichero, ventanaMs = 15 * 60 * 1000, ahoraMs = Date.now() } = {}) {
  try {
    const texto = await readFile(fichero, "utf8");
    const eventos = texto
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
    const vivas = eventos.filter((e) => {
      const t = Date.parse(e.ts || "");
      return Number.isFinite(t) && ahoraMs - t <= ventanaMs;
    });
    if (!eventos.length) return sinSenal("agentes", "no hay ninguna senal registrada todavia");
    return {
      id: "agentes",
      estado: ESTADO_OK,
      ts: ahora(),
      motivo: null,
      // `vivas` alimenta el mundo (quien se mueve). `todas` alimenta al vigia, que
      // necesita ver tambien a quien dejo de latir: eso es justo lo que busca.
      datos: { total: eventos.length, vivas, todas: eventos.slice(-200), ultima: eventos[eventos.length - 1] },
    };
  } catch (err) {
    if (err.code === "ENOENT") return sinSenal("agentes", "ningun agente ha emitido senal (no existe senales.jsonl)");
    return sinSenal("agentes", `no se pudo leer senales.jsonl: ${err.message}`);
  }
}

/** Lee todas las fuentes en paralelo. Ninguna puede tumbar a las demas. */
export async function leerFuentes({ raiz, ficheroSenales, ollamaUrl, bitacoraUrl }) {
  const [ollama, bitacora, sueno, agentes] = await Promise.all([
    leerOllama({ url: ollamaUrl }),
    leerBitacora({ raiz, url: bitacoraUrl }),
    leerSueno({ raiz }),
    leerSenales({ fichero: ficheroSenales }),
  ]);
  return [ollama, bitacora, sueno, agentes];
}
