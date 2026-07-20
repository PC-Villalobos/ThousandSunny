// Melampo Lab — trabajador unico sobre corpus SINTETICO (Ola M0.6).
//
// Que es: un motor de digestion aislado que reutiliza las primitivas read-only de
// la funcion de sueno (state/funcion_de_sueno/lib/scan.mjs) con una MEMBRANA
// ESTRICTA (protegido -> stat_only, jamas se abre) y produce SOLO propuestas con
// evidencia. No escribe canon, no toca fuentes, no toca el genoma de Metatron.
//
// Que NO es (todavia): concurrencia multi-trabajador, rollback interactivo,
// metricas completas de recuperacion. Eso es un GO posterior. Aqui se demuestra el
// nucleo: membrana estricta + deteccion de familias + relaciones candidatas con
// evidencia + almacen de propuestas idempotente y reanudable + una consulta de
// recuperacion.
//
// Uso:
//   node melampo.mjs                      # digiere el corpus y escribe propuestas
//   node melampo.mjs --recover "alpha"    # consulta de recuperacion sobre semillas

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACCESS,
  scanFiles,
  hasProtectedMarker,
  readContentIfAllowed,
  sha256
} from "../funcion_de_sueno/lib/scan.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CORPUS = path.join(HERE, "corpus");
const PROPOSALS = path.join(HERE, "proposals.jsonl");
const STATE = path.join(HERE, "melampo_state.json");

const CONFIG = {
  includeExtensions: [".md", ".txt"],
  maxFileBytes: 200000,
  skipDirs: [".git", "node_modules"],
  protectedPathMarkers: ["HOLD_CLINICO", "00_BOVEDA_NEXUS", "clinical_guarded"]
};

// Membrana estricta: el protegido nunca se abre (stat_only). El sobredimensionado
// se hashea sin analizar. El resto es contenido legible.
function strictClassify(meta) {
  if (meta.protected) return ACCESS.STAT_ONLY;
  if (meta.tooLarge) return ACCESS.HASH_AUTHORIZED;
  return ACCESS.CONTENT_READABLE;
}

function titleOf(text) {
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "";
}
function titleStem(title) {
  return title.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
}
function wikilinksOf(text) {
  return [...text.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim().toLowerCase());
}
function stableId(type, key) {
  return sha256(`${type}|${key}`).slice(0, 16);
}
function loadState(statePath) {
  if (!fs.existsSync(statePath)) return { runs: 0, proposalIds: [], lastRun: null };
  try { return JSON.parse(fs.readFileSync(statePath, "utf8")); }
  catch { return { runs: 0, proposalIds: [], lastRun: null }; }
}

// Extrae "semillas" de cada documento legible; los protegidos quedan como registro
// con acceso stat_only y SIN contenido ni hash.
export function digest(root = CORPUS) {
  const scanned = scanFiles(root, CONFIG, strictClassify);
  const seeds = [];
  for (const rec of scanned) {
    if (rec.access === ACCESS.STAT_ONLY) {
      seeds.push({ rel: rec.rel, access: rec.access, gated: true });
      continue;
    }
    const text = readContentIfAllowed(root, rec);
    seeds.push({
      rel: rec.rel,
      access: rec.access,
      hash: rec.hash,
      title: titleOf(text),
      stem: titleStem(titleOf(text)),
      links: wikilinksOf(text)
    });
  }
  return seeds;
}

// Genera propuestas con evidencia a partir de las semillas. Nunca promueve a canon.
export function propose(seeds) {
  const readable = seeds.filter((s) => !s.gated);
  const out = [];

  // 1) Familia por duplicado exacto (mismo hash de bytes)
  const byHash = new Map();
  for (const s of readable) {
    if (!s.hash) continue;
    (byHash.get(s.hash) || byHash.set(s.hash, []).get(s.hash)).push(s.rel);
  }
  for (const [hash, members] of byHash) {
    if (members.length < 2) continue;
    const key = members.slice().sort().join("|");
    out.push({
      id: stableId("family_exact_dup", key),
      type: "family_exact_dup", members: members.slice().sort(),
      confidence: 1.0, evidence: { sharedHash: hash.slice(0, 12) }, status: "propuesta"
    });
  }

  // 2) Familia por version (mismo stem de titulo, no todos identicos)
  const byStem = new Map();
  for (const s of readable) {
    if (!s.stem) continue;
    (byStem.get(s.stem) || byStem.set(s.stem, []).get(s.stem)).push(s.rel);
  }
  for (const [stem, members] of byStem) {
    if (members.length < 2) continue;
    const key = members.slice().sort().join("|");
    out.push({
      id: stableId("family_version", key),
      type: "family_version", members: members.slice().sort(),
      confidence: 0.8, evidence: { sharedTitleStem: stem }, status: "propuesta"
    });
  }

  // 3) Relacion candidata por co-referencia (dos docs enlazan el mismo destino)
  const byTarget = new Map();
  for (const s of readable) {
    for (const link of new Set(s.links)) {
      (byTarget.get(link) || byTarget.set(link, []).get(link)).push(s.rel);
    }
  }
  for (const [target, refs] of byTarget) {
    const uniq = [...new Set(refs)].sort();
    for (let i = 0; i < uniq.length; i += 1) {
      for (let j = i + 1; j < uniq.length; j += 1) {
        const pair = [uniq[i], uniq[j]];
        out.push({
          id: stableId("relation_coref", `${pair.join("|")}|${target}`),
          type: "relation_coref", members: pair,
          confidence: 0.6, evidence: { sharedLink: target }, status: "propuesta"
        });
      }
    }
  }
  return out;
}

// Idempotente y reanudable: solo escribe propuestas cuyo id no exista ya en el estado.
export function run({ root = CORPUS, proposalsPath = PROPOSALS, statePath = STATE } = {}) {
  const state = loadState(statePath);
  const known = new Set(state.proposalIds);
  const proposals = propose(digest(root));
  const fresh = proposals.filter((p) => !known.has(p.id));

  if (fresh.length) {
    fs.appendFileSync(proposalsPath, fresh.map((p) => JSON.stringify(p)).join("\n") + "\n", "utf8");
  }
  const nextState = {
    runs: state.runs + 1,
    proposalIds: [...new Set([...state.proposalIds, ...proposals.map((p) => p.id)])],
    lastRun: new Date().toISOString()
  };
  fs.writeFileSync(statePath, JSON.stringify(nextState, null, 2) + "\n", "utf8");
  return { total: proposals.length, appended: fresh.length, runs: nextState.runs };
}

// Recuperacion minima: devuelve semillas cuyo titulo/enlaces casan con la consulta,
// con evidencia de por que. Nunca expone contenido de fuentes protegidas.
export function recover(query, root = CORPUS) {
  const q = query.toLowerCase();
  return digest(root)
    .filter((s) => !s.gated)
    .map((s) => {
      const why = [];
      if (s.stem.includes(q)) why.push(`titulo~${q}`);
      if ((s.links || []).some((l) => l.includes(q))) why.push(`enlace~${q}`);
      return { rel: s.rel, why };
    })
    .filter((r) => r.why.length);
}

function main() {
  const argv = process.argv.slice(2);
  const rec = argv.indexOf("--recover");
  if (rec !== -1) {
    console.log(JSON.stringify(recover(argv[rec + 1] || ""), null, 2));
    return;
  }
  console.log(JSON.stringify(run(), null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
