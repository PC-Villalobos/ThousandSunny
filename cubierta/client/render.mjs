// Dibujo isometrico del barco. Sin librerias ni sprites: geometria y paleta.
// El arte llegara despues; lo que no puede llegar despues es la honestidad del
// dibujo. Aqui hay una sola regla: si un dato no existe, no se pinta un adorno
// en su lugar.

import { VACIO, SUELO, INTERIOR, MURO, PUERTA, SELLADO } from "../shared/mapa.mjs";

export const TW = 64;
export const TH = 32;
export const ALTO_MURO = 26;

const PALETA = {
  fondoArriba: "#0b1520",
  fondoAbajo: "#050a10",
  mar: "#12374f",
  cascoBorde: "#2a1a10",
  tablaA: "#8a5f38",
  tablaB: "#7d5531",
  interiorMezcla: 0.5,
  muroTapa: "#b08355",
  muroIzq: "#6b4626",
  muroDer: "#553618",
  puerta: "#c49a5e",
  selladoTapa: "#241417",
  selladoIzq: "#1a0e10",
  selladoDer: "#12090b",
  escalera: "#caa46a",
  sombra: "rgba(0,0,0,0.35)",
  texto: "#f0e2c4",
};

export function proyectar(x, y) {
  return { sx: (x - y) * (TW / 2), sy: (x + y) * (TH / 2) };
}

function mezclar(hex, hex2, t) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(hex2.slice(1), 16);
  const r = Math.round((((a >> 16) & 255) * (1 - t)) + (((b >> 16) & 255) * t));
  const g = Math.round((((a >> 8) & 255) * (1 - t)) + (((b >> 8) & 255) * t));
  const bl = Math.round(((a & 255) * (1 - t)) + ((b & 255) * t));
  return `rgb(${r},${g},${bl})`;
}

function rombo(ctx, sx, sy, relleno, borde = null) {
  ctx.beginPath();
  ctx.moveTo(sx, sy - TH / 2);
  ctx.lineTo(sx + TW / 2, sy);
  ctx.lineTo(sx, sy + TH / 2);
  ctx.lineTo(sx - TW / 2, sy);
  ctx.closePath();
  ctx.fillStyle = relleno;
  ctx.fill();
  if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = 1; ctx.stroke(); }
}

function bloque(ctx, sx, sy, alto, tapa, izq, der) {
  ctx.beginPath();
  ctx.moveTo(sx - TW / 2, sy);
  ctx.lineTo(sx, sy + TH / 2);
  ctx.lineTo(sx, sy + TH / 2 - alto);
  ctx.lineTo(sx - TW / 2, sy - alto);
  ctx.closePath();
  ctx.fillStyle = izq;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sx + TW / 2, sy);
  ctx.lineTo(sx, sy + TH / 2);
  ctx.lineTo(sx, sy + TH / 2 - alto);
  ctx.lineTo(sx + TW / 2, sy - alto);
  ctx.closePath();
  ctx.fillStyle = der;
  ctx.fill();

  rombo(ctx, sx, sy - alto, tapa);
}

function fondo(ctx, ancho, alto) {
  const g = ctx.createLinearGradient(0, 0, 0, alto);
  g.addColorStop(0, PALETA.fondoArriba);
  g.addColorStop(1, PALETA.fondoAbajo);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ancho, alto);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} escena  { mapa, salas, nakamas, capitan, camara, apagado, resaltado }
 */
export function dibujar(ctx, escena) {
  const { ancho, alto, mapa, nakamas, capitan, camara, apagado, salas } = escena;
  ctx.clearRect(0, 0, ancho, alto);
  fondo(ctx, ancho, alto);

  const ox = ancho / 2 - camara.x;
  const oy = alto / 2 - camara.y;
  const salaPorId = new Map((salas || []).map((s) => [s.id, s]));

  // 1. Suelos
  for (let y = 0; y < mapa.h; y++) {
    for (let x = 0; x < mapa.w; x++) {
      const celda = mapa.celda(x, y);
      if (celda === VACIO) continue;
      const { sx, sy } = proyectar(x, y);
      const px = sx + ox;
      const py = sy + oy;
      if (px < -TW || px > ancho + TW || py < -TH * 4 || py > alto + TH * 4) continue;

      if (celda === MURO || celda === SELLADO) continue;
      const base = (x + y) % 2 === 0 ? PALETA.tablaA : PALETA.tablaB;
      const salaId = mapa.sala(x, y);
      const sala = salaId ? salaPorId.get(salaId) : null;
      const relleno = sala ? mezclar(base, sala.acento || "#000000", 0.28) : base;
      rombo(ctx, px, py, celda === PUERTA ? PALETA.puerta : relleno, "rgba(0,0,0,0.18)");
    }
  }

  // 2. Escaleras marcadas en el suelo
  for (const esc of mapa.escaleras) {
    const { sx, sy } = proyectar(esc.tile[0], esc.tile[1]);
    ctx.save();
    ctx.globalAlpha = 0.85;
    rombo(ctx, sx + ox, sy + oy, PALETA.escalera, "rgba(0,0,0,0.4)");
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(esc.sentido === "abajo" ? "v" : "^", sx + ox, sy + oy + 4);
    ctx.restore();
  }

  // 3. Muros y entidades, ordenados por profundidad
  const cola = [];
  for (let y = 0; y < mapa.h; y++) {
    for (let x = 0; x < mapa.w; x++) {
      const celda = mapa.celda(x, y);
      if (celda !== MURO && celda !== SELLADO) continue;
      cola.push({ prof: x + y, tipo: "muro", x, y, celda });
    }
  }
  for (const n of nakamas) cola.push({ prof: n.px + n.py, tipo: "nakama", n });
  if (capitan) cola.push({ prof: capitan.px + capitan.py, tipo: "capitan", c: capitan });
  cola.sort((a, b) => a.prof - b.prof);

  for (const item of cola) {
    if (item.tipo === "muro") {
      const { sx, sy } = proyectar(item.x, item.y);
      const salaId = mapa.sala(item.x, item.y);
      const sala = salaId ? salaPorId.get(salaId) : null;
      if (item.celda === SELLADO) {
        bloque(ctx, sx + ox, sy + oy, ALTO_MURO + 6, PALETA.selladoTapa, PALETA.selladoIzq, PALETA.selladoDer);
      } else {
        const tapa = sala ? mezclar(PALETA.muroTapa, sala.acento || "#000000", 0.35) : PALETA.muroTapa;
        bloque(ctx, sx + ox, sy + oy, ALTO_MURO, tapa, PALETA.muroIzq, PALETA.muroDer);
      }
      continue;
    }
    if (item.tipo === "nakama") dibujarNakama(ctx, item.n, ox, oy);
    if (item.tipo === "capitan") dibujarCapitan(ctx, item.c, ox, oy);
  }

  // 4. Rotulos de sala
  for (const sala of salas || []) {
    const [rx, ry, rw] = sala.rect;
    const { sx, sy } = proyectar(rx + rw / 2 - 0.5, ry);
    const px = sx + ox;
    const py = sy + oy - ALTO_MURO - 16;
    const etiqueta = sala.sellada ? `${sala.nombre} (sellada)` : sala.nombre;
    ctx.font = "600 13px system-ui, sans-serif";
    const w = ctx.measureText(etiqueta).width + 18;
    ctx.fillStyle = "rgba(8,14,22,0.82)";
    ctx.beginPath();
    ctx.roundRect(px - w / 2, py - 13, w, 22, 6);
    ctx.fill();
    ctx.strokeStyle = sala.sellada ? "#8c4a4a" : (sala.acento || "#000");
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = PALETA.texto;
    ctx.textAlign = "center";
    ctx.fillText(etiqueta, px, py + 3);
  }

  // 5. Barrido de apagado: sin senal, el mundo se ve apagado. No es un efecto
  //    decorativo: es la representacion de que no hay nada que representar.
  if (apagado) {
    ctx.fillStyle = "rgba(4,8,14,0.55)";
    ctx.fillRect(0, 0, ancho, alto);
  }
}

function figura(ctx, px, py, acento, opciones = {}) {
  const { apagado = false, aro = null, sombrero = false, fantasma = false, aroHueco = false } = opciones;
  ctx.save();
  if (fantasma) ctx.globalAlpha = 0.3;
  else if (apagado) ctx.globalAlpha = 0.42;

  // Un fantasma no proyecta sombra: se le ve, no se le verifica.
  if (!fantasma) {
    ctx.fillStyle = PALETA.sombra;
    ctx.beginPath();
    ctx.ellipse(px, py + 2, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (aro) {
    ctx.strokeStyle = aro;
    // Aro hueco = creible, no verificado. La diferencia entre lo que el agente
    // dice y lo que el barco ha comprobado tiene que verse de un vistazo.
    ctx.lineWidth = aroHueco ? 1 : 2;
    if (fantasma) ctx.setLineDash([4, 4]);
    else if (aroHueco) ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.ellipse(px, py + 2, 16, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = acento;
  ctx.beginPath();
  ctx.roundRect(px - 7, py - 22, 14, 20, 4);
  ctx.fill();

  ctx.fillStyle = "#f0d3ac";
  ctx.beginPath();
  ctx.arc(px, py - 27, 7, 0, Math.PI * 2);
  ctx.fill();

  if (sombrero) {
    ctx.fillStyle = "#f4efe2";
    ctx.beginPath();
    ctx.ellipse(px, py - 32, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px - 7, py - 38, 14, 6);
  }
  ctx.restore();
}

const AROS = {
  trabajando: "#8fd36a",
  en_recado: "#f0c34a",
  esperando_llave: "#e0714a",
  bloqueado: "#e0714a",
  disponible: "#6fa8d6",
  apagado: null,
};

// Encargo de pulso real, seccion 7. El veredicto manda sobre el aro.
const AROS_PRESENCIA = {
  declarado: "#6fa8d6",
  no_observable: "#7a8894",
  mudo: "#d6a24a",
  discordante: "#e0714a",
};

const ETIQUETA_PRESENCIA = {
  en_puerto: "sin actor",
  a_bordo: null,
  declarado: "declarado",
  no_observable: "fuera de alcance",
  mudo: "MUDO",
  discordante: "DISCORDANTE",
  amarrado: "amarrado",
  fantasma: "FANTASMA",
  a_la_deriva: "a la deriva",
};

const AVISO = { mudo: "?", discordante: "!=", fantasma: "!", a_la_deriva: "!" };

function dibujarNakama(ctx, n, ox, oy) {
  const { sx, sy } = proyectar(n.px, n.py);
  const px = sx + ox;
  const py = sy + oy;
  const fantasma = n.presencia === "fantasma" || n.presencia === "a_la_deriva";
  const hueco = n.presencia === "declarado" || n.presencia === "no_observable";
  figura(ctx, px, py, n.acento, {
    apagado: !n.encarnado,
    fantasma,
    aroHueco: hueco,
    aro: fantasma ? "#e0a04a" : (AROS_PRESENCIA[n.presencia] || AROS[n.estado] || null),
  });

  ctx.font = "600 12px system-ui, sans-serif";
  const sufijo = ETIQUETA_PRESENCIA[n.presencia] ?? null;
  const etiqueta = sufijo ? `${n.nombre} (${sufijo})` : n.nombre;
  const w = ctx.measureText(etiqueta).width + 12;
  ctx.fillStyle = fantasma ? "rgba(48,28,10,0.85)" : (n.encarnado ? "rgba(8,14,22,0.85)" : "rgba(8,14,22,0.6)");
  ctx.beginPath();
  ctx.roundRect(px - w / 2, py - 56, w, 18, 5);
  ctx.fill();
  if (fantasma) {
    ctx.strokeStyle = "#e0a04a";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = fantasma ? "#f2c483" : (n.encarnado ? PALETA.texto : "rgba(240,226,196,0.55)");
  ctx.textAlign = "center";
  ctx.fillText(etiqueta, px, py - 43);

  const marca = AVISO[n.presencia] || (n.estado === "esperando_llave" || n.desvios?.length ? "!" : null);
  if (marca) {
    ctx.font = "bold 15px system-ui, sans-serif";
    ctx.fillStyle = n.presencia === "discordante" ? "#e0714a" : (n.desvios?.length ? "#e0a04a" : "#f2b34a");
    ctx.fillText(marca, px, py - 62);
  }
}

function dibujarCapitan(ctx, c, ox, oy) {
  const { sx, sy } = proyectar(c.px, c.py);
  figura(ctx, sx + ox, sy + oy, "#3f6fa8", { sombrero: true, aro: "#e8d9a0" });
}
