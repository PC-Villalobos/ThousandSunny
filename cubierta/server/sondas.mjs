// Las sondas: lo unico del sistema que puede decir "observado".
//
// Encargo: docs/architecture/ENCARGO_PULSO_REAL.md (secciones 2 y 5).
//
// Un eje NO es un booleano del personaje. Cada eje tiene su propio estado, y un
// mismo nakama puede estar `observado` en liveness, `no_observable` en memoria y
// `declarado` en throughput a la vez. Colapsar esto reintroduce el booleano
// disfrazado que este corte existe para eliminar.
//
// Distincion que no puede perderse: `no_observable` dice que el instrumento no
// llega; `sin_dato` dice que llega y no ve nada. No son lo mismo.

export const OBSERVADO = "observado";
export const DECLARADO = "declarado";
export const NO_OBSERVABLE = "no_observable";
export const SIN_DATO = "sin_dato";

export const EJES = Object.freeze(["liveness", "residencia", "throughput", "memoria", "escritura"]);

export const FRESCURA_SONDA_PS_MS = 15 * 1000;

function eje(estado, { valor = null, fuente = null, motivo = null, edad_ms = null } = {}) {
  return { estado, valor, fuente, motivo, edad_ms };
}

/**
 * Sonda de proceso. Comprueba EXISTENCIA y nada mas.
 *
 * Portabilidad: `process.kill(pid, 0)` verifica existencia sin enviar senal y
 * funciona en Linux, macOS y Windows. No se usa /proc: la maquina del Capitan
 * es Windows.
 *
 * Limite duro del encargo (5.1): solo PIDs que el agente declaro PARA SI MISMO,
 * y solo su existencia. Esto no es el barco inspeccionando la maquina; es el
 * nakama dando un punto donde tomarle el pulso.
 *
 * `matar` se inyecta para poder probar los tres desenlaces sin fabricar procesos.
 */
export function sondaProceso(pid, { matar = (p, s) => process.kill(p, s) } = {}) {
  if (pid === null || pid === undefined) {
    return eje(NO_OBSERVABLE, { fuente: "sonda de proceso", motivo: "el agente no declara pid" });
  }
  if (!Number.isInteger(pid) || pid <= 0) {
    return eje(NO_OBSERVABLE, { fuente: "sonda de proceso", motivo: `pid declarado no valido: ${pid}` });
  }
  try {
    matar(pid, 0);
    return eje(OBSERVADO, { valor: true, fuente: "sonda de proceso", motivo: `pid ${pid} existe` });
  } catch (err) {
    if (err.code === "ESRCH") {
      // Observacion positiva de una AUSENCIA: es lo que alimenta D1.
      return eje(OBSERVADO, { valor: false, fuente: "sonda de proceso", motivo: `pid ${pid} no existe` });
    }
    if (err.code === "EPERM") {
      // Existe pero no es nuestro. Nunca es contradiccion (encargo 4.2, D1).
      return eje(NO_OBSERVABLE, { fuente: "sonda de proceso", motivo: `pid ${pid} existe pero no es accesible (EPERM)` });
    }
    return eje(NO_OBSERVABLE, { fuente: "sonda de proceso", motivo: `no se pudo comprobar el pid: ${err.code || err.message}` });
  }
}

/**
 * Memoria (RSS de otro proceso). Especifica de plataforma: donde no se pueda
 * leer, degrada a `no_observable`. No se estima jamas.
 */
export function sondaMemoria(pid, { leerStatm = null, plataforma = process.platform } = {}) {
  if (pid === null || pid === undefined) {
    return eje(NO_OBSERVABLE, { fuente: "sonda de proceso", motivo: "el agente no declara pid" });
  }
  if (plataforma !== "linux" || !leerStatm) {
    return eje(NO_OBSERVABLE, {
      fuente: "sonda de proceso",
      motivo: `la RSS de otro proceso no es legible en ${plataforma}; no se estima`,
    });
  }
  try {
    const campos = String(leerStatm(pid)).trim().split(/\s+/);
    const paginas = Number(campos[1]);
    if (!Number.isFinite(paginas)) throw new Error("statm ilegible");
    return eje(OBSERVADO, {
      valor: Math.round((paginas * 4096) / 1e6),
      fuente: "/proc/<pid>/statm",
      motivo: null,
    });
  } catch (err) {
    return eje(NO_OBSERVABLE, { fuente: "sonda de proceso", motivo: `no se pudo leer la RSS: ${err.message}` });
  }
}

/**
 * Residencia via Ollama. `fuenteOllama` es la lectura de /api/ps tal cual la
 * dejan los adaptadores: si no esta `ok`, el eje es `no_observable` y no se
 * evalua ninguna contradiccion sobre el.
 */
export function sondaResidencia(fuenteOllama, actorDeclarado, { ahoraMs = Date.now() } = {}) {
  if (!fuenteOllama || fuenteOllama.estado !== "ok") {
    return eje(NO_OBSERVABLE, {
      fuente: "ollama /api/ps",
      motivo: fuenteOllama?.motivo || "Ollama no responde",
    });
  }
  const edad = fuenteOllama.ts ? ahoraMs - Date.parse(fuenteOllama.ts) : null;
  const residentes = fuenteOllama.datos?.residentes || [];
  const instalados = fuenteOllama.datos?.instalados || [];

  // Guarda esencial: esta sonda solo tiene jurisdiccion sobre actores servidos
  // por Ollama. Un actor "claude-code" no tiene residencia que comprobar aqui,
  // y tratarlo como ausente fabricaria una contradiccion D2 falsa contra todo
  // agente que no sea local.
  const esDeOllama = actorDeclarado
    && (String(actorDeclarado).toLowerCase().startsWith("ollama:")
      || instalados.some((m) => nombresCompatibles(m, actorDeclarado)));
  if (!esDeOllama) {
    return eje(NO_OBSERVABLE, {
      fuente: "ollama /api/ps",
      motivo: actorDeclarado
        ? `"${actorDeclarado}" no es un modelo servido por Ollama: fuera del alcance de esta sonda`
        : "el agente no declara actor",
      edad_ms: edad,
    });
  }

  if (!residentes.length) {
    return eje(OBSERVADO, {
      valor: null,
      fuente: "ollama /api/ps",
      motivo: "Ollama responde y no hay ningun modelo residente",
      edad_ms: edad,
    });
  }
  const coincide = actorDeclarado
    ? residentes.find((r) => nombresCompatibles(r.nombre, actorDeclarado))
    : null;
  if (!coincide) {
    return eje(OBSERVADO, {
      valor: null,
      fuente: "ollama /api/ps",
      motivo: `hay ${residentes.length} modelo(s) residente(s), ninguno corresponde a "${actorDeclarado}"`,
      edad_ms: edad,
    });
  }
  return eje(OBSERVADO, {
    valor: coincide.bytes_vram != null ? Math.round(coincide.bytes_vram / 1e6) : null,
    fuente: "ollama /api/ps",
    motivo: `${coincide.nombre} residente`,
    edad_ms: edad,
  });
}

/** "qwen2.5:7b" declarado como actor casa con el residente "qwen2.5:7b" o "ollama:qwen2.5:7b". */
export function nombresCompatibles(residente, actor) {
  const limpia = (s) => String(s).toLowerCase().replace(/^ollama:/, "").trim();
  const a = limpia(residente);
  const b = limpia(actor);
  if (!a || !b) return false;
  return a === b || b.includes(a) || a.includes(b.split(":")[0]);
}

/**
 * Escritura en el spine: delta del contador de eventos de la bitacora entre
 * muestras. Es la unica medida que sobrevive cuando el agente es remoto.
 */
export function sondaEscritura(fuenteBitacora, contadorPrevio) {
  if (!fuenteBitacora || fuenteBitacora.estado !== "ok") {
    return eje(NO_OBSERVABLE, {
      fuente: "bitacora /api/health",
      motivo: fuenteBitacora?.motivo || "la bitacora no responde",
    });
  }
  const actual = fuenteBitacora.datos?.eventos;
  if (!Number.isFinite(actual)) {
    return eje(NO_OBSERVABLE, { fuente: "bitacora /api/health", motivo: "la bitacora no reporta contador de eventos" });
  }
  if (!Number.isFinite(contadorPrevio)) {
    return eje(SIN_DATO, { fuente: "bitacora /api/health", motivo: "primera muestra: aun no hay delta que calcular" });
  }
  const delta = actual - contadorPrevio;
  return delta > 0
    ? eje(OBSERVADO, { valor: delta, fuente: "bitacora /api/health", motivo: `${delta} evento(s) nuevos` })
    : eje(SIN_DATO, { fuente: "bitacora /api/health", motivo: "la bitacora responde y no hay eventos nuevos" });
}

/** Throughput: sale del almacen medido, nunca de la senal del agente. */
export function sondaThroughput(lectura) {
  if (!lectura || lectura.valor === null) {
    return eje(lectura?.motivo?.includes("fuera de ventana") ? SIN_DATO : SIN_DATO, {
      fuente: "almacen medido (hablar.mjs)",
      motivo: lectura?.motivo || "sin muestras medidas para este personaje",
    });
  }
  return eje(OBSERVADO, {
    valor: lectura.valor,
    fuente: `almacen medido (${lectura.tipo})`,
    motivo: lectura.tipo === "muestra_unica" ? `${lectura.n} muestra(s): se publica la ultima cruda, no una media` : null,
    edad_ms: lectura.edad_ms,
  });
}

/**
 * Reune los cinco ejes de un nakama. Sin ningun acceso a `senal.vitales`:
 * lo que el agente afirma no puede producir un `observado` (no-regresion 9).
 */
export function observarEjes({
  senal = null,
  fuenteOllama = null,
  fuenteBitacora = null,
  contadorBitacoraPrevio = null,
  lecturaThroughput = null,
  ahoraMs = Date.now(),
  matar,
  leerStatm,
  plataforma,
} = {}) {
  const pid = Number.isInteger(senal?.pid) ? senal.pid : null;
  return {
    liveness: sondaProceso(pid, matar ? { matar } : {}),
    memoria: sondaMemoria(pid, { leerStatm, plataforma }),
    residencia: sondaResidencia(fuenteOllama, senal?.actor || null, { ahoraMs }),
    throughput: sondaThroughput(lecturaThroughput),
    escritura: sondaEscritura(fuenteBitacora, contadorBitacoraPrevio),
  };
}
