// Pruebas del puerto de Vegapunk (Fase 0). Ejecutar con:
//   node --test state/vegapunk/vegapunk.test.mjs
//
// Verdades plantadas en los fixtures sinteticos:
//   - Z1_IDENTIDAD/pseudonimos.json es el compartimento de identidad: NUNCA se abre.
//   - metafora_trampa.md se declara metafora y arrastra relacion asistencial:
//     debe reclasificarse a asistencial (gana la clase mas restrictiva).
//   - metafora_limpia.md es metafora de verdad: debe salir en claro, incluso al adaptador.
//   - cuantificado_serie.md es el unico con puerta a investigacion abierta.
//   - asistencial_episodio.md e intimo_nota.md no salen nunca literales por el muelle.

import { test, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACTOR, CLASE, FINALIDAD, NIVEL, PARADA, SUJETO, ZONA,
  admitir, asiento, circuitoFase0, clasificar, empaquetar, inventariar,
  marcadoresIdentidad, masRestrictiva, nivelDeSalida, puerta, verificarFuga
} from "./vegapunk.mjs";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const uno = (regs, nombre) => regs.find((r) => r.rel.endsWith(nombre));

afterEach(() => mock.restoreAll());

function tmpFixture(nombre, contenido) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "vegapunk-"));
  fs.writeFileSync(path.join(d, nombre), contenido, "utf8");
  return d;
}

// Cabecera sintetica valida, para fixtures de un solo caso.
function cab(campos) {
  return "---\nfixture: vegapunk-fase-0\nsintetico: true\n" +
    Object.entries(campos).map(([k, v]) => `${k}: ${v}`).join("\n") + "\n---\n\n";
}
function soloUno(nombre, contenido) {
  return inventariar(tmpFixture(nombre, contenido))[0];
}

test("Z1: el compartimento de identidad se inventaria por stat y NUNCA se abre", () => {
  const spy = mock.method(fs, "readFileSync");
  const regs = inventariar(FIXTURES);
  const z1 = regs.find((r) => r.zona === ZONA.Z1_IDENTIDAD);
  assert.ok(z1, "debe inventariar el compartimento Z1");
  assert.equal(z1.abierto, false);
  assert.equal(z1.hash, null);
  assert.equal(z1.cuerpo, "");
  const abierto = spy.mock.calls.some((c) => String(c.arguments[0]).includes("Z1_IDENTIDAD"));
  assert.equal(abierto, false, "Z1 NUNCA debe abrirse");
});

test("Z1: denegado a todo el mundo, con parada de identidad", () => {
  const z1 = inventariar(FIXTURES).find((r) => r.zona === ZONA.Z1_IDENTIDAD);
  for (const actor of Object.values(ACTOR)) {
    const { nivel, paradas } = admitir({ rec: z1, actor, finalidad: FINALIDAD.SISTEMA });
    assert.equal(nivel, NIVEL.DENEGADO, `Z1 no puede abrirse para ${actor}`);
    assert.ok(paradas.includes(PARADA.IDENTIDAD));
  }
});

test("lo no leido no genera disonancia: se le aplica la clase mas restrictiva y se dice que no hubo lectura", () => {
  const z1 = clasificar(inventariar(FIXTURES).find((r) => r.zona === ZONA.Z1_IDENTIDAD));
  assert.equal(z1.leido, false);
  assert.equal(z1.efectiva, CLASE.ASISTENCIAL);
  assert.equal(z1.disonancia, false, "no se inventa una contradiccion que nadie observo");
});

test("la trampa: metafora declarada con relacion asistencial se reclasifica a asistencial", () => {
  const trampa = clasificar(uno(inventariar(FIXTURES), "metafora_trampa.md"));
  assert.equal(trampa.declarada, CLASE.METAFORA);
  assert.equal(trampa.efectiva, CLASE.ASISTENCIAL);
  assert.equal(trampa.disonancia, true);
  assert.ok(trampa.marcadores.length >= 2, "la disonancia debe apoyarse en evidencia");
});

test("la metafora limpia sigue siendo metafora y sale en claro, incluso al adaptador", () => {
  const regs = inventariar(FIXTURES);
  const limpia = clasificar(uno(regs, "metafora_limpia.md"));
  assert.equal(limpia.efectiva, CLASE.METAFORA);
  assert.equal(limpia.disonancia, false);
  const { paquete } = empaquetar({ registros: regs, actor: ACTOR.ADAPTADOR, finalidad: FINALIDAD.SISTEMA });
  const salen = paquete.items.map((i) => i.rel);
  assert.deepEqual(salen, ["metafora_limpia.md"], "el adaptador solo recibe metafora limpia");
});

test("el adaptador (GAS, Drive, Telegram) no recibe nada guardado ni cuantificado", () => {
  const regs = inventariar(FIXTURES);
  for (const nombre of ["asistencial_episodio.md", "intimo_nota.md", "cuantificado_serie.md", "metafora_trampa.md"]) {
    const { nivel } = admitir({ rec: uno(regs, nombre), actor: ACTOR.ADAPTADOR, finalidad: FINALIDAD.SISTEMA });
    assert.equal(nivel, NIVEL.DENEGADO, `${nombre} no puede cruzar al adaptador`);
  }
});

test("puerta clinica a investigacion: cerrada por defecto, abierta solo con GO en cabecera", () => {
  const regs = inventariar(FIXTURES);
  const sinPuerta = admitir({
    rec: uno(regs, "asistencial_episodio.md"), actor: ACTOR.CAPITAN, finalidad: FINALIDAD.INVESTIGACION
  });
  assert.equal(sinPuerta.nivel, NIVEL.DENEGADO);
  assert.ok(sinPuerta.recibo.motivos.some((m) => m.startsWith("puerta_cerrada")));

  const conPuerta = admitir({
    rec: uno(regs, "cuantificado_serie.md"), actor: ACTOR.CAPITAN, finalidad: FINALIDAD.INVESTIGACION
  });
  assert.equal(conPuerta.nivel, NIVEL.CONTENIDO);
  assert.ok(conPuerta.recibo.motivos.some((m) => m.startsWith("puerta abierta por GO_")));
});

test("techo de muelle: ninguna clase guardada sale literal, para ningun solicitante", () => {
  assert.equal(nivelDeSalida(CLASE.ASISTENCIAL, NIVEL.CONTENIDO), NIVEL.DERIVADO);
  assert.equal(nivelDeSalida(CLASE.INTIMO, NIVEL.CONTENIDO), NIVEL.DERIVADO);
  assert.equal(nivelDeSalida(CLASE.METAFORA, NIVEL.CONTENIDO), NIVEL.CONTENIDO);

  const { corridas } = circuitoFase0();
  for (const c of corridas) {
    for (const item of c.paquete.items) {
      if ([CLASE.ASISTENCIAL, CLASE.INTIMO].includes(item.clase)) {
        assert.equal(item.texto, undefined, `${item.rel} salio literal hacia ${c.actor}`);
        assert.ok(item.derivado.hash, "el derivado debe llevar huella");
      }
    }
  }
});

test("el circuito completo de la Fase 0 no produce ninguna fuga", () => {
  const { corridas } = circuitoFase0();
  assert.deepEqual(corridas.flatMap((c) => c.fuga), []);
});

test("PARADA_FUENTE_REAL: lo que no se declara sintetico no entra en Fase 0", () => {
  const dir = tmpFixture("real.md", "---\nclase_declarada: cuantificado\n---\n\n# Serie\n\n1 2 3\n");
  const { nivel, paradas } = admitir({
    rec: inventariar(dir)[0], actor: ACTOR.CAPITAN, finalidad: FINALIDAD.SISTEMA
  });
  assert.equal(nivel, NIVEL.DENEGADO);
  assert.ok(paradas.includes(PARADA.FUENTE_REAL));
});

test("PARADA_IDENTIDAD: identidad fuera de Z1 detiene la admision", () => {
  const dir = tmpFixture("con_identidad.md",
    "---\nfixture: vegapunk-fase-0\nsintetico: true\nclase_declarada: cuantificado\n---\n\n" +
    "Nombre_real: alguien. DNI 00000000X. Contacto: alguien@ejemplo.org\n");
  const { nivel, paradas } = admitir({
    rec: inventariar(dir)[0], actor: ACTOR.CAPITAN, finalidad: FINALIDAD.SISTEMA
  });
  assert.equal(nivel, NIVEL.DENEGADO);
  assert.ok(paradas.includes(PARADA.IDENTIDAD));
  assert.ok(marcadoresIdentidad("DNI 00000000X").length > 0);
});

test("verificarFuga anula el paquete si algo se cuela por detras de la matriz", () => {
  const trucado = {
    actor: ACTOR.CONTRATADO,
    items: [{ rel: "x.md", clase: CLASE.ASISTENCIAL, nivel: NIVEL.CONTENIDO, recibo: "abc", texto: "en sesion" }]
  };
  const fallos = verificarFuga(trucado);
  assert.ok(fallos.some((f) => f.parada === PARADA.FUGA));
});

test("recibos idempotentes: mismo material y mismo solicitante producen el mismo id", () => {
  const a = circuitoFase0().corridas.flatMap((c) => c.recibos).map((r) => r.id);
  const b = circuitoFase0().corridas.flatMap((c) => c.recibos).map((r) => r.id);
  assert.deepEqual(a, b);
  assert.equal(new Set(a).size, a.length, "no debe haber ids repetidos dentro de una corrida");
});

test("la clase mas restrictiva gana siempre", () => {
  assert.equal(masRestrictiva(CLASE.METAFORA, CLASE.ASISTENCIAL), CLASE.ASISTENCIAL);
  assert.equal(masRestrictiva(CLASE.CUANTIFICADO, CLASE.INTIMO), CLASE.INTIMO);
  assert.equal(masRestrictiva(CLASE.METAFORA, CLASE.METAFORA), CLASE.METAFORA);
});

// ---------------------------------------------------------------------------
// Pruebas de la correccion: una por hallazgo reproducido sobre el commit
// congelado bdcf3e2. Cada una falla en ese commit y pasa aqui. Los enunciados
// describen la regla, no el arreglo: si alguien vuelve a romperla por otro
// camino, estas pruebas siguen siendo las que lo detectan.
// ---------------------------------------------------------------------------

test("H1 — un solo marcador asistencial basta para reclasificar, y el adaptador lo deniega", () => {
  const rec = soloUno("imagen.md",
    cab({ clase_declarada: "metafora", finalidad_origen: "narrativa" }) +
    "# Imagen\n\nHablo de una paciente que baja las persianas de dia. Nada mas.\n");
  const c = clasificar(rec);
  assert.equal(c.declarada, CLASE.METAFORA);
  assert.equal(c.efectiva, CLASE.ASISTENCIAL, "un marcador ya obliga a la clase mas restrictiva");
  assert.equal(c.marcadores.length, 1, "y la decision se apoya en la evidencia que hay, no en dos");
  const { paquete } = empaquetar({ registros: [rec], actor: ACTOR.ADAPTADOR, finalidad: FINALIDAD.SISTEMA });
  assert.deepEqual(paquete.items, [], "no cruza al adaptador");
});

test("H2 — la deteccion mira el nombre del fichero y la cabecera, no solo el cuerpo", () => {
  const rec = soloUno("sesion_paciente_03.md",
    cab({ clase_declarada: "metafora", finalidad_origen: "narrativa" }) +
    "# Imagen\n\nUna casa, una persiana bajada, luz de tarde. Nada mas.\n");
  const c = clasificar(rec);
  assert.ok(c.marcadores.length > 0, "el nombre del fichero es superficie de deteccion");
  assert.equal(c.efectiva, CLASE.ASISTENCIAL);
  const { paquete } = empaquetar({ registros: [rec], actor: ACTOR.ADAPTADOR, finalidad: FINALIDAD.SISTEMA });
  assert.deepEqual(paquete.items, []);
});

test("H3 — admitir() devuelve el nivel que realmente saldria, y el recibo lo dice", () => {
  const rec = uno(inventariar(FIXTURES), "asistencial_episodio.md");
  const a = admitir({ rec, actor: ACTOR.CAPITAN, finalidad: FINALIDAD.SISTEMA });
  assert.equal(a.nivel, NIVEL.DERIVADO, "el techo de muelle se aplica en la admision, no despues");
  assert.equal(a.recibo.nivel, NIVEL.DERIVADO, "el recibo no puede afirmar una salida que no ocurre");
  assert.equal(a.recibo.nivel_acceso, NIVEL.CONTENIDO, "y conserva el techo de la matriz, por separado");

  // El nivel del recibo coincide con lo que el muelle entrega, para todos.
  for (const c of circuitoFase0().corridas) {
    const porId = new Map(c.recibos.map((r) => [r.id, r]));
    for (const item of c.paquete.items) {
      assert.equal(item.nivel, porId.get(item.recibo).nivel, `${item.rel} sale distinto de lo que su recibo dice`);
    }
  }
});

test("H4 — una clase declarada que no existe no se propaga: se nombra y se cierra", () => {
  const rec = soloUno("typo.md",
    cab({ clase_declarada: "asistencia", finalidad_origen: "narrativa" }) +
    "# Algo\n\nTexto neutro, sin marcadores.\n");
  const a = admitir({ rec, actor: ACTOR.CAPITAN, finalidad: FINALIDAD.SISTEMA });
  assert.equal(a.recibo.clase_declarada_valida, false);
  assert.equal(a.recibo.clase_efectiva, CLASE.ASISTENCIAL, "cae en la clase mas restrictiva");
  assert.notEqual(a.recibo.clase_efectiva, "asistencia", "y no se registra una clase inexistente");
  assert.ok(a.recibo.motivos.some((m) => m.includes("clase declarada desconocida")));
});

test("H5 — lo no analizable se inventaria, no se abre, y se deniega con motivo", () => {
  const spy = mock.method(fs, "readFileSync");
  const dir = tmpFixture("serie.csv", "medida,s01\ndespertares,4\n");
  const rec = inventariar(dir)[0];
  assert.equal(rec.rel, "serie.csv", "el puerto lo VE");
  assert.equal(rec.analizable, false);
  assert.equal(rec.abierto, false);
  assert.equal(spy.mock.calls.some((c) => String(c.arguments[0]).endsWith(".csv")), false, "y no lo abre");

  const a = admitir({ rec, actor: ACTOR.CAPITAN, finalidad: FINALIDAD.SISTEMA });
  assert.equal(a.nivel, NIVEL.DENEGADO, "lo deniega en vez de ignorarlo");
  assert.ok(a.recibo.motivos.some((m) => m.includes("no analizable")));
});

test("H6 — el sujeto gobierna: la intimidad de un tercero es relacion asistencial", () => {
  const cuerpo = "# Nota\n\nTexto identico en los tres.\n";
  const base = { clase_declarada: "intimo", finalidad_origen: "narrativa" };
  const propio = clasificar(soloUno("a.md", cab({ ...base, sujeto: SUJETO.CAPITAN }) + cuerpo));
  const ajeno = clasificar(soloUno("b.md", cab({ ...base, sujeto: SUJETO.TERCERO }) + cuerpo));
  const raro = clasificar(soloUno("c.md", cab({ ...base, sujeto: "gaviota" }) + cuerpo));

  assert.equal(propio.efectiva, CLASE.INTIMO, "del Capitan sobre si mismo, si es intimo");
  assert.equal(ajeno.efectiva, CLASE.ASISTENCIAL, "sobre un tercero, no");
  assert.equal(raro.efectiva, CLASE.ASISTENCIAL, "un sujeto que no existe se trata como el peor caso");
  assert.equal(raro.sujeto_valido, false);
});

test("H6 — una zona Z1 declarada fuera del compartimento se deniega: protege la ruta, no la cabecera", () => {
  const rec = soloUno("dice_z1.md",
    cab({ clase_declarada: "metafora", finalidad_origen: "narrativa", zona: "Z1_IDENTIDAD" }) +
    "# Se declara Z1\n\nY no lo es.\n");
  assert.equal(rec.zona, ZONA.Z2_BODEGA, "la zona la decide la ruta");
  const a = admitir({ rec, actor: ACTOR.CAPITAN, finalidad: FINALIDAD.SISTEMA });
  assert.equal(a.nivel, NIVEL.DENEGADO);
  assert.ok(a.paradas.includes(PARADA.IDENTIDAD));
  assert.ok(a.recibo.motivos.some((m) => m.includes("la cabecera no protege")));
});

test("H7 — la puerta exige un GO con formato y con caducidad vigente", () => {
  const ahora = new Date("2026-08-29T00:00:00Z");
  assert.equal(puerta({}, ahora).abierta, false);
  assert.equal(puerta({ puerta_investigacion: "si" }, ahora).abierta, false, "'si' no es un GO");
  assert.equal(puerta({ puerta_investigacion: "GO_SINT_FASE0_PUERTA_01" }, ahora).abierta, false,
    "un GO sin caducidad seria un permiso permanente");
  assert.equal(puerta({ puerta_investigacion: "GO_SINT_FASE0_PUERTA_01", puerta_vence: "2020-01-01" }, ahora).abierta,
    false, "un GO caducado no abre");
  assert.equal(puerta({ puerta_investigacion: "GO_SINT_FASE0_PUERTA_01", puerta_vence: "2027-12-31" }, ahora).abierta,
    true, "con formato y vigencia, abre");

  const rec = soloUno("falsa.md",
    cab({ clase_declarada: "cuantificado", finalidad_origen: "asistencia", puerta_investigacion: "si" }) +
    "# Serie\n\n1 2 3\n");
  const a = admitir({ rec, actor: ACTOR.CAPITAN, finalidad: FINALIDAD.INVESTIGACION, ahora });
  assert.equal(a.nivel, NIVEL.DENEGADO);
  assert.ok(a.recibo.motivos.some((m) => m.startsWith("puerta_cerrada")));
});

test("H8 — el recibo es la decision (sin tiempo, idempotente); el asiento es el evento (con tiempo)", () => {
  const rec = uno(inventariar(FIXTURES), "cuantificado_serie.md");
  const a = admitir({ rec, actor: ACTOR.CAPITAN, finalidad: FINALIDAD.SISTEMA });
  const b = admitir({ rec, actor: ACTOR.CAPITAN, finalidad: FINALIDAD.SISTEMA });
  assert.equal(a.recibo.id, b.recibo.id, "la misma pregunta sobre el mismo material da el mismo id");
  assert.equal(a.recibo.ts, undefined, "el recibo no lleva tiempo: es una decision, no un suceso");

  const linea = asiento(a.recibo, { ts: "2026-08-29T21:00:00.000Z", runId: "run-1" });
  assert.equal(linea.recibo, a.recibo.id, "el asiento referencia el recibo");
  assert.equal(linea.ts, "2026-08-29T21:00:00.000Z", "y sí lleva el cuando");
  assert.equal(linea.run_id, "run-1");
  assert.equal(linea.nivel, a.recibo.nivel);
});
