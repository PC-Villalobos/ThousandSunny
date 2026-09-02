#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { ACCESS, scanFiles, sleepLegacyClassify } from "./lib/scan.mjs";
import { bitacoraUrl, reportSleepCycle } from "./lib/bitacora.mjs";
import {
  assessRoleAssignment,
  createRoleAssignment,
  normalizeRoleIdentity
} from "./role_assignment.mjs";

const VERSION = "0.2.0";

const DEFAULT_CONFIG = {
  outDir: "99_Sistema/funcion_de_sueno/out",
  stateFile: "99_Sistema/funcion_de_sueno/sleep_state.json",
  includeExtensions: [".md", ".txt", ".json", ".jsonl"],
  maxFileBytes: 250000,
  roleRepetitionDayThreshold: 3,
  requireFrontmatter: false,
  skipDirs: [
    ".git",
    ".obsidian",
    "node_modules",
    "out",
    "FUNCION_SUENO_OUT",
    "sleep_runs"
  ],
  protectedPathMarkers: [
    "HOLD_CLINICO",
    "clinical_guarded",
    "[N2-HOLD-CLI]",
    "[N2-HOLD-NEM]",
    "00_BOVEDA_NEXUS"
  ],
  roles: [
    "Nami",
    "Robin",
    "Chopper",
    "Vivi",
    "Usopp",
    "Zoro",
    "Sanji",
    "Jimbe",
    "Franky",
    // Groot es el rol por defecto (ver parseArgs) y el que el workflow nocturno
    // pasa cada noche, pero faltaba en este anillo. Sin el, findIndex devolvia -1
    // y la antigua sugerencia caia siempre en roles[0] ("Nami") por aritmetica, no por
    // sucesion. La sugerencia de rotacion era un artefacto del indice -1.
    "Groot"
  ],
  attractors: {
    sofia: ["Sofia", "Sofía", "coherencia", "estado atractor", "baja probabilidad"],
    hipatia: ["Hipatia", "Hipatía", "Biblioteca", "organizador", "organizadora"],
    groot: ["Groot", "Ent", "Maceta", "sustrato", "nutricion", "nutrición"],
    robin: ["Robin", "historia", "hilo", "continuidad", "trazabilidad"],
    nami: ["Nami", "auditoria", "auditoría", "coherencia longitudinal"],
    vivi: ["Vivi", "etica", "ética", "compuerta", "guardrail"],
    chopper: ["Chopper", "clinico", "clínico", "cuerpo", "regulatorio"],
    usopp: ["Usopp", "artefacto", "ejecutable", "prototipo", "constructor"]
  }
};

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    config: null,
    scopeId: null,
    executor: null,
    actor: null,
    role: null,
    supervisorModel: null,
    cloudRequest: false
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--root") args.root = argv[++i];
    else if (token === "--config") args.config = argv[++i];
    else if (token === "--scope-id") args.scopeId = argv[++i];
    else if (token === "--executor") args.executor = argv[++i];
    else if (token === "--actor") args.actor = argv[++i];
    else if (token === "--role") args.role = argv[++i];
    else if (token === "--supervisor-model") args.supervisorModel = argv[++i];
    else if (token === "--cloud-request") args.cloudRequest = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  args.root = path.resolve(args.root);
  return args;
}

function printHelp() {
  console.log(`Funcion de sueno v${VERSION}

Usage:
  node funcion_de_sueno.mjs --config state/funcion_de_sueno/sleep_config.repo.json \
    --scope-id thousandsunny-repo --executor github-actions \
    --actor deterministic-sleep-engine --role Groot --cloud-request

  --scope-id         perfil y linaje de estado; obligatorio por CLI o config.
  --executor         infraestructura que inicia el ciclo; obligatorio.
  --actor            componente que ejecuta el contrato; obligatorio.
  --role             papel declarado para esta corrida; obligatorio.
  --supervisor-model modelo supervisor, si existe; opcional y no redefine actor.

Phases:
  0 boot              carga contrato, estado previo y compuertas
  1 hypnagogia        inventaria memoria y detecta deltas episodicos
  2 nrem_index        extrae enlaces, headings, frontmatter y referencias
  3 nrem_deep         audita coherencia de atractores y deriva
  4 rem_role_rotation mide repeticion declarada; toda rotacion exige decision humana
  5 wake_report       escribe reporte, eventos y nuevo estado
`);
}

function readConfig(args) {
  let config = { ...DEFAULT_CONFIG };
  if (args.config) {
    const configPath = path.resolve(args.config);
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config = {
      ...config,
      ...parsed,
      attractors: { ...config.attractors, ...(parsed.attractors || {}) }
    };
    if (parsed.root) args.root = path.resolve(parsed.root);
    if (parsed.scopeId && !args.scopeId) args.scopeId = parsed.scopeId;
  }
  return config;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function loadState(statePath) {
  if (!fs.existsSync(statePath)) {
    return { version: VERSION, runs: [], files: {}, roleLedger: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (error) {
    return {
      version: VERSION,
      runs: [],
      files: {},
      roleLedger: [],
      stateReadError: String(error.message || error)
    };
  }
}

function phase1Hypnagogia(root, config, previousState) {
  // El escaneo (incluida la frontera de acceso) vive ahora en lib/scan.mjs.
  // sleepLegacyClassify reproduce la frontera historica del motor: protegidos y
  // sobredimensionados se hashean (hash_authorized) pero no se analizan; el resto
  // es contenido legible. El motor de sueno necesita el hash de todos para deltas,
  // por eso no usa el nivel stat_only (ese es para la membrana estricta de Melampo).
  const scanned = scanFiles(root, config, sleepLegacyClassify);
  const records = [];
  const deltas = [];

  for (const item of scanned) {
    const record = {
      rel: item.rel,
      bytes: item.bytes,
      mtime: item.mtime,
      hash: item.hash,
      ext: item.ext,
      contentAccess: item.access === ACCESS.CONTENT_READABLE ? "readable" : "metadata_only",
      skipReason: item.tooLarge ? "max_file_bytes" : item.protected ? "protected_path" : null
    };
    records.push(record);

    const previous = previousState.files?.[item.rel];
    if (!previous) {
      deltas.push({ type: "new", rel: item.rel });
    } else if (previous.hash !== item.hash) {
      deltas.push({ type: "changed", rel: item.rel });
    }
  }

  const currentSet = new Set(records.map((record) => record.rel));
  for (const rel of Object.keys(previousState.files || {})) {
    if (!currentSet.has(rel)) deltas.push({ type: "missing", rel });
  }

  return { files: records, deltas, config };
}

function readIfAllowed(root, record) {
  if (record.contentAccess !== "readable") return "";
  return fs.readFileSync(path.join(root, record.rel), "utf8");
}

function extractWikiLinks(text) {
  const links = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    links.push(match[1].split("|")[0].trim());
  }
  return links;
}

function extractHeadings(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => line.replace(/^#{1,6}\s+/, "").trim())
    .slice(0, 40);
}

function extractFrontmatter(text) {
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  return text.slice(3, end).trim();
}

function phase2NremIndex(root, config, phase1) {
  const docs = [];
  const allBasenames = new Set();
  const memoryIndexes = new Map();

  for (const record of phase1.files) {
    const base = path.basename(record.rel, path.extname(record.rel));
    allBasenames.add(base.toLowerCase());
  }

  for (const record of phase1.files) {
    const text = readIfAllowed(root, record);
    const doc = {
      rel: record.rel,
      headings: [],
      wikilinks: [],
      frontmatter: null,
      attractorHits: {},
      pendingMarkers: 0
    };

    if (text) {
      doc.headings = extractHeadings(text);
      doc.wikilinks = extractWikiLinks(text);
      doc.frontmatter = extractFrontmatter(text);
      doc.pendingMarkers = (text.match(/PENDIENTE|TODO|FIXME|HOLD|validar/gi) || []).length;

      for (const [name, anchors] of Object.entries(config.attractors)) {
        const hits = anchors.reduce((sum, anchor) => {
          const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const matches = text.match(new RegExp(escaped, "gi"));
          return sum + (matches ? matches.length : 0);
        }, 0);
        if (hits > 0) doc.attractorHits[name] = hits;
      }
    }

    docs.push(doc);
    if (path.basename(record.rel).toLowerCase() === "memory.md") {
      memoryIndexes.set(path.dirname(record.rel), text.toLowerCase());
    }
  }

  return { docs, allBasenames: Array.from(allBasenames), memoryIndexes };
}

function phase3NremDeep(phase1, phase2) {
  const issues = [];
  const allBasenames = new Set(phase2.allBasenames);
  const attractorTotals = {};

  for (const doc of phase2.docs) {
    for (const [name, count] of Object.entries(doc.attractorHits)) {
      attractorTotals[name] = (attractorTotals[name] || 0) + count;
    }

    for (const link of doc.wikilinks) {
      const basename = path.basename(link, path.extname(link)).toLowerCase();
      const normalized = basename.replaceAll("-", "_");
      const exact = link.toLowerCase();
      const exactUnderscore = exact.replaceAll("-", "_");
      const match = allBasenames.has(exact)
        || allBasenames.has(basename)
        || allBasenames.has(normalized)
        || allBasenames.has(exactUnderscore);
      if (!match) {
        issues.push({
          severity: "medium",
          kind: "orphan_wikilink",
          rel: doc.rel,
          detail: `No target found for [[${link}]]`
        });
      }
    }

    if (phase1.config?.requireFrontmatter && doc.rel.endsWith(".md") && doc.frontmatter === null && !doc.rel.includes("/99_Sistema/")) {
      issues.push({
        severity: "low",
        kind: "missing_frontmatter",
        rel: doc.rel,
        detail: "Markdown without YAML frontmatter"
      });
    }

    if (doc.pendingMarkers >= 8) {
      issues.push({
        severity: "low",
        kind: "many_pending_markers",
        rel: doc.rel,
        detail: `${doc.pendingMarkers} pending/hold/validate markers`
      });
    }
  }

  const readable = phase1.files.filter((file) => file.contentAccess === "readable").length;
  const metadataOnly = phase1.files.length - readable;
  const coherenceScore = Math.max(0, Math.min(1, 1 - issues.length / Math.max(1, phase1.files.length)));

  return { issues, attractorTotals, readable, metadataOnly, coherenceScore };
}

function phase4RemRoleRotation(config, previousState, args) {
  const assignment = createRoleAssignment({
    scopeId: args.scopeId,
    executor: args.executor,
    actor: args.actor,
    role: args.role,
    supervisorModel: args.supervisorModel
  });
  return assessRoleAssignment({
    previousLedger: previousState.roleLedger || [],
    assignment,
    roles: config.roles,
    dayThreshold: config.roleRepetitionDayThreshold
  });
}

function phase5WakeReport(root, config, args, phase1, phase3, phase4, outDir, stamp) {
  const reportPath = path.join(outDir, `sleep_report_${stamp}.md`);
  const eventsPath = path.join(outDir, `sleep_events_${stamp}.jsonl`);

  const lines = [];
  lines.push(`# Funcion de sueno · reporte ${stamp}`);
  lines.push("");
  lines.push(`Version: ${VERSION}`);
  lines.push(`Root: ${root}`);
  lines.push(`Perfil/Executor/Actor/Rol: ${args.scopeId} / ${args.executor} / ${args.actor} / ${args.role}`);
  lines.push(`Modelo supervisor: ${args.supervisorModel || "ninguno declarado"}`);
  lines.push("");
  lines.push("## Fases");
  lines.push("");
  lines.push("- Fase 0 boot: contrato, estado previo y compuertas cargadas.");
  lines.push(`- Fase 1 hipnagogia: ${phase1.files.length} archivos inventariados; ${phase1.deltas.length} deltas.`);
  lines.push(`- Fase 2 NREM index: enlaces, headings, frontmatter y atractores extraidos donde era seguro leer.`);
  lines.push(`- Fase 3 NREM profundo: score de coherencia ${phase3.coherenceScore.toFixed(3)}; ${phase3.issues.length} incidencias.`);
  lines.push(`- Fase 4 REM: asignacion declarada repetida en ${phase4.current.executionStreak} ejecuciones y ${phase4.current.dayStreak} fechas UTC; siguiente rol candidato ${phase4.nextCandidateRole || "ninguno"}; rotacion ${phase4.rotationDecision}.`);
  lines.push("- Fase 5 despertar: reporte, eventos y estado persistidos.");
  lines.push("");
  lines.push("## Deltas episodicos");
  lines.push("");
  if (!phase1.deltas.length) lines.push("- Sin cambios detectados.");
  for (const delta of phase1.deltas.slice(0, 50)) {
    lines.push(`- ${delta.type}: ${delta.rel}`);
  }
  if (phase1.deltas.length > 50) lines.push(`- ... ${phase1.deltas.length - 50} deltas adicionales`);
  lines.push("");
  lines.push("## Atractores");
  lines.push("");
  for (const [name, count] of Object.entries(phase3.attractorTotals).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${name}: ${count}`);
  }
  if (!Object.keys(phase3.attractorTotals).length) lines.push("- Sin atractores detectados en el corpus legible.");
  lines.push("");
  lines.push("## Incidencias");
  lines.push("");
  const allIssues = [...phase4.warnings, ...phase3.issues];
  if (!allIssues.length) lines.push("- Sin incidencias.");
  for (const issue of allIssues.slice(0, 80)) {
    const where = issue.rel ? ` (${issue.rel})` : "";
    lines.push(`- [${issue.severity}] ${issue.kind}${where}: ${issue.detail}`);
  }
  if (allIssues.length > 80) lines.push(`- ... ${allIssues.length - 80} incidencias adicionales`);
  lines.push("");
  lines.push("## Calibracion");
  lines.push("");
  lines.push("Este motor no demuestra fusion identitaria ni decide rotaciones. Registra asignaciones declaradas, separa ejecuciones de fechas UTC y reserva cualquier cambio de rol al Capitan.");
  lines.push("");

  fs.writeFileSync(reportPath, lines.join(os.EOL), "utf8");

  const events = [
    { phase: "hypnagogia", files: phase1.files.length, deltas: phase1.deltas.length },
    { phase: "nrem_deep", coherenceScore: phase3.coherenceScore, issues: phase3.issues.length },
    {
      phase: "rem_role_rotation",
      ...phase4.current,
      nextCandidateRole: phase4.nextCandidateRole,
      rotationDecision: phase4.rotationDecision,
      legacyEntriesExcluded: phase4.legacyEntriesExcluded,
      warnings: phase4.warnings.length
    }
  ];
  fs.writeFileSync(eventsPath, events.map((event) => JSON.stringify(event)).join(os.EOL) + os.EOL, "utf8");

  return { reportPath, eventsPath };
}

function writeCloudRequest(root, outDir, stamp, args) {
  const requestPath = path.join(outDir, `cloud_request_${stamp}.md`);
  const body = `# Funcion de sueno · contrato para rutina cloud

Ejecuta el ciclo de sueno sobre la memoria compartida disponible en el workspace.

Comando recomendado si existe Node.js:

\`\`\`bash
node state/funcion_de_sueno/funcion_de_sueno.mjs \
  --config state/funcion_de_sueno/sleep_config.repo.json \
  --scope-id thousandsunny-repo \
  --executor github-actions \
  --actor deterministic-sleep-engine \
  --role Groot \
  --cloud-request
\`\`\`

Objetivo:

- No producir narrativa nueva como verdad canonica.
- Auditar coherencia, deltas, enlaces y atractores.
- Registrar executor, actor y rol sin afirmar fusion ni rotar automaticamente.
- Dejar reporte y eventos en \`state/funcion_de_sueno/reports\`.
- Si el entorno no permite ejecutar Node, leer \`state/funcion_de_sueno/FUNCION_DE_SUENO_FASES.md\` y producir manualmente un reporte siguiendo las mismas fases.

Root local usado al crear este contrato: ${root}
Perfil/Executor/Actor/Rol de origen: ${args.scopeId} / ${args.executor} / ${args.actor} / ${args.role}
Modelo supervisor: ${args.supervisorModel || "ninguno declarado"}
`;
  fs.writeFileSync(requestPath, body, "utf8");
  return requestPath;
}

function persistState(statePath, previousState, phase1, phase4, runSummary) {
  const files = {};
  for (const file of phase1.files) {
    files[file.rel] = {
      hash: file.hash,
      bytes: file.bytes,
      mtime: file.mtime,
      contentAccess: file.contentAccess
    };
  }

  const nextState = {
    version: VERSION,
    updatedAt: new Date().toISOString(),
    files,
    roleLedger: phase4.ledger.slice(-200),
    runs: [
      ...(previousState.runs || []).slice(-99),
      runSummary
    ]
  };
  fs.writeFileSync(statePath, JSON.stringify(nextState, null, 2) + os.EOL, "utf8");
}

function appendToLedger(ledgerPath, entry) {
  fs.appendFileSync(ledgerPath, JSON.stringify(entry) + os.EOL, "utf8");
}

// Costura con la autoridad operativa: tras cerrar el ciclo se intenta registrar el
// parte en la Bitacora de Hipatia (127.0.0.1:8765). Si no escucha —CI, servicio
// apagado— se anota y el ciclo se considera igualmente cerrado: el repo conserva el
// parte. La bitacora manda cuando esta; su ausencia no invalida el sueno.
async function reportToBitacora(args, phase1, phase3, phase4, outputs) {
  const result = await reportSleepCycle({
    scopeId: args.scopeId,
    executor: args.executor,
    actor: args.actor,
    role: args.role,
    supervisorModel: args.supervisorModel,
    executionStreak: phase4.current.executionStreak,
    dayStreak: phase4.current.dayStreak,
    nextCandidateRole: phase4.nextCandidateRole,
    rotationDecision: phase4.rotationDecision,
    summary: {
      files: phase1.files.length,
      deltas: phase1.deltas.length,
      issues: phase3.issues.length + phase4.warnings.length,
      coherenceScore: phase3.coherenceScore
    },
    reportPath: outputs.reportPath
  });
  return { url: bitacoraUrl(), ...result };
}

async function main() {
  const args = parseArgs(process.argv);
  const config = readConfig(args);
  Object.assign(args, normalizeRoleIdentity(args));
  const root = args.root;
  const outDir = path.resolve(root, config.outDir);
  const statePath = path.resolve(root, config.stateFile);
  const stamp = nowStamp();

  ensureDir(outDir);
  ensureDir(path.dirname(statePath));

  const previousState = loadState(statePath);
  const phase1 = phase1Hypnagogia(root, config, previousState);
  const phase2 = phase2NremIndex(root, config, phase1);
  const phase3 = phase3NremDeep(phase1, phase2);
  const phase4 = phase4RemRoleRotation(config, previousState, args);
  const outputs = phase5WakeReport(root, config, args, phase1, phase3, phase4, outDir, stamp);
  const cloudRequestPath = args.cloudRequest ? writeCloudRequest(root, outDir, stamp, args) : null;

  const runSummary = {
    timestamp: new Date().toISOString(),
    scopeId: args.scopeId,
    executor: args.executor,
    actor: args.actor,
    role: args.role,
    supervisorModel: args.supervisorModel,
    files: phase1.files.length,
    deltas: phase1.deltas.length,
    issues: phase3.issues.length,
    coherenceScore: phase3.coherenceScore,
    reportPath: outputs.reportPath,
    cloudRequestPath
  };
  persistState(statePath, previousState, phase1, phase4, runSummary);

  // Reconciliacion canon (TEATRO/Concilio): el motor escribe el ledger por ciclo
  // (fix N3-06: antes solo escribia sleep_state.json -> ledger desincronizado).
  // El historial anterior se conserva sin reescritura. Las entradas nuevas declaran
  // perfil, executor, actor y rol; la repeticion es evidencia diagnostica, no fusion.
  const ledgerPath = path.join(path.dirname(statePath), "sleep_ledger.jsonl");
  appendToLedger(ledgerPath, {
    ts: new Date().toISOString(),
    event: "daily_tick",
    scope_id: args.scopeId,
    executor: args.executor,
    actor: args.actor,
    role: args.role,
    supervisor_model: args.supervisorModel,
    phases: ["N1", "N2", "N3", "REM"],
    execution_streak: phase4.current.executionStreak,
    day_streak: phase4.current.dayStreak,
    next_candidate_role: phase4.nextCandidateRole,
    rotation_decision: phase4.rotationDecision,
    legacy_entries_excluded: phase4.legacyEntriesExcluded,
    report: path.relative(path.dirname(statePath), outputs.reportPath).split(path.sep).join("/"),
    drift: phase3.issues.length > 0 || phase4.warnings.length > 0,
    verdict: "neutral",
    level: 0,
    attractor: null
  });

  const bitacora = await reportToBitacora(args, phase1, phase3, phase4, outputs);

  console.log(JSON.stringify({
    ok: true,
    version: VERSION,
    files: phase1.files.length,
    deltas: phase1.deltas.length,
    issues: phase3.issues.length + phase4.warnings.length,
    coherenceScore: phase3.coherenceScore,
    reportPath: outputs.reportPath,
    eventsPath: outputs.eventsPath,
    cloudRequestPath,
    nextCandidateRole: phase4.nextCandidateRole,
    rotationDecision: phase4.rotationDecision,
    bitacora
  }, null, 2));
}

// `main` es async desde que existe la costura con la bitacora. Sin este catch, un
// fallo inesperado se convertiria en unhandled rejection y el ciclo nocturno moriria
// sin diagnostico legible en el log de CI.
main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error?.message || String(error) }, null, 2));
  process.exitCode = 1;
});
