// Geometria del barco: de la definicion declarativa de barco.json a una rejilla
// transitable, y de la rejilla a una ruta. Sin dependencias y sin builtins de Node:
// este modulo lo importan igual el servidor y el navegador.

export const VACIO = 0;      // fuera del casco: no se dibuja, no se pisa
export const SUELO = 1;      // pasillo o intemperie dentro del casco
export const INTERIOR = 2;   // interior de una sala
export const MURO = 3;       // pared de una sala
export const PUERTA = 4;     // hueco en la pared
export const SELLADO = 5;    // interior de una sala sellada: se pisa nunca, se dibuja opaco

const TRANSITABLE = new Set([SUELO, INTERIOR, PUERTA]);

function dentroRect([rx, ry, rw, rh], x, y) {
  return x >= rx && x < rx + rw && y >= ry && y < ry + rh;
}

function enPerimetro([rx, ry, rw, rh], x, y) {
  return x === rx || y === ry || x === rx + rw - 1 || y === ry + rh - 1;
}

/**
 * Construye la rejilla de una cubierta.
 * Devuelve celdas planas (index = y * w + x) mas indices por sala.
 */
export function construirMapa(cubierta) {
  const { w, h } = cubierta.grid;
  const celdas = new Uint8Array(w * h);
  const salaDe = new Array(w * h).fill(null);
  const salas = cubierta.salas || [];
  const puertas = new Map();
  for (const sala of salas) {
    for (const [px, py] of sala.puertas || []) puertas.set(`${px},${py}`, sala.id);
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!dentroRect(cubierta.casco, x, y)) { celdas[i] = VACIO; continue; }
      const sala = salas.find((s) => dentroRect(s.rect, x, y));
      if (!sala) { celdas[i] = SUELO; continue; }
      salaDe[i] = sala.id;
      if (puertas.get(`${x},${y}`) === sala.id) { celdas[i] = PUERTA; continue; }
      if (enPerimetro(sala.rect, x, y)) { celdas[i] = MURO; continue; }
      celdas[i] = sala.sellada ? SELLADO : INTERIOR;
    }
  }

  return {
    id: cubierta.id,
    w,
    h,
    celdas,
    salaDe,
    salas,
    escaleras: cubierta.escaleras || [],
    celda(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return VACIO;
      return celdas[y * w + x];
    },
    sala(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return null;
      return salaDe[y * w + x];
    },
    transitable(x, y) {
      return TRANSITABLE.has(this.celda(x, y));
    },
  };
}

export function construirMapas(barco) {
  const mapas = new Map();
  for (const cubierta of barco.cubiertas) mapas.set(cubierta.id, construirMapa(cubierta));
  return mapas;
}

/** Primera casilla transitable de una sala, para plantar a alguien dentro sin conocer su plano. */
export function casillaDeSala(mapa, salaId) {
  for (let y = 0; y < mapa.h; y++) {
    for (let x = 0; x < mapa.w; x++) {
      if (mapa.sala(x, y) === salaId && mapa.transitable(x, y)) return [x, y];
    }
  }
  return null;
}

/** La puerta de una sala: donde se planta quien no puede entrar. */
export function puertaDeSala(mapa, salaId) {
  const sala = mapa.salas.find((s) => s.id === salaId);
  if (!sala || !sala.puertas || !sala.puertas.length) return null;
  return sala.puertas[0].slice();
}

const VECINOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * A* sobre la rejilla, movimiento en cruz (nada de diagonales: el barco tiene pasillos,
 * no campo abierto). Devuelve la lista de casillas incluidas origen y destino, o null.
 */
export function buscarRuta(mapa, desde, hasta) {
  const [sx, sy] = desde;
  const [gx, gy] = hasta;
  if (!mapa.transitable(sx, sy) || !mapa.transitable(gx, gy)) return null;
  if (sx === gx && sy === gy) return [[sx, sy]];

  const idx = (x, y) => y * mapa.w + x;
  const heur = (x, y) => Math.abs(x - gx) + Math.abs(y - gy);
  const coste = new Map([[idx(sx, sy), 0]]);
  const previo = new Map();
  const abierta = [{ x: sx, y: sy, f: heur(sx, sy) }];

  while (abierta.length) {
    let mejor = 0;
    for (let i = 1; i < abierta.length; i++) if (abierta[i].f < abierta[mejor].f) mejor = i;
    const actual = abierta.splice(mejor, 1)[0];
    if (actual.x === gx && actual.y === gy) {
      const ruta = [[gx, gy]];
      let clave = idx(gx, gy);
      while (previo.has(clave)) {
        const [px, py] = previo.get(clave);
        ruta.unshift([px, py]);
        clave = idx(px, py);
      }
      return ruta;
    }
    const g = coste.get(idx(actual.x, actual.y));
    for (const [dx, dy] of VECINOS) {
      const nx = actual.x + dx;
      const ny = actual.y + dy;
      if (!mapa.transitable(nx, ny)) continue;
      const ng = g + 1;
      const clave = idx(nx, ny);
      if (coste.has(clave) && coste.get(clave) <= ng) continue;
      coste.set(clave, ng);
      previo.set(clave, [actual.x, actual.y]);
      abierta.push({ x: nx, y: ny, f: ng + heur(nx, ny) });
    }
  }
  return null;
}

/** Escalera de una cubierta hacia otra, si existe salto directo. */
export function escaleraHacia(mapa, cubiertaDestino) {
  return mapa.escaleras.find((e) => e.destino_cubierta === cubiertaDestino) || null;
}

/**
 * Ruta entre cubiertas distintas: encadena tramos por escaleras.
 * Devuelve una lista de tramos { cubierta, ruta, escalera } o null si no hay camino.
 */
export function buscarRutaEntreCubiertas(mapas, origen, destino) {
  if (origen.cubierta === destino.cubierta) {
    const ruta = buscarRuta(mapas.get(origen.cubierta), origen.tile, destino.tile);
    return ruta ? [{ cubierta: origen.cubierta, ruta, escalera: null }] : null;
  }
  const orden = [...mapas.keys()];
  const iOrigen = orden.indexOf(origen.cubierta);
  const iDestino = orden.indexOf(destino.cubierta);
  if (iOrigen < 0 || iDestino < 0) return null;
  const paso = iOrigen < iDestino ? 1 : -1;
  const tramos = [];
  let posicion = { cubierta: origen.cubierta, tile: origen.tile };

  for (let i = iOrigen; i !== iDestino; i += paso) {
    const mapa = mapas.get(orden[i]);
    const escalera = escaleraHacia(mapa, orden[i + paso]);
    if (!escalera) return null;
    const ruta = buscarRuta(mapa, posicion.tile, escalera.tile);
    if (!ruta) return null;
    tramos.push({ cubierta: orden[i], ruta, escalera: escalera.id });
    posicion = { cubierta: escalera.destino_cubierta, tile: escalera.destino_tile };
  }

  const ultima = buscarRuta(mapas.get(destino.cubierta), posicion.tile, destino.tile);
  if (!ultima) return null;
  tramos.push({ cubierta: destino.cubierta, ruta: ultima, escalera: null });
  return tramos;
}
