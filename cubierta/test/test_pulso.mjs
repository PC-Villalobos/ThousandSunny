// Pruebas del corte de pulso real.
//   node cubierta/test/test_pulso.mjs
//
// Encargo: docs/architecture/ENCARGO_PULSO_REAL.md, criterios de salida (10).
//
// Lo que se prueba aqui no es que las sondas midan bonito, sino que el barco no
// pueda confundir lo que le cuentan con lo que ha comprobado: que un `observado`
// jamas nazca de POST /api/senal, que la ausencia de medicion nunca se convierta
// en acusacion, y que con todas las sondas caidas no sobreviva ni un numero.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  sondaProceso, sondaMemoria, sondaResidencia, sondaEscritura, observarEjes,
  OBSERVADO, NO_OBSERVABLE, SIN_DATO, EJES,
} from "../server/sondas.mjs";
import { AlmacenMedido } from "../server/almacen.mjs";
import {
  vigia, evaluarPresencia, detectarContradicciones, SUENAN,
  EN_PUERTO, A_BORDO, DECLARADO_V, MUDO, DISCORDANTE, NO_OBSERVABLE_V,
  AMARRADO, FANTASMA, A_LA_DERIVA,
} from "../server/latido.mjs";
import { informeSalud } from "../server/salud.mjs";
import { Mundo } from "../server/mundo.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CUBIERTA = path.resolve(AQUI, "..");
const barco = JSON.parse(await readFile(path.join(CUBIERTA, "world", "barco.json"), "utf8"));
const tripulacion = JSON.parse(await readFile(path.join(CUBIERTA, "world", "tripulacion.json"), "utf8"));
const constituciones = JSON.parse(await readFile(path.join(CUBIERTA, "world", "constituciones.json"), "utf8"));

let fallos = 0;
let pasadas = 0;
async function prueba(nombre, fn) {
  try {
    await fn();
    pasadas += 1;
    process.stdout.write(`  ok   ${nombre}\n`);
  } catch (err) {
    fallos += 1;
    process.stdout.write(`  FALL ${nombre}\n       ${err.message}\n`);
  }
}

const AHORA = Date.now();
const hace = (ms) => new Date(AHORA - ms).toISOString();

function error(code) {
  const e = new Error(code);
  e.code = code;
  return e;
}
const matarVivo = () => undefined;
const matarMuerto = () => { throw error("ESRCH"); };
const matarAjeno = () => { throw error("EPERM"); };

/** Ejes todos no_observable: el barco a ciegas. */
function ejesCiegos() {
  return Object.fromEntries(EJES.map((e) => [e, { estado: NO_OBSERVABLE, valor: null, fuente: "x", motivo: "sonda caida", edad_ms: null }]));
}
function conEje(base, nombre, parche) {
  return { ...base, [nombre]: { ...base[nombre], ...parche } };
}

const ollamaOk = (residentes, instalados = ["qwen2.5:7b"], tsMs = AHORA) => ({
  id: "ollama", estado: "ok", ts: new Date(tsMs).toISOString(), motivo: null,
  datos: { residentes, instalados },
});

process.stdout.write("\nSondas: observar es otra cosa que creer\n");

await prueba("sin pid declarado, liveness es no_observable (no es un fallo)", () => {
  const e = sondaProceso(null);
  assert.equal(e.estado, NO_OBSERVABLE);
  assert.match(e.motivo, /no declara pid/);
});

await prueba("pid vivo -> observado true; pid inexistente -> observado false", () => {
  assert.deepEqual(
    [sondaProceso(4242, { matar: matarVivo }).estado, sondaProceso(4242, { matar: matarVivo }).valor],
    [OBSERVADO, true],
  );
  const muerto = sondaProceso(4242, { matar: matarMuerto });
  assert.equal(muerto.estado, OBSERVADO);
  assert.equal(muerto.valor, false, "la ausencia observada es una observacion, y alimenta D1");
});

await prueba("EPERM no es contradiccion: es no_observable", () => {
  const e = sondaProceso(4242, { matar: matarAjeno });
  assert.equal(e.estado, NO_OBSERVABLE);
  assert.match(e.motivo, /EPERM/);
});

await prueba("la RSS no se estima donde no se puede leer", () => {
  const e = sondaMemoria(4242, { plataforma: "win32" });
  assert.equal(e.estado, NO_OBSERVABLE);
  assert.match(e.motivo, /no se estima/);
});

await prueba("un actor que no es de Ollama queda fuera de la jurisdiccion de esa sonda", () => {
  const e = sondaResidencia(ollamaOk([]), "claude-code");
  assert.equal(e.estado, NO_OBSERVABLE, "claude-code no tiene residencia que comprobar en Ollama");
  assert.match(e.motivo, /fuera del alcance/);
});

await prueba("Ollama caido deja residencia en no_observable, nunca en contradiccion", () => {
  const e = sondaResidencia({ id: "ollama", estado: "sin_senal", motivo: "no responde" }, "qwen2.5:7b");
  assert.equal(e.estado, NO_OBSERVABLE);
});

await prueba("la bitacora sin delta previo da sin_dato, no no_observable", () => {
  const fuente = { id: "bitacora", estado: "ok", datos: { eventos: 10 } };
  assert.equal(sondaEscritura(fuente, null).estado, SIN_DATO);
  assert.equal(sondaEscritura(fuente, 8).estado, OBSERVADO);
  assert.equal(sondaEscritura(fuente, 10).estado, SIN_DATO, "responde y no hay nada nuevo");
});

// Los ficheros HABLAN de `senal.vitales` en sus comentarios precisamente para
// prohibirlo; el guardia estructural mira el codigo, no la prosa.
function soloCodigo(texto) {
  return texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

await prueba("ni las sondas ni chopper-salud pueden leer lo declarado (no-regresion 9)", async () => {
  // sondas.mjs recibe la senal (necesita `pid` y `actor`) pero no puede mirar
  // nunca lo que el agente afirma de sus propias constantes.
  const sondas = soloCodigo(await readFile(path.join(CUBIERTA, "server", "sondas.mjs"), "utf8"));
  assert.equal(/vitales/.test(sondas), false, "sondas.mjs no puede leer los vitales autodeclarados");

  // salud.mjs es mas estricto todavia: no recibe senales en absoluto. Trabaja
  // sobre filas del vigia y el almacen medido, y punto.
  const salud = soloCodigo(await readFile(path.join(CUBIERTA, "server", "salud.mjs"), "utf8"));
  assert.equal(/\bsenal\b/.test(salud), false, "chopper-salud no puede ni tocar una senal");
});

process.stdout.write("\nAlmacen medido: ventana, agregacion y caducidad\n");

await prueba("una muestra fuera de ventana no se publica y lo dice fechada", () => {
  const a = new AlmacenMedido({ ventanaMs: 1000 });
  a.registrar("nami", { tokens_por_s: 50, ts: hace(60000) });
  const l = a.lectura("nami", "tokens_por_s", AHORA);
  assert.equal(l.valor, null);
  assert.match(l.motivo, /fuera de ventana/);
});

await prueba("con menos de 3 muestras se publica la ultima cruda, no una media", () => {
  const a = new AlmacenMedido();
  a.registrar("nami", { tokens_por_s: 10, ts: hace(2000) });
  a.registrar("nami", { tokens_por_s: 90, ts: hace(1000) });
  const l = a.lectura("nami", "tokens_por_s", AHORA);
  assert.equal(l.tipo, "muestra_unica");
  assert.equal(l.valor, 90, "la ultima cruda, no el promedio 50");
});

await prueba("con 3 o mas muestras se publica la tasa", () => {
  const a = new AlmacenMedido();
  for (const v of [10, 20, 30]) a.registrar("nami", { tokens_por_s: v, ts: hace(1000) });
  const l = a.lectura("nami", "tokens_por_s", AHORA);
  assert.equal(l.tipo, "tasa");
  assert.equal(l.valor, 20);
  assert.equal(l.n, 3);
});

await prueba("el almacen esta acotado por nakama", () => {
  const a = new AlmacenMedido({ cap: 5 });
  for (let i = 0; i < 50; i++) a.registrar("nami", { tokens_por_s: i, ts: hace(100) });
  assert.equal(a.porNakama.get("nami").length, 5);
});

process.stdout.write("\nLos nueve veredictos\n");

const senalViva = (extra = {}) => ({ nakama: "nami", actor: "claude-code", estado: "trabajando", ts: hace(5000), ...extra });

await prueba("en_puerto: nunca emitio senal", () => {
  assert.equal(evaluarPresencia({ senal: null, ejes: ejesCiegos(), ahoraMs: AHORA }).veredicto, EN_PUERTO);
});

await prueba("a_bordo: latido fresco y algun eje observado", () => {
  const ejes = conEje(ejesCiegos(), "liveness", { estado: OBSERVADO, valor: true });
  assert.equal(evaluarPresencia({ senal: senalViva(), ejes, ahoraMs: AHORA }).veredicto, A_BORDO);
});

await prueba("declarado: latido fresco y ningun eje observado", () => {
  const p = evaluarPresencia({ senal: senalViva(), ejes: ejesCiegos(), ahoraMs: AHORA });
  assert.equal(p.veredicto, DECLARADO_V);
  assert.match(p.motivo, /creible, no verificado/);
});

await prueba("mudo: proceso vivo y dejo de reportar, y gana a los demas", () => {
  const ejes = conEje(ejesCiegos(), "liveness", { estado: OBSERVADO, valor: true });
  const p = evaluarPresencia({ senal: senalViva({ ts: hace(5 * 60 * 1000) }), ejes, ahoraMs: AHORA });
  assert.equal(p.veredicto, MUDO);
  assert.match(p.motivo, /vivo pero callado/);
});

await prueba("fantasma: sin latido, sonda alcanzable, nada observado", () => {
  const ejes = conEje(ejesCiegos(), "escritura", { estado: SIN_DATO });
  assert.equal(
    evaluarPresencia({ senal: senalViva({ ts: hace(5 * 60 * 1000) }), ejes, ahoraMs: AHORA }).veredicto,
    FANTASMA,
  );
});

await prueba("no_observable: sin latido y fuera del alcance de TODOS los instrumentos", () => {
  const p = evaluarPresencia({ senal: senalViva({ ts: hace(5 * 60 * 1000) }), ejes: ejesCiegos(), ahoraMs: AHORA });
  assert.equal(p.veredicto, NO_OBSERVABLE_V);
  assert.match(p.motivo, /no es un fantasma/);
});

await prueba("amarrado: cerro limpio antes de callarse", () => {
  const ejes = conEje(ejesCiegos(), "escritura", { estado: SIN_DATO });
  assert.equal(
    evaluarPresencia({ senal: senalViva({ ts: hace(5 * 60 * 1000), estado: "termino" }), ejes, ahoraMs: AHORA }).veredicto,
    AMARRADO,
  );
});

await prueba("a_la_deriva: silencio mayor que la ventana", () => {
  const ejes = conEje(ejesCiegos(), "escritura", { estado: SIN_DATO });
  assert.equal(
    evaluarPresencia({ senal: senalViva({ ts: hace(30 * 60 * 1000) }), ejes, ahoraMs: AHORA, ventanaMs: 15 * 60 * 1000 }).veredicto,
    A_LA_DERIVA,
  );
});

await prueba("discordante gana a todo lo demas", () => {
  const ejes = conEje(ejesCiegos(), "liveness", { estado: OBSERVADO, valor: true });
  const p = evaluarPresencia({
    senal: senalViva(), ejes, ahoraMs: AHORA,
    contradicciones: [{ codigo: "D1", declarado: "pid 1 trabajando", observado: "pid 1 no existe" }],
  });
  assert.equal(p.veredicto, DISCORDANTE);
});

process.stdout.write("\nContradicciones: los tres casos y sus no-casos\n");

await prueba("D1: pid declarado inexistente", () => {
  const ejes = conEje(ejesCiegos(), "liveness", { estado: OBSERVADO, valor: false, motivo: "pid 99 no existe" });
  const c = detectarContradicciones({ senal: senalViva({ pid: 99 }), ejes, latidoFresco: true, ahoraMs: AHORA });
  assert.equal(c.length, 1);
  assert.equal(c[0].codigo, "D1");
  assert.equal(c[0].consecuencia_automatica, null, "el vigia no ejecuta nada por su cuenta");
});

await prueba("NO-CASO D1: EPERM nunca acusa", () => {
  const ejes = conEje(ejesCiegos(), "liveness", { estado: NO_OBSERVABLE, motivo: "EPERM" });
  assert.deepEqual(detectarContradicciones({ senal: senalViva({ pid: 99 }), ejes, latidoFresco: true, ahoraMs: AHORA }), []);
});

await prueba("NO-CASO D1: sin latido fresco no hay contradiccion", () => {
  const ejes = conEje(ejesCiegos(), "liveness", { estado: OBSERVADO, valor: false });
  const c = detectarContradicciones({ senal: senalViva({ pid: 99, ts: hace(600000) }), ejes, latidoFresco: false, ahoraMs: AHORA });
  assert.deepEqual(c, [], "un agente que termino y cerro su proceso no es un mentiroso");
});

await prueba("NO-CASO D1: quien declara cierre limpio y apaga su proceso no es acusado", () => {
  const ejes = conEje(ejesCiegos(), "liveness", { estado: OBSERVADO, valor: false, motivo: "pid 99 no existe" });
  const c = detectarContradicciones({
    senal: senalViva({ pid: 99, estado: "termino" }), ejes, latidoFresco: true, ahoraMs: AHORA,
  });
  assert.deepEqual(c, [], "apagar el proceso despues de decir 'termino' es comportarse bien");
});

await prueba("D2: actor de Ollama declarado sin residente que corresponda", () => {
  const ejes = conEje(ejesCiegos(), "residencia", {
    estado: OBSERVADO, valor: null, edad_ms: 3000, motivo: "ninguno corresponde",
  });
  const c = detectarContradicciones({
    senal: senalViva({ actor: "qwen2.5:7b", ts: hace(20000) }), ejes, latidoFresco: true, ahoraMs: AHORA,
  });
  assert.equal(c.length, 1);
  assert.equal(c[0].codigo, "D2");
});

await prueba("NO-CASO D2: muestra de /api/ps vieja no acusa", () => {
  const ejes = conEje(ejesCiegos(), "residencia", { estado: OBSERVADO, valor: null, edad_ms: 60000 });
  assert.deepEqual(
    detectarContradicciones({ senal: senalViva({ actor: "qwen2.5:7b", ts: hace(90000) }), ejes, latidoFresco: true, ahoraMs: AHORA }),
    [],
  );
});

await prueba("NO-CASO D2: carrera de desalojo (muestra anterior al latido) no acusa", () => {
  const ejes = conEje(ejesCiegos(), "residencia", { estado: OBSERVADO, valor: null, edad_ms: 10000 });
  assert.deepEqual(
    detectarContradicciones({ senal: senalViva({ actor: "qwen2.5:7b", ts: hace(2000) }), ejes, latidoFresco: true, ahoraMs: AHORA }),
    [],
    "la muestra es anterior al latido: es una carrera, no una mentira",
  );
});

await prueba("D3: produccion declarada sin ninguna corroboracion", () => {
  const ejes = { ...ejesCiegos() };
  ejes.residencia = { estado: OBSERVADO, valor: null, edad_ms: 60000, motivo: "sin residentes" };
  ejes.escritura = { estado: SIN_DATO, valor: null, motivo: "sin eventos nuevos" };
  const c = detectarContradicciones({
    senal: senalViva({ vitales: { tokens_por_s: 78 } }), ejes, latidoFresco: true,
    almacen: new AlmacenMedido(), nakamaId: "nami", ahoraMs: AHORA,
  });
  assert.equal(c.length, 1);
  assert.equal(c[0].codigo, "D3");
});

await prueba("NO-CASO D3: si una sonda esta inalcanzable, no se evalua", () => {
  const ejes = { ...ejesCiegos() };
  ejes.residencia = { estado: NO_OBSERVABLE, valor: null, motivo: "Ollama caido" };
  ejes.escritura = { estado: SIN_DATO, valor: null };
  assert.deepEqual(
    detectarContradicciones({
      senal: senalViva({ vitales: { tokens_por_s: 78 } }), ejes, latidoFresco: true,
      almacen: new AlmacenMedido(), nakamaId: "nami", ahoraMs: AHORA,
    }),
    [],
    "la ausencia de medicion nunca es contradiccion",
  );
});

await prueba("NO-CASO D3: con muestra medida en el almacen no hay contradiccion", () => {
  const almacen = new AlmacenMedido();
  almacen.registrar("nami", { tokens_por_s: 44, ts: hace(3000) });
  const ejes = { ...ejesCiegos() };
  ejes.residencia = { estado: OBSERVADO, valor: null, edad_ms: 60000 };
  ejes.escritura = { estado: SIN_DATO, valor: null };
  assert.deepEqual(
    detectarContradicciones({
      senal: senalViva({ vitales: { tokens_por_s: 78 } }), ejes, latidoFresco: true,
      almacen, nakamaId: "nami", ahoraMs: AHORA,
    }),
    [],
  );
});

process.stdout.write("\nLa campana y el movimiento\n");

function vigiaCon(senales, ejesPorNakama = {}) {
  const mundo = new Mundo({ barco, tripulacion, constituciones });
  return vigia({
    nakamas: tripulacion.nakamas,
    senales,
    constitucionDe: (id) => mundo.constitucionDe(id),
    observarDe: (id) => ejesPorNakama[id] || ejesCiegos(),
    ahoraMs: AHORA,
  });
}

await prueba("no_observable NUNCA suena en la campana", () => {
  const g = vigiaCon([{ nakama: "nami", actor: "rutina-cloud", estado: "trabajando", ts: hace(5 * 60 * 1000) }]);
  const nami = g.filas.find((f) => f.nakama === "nami");
  assert.equal(nami.presencia, NO_OBSERVABLE_V);
  assert.equal(g.campana.some((c) => c.nakama === "nami"), false, "una rutina en la nube no es un fantasma");
  assert.equal(SUENAN.includes(NO_OBSERVABLE_V), false);
});

await prueba("mudo y discordante si suenan", () => {
  const g = vigiaCon(
    [{ nakama: "nami", actor: "codex", estado: "trabajando", ts: hace(5 * 60 * 1000) }],
    { nami: conEje(ejesCiegos(), "liveness", { estado: OBSERVADO, valor: true }) },
  );
  assert.equal(g.campana.some((c) => c.nakama === "nami"), true);
});

await prueba("discordante NO se mueve; declarado si", () => {
  const g = vigiaCon(
    [
      { nakama: "nami", actor: "codex", estado: "trabajando", ts: hace(3000), pid: 99 },
      { nakama: "robin", actor: "rutina-cloud", estado: "trabajando", ts: hace(3000) },
    ],
    { nami: conEje(ejesCiegos(), "liveness", { estado: OBSERVADO, valor: false, motivo: "pid 99 no existe" }) },
  );
  const mueven = new Set(
    g.filas.filter((f) => f.presencia === A_BORDO || f.presencia === DECLARADO_V).map((f) => f.nakama),
  );
  assert.equal(g.filas.find((f) => f.nakama === "nami").presencia, DISCORDANTE);
  assert.equal(mueven.has("nami"), false, "moverse seria activamente enganoso");
  assert.equal(g.filas.find((f) => f.nakama === "robin").presencia, DECLARADO_V);
  assert.equal(mueven.has("robin"), true, "la regla dura pide latido fresco, no medicion");
});

process.stdout.write("\nchopper-salud\n");

await prueba("con TODAS las sondas caidas no sobrevive ni un numero", () => {
  const g = vigiaCon([
    { nakama: "nami", actor: "claude-code", estado: "trabajando", ts: hace(3000), vitales: { tokens_por_s: 78, latencia_ms: 312, contexto_pct: 68 } },
    { nakama: "chopper", actor: "qwen2.5:7b", estado: "trabajando", ts: hace(3000), vitales: { tokens_por_s: 22 } },
  ]);
  const informe = informeSalud({ filas: g.filas, almacen: new AlmacenMedido(), ahoraMs: AHORA });
  const conValor = informe.tripulacion.flatMap((t) => t.vitales).filter((v) => v.valor !== null);
  assert.deepEqual(conValor, [], `sobrevivieron ${conValor.length} numeros pese a no haber medido nada`);
  assert.equal(informe.resumen.vitales_con_valor_medido, 0);
});

await prueba("el 'no puedo medirte' es granular, por eje", () => {
  const g = vigiaCon(
    [{ nakama: "nami", actor: "claude-code", estado: "trabajando", ts: hace(3000) }],
    { nami: conEje(ejesCiegos(), "liveness", { estado: OBSERVADO, valor: true, motivo: "pid 7 existe" }) },
  );
  const t = informeSalud({ filas: g.filas, almacen: new AlmacenMedido(), ahoraMs: AHORA })
    .tripulacion.find((x) => x.nakama === "nami");
  const ejes = t.no_puedo_medirte.map((x) => x.eje);
  assert.equal(ejes.includes("liveness"), false, "liveness si se pudo observar");
  assert.equal(ejes.includes("memoria"), true, "memoria no, y se dice");
  assert.equal(t.ejes.liveness.estado, OBSERVADO);
});

await prueba("un numero medido siempre sale con su sello de antiguedad", () => {
  const almacen = new AlmacenMedido();
  for (const v of [40, 50, 60]) almacen.registrar("nami", { tokens_por_s: v, ts: hace(4000) });
  const g = vigiaCon([{ nakama: "nami", actor: "qwen2.5:7b", estado: "trabajando", ts: hace(3000) }]);
  const t = informeSalud({ filas: g.filas, almacen, ahoraMs: AHORA }).tripulacion.find((x) => x.nakama === "nami");
  const pulso = t.vitales.find((v) => v.nombre === "pulso");
  assert.equal(pulso.valor, 50);
  assert.equal(pulso.origen, OBSERVADO);
  assert.match(pulso.motivo, /muestra de hace \d+s/);
});

await prueba("lo que el agente afirma nunca entra como valor del parte", () => {
  const g = vigiaCon([
    { nakama: "nami", actor: "claude-code", estado: "trabajando", ts: hace(3000), vitales: { tokens_por_s: 999 } },
  ]);
  const t = informeSalud({ filas: g.filas, almacen: new AlmacenMedido(), ahoraMs: AHORA })
    .tripulacion.find((x) => x.nakama === "nami");
  assert.equal(t.vitales.find((v) => v.nombre === "pulso").valor, null);
  assert.equal(JSON.stringify(t).includes("999"), false, "el 999 declarado no puede aparecer en el parte");
});

process.stdout.write(`\n${pasadas} pasadas, ${fallos} fallidas\n\n`);
process.exit(fallos ? 1 : 0);
