// Pantalla del estado del barco. Solo pinta lo que devuelve /api/estado: no
// calcula estados ni rellena huecos. Todo se construye con nodos y textContent,
// nunca con innerHTML: el registro y los documentos son texto, no marcado.

const $ = (id) => document.getElementById(id);

async function leerJSON(url, opciones = {}) {
  const inicio = performance.now();
  let estado = "sin respuesta";
  try {
    const respuesta = await fetch(url, opciones);
    estado = String(respuesta.status);
    if (!respuesta.ok) throw new Error(`El servicio respondió ${respuesta.status}`);
    return await respuesta.json();
  } finally {
    const lista = $("peticiones");
    const destino = new URL(url, location.href);
    lista.prepend(nodo("li", { texto: `${new Date().toLocaleTimeString()} · GET ${destino.pathname} · ${estado} · ${Math.round(performance.now() - inicio)} ms` }));
    while (lista.children.length > 20) lista.lastElementChild.remove();
  }
}

function abrirDetalle(f) {
  $("titulo-detalle").textContent = f.que;
  const contenido = $("detalle-cuerpo");
  contenido.replaceChildren(pintarFila(f, false));
  if (f.espera) {
    contenido.append(nodo("section", { class: "espera" },
      nodo("strong", { texto: "Espera tu decisión" }),
      nodo("p", { texto: f.espera.pregunta }),
      Array.isArray(f.espera.alternativas) && f.espera.alternativas.length
        ? nodo("ul", {}, ...f.espera.alternativas.map((a) => nodo("li", {},
          nodo("strong", { texto: `${a.opcion}: ` }), document.createTextNode(a.consecuencia))))
        : null,
      nodo("p", { texto: "Consultar este detalle no registra ninguna decisión." })));
  }
  $("detalle").showModal();
}

function nodo(etiqueta, atributos = {}, ...hijos) {
  const el = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(atributos)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "texto") el.textContent = v;
    else el.setAttribute(k, v);
  }
  for (const h of hijos) if (h) el.append(h);
  return el;
}

function edad(f) {
  if (!f.fecha) return "sin fecha";
  if (f.edad_dias === 0) return `${f.fecha} · hoy`;
  if (f.edad_dias === 1) return `${f.fecha} · ayer`;
  return `${f.fecha} · hace ${f.edad_dias} dias`;
}

function marcaPrueba(ev) {
  if (ev.comprobada === true) return ["si", "comprobada"];
  if (ev.comprobada === false) return ["no", "no aparece"];
  return ["nada", "no comprobable aqui"];
}

function nombrePrueba(ev) {
  if (ev.tipo === "pr") return `PR #${ev.ref}`;
  if (ev.tipo === "commit") return `commit ${ev.ref}`;
  if (ev.tipo === "ultimo") return ev.dir;
  return ev.ref;
}

function pintarEsperas(estado) {
  const caja = $("esperas");
  caja.replaceChildren();
  if (!estado.esperas.length) {
    caja.append(nodo("p", { class: "vacio", texto: "Nada espera de ti ahora mismo." }));
    return;
  }
  for (const f of estado.esperas) {
    const e = f.espera;
    const tarjeta = nodo("article", { class: "espera" },
      nodo("span", { class: "tipo", texto: e.tipo === "decision" ? "Decision" : "Observacion tuya" }),
      nodo("span", { class: "que", texto: f.que }),
      nodo("span", { texto: e.pregunta }),
    );
    if (Array.isArray(e.alternativas) && e.alternativas.length) {
      const lista = nodo("ul");
      for (const a of e.alternativas) {
        lista.append(nodo("li", {}, nodo("strong", { texto: `${a.opcion}: ` }), document.createTextNode(a.consecuencia)));
      }
      tarjeta.append(lista);
    }
    tarjeta.append(nodo("span", { class: "edad", texto: `${f.etiqueta} · ${edad(f)}` }));
    const abrir = nodo("button", { type: "button", class: "primario", texto: "Revisar frente →" });
    abrir.addEventListener("click", () => abrirDetalle(f));
    tarjeta.append(abrir);
    caja.append(tarjeta);
  }
}

function pintarFila(f, conBoton = true) {
  const pruebas = nodo("ul", { class: "pruebas" });
  if (!f.evidencias.length) pruebas.append(nodo("li", { class: "nada", texto: "sin pruebas citadas" }));
  for (const ev of f.evidencias) {
    const [clase, texto] = marcaPrueba(ev);
    const nombre = ev.enlace
      ? nodo("a", { href: ev.enlace, target: "_blank", rel: "noopener", texto: nombrePrueba(ev) })
      : nodo("span", { texto: nombrePrueba(ev) });
    pruebas.append(nodo("li", {},
      nodo("span", { class: `marca ${clase}`, texto }),
      nombre,
      nodo("span", { class: "nada", texto: ` — ${ev.motivo}` }),
    ));
  }
  const centro = nodo("div", { class: "centro" },
    nodo("span", { class: "que", texto: f.que }),
    f.detalle ? nodo("span", { class: "det", texto: f.detalle }) : null,
    f.entorno ? nodo("span", { class: "det entorno", texto: `Donde: ${f.entorno}` }) : null,
    pruebas,
  );
  if (f.respaldo === "roto") {
    centro.append(nodo("span", { class: "no", texto: "Una prueba citada no aparece: esta afirmacion no esta respaldada hoy." }));
  }
  if (f.siguiente) {
    centro.append(nodo("span", { class: "sig" },
      nodo("strong", { texto: `Siguiente (${f.siguiente.quien_etiqueta}): ` }),
      document.createTextNode(f.siguiente.que)));
  }
  if (conBoton) {
    const abrir = nodo("button", { type: "button", class: "abrir", texto: "Abrir detalle →", "aria-label": `Abrir detalle de ${f.que}` });
    abrir.addEventListener("click", () => abrirDetalle(f));
    centro.append(abrir);
  }
  return nodo("div", { class: "fila" },
    nodo("div", { class: "izq" },
      nodo("span", { class: `chapa e-${f.estado}`, title: f.nivel, texto: f.etiqueta }),
      nodo("span", { class: "edad", texto: edad(f) }),
      f.espera ? nodo("span", { class: "edad", texto: "espera algo tuyo" }) : null,
    ),
    centro,
  );
}

let filtro = "todos";
function pintarFilas(estado) {
  const filtros = $("filtros");
  filtros.replaceChildren();
  const claves = ["todos", ...Object.keys(estado.estados)];
  for (const k of claves) {
    const n = k === "todos" ? estado.filas.length : estado.filas.filter((f) => f.estado === k).length;
    if (k !== "todos" && !n) continue;
    const etiqueta = k === "todos" ? "Todo" : estado.estados[k].etiqueta;
    const b = nodo("button", { type: "button", "aria-pressed": String(filtro === k), texto: `${etiqueta} · ${n}` });
    b.addEventListener("click", () => { filtro = k; pintarFilas(estado); });
    filtros.append(b);
  }
  const filas = $("filas");
  const visibles = estado.filas.filter((f) => filtro === "todos" || f.estado === filtro);
  $("contador").textContent = `${visibles.length} de ${estado.filas.length} frentes · estado técnico y decisiones, por separado.`;
  filas.replaceChildren(...visibles.map((f) => pintarFila(f)));
}

let numeroBusqueda = 0;
async function buscar(consulta) {
  const numero = ++numeroBusqueda;
  const caja = $("resultados");
  caja.replaceChildren(nodo("p", { class: "vacio", texto: "Buscando..." }));
  let r;
  try { r = await leerJSON(`/api/estado/buscar?q=${encodeURIComponent(consulta)}`); }
  catch (err) {
    if (numero === numeroBusqueda) caja.replaceChildren(nodo("p", { class: "no", texto: `La búsqueda falló: ${err.message}` }));
    return;
  }
  if (numero !== numeroBusqueda) return;
  caja.replaceChildren();
  if (!r.palabras.length) {
    caja.append(nodo("p", { class: "vacio", texto: "Escribe al menos una palabra con contenido." }));
    return;
  }
  if (!r.resultados.length) {
    caja.append(nodo("p", { texto: "No aparece en las fuentes consultadas." }));
  }
  for (const x of r.resultados) {
    const fuente = x.tipo === "documento" ? `${x.fuente}, linea ${x.linea}` : x.fuente;
    caja.append(nodo("div", { class: "resultado" },
      nodo("span", {},
        nodo("span", { class: `chapa e-${x.tipo === "documento" ? "documento" : x.estado}`, texto: x.etiqueta }),
        document.createTextNode(" "),
        nodo("strong", { texto: x.que || fuente }),
      ),
      nodo("span", { class: "det", texto: x.nivel + (x.fecha ? ` · ${x.fecha}` : "") }),
      x.trozo ? nodo("span", { class: "det", texto: x.trozo }) : null,
      x.tipo === "documento" ? null : nodo("span", { class: "edad", texto: x.respaldo === "roto" ? "una prueba citada no aparece" : `respaldo: ${x.respaldo}` }),
    ));
  }
  if (r.total > r.resultados.length) caja.append(nodo("p", { class: "vacio", texto: `y ${r.total - r.resultados.length} mas.` }));
  caja.append(nodo("p", { class: "fuentes", texto: `Consultado: ${r.consultadas.map((c) => c.fuente + (c.leida ? "" : " (no se pudo leer)")).join(", ")}. ${r.nota}` }));
}

async function cargar() {
  $("actualizar").disabled = true;
  try {
    const estado = await leerJSON("/api/estado");
    $("aviso").classList.remove("malo");
    $("lectura").textContent = `leido ${estado.leido.slice(0, 16).replace("T", " ")} UTC · arbol ${estado.arbol || "sin git"}`;
    $("aviso").textContent = estado.aviso;
    $("problemas").hidden = true;
    if (estado.problemas.length) {
      const p = $("problemas");
      p.hidden = false;
      p.textContent = `El registro tiene entradas que no se pueden mostrar: ${estado.problemas.join("; ")}`;
    }
    pintarEsperas(estado);
    pintarFilas(estado);
  } catch (err) {
    $("aviso").textContent = `No se pudo leer el estado: ${err.message}`;
    $("aviso").classList.add("malo");
  } finally {
    $("actualizar").disabled = false;
  }
}

$("buscador").addEventListener("submit", (ev) => {
  ev.preventDefault();
  buscar($("q").value).catch((err) => {
    $("resultados").replaceChildren(nodo("p", { class: "no", texto: `La busqueda fallo: ${err.message}` }));
  });
});

cargar();
$("actualizar").addEventListener("click", cargar);
$("cerrar-detalle").addEventListener("click", () => $("detalle").close());
