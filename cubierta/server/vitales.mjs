// Constantes vitales y clima del barco.
//
// Doctrina de las cinco tintas: cada numero declara su procedencia. "Pulso" es un
// nombre bonito para tokens por segundo; nunca una prueba de que ahi dentro late
// algo. Ningun vital se estima cuando falta el dato: se devuelve null con motivo.

export const TINTAS = ["medido", "calculado", "inferido", "evaluado", "propuesto", "desconocido"];

/**
 * Cada vital lleva DOS etiquetas, y hacen falta las dos:
 *   `tinta`  -- como se derivo el numero (doctrina canonica de las cinco tintas)
 *   `origen` -- quien responde de el: `observado` (lo midio el barco),
 *               `declarado` (lo afirma el agente y nadie lo ha comprobado),
 *               `no_observable` o `sin_dato`.
 * Un mismo "medido" no vale igual si lo midio el barco que si lo dice el actor
 * de si mismo. Antes de este corte todo lo autodeclarado se pintaba como
 * `medido` a secas, y eso era la mentira de fondo del tablero.
 */
function vital(nombre, valor, unidad, tinta, fuente, origen, motivo = null) {
  const vacio = valor === null || valor === undefined;
  return {
    nombre,
    valor: valor ?? null,
    unidad,
    tinta: vacio ? "desconocido" : tinta,
    origen: vacio ? (origen === "observado" ? "sin_dato" : origen) : origen,
    fuente,
    motivo: vacio ? motivo || "sin dato en la ultima senal" : null,
  };
}

function deAlmacen(nombre, unidad, lectura, tinta = "medido") {
  if (!lectura || lectura.valor === null) return null;
  return {
    nombre,
    valor: lectura.valor,
    unidad,
    tinta: lectura.tipo === "tasa" ? "calculado" : tinta,
    origen: "observado",
    fuente: `almacen medido (${lectura.tipo}, n=${lectura.n})`,
    motivo: `muestra de hace ${Math.round((lectura.edad_ms || 0) / 1000)}s`,
  };
}

/**
 * Vitales de un personaje. Prefiere SIEMPRE la medida sobre la declaracion:
 * si el almacen tiene muestra propia, esa gana y va como `observado`; si no, se
 * muestra lo que el agente afirma, etiquetado `declarado`.
 */
export function calcularVitales({
  senal = null,
  ejes = null,
  lecturas = null,
  sueno = null,
  nakamaId = null,
} = {}) {
  const v = senal?.vitales || {};
  const vitales = [
    deAlmacen("pulso", "tok/s", lecturas?.tokens_por_s)
      || vital("pulso", v.tokens_por_s ?? null, "tok/s", "medido", "senal del agente", "declarado"),
    deAlmacen("latencia", "ms", lecturas?.latencia_ms)
      || vital("latencia", v.latencia_ms ?? null, "ms", "medido", "senal del agente", "declarado"),
    vital("carga de contexto", v.contexto_pct ?? null, "%", "calculado", "senal del agente", "declarado"),
    vital("errores en ventana", v.errores ?? null, "n", "medido", "senal del agente", "declarado"),
    vital(
      "residencia",
      ejes?.residencia?.estado === "observado" ? ejes.residencia.valor : null,
      "MB",
      "medido",
      ejes?.residencia?.fuente || "ollama /api/ps",
      ejes?.residencia?.estado === "no_observable" ? "no_observable" : "observado",
      ejes?.residencia?.motivo || "ningun modelo residente asociado",
    ),
    vital(
      "memoria",
      ejes?.memoria?.estado === "observado" ? ejes.memoria.valor : null,
      "MB",
      "medido",
      ejes?.memoria?.fuente || "sonda de proceso",
      ejes?.memoria?.estado === "no_observable" ? "no_observable" : "observado",
      ejes?.memoria?.motivo || null,
    ),
  ];

  // Fusion actor/personaje: el unico dato de este tipo que existe en el sistema
  // sale del ledger nocturno, y solo aplica al personaje que durmio.
  const aplicaFusion = sueno && nakamaId
    && String(sueno.personaje || "").toLowerCase() === String(nakamaId).toLowerCase();
  vitales.push(vital(
    "fusion",
    aplicaFusion ? sueno.racha : null,
    "ciclos seguidos",
    "calculado",
    "sleep_ledger.jsonl",
    "observado",
    aplicaFusion ? null : "este personaje no aparece en el ultimo ciclo de sueno",
  ));

  return vitales;
}

function media(numeros) {
  const validos = numeros.filter((n) => Number.isFinite(n));
  if (!validos.length) return null;
  return validos.reduce((a, b) => a + b, 0) / validos.length;
}

/**
 * Clima del barco. No es moral ni animo: es la sintesis de cuatro ejes
 * operativos, y cada eje se puede desplegar hasta los hechos que lo componen.
 * Si un eje no tiene con que calcularse, vale null y dice por que. No hay
 * ningun 87% inventado en este fichero.
 */
export function calcularClima({ fuentes = [], encarnaciones = [], recados = [], nakamas = [] } = {}) {
  const fuentesOk = fuentes.filter((f) => f.estado === "ok");
  const senales = encarnaciones.map((e) => e.senal).filter(Boolean);

  const disponibilidad = nakamas.length
    ? {
        valor: Math.round((encarnaciones.length / nakamas.length) * 100),
        unidad: "%",
        tinta: "calculado",
        base: `${encarnaciones.length} de ${nakamas.length} personajes tienen actor encarnandolos`,
      }
    : { valor: null, unidad: "%", tinta: "desconocido", base: "no hay tripulacion definida" };

  const cargaMedia = media(senales.map((s) => s.vitales?.contexto_pct));
  const carga = cargaMedia === null
    ? { valor: null, unidad: "%", tinta: "desconocido", base: "ninguna senal reporta carga de contexto" }
    : { valor: Math.round(cargaMedia), unidad: "%", tinta: "calculado", base: `media de ${senales.length} senales vivas` };

  const errores = senales.reduce((a, s) => a + (s.vitales?.errores || 0), 0);
  const fuentesCaidas = fuentes.length - fuentesOk.length;
  const integridad = fuentes.length === 0
    ? { valor: null, unidad: "%", tinta: "desconocido", base: "no hay fuentes configuradas" }
    : {
        valor: Math.max(0, Math.round((fuentesOk.length / fuentes.length) * 100) - errores * 5),
        unidad: "%",
        tinta: "calculado",
        base: `${fuentesOk.length}/${fuentes.length} fuentes responden; ${errores} errores en ventana; ${fuentesCaidas} sin senal`,
      };

  const bloqueados = recados.filter((r) => r.estado === "bloqueado" || r.estado === "esperando_llave");
  const coordinacion = recados.length === 0
    ? { valor: null, unidad: "n", tinta: "desconocido", base: "no hay recados en curso" }
    : {
        valor: bloqueados.length,
        unidad: "esperando al Capitan",
        tinta: "medido",
        base: `${bloqueados.length} de ${recados.length} recados detenidos`,
      };

  const ejes = { disponibilidad, carga, integridad, coordinacion };
  const conocidos = Object.values(ejes).filter((e) => e.valor !== null);

  return {
    ejes,
    resumen: conocidos.length === 0
      ? { estado: "desconocido", motivo: "ninguna fuente responde: el barco no puede decir como esta" }
      : {
          estado: describirClima(ejes),
          motivo: `calculado sobre ${conocidos.length} de 4 ejes; el resto sin dato`,
        },
    nota: "Clima no es animo. Es la sintesis de cuatro ejes operativos, cada uno desplegable hasta sus hechos.",
  };
}

function describirClima({ disponibilidad, integridad, coordinacion }) {
  if (integridad.valor !== null && integridad.valor < 50) return "mar gruesa";
  if (coordinacion.valor) return "al pairo, esperando al Capitan";
  if (disponibilidad.valor === 0) return "en calma, sin nadie encarnado";
  if (disponibilidad.valor !== null && disponibilidad.valor > 0) return "en travesia";
  return "indeterminado";
}
