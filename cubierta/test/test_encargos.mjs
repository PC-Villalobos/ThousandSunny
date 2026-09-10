// Pruebas del Encargo. Sin framework, como el resto del repo:
//   node cubierta/test/test_encargos.mjs
//
// Lo que se prueba aqui no es que el encargo funcione, sino que no pueda mentir:
// que lo que el Capitan ve sea literalmente lo que se manda, que lo clinico no
// llegue a existir dentro del registro, que un limite corte antes de gastar, que
// sin actor no aparezca un resultado de relleno, y que cerrar la Cubierta y
// abrirla no pierda ni invente nada.

import assert from "node:assert/strict";

import {
  crearEncargo, admitirFuente, dossier, autorizar, puedeEjecutar,
  anotarTurnoDelCapitan, ejecutar, cambiarConexion, revisar,
  RegistroEncargos, opacoDe,
  ABIERTO, EN_CURSO, ESPERANDO_REVISION, ACEPTADO, DEVUELTO, AGOTADO, BLOQUEADO,
} from "../server/encargos.mjs";

let fallos = 0;
let pasadas = 0;
async function prueba(nombre, fn) {
  try {
    await fn();
    pasadas += 1;
    process.stdout.write(`  ok  ${nombre}\n`);
  } catch (err) {
    fallos += 1;
    process.stdout.write(`FALLA  ${nombre}\n       ${err.message}\n`);
  }
}

// Encargo de referencia: las tarifas del Capitan. Informacion real y NO clinica,
// que es exactamente el material con el que este circuito debia estrenarse.
function encargoTarifas(extra = {}) {
  return crearEncargo({
    objetivo: "Redactar el bloque de tarifas para el catalogo publico",
    resultado_esperado: "Tres lineas: precio, duracion y modalidad, sin adornos",
    responsable: { nakama: "nami" },
    contexto: {
      fuentes: [{
        id: "tarifas-2026",
        titulo: "Tarifas fijadas por el Capitan",
        clase: "publico",
        contenido: "Sesion de 60 min: 60 EUR. Sesion de 90 min: 85 EUR. Bono de 10 sesiones: 500 EUR.",
      }],
    },
    autonomia: { acciones: ["leer", "redactar"] },
    conexion: { proveedor: "ollama", modelo: "qwen2.5:7b", presupuesto: { llamadas_max: 3 } },
    ...extra,
  });
}

function actorQueResponde(texto = "60 min / 60 EUR / consulta.", uso = { tokens: 120, coste_eur: 0.01 }) {
  const visto = [];
  const llamar = async (paquete) => {
    visto.push(paquete);
    return { encarnado: true, texto, actor: "ollama:qwen2.5:7b", uso };
  };
  return { llamar, visto };
}

process.stdout.write("\nAdmision de contexto\n");

await prueba("una fuente clinica pierde el contenido EN LA ADMISION, no al enseniarla", () => {
  const f = admitirFuente({
    id: "sesion-S14", titulo: "Transcripcion S14", clase: "clinico_protegido",
    contenido: "texto clinico que nunca deberia quedarse aqui",
  });
  assert.equal(f.contenido, null, "el registro no llega a guardar el contenido clinico");
  assert.equal(f.opaco, opacoDe("sesion-S14"));
  assert.ok(f.motivo_sin_contenido.includes("identificador opaco"));
});

await prueba("una clase desconocida se trata como la mas estricta, no como la mas comoda", () => {
  const f = admitirFuente({ id: "x", clase: "confidencial-ish", contenido: "algo" });
  assert.equal(f.clase, "clinico_protegido");
  assert.equal(f.contenido, null);
});

await prueba("el opaco identifica la referencia, no el contenido", () => {
  const a = admitirFuente({ id: "sesion-S14", clase: "clinico_protegido", contenido: "AAA" });
  const b = admitirFuente({ id: "sesion-S14", clase: "clinico_protegido", contenido: "BBB" });
  assert.equal(a.opaco, b.opaco, "el mismo material se reconoce entre sesiones");
});

process.stdout.write("\nEl dossier\n");

await prueba("el dossier ensenia lo incluido y declara lo omitido con su motivo", () => {
  const e = crearEncargo({
    objetivo: "preparar el parte", responsable: { nakama: "chopper" },
    contexto: { fuentes: [
      { id: "tarifas", clase: "publico", contenido: "60 EUR" },
      { id: "sesion-S14", clase: "clinico_protegido", contenido: "clinico" },
      { id: "vacia", clase: "interno" },
    ] },
  });
  const d = dossier(e);
  assert.equal(d.fuentes.length, 1);
  assert.equal(d.fuentes[0].id, "tarifas");
  assert.equal(d.omitidas.length, 2);
  assert.ok(d.omitidas.every((o) => o.motivo));
  assert.equal(d.sello.fuentes_omitidas, 2);
  assert.ok(!JSON.stringify(d).includes("clinico\""), "ningun rastro del contenido clinico en el paquete");
});

await prueba("la procedencia por turno no viaja al modelo, pero se cuenta en el sello", async () => {
  const e = encargoTarifas();
  anotarTurnoDelCapitan(e, "hazlo");
  const { llamar } = actorQueResponde();
  await ejecutar(e, { llamar });
  const d = dossier(e);
  assert.ok(d.continuidad.every((t) => !("actor" in t)), "el hilo que se manda es papel + texto");
  assert.deepEqual(d.sello.actores_en_continuidad, ["capitan", "ollama:qwen2.5:7b"]);
});

await prueba("lo que se ve es lo que se manda: ejecutar no arma otro paquete", async () => {
  const e = encargoTarifas();
  anotarTurnoDelCapitan(e, "redacta el bloque");
  const previsto = dossier(e);
  const { llamar, visto } = actorQueResponde();
  await ejecutar(e, { llamar });
  assert.equal(visto.length, 1);
  assert.deepEqual(visto[0], previsto, "el payload enviado es identico al dossier que vio el Capitan");
});

process.stdout.write("\nAutonomia\n");

await prueba("una accion no concedida se deniega y queda anotada como desvio", () => {
  const e = encargoTarifas();
  const r = autorizar(e, "enviar_fuera");
  assert.equal(r.ok, false);
  assert.equal(e.desvios.length, 1);
  assert.equal(e.desvios[0].veredicto, "pendiente", "la sentencia es del Capitan, no automatica");
});

await prueba("una accion fuera del vocabulario no se cuela por texto libre", () => {
  const e = crearEncargo({
    objetivo: "x", responsable: { nakama: "nami" },
    autonomia: { acciones: ["redactar", "borrar_el_disco"] },
  });
  assert.deepEqual(e.autonomia.acciones, ["redactar"]);
  assert.deepEqual(e.autonomia.acciones_no_reconocidas, ["borrar_el_disco"]);
  assert.equal(autorizar(e, "borrar_el_disco").ok, false);
});

await prueba("sin 'redactar' concedido el encargo se bloquea y NO llama a nadie", async () => {
  const e = crearEncargo({
    objetivo: "x", responsable: { nakama: "nami" }, autonomia: { acciones: ["leer"] },
  });
  const { llamar, visto } = actorQueResponde();
  const r = await ejecutar(e, { llamar });
  assert.equal(r.ok, false);
  assert.equal(e.estado, BLOQUEADO);
  assert.equal(visto.length, 0, "la denegacion corta antes de la llamada");
});

await prueba("las acciones graves quedan marcadas aparte cuando se conceden", () => {
  const e = crearEncargo({
    objetivo: "x", responsable: { nakama: "zoro" },
    autonomia: { acciones: ["redactar", "escribir_disco"] },
  });
  assert.deepEqual(e.autonomia.graves_concedidas, ["escribir_disco"]);
});

process.stdout.write("\nPresupuesto\n");

await prueba("el limite de llamadas corta ANTES de gastar la siguiente", async () => {
  const e = encargoTarifas();
  e.conexion.presupuesto.llamadas_max = 1;
  const { llamar, visto } = actorQueResponde();
  await ejecutar(e, { llamar });
  assert.equal(visto.length, 1);
  const r = await ejecutar(e, { llamar });
  assert.equal(r.ok, false);
  assert.equal(e.presupuesto_agotado, true);
  assert.equal(visto.length, 1, "la segunda llamada no llego a salir");
});

await prueba("un turno estimado que rebasaria el limite no se lanza, y no agota el encargo", async () => {
  const e = encargoTarifas();
  e.conexion.presupuesto.tokens_max = 100;
  const { llamar, visto } = actorQueResponde();
  const r = await ejecutar(e, { llamar, tokens_estimados: 500 });
  assert.equal(r.ok, false);
  assert.equal(visto.length, 0);
  assert.notEqual(e.estado, AGOTADO, "el encargo sigue vivo: lo que no cabe es ese turno");
});

await prueba("quedarse sin presupuesto no borra un resultado que espera revision", async () => {
  const e = encargoTarifas();
  e.conexion.presupuesto.llamadas_max = 1;
  await ejecutar(e, { llamar: actorQueResponde("el bloque redactado").llamar });
  assert.equal(e.estado, ESPERANDO_REVISION);
  await ejecutar(e, { llamar: actorQueResponde().llamar });
  assert.equal(e.presupuesto_agotado, true, "el limite queda anotado");
  assert.equal(e.estado, ESPERANDO_REVISION, "lo ya pagado sigue siendo revisable");
  const r = revisar(e, { decision: "aceptar" });
  assert.equal(r.ok, true);
  assert.equal(e.resultado_aceptado.texto, "el bloque redactado");
});

await prueba("sin nada pendiente, agotar el presupuesto si deja el encargo agotado", async () => {
  const e = encargoTarifas();
  e.conexion.presupuesto.llamadas_max = 1;
  await ejecutar(e, { llamar: actorQueResponde().llamar });
  revisar(e, { decision: "devolver", nota: "otra vez" });
  await ejecutar(e, { llamar: actorQueResponde().llamar });
  assert.equal(e.estado, AGOTADO);
});

await prueba("un encargo agotado no vuelve a llamar aunque se le suba el limite por la puerta de atras", async () => {
  const e = encargoTarifas();
  e.conexion.presupuesto.llamadas_max = 1;
  await ejecutar(e, { llamar: actorQueResponde().llamar });
  revisar(e, { decision: "devolver" });
  await ejecutar(e, { llamar: actorQueResponde().llamar });
  const { llamar, visto } = actorQueResponde();
  const r = await ejecutar(e, { llamar });
  assert.equal(r.ok, false);
  assert.equal(visto.length, 0);
});

await prueba("un consumo que el proveedor no informa se declara, no se estima", async () => {
  const e = encargoTarifas();
  const { llamar } = actorQueResponde("hecho", { tokens: 90 });
  await ejecutar(e, { llamar });
  assert.equal(e.consumo.tokens, 90);
  assert.equal(e.consumo.coste_eur, 0);
  assert.equal(e.consumo.sin_informar.coste, true);
  assert.ok(e.consumo.sin_informar.nota.includes("no se estima"));
});

process.stdout.write("\nSin actor no hay resultado\n");

await prueba("si el actor no esta alcanzable el encargo NO avanza y no inventa salida", async () => {
  const e = encargoTarifas();
  const r = await ejecutar(e, { llamar: async () => ({ encarnado: false, motivo: "ollama no responde" }) });
  assert.equal(r.ok, false);
  assert.equal(e.estado, ABIERTO, "vuelve a estar abierto, no esperando revision");
  assert.equal(e.continuidad.length, 0, "no hay turno de relleno");
  assert.equal(e.intentos[0].motivo, "ollama no responde");
  assert.equal(e.consumo.llamadas, 0, "una llamada que no produjo nada no se cobra como turno");
});

await prueba("un error del actor se captura como intento fallido, no como excepcion suelta", async () => {
  const e = encargoTarifas();
  const r = await ejecutar(e, { llamar: async () => { throw new Error("ECONNREFUSED"); } });
  assert.equal(r.ok, false);
  assert.ok(e.intentos[0].motivo.includes("ECONNREFUSED"));
  assert.equal(e.consumo.errores, 1);
});

process.stdout.write("\nContinuidad y costura\n");

await prueba("cambiar de proveedor conserva el hilo y anota donde se cambio", async () => {
  const e = encargoTarifas();
  anotarTurnoDelCapitan(e, "primera vuelta");
  await ejecutar(e, { llamar: actorQueResponde("respuesta local").llamar });
  cambiarConexion(e, { proveedor: "openai_compat", modelo: "gpt-x" });
  assert.equal(e.continuidad.length, 2, "el hilo pertenece al encargo, no al proveedor");
  assert.equal(e.costuras[0].tras_turno, 2);
  assert.equal(e.costuras[0].de.proveedor, "ollama");
  assert.equal(e.costuras[0].a.proveedor, "openai_compat");
});

await prueba("cada turno conserva quien lo escribio aunque el proveedor cambie", async () => {
  const e = encargoTarifas();
  await ejecutar(e, { llamar: async () => ({ encarnado: true, texto: "A", actor: "ollama:qwen2.5:7b" }) });
  cambiarConexion(e, { proveedor: "openai_compat", modelo: "gpt-x" });
  e.estado = ABIERTO;
  await ejecutar(e, { llamar: async () => ({ encarnado: true, texto: "B", actor: "openai_compat:gpt-x" }) });
  assert.deepEqual(e.continuidad.map((t) => t.actor), ["ollama:qwen2.5:7b", "openai_compat:gpt-x"]);
});

await prueba("el presupuesto sobrevive al cambio de conexion si no se declara otro", () => {
  const e = encargoTarifas();
  e.conexion.presupuesto.llamadas_max = 7;
  cambiarConexion(e, { proveedor: "openai_compat", modelo: "gpt-x" });
  assert.equal(e.conexion.presupuesto.llamadas_max, 7);
});

await prueba("un turno vacio del Capitan no se anota", () => {
  const e = encargoTarifas();
  assert.throws(() => anotarTurnoDelCapitan(e, "   "));
  assert.equal(e.continuidad.length, 0);
});

process.stdout.write("\nRevision\n");

await prueba("un encargo que nadie reviso no esta hecho: esta esperando", async () => {
  const e = encargoTarifas();
  await ejecutar(e, { llamar: actorQueResponde().llamar });
  assert.equal(e.estado, ESPERANDO_REVISION);
  assert.equal(e.resultado_aceptado, null);
});

await prueba("aceptar fija el resultado con el turno y el actor que lo produjo", async () => {
  const e = encargoTarifas();
  await ejecutar(e, { llamar: actorQueResponde("60/60, 90/85, bono 500").llamar });
  const r = revisar(e, { decision: "aceptar", nota: "sirve" });
  assert.equal(r.ok, true);
  assert.equal(e.estado, ACEPTADO);
  assert.equal(e.resultado_aceptado.texto, "60/60, 90/85, bono 500");
  assert.equal(e.resultado_aceptado.actor, "ollama:qwen2.5:7b");
});

await prueba("devolver reabre el encargo con la nota del Capitan", async () => {
  const e = encargoTarifas();
  await ejecutar(e, { llamar: actorQueResponde().llamar });
  revisar(e, { decision: "devolver", nota: "falta la modalidad" });
  assert.equal(e.estado, DEVUELTO);
  assert.equal(e.motivo, "falta la modalidad");
});

await prueba("no se revisa lo que nadie ha ejecutado", () => {
  const e = encargoTarifas();
  const r = revisar(e, { decision: "aceptar" });
  assert.equal(r.ok, false);
  assert.ok(r.motivo.includes("no esta esperando revision"));
});

await prueba("un encargo aceptado no se vuelve a ejecutar", async () => {
  const e = encargoTarifas();
  await ejecutar(e, { llamar: actorQueResponde().llamar });
  revisar(e, { decision: "aceptar" });
  const { llamar, visto } = actorQueResponde();
  const r = await ejecutar(e, { llamar });
  assert.equal(r.ok, false);
  assert.equal(visto.length, 0);
});

process.stdout.write("\nValidacion de apertura\n");

await prueba("un encargo sin objetivo no es un encargo", () => {
  assert.throws(() => crearEncargo({ responsable: { nakama: "nami" } }), /objetivo/);
});

await prueba("un encargo sin responsable no se abre", () => {
  assert.throws(() => crearEncargo({ objetivo: "algo" }), /responsable/);
});

process.stdout.write("\nEl diario\n");

await prueba("cerrar la Cubierta y abrirla devuelve el mismo encargo", async () => {
  const diario = [];
  const reg = new RegistroEncargos({ escribir: async (ev) => { diario.push(ev); } });
  const e = await reg.abrir({
    objetivo: "Redactar el bloque de tarifas",
    responsable: { nakama: "nami" },
    contexto: { fuentes: [{ id: "tarifas-2026", clase: "publico", contenido: "60 EUR / 85 EUR / 500 EUR" }] },
    autonomia: { acciones: ["leer", "redactar"] },
    conexion: { proveedor: "ollama", modelo: "qwen2.5:7b" },
  });
  await reg.decir(e.id, "empieza por el bono");
  await reg.ejecutar(e.id, { llamar: actorQueResponde("bono de 10 sesiones: 500 EUR").llamar });
  await reg.revisar(e.id, { decision: "aceptar", nota: "vale" });

  const otra = RegistroEncargos.reconstruir(diario);
  const rec = otra.obtener(e.id);
  assert.equal(rec.estado, ACEPTADO);
  assert.equal(rec.objetivo, e.objetivo);
  assert.equal(rec.continuidad.length, 2);
  assert.equal(rec.resultado_aceptado.texto, "bono de 10 sesiones: 500 EUR");
  assert.equal(rec.contexto.fuentes[0].contenido, "60 EUR / 85 EUR / 500 EUR");
});

await prueba("reconstruir reaplica hechos: no vuelve a llamar a ningun actor", async () => {
  const diario = [];
  const reg = new RegistroEncargos({ escribir: async (ev) => { diario.push(ev); } });
  const e = await reg.abrir(encargoCrudoMinimo());
  const { llamar, visto } = actorQueResponde();
  await reg.ejecutar(e.id, { llamar });
  assert.equal(visto.length, 1);
  RegistroEncargos.reconstruir(diario);
  assert.equal(visto.length, 1, "un turno que costo dinero no se paga otra vez al abrir");
});

await prueba("el diario tampoco guarda contenido clinico", async () => {
  const diario = [];
  const reg = new RegistroEncargos({ escribir: async (ev) => { diario.push(ev); } });
  await reg.abrir({
    objetivo: "parte de un caso", responsable: { nakama: "chopper" },
    contexto: { fuentes: [{ id: "sesion-S14", clase: "clinico_protegido", contenido: "SECRETO_CLINICO" }] },
  });
  assert.ok(!JSON.stringify(diario).includes("SECRETO_CLINICO"));
});

await prueba("un intento fallido queda en el diario y se recupera al reconstruir", async () => {
  const diario = [];
  const reg = new RegistroEncargos({ escribir: async (ev) => { diario.push(ev); } });
  const e = await reg.abrir(encargoCrudoMinimo());
  await reg.ejecutar(e.id, { llamar: async () => ({ encarnado: false, motivo: "sin backend" }) });
  const rec = RegistroEncargos.reconstruir(diario).obtener(e.id);
  assert.equal(rec.intentos.length, 1);
  assert.equal(rec.intentos[0].motivo, "sin backend");
  assert.equal(rec.estado, ABIERTO);
});

await prueba("la costura de proveedor sobrevive a la reconstruccion", async () => {
  const diario = [];
  const reg = new RegistroEncargos({ escribir: async (ev) => { diario.push(ev); } });
  const e = await reg.abrir(encargoCrudoMinimo());
  await reg.ejecutar(e.id, { llamar: actorQueResponde("A").llamar });
  await reg.cambiarConexion(e.id, { proveedor: "openai_compat", modelo: "gpt-x" });
  const rec = RegistroEncargos.reconstruir(diario).obtener(e.id);
  assert.equal(rec.conexion.proveedor, "openai_compat");
  assert.equal(rec.costuras.length, 1);
  assert.equal(rec.continuidad.length, 1, "el hilo se hereda entero");
});

await prueba("la bandera de presupuesto agotado sobrevive a la reconstruccion", async () => {
  const diario = [];
  const reg = new RegistroEncargos({ escribir: async (ev) => { diario.push(ev); } });
  const e = await reg.abrir({ ...encargoCrudoMinimo(), conexion: { proveedor: "ollama", presupuesto: { llamadas_max: 1 } } });
  await reg.ejecutar(e.id, { llamar: actorQueResponde().llamar });
  await reg.revisar(e.id, { decision: "devolver" });
  await reg.ejecutar(e.id, { llamar: actorQueResponde().llamar });
  const rec = RegistroEncargos.reconstruir(diario).obtener(e.id);
  assert.equal(rec.presupuesto_agotado, true);
  assert.equal(rec.estado, AGOTADO);
});

function encargoCrudoMinimo() {
  return {
    objetivo: "algo real", responsable: { nakama: "nami" },
    autonomia: { acciones: ["leer", "redactar"] },
    conexion: { proveedor: "ollama", modelo: "qwen2.5:7b" },
  };
}

process.stdout.write(`\n${pasadas} pasadas, ${fallos} fallidas\n\n`);
process.exit(fallos ? 1 : 0);
