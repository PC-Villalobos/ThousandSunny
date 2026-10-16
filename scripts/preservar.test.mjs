// Pruebas del preservador. Dos mitades a proposito:
//
//   - con un git falso inyectado, para fijar las decisiones y los mensajes sin
//     depender de la red ni del disco;
//   - con git de verdad sobre repos sinteticos y un bare local como remoto, para
//     que lo que se afirma del refspec sea cierto y no solo plausible.

import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { carpetaDe, inspeccionar, parsear, REMOTO_POR_DEFECTO } from "./preservar.mjs";

/** git falso: responde segun los primeros argumentos. */
function gitFalso(tabla) {
  return (_ruta, args) => {
    const clave = args.join(" ");
    for (const [patron, respuesta] of Object.entries(tabla)) {
      if (clave === patron || clave.startsWith(`${patron} `)) return respuesta;
    }
    return { ok: true, salida: "" };
  };
}

const SANO = {
  "rev-parse --git-dir": { ok: true, salida: ".git" },
  "rev-parse HEAD": { ok: true, salida: "a".repeat(40) },
  "rev-parse --abbrev-ref HEAD": { ok: true, salida: "main" },
  "status --porcelain": { ok: true, salida: "" },
  "ls-remote": { ok: true, salida: "" },
};

test("carpetaDe entiende rutas de Windows y de POSIX", () => {
  assert.equal(carpetaDe("C:\\Sunny\\cubierta-world"), "cubierta-world");
  assert.equal(carpetaDe("/home/user/cubierta-world/"), "cubierta-world");
  assert.equal(carpetaDe("C:/Sunny/CubiertaLocal"), "CubiertaLocal");
});

test("parsear deriva la rama de la carpeta y acepta las opciones", () => {
  const o = parsear(["C:\\Sunny\\cubierta-world", "--commit", "fb82863", "--ejecutar"]);
  assert.equal(o.error, "");
  assert.equal(o.ruta, "C:\\Sunny\\cubierta-world");
  assert.equal(o.rama, "preserva/cubierta-world");
  assert.equal(o.commit, "fb82863");
  assert.equal(o.ejecutar, true);
  assert.equal(o.remoto, REMOTO_POR_DEFECTO);
});

test("parsear se queja de lo que no entiende, en vez de adivinar", () => {
  assert.match(parsear([]).error, /falta la ruta/);
  assert.match(parsear(["x", "--rama"]).error, /necesita un valor/);
  assert.match(parsear(["x", "--otra"]).error, /opcion desconocida/);
  assert.match(parsear(["x", "y"]).error, /ruta repetida/);
  assert.equal(parsear(["x"]).ejecutar, false, "sin --ejecutar nunca empuja");
});

test("una ruta que no es repo se declara con su remedio", () => {
  const plan = inspeccionar(parsear(["/no/existe"]), gitFalso({ "rev-parse --git-dir": { ok: false, salida: "fatal" } }));
  assert.equal(plan.ok, false);
  assert.match(plan.motivo, /no es un repo de git alcanzable/);
  assert.match(plan.remedio, /git init/);
  assert.deepEqual(plan.empujes, []);
});

test("un commit que no existe se nombra y no se da por bueno", () => {
  const plan = inspeccionar(
    parsear(["/repo", "--commit", "fb82863"]),
    gitFalso({ ...SANO, "rev-parse --verify fb82863^{commit}": { ok: false, salida: "fatal" } }),
  );
  assert.equal(plan.ok, false);
  assert.match(plan.motivo, /fb82863 no existe/);
  assert.match(plan.remedio, /INFERIDO/, "el SHA viene del relato, y el mensaje lo dice");
});

test("un arbol sucio se avisa: el empuje no se lleva lo no commiteado", () => {
  const plan = inspeccionar(
    parsear(["/repo"]),
    gitFalso({ ...SANO, "status --porcelain": { ok: true, salida: " M uno.js\n?? dos.js" } }),
  );
  assert.equal(plan.ok, true);
  assert.ok(plan.avisos.some((a) => /2 fichero\(s\) sin commitear/.test(a)));
  assert.equal(plan.empujes.length, 1, "avisa, pero sigue preservando lo que si esta commiteado");
});

test("si el remoto ya lo tiene, no se empuja nada", () => {
  const plan = inspeccionar(
    parsear(["/repo"]),
    gitFalso({ ...SANO, "ls-remote": { ok: true, salida: `${"a".repeat(40)}\trefs/heads/preserva/repo` } }),
  );
  assert.equal(plan.ok, true);
  assert.deepEqual(plan.empujes, []);
  assert.ok(plan.lineas.some((l) => /ya esta a salvo/.test(l)));
});

test("un remoto que no contesta se avisa y el empuje sigue en pie", () => {
  const plan = inspeccionar(
    parsear(["/repo"]),
    gitFalso({ ...SANO, "ls-remote": { ok: false, salida: "fatal: Authentication failed" } }),
  );
  assert.equal(plan.ok, true);
  assert.ok(plan.avisos.some((a) => /no se pudo consultar/.test(a)));
  assert.ok(plan.avisos.some((a) => /credenciales/.test(a)));
  assert.equal(plan.empujes.length, 1, "no se asume que ya esta a salvo solo porque no se pudo mirar");
});

// --- con git de verdad ---

function montar() {
  const base = mkdtempSync(path.join(os.tmpdir(), "preservar-"));
  const repo = path.join(base, "trabajo");
  const bare = path.join(base, "remoto.git");
  execFileSync("git", ["init", "-q", "-b", "main", repo]);
  execFileSync("git", ["-C", repo, "config", "user.email", "nadie@example.invalid"]);
  execFileSync("git", ["-C", repo, "config", "user.name", "nadie"]);
  writeFileSync(path.join(repo, "uno.txt"), "uno\n");
  execFileSync("git", ["-C", repo, "add", "."]);
  execFileSync("git", ["-C", repo, "commit", "-q", "-m", "uno"]);
  execFileSync("git", ["init", "-q", "--bare", bare]);
  return { repo, bare };
}

test("sobre git real: planea un refspec que git acepta, y deja de planearlo una vez hecho", () => {
  const { repo, bare } = montar();
  const o = parsear([repo, "--remoto", bare, "--rama", "preserva/trabajo"]);

  const antes = inspeccionar(o);
  assert.equal(antes.ok, true);
  assert.equal(antes.empujes.length, 1);
  const { sha, rama } = antes.empujes[0];

  execFileSync("git", ["-C", repo, "push", "-q", bare, `${sha}:refs/heads/${rama}`]);
  const visto = execFileSync("git", ["-C", repo, "ls-remote", bare, `refs/heads/${rama}`], { encoding: "utf8" });
  assert.match(visto, new RegExp(`^${sha}`), "el refspec que el script nombra es el que crea la rama");

  const despues = inspeccionar(o);
  assert.deepEqual(despues.empujes, [], "idempotente: ya esta a salvo");
});

test("sobre git real: un commit fuera de HEAD recibe rama propia", () => {
  const { repo, bare } = montar();
  execFileSync("git", ["-C", repo, "checkout", "-q", "-b", "aparte"]);
  writeFileSync(path.join(repo, "dos.txt"), "dos\n");
  execFileSync("git", ["-C", repo, "add", "."]);
  execFileSync("git", ["-C", repo, "commit", "-q", "-m", "dos"]);
  const suelto = execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  execFileSync("git", ["-C", repo, "checkout", "-q", "main"]);

  const plan = inspeccionar(parsear([repo, "--remoto", bare, "--rama", "preserva/trabajo", "--commit", suelto]));
  assert.equal(plan.ok, true);
  assert.equal(plan.empujes.length, 2, "HEAD y el commit suelto son dos ramas, no una");
  assert.equal(plan.empujes[1].rama, `preserva/trabajo-${suelto.slice(0, 7)}`);
  assert.ok(plan.lineas.some((l) => /NO es ancestro de HEAD/.test(l)));
});

test("sobre git real: un commit que si es ancestro viaja en el mismo empuje", () => {
  const { repo, bare } = montar();
  const primero = execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  writeFileSync(path.join(repo, "dos.txt"), "dos\n");
  execFileSync("git", ["-C", repo, "add", "."]);
  execFileSync("git", ["-C", repo, "commit", "-q", "-m", "dos"]);

  const plan = inspeccionar(parsear([repo, "--remoto", bare, "--rama", "preserva/trabajo", "--commit", primero]));
  assert.equal(plan.empujes.length, 1);
  assert.ok(plan.lineas.some((l) => /es ancestro de HEAD: viaja en el mismo empuje/.test(l)));
});
