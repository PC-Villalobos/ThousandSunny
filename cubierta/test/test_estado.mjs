// Pruebas del estado del barco:
//   node --test cubierta/test/test_estado.mjs
//
// Lo que se prueba es que la pantalla no pueda decir mas de lo que sabe: que una
// prueba citada que no aparece salga como rota, que lo que espera al Capitan no
// se mezcle con el estado tecnico, que una observacion lleve fecha y entorno, y
// que una busqueda vacia nombre lo que miro sin declarar nada nuevo.

import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { construirEstado, buscar, validarEntrada, palabrasDe, gitDelArbol } from "../server/estado.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_REPO = path.resolve(AQUI, "..", "..");
const AHORA = Date.parse("2026-10-18T12:00:00Z");

/** Un git de mentira: conoce exactamente los commits que se le dan. */
function gitFalso(conocidos = [], disponible = true) {
  return {
    async existeCommit(sha) { return disponible ? { disponible, ok: conocidos.includes(sha) } : { disponible: false }; },
    async cabeza() { return disponible ? "abc1234" : null; },
  };
}

async function arbolDePrueba(ficheros) {
  const raiz = await mkdtemp(path.join(tmpdir(), "estado-"));
  for (const [ruta, texto] of Object.entries(ficheros)) {
    await mkdir(path.dirname(path.join(raiz, ruta)), { recursive: true });
    await writeFile(path.join(raiz, ruta), texto, "utf8");
  }
  return raiz;
}

function registroCon(entradas, extra = {}) {
  return { repositorio: "https://github.com/x/y", rama: "tronco", entradas, ...extra };
}

test("una prueba citada que existe sale comprobada, con enlace que se puede abrir", async () => {
  const raiz = await arbolDePrueba({ "scripts/a.mjs": "x", "docs/R.md": "| A1 | **Cumplida** |" });
  try {
    const e = await construirEstado({
      raiz, ahora: AHORA, git: gitFalso(["abc1234"]),
      registro: registroCon([{ id: "a", que: "A", estado: "probado", fecha: "2026-10-16", evidencias: [
        { tipo: "fichero", ref: "scripts/a.mjs" },
        { tipo: "doc", ref: "docs/R.md", ancla: "| A1 | **Cumplida**" },
        { tipo: "commit", ref: "abc1234" },
      ] }]),
    });
    const f = e.filas[0];
    assert.equal(f.respaldo, "comprobado");
    assert.ok(f.evidencias.every((x) => x.comprobada === true));
    assert.equal(f.evidencias[0].enlace, "https://github.com/x/y/blob/tronco/scripts/a.mjs");
    assert.equal(f.evidencias[2].enlace, "https://github.com/x/y/commit/abc1234");
  } finally { await rm(raiz, { recursive: true, force: true }); }
});

test("una prueba citada que no aparece marca la afirmacion como rota, sin borrarla", async () => {
  const raiz = await arbolDePrueba({ "docs/R.md": "otra cosa" });
  try {
    const e = await construirEstado({
      raiz, ahora: AHORA, git: gitFalso([]),
      registro: registroCon([{ id: "a", que: "A", estado: "probado", fecha: "2026-10-16", evidencias: [
        { tipo: "fichero", ref: "scripts/no-existe.mjs" },
        { tipo: "doc", ref: "docs/R.md", ancla: "| A1 | **Cumplida**" },
        { tipo: "commit", ref: "deadbeef" },
      ] }]),
    });
    const f = e.filas[0];
    assert.equal(f.estado, "probado", "la afirmacion se conserva tal cual");
    assert.equal(f.respaldo, "roto");
    assert.deepEqual(f.evidencias.map((x) => x.comprobada), [false, false, false]);
    assert.match(f.evidencias[1].motivo, /ya no dice/);
  } finally { await rm(raiz, { recursive: true, force: true }); }
});

test("un PR se cita y se enlaza, pero no se da por comprobado", async () => {
  const e = await construirEstado({
    raiz: RAIZ_REPO, ahora: AHORA, git: gitFalso(),
    registro: registroCon([{ id: "a", que: "A", estado: "rama", fecha: "2026-09-10", evidencias: [{ tipo: "pr", ref: 117 }] }]),
  });
  const ev = e.filas[0].evidencias[0];
  assert.equal(ev.comprobada, null);
  assert.equal(ev.enlace, "https://github.com/x/y/pull/117");
  assert.equal(e.filas[0].respaldo, "sin_comprobar");
});

test("sin git disponible, un commit no se da ni por bueno ni por malo", async () => {
  const e = await construirEstado({
    raiz: RAIZ_REPO, ahora: AHORA, git: gitFalso([], false),
    registro: registroCon([{ id: "a", que: "A", estado: "probado", fecha: "2026-10-01", evidencias: [{ tipo: "commit", ref: "abc1234" }] }]),
  });
  assert.equal(e.filas[0].evidencias[0].comprobada, null);
  assert.match(e.filas[0].evidencias[0].motivo, /git no esta disponible/);
  assert.equal(e.arbol, null);
});

test("una ausencia afirmada se comprueba, y avisa el dia que deja de ser cierta", async () => {
  const entrada = { id: "w", que: "W", estado: "solo_en_disco", fecha: "2026-09-05", evidencias: [{ tipo: "commit", ref: "fb82863", debe: "faltar" }] };
  const hoy = await construirEstado({ raiz: RAIZ_REPO, ahora: AHORA, git: gitFalso([]), registro: registroCon([entrada]) });
  assert.equal(hoy.filas[0].evidencias[0].comprobada, true);
  assert.equal(hoy.filas[0].evidencias[0].enlace, null, "lo que no esta en el repo no se enlaza a una pagina que no existe");
  const manana = await construirEstado({ raiz: RAIZ_REPO, ahora: AHORA, git: gitFalso(["fb82863"]), registro: registroCon([entrada]) });
  assert.equal(manana.filas[0].evidencias[0].comprobada, false);
  assert.match(manana.filas[0].evidencias[0].motivo, /registro esta desfasado/);
});

test("lo que espera al Capitan va aparte del estado tecnico", async () => {
  const e = await construirEstado({
    raiz: RAIZ_REPO, ahora: AHORA, git: gitFalso(),
    registro: registroCon([
      { id: "p", que: "Probado y pendiente", estado: "probado", fecha: "2026-10-18", evidencias: [],
        espera: { tipo: "decision", pregunta: "Desplegar?", alternativas: [{ opcion: "Si", consecuencia: "x" }, { opcion: "No", consecuencia: "y" }] } },
      { id: "r", que: "En rama, trabajo nuestro", estado: "rama", fecha: "2026-09-10", evidencias: [],
        siguiente: { quien: "tripulacion", que: "resolver el conflicto" } },
    ]),
  });
  assert.deepEqual(e.esperas.map((f) => f.id), ["p"], "un conflicto de rama no es tarea del Capitan");
  assert.equal(e.filas.find((f) => f.id === "p").estado, "probado", "esperar una decision no rebaja el estado");
  assert.equal(e.filas.find((f) => f.id === "r").siguiente.quien_etiqueta, "Tripulacion");
});

test("pedir una decision exige alternativas con su consecuencia", () => {
  const sin = validarEntrada({ id: "d", que: "D", estado: "rama", espera: { tipo: "decision", pregunta: "Que hago?" } });
  assert.ok(sin.some((p) => /dos alternativas/.test(p)));
  const observacion = validarEntrada({ id: "o", que: "O", estado: "probado", espera: { tipo: "observacion", pregunta: "Usalo tu" } });
  assert.deepEqual(observacion, [], "una observacion del Capitan no necesita alternativas");
});

test("una entrada invalida no desaparece en silencio: se declara", async () => {
  const e = await construirEstado({
    raiz: RAIZ_REPO, ahora: AHORA, git: gitFalso(),
    registro: registroCon([{ id: "x", que: "X", estado: "funcionando" }]),
  });
  assert.equal(e.filas.length, 0);
  assert.ok(e.problemas.some((p) => /estado desconocido 'funcionando'/.test(p)));
});

test("una observacion lleva su fecha, su edad y su entorno", async () => {
  const e = await construirEstado({
    raiz: RAIZ_REPO, ahora: AHORA, git: gitFalso(),
    registro: registroCon([{ id: "a", que: "A", estado: "observado", fecha: "2026-09-06", entorno: "contenedor cloud", evidencias: [] }]),
  });
  assert.equal(e.filas[0].edad_dias, 42);
  assert.equal(e.filas[0].entorno, "contenedor cloud");
});

test("la fecha derivada sale del ultimo fichero, no del registro", async () => {
  const raiz = await arbolDePrueba({
    "r/sleep_report_2026-10-16T05-46-48-183Z.md": "x",
    "r/sleep_report_2026-10-18T05-47-55-117Z.md": "x",
    "r/otra-cosa.md": "x",
  });
  try {
    const e = await construirEstado({
      raiz, ahora: AHORA, git: gitFalso(),
      registro: registroCon([{ id: "s", que: "S", estado: "observado", fecha: "derivada",
        evidencias: [{ tipo: "ultimo", dir: "r", patron: "^sleep_report_(\\d{4}-\\d{2}-\\d{2})T" }] }]),
    });
    assert.equal(e.filas[0].fecha, "2026-10-18");
    assert.equal(e.filas[0].edad_dias, 0);
  } finally { await rm(raiz, { recursive: true, force: true }); }
});

test("una ruta que sale del arbol no se sigue", async () => {
  const e = await construirEstado({
    raiz: RAIZ_REPO, ahora: AHORA, git: gitFalso(),
    registro: registroCon([{ id: "a", que: "A", estado: "probado", fecha: "2026-10-01", evidencias: [
      { tipo: "fichero", ref: "../../etc/passwd" },
      { tipo: "fichero", ref: "/etc/passwd" },
    ] }]),
  });
  assert.deepEqual(e.filas[0].evidencias.map((x) => x.comprobada), [false, false]);
});

test("la busqueda distingue lo que esta en el registro de lo que solo se menciona", async () => {
  const raiz = await arbolDePrueba({ "docs/R.md": "# Rumbo\n\nAqui se habla del contexto entre modelos.\n\nOtra cosa." });
  try {
    const registro = registroCon([
      { id: "c", que: "Contexto portatil", estado: "escrito", fecha: "2026-07-26", evidencias: [], palabras: "contexto modelos" },
    ], { buscar_en: { ficheros: ["docs/R.md"], directorios: [] } });
    const estado = await construirEstado({ raiz, registro, ahora: AHORA, git: gitFalso() });
    const r = await buscar({ raiz, registro, estado, consulta: "contexto entre modelos" });
    assert.deepEqual(r.palabras, ["contexto", "modelos"], "las palabras vacias no cuentan");
    assert.equal(r.resultados[0].tipo, "registro");
    assert.equal(r.resultados[0].etiqueta, "Solo escrito");
    const mencion = r.resultados.find((x) => x.tipo === "documento");
    assert.equal(mencion.linea, 3);
    assert.match(mencion.nivel, /no dice si existe/);
  } finally { await rm(raiz, { recursive: true, force: true }); }
});

test("una busqueda vacia nombra lo que miro y no declara que algo sea nuevo", async () => {
  const raiz = await arbolDePrueba({ "docs/R.md": "nada que ver" });
  try {
    const registro = registroCon([], { buscar_en: { ficheros: ["docs/R.md", "docs/falta.md"], directorios: [] } });
    const estado = await construirEstado({ raiz, registro, ahora: AHORA, git: gitFalso() });
    const r = await buscar({ raiz, registro, estado, consulta: "teletransporte cuantico" });
    assert.equal(r.resultados.length, 0);
    assert.deepEqual(r.consultadas.map((c) => [c.fuente, c.leida]), [
      ["cubierta/estado/registro.json", true], ["docs/R.md", true], ["docs/falta.md", false],
    ]);
    assert.match(r.nota, /no prueba que algo no exista/);
    assert.doesNotMatch(JSON.stringify(r), /nuev[oa]/i);
  } finally { await rm(raiz, { recursive: true, force: true }); }
});

test("palabrasDe quita acentos y palabras vacias", () => {
  assert.deepEqual(palabrasDe("¿Retomar un Encargo de Hipatía?"), ["retomar", "encargo", "hipatia"]);
});

// --- El registro real -------------------------------------------------------

test("el registro real es valido y toda prueba de fichero que cita esta en el arbol", async () => {
  const registro = JSON.parse(await readFile(path.join(RAIZ_REPO, "cubierta", "estado", "registro.json"), "utf8"));
  const estado = await construirEstado({ raiz: RAIZ_REPO, registro, git: gitFalso() });
  assert.deepEqual(estado.problemas, []);
  assert.equal(estado.filas.length, registro.entradas.length);
  const rotas = estado.filas.flatMap((f) => f.evidencias
    .filter((ev) => ["fichero", "doc", "prueba", "ultimo"].includes(ev.tipo) && ev.comprobada !== true)
    .map((ev) => `${f.id}: ${ev.motivo}`));
  assert.deepEqual(rotas, [], "si se mueve o se borra un fichero citado, el registro tiene que cambiar con el");
});

test("el registro real no lleva nada privado: el repositorio es publico", async () => {
  const texto = await readFile(path.join(RAIZ_REPO, "cubierta", "estado", "registro.json"), "utf8");
  assert.doesNotMatch(texto, /@[a-z0-9.-]+\.[a-z]{2,}/i, "sin direcciones de correo");
  assert.doesNotMatch(texto, /[A-Z]:\\\\/, "sin rutas absolutas de Windows");
  assert.doesNotMatch(texto, /docs\.google\.com|drive\.google\.com/, "sin enlaces a Drive");
});

test("con el git real, los commits del tronco que cita el registro existen", async (t) => {
  const git = gitDelArbol(RAIZ_REPO);
  if (!(await git.cabeza())) return t.skip("este arbol no tiene git");
  const registro = JSON.parse(await readFile(path.join(RAIZ_REPO, "cubierta", "estado", "registro.json"), "utf8"));
  const estado = await construirEstado({ raiz: RAIZ_REPO, registro, git });
  const malos = estado.filas.flatMap((f) => f.evidencias.filter((ev) => ev.tipo === "commit" && ev.comprobada === false).map((ev) => `${f.id}: ${ev.motivo}`));
  // Un clon superficial no tiene la historia: ahi no se puede afirmar nada.
  const superficial = await new Promise((resolve) => {
    const p = spawn("git", ["rev-parse", "--is-shallow-repository"], { cwd: RAIZ_REPO });
    let salida = "";
    p.stdout.on("data", (d) => { salida += d; });
    p.on("close", () => resolve(salida.trim() === "true"));
    p.on("error", () => resolve(false));
  });
  if (superficial && malos.length) return t.skip(`clon superficial: ${malos.join("; ")}`);
  assert.deepEqual(malos, []);
});

// --- HTTP de verdad ---------------------------------------------------------

async function conCubierta(fn) {
  const puerto = 20000 + Math.floor(Math.random() * 20000);
  const proc = spawn(process.execPath, [path.join(RAIZ_REPO, "cubierta", "server", "server.mjs")], {
    cwd: RAIZ_REPO,
    env: { ...process.env, CUBIERTA_PUERTO: String(puerto), CUBIERTA_HOST: "127.0.0.1" },
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

test("la Cubierta sirve la pantalla y su estado", async () => {
  await conCubierta(async (base) => {
    const html = await fetch(`${base}/estado`);
    assert.equal(html.status, 200);
    assert.match(await html.text(), /Estado del barco/);
    const cliente = await fetch(`${base}/client/estado.mjs`);
    assert.equal(cliente.status, 200);

    const estado = await fetch(`${base}/api/estado`).then((r) => r.json());
    assert.deepEqual(estado.problemas, []);
    assert.ok(estado.filas.length > 0);
    assert.ok(estado.esperas.every((f) => f.espera));
    assert.match(estado.aviso, /escrito a mano/);

    const r = await fetch(`${base}/api/estado/buscar?q=${encodeURIComponent("contexto entre modelos")}`).then((x) => x.json());
    const capsula = r.resultados.find((x) => x.id === "capsula-contexto");
    assert.ok(capsula, "la capsula de julio aparece al buscar lo que resuelve");
    assert.equal(capsula.estado, "escrito");

    const portada = await fetch(`${base}/`).then((x) => x.text());
    assert.match(portada, /href="\/estado"/, "la Cubierta enlaza su estado");
  });
});
