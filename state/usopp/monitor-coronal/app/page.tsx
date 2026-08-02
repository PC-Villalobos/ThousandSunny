"use client";

import { useEffect, useMemo, useState } from "react";

type Horizon = "Presente" | "Trayectoria" | "Horizonte";

type Connector = {
  id: string; label: string; role: string; status: "healthy" | "degraded" | "unknown" | "unavailable";
  authority: string; coverage: string; freshness: string | null; observed: string[]; excluded: string[]; error?: string;
};

type LiveReadModel = {
  generatedAt: string; completeness: "unknown"; mode: "read_only"; sources: Connector[];
  closureSummary: { missions: number; blocked: number; aged: number; unregistered: number; executing: number };
  health: { healthy: number; degraded: number; unknown: number; unavailable: number };
};

const horizonData: Record<Horizon, { label: string; detail: string; energy: number }> = {
  Presente: {
    label: "Construcción con prudencia activa",
    detail: "El laboratorio avanza; la presión se concentra en continuidad y deuda operativa.",
    energy: 78,
  },
  Trayectoria: {
    label: "Del prompting al sistema gobernado",
    detail: "Las pruebas convergen en una interfaz común, pero aún no existe automatización soberana.",
    energy: 64,
  },
  Horizonte: {
    label: "Puente vivo, memoria separada",
    detail: "Paseo puede coordinar superficies sin convertirse en fuente de verdad.",
    energy: 71,
  },
};

const missions = [
  { name: "Monitor Coronal", state: "viva", note: "Superficie local en construcción", tone: "green" },
  { name: "Usopp · artefactos", state: "viva", note: "Ciclo ciego superado", tone: "green" },
  { name: "Rutinas Claude", state: "bloqueada", note: "Sin saldo Anthropic · 6 días", tone: "amber" },
  { name: "Memoria compartida", state: "propuesta", note: "Sin absorción automática", tone: "blue" },
];

const changes = [
  ["Ahora", "Monitor Coronal entra en fase de artefacto local", "observado"],
  ["−1 ciclo", "El escritor de Hipatia fue restaurado y verificado", "observado"],
  ["−2 ciclos", "Usopp detectó y resistió una instrucción adversarial", "observado"],
  ["−3 ciclos", "Paseo pasó la primera prueba de contexto", "inferido"],
];

const continuity = [
  { name: "Rutinas y tareas Claude", risk: 86, age: "6 días", cause: "Dependencia económica" },
  { name: "Chopper · NEXUS", risk: 62, age: "7 días", cause: "Revisión profesional pendiente" },
  { name: "Cubierta · preview humano", risk: 54, age: "3 días", cause: "Validación viva pendiente" },
];

export default function Home() {
  const [horizon, setHorizon] = useState<Horizon>("Presente");
  const [showEvidence, setShowEvidence] = useState(false);
  const [live, setLive] = useState<LiveReadModel | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const data = useMemo(() => horizonData[horizon], [horizon]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/monitor", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setLive(await response.json());
      setConnectionError(null);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "lectura no disponible");
    } finally { setRefreshing(false); }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <main>
      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />

      <header className="topbar">
        <div className="brand">
          <span className="sigil">☼</span>
          <div><strong>MONITOR CORONAL</strong><small>Puente de Mando · Thousand Sunny</small></div>
        </div>
        <div className="statusRow">
          <span className="boundary">PROYECCIÓN DERIVADA · NO CANÓNICA</span>
          <span className="freshness"><i className={connectionError ? "errorDot" : ""} /> {live ? `Lectura local · ${new Date(live.generatedAt).toLocaleTimeString("es-ES")}` : "Conectando fuentes locales…"}</span>
        </div>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">VISIÓN CORONAL / {horizon.toUpperCase()}</p>
          <h1>Ver el presente<br /><em>sin quedar preso de él.</em></h1>
          <p className="intro">Una lectura transversal del barco: qué empuja, qué pesa y qué merece el próximo movimiento.</p>
          <div className="horizonTabs" aria-label="Horizonte temporal">
            {(Object.keys(horizonData) as Horizon[]).map(item => (
              <button key={item} className={horizon === item ? "active" : ""} onClick={() => setHorizon(item)}>{item}</button>
            ))}
          </div>
        </div>

        <div className="coronaWrap">
          <div className="corona" style={{ "--energy": `${data.energy * 3.6}deg` } as React.CSSProperties}>
            <div className="orbit orbitA"><span /></div>
            <div className="orbit orbitB"><span /></div>
            <div className="core">
              <small>MOMENTUM</small>
              <strong>{data.energy}</strong><sup>%</sup>
              <i>activo</i>
            </div>
          </div>
          <div className="momentumText"><span>SEÑAL DOMINANTE</span><strong>{data.label}</strong><p>{data.detail}</p></div>
        </div>
      </section>

      <section className="metricStrip">
        <div><span>Misiones registradas</span><strong>{live?.closureSummary.missions ?? "—"}</strong><small>Hipatia Local · lectura viva</small></div>
        <div><span>Bloqueos</span><strong className="amber">{live?.closureSummary.blocked ?? "—"}</strong><small>{live?.closureSummary.aged ?? "—"} cabo envejecido</small></div>
        <div><span>Sin registrar</span><strong className="amber">{live?.closureSummary.unregistered ?? "—"}</strong><small>requiere criterio, no inferencia</small></div>
        <div><span>Fuentes observables</span><strong>{live?.health.healthy ?? "—"}<small className="metricOf"> / {live?.sources.length ?? 7}</small></strong><small>completitud desconocida</small></div>
      </section>

      <section className="connectors">
        <header className="connectorHead">
          <div><p className="eyebrow">REGISTRO DE COBERTURA / READ MODEL V1</p><h2>Fuentes conectadas, fronteras visibles.</h2><p>Una conexión prueba observabilidad, no totalidad, absorción ni autoridad nueva.</p></div>
          <button onClick={refresh} disabled={refreshing}>{refreshing ? "Leyendo…" : "Actualizar lectura viva"}<span>↻</span></button>
        </header>
        {connectionError && <div className="connectionWarning">Lectura degradada: {connectionError}. Se conserva la interfaz sin inventar estado.</div>}
        <div className="connectorGrid">
          {(live?.sources ?? []).map(source => <article className="connector" key={source.id}>
            <div className="connectorTop"><span className={`sourceStatus ${source.status}`}><i />{source.status}</span><small>efecto de autoridad · none</small></div>
            <h3>{source.label}</h3><p className="sourceRole">{source.role}</p>
            <p className="coverage">{source.coverage}</p>
            <div className="sourceFacts">{source.observed.map(item => <span key={item}>{item}</span>)}</div>
            <details><summary>Frontera y exclusiones</summary><p>Autoridad declarada: <b>{source.authority}</b></p><p>{source.excluded.join(" · ")}</p>{source.error && <p>Error: {source.error}</p>}</details>
            <div className="connectorFoot">{source.freshness ? `Fresco · ${new Date(source.freshness).toLocaleString("es-ES")}` : "Frescura desconocida"}</div>
          </article>)}
          {!live && !connectionError && Array.from({ length: 7 }).map((_, i) => <div className="connector connectorLoading" key={i}><i /><i /><i /></div>)}
        </div>
        <div className="coverageSeal"><span>COBERTURA TOTAL</span><strong>DESCONOCIDA</strong><p>Drive y los historiales de Claude, Codex/ChatGPT e Isaac continúan fuera de alcance.</p></div>
      </section>

      <div className="grid">
        <section className="panel missionsPanel">
          <PanelHead kicker="01 / ACTIVIDAD" title="Misiones vivas y bloqueadas" meta="4 señales" />
          <div className="missionList">
            {missions.map((m, i) => <article className="mission" key={m.name}>
              <span className={`missionIndex ${m.tone}`}>0{i + 1}</span>
              <div><strong>{m.name}</strong><p>{m.note}</p></div>
              <span className={`tag ${m.tone}`}>{m.state}</span>
            </article>)}
          </div>
        </section>

        <section className="panel debtPanel">
          <PanelHead kicker="02 / PRESIÓN" title="Deuda operativa" meta="11 cabos" />
          <div className="debtHero"><span>6</span><div><strong>días de arrastre</strong><p>La deuda no crece por falta de dirección, sino por una dependencia temporal de recursos.</p></div></div>
          <div className="debtBars">
            <Debt label="Rutinas Claude" value={86} count="6" />
            <Debt label="Revisiones pendientes" value={48} count="3" />
            <Debt label="Validaciones humanas" value={32} count="2" />
          </div>
        </section>

        <section className="panel changesPanel">
          <PanelHead kicker="03 / DELTA" title="Desde la última mirada" meta="4 cambios" />
          <div className="timeline">{changes.map(([when, text, status]) => <div className="event" key={text}><span>{when}</span><i /><p>{text}</p><small>{status}</small></div>)}</div>
        </section>

        <section className="panel continuityPanel">
          <PanelHead kicker="04 / DERIVA" title="Continuidad en riesgo" meta="umbral ≥ 50" />
          {continuity.map(item => <div className="risk" key={item.name}>
            <div><strong>{item.name}</strong><span>{item.age} · {item.cause}</span></div><b>{item.risk}</b>
            <div className="riskBar"><i style={{ width: `${item.risk}%` }} /></div>
          </div>)}
        </section>

        <section className="panel patternsPanel">
          <PanelHead kicker="05 / LONGITUD" title="Patrones que se repiten" meta="lectura inferida" />
          <div className="patternChart" aria-label="Evolución longitudinal sintética">
            {[38, 51, 44, 67, 58, 76, 72, 84].map((v, i) => <i key={i} style={{ height: `${v}%` }}><span /></i>)}
          </div>
          <div className="patternLegend"><p><i className="greenDot" />Prueba → frontera → evidencia</p><p><i className="amberDot" />Acumulación tras dependencia</p></div>
          <blockquote>“Cuando la frontera se hace explícita, el sistema recupera impulso.”</blockquote>
        </section>

        <section className="panel tensionPanel">
          <PanelHead kicker="06 / BRÚJULA" title="Tensión de prioridades" meta="escala 0–100" />
          <div className="tensionChart">
            <div className="axis urgent"><span>URGENTE</span><b>81</b></div>
            <div className="axis important"><span>IMPORTANTE</span><b>74</b></div>
            <div className="axis eudaimonic"><span>EUDAIMÓNICO</span><b>66</b></div>
            <div className="balance"><span style={{ width: "81%" }} /><span style={{ width: "74%" }} /><span style={{ width: "66%" }} /></div>
          </div>
          <p className="tensionNote"><strong>Tensión detectada:</strong> lo urgente está capturando capacidad que debería preservar continuidad y sentido.</p>
        </section>
      </div>

      <section className="helm">
        <div className="helmNumber">01</div>
        <div className="helmMain">
          <p className="eyebrow">ÚNICA RECOMENDACIÓN DE TIMÓN</p>
          <h2>Inventariar la deuda antes de abrir otro frente.</h2>
          <p>Una pasada en solo lectura sobre rutinas atrasadas permitiría separar lo caduco, lo bloqueado y lo recuperable sin tocar todavía ninguna fuente de verdad.</p>
          <button className="evidenceButton" onClick={() => setShowEvidence(!showEvidence)}>{showEvidence ? "Ocultar evidencia" : "Ver evidencia"}<span>↘</span></button>
          {showEvidence && <div className="evidence"><p><b>Observado</b> · seis días sin ejecución de rutinas dependientes de Claude.</p><p><b>Inferido</b> · la acumulación reduce la visión longitudinal y amplifica la urgencia.</p><p><b>Frontera</b> · inventario reversible; sin escritura, absorción ni ejecución.</p></div>}
        </div>
        <aside><small>GO NECESARIO</small><code>GO_READ_ONLY_TRIAGE<br />— DEUDA OPERATIVA</code><span>Sin escritura · Sin canonización</span></aside>
      </section>

      <footer><span>MONITOR CORONAL · FIXTURE V1</span><p>Esta superficie interpreta artefactos; no los sustituye. Hipatia Local y sus registros conservan la autoridad operativa.</p><span>LECTURA · 14:30:00</span></footer>
    </main>
  );
}

function PanelHead({ kicker, title, meta }: { kicker: string; title: string; meta: string }) {
  return <header className="panelHead"><div><p>{kicker}</p><h2>{title}</h2></div><span>{meta}</span></header>;
}

function Debt({ label, value, count }: { label: string; value: number; count: string }) {
  return <div className="debtRow"><div><span>{label}</span><b>{count}</b></div><div className="bar"><i style={{ width: `${value}%` }} /></div></div>;
}
