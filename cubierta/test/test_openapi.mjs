// El contrato OpenAPI de la Cubierta no puede quedarse viejo:
//   node --test cubierta/test/test_openapi.mjs
//
// Un contrato que nadie contrasta describe la API que hubo, no la que hay. Aqui
// se comprueba en las dos direcciones: cada ruta del servidor esta en
// cubierta/openapi.json y cada ruta del contrato existe en el servidor; y las
// respuestas reales de la Cubierta cumplen los esquemas que el contrato declara.

import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CUBIERTA = path.resolve(AQUI, "..");
const RAIZ = path.resolve(CUBIERTA, "..");

const contrato = JSON.parse(await readFile(path.join(CUBIERTA, "openapi.json"), "utf8"));
const fuente = await readFile(path.join(CUBIERTA, "server", "server.mjs"), "utf8");

// Rutas que el servidor atiende y el contrato no describe a proposito.
const FUERA_DEL_CONTRATO = new Map([
  ["GET /favicon.ico", "responde 204 vacio para que el navegador no pida mas"],
  ["GET /index.html", "alias de /, descrito en la operacion de /"],
]);

/** Pares "METODO ruta" que atiende server.mjs, leidos de sus `ruta === "..."`. */
function rutasDelServidor(texto) {
  const pares = new Set();
  for (const linea of texto.split("\n")) {
    const rutas = [...linea.matchAll(/ruta === "([^"]+)"/g)].map((m) => m[1]);
    if (!rutas.length) continue;
    const metodo = /req\.method === "POST"/.test(linea) ? "POST" : "GET";
    for (const r of rutas) pares.add(`${metodo} ${r}`);
  }
  return pares;
}

function rutasDelContrato(c) {
  const pares = new Set();
  for (const [ruta, ops] of Object.entries(c.paths)) {
    for (const metodo of Object.keys(ops)) pares.add(`${metodo.toUpperCase()} ${ruta}`);
  }
  return pares;
}

function resolver(ref) {
  assert.ok(ref.startsWith("#/"), `referencia externa no admitida: ${ref}`);
  return ref.slice(2).split("/").reduce((o, k) => {
    assert.ok(o && k in o, `referencia rota: ${ref}`);
    return o[k];
  }, contrato);
}

/**
 * Validador minimo del subconjunto de JSON Schema que usa el contrato: $ref,
 * type (o lista de tipos), enum, required, properties, items, oneOf. Sin
 * dependencias, como el resto de la Cubierta. Devuelve la lista de fallos.
 */
function validar(valor, esquema, donde = "$") {
  if (esquema.$ref) return validar(valor, resolver(esquema.$ref), donde);
  if (esquema.oneOf) {
    const ok = esquema.oneOf.filter((s) => validar(valor, s, donde).length === 0).length;
    return ok === 1 ? [] : [`${donde}: cumple ${ok} de las alternativas de oneOf, no 1`];
  }
  const fallos = [];
  if (esquema.type) {
    const tipos = Array.isArray(esquema.type) ? esquema.type : [esquema.type];
    const real = valor === null ? "null"
      : Array.isArray(valor) ? "array"
        : Number.isInteger(valor) ? "integer" : typeof valor;
    const admite = tipos.includes(real) || (real === "integer" && tipos.includes("number"));
    if (!admite) return [`${donde}: es ${real}, el contrato dice ${tipos.join("|")}`];
  }
  if (esquema.enum && !esquema.enum.includes(valor)) fallos.push(`${donde}: ${JSON.stringify(valor)} no esta en ${JSON.stringify(esquema.enum)}`);
  if (valor && typeof valor === "object" && !Array.isArray(valor)) {
    for (const k of esquema.required || []) if (!(k in valor)) fallos.push(`${donde}: falta '${k}'`);
    for (const [k, sub] of Object.entries(esquema.properties || {})) {
      if (k in valor) fallos.push(...validar(valor[k], sub, `${donde}.${k}`));
    }
  }
  if (Array.isArray(valor) && esquema.items) {
    valor.forEach((v, i) => fallos.push(...validar(v, esquema.items, `${donde}[${i}]`)));
  }
  return fallos;
}

function esquemaDe(ruta, metodo, codigo) {
  let r = contrato.paths[ruta]?.[metodo]?.responses?.[codigo];
  assert.ok(r, `el contrato no describe ${metodo.toUpperCase()} ${ruta} -> ${codigo}`);
  if (r.$ref) r = resolver(r.$ref);
  return r.content?.["application/json"]?.schema;
}

// --- El contrato en si ------------------------------------------------------

test("el contrato es OpenAPI 3.1 y toda referencia interna resuelve", () => {
  assert.equal(contrato.openapi, "3.1.0");
  assert.ok(contrato.info?.title && contrato.info?.version);
  const refs = [];
  (function recorrer(o) {
    if (Array.isArray(o)) return o.forEach(recorrer);
    if (o && typeof o === "object") {
      if (typeof o.$ref === "string") refs.push(o.$ref);
      Object.values(o).forEach(recorrer);
    }
  })(contrato);
  assert.ok(refs.length > 0);
  for (const r of refs) resolver(r);
});

test("toda operacion tiene operationId unico y al menos una respuesta", () => {
  const ids = [];
  for (const [ruta, ops] of Object.entries(contrato.paths)) {
    for (const [metodo, op] of Object.entries(ops)) {
      assert.ok(op.operationId, `${metodo} ${ruta} sin operationId`);
      assert.ok(Object.keys(op.responses || {}).length, `${metodo} ${ruta} sin respuestas`);
      ids.push(op.operationId);
    }
  }
  assert.equal(new Set(ids).size, ids.length, "operationId repetido");
});

test("cada ruta del servidor esta en el contrato, y cada ruta del contrato existe", () => {
  const servidor = rutasDelServidor(fuente);
  const declaradas = rutasDelContrato(contrato);
  assert.ok(servidor.size >= 10, "no se leyeron las rutas del servidor: ha cambiado la forma de escribirlas");
  const sinContrato = [...servidor].filter((r) => !declaradas.has(r) && !FUERA_DEL_CONTRATO.has(r));
  const fantasmas = [...declaradas].filter((r) => !servidor.has(r));
  assert.deepEqual(sinContrato, [], "rutas del servidor sin describir en cubierta/openapi.json");
  assert.deepEqual(fantasmas, [], "rutas del contrato que el servidor no atiende");
});

test("el lector de rutas distingue GET de POST", () => {
  const pares = rutasDelServidor('if (ruta === "/a") x;\nif (ruta === "/b" && req.method === "POST") y;');
  assert.deepEqual([...pares], ["GET /a", "POST /b"]);
});

test("el validador minimo detecta lo que tiene que detectar", () => {
  const e = { type: "object", required: ["a"], properties: { a: { type: "string", enum: ["x"] }, b: { type: ["integer", "null"] } } };
  assert.deepEqual(validar({ a: "x", b: null }, e), []);
  assert.equal(validar({ b: 1 }, e).length, 1);
  assert.equal(validar({ a: "y" }, e).length, 1);
  assert.equal(validar({ a: "x", b: "1" }, e).length, 1);
  assert.equal(validar([], e).length, 1);
});

// --- Contra la Cubierta de verdad --------------------------------------------

async function conCubierta(fn) {
  const puerto = 20000 + Math.floor(Math.random() * 20000);
  const proc = spawn(process.execPath, [path.join(CUBIERTA, "server", "server.mjs")], {
    cwd: RAIZ,
    env: { ...process.env, CUBIERTA_PUERTO: String(puerto), CUBIERTA_HOST: "127.0.0.1", CUBIERTA_LLM: "ninguno" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("la Cubierta no arranco en 10 s")), 10000);
      proc.stdout.on("data", (d) => { if (String(d).includes("escuchando")) { clearTimeout(t); resolve(); } });
      proc.on("exit", (c) => { clearTimeout(t); reject(new Error(`la Cubierta salio con ${c}`)); });
    });
    await fn(`http://127.0.0.1:${puerto}`);
  } finally {
    proc.kill();
  }
}

const postJson = (base, ruta, cuerpo, cabeceras = {}) => fetch(`${base}${ruta}`, {
  method: "POST",
  headers: { "content-type": "application/json", ...cabeceras },
  body: JSON.stringify(cuerpo),
});

test("las respuestas reales cumplen el contrato", async () => {
  await conCubierta(async (base) => {
    // Solo peticiones que no escriben en cubierta/state: las que se anaden a
    // senales.jsonl o veredictos.jsonl no se ejercitan desde las pruebas.
    const casos = [
      ["get", "/api/snapshot", 200, () => fetch(`${base}/api/snapshot`)],
      ["get", "/api/barco", 200, () => fetch(`${base}/api/barco`)],
      ["get", "/api/salud", 200, () => fetch(`${base}/api/salud`)],
      ["get", "/api/estado", 200, () => fetch(`${base}/api/estado`)],
      ["get", "/api/estado/buscar", 200, () => fetch(`${base}/api/estado/buscar?q=${encodeURIComponent("retomar encargo")}`)],
      ["get", "/openapi.json", 200, () => fetch(`${base}/openapi.json`)],
      ["post", "/api/llave", 400, () => postJson(base, "/api/llave", { recado: "x", decision: "quizas" })],
      ["post", "/api/llave", 200, () => postJson(base, "/api/llave", { recado: "no-existe", decision: "conceder" })],
      ["post", "/api/recado", 400, () => postJson(base, "/api/recado", { nakama: "nadie" })],
      ["post", "/api/veredicto", 400, () => postJson(base, "/api/veredicto", { veredicto: "regular" })],
      ["post", "/api/senal", 400, () => postJson(base, "/api/senal", {})],
      ["post", "/api/hablar", 404, () => postJson(base, "/api/hablar", { nakama: "nadie", texto: "hola" })],
      ["post", "/api/hablar", 403, () => fetch(`${base}/api/hablar`, { method: "POST", headers: { "content-type": "text/plain" }, body: "{}" })],
      ["post", "/api/llave", 403, () => postJson(base, "/api/llave", {}, { origin: "https://otra.web" })],
    ];
    for (const [metodo, ruta, codigo, pedir] of casos) {
      const r = await pedir();
      assert.equal(r.status, codigo, `${metodo.toUpperCase()} ${ruta}: esperaba ${codigo}, llego ${r.status}`);
      const cuerpo = await r.json();
      const fallos = validar(cuerpo, esquemaDe(ruta, metodo, String(codigo)));
      assert.deepEqual(fallos, [], `${metodo.toUpperCase()} ${ruta} -> ${codigo} no cumple el contrato`);
    }

    const servido = await fetch(`${base}/openapi.json`).then((r) => r.json());
    assert.deepEqual(servido, contrato, "/openapi.json sirve el fichero del repo, tal cual");

    for (const ruta of ["/", "/estado"]) {
      const r = await fetch(`${base}${ruta}`);
      assert.equal(r.status, 200);
      assert.match(r.headers.get("content-type"), /^text\/html/);
    }
  });
});
