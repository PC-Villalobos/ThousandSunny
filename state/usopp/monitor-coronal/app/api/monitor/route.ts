import { NextResponse } from "next/server";
import snapshot from "../../data/local-snapshot.json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HIPATIA = "http://127.0.0.1:8765";

type Status = "healthy" | "degraded" | "unknown" | "unavailable";

type Source = {
  id: string;
  label: string;
  role: string;
  status: Status;
  authority: string;
  coverage: string;
  freshness: string | null;
  observed: string[];
  excluded: string[];
  error?: string;
  authorityEffect: "none";
};

async function getJson(endpoint: string) {
  const response = await fetch(`${HIPATIA}${endpoint}`, { cache: "no-store", signal: AbortSignal.timeout(3500) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function safeSource(factory: () => Promise<Source>, fallback: Omit<Source, "status" | "error">): Promise<Source> {
  try { return await factory(); }
  catch (error) { return { ...fallback, status: "unavailable", error: error instanceof Error ? error.message : "error desconocido" }; }
}

export async function GET() {
  const generatedAt = new Date().toISOString();
  let closureSummary = { missions: 0, blocked: 0, aged: 0, unregistered: 0, executing: 0, generatedAt: null as string | null };

  const hipatia = await safeSource(async () => {
    const [health, adapters, closure] = await Promise.all([getJson("/api/health"), getJson("/api/adapters"), getJson("/api/closure/dashboard")]);
    closureSummary = {
      missions: closure.missions?.length ?? 0,
      blocked: closure.blocked?.length ?? 0,
      aged: closure.aged?.length ?? 0,
      unregistered: closure.unregistered_missions?.length ?? 0,
      executing: closure.executing?.length ?? 0,
      generatedAt: closure.generated_at ?? null,
    };
    return {
      id: "hipatia", label: "Hipatia Local", role: "Autoridad operativa", status: "healthy", authority: "operational_authority",
      coverage: "Salud, adaptadores y resumen de cierres", freshness: closure.generated_at ?? generatedAt,
      observed: [`${health.events ?? "?"} eventos`, `${closureSummary.missions} misiones`, `${closureSummary.blocked} bloqueada`, `adaptadores ${adapters.ok ? "operativos" : "degradados"}`],
      excluded: ["contenido clínico", "cuerpos documentales", "escritura"], authorityEffect: "none",
    };
  }, { id: "hipatia", label: "Hipatia Local", role: "Autoridad operativa", authority: "operational_authority", coverage: "No disponible", freshness: null, observed: [], excluded: ["sin lectura"], authorityEffect: "none" });

  const physical = await safeSource(async () => {
    const m = snapshot.physical;
    return { id: "physical", label: "Biblioteca física", role: "Cuerpo documental", status: "healthy", authority: "durable_artifacts", coverage: "Snapshot de metadatos; sin abrir archivos", freshness: m.newest, observed: [`${m.files} archivos observables`, `${(m.bytes / 1048576).toFixed(1)} MB`, "raíz accesible"], excluded: ["NEM", "CLI", "contenido de archivos", "clasificación semántica"], authorityEffect: "none" };
  }, { id: "physical", label: "Biblioteca física", role: "Cuerpo documental", authority: "durable_artifacts", coverage: "No disponible", freshness: null, observed: [], excluded: ["sin lectura"], authorityEffect: "none" });

  const obsidian = await safeSource(async () => {
    const m = snapshot.obsidian;
    return { id: "obsidian", label: "Obsidian · Hipatia", role: "Vista navegable", status: "healthy", authority: "derived_view", coverage: "Snapshot de la vista; sin abrir notas", freshness: m.newest, observed: [`${m.files} vistas observables`, `${(m.bytes / 1048576).toFixed(1)} MB`, "Vault detectado"], excluded: ["NEM", "CLI", "contenido de notas", "canonización"], authorityEffect: "none" };
  }, { id: "obsidian", label: "Obsidian · Hipatia", role: "Vista navegable", authority: "derived_view", coverage: "No disponible", freshness: null, observed: [], excluded: ["sin lectura"], authorityEffect: "none" });

  const groot = await safeSource(async () => {
    const m = snapshot.groot;
    return { id: "groot", label: "Maceta de Groot", role: "Organismo de trabajo", status: "healthy", authority: "workspace_metadata", coverage: "Snapshot de metadatos públicos autorizados", freshness: m.newest, observed: [`${m.files} artefactos observables`, `${(m.bytes / 1048576).toFixed(1)} MB`, "raíz accesible"], excluded: ["NEM", "CLI", "contenido sensible", "ejecución de rutinas"], authorityEffect: "none" };
  }, { id: "groot", label: "Maceta de Groot", role: "Organismo de trabajo", authority: "workspace_metadata", coverage: "No disponible", freshness: null, observed: [], excluded: ["sin lectura"], authorityEffect: "none" });

  const github = await safeSource(async () => {
    const git = snapshot.github;
    return { id: "github", label: "GitHub · ThousandSunny", role: "Extremidad hacia el mundo", status: git.changed ? "degraded" : "healthy", authority: "canonical_checkout_metadata", coverage: "Snapshot read-only del checkout local; sin consulta remota", freshness: snapshot.generatedAt, observed: [`rama ${git.branch}`, `commit ${git.commit}`, `${git.changed} cambios locales`, `${git.behind} detrás / ${git.ahead} delante`], excluded: ["fetch", "push", "PR remotas", "modificación Git"], authorityEffect: "none" };
  }, { id: "github", label: "GitHub · ThousandSunny", role: "Extremidad hacia el mundo", authority: "canonical_checkout_metadata", coverage: "No disponible", freshness: null, observed: [], excluded: ["sin lectura remota"], authorityEffect: "none" });

  const rocket: Source = { id: "rocket", label: "Rocket Raccoon · Ubuntu", role: "Cuidador de Groot", status: "unknown", authority: "runtime_observer", coverage: "No hay canal de salud identificado desde Windows", freshness: null, observed: ["identidad arquitectónica declarada", "VM no localizada por observadores estándar"], excluded: ["arranque de VM", "SSH", "comandos", "reparaciones"], authorityEffect: "none" };
  const archaeology: Source = { id: "archaeology", label: "Arqueología cognitiva", role: "Memoria bruta histórica", status: "unknown", authority: "archive_reference", coverage: "Declarada, no inventariada", freshness: null, observed: ["Drive", "Claude", "Codex / ChatGPT", "sesiones de Isaac"], excluded: ["importación", "ingesta", "lectura de conversaciones", "deduplicación"], authorityEffect: "none" };

  const sources = [hipatia, physical, obsidian, groot, github, rocket, archaeology];
  return NextResponse.json({
    schema: "monitor-coronal.read-model.v1",
    generatedAt,
    authorityEffect: "none",
    completeness: "unknown",
    mode: "read_only",
    sources,
    closureSummary,
    health: { healthy: sources.filter(s => s.status === "healthy").length, degraded: sources.filter(s => s.status === "degraded").length, unknown: sources.filter(s => s.status === "unknown").length, unavailable: sources.filter(s => s.status === "unavailable").length },
  }, { headers: { "Cache-Control": "no-store" } });
}
