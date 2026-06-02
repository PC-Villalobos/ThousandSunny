/**
 * ============================================================
 * ðŸ´â€â˜ ï¸ THOUSAND SUNNY HUB â€” v2.0
 * Orquestador real de agentes IA + GAS + Desktop
 *
 * Agentes reales conectados:
 *   Nami      â†’ Claude API (Anthropic)          /api/claude
 *   Usopp     â†’ Codex SDK real (OpenAI)         /api/codex
 *   Sanji     â†’ Antigravity REST (Google)       /api/antigravity
 *   GAS       â†’ Google Apps Script backend      /api/gas
 *   Desktop   â†’ Python bridge local             /api/desktop
 *   Puente    â†’ Todos los agentes en paralelo   /api/puente
 *
 * Instalar:
 *   npm install express ws dotenv cors @openai/codex-sdk
 *
 * Arrancar:
 *   node hub-server.js   (o doble clic en start-hub.bat)
 * ============================================================
 */

const path = require("path");
const explicitEnv = { ...process.env };
require("dotenv").config({ path: path.join(__dirname, "hub.env") });
require("dotenv").config({ path: path.join(__dirname, "hub.local.env"), override: true });
for (const key of Object.keys(explicitEnv)) process.env[key] = explicitEnv[key];
const express = require("express");
const {
  isToolAllowed,
  untrustedContextMessage,
  resolveAndCheckPath,
  checkOutboundUrl,
} = require("./sunny_security_kernel");
const { WebSocketServer } = require("ws");
const http    = require("http");
const cors    = require("cors");
const { captureAnanda, recordDiscovery, resolveDiscovery, getAnandaState } = require("./ananda-memory");
const { Klabautermann, registry, THEATER_CASTING, NaturalLanguageReporter } = require("./omnicore");
const {
  deliverFleetMessage,
  deliverPendingFleetMessages,
  enqueueFleetMessage,
  getFleetTransportStatus,
  listFleetOutbox,
} = require("./fleet-outbox");
const {
  loadSharedState,
  appendSharedEvent,
  upsertSharedProject,
  updateConversationSnapshot,
  listSharedEvents,
  startMission,
  closeMission,
  findMission,
  listMissions,
  getProtocolSummary,
  getCoreSummary,
  getSharedStateSummary,
  detectProjectIds,
} = require("./shared-state");
const {
  buildAutomaticCheckpoint,
  cleanSharedSummary,
  mirrorSharedToGas,
  saveSharedCheckpoint,
} = require("./shared-checkpoint");

// Listener global de Klabautermann
Klabautermann.on('state_changed', (state) => {
    broadcast({ type: 'klabautermann_state', state });
});

registry.on('run_updated', (data) => {
    const run = registry.getRun(data.runId);
    if(run) {
        const report = NaturalLanguageReporter.generateReport(run, data.eventType, data.details);
        broadcast({ type: 'klabautermann_report', runId: data.runId, report, status: data.runStatus });
    }
});

// â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PORT        = process.env.HUB_PORT        || 3333;
const BRIDGE_URL  = `http://localhost:${process.env.BRIDGE_PORT || 3334}`;
const GAS_URL     = process.env.GAS_URL         || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN || "";
const DEFAULT_TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const TELEGRAM_MESSAGE_LIMIT = 4000;
const INTERNAL_HUB_URL = `http://127.0.0.1:${PORT}`;

const KEYS = {
  anthropic   : process.env.ANTHROPIC_KEY        || "",
  openai      : process.env.OPENAI_KEY           || "",          // para Codex SDK
  antigravity : process.env.ANTIGRAVITY_TOKEN    || "",          // Bearer token OAuth Google
  antigravityProject: process.env.ANTIGRAVITY_PROJECT || "",     // project ID Google Cloud
};

// â”€â”€ App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// â”€â”€ AutenticaciÃ³n por token (defensa remota) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HUB_TOKEN = process.env.HUB_TOKEN || "";
const AUTH_ENABLED = !!HUB_TOKEN;
const LOCALHOST_IPS = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const TRUSTED_ROLES = new Set(["captain", "nakama", "automation", "public_webhook"]);
const SUNNY_ALLOWED_ROOTS = [
  process.env.SUNNY_PROJECT_ROOT,
  process.cwd(),
  __dirname,
  path.resolve(__dirname, ".."),
  ...String(process.env.SUNNY_ALLOWED_ROOTS || "").split(path.delimiter),
].filter(Boolean);
const DESKTOP_PATH_FIELDS = ["path", "filePath", "workingDir", "cwd", "targetPath"];

function isLocalRequest(req) {
  const ip = req.ip || req.connection?.remoteAddress || "";
  return LOCALHOST_IPS.has(ip);
}

function getRequestToken(req) {
  const bearer = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const qToken = req.query.token || req.body?.token || "";
  return bearer || qToken;
}

function normalizeRequestedRole(value) {
  const role = String(value || "").trim().toLowerCase();
  return TRUSTED_ROLES.has(role) ? role : "";
}

function resolveActorRole(req, { authenticated = false, local = false } = {}) {
  const requested = normalizeRequestedRole(req.body?.actorRole || req.body?.role || req.query.role);
  if (authenticated || local) return requested || "captain";
  return "public_webhook";
}

function attachSecurityContext(req, role) {
  req.actorRole = role;
  req.securityContext = { role };
  req.canUseTool = (toolName, overrides) => isToolAllowed(role, toolName, overrides);
}

function redactUrlForLog(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || ""));
    if (parsed.hostname === "api.telegram.org") {
      parsed.pathname = parsed.pathname.replace(/\/bot[^/]+/, "/bot[redacted]");
    }
    if (parsed.search) parsed.search = "?[redacted]";
    return parsed.toString();
  } catch {
    return "[invalid-url]";
  }
}

function asUntrustedContent(label, content) {
  return untrustedContextMessage(label, content).content;
}

function providerSafeMessages(messages, label) {
  const list = Array.isArray(messages) ? messages : [{ role: "user", content: messages }];
  return list.map((msg, index) => {
    const role = msg?.role === "assistant" ? "assistant" : "user";
    const rawContent = Array.isArray(msg?.content)
      ? JSON.stringify(msg.content)
      : String(msg?.content || "");
    return {
      role,
      content: role === "user" ? asUntrustedContent(`${label}:${index}`, rawContent) : rawContent,
    };
  });
}

function guardDesktopPayload(rawBody = {}) {
  const guarded = { ...rawBody };
  for (const field of DESKTOP_PATH_FIELDS) {
    if (typeof guarded[field] === "string" && guarded[field].trim()) {
      guarded[field] = resolveAndCheckPath(guarded[field], SUNNY_ALLOWED_ROOTS);
    }
  }
  return guarded;
}

function authMiddleware(req, res, next) {
  const local = isLocalRequest(req);
  const publicPaths = ["/", "/puente", "/manifest.json", "/sw.js", "/api/status"];
  const publicRoute = publicPaths.includes(req.path) || req.path.startsWith("/icon");

  if (!AUTH_ENABLED) {
    attachSecurityContext(req, resolveActorRole(req, { local }));
    return next();
  }
  if (local) {
    attachSecurityContext(req, resolveActorRole(req, { authenticated: true, local: true }));
    return next();
  }
  if (publicRoute) {
    attachSecurityContext(req, "public_webhook");
    return next();
  }
  if (getRequestToken(req) === HUB_TOKEN) {
    attachSecurityContext(req, resolveActorRole(req, { authenticated: true }));
    return next();
  }
  return res.status(401).json({ error: "Token invalido. Anade Authorization: Bearer <HUB_TOKEN>" });

  // Sin token configurado = modo local abierto (sin auth)
  // Localhost siempre pasa (navegador local del CapitÃ¡n)
  // Rutas pÃºblicas: UI y manifest (necesitan cargar para luego autenticarse vÃ­a JS)
  // Verificar token Bearer o query param
}
app.use(authMiddleware);

// â”€â”€ WebSocket auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// El token se pasa como query param: ws://host:3333/?token=xxx
function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach(ws => { if (ws.readyState === 1) ws.send(payload); });
}

wss.on("connection", (ws, req) => {
  // Verificar token en WebSocket si auth estÃ¡ habilitado (localhost exempt)
  if (AUTH_ENABLED) {
    const wsIp = req.socket?.remoteAddress || "";
    const isLocal = wsIp === "127.0.0.1" || wsIp === "::1" || wsIp === "::ffff:127.0.0.1";
    if (!isLocal) {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const wsToken = url.searchParams.get("token");
      if (wsToken !== HUB_TOKEN) {
        ws.close(4001, "Token invalido");
        console.warn("[WS] Conexion rechazada: token invalido");
        return;
      }
    }
  }
  console.log("[WS] Cliente conectado" + (AUTH_ENABLED ? " (autenticado)" : ""));
  ws.send(JSON.stringify({ type: "connected", msg: "Thousand Sunny Hub v2.0 â€” Agentes reales activos" }));
});

// â”€â”€ Fetch helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function fetchJSON(url, options) {
  const guard = await checkOutboundUrl(url, { blockPrivate: false });
  if (!guard.ok) {
    throw new Error(`Outbound URL blocked (${guard.reason}): ${redactUrlForLog(url)}`);
  }
  const f = globalThis.fetch ?? (await import("node-fetch")).default;
  const res  = await f(url, options);
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

// â”€â”€ BitÃ¡cora GAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function logBitacora(nakama, mensaje, motor = "hub") {
  if (!GAS_URL) return;
  const params = new URLSearchParams({ action: "log_cowork", nakama, mensaje: mensaje.substring(0, 500), motor });
  try { await fetchJSON(`${GAS_URL}?${params}`); }
  catch (e) { console.warn("[BitÃ¡cora]", e.message); }
}

async function logBitacoraRoute(route, nakama, mensaje, motor = "hub") {
  if (!GAS_URL) return;
  const params = new URLSearchParams({
    action: "log_cowork",
    ruta: route,
    nakama,
    mensaje: String(mensaje || "").substring(0, 500),
    motor,
  });
  try { await fetchJSON(`${GAS_URL}?${params}`); }
  catch (e) { console.warn("[BitÃ¡cora]", e.message); }
}

async function getRecentBitacora({ since, hours = 12 } = {}) {
  if (!GAS_URL) throw new Error("GAS_URL no configurada");
  const safeHours = Math.min(Math.max(Number(hours) || 12, 1), 168);
  const effectiveSince = since || new Date(Date.now() - safeHours * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({ action: "bitacora_desde", since: effectiveSince });
  const r = await fetchJSON(`${GAS_URL}?${params}`);
  if (!r.ok) throw new Error(typeof r.data === "string" ? r.data : JSON.stringify(r.data));
  return { since: effectiveSince, entries: Array.isArray(r.data) ? r.data : [] };
}

function inferProjectIds(...parts) {
  return detectProjectIds(parts.filter(Boolean).join("\n"));
}

function normalizeTelegramText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function getTelegramApiUrl(method) {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN no configurado");
  }
  return `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
}

async function sendTelegramMessage({ text, chatId }) {
  const resolvedChatId = chatId || DEFAULT_TELEGRAM_CHAT_ID;
  const resolvedText = normalizeTelegramText(text);

  if (!resolvedChatId) {
    throw new Error("TELEGRAM_CHAT_ID no configurado y chatId no recibido");
  }
  if (!resolvedText) {
    throw new Error("Mensaje vacio para Telegram");
  }

  const response = await fetchJSON(getTelegramApiUrl("sendMessage"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: resolvedChatId,
      text: resolvedText,
      disable_web_page_preview: true,
    }),
  });

  const apiOk =
    response.ok &&
    (!response.data || typeof response.data !== "object" || response.data.ok !== false);
  if (!apiOk) {
    throw new Error(
      `Telegram sendMessage fallo (${response.status}): ${
        typeof response.data === "string" ? response.data : JSON.stringify(response.data)
      }`
    );
  }

  return {
    ok: true,
    chatId: resolvedChatId,
    messageId: response.data?.result?.message_id ?? null,
    raw: response.data,
  };
}

async function internalHubPost(route, body = {}) {
  const response = await fetchJSON(`${INTERNAL_HUB_URL}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      typeof response.data === "string" ? response.data : JSON.stringify(response.data)
    );
  }

  return response.data;
}

function getTelegramNakamaLabel(value = "") {
  const label = String(value || "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return label || "Puente";
}

function splitTelegramText(text, maxLength = TELEGRAM_MESSAGE_LIMIT) {
  const normalized = normalizeTelegramText(text);
  if (!normalized) return [];
  if (normalized.length <= maxLength) return [normalized];

  const chunks = [];
  let remaining = normalized;

  while (remaining.length > maxLength) {
    let cut = remaining.lastIndexOf("\n", maxLength);
    if (cut < Math.floor(maxLength * 0.6)) {
      cut = remaining.lastIndexOf(" ", maxLength);
    }
    if (cut < Math.floor(maxLength * 0.6)) {
      cut = maxLength;
    }
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trimStart();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

function formatTelegramMessages(response) {
  const label = getTelegramNakamaLabel(response?.nakama);
  const content = normalizeTelegramText(
    response?.error ? `[ERROR] ${response.error}` : response?.reply || ""
  ) || "[sin contenido]";
  const bodyBudget = Math.max(256, TELEGRAM_MESSAGE_LIMIT - label.length - 12);
  const chunks = splitTelegramText(content, bodyBudget);

  if (chunks.length <= 1) {
    return [`${label}\n\n${chunks[0] || "[sin contenido]"}`];
  }

  return chunks.map((chunk, index) => `${label} (${index + 1}/${chunks.length})\n\n${chunk}`);
}

function ensureTelegramCrewResponses(responses = []) {
  const responseMap = new Map(
    responses.map((response) => [getTelegramNakamaLabel(response?.nakama), response])
  );

  return [
    {
      label: "Nami",
      enabled: !!KEYS.anthropic,
      missingError: "ANTHROPIC_KEY no configurada en el hub.",
    },
    {
      label: "Usopp",
      enabled: !!KEYS.openai,
      missingError: "OPENAI_KEY no configurada en el hub.",
    },
    {
      label: "Sanji",
      enabled: !!(KEYS.antigravity || process.env.GEMINI_KEY),
      missingError: "ANTIGRAVITY_TOKEN ni GEMINI_KEY configurados en el hub.",
    },
  ].map(({ label, enabled, missingError }) => {
    if (responseMap.has(label)) {
      return responseMap.get(label);
    }
    return {
      nakama: label,
      error: enabled ? "Sin respuesta del agente." : missingError,
    };
  });
}

function rememberCaptainTurn(text, route, source, projectIds = [], tags = []) {
  const summary = cleanSharedSummary(text);
  if (!summary) return null;
  return appendSharedEvent({
    kind: "captain_turn",
    title: "Turno del Capitan",
    summary,
    route,
    source,
    actor: "capitan",
    projectIds,
    tags,
  });
}

function rememberAgentReply(actor, reply, route, source, projectIds = [], tags = []) {
  const summary = cleanSharedSummary(reply);
  if (!summary) return null;
  return appendSharedEvent({
    kind: "agent_reply",
    title: `Respuesta de ${actor}`,
    summary,
    route,
    source,
    actor,
    projectIds,
    tags,
  });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AGENTES REALES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ 1. NAMI â€” Claude API (Anthropic) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function callClaude(messages, { model = "claude-sonnet-4-6", system = "" } = {}) {
  if (!KEYS.anthropic) throw new Error("ANTHROPIC_KEY no configurada");
  const start = Date.now();
  const safeMessages = providerSafeMessages(messages, "api/claude");
  const r = await fetchJSON("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": KEYS.anthropic,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model, max_tokens: 4096,
      system: system || "Eres Nami, navegante del Thousand Sunny. Responde en espaÃ±ol.",
      messages: safeMessages,
    }),
  });
  if (!r.ok) throw new Error(`Claude error ${r.status}: ${JSON.stringify(r.data)}`);
  return {
    reply  : r.data.content?.[0]?.text ?? "",
    tokens : r.data.usage?.output_tokens ?? 0,
    elapsed: Date.now() - start,
    model,
  };
}

// â”€â”€ 2. USOPP â€” Codex SDK real (OpenAI) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Codex es un agente de ejecuciÃ³n real, no chat.
// Recibe una tarea, la razona, ejecuta cÃ³digo, devuelve resultado.
async function callCodex(task, { workingDir = "" } = {}) {
  if (!KEYS.openai) throw new Error("OPENAI_KEY no configurada para Codex");

  const start = Date.now();
  const guardedTask = asUntrustedContent("api/codex", task);

  // Intentar usar el SDK de Codex si estÃ¡ instalado
  try {
    const { Codex } = require("@openai/codex-sdk");
    const codex  = new Codex({ apiKey: KEYS.openai });
    const thread = codex.startThread(workingDir ? { workingDirectory: workingDir } : {});
    const result = await thread.run(guardedTask);
    return {
      reply  : result.finalResponse ?? result.items?.map(i => i.content).join("\n") ?? "",
      tokens : 0, // Codex SDK no expone token count directamente
      elapsed: Date.now() - start,
      model  : "codex-agent",
      items  : result.items ?? [],
    };
  } catch (sdkErr) {
    // Fallback: Chat Completions con o4-mini (Codex Mini subyacente, sin container requerido)
    console.warn("[Codex] SDK no disponible, usando Chat Completions:", sdkErr.message);
    const r = await fetchJSON("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KEYS.openai}`,
        "content-type" : "application/json",
      },
      body: JSON.stringify({
        model: "o4-mini",
        messages: [
          {
            role: "system",
            content: "Eres Usopp, agente de cÃ³digo y anÃ¡lisis del Thousand Sunny. Razonas con precisiÃ³n, ejecutas lÃ³gica paso a paso y respondes en espaÃ±ol. Eres conciso pero completo."
          },
          { role: "user", content: guardedTask }
        ],
      }),
    });
    if (!r.ok) throw new Error(`Codex API error ${r.status}: ${JSON.stringify(r.data)}`);
    const reply = r.data.choices?.[0]?.message?.content ?? JSON.stringify(r.data);
    return {
      reply,
      tokens : r.data.usage?.completion_tokens ?? 0,
      elapsed: Date.now() - start,
      model  : "o4-mini",
    };
  }
}

// â”€â”€ 3. SANJI â€” Antigravity REST (Google) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Antigravity es el IDE agÃ©ntico de Google (lanzado nov 2025 con Gemini 3).
// Usa OAuth2 con cuenta Google. Soporta Gemini 3.1 Pro, Claude Opus, GPT-OSS.
async function callAntigravity(text, { model = "gemini-3-pro", system = "" } = {}) {
  if (!KEYS.antigravity) throw new Error("ANTIGRAVITY_TOKEN no configurado");
  const start = Date.now();
  const guardedText = asUntrustedContent("api/antigravity", text);

  // Antigravity expone un endpoint unificado estilo Gemini
  const endpoint = "https://antigravity.googleapis.com/v1beta/models/" + model + ":generateContent";

  const body = {
    project: KEYS.antigravityProject || undefined,
    contents: [{ role: "user", parts: [{ text: guardedText }] }],
    generationConfig: { maxOutputTokens: 2048, temperature: 0.85 },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const r = await fetchJSON(endpoint, {
    method: "POST",
    headers: {
      "Authorization" : `Bearer ${KEYS.antigravity}`,
      "Content-Type"  : "application/json",
      "User-Agent"    : "ThousandSunnyHub/2.0",
      "Client-Metadata": JSON.stringify({ ide: "cowork", platform: "hub" }),
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) throw new Error(`Antigravity error ${r.status}: ${JSON.stringify(r.data)}`);

  const reply  = r.data.candidates?.[0]?.content?.parts?.[0]?.text ?? JSON.stringify(r.data);
  const tokens = r.data.usageMetadata?.candidatesTokenCount ?? 0;

  return { reply, tokens, elapsed: Date.now() - start, model };
}

// â”€â”€ Fallback Gemini directo (sin Antigravity) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function callGemini(text, { model = "gemini-2.5-flash", system = "" } = {}) {
  const geminiKey = process.env.GEMINI_KEY || "";
  if (!geminiKey) throw new Error("GEMINI_KEY no configurada");
  const start = Date.now();
  const guardedText = asUntrustedContent("api/gemini", text);
  const url   = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
  const body  = { contents: [{ role: "user", parts: [{ text: guardedText }] }] };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const r = await fetchJSON(url, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  if (!r.ok) {
    // Retry con flash-lite si 429 (rate limit free tier)
    if (r.status === 429 && model !== "gemini-2.0-flash-lite") {
      console.warn("[Gemini] 429 rate limit, reintentando con gemini-2.0-flash-lite...");
      return callGemini(text, { model: "gemini-2.0-flash-lite", system });
    }
    throw new Error(`Gemini error ${r.status}`);
  }
  return {
    reply  : r.data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
    tokens : r.data.usageMetadata?.candidatesTokenCount ?? 0,
    elapsed: Date.now() - start,
    model,
  };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ENDPOINTS HTTP
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

app.get("/api/status", (req, res) => {
  Klabautermann.ping(); // Activa biorritmo
  const ananda = getAnandaState();
  const shared = getSharedStateSummary();
  res.json({
    hub    : "ok",
    version: "2.0",
    auth   : {
      required: AUTH_ENABLED,
      remoteHint: AUTH_ENABLED ? "Abre /puente#token=TU_HUB_TOKEN una vez en el dispositivo remoto" : null,
    },
    agentes: {
      nami      : { ok: !!KEYS.anthropic,   motor: "Claude API (Anthropic)" },
      usopp     : { ok: !!KEYS.openai,      motor: "Codex SDK (OpenAI)" },
      sanji     : { ok: !!(KEYS.antigravity || process.env.GEMINI_KEY), motor: KEYS.antigravity ? "Antigravity (Google)" : process.env.GEMINI_KEY ? "Gemini Direct (fallback)" : "No configurado" },
      gas       : { ok: !!GAS_URL,          motor: "Google Apps Script" },
      desktop   : { ok: true,               motor: "Python Bridge local" },
    },
    ananda: {
      ok       : true,
      sutras   : ananda.totals?.sutras ?? 0,
      eventos  : ananda.totals?.events ?? 0,
      discoveries: ananda.totals?.discoveries ?? 0,
      updatedAt: ananda.updatedAt || null,
    },
    shared,
  });
});

app.get("/api/estado/full", async (req, res) => {
  Klabautermann.ping();
  if (!GAS_URL) return res.status(500).json({ error: "GAS_URL no configurada" });
  try {
    const r = await fetchJSON(`${GAS_URL}?action=get_estado_full`);
    res.status(r.status || 200).json(r.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/klabautermann/runs", (req, res) => {
  res.json({
    active: Array.from(registry.activeRuns.values()),
    history: registry.runHistory
  });
});

app.get("/api/klabautermann/ping", (req, res) => {
  Klabautermann.ping();
  res.json({ state: Klabautermann.state });
});

app.get("/api/bitacora/recent", async (req, res) => {
  try {
    const data = await getRecentBitacora({
      since: req.query.since,
      hours: req.query.hours,
    });
    res.json({
      ok: true,
      since: data.since,
      count: data.entries.length,
      entries: data.entries,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/ananda/state", (req, res) => {
  res.json(getAnandaState());
});

app.post("/api/ananda/ingest", async (req, res) => {
  try {
    const summary = await captureAnanda({
      text            : req.body.text,
      speaker         : req.body.speaker || "capitan",
      route           : req.body.route || req.path,
      source          : req.body.source || "manual",
      context         : req.body.context || req.body.contexto || "",
      objectiveContext: req.body.objectiveContext || req.body.objetivo || "",
      responses       : req.body.responses || [],
      logFn           : logBitacora,
      broadcastFn     : broadcast,
    });
    res.json(summary);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/ananda/discovery", async (req, res) => {
  try {
    const discovery = recordDiscovery({
      title         : req.body.title,
      meaning       : req.body.meaning,
      triggerPhrases: req.body.triggerPhrases || req.body.disparadores || [],
      evidence      : req.body.evidence || req.body.evidencia || "",
      route         : req.body.route || req.path,
      source        : req.body.source || "manual",
      discoveredBy  : req.body.discoveredBy || req.body.descubiertoPor || "Ananda",
    });
    res.json(discovery);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/ananda/resolve", (req, res) => {
  try {
    res.json(resolveDiscovery(req.query.query || req.query.q || ""));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// â”€â”€ /api/claude â€” Nami â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get("/api/shared/state", (req, res) => {
  try {
    res.json(loadSharedState());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/shared/projects", (req, res) => {
  try {
    const state = loadSharedState();
    res.json({
      ok: true,
      updatedAt: state.updatedAt,
      projects: state.projects,
      summary: getSharedStateSummary(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/shared/events", (req, res) => {
  try {
    res.json(
      listSharedEvents({
        limit: req.query.limit,
        projectId: req.query.projectId || req.query.project,
        tag: req.query.tag,
      })
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/protocol", (req, res) => {
  try {
    res.json(getProtocolSummary({ limit: req.query.limit }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/core", (req, res) => {
  try {
    res.json(getCoreSummary({
      includeSchemas: req.query.schemas === "1" || req.query.schemas === "true",
    }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/core/schemas", (req, res) => {
  try {
    res.json(getCoreSummary({ includeSchemas: true }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/fleet/status", (req, res) => {
  try {
    res.json({
      ok: true,
      transport: getFleetTransportStatus(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/fleet/outbox", (req, res) => {
  try {
    res.json(listFleetOutbox({ limit: req.query.limit }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/fleet/outbox", async (req, res) => {
  try {
    const queued = enqueueFleetMessage(req.body || {});
    let delivery = null;
    if (req.body?.deliver || req.query.deliver === "1" || req.query.deliver === "true") {
      delivery = await deliverFleetMessage(queued.message_id);
    }

    await logBitacora(
      "Usopp",
      delivery
        ? `Fleet message ${queued.message_id} encolado; entrega=${delivery.status}`
        : `Fleet message ${queued.message_id} encolado en outbox Sunny`,
      "hub-fleet"
    );

    res.status(201).json({
      ok: true,
      queued,
      delivery,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/fleet/send/:messageId", async (req, res) => {
  try {
    const delivery = await deliverFleetMessage(req.params.messageId);
    await logBitacora("Usopp", `Fleet delivery ${req.params.messageId}: ${delivery.status}`, "hub-fleet");
    res.json({
      ok: delivery.ok,
      delivery,
    });
  } catch (e) {
    const status = e.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: e.message });
  }
});

app.post("/api/fleet/send-pending", async (req, res) => {
  try {
    const result = await deliverPendingFleetMessages({
      limit: req.body?.limit || req.query.limit,
      retryBlocked: !!(req.body?.retryBlocked || req.query.retryBlocked === "true"),
    });
    await logBitacora("Usopp", `Fleet send-pending ejecutado: ${result.attempted} intento(s)`, "hub-fleet");
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/missions", (req, res) => {
  try {
    res.json(listMissions({ status: req.query.status, limit: req.query.limit }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/missions/:packetId", (req, res) => {
  try {
    const result = findMission(req.params.packetId);
    if (!result) return res.status(404).json({ error: "Mision no encontrada" });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/missions/start", (req, res) => {
  try {
    const result = startMission({
      ...req.body,
      source: req.body?.source || "api/missions/start",
      route: req.path,
    });
    const status = result.ok ? 200 : 400;
    res.status(status).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/missions/:packetId/close", (req, res) => {
  try {
    const result = closeMission(req.params.packetId, {
      ...req.body,
      source: req.body?.source || "api/missions/close",
      route: req.path,
    });
    const status = result.ok ? 200 : 400;
    res.status(status).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/shared/project", async (req, res) => {
  try {
    const result = upsertSharedProject(req.body || {});
    const project = result.project;
    const mirror = req.body?.mirrorToGas === false
      ? { ok: false, skipped: true, reason: "mirror_disabled" }
      : await mirrorSharedToGas({
          gasUrl: GAS_URL,
          tipo: "shared_project",
          contenido: `[${project.id}] ${project.title} | ${project.status} | ${project.summary || "sin resumen"}`,
        });

    res.json({
      ok: true,
      project,
      mirror,
      summary: getSharedStateSummary(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/shared/conversation", async (req, res) => {
  try {
    const relevantProjects = req.body?.relevantProjects || req.body?.projectIds || [];
    const result = updateConversationSnapshot({
      focus: req.body?.focus,
      generalState: req.body?.generalState || req.body?.state,
      nextActions: req.body?.nextActions,
      blockers: req.body?.blockers,
      relevantProjects,
      lastCheckpointAt: req.body?.lastCheckpointAt,
    });

    const mirror = req.body?.mirrorToGas === false
      ? { ok: false, skipped: true, reason: "mirror_disabled" }
      : await mirrorSharedToGas({
          gasUrl: GAS_URL,
          tipo: "shared_conversation",
          contenido: [
            `focus=${result.conversation.focus || "pending"}`,
            `state=${result.conversation.generalState || "pending"}`,
            `projects=${(result.conversation.relevantProjects || []).join(",") || "none"}`,
          ].join(" | "),
        });

    res.json({
      ok: true,
      conversation: result.conversation,
      mirror,
      summary: getSharedStateSummary(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/shared/checkpoint", async (req, res) => {
  try {
    const result = await saveSharedCheckpoint({
      ...req.body,
      route: req.path,
      source: req.body?.source || "api/shared/checkpoint",
      gasUrl: GAS_URL,
      logFn: logBitacora,
      broadcastFn: broadcast,
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/claude", async (req, res) => {
  const { text, messages, model, system } = req.body;
  try {
    const captainText = text || (Array.isArray(messages) ? messages.map((msg) => msg.content || "").join("\n") : "");
    const projectIds = inferProjectIds(captainText, system || "");
    rememberCaptainTurn(captainText, req.path, "api/claude", projectIds, ["hub", "captain-turn", "nami"]);
    const ananda = await captureAnanda({
      text            : captainText,
      route           : req.path,
      source          : "api/claude",
      context         : system || "",
      objectiveContext: Array.isArray(messages) ? JSON.stringify(messages).slice(0, 320) : "",
      responses       : ["Nami"],
      logFn           : logBitacora,
      broadcastFn     : broadcast,
    });
    const msgs = messages ?? [{ role: "user", content: text }];
    const r    = await callClaude(msgs, { model, system });
    rememberAgentReply("Nami", r.reply, req.path, r.model || "api/claude", projectIds, ["hub", "agent-reply", "nami"]);
    const checkpoint = buildAutomaticCheckpoint({
      body: req.body,
      actor: "nami",
      input: captainText,
      reply: r.reply,
      source: "api/claude",
      route: req.path,
      projectIds,
      title: "Checkpoint Nami",
      tags: ["checkpoint", "nami", "hub"],
    });
    const checkpointResult = checkpoint
      ? await saveSharedCheckpoint({
          ...checkpoint,
          gasUrl: GAS_URL,
          logFn: logBitacora,
          broadcastFn: broadcast,
        })
      : null;
    broadcast({ type: "respuesta", nakama: "ðŸŠ Nami (Claude)", ...r });
    logBitacora("Nami", r.reply, r.model);
    res.json({ nakama: "Nami", ananda, checkpoint: checkpointResult, ...r });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// â”€â”€ /api/codex â€” Usopp (agente real) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post("/api/codex", async (req, res) => {
  const { text, task, workingDir } = req.body;
  const tarea = task || text;
  if (!tarea) return res.status(400).json({ error: "Falta 'task' o 'text'" });
  try {
    const guardedWorkingDir = workingDir
      ? resolveAndCheckPath(workingDir, SUNNY_ALLOWED_ROOTS)
      : "";
    const projectIds = inferProjectIds(tarea, guardedWorkingDir || "");
    rememberCaptainTurn(tarea, req.path, "api/codex", projectIds, ["hub", "captain-turn", "codex"]);
    const ananda = await captureAnanda({
      text        : tarea,
      route       : req.path,
      source      : "api/codex",
      context     : guardedWorkingDir ? `workingDir: ${guardedWorkingDir}` : "",
      responses   : ["Usopp"],
      logFn       : logBitacora,
      broadcastFn : broadcast,
    });
    const r = await callCodex(tarea, { workingDir: guardedWorkingDir });
    rememberAgentReply("Usopp", r.reply, req.path, r.model || "api/codex", projectIds, ["hub", "agent-reply", "codex"]);
    const checkpoint = buildAutomaticCheckpoint({
      body: req.body,
      actor: "usopp",
      input: tarea,
      reply: r.reply,
      source: "api/codex",
      route: req.path,
      projectIds,
      title: "Checkpoint Usopp",
      tags: ["checkpoint", "codex", "hub"],
    });
    const checkpointResult = checkpoint
      ? await saveSharedCheckpoint({
          ...checkpoint,
          gasUrl: GAS_URL,
          logFn: logBitacora,
          broadcastFn: broadcast,
        })
      : null;
    broadcast({ type: "respuesta", nakama: "ðŸŽ¯ Usopp (Codex)", ...r });
    logBitacora("Usopp", r.reply, r.model);
    res.json({ nakama: "Usopp", ananda, checkpoint: checkpointResult, ...r });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// â”€â”€ /api/antigravity â€” Sanji â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post("/api/antigravity", async (req, res) => {
  const { text, model, system } = req.body;
  if (!text) return res.status(400).json({ error: "Falta texto" });
  try {
    const projectIds = inferProjectIds(text, system || "");
    rememberCaptainTurn(text, req.path, "api/antigravity", projectIds, ["hub", "captain-turn", "sanji"]);
    const ananda = await captureAnanda({
      text        : text,
      route       : req.path,
      source      : "api/antigravity",
      context     : system || "",
      responses   : ["Sanji"],
      logFn       : logBitacora,
      broadcastFn : broadcast,
    });
    // Intentar Antigravity, caer en Gemini directo si falla
    let r;
    if (KEYS.antigravity) {
      r = await callAntigravity(text, { model, system });
    } else {
      console.warn("[Sanji] ANTIGRAVITY_TOKEN no configurado, usando Gemini directo");
      r = await callGemini(text, { system });
    }
    broadcast({ type: "respuesta", nakama: "ðŸ³ Sanji (Antigravity)", ...r });
    rememberAgentReply("Sanji", r.reply, req.path, r.model || "api/antigravity", projectIds, ["hub", "agent-reply", "sanji"]);
    const checkpoint = buildAutomaticCheckpoint({
      body: req.body,
      actor: "sanji",
      input: text,
      reply: r.reply,
      source: "api/antigravity",
      route: req.path,
      projectIds,
      title: "Checkpoint Sanji",
      tags: ["checkpoint", "antigravity", "hub"],
    });
    const checkpointResult = checkpoint
      ? await saveSharedCheckpoint({
          ...checkpoint,
          gasUrl: GAS_URL,
          logFn: logBitacora,
          broadcastFn: broadcast,
        })
      : null;
    logBitacora("Sanji", r.reply, r.model);
    res.json({ nakama: "Sanji", ananda, checkpoint: checkpointResult, ...r });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// â”€â”€ /api/gas â€” Proxy GAS backend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.all("/api/gas", async (req, res) => {
  if (!GAS_URL) return res.status(500).json({ error: "GAS_URL no configurada" });
  const params  = new URLSearchParams({ ...req.query, ...req.body });
  try {
    const r = await fetchJSON(`${GAS_URL}?${params}`);
    res.json(r.data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// â”€â”€ /api/desktop â€” Desktop Bridge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post("/api/desktop", async (req, res) => {
  try {
    const requestedTool = String(req.body?.tool || req.body?.action || "desktop").toLowerCase();
    if (!req.canUseTool?.(requestedTool)) {
      return res.status(403).json({ error: `Tool not allowed for role ${req.actorRole}: ${requestedTool}` });
    }
    const guardedBody = guardDesktopPayload(req.body || {});
    const r = await fetchJSON(`${BRIDGE_URL}/desktop`, {
      method : "POST",
      headers: { "content-type": "application/json" },
      body   : JSON.stringify(guardedBody),
    });
    res.status(r.status).json(r.data);
  } catch (e) {
    res.status(503).json({
      error: "Desktop bridge no disponible",
      tip  : "Ejecuta desktop-bridge.py en tu PC",
    });
  }
});

app.post("/api/telegram/outgoing", async (req, res) => {
  const { text, chatId, nakama = "telegram" } = req.body || {};
  if (!text) return res.status(400).json({ error: "Falta text" });
  if (!req.canUseTool?.("telegram_send")) {
    return res.status(403).json({ error: `Tool not allowed for role ${req.actorRole}: telegram_send` });
  }

  try {
    const result = await sendTelegramMessage({ text, chatId });
    await logBitacoraRoute("telegram_out", nakama, text, "telegram-bot");
    res.json({ ok: true, messageId: result.messageId, chatId: result.chatId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/telegram/incoming", async (req, res) => {
  const update = req.body || {};
  const message = update.message || update.edited_message;
  const text = normalizeTelegramText(message?.text || "");
  const chatId = message?.chat?.id != null ? String(message.chat.id) : "";

  if (!text || !chatId) {
    return res.json({ ok: true, ignored: true });
  }

  await logBitacoraRoute("telegram_in", "capitan", text, "telegram-webhook");
  res.json({ ok: true, accepted: true });

  (async () => {
    try {
      const puenteResult = await internalHubPost("/api/puente", {
        text,
        skipBitacora: true,
      });
      const responses = ensureTelegramCrewResponses(
        Array.isArray(puenteResult?.responses) ? puenteResult.responses : []
      );

      for (const response of responses) {
        const formattedMessages = formatTelegramMessages(response);
        for (const formattedText of formattedMessages) {
          await internalHubPost("/api/telegram/outgoing", {
            text: formattedText,
            chatId,
            nakama: getTelegramNakamaLabel(response.nakama),
          });
        }
      }
    } catch (error) {
      console.warn("[Telegram incoming]", error.message);
    }
  })();
});

// â”€â”€ /api/puente â€” Puente de Mando (agentes reales en paralelo)
app.post("/api/puente", async (req, res) => {
  const {
    text,
    task,
    nakamas = ["claude", "codex", "antigravity"],
    skipBitacora = false,
  } = req.body;
  const input = task || text;
  if (!input) return res.status(400).json({ error: "Falta texto o tarea" });
  const projectIds = inferProjectIds(input, nakamas.join(" "));
  const bitacoraLogFn = skipBitacora ? async () => {} : logBitacora;
  rememberCaptainTurn(input, req.path, "api/puente", projectIds, ["hub", "captain-turn", "puente"]);
  const ananda = await captureAnanda({
    text        : input,
    route       : req.path,
    source      : "api/puente",
    context     : `nakamas: ${nakamas.join(", ")}`,
    responses   : nakamas,
    logFn       : bitacoraLogFn,
    broadcastFn : broadcast,
  });

  Klabautermann.ping();
  const runId = registry.createRun(input, { actor: 'Puente' });
  registry.updateRun(runId, 'route_selected', { route: '/api/puente', actor: nakamas.join(", ") });

  // Lanzar agentes seleccionados en paralelo
  const llamadas = [];

  if (nakamas.includes("claude") && KEYS.anthropic) {
    registry.updateRun(runId, 'agent_started', { actor: 'Nami (Claude)' });
    llamadas.push(
      callClaude([{ role: "user", content: input }])
        .then(r => {
           registry.updateRun(runId, 'agent_replied', { actor: 'Nami', elapsed: r.elapsed });
           return { nakama: "Nami (Claude)", ...r };
        })
        .catch(e => ({ nakama: "Nami (Claude)", error: e.message }))
    );
  }
  if (nakamas.includes("codex") && KEYS.openai) {
    registry.updateRun(runId, 'agent_started', { actor: 'Usopp (Codex)' });
    llamadas.push(
      callCodex(input)
        .then(r => {
           registry.updateRun(runId, 'agent_replied', { actor: 'Usopp', elapsed: r.elapsed });
           return { nakama: "Usopp (Codex)", ...r };
        })
        .catch(e => ({ nakama: "Usopp (Codex)", error: e.message }))
    );
  }
  if (nakamas.includes("antigravity")) {
    registry.updateRun(runId, 'agent_started', { actor: 'Sanji (Antigravity)' });
    const fn = KEYS.antigravity ? callAntigravity(input) : callGemini(input);
    llamadas.push(
      fn.then(r => {
           registry.updateRun(runId, 'agent_replied', { actor: 'Sanji', elapsed: r.elapsed });
           return { nakama: "Sanji (Antigravity)", ...r };
        })
        .catch(e => ({ nakama: "Sanji (Antigravity)", error: e.message }))
    );
  }

  const responses = await Promise.all(llamadas);

  // Loguear cada respuesta en BitÃ¡cora
  responses.forEach(r => {
    if (!r.error) {
      rememberAgentReply(r.nakama, r.reply ?? "", req.path, r.model || "api/puente", projectIds, ["hub", "agent-reply", "puente"]);
      if (!skipBitacora) {
        logBitacora(r.nakama, r.reply ?? "", `hub-puente/${r.model ?? "?"}`);
      }
    }
  });

  const checkpoint = buildAutomaticCheckpoint({
    body: req.body,
    actor: "puente",
    input,
    reply: responses
      .map((response) =>
        response.error
          ? `${response.nakama}: ERROR ${response.error}`
          : `${response.nakama}: ${response.reply ?? ""}`
      )
      .join("\n\n"),
    source: "api/puente",
    route: req.path,
    projectIds,
    title: "Checkpoint Puente",
    tags: ["checkpoint", "puente", "hub"],
  });
  const checkpointResult = checkpoint
    ? await saveSharedCheckpoint({
        ...checkpoint,
        gasUrl: GAS_URL,
        logFn: bitacoraLogFn,
        broadcastFn: broadcast,
      })
    : null;

  registry.updateRun(runId, 'run_completed');

  broadcast({ type: "puente", input, responses });
  res.json({ input, responses, ananda, runId, checkpoint: checkpointResult });
});

// â”€â”€ /api/tarea â€” Despacha tarea al agente mÃ¡s adecuado â”€â”€â”€â”€â”€â”€â”€â”€
// El CapitÃ¡n describe quÃ© quiere hacer; el Hub elige quiÃ©n lo ejecuta mejor.
app.post("/api/tarea", async (req, res) => {
  const { tarea, contexto = "" } = req.body;
  if (!tarea) return res.status(400).json({ error: "Falta 'tarea'" });
  const projectIds = inferProjectIds(tarea, contexto);
  rememberCaptainTurn(tarea, req.path, "api/tarea", projectIds, ["hub", "captain-turn", "tarea"]);
  const ananda = await captureAnanda({
    text            : tarea,
    route           : req.path,
    source          : "api/tarea",
    context         : contexto,
    objectiveContext: "auto-routing",
    logFn           : logBitacora,
    broadcastFn     : broadcast,
  });

  Klabautermann.ping();
  const runId = registry.createRun(tarea, { actor: 'AutoRouting' });
  registry.updateRun(runId, 'route_selected', { route: '/api/tarea', actor: 'AutoRouting' });

  const t = tarea.toLowerCase();
  let agente, fn;

  // Routing semÃ¡ntico: cÃ³digo/ejecuciÃ³n â†’ Codex, anÃ¡lisis/datos â†’ Sanji, clÃ­nica/escritura â†’ Nami
  if (/cÃ³digo|script|funciÃ³n|ejecuta|bug|github|archivo|crea el|desarrolla|implementa|refactoriza/.test(t)) {
    agente = "Usopp (Codex)";
    fn     = callCodex(`${tarea}\n\nContexto adicional:\n${contexto}`);
  } else if (/analiza|datos|drive|sheet|busca|sintetiza|resume|compara|gemini/.test(t)) {
    agente = "Sanji (Antigravity)";
    const text = contexto ? `${tarea}\n\nContexto:\n${contexto}` : tarea;
    fn = KEYS.antigravity ? callAntigravity(text) : callGemini(text);
  } else {
    agente = "Nami (Claude)";
    const msgs = [{ role: "user", content: contexto ? `${tarea}\n\nContexto:\n${contexto}` : tarea }];
    fn = callClaude(msgs);
  }

  registry.updateRun(runId, 'agent_started', { actor: agente });

  try {
    const r = await fn;
    registry.updateRun(runId, 'agent_replied', { actor: agente, elapsed: r.elapsed });
    rememberAgentReply(agente, r.reply, req.path, r.model || "api/tarea", projectIds, ["hub", "agent-reply", "tarea"]);
    const checkpoint = buildAutomaticCheckpoint({
      body: req.body,
      actor: agente,
      input: contexto ? `${tarea}\n\nContexto adicional:\n${contexto}` : tarea,
      reply: r.reply,
      source: "api/tarea",
      route: req.path,
      projectIds,
      title: "Checkpoint Tarea",
      tags: ["checkpoint", "tarea", "hub"],
    });
    const checkpointResult = checkpoint
      ? await saveSharedCheckpoint({
          ...checkpoint,
          gasUrl: GAS_URL,
          logFn: logBitacora,
          broadcastFn: broadcast,
        })
      : null;
    logBitacora(agente, r.reply, r.model);
    registry.updateRun(runId, 'run_completed');
    broadcast({ type: "tarea", agente, tarea, ...r });
    res.json({ agente, tarea, ananda, runId, checkpoint: checkpointResult, ...r });
  } catch (e) {
    registry.updateRun(runId, 'run_failed', { error: e.message });
    res.status(500).json({ agente, error: e.message });
  }
});

// â”€â”€ /api/ml/log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post("/api/ml/log", async (req, res) => {
  const { input, output, nakama, rating, tags = [] } = req.body;
  const msg = `[ML] rating=${rating ?? "?"} tags=${tags.join(",")} | ${input?.substring(0, 100)} â†’ ${output?.substring(0, 100)}`;
  await logBitacora(nakama || "ML", msg, "hub-ml");
  res.json({ ok: true });
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// WEB UI â€” interfaz embebida (accesible desde mÃ³vil)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(UI_HTML);
});

// â”€â”€ Puente de Mando v2 â€” frontend de ejecuciÃ³n orquestada â”€â”€
app.get("/puente", (req, res) => {
  const fs = require("fs");
  const puentePath = path.join(__dirname, "puente-v2.html");
  if (fs.existsSync(puentePath)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(fs.readFileSync(puentePath, "utf-8"));
  } else {
    res.redirect("/");
  }
});

// Manifest PWA para instalar en Android como app nativa
app.get("/manifest.json", (req, res) => {
  // start_url apunta al Puente (la app principal para movil)
  res.json({
    name            : "Thousand Sunny - Puente de Mando",
    short_name      : "Puente",
    description     : "Control remoto de tripulacion IA",
    start_url       : "/puente",
    display         : "standalone",
    orientation     : "portrait",
    background_color: "#0a0c10",
    theme_color     : "#f5c518",
    icons           : [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  });
});

// Service worker bÃ¡sico para PWA offline
app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send(`
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => clients.claim());
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return; // siempre red para APIs
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
  `);
});

const UI_HTML = /* html */ `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#f5c518">
<link rel="manifest" href="/manifest.json">
<title>ðŸ´â€â˜ ï¸ Thousand Sunny Hub</title>
<style>
  :root{--bg:#0f1117;--sur:#1a1d27;--brd:#2d3147;--gold:#f5c518;--blue:#4a9eff;--grn:#3fcf8e;--red:#ff6b6b;--txt:#e8eaf6;--mut:#6b7280}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--txt);font-family:'Segoe UI',system-ui,sans-serif;height:100dvh;display:flex;flex-direction:column}
  header{background:var(--sur);border-bottom:1px solid var(--brd);padding:10px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0}
  header h1{font-size:1rem;color:var(--gold)}
  #dot{width:9px;height:9px;border-radius:50%;background:var(--mut);margin-left:auto;transition:background .3s}
  #dot.ok{background:var(--grn)} #dot.err{background:var(--red)}
  .layout{display:flex;flex:1;overflow:hidden}
  .side{width:200px;background:var(--sur);border-right:1px solid var(--brd);padding:12px 10px;display:flex;flex-direction:column;gap:6px;overflow-y:auto}
  @media(max-width:600px){.side{display:none}}
  .side h3{font-size:.65rem;text-transform:uppercase;letter-spacing:1px;color:var(--mut);margin:6px 0 2px}
  .btn{background:var(--brd);border:none;color:var(--txt);padding:7px 10px;border-radius:6px;cursor:pointer;font-size:.82rem;text-align:left;width:100%;transition:background .15s}
  .btn:hover{background:#3d4060} .btn.on{background:var(--blue);color:#fff}
  .chat{flex:1;display:flex;flex-direction:column;min-width:0}
  #msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
  .msg{max-width:85%;padding:9px 13px;border-radius:10px;font-size:.88rem;line-height:1.55;word-break:break-word}
  .msg.u{align-self:flex-end;background:#2d3d6b}
  .msg.a{align-self:flex-start;background:var(--sur);border:1px solid var(--brd)}
  .tag{font-size:.68rem;color:var(--gold);font-weight:600;margin-bottom:3px}
  .meta{font-size:.65rem;color:var(--mut);margin-top:4px}
  pre{background:#0d1117;padding:8px;border-radius:6px;overflow-x:auto;font-size:.78rem;margin-top:6px;white-space:pre-wrap}
  .bar{padding:10px 14px;border-top:1px solid var(--brd);display:flex;gap:8px;background:var(--sur);flex-shrink:0}
  textarea{flex:1;background:var(--bg);border:1px solid var(--brd);border-radius:8px;padding:9px 12px;color:var(--txt);font-size:.88rem;resize:none;line-height:1.4}
  textarea:focus{outline:none;border-color:var(--blue)}
  #go{background:var(--blue);border:none;color:#fff;padding:9px 18px;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap}
  #go:disabled{opacity:.4;cursor:not-allowed}
  select{background:var(--bg);border:1px solid var(--brd);color:var(--txt);padding:7px 8px;border-radius:8px;font-size:.82rem}
  .st{padding:3px 14px;font-size:.72rem;color:var(--mut);background:var(--bg);border-top:1px solid var(--brd);flex-shrink:0}
  .sp{display:inline-block;width:13px;height:13px;border:2px solid transparent;border-top-color:currentColor;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle}
  @keyframes spin{to{transform:rotate(360deg)}}
  .chip{display:inline-block;background:var(--brd);border-radius:4px;padding:2px 6px;font-size:.68rem;margin:2px}
</style>
</head>
<body>
<header>
  <span style="font-size:1.3rem">ðŸ´â€â˜ ï¸</span>
  <h1>Thousand Sunny Hub v2.0</h1>
  <span id="ws-lbl" style="font-size:.72rem;color:var(--mut)">Conectandoâ€¦</span>
  <div id="dot"></div>
</header>
<div class="layout">
  <div class="side">
    <h3>Agentes</h3>
    <button class="btn on"  onclick="sel('claude','Nami (Claude)')">ðŸŠ Nami â€” Claude</button>
    <button class="btn"     onclick="sel('codex','Usopp (Codex)')">ðŸŽ¯ Usopp â€” Codex</button>
    <button class="btn"     onclick="sel('antigravity','Sanji (Antigravity)')">ðŸ³ Sanji â€” Antigravity</button>
    <button class="btn"     onclick="sel('puente','Puente de Mando')">âš“ Puente de Mando</button>
    <button class="btn"     onclick="sel('tarea','Auto-despacho')">ðŸ”€ Auto-despacho</button>
    <button class="btn"     onclick="sel('fleet','Argos / Flota')">Argos / Flota</button>
    <h3>Drive / GAS</h3>
    <button class="btn" onclick="gas('get_estado_full')">ðŸ“Š Estado GAS</button>
    <button class="btn" onclick="gas('bitacora')">ðŸ“– BitÃ¡cora</button>
    <h3>Memoria</h3>
    <button class="btn" onclick="anandaState()">ðŸª· Ananda</button>
    <h3>Desktop</h3>
    <button class="btn" onclick="desktop({action:'status'})">ðŸ–¥ï¸ Estado Bridge</button>
    <button class="btn" onclick="desktop({action:'screenshot'})">ðŸ“· Screenshot</button>
    <button class="btn" onclick="focusApp('Claude')">â†’ Foco Claude</button>
    <button class="btn" onclick="focusApp('ChatGPT')">â†’ Foco Codex</button>
    <button class="btn" onclick="focusApp('Gemini')">â†’ Foco Gemini</button>
    <h3>PWA</h3>
    <button class="btn" id="instBtn" style="display:none" onclick="installPWA()">ðŸ“² Instalar en mÃ³vil</button>
  </div>
  <div class="chat">
    <div id="msgs">
      <div class="msg a">
        <div class="tag">Sistema</div>
        Hub v2.0 activo. Agentes reales conectados:<br>
        <span class="chip">ðŸŠ Nami â€” Claude API</span>
        <span class="chip">ðŸŽ¯ Usopp â€” Codex SDK</span>
        <span class="chip">ðŸ³ Sanji â€” Antigravity</span>
        <span class="chip">âš“ Puente</span>
        <span class="chip">ðŸª· Ananda â€” memoria compartida</span>
      </div>
    </div>
    <div class="bar">
      <select id="agSel" onchange="agente=this.value">
        <option value="claude">ðŸŠ Nami (Claude)</option>
        <option value="codex">ðŸŽ¯ Usopp (Codex)</option>
        <option value="antigravity">ðŸ³ Sanji (Antigravity)</option>
        <option value="puente">âš“ Puente de Mando</option>
        <option value="tarea">ðŸ”€ Auto-despacho</option>
        <option value="fleet">Argos / Flota</option>
      </select>
      <textarea id="inp" rows="2" placeholder="Escribe la tareaâ€¦ (Enter envÃ­a, Shift+Enter nueva lÃ­nea)"></textarea>
      <button id="go" onclick="send()">Enviar</button>
    </div>
    <div class="st" id="st">Listo</div>
  </div>
</div>
<script>
let agente = "claude";
let deferredPWA = null;
const msgs = document.getElementById("msgs");
const inp  = document.getElementById("inp");
const go   = document.getElementById("go");
const st   = document.getElementById("st");
const dot  = document.getElementById("dot");
const wsLbl= document.getElementById("ws-lbl");

// WebSocket
let ws;
function connectWS() {
  const wsProto = location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(wsProto + "//" + location.host);
  ws.onopen = () => { dot.className = "dot ok"; wsLbl.textContent = "Conectado"; };
  ws.onclose = () => { dot.className = "dot err"; wsLbl.textContent = "Desconectado"; setTimeout(connectWS, 3000); };
  ws.onmessage = e => {
    try {
      const d = JSON.parse(e.data);
      if (d.type === "respuesta") addMsg(d.nakama || "Agente", d.reply || "", d.tokens ? d.tokens + " tok, " + d.elapsed + "ms" : "");
      if (d.type === "puente" && d.responses) d.responses.forEach(r => addMsg(r.nakama||"?", r.reply||r.error||"", r.tokens ? r.tokens+" tok" : ""));
    } catch {}
  };
}
connectWS();

function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function addMsg(tag, text, meta) {
  const d = document.createElement("div"); d.className = "msg a";
  d.innerHTML = '<div class="tag">' + esc(tag) + '</div>' + esc(text).replace(/\\n/g,"<br>") + (meta ? '<div class="meta">' + esc(meta) + '</div>' : "");
  msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
}

async function send() {
  const text = inp.value.trim(); if (!text) return;
  addMsg("Capitan", text, "");
  inp.value = ""; go.disabled = true;
  st.innerHTML = '<span class="sp"></span> Procesando...';
  try {
    const body = agente === "puente"
      ? { text }
      : agente === "tarea"
      ? { tarea: text }
      : agente === "fleet"
      ? {
          message: text,
          packet_id: "SUN-0004",
          actor: "Captain",
          role: "Antonio",
          deliver: true,
        }
      : { text };
    const endpoint = agente === "puente" ? "/api/puente"
      : agente === "tarea" ? "/api/tarea"
      : agente === "fleet" ? "/api/fleet/outbox?deliver=1"
      : agente === "codex" ? "/api/codex"
      : agente === "antigravity" ? "/api/antigravity"
      : "/api/claude";
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    }).then(r => r.json());
    if (agente === "fleet" && r.queued) {
      const delivery = r.delivery || {};
      const status = delivery.status || "queued";
      const target = delivery.endpoint || "Argos endpoint no configurado";
      addMsg("Argos / Flota", "Mensaje: " + r.queued.message_id + "\\nEstado: " + status + "\\nDestino: " + target, "");
    } else if (r.responses) {
      r.responses.forEach(x => addMsg(x.nakama||"?", x.reply||x.error||"", x.tokens ? x.tokens+" tok" : ""));
    } else {
      addMsg(r.nakama||r.agente||agente, r.reply||r.error||JSON.stringify(r), r.tokens ? r.tokens+" tok, "+r.elapsed+"ms" : "");
    }
  } catch (e) { addMsg("Error", e.message, ""); }
  go.disabled = false; st.textContent = "Listo";
}

// Keyboard
inp.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });

// GAS helper
async function gasAction(params) {
  const r = await fetch("/api/gas?" + new URLSearchParams(params)).then(r => r.json());
  addMsg("GAS", JSON.stringify(r, null, 2), ""); return r;
}

// Desktop helper
async function desktopAction(action, args) {
  const r = await fetch("/api/desktop", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({action,...args}) }).then(r => r.json());
  addMsg("Desktop", JSON.stringify(r, null, 2), ""); return r;
}

// PWA install
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPWA = e; });

// Ananda state
async function showAnanda() {
  const r = await fetch("/api/ananda/state").then(r => r.json());
  addMsg("Ananda", "Sutras: "+(r.totals?.sutras??0)+", Eventos: "+(r.totals?.events??0)+", Discoveries: "+(r.totals?.discoveries??0), "");
}

// Sidebar agent selection
function sel(agent, label) {
  agente = agent;
  document.getElementById("agSel").value = agent;
  document.querySelectorAll(".side .btn").forEach(b => b.classList.remove("on"));
  event.target.classList.add("on");
}

// Sidebar aliases (buttons use short names, functions have full names)
function gas(action) { gasAction({action}); }
function anandaState() { showAnanda(); }
function desktop(args) { desktopAction(args.action || "status", args); }
function focusApp(name) { desktopAction("focus", {app: name}); }
function installPWA() { if (deferredPWA) { deferredPWA.prompt(); deferredPWA = null; } }

// Register SW
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
<` + `/script>
</body>
</html>`;

// ════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════
server.listen(PORT, "0.0.0.0", () => {
  const authLine = AUTH_ENABLED ? "ON (token requerido para acceso remoto)" : "OFF (modo local)";
  console.log(`
======================================================
  THOUSAND SUNNY HUB v2.0 -- Puerto ${PORT}
======================================================
  Nami (Claude)       : ${KEYS.anthropic ? "OK" : "NO"}
  Usopp (Codex)       : ${KEYS.openai ? "OK" : "NO"}
  Sanji (Antigravity) : ${KEYS.antigravity ? "OK (Antigravity)" : process.env.GEMINI_KEY ? "OK (Gemini fallback)" : "NO"}
  GAS Backend         : ${GAS_URL ? "OK" : "NO"}
  Ananda              : OK
  Auth                : ${authLine}
------------------------------------------------------
  UI:      http://localhost:${PORT}/
  Puente:  http://localhost:${PORT}/puente
  API:     http://localhost:${PORT}/api/status
  Escuchando en 0.0.0.0:${PORT} (todas las interfaces)
======================================================
  `);
});
