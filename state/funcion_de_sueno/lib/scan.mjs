// Modulo de escaneo read-only extraido del motor de la funcion de sueno (Ola M0).
//
// Proposito: primitivas reutilizables de inventario de ficheros con una FRONTERA DE
// ACCESO explicita, para que Melampo (u otro consumidor) pueda escanear corpus
// sensibles sin heredar la ambiguedad del CLI original, donde un fichero marcado
// "metadata_only" era leido igualmente para calcular su hash.
//
// Tres niveles de acceso, de menor a mayor apertura:
//   - STAT_ONLY         : solo `fs.statSync`. NUNCA abre el fichero. hash = null.
//   - HASH_AUTHORIZED   : stat + lee los bytes una vez para hashear. Sin analisis semantico.
//   - CONTENT_READABLE  : stat + hash; el consumidor puede ademas leer el contenido.
//
// El nivel lo decide una funcion de politica (`classify`) inyectada por el consumidor,
// de modo que el escaner no fija la membrana: la fija quien lo usa.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const ACCESS = Object.freeze({
  STAT_ONLY: "stat_only",
  HASH_AUTHORIZED: "hash_authorized",
  CONTENT_READABLE: "content_readable"
});

export function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function toPosix(p) {
  return p.replaceAll("\\", "/");
}

export function isSkippedDir(entryName, config) {
  return (config.skipDirs || []).some((skip) => entryName.toLowerCase() === skip.toLowerCase());
}

export function hasProtectedMarker(filePath, config) {
  const normalized = toPosix(filePath);
  return (config.protectedPathMarkers || []).some((marker) => normalized.includes(marker));
}

export function walkFiles(root, config, acc = []) {
  if (!fs.existsSync(root)) return acc;
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (!isSkippedDir(entry.name, config)) walkFiles(fullPath, config, acc);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!(config.includeExtensions || []).includes(ext)) continue;
    acc.push(fullPath);
  }
  return acc;
}

// Metadatos derivados solo de `stat` (sin abrir el fichero). Es lo que recibe la
// politica `classify` para decidir el nivel de acceso.
function statMeta(root, filePath, config) {
  const stat = fs.statSync(filePath);
  return {
    rel: toPosix(path.relative(root, filePath)),
    bytes: stat.size,
    mtime: stat.mtime.toISOString(),
    ext: path.extname(filePath).toLowerCase(),
    protected: hasProtectedMarker(filePath, config),
    tooLarge: stat.size > config.maxFileBytes
  };
}

// Escanea un unico fichero. GARANTIA: solo se llama a `fs.readFileSync` cuando el
// nivel resuelto NO es STAT_ONLY. Un fichero STAT_ONLY nunca se abre.
export function scanOne(root, filePath, config, classify) {
  const meta = statMeta(root, filePath, config);
  const access = classify(meta);
  let hash = null;
  if (access !== ACCESS.STAT_ONLY) {
    hash = sha256(fs.readFileSync(filePath));
  }
  return { ...meta, access, hash };
}

export function scanFiles(root, config, classify) {
  return walkFiles(root, config).map((filePath) => scanOne(root, filePath, config, classify));
}

// Politica que reproduce EXACTAMENTE la frontera del CLI de sueno original:
// protegidos y sobredimensionados se hashean (metadata_only historico), el resto
// es contenido legible. No usa STAT_ONLY: el motor de sueno necesita el hash de
// todos los ficheros para detectar deltas. La membrana estricta (protegido ->
// STAT_ONLY) es responsabilidad de otros consumidores, no de esta politica.
export function sleepLegacyClassify(meta) {
  return (meta.protected || meta.tooLarge) ? ACCESS.HASH_AUTHORIZED : ACCESS.CONTENT_READABLE;
}

// Lee el contenido solo si el nivel es CONTENT_READABLE; en caso contrario "".
export function readContentIfAllowed(root, record) {
  if (record.access !== ACCESS.CONTENT_READABLE) return "";
  return fs.readFileSync(path.join(root, record.rel), "utf8");
}
