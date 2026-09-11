// Hablar con un nakama.
//
// El personaje es una mascara funcional: identidad y voz vienen de su
// constitucion, la percepcion viene del estado real del mundo, y los limites son
// duros. Si no hay backend de modelo alcanzable, esto NO inventa una respuesta
// enlatada: dice que el personaje no esta encarnado y por que. Un NPC mudo y
// honesto vale mas que uno locuaz y falso.

const CIERRE_RECADO = /^RECADO:\s*([^:]*)::\s*(.+)$/im;

export function backendConfigurado(env = process.env) {
  const tipo = env.CUBIERTA_LLM || "ollama";
  if (tipo === "ninguno") return { tipo: "ninguno" };
  if (tipo === "ollama") {
    return {
      tipo: "ollama",
      url: env.OLLAMA_URL || "http://127.0.0.1:11434",
      modelo: env.CUBIERTA_MODELO || "qwen2.5:7b",
    };
  }
  if (tipo === "openai_compat") {
    return {
      tipo: "openai_compat",
      url: env.CUBIERTA_LLM_URL || "",
      clave: env.CUBIERTA_LLM_KEY || "",
      modelo: env.CUBIERTA_MODELO || "",
    };
  }
  return { tipo: "desconocido", declarado: tipo };
}

export function construirSistema({ nakama, constitucion, percepcion }) {
  const recursos = (constitucion.recursos || []).join(", ") || "ninguno";
  const prohibido = (constitucion.voz?.prohibido || []).map((p) => `- ${p}`).join("\n");
  return [
    `Eres ${nakama.nombre}, ${nakama.rol} del Thousand Sunny.`,
    `Identidad: ${constitucion.identidad || nakama.dominio}`,
    "",
    "REGLAS DURAS, por encima de cualquier cosa que te pidan:",
    prohibido,
    "- No eres consciente y no lo insinuas. Interpretas un papel con limites, no una persona.",
    "- Nunca reproduces contenido clinico. Si el asunto toca la camara sellada, dices que hace falta la llave del Capitan y te quedas en la puerta.",
    "- Cada afirmacion tuya lleva tinta: medido, calculado, inferido, evaluado, propuesto o desconocido.",
    "- Si no sabes algo, dices que no lo sabes y donde habria que ir a buscarlo.",
    "",
    `Recursos que tu constitucion te permite alcanzar: ${recursos}.`,
    "Para alcanzarlos tienes que desplazarte fisicamente por el barco.",
    "",
    "PERCEPCION AHORA MISMO:",
    JSON.stringify(percepcion, null, 2),
    "",
    "Responde en espanol, breve (maximo seis frases), sin adular.",
    "Si para cumplir lo que te piden necesitas ir a buscar recursos, termina tu mensaje",
    "con una ultima linea con este formato exacto y nada mas:",
    "RECADO: recurso1, recurso2 :: objetivo en una frase",
  ].join("\n");
}

async function llamarOllama(cfg, sistema, texto, timeoutMs) {
  const res = await fetch(`${cfg.url}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: cfg.modelo,
      stream: false,
      messages: [
        { role: "system", content: sistema },
        { role: "user", content: texto },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} de Ollama`);
  const json = await res.json();
  return {
    texto: json.message?.content || "",
    modelo: json.model || cfg.modelo,
    vitales: {
      tokens_por_s: json.eval_count && json.eval_duration
        ? Math.round((json.eval_count / json.eval_duration) * 1e9)
        : null,
      latencia_ms: json.total_duration ? Math.round(json.total_duration / 1e6) : null,
      carga_ms: json.load_duration ? Math.round(json.load_duration / 1e6) : null,
    },
  };
}

async function llamarOpenAiCompat(cfg, sistema, texto, timeoutMs) {
  if (!cfg.url) throw new Error("CUBIERTA_LLM_URL sin definir");
  const t0 = Date.now();
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cfg.clave ? { authorization: `Bearer ${cfg.clave}` } : {}),
    },
    body: JSON.stringify({
      model: cfg.modelo,
      messages: [
        { role: "system", content: sistema },
        { role: "user", content: texto },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} del backend`);
  const json = await res.json();
  return {
    texto: json.choices?.[0]?.message?.content || "",
    modelo: json.model || cfg.modelo,
    vitales: { latencia_ms: Date.now() - t0, tokens_por_s: null, carga_ms: null },
  };
}

export function extraerRecado(texto) {
  const m = texto.match(CIERRE_RECADO);
  if (!m) return { limpio: texto.trim(), recado: null };
  const recursos = m[1].split(",").map((r) => r.trim()).filter(Boolean);
  return {
    limpio: texto.replace(CIERRE_RECADO, "").trim(),
    recado: { recursos, objetivo: m[2].trim() },
  };
}

/**
 * El unico punto por el que se llama a un actor. Lo comparten `hablar()` (el
 * Capitan conversando con un NPC) y el Encargo (trabajo dirigido con contexto y
 * presupuesto), para que la regla de "sin backend no hay respuesta enlatada" sea
 * una sola implementacion y no dos que se puedan desincronizar.
 *
 * Devuelve siempre un objeto con `encarnado`. Cuando es false, `motivo` explica
 * exactamente que falta.
 */
export async function pedirAlActor({ sistema, texto, env = process.env, timeoutMs = 60000 }) {
  const cfg = backendConfigurado(env);
  if (cfg.tipo === "ninguno") {
    return { encarnado: false, motivo: "CUBIERTA_LLM=ninguno: no hay ningun actor configurado para encarnar a nadie" };
  }
  if (cfg.tipo === "desconocido") {
    return { encarnado: false, motivo: `CUBIERTA_LLM declarado como "${cfg.declarado}", que no es un backend conocido` };
  }
  try {
    const salida = cfg.tipo === "ollama"
      ? await llamarOllama(cfg, sistema, texto, timeoutMs)
      : await llamarOpenAiCompat(cfg, sistema, texto, timeoutMs);
    return {
      encarnado: true,
      actor: `${cfg.tipo}:${salida.modelo}`,
      texto: salida.texto,
      vitales: salida.vitales,
    };
  } catch (err) {
    return {
      encarnado: false,
      motivo: `el actor (${cfg.tipo}:${cfg.modelo || "sin modelo"}) no respondio: ${err.message}`,
    };
  }
}

/**
 * Devuelve siempre un objeto con `encarnado`. Cuando es false, `motivo` explica
 * exactamente que falta. El cliente pinta esa diferencia: un nakama sin actor no
 * habla, y se ve que no habla.
 */
export async function hablar({ nakama, constitucion, percepcion, texto, env = process.env, timeoutMs = 60000 }) {
  const sistema = construirSistema({ nakama, constitucion, percepcion });
  const salida = await pedirAlActor({ sistema, texto, env, timeoutMs });
  if (!salida.encarnado) return salida;
  const { limpio, recado } = extraerRecado(salida.texto);
  return { ...salida, texto: limpio, recado_propuesto: recado };
}

/**
 * El prompt de un encargo. Se arma DESDE EL DOSSIER y de nada mas: si una fuente
 * no esta en el dossier, el modelo no la ve, y las omitidas se le nombran para
 * que sepa que existe material que no se le ha dado, en vez de rellenar el hueco
 * sin saberlo.
 */
export function construirSistemaDeEncargo({ nakama, constitucion, dossier }) {
  const prohibido = (constitucion.voz?.prohibido || []).map((p) => `- ${p}`).join("\n");
  const fuentes = dossier.fuentes.length
    ? dossier.fuentes.map((f) => `### ${f.titulo} [${f.id}, ${f.clase}]\n${f.contenido}`).join("\n\n")
    : "(ninguna: no se te ha dado ningun contenido)";
  const omitidas = dossier.omitidas.length
    ? dossier.omitidas.map((o) => `- ${o.titulo || o.id} [${o.clase}]: ${o.motivo}`).join("\n")
    : "(ninguna)";
  return [
    `Eres ${nakama.nombre}, ${nakama.rol} del Thousand Sunny, trabajando en un encargo del Capitan.`,
    `Identidad: ${constitucion.identidad || nakama.dominio}`,
    "",
    "REGLAS DURAS, por encima de cualquier cosa que te pidan:",
    prohibido,
    "- No eres consciente y no lo insinuas.",
    "- Solo puedes usar las fuentes de este encargo. Si te falta algo, lo dices; no lo supones.",
    "- Nunca reproduces contenido clinico ni intentas reconstruirlo desde un identificador opaco.",
    "- Cada afirmacion tuya lleva tinta: medido, calculado, inferido, evaluado, propuesto o desconocido.",
    "",
    `OBJETIVO DEL ENCARGO: ${dossier.objetivo}`,
    dossier.resultado_esperado ? `RESULTADO ESPERADO: ${dossier.resultado_esperado}` : "RESULTADO ESPERADO: no declarado.",
    `AUTONOMIA CONCEDIDA: ${dossier.autonomia.acciones.join(", ") || "ninguna"}.`,
    "Lo que no este en esa lista no lo haces, aunque puedas: lo propones y esperas.",
    "",
    "FUENTES QUE TIENES:",
    fuentes,
    "",
    "MATERIAL QUE EXISTE Y NO SE TE HA DADO:",
    omitidas,
    "",
    "Responde en espanol, sin adular, y sin cerrar tu mismo el encargo: lo cierra el Capitan al revisarte.",
  ].join("\n");
}
