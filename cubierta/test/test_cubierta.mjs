// Pruebas de la Cubierta. Sin framework, como el resto del repo:
//   node cubierta/test/test_cubierta.mjs
//
// Lo que se prueba aqui no es que el dibujo sea bonito, sino que el mundo no
// pueda mentir: que nadie se mueva sin actor, que nadie entre en la camara
// sellada, y que un dato ausente salga como "desconocido" y no como un numero.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { construirMapa, buscarRuta, buscarRutaEntreCubiertas, construirMapas, puertaDeSala } from "../shared/mapa.mjs";
import { MURO, PUERTA, SELLADO, INTERIOR } from "../shared/mapa.mjs";
import { Mundo } from "../server/mundo.mjs";
import { calcularVitales, calcularClima } from "../server/vitales.mjs";
import {
  evaluarPresencia, detectarDesvios, vigia,
  FANTASMA, AMARRADO, EN_PUERTO, A_BORDO,
} from "../server/latido.mjs";
import { NO_OBSERVABLE, SIN_DATO, OBSERVADO, EJES } from "../server/sondas.mjs";

// El vigia ahora exige sondas. Estas pruebas son del corte anterior (presencia
// declarada), asi que corren con el barco a ciegas: sin ningun eje observado,
// que es justo el escenario en el que aquellas reglas se definieron.
function ejesCiegos() {
  return Object.fromEntries(EJES.map((e) => [e, { estado: NO_OBSERVABLE, valor: null, fuente: "x", motivo: "sin sonda en esta prueba", edad_ms: null }]));
}
function ejesConEscritura() {
  return { ...ejesCiegos(), escritura: { estado: SIN_DATO, valor: null, fuente: "bitacora", motivo: "sin eventos nuevos", edad_ms: null } };
}
function presenciaDe(senal, opciones = {}) {
  // El equivalente del corte anterior: una sonda alcanzable que no ve nada, para
  // que `no_observable` no se coma los veredictos por silencio de instrumentos.
  return evaluarPresencia({ senal, ejes: ejesConEscritura(), ...opciones });
}
import { extraerRecado, hablar } from "../server/hablar.mjs";

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

function nuevoMundo() {
  return new Mundo({ barco, tripulacion, constituciones });
}

function correr(mundo, encarnados, veces) {
  for (let i = 0; i < veces; i++) mundo.tick(new Set(encarnados));
}

process.stdout.write("\nGeometria del barco\n");

await prueba("cada sala tiene muros, puerta e interior", () => {
  const entrepuente = barco.cubiertas.find((c) => c.id === "entrepuente");
  const mapa = construirMapa(entrepuente);
  const [px, py] = entrepuente.salas[0].puertas[0];
  assert.equal(mapa.celda(px, py), PUERTA, "la puerta declarada deberia ser PUERTA");
  assert.equal(mapa.celda(1, 1), MURO, "la esquina de la biblioteca deberia ser muro");
  assert.equal(mapa.celda(5, 4), INTERIOR, "el centro de la biblioteca deberia ser interior");
});

await prueba("el interior de la camara sellada no es transitable", () => {
  const bodega = barco.cubiertas.find((c) => c.id === "bodega");
  const mapa = construirMapa(bodega);
  const camara = bodega.salas.find((s) => s.id === "camara_sellada");
  const [rx, ry] = camara.rect;
  const dentro = [rx + 3, ry + 3];
  assert.equal(mapa.celda(...dentro), SELLADO);
  assert.equal(mapa.transitable(...dentro), false, "nadie puede pisar el interior de la camara");
  const puerta = puertaDeSala(mapa, "camara_sellada");
  assert.equal(mapa.transitable(...puerta), true, "la puerta si es pisable: hasta ahi se llega");
});

await prueba("hay ruta dentro de una cubierta y entre cubiertas", () => {
  const mapas = construirMapas(barco);
  const ruta = buscarRuta(mapas.get("entrepuente"), [5, 4], [19, 4]);
  assert.ok(ruta && ruta.length > 2, "deberia haber camino de la biblioteca al taller");
  const tramos = buscarRutaEntreCubiertas(
    mapas,
    { cubierta: "cubierta", tile: [12, 10] },
    { cubierta: "bodega", tile: [5, 4] },
  );
  assert.ok(tramos, "deberia haber camino de la cubierta a la bodega");
  assert.equal(tramos[0].cubierta, "cubierta");
  assert.equal(tramos[tramos.length - 1].cubierta, "bodega");
});

process.stdout.write("\nRegla dura: sin actor no hay movimiento\n");

await prueba("un personaje sin actor no se mueve aunque tenga recado", () => {
  const mundo = nuevoMundo();
  const antes = [...mundo.posiciones.get("robin").tile];
  const recado = mundo.crearRecado({ nakama: "robin", objetivo: "leer poneglifos", recursos: ["archivo_frio"] });
  correr(mundo, [], 60);
  const despues = mundo.posiciones.get("robin").tile;
  assert.deepEqual(despues, antes, "robin no puede haberse movido sin actor");
  assert.equal(recado.estado, "pendiente_encarnacion");
  assert.match(recado.motivo, /no tiene actor/);
});

await prueba("con actor, el mismo recado baja al personaje a la bodega y lo trae de vuelta", () => {
  const mundo = nuevoMundo();
  const puesto = [...mundo.posiciones.get("robin").tile];
  const recado = mundo.crearRecado({ nakama: "robin", objetivo: "leer poneglifos", recursos: ["archivo_frio"] });
  const cubiertasVisitadas = new Set();
  for (let i = 0; i < 200; i++) {
    mundo.tick(new Set(["robin"]));
    cubiertasVisitadas.add(mundo.posiciones.get("robin").cubierta);
  }
  assert.ok(cubiertasVisitadas.has("bodega"), "el archivo esta en la bodega: robin tiene que bajar");
  assert.equal(recado.estado, "hecho");
  assert.equal(mundo.artefactos.length, 1, "al cerrar el recado queda un artefacto");
  const pos = mundo.posiciones.get("robin");
  assert.equal(pos.cubierta, "entrepuente", "y luego vuelve a su puesto");
  assert.deepEqual(pos.tile, puesto);
});

process.stdout.write("\nLa camara sellada\n");

await prueba("Chopper llega a la PUERTA de la camara y se queda esperando llave", () => {
  const mundo = nuevoMundo();
  const recado = mundo.crearRecado({
    nakama: "chopper",
    objetivo: "consultar un caso",
    recursos: ["diagnostico", "clinico_protegido"],
  });
  correr(mundo, ["chopper"], 400);
  const mapa = mundo.mapas.get("bodega");
  const pos = mundo.posiciones.get("chopper");
  assert.equal(recado.estado, "esperando_llave");
  assert.equal(pos.cubierta, "bodega");
  assert.deepEqual(pos.tile, puertaDeSala(mapa, "camara_sellada"), "debe estar EN la puerta");
  assert.equal(mapa.celda(...pos.tile), PUERTA, "y la puerta no es el interior");
});

await prueba("la llave concedida no mete a nadie dentro: solo deja salir un opaco", () => {
  const mundo = nuevoMundo();
  const recado = mundo.crearRecado({ nakama: "chopper", objetivo: "consultar un caso", recursos: ["clinico_protegido"] });
  correr(mundo, ["chopper"], 400);
  assert.equal(recado.estado, "esperando_llave");
  const r = mundo.resolverLlave(recado.id, "conceder", "consulta puntual");
  assert.equal(r.ok, true);
  const paso = recado.pasos[0];
  assert.equal(paso.estado, "hecho");
  assert.ok(paso.identificador_opaco, "lo que cruza es un identificador opaco");
  assert.match(paso.motivo, /sin contenido/);
  correr(mundo, ["chopper"], 20);
  const salaFinal = mundo.mapas.get(mundo.posiciones.get("chopper").cubierta)
    .sala(...mundo.posiciones.get("chopper").tile);
  assert.notEqual(salaFinal, "camara_sellada");
});

await prueba("la llave denegada detiene el recado y lo dice", () => {
  const mundo = nuevoMundo();
  const recado = mundo.crearRecado({ nakama: "chopper", objetivo: "consultar un caso", recursos: ["clinico_protegido"] });
  correr(mundo, ["chopper"], 400);
  mundo.resolverLlave(recado.id, "denegar");
  assert.equal(recado.estado, "denegado");
  assert.match(recado.motivo, /denego la llave/);
});

await prueba("un recurso fuera de constitucion nace denegado, no se intenta", () => {
  const mundo = nuevoMundo();
  const recado = mundo.crearRecado({ nakama: "robin", objetivo: "compilar", recursos: ["codigo"] });
  assert.equal(recado.pasos[0].estado, "denegado");
  correr(mundo, ["robin"], 40);
  assert.equal(recado.estado, "denegado");
});

process.stdout.write("\nRecados: latidos repetidos no multiplican encargos\n");

await prueba("un latido que repite la misma tarea reutiliza el recado vivo", () => {
  const mundo = nuevoMundo();
  const uno = mundo.crearRecado({ nakama: "franky", objetivo: "montar el andamiaje", recursos: ["codigo", "plantillas"] });
  const equivalente = mundo.recadoEquivalente({ nakama: "franky", objetivo: "montar el andamiaje", recursos: ["plantillas", "codigo"] });
  assert.equal(equivalente?.id, uno.id, "mismo personaje, objetivo y recursos: es el mismo encargo");
  assert.equal(mundo.recados.length, 1);
});

await prueba("otra tarea distinta si abre recado nuevo", () => {
  const mundo = nuevoMundo();
  mundo.crearRecado({ nakama: "franky", objetivo: "montar el andamiaje", recursos: ["codigo"] });
  const otro = mundo.recadoEquivalente({ nakama: "franky", objetivo: "otra cosa", recursos: ["codigo"] });
  assert.equal(otro, null);
});

await prueba("el historial de recados no crece sin fin", () => {
  const mundo = nuevoMundo();
  for (let i = 0; i < 60; i++) {
    const r = mundo.crearRecado({ nakama: "franky", objetivo: `tarea ${i}`, recursos: ["codigo"] });
    r.estado = "hecho";
  }
  const vivo = mundo.crearRecado({ nakama: "nami", objetivo: "vivo", recursos: ["conectores"] });
  assert.ok(mundo.recados.length <= 45, `se poda el historial, quedaron ${mundo.recados.length}`);
  assert.ok(mundo.recados.some((r) => r.id === vivo.id), "un recado vivo nunca se poda");
});

process.stdout.write("\nVitales y clima: nada se estima\n");

await prueba("sin senal, todo vital sale desconocido y con motivo", () => {
  const vitales = calcularVitales({ senal: null, residente: null, sueno: null, nakamaId: "nami" });
  for (const v of vitales) {
    assert.equal(v.valor, null);
    assert.equal(v.tinta, "desconocido");
    assert.ok(v.motivo, `${v.nombre} deberia explicar por que no hay dato`);
  }
});

await prueba("con senal, el pulso es medido y sale del dato real", () => {
  const vitales = calcularVitales({ senal: { vitales: { tokens_por_s: 78, latencia_ms: 312 } }, nakamaId: "nami" });
  const pulso = vitales.find((v) => v.nombre === "pulso");
  assert.equal(pulso.valor, 78);
  assert.equal(pulso.tinta, "medido");
});

await prueba("la fusion solo aplica al personaje que durmio", () => {
  const sueno = { personaje: "Groot", racha: 18 };
  const deNami = calcularVitales({ nakamaId: "nami", sueno }).find((v) => v.nombre === "fusion");
  assert.equal(deNami.valor, null);
  assert.match(deNami.motivo, /no aparece en el ultimo ciclo/);
});

await prueba("sin fuentes, el clima es desconocido y no inventa un porcentaje", () => {
  const clima = calcularClima({ fuentes: [], encarnaciones: [], recados: [], nakamas: [] });
  assert.equal(clima.resumen.estado, "desconocido");
  for (const eje of Object.values(clima.ejes)) {
    assert.equal(eje.valor, null);
    assert.equal(eje.tinta, "desconocido");
  }
});

process.stdout.write("\nEl vigia: ver sin vigilar\n");

await prueba("quien nunca emitio senal esta en puerto, no desertado", () => {
  const p = presenciaDe(null).veredicto ? { estado: presenciaDe(null).veredicto } : null;
  assert.equal(p.estado, EN_PUERTO);
});

await prueba("quien dijo que trabajaba y dejo de latir sale FANTASMA", () => {
  const ahoraMs = Date.now();
  const p = presenciaDe({ ts: new Date(ahoraMs - 5 * 60 * 1000).toISOString(), estado: "trabajando" }, { ahoraMs });
  assert.equal(p.veredicto, FANTASMA);
  assert.match(p.motivo, /sigue dibujado pero no esta verificado/);
});

await prueba("quien cerro su tarea antes de callarse sale amarrado, no fantasma", () => {
  const ahoraMs = Date.now();
  const p = presenciaDe({ ts: new Date(ahoraMs - 5 * 60 * 1000).toISOString(), estado: "termino" }, { ahoraMs });
  assert.equal(p.veredicto, AMARRADO);
});

await prueba("un desvio se anota como pendiente y sin consecuencia automatica", () => {
  const mundo = nuevoMundo();
  const desvios = detectarDesvios({
    senal: { actor: "antigravity-local", recursos: ["codigo"], ts: new Date().toISOString() },
    constitucion: mundo.constitucionDe("zoro"),
    nakama: mundo.nakama("zoro"),
  });
  assert.equal(desvios.length, 1);
  assert.equal(desvios[0].veredicto, "pendiente");
  assert.equal(desvios[0].consecuencia_automatica, null, "el vigia no ejecuta nada por su cuenta");
});

await prueba("un fantasma NO anda: el movimiento exige latido verificado", () => {
  const mundo = nuevoMundo();
  const ahoraMs = Date.now();
  // Robin dijo que trabajaba hace 5 minutos y dejo de latir.
  const senales = [{ nakama: "robin", actor: "claude-code", estado: "trabajando", ts: new Date(ahoraMs - 5 * 60 * 1000).toISOString() }];
  const g = vigia({
    nakamas: tripulacion.nakamas, senales,
    constitucionDe: (id) => mundo.constitucionDe(id),
    observarDe: () => ejesConEscritura(),
    ahoraMs,
  });
  const verificados = new Set(g.filas.filter((f) => f.presencia === A_BORDO).map((f) => f.nakama));
  assert.equal(verificados.has("robin"), false, "un fantasma no cuenta como encarnado verificado");

  const puesto = [...mundo.posiciones.get("robin").tile];
  mundo.crearRecado({ nakama: "robin", objetivo: "bajar al archivo", recursos: ["archivo_frio"] });
  correr(mundo, [...verificados], 200);
  assert.deepEqual(mundo.posiciones.get("robin").tile, puesto, "el sprite sigue dibujado, pero no se ha movido");
});

await prueba("la campana suena por fantasmas y desvios, y solo por eso", () => {
  const mundo = nuevoMundo();
  const ahoraMs = Date.now();
  const g = vigia({
    nakamas: tripulacion.nakamas,
    senales: [
      { nakama: "franky", actor: "codex", estado: "trabajando", ts: new Date(ahoraMs - 6 * 60 * 1000).toISOString() },
      { nakama: "nami", actor: "claude-code", estado: "trabajando", ts: new Date(ahoraMs - 10 * 1000).toISOString() },
    ],
    constitucionDe: (id) => mundo.constitucionDe(id),
    observarDe: () => ejesConEscritura(),
    ahoraMs,
  });
  const nombres = g.campana.map((c) => c.nakama);
  assert.ok(nombres.includes("franky"), "franky lleva 6 min sin latir: fantasma");
  assert.ok(!nombres.includes("nami"), "nami acaba de latir: no hay nada que avisar");
});

process.stdout.write("\nHablar\n");

await prueba("sin backend configurado, el nakama no habla y explica por que", async () => {
  const mundo = nuevoMundo();
  const r = await hablar({
    nakama: mundo.nakama("nami"),
    constitucion: mundo.constitucionDe("nami"),
    percepcion: {},
    texto: "hola",
    env: { CUBIERTA_LLM: "ninguno" },
  });
  assert.equal(r.encarnado, false);
  assert.ok(r.motivo.length > 0);
  assert.equal(r.texto, undefined, "no hay respuesta enlatada de relleno");
});

await prueba("se extrae el recado que el nakama propone al final de su mensaje", () => {
  const { limpio, recado } = extraerRecado("Voy a mirarlo.\nRECADO: contexto_indexado, archivo_frio :: fechar la ola de ingesta");
  assert.equal(limpio, "Voy a mirarlo.");
  assert.deepEqual(recado.recursos, ["contexto_indexado", "archivo_frio"]);
  assert.equal(recado.objetivo, "fechar la ola de ingesta");
});

process.stdout.write(`\n${pasadas} pasadas, ${fallos} fallidas\n\n`);
process.exit(fallos ? 1 : 0);
