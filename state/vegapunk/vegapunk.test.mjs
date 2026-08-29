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
  ACTOR, CLASE, FINALIDAD, NIVEL, PARADA, ZONA,
  admitir, circuitoFase0, clasificar, empaquetar, inventariar,
  marcadoresIdentidad, masRestrictiva, nivelDeSalida, verificarFuga
} from "./vegapunk.mjs";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const uno = (regs, nombre) => regs.find((r) => r.rel.endsWith(nombre));

afterEach(() => mock.restoreAll());

function tmpFixture(nombre, contenido) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "vegapunk-"));
  fs.writeFileSync(path.join(d, nombre), contenido, "utf8");
  return d;
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
  assert.ok(conPuerta.recibo.motivos.some((m) => m.startsWith("puerta_abierta")));
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
