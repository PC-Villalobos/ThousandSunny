// Cliente de la Cubierta: mueve al Capitan, interpola a la tripulacion y pinta
// el HUD. No calcula estado: todo lo que muestra viene del snapshot del servidor.
// Si el snapshot dice "desconocido", aqui se escribe "desconocido".

import { construirMapas } from "../shared/mapa.mjs";
import { dibujar, TW, TH } from "./render.mjs";

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");

const $ = (id) => document.getElementById(id);
const MS_PASO = 170;

let barco = null;
let mapas = null;
let snapshot = null;
let dialogoAbierto = null;

const capitan = { cubierta: null, tile: [0, 0], px: 0, py: 0, desde: null, t: 1 };
const interp = new Map();
const camara = { x: 0, y: 0 };
const teclas = new Set();

// --- carga -------------------------------------------------------------------
const mundo = await (await fetch("/api/barco")).json();
barco = mundo.barco;
mapas = construirMapas(barco);
capitan.cubierta = mundo.tripulacion.capitan.cubierta;
capitan.tile = mundo.tripulacion.capitan.tile.slice();
capitan.px = capitan.tile[0];
capitan.py = capitan.tile[1];
const { sx, sy } = proyectarSimple(capitan.px, capitan.py);
camara.x = sx;
camara.y = sy;

function proyectarSimple(x, y) {
  return { sx: (x - y) * (TW / 2), sy: (x + y) * (TH / 2) };
}

function cubiertaDef(id) {
  return barco.cubiertas.find((c) => c.id === id);
}

// --- flujo de datos ----------------------------------------------------------
const flujo = new EventSource("/stream");
flujo.onmessage = (ev) => {
  snapshot = JSON.parse(ev.data);
  sincronizarNakamas();
  pintarHud();
  if (dialogoAbierto) pintarDialogo(dialogoAbierto);
};

function sincronizarNakamas() {
  for (const n of snapshot.nakamas) {
    const previo = interp.get(n.id);
    if (!previo) {
      interp.set(n.id, { px: n.tile[0], py: n.tile[1], desde: null, t: 1, cubierta: n.cubierta });
      continue;
    }
    if (previo.cubierta !== n.cubierta) {
      // Cambio de cubierta: no se interpola un salto por la escalera.
      interp.set(n.id, { px: n.tile[0], py: n.tile[1], desde: null, t: 1, cubierta: n.cubierta });
      continue;
    }
    if (previo.px !== n.tile[0] || previo.py !== n.tile[1]) {
      if (previo.t >= 1) {
        previo.desde = [previo.px, previo.py];
        previo.hacia = [n.tile[0], n.tile[1]];
        previo.t = 0;
      } else {
        previo.hacia = [n.tile[0], n.tile[1]];
      }
    }
  }
}

// --- entrada -----------------------------------------------------------------
const DIRECCIONES = {
  arrowup: [0, -1], w: [0, -1],
  arrowdown: [0, 1], s: [0, 1],
  arrowleft: [-1, 0], a: [-1, 0],
  arrowright: [1, 0], d: [1, 0],
};

addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (document.activeElement === $("d-texto")) {
    if (k === "escape") { $("d-texto").blur(); cerrarDialogo(); }
    return;
  }
  if (DIRECCIONES[k]) { teclas.add(k); e.preventDefault(); }
  if (k === "e") { e.preventDefault(); interactuar(); }
  if (k === "escape") cerrarDialogo();
});
addEventListener("keyup", (e) => teclas.delete(e.key.toLowerCase()));

function intentarPaso() {
  if (capitan.t < 1) return;
  for (const k of teclas) {
    const dir = DIRECCIONES[k];
    if (!dir) continue;
    const nx = capitan.tile[0] + dir[0];
    const ny = capitan.tile[1] + dir[1];
    const mapa = mapas.get(capitan.cubierta);
    if (!mapa.transitable(nx, ny)) continue;
    capitan.desde = [capitan.tile[0], capitan.tile[1]];
    capitan.tile = [nx, ny];
    capitan.t = 0;
    return;
  }
}

function escaleraBajoElCapitan() {
  const mapa = mapas.get(capitan.cubierta);
  return mapa.escaleras.find((e) => e.tile[0] === capitan.tile[0] && e.tile[1] === capitan.tile[1]) || null;
}

function nakamaCerca() {
  if (!snapshot) return null;
  return snapshot.nakamas
    .filter((n) => n.cubierta === capitan.cubierta)
    .map((n) => ({ n, d: Math.abs(n.tile[0] - capitan.tile[0]) + Math.abs(n.tile[1] - capitan.tile[1]) }))
    .filter((x) => x.d <= 2)
    .sort((a, b) => a.d - b.d)[0]?.n || null;
}

function interactuar() {
  const escalera = escaleraBajoElCapitan();
  if (escalera) {
    capitan.cubierta = escalera.destino_cubierta;
    capitan.tile = escalera.destino_tile.slice();
    capitan.px = capitan.tile[0];
    capitan.py = capitan.tile[1];
    capitan.t = 1;
    cerrarDialogo();
    return;
  }
  const cerca = nakamaCerca();
  if (cerca) abrirDialogo(cerca.id);
}

// --- bucle -------------------------------------------------------------------
function ajustarLienzo() {
  const r = devicePixelRatio || 1;
  lienzo.width = innerWidth * r;
  lienzo.height = innerHeight * r;
  lienzo.style.width = `${innerWidth}px`;
  lienzo.style.height = `${innerHeight}px`;
  ctx.setTransform(r, 0, 0, r, 0, 0);
}
addEventListener("resize", ajustarLienzo);
ajustarLienzo();

let ultimo = performance.now();
function bucle(ahora) {
  const dt = ahora - ultimo;
  ultimo = ahora;

  intentarPaso();
  if (capitan.t < 1) {
    capitan.t = Math.min(1, capitan.t + dt / MS_PASO);
    capitan.px = capitan.desde[0] + (capitan.tile[0] - capitan.desde[0]) * capitan.t;
    capitan.py = capitan.desde[1] + (capitan.tile[1] - capitan.desde[1]) * capitan.t;
  } else {
    capitan.px = capitan.tile[0];
    capitan.py = capitan.tile[1];
  }

  for (const est of interp.values()) {
    if (est.t < 1 && est.desde && est.hacia) {
      est.t = Math.min(1, est.t + dt / 260);
      est.px = est.desde[0] + (est.hacia[0] - est.desde[0]) * est.t;
      est.py = est.desde[1] + (est.hacia[1] - est.desde[1]) * est.t;
      if (est.t >= 1) { est.px = est.hacia[0]; est.py = est.hacia[1]; est.desde = null; }
    }
  }

  const objetivo = proyectarSimple(capitan.px, capitan.py);
  camara.x += (objetivo.sx - camara.x) * Math.min(1, dt / 140);
  camara.y += (objetivo.sy - camara.y) * Math.min(1, dt / 140);

  const cubierta = cubiertaDef(capitan.cubierta);
  const nakamasAqui = (snapshot?.nakamas || [])
    .filter((n) => n.cubierta === capitan.cubierta)
    .map((n) => {
      const est = interp.get(n.id);
      return { ...n, px: est?.px ?? n.tile[0], py: est?.py ?? n.tile[1] };
    });

  const nadieEncarnado = snapshot ? snapshot.encarnados.length === 0 : true;

  dibujar(ctx, {
    ancho: innerWidth,
    alto: innerHeight,
    mapa: mapas.get(capitan.cubierta),
    salas: cubierta.salas || [],
    nakamas: nakamasAqui,
    capitan: { px: capitan.px, py: capitan.py },
    camara,
    apagado: nadieEncarnado,
  });

  pintarPista();
  requestAnimationFrame(bucle);
}
requestAnimationFrame(bucle);

function pintarPista() {
  const escalera = escaleraBajoElCapitan();
  const cerca = nakamaCerca();
  const pista = $("pista");
  if (escalera) pista.textContent = `Estas en la escalera. E para ${escalera.sentido === "abajo" ? "bajar" : "subir"}.`;
  else if (cerca) pista.textContent = `E para hablar con ${cerca.nombre}.`;
  else pista.textContent = "";

  const apagado = $("apagado");
  if (snapshot && snapshot.encarnados.length === 0) {
    apagado.style.display = "block";
    $("apagado-motivo").textContent = snapshot.modo === "replay"
      ? "El guion de replay aun no ha soltado ninguna senal."
      : "Ningun actor esta encarnando a ningun personaje ahora mismo. Los nakamas siguen en el mapa, pero no se mueven: no hay nada que representar.";
  } else {
    apagado.style.display = "none";
  }
}

// --- HUD ---------------------------------------------------------------------
function edad(ms) {
  if (ms === null || ms === undefined) return "sin dato";
  const s = Math.round(ms / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.round(m / 60)} h`;
}

/**
 * Escapa antes de meter nada en innerHTML.
 *
 * No es paranoia de manual: buena parte de este HUD son cadenas que llegan de
 * fuera. `tarea`, `actor` y `recursos` los escribe quien haga POST /api/senal
 * —una rutina en la nube, un VPS, Codex—, y de ahi salen el objetivo de un
 * recado, el titulo de un artefacto y el motivo de un desvio. Sin escapar, un
 * agente con un fallo (o comprometido) ejecuta script en el navegador del
 * Capitan. El barco acepta senales de fuera: tiene que tratarlas como tales.
 */
function esc(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pintarHud() {
  const cubierta = cubiertaDef(capitan.cubierta);
  $("cubierta-actual").textContent = `${cubierta.nombre} — ${cubierta.descripcion}`;

  $("aviso-replay").innerHTML = snapshot.aviso_replay
    ? `<div class="aviso-replay">${esc(snapshot.aviso_replay)}</div>` : "";

  const c = snapshot.clima;
  $("clima").innerHTML = `
    <div class="estado">${esc(c.resumen.estado)}</div>
    <div class="motivo">${esc(c.resumen.motivo)}</div>
    ${Object.entries(c.ejes).map(([nombre, eje]) => `
      <div class="eje">
        <span>${esc(nombre)}<span class="base">${esc(eje.base)}</span></span>
        <span class="valor">${eje.valor === null ? "—" : esc(`${eje.valor}${eje.unidad === "%" ? "%" : ` ${eje.unidad}`}`)}
          <span class="tinta ${esc(eje.tinta)}">${esc(eje.tinta)}</span></span>
      </div>`).join("")}`;

  $("fuentes").innerHTML = snapshot.fuentes.map((f) => `
    <div class="fila">
      <span class="punto ${esc(f.estado)}"></span>
      <span style="flex:1"><b>${esc(f.id)}</b>${f.motivo ? `<span class="motivo"><br>${esc(f.motivo)}</span>` : ""}</span>
    </div>`).join("") || '<div class="silencio">sin fuentes</div>';

  const campana = snapshot.vigia?.campana || [];
  $("vigia").innerHTML = campana.length
    ? campana.map((a) => `
      <div class="campana">
        <b>${esc(a.nombre)}</b> — ${esc(a.clase)}<br>
        <span class="motivo">${esc(a.motivo)}</span>
        <div class="acciones">
          <button class="primario" data-veredicto="fertil" data-nakama="${esc(a.nakama)}" data-clase="${esc(a.clase)}">JoyBoy: fertil</button>
          <button class="peligro" data-veredicto="decae" data-nakama="${esc(a.nakama)}" data-clase="${esc(a.clase)}">Buggy: decae</button>
        </div>
      </div>`).join("")
    : '<div class="silencio">nadie fuera de contacto ni fuera de guion</div>';

  const recados = snapshot.recados.filter((r) => r.estado !== "hecho");
  $("recados").innerHTML = recados.length
    ? recados.map((r) => `
      <div class="fila">
        <span style="flex:1"><b>${esc(r.nakama)}</b> — ${esc(r.objetivo)}
          <span class="motivo"><br>${esc(r.estado)}${r.motivo ? `: ${esc(r.motivo)}` : ""}</span></span>
      </div>`).join("")
    : '<div class="silencio">ningun recado en curso</div>';

  $("artefactos").innerHTML = snapshot.artefactos.length
    ? snapshot.artefactos.map((a) => `
      <div class="fila">
        <span style="flex:1"><b>${esc(a.titulo)}</b>
          <span class="motivo"><br>${esc(a.nakama)} · ${esc(new Date(a.ts).toLocaleTimeString())}</span></span>
        <span class="tinta ${esc(a.tinta)}">${esc(a.tinta)}</span>
      </div>`).join("")
    : '<div class="silencio">todavia no ha vuelto nadie con nada</div>';
}

document.addEventListener("click", async (ev) => {
  const b = ev.target.closest("[data-veredicto]");
  if (b) {
    await fetch("/api/veredicto", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nakama: b.dataset.nakama, clase: b.dataset.clase, veredicto: b.dataset.veredicto }),
    });
    return;
  }
  const llave = ev.target.closest("[data-llave]");
  if (llave) {
    await fetch("/api/llave", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recado: llave.dataset.recado, decision: llave.dataset.llave }),
    });
  }
});

// --- dialogo -----------------------------------------------------------------
function abrirDialogo(id) {
  dialogoAbierto = id;
  $("dialogo").style.display = "block";
  $("d-cuerpo").textContent = "";
  pintarDialogo(id);
  $("d-texto").focus();
}

function cerrarDialogo() {
  dialogoAbierto = null;
  $("dialogo").style.display = "none";
}
$("d-cerrar").addEventListener("click", cerrarDialogo);

function pintarDialogo(id) {
  const n = snapshot?.nakamas.find((x) => x.id === id);
  if (!n) return;
  $("d-disco").style.background = n.acento;
  $("d-quien").textContent = n.nombre;
  const presencia = n.presencia === "a_bordo" ? "a bordo" : n.presencia.replace(/_/g, " ");
  $("d-rol").textContent = `${n.rol} · ${presencia}`
    + (n.actor ? ` · encarnado por ${n.actor}` : " · sin actor")
    + (n.latido ? ` · latido ${edad(n.latido_edad_ms)}` : "");

  // Dos etiquetas por vital: la tinta dice COMO se derivo el numero; el origen
  // dice QUIEN responde de el. Un "medido" del barco no vale lo mismo que un
  // "medido" que el actor afirma de si mismo.
  $("d-vitales").innerHTML = n.vitales.map((v) => `
    <span class="vital ${v.valor === null ? "sin" : ""}" title="${esc(v.motivo || v.fuente)}">
      ${esc(v.nombre)}: <span class="v">${v.valor === null ? "—" : esc(`${v.valor} ${v.unidad}`)}</span>
      <span class="tinta ${esc(v.origen || v.tinta)}">${esc(v.origen || v.tinta)}</span>
    </span>`).join("");

  const partes = [];
  if (n.presencia_motivo) partes.push(`[vigia] ${n.presencia_motivo}`);
  for (const c of n.contradicciones || []) {
    partes.push(`[${c.codigo}] declara "${c.declarado}" y se observa que ${c.observado} — veredicto ${c.veredicto}`);
  }
  for (const d of n.desvios || []) partes.push(`[desvio] ${d.detalle} — veredicto ${d.veredicto}`);
  if (n.recado) partes.push(`[recado] ${n.recado.objetivo} — ${n.recado.estado}${n.recado.motivo ? `: ${n.recado.motivo}` : ""}`);
  if (partes.length) {
    const previo = $("d-cuerpo").dataset.dicho || "";
    $("d-cuerpo").textContent = `${partes.join("\n")}${previo ? `\n\n${previo}` : ""}`;
  }

  $("d-llave").innerHTML = n.recado?.estado === "esperando_llave"
    ? `<div class="campana">
         ${esc(n.nombre)} esta en la puerta de la camara sellada. Nada cruza sin tu llave, y lo que cruce sera un identificador opaco, nunca contenido.
         <div class="acciones">
           <button class="primario" data-llave="conceder" data-recado="${esc(n.recado.id)}">Conceder llave</button>
           <button class="peligro" data-llave="denegar" data-recado="${esc(n.recado.id)}">Denegar</button>
         </div>
       </div>`
    : "";
}

$("d-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const texto = $("d-texto").value.trim();
  if (!texto || !dialogoAbierto) return;
  $("d-texto").value = "";
  const cuerpo = $("d-cuerpo");
  cuerpo.dataset.dicho = `Capitan: ${texto}\n\n(esperando respuesta...)`;
  cuerpo.textContent = cuerpo.dataset.dicho;

  const res = await fetch("/api/hablar", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nakama: dialogoAbierto, texto }),
  }).then((r) => r.json());

  const nombre = snapshot.nakamas.find((n) => n.id === dialogoAbierto)?.nombre || dialogoAbierto;
  cuerpo.dataset.dicho = res.encarnado
    ? `Capitan: ${texto}\n\n${nombre}: ${res.texto}${res.recado ? `\n\n[sale a por: ${res.recado.pasos.map((p) => p.recurso).join(", ")}]` : ""}`
    : `Capitan: ${texto}\n\n${nombre} no puede responder: ${res.motivo}`;
  cuerpo.textContent = cuerpo.dataset.dicho;
});
