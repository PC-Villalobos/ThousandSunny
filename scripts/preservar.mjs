// Preservacion de trabajo que solo existe en un disco.
//
// POR QUE EXISTE
// El punto 1.a del rumbo de integracion: `cubierta-world` (commit `fb82863`, con
// el bucle de Nami) no tiene remoto. No esta en git alcanzable, no esta en este
// contenedor, y todo lo que se dice de el es INFERIDO del relato del Capitan. Un
// disco que falla se lleva el ciclo entero.
//
// Lo que este script NO hace, a proposito:
//   - No decide si `cubierta-world` entra al repo como componente o se declara
//     derivado. Eso es del Capitan. Esto es custodia, no integracion: la rama de
//     preservacion tiene historia disjunta y no toca el tronco ni abre PR.
//   - No empuja nada sin `--ejecutar`. Por defecto hace un ensayo y nombra el
//     empuje exacto que haria.
//   - No fuerza. Si la rama remota ya existe y el empuje no es avance directo,
//     git lo rechaza, y eso esta bien: historia preservada no se sobreescribe.
//
// REGLA DE ESTE FICHERO
// La misma de la casa: lo que no se puede comprobar se declara, no se supone. Un
// SHA que no existe se nombra; un arbol sucio se avisa, porque un empuje preserva
// commits y no ficheros sin commitear; un remoto que ya lo tiene se dice y se sale
// sin tocar nada.
//
// USO
//   node scripts/preservar.mjs <ruta-del-repo-local> [opciones]
//     --rama <nombre>    rama de preservacion (por defecto preserva/<carpeta>)
//     --commit <sha>     commit concreto a preservar ademas de HEAD
//     --remoto <url>     destino (por defecto ThousandSunny)
//     --ejecutar         empuja de verdad; sin esto es un ensayo

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REMOTO_POR_DEFECTO = "https://github.com/PC-Villalobos/ThousandSunny.git";

export const USO = [
  "uso: node scripts/preservar.mjs <ruta-del-repo-local> [--rama <nombre>]",
  "     [--commit <sha>] [--remoto <url>] [--ejecutar]",
].join("\n");

/** Corre git en otro arbol. Separado para poder inyectarlo en las pruebas. */
export function ejecutarGit(ruta, args) {
  const r = spawnSync("git", ["-C", ruta, ...args], { encoding: "utf8" });
  if (r.error) return { ok: false, salida: `git no responde: ${r.error.message}` };
  return { ok: r.status === 0, salida: `${r.stdout || ""}${r.stderr || ""}`.trim() };
}

/** Ultimo segmento de una ruta, con separador de Windows o de POSIX. */
export function carpetaDe(ruta) {
  const partes = String(ruta).split(/[\\/]+/).filter((p) => p && p !== "." && !/^[A-Za-z]:$/.test(p));
  return partes.length ? partes[partes.length - 1] : "";
}

export function parsear(argv) {
  const o = { ruta: "", rama: "", commit: "", remoto: REMOTO_POR_DEFECTO, ejecutar: false, error: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--ejecutar") o.ejecutar = true;
    else if (a === "--rama" || a === "--commit" || a === "--remoto") {
      const v = argv[i + 1];
      if (!v || v.startsWith("--")) {
        o.error = `${a} necesita un valor`;
        return o;
      }
      o[a.slice(2)] = v;
      i += 1;
    } else if (a.startsWith("--")) {
      o.error = `opcion desconocida: ${a}`;
      return o;
    } else if (!o.ruta) o.ruta = a;
    else {
      o.error = `ruta repetida: ya se dio ${o.ruta}`;
      return o;
    }
  }
  if (!o.ruta) o.error = "falta la ruta del repo local";
  if (!o.rama && o.ruta) o.rama = `preserva/${carpetaDe(o.ruta)}`;
  return o;
}

/**
 * Mira el repo local y el remoto y decide que empujar. No empuja.
 * Devuelve { ok, motivo, lineas, avisos, empujes }.
 */
export function inspeccionar(o, git = ejecutarGit) {
  const lineas = [];
  const avisos = [];
  const fallo = (motivo, remedio) => ({ ok: false, motivo, remedio, lineas, avisos, empujes: [] });

  if (o.error) return fallo(o.error, USO);

  const esRepo = git(o.ruta, ["rev-parse", "--git-dir"]);
  if (!esRepo.ok) {
    return fallo(
      `no es un repo de git alcanzable: ${o.ruta}`,
      "comprueba la ruta; si el trabajo nunca se commiteo, haz `git init` y un commit antes de preservarlo",
    );
  }

  const cabeza = git(o.ruta, ["rev-parse", "HEAD"]);
  if (!cabeza.ok) return fallo(`ese repo no tiene HEAD: ${o.ruta}`, "haz al menos un commit antes de preservarlo");
  const shaCabeza = cabeza.salida.split("\n")[0].trim();

  const nombre = git(o.ruta, ["rev-parse", "--abbrev-ref", "HEAD"]);
  lineas.push(`repo local: ${o.ruta}`);
  lineas.push(`HEAD: ${shaCabeza.slice(0, 7)} (${nombre.ok ? nombre.salida.trim() : "rama desconocida"})`);

  const sucio = git(o.ruta, ["status", "--porcelain"]);
  if (sucio.ok && sucio.salida) {
    const n = sucio.salida.split("\n").filter((l) => l.trim()).length;
    avisos.push(`${n} fichero(s) sin commitear: un empuje NO los preserva, solo viajan los commits`);
    avisos.push("si cuentan, haz commit antes de volver a lanzar esto");
  }

  const empujes = [{ sha: shaCabeza, rama: o.rama, que: "HEAD" }];

  if (o.commit) {
    const res = git(o.ruta, ["rev-parse", "--verify", `${o.commit}^{commit}`]);
    if (!res.ok) {
      return fallo(
        `el commit ${o.commit} no existe en ${o.ruta}`,
        "ese SHA esta INFERIDO del relato, no leido: comprueba el valor real con `git log --oneline` en ese repo",
      );
    }
    const shaPedido = res.salida.split("\n")[0].trim();
    const dentro = git(o.ruta, ["merge-base", "--is-ancestor", shaPedido, shaCabeza]);
    if (dentro.ok) {
      lineas.push(`${o.commit} (${shaPedido.slice(0, 7)}) es ancestro de HEAD: viaja en el mismo empuje`);
    } else {
      const ramaAparte = `${o.rama}-${shaPedido.slice(0, 7)}`;
      lineas.push(`${o.commit} (${shaPedido.slice(0, 7)}) NO es ancestro de HEAD: necesita rama propia`);
      empujes.push({ sha: shaPedido, rama: ramaAparte, que: `commit ${o.commit}` });
    }
  }

  const pendientes = [];
  for (const e of empujes) {
    const remoto = git(o.ruta, ["ls-remote", o.remoto, `refs/heads/${e.rama}`]);
    if (!remoto.ok) {
      avisos.push(`no se pudo consultar ${o.remoto}: ${remoto.salida || "sin salida"}`);
      avisos.push("puede ser falta de credenciales en esta maquina; el empuje dira lo mismo si es asi");
      pendientes.push(e);
      continue;
    }
    const yaEsta = remoto.salida.split(/\s+/)[0] || "";
    if (yaEsta === e.sha) lineas.push(`${e.que} ya esta a salvo en ${e.rama}: nada que hacer`);
    else pendientes.push(e);
  }

  return { ok: true, motivo: "", remedio: "", lineas, avisos, empujes: pendientes };
}

function main(argv) {
  const o = parsear(argv);
  const plan = inspeccionar(o);

  for (const l of plan.lineas) process.stdout.write(`${l}\n`);
  for (const a of plan.avisos) process.stdout.write(`AVISO  ${a}\n`);

  if (!plan.ok) {
    process.stdout.write(`\nFALLO  ${plan.motivo}\n`);
    if (plan.remedio) process.stdout.write(`${plan.remedio}\n`);
    return 1;
  }

  if (!plan.empujes.length) {
    process.stdout.write("\nel trabajo ya es alcanzable fuera de esta maquina.\n");
    return 0;
  }

  process.stdout.write("\nempuje(s) a realizar:\n");
  for (const e of plan.empujes) {
    process.stdout.write(`  git -C "${o.ruta}" push ${o.remoto} ${e.sha}:refs/heads/${e.rama}\n`);
  }

  if (!o.ejecutar) {
    process.stdout.write("\nENSAYO: no se ha empujado nada. Repite con --ejecutar para hacerlo.\n");
    return 0;
  }

  let fallidos = 0;
  for (const e of plan.empujes) {
    process.stdout.write(`\n--- empujando ${e.que} a ${e.rama} ---\n`);
    const r = ejecutarGit(o.ruta, ["push", o.remoto, `${e.sha}:refs/heads/${e.rama}`]);
    process.stdout.write(`${r.salida || "(sin salida)"}\n`);
    if (!r.ok) {
      fallidos += 1;
      continue;
    }
    const check = ejecutarGit(o.ruta, ["ls-remote", o.remoto, `refs/heads/${e.rama}`]);
    const visto = check.ok ? (check.salida.split(/\s+/)[0] || "") : "";
    if (visto === e.sha) process.stdout.write(`VERIFICADO  ${e.rama} = ${e.sha}\n`);
    else {
      process.stdout.write(`SIN VERIFICAR  el remoto no devuelve ${e.sha} en ${e.rama}\n`);
      fallidos += 1;
    }
  }

  if (fallidos) {
    process.stdout.write(`\n${fallidos} empuje(s) sin confirmar. El trabajo sigue solo en este disco.\n`);
    return 1;
  }
  process.stdout.write("\nel trabajo ya es alcanzable fuera de esta maquina.\n");
  return 0;
}

const invocadoDirecto =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invocadoDirecto) process.exit(main(process.argv.slice(2)));
