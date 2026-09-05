// Almacen medido: las muestras que el barco obtiene midiendo, no las que le
// cuentan.
//
// Encargo: docs/architecture/ENCARGO_PULSO_REAL.md (seccion 6).
//
// Persistir muestras crea un problema semantico nuevo -- datos medidos viejos
// aparentando pulso actual -- y este modulo existe para cerrarlo:
//
//   - ventana deslizante: fuera de ella la muestra SE DESCARTA, no se atenua;
//   - agregacion minima: una tasa exige 3 muestras; con 1 o 2 se publica la
//     ultima cruda etiquetada, nunca una media que aparente tendencia;
//   - caducidad: sin muestra fresca -> null, con el motivo y la antiguedad;
//   - prohibido el ultimo valor conocido sin sello de antiguedad. Un numero
//     medido hace nueve minutos, pintado sin fecha, es una mentira con
//     procedencia falsificada.

export const VENTANA_ALMACEN_MEDIDO_MS = 600 * 1000;
export const MUESTRAS_MINIMAS_PARA_TASA = 3;
export const CAP_MUESTRAS_POR_NAKAMA = 200;

export class AlmacenMedido {
  constructor({
    ventanaMs = VENTANA_ALMACEN_MEDIDO_MS,
    muestrasMinimas = MUESTRAS_MINIMAS_PARA_TASA,
    cap = CAP_MUESTRAS_POR_NAKAMA,
  } = {}) {
    this.ventanaMs = ventanaMs;
    this.muestrasMinimas = muestrasMinimas;
    this.cap = cap;
    this.porNakama = new Map();
    // La marca de la ultima muestra sobrevive a la poda. Sin esto, al caducar la
    // ventana se pierde justo el dato que el encargo obliga a mostrar: cuanto
    // hace que se midio por ultima vez. Quedaria "sin muestras" cuando la verdad
    // es "hace nueve minutos", que es una respuesta peor y menos honesta.
    this.ultimaMarca = new Map();
  }

  /**
   * Registra una muestra REAL. La unica llamada legitima hoy es la cosecha de
   * hablar.mjs: el barco mide lo que el mismo causa.
   */
  registrar(nakama, muestra, ahoraMs = Date.now()) {
    if (!nakama) return null;
    const fila = {
      ts: muestra.ts || new Date(ahoraMs).toISOString(),
      fuente: muestra.fuente || "hablar.mjs",
      tokens_por_s: numero(muestra.tokens_por_s),
      latencia_ms: numero(muestra.latencia_ms),
      carga_ms: numero(muestra.carga_ms),
      modelo: muestra.modelo || null,
    };
    const lista = this.porNakama.get(nakama) || [];
    lista.push(fila);
    if (lista.length > this.cap) lista.splice(0, lista.length - this.cap);
    this.porNakama.set(nakama, lista);
    this.ultimaMarca.set(nakama, fila.ts);
    return fila;
  }

  /** Muestras dentro de ventana. Las de fuera se descartan de verdad. */
  enVentana(nakama, ahoraMs = Date.now()) {
    const lista = this.porNakama.get(nakama);
    if (!lista || !lista.length) return [];
    const corte = ahoraMs - this.ventanaMs;
    const vivas = lista.filter((m) => Date.parse(m.ts) >= corte);
    if (vivas.length !== lista.length) this.porNakama.set(nakama, vivas);
    return vivas;
  }

  /** Hora de la ultima muestra registrada, aunque ya se haya podado. */
  ultimaMarcaDe(nakama) {
    return this.ultimaMarca.get(nakama) || null;
  }

  /**
   * Lectura publicable de un campo.
   * Devuelve { valor, tipo, n, edad_ms, motivo }:
   *   tipo "tasa"          -> media sobre >= muestrasMinimas
   *   tipo "muestra_unica" -> ultima cruda (1 o 2 muestras)
   *   valor null           -> sin muestras en ventana, con motivo fechado
   */
  lectura(nakama, campo, ahoraMs = Date.now()) {
    const vivas = this.enVentana(nakama, ahoraMs).filter((m) => m[campo] !== null);
    if (!vivas.length) {
      const marca = this.ultimaMarcaDe(nakama);
      const motivo = marca
        ? `ultima muestra hace ${Math.round((ahoraMs - Date.parse(marca)) / 1000)}s, fuera de ventana`
        : "sin muestras medidas para este personaje";
      return { valor: null, tipo: null, n: 0, edad_ms: null, motivo };
    }
    const ultima = vivas[vivas.length - 1];
    const edad = ahoraMs - Date.parse(ultima.ts);
    if (vivas.length < this.muestrasMinimas) {
      return {
        valor: ultima[campo],
        tipo: "muestra_unica",
        n: vivas.length,
        edad_ms: edad,
        motivo: `${vivas.length} muestra(s) en ventana: por debajo de ${this.muestrasMinimas}, no se agrega`,
      };
    }
    const media = vivas.reduce((a, m) => a + m[campo], 0) / vivas.length;
    return {
      valor: Math.round(media * 100) / 100,
      tipo: "tasa",
      n: vivas.length,
      edad_ms: edad,
      motivo: null,
    };
  }

  /** Hay corroboracion medida de produccion en la ventana dada (para D3). */
  corrobora(nakama, ventanaMs, ahoraMs = Date.now()) {
    const corte = ahoraMs - ventanaMs;
    return this.enVentana(nakama, ahoraMs).some(
      (m) => Date.parse(m.ts) >= corte && m.tokens_por_s !== null && m.tokens_por_s > 0,
    );
  }

  podar(ahoraMs = Date.now()) {
    for (const nakama of [...this.porNakama.keys()]) this.enVentana(nakama, ahoraMs);
  }
}

function numero(v) {
  return Number.isFinite(v) ? v : null;
}
