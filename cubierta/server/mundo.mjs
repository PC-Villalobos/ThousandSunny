// El mundo: quien esta donde, quien se mueve y por que.
//
// Regla dura del proyecto, implementada aqui y no solo escrita en el README:
// un personaje sin actor encarnandolo NO SE MUEVE. No hay deambular de ambiente,
// no hay animacion decorativa. Todo desplazamiento de un NPC es la ejecucion de
// un paso de un recado, y todo recado nace de una senal real de un agente.

import {
  construirMapas,
  buscarRutaEntreCubiertas,
  casillaDeSala,
  puertaDeSala,
} from "../shared/mapa.mjs";

export const PASO_PENDIENTE = "pendiente";
export const PASO_EN_RUTA = "en_ruta";
export const PASO_EN_SITIO = "en_sitio";
export const PASO_HECHO = "hecho";
export const PASO_ESPERANDO_LLAVE = "esperando_llave";
export const PASO_DENEGADO = "denegado";

const TICKS_TRABAJANDO = 6; // ticks que un NPC pasa en el sitio antes de dar el paso por hecho

let contador = 0;
function nuevoId(prefijo) {
  contador += 1;
  return `${prefijo}-${Date.now().toString(36)}-${contador}`;
}

export class Mundo {
  constructor({ barco, tripulacion, constituciones }) {
    this.barco = barco;
    this.tripulacion = tripulacion;
    this.constituciones = constituciones;
    this.mapas = construirMapas(barco);
    this.recados = [];
    this.artefactos = [];
    this.posiciones = new Map();
    for (const n of tripulacion.nakamas) {
      this.posiciones.set(n.id, {
        cubierta: n.cubierta,
        tile: n.puesto.slice(),
        ruta: null,
        i: 0,
        rumbo: "sur",
        trabajando: 0,
      });
    }
  }

  nakama(id) {
    return this.tripulacion.nakamas.find((n) => n.id === id) || null;
  }

  constitucionDe(id) {
    const base = this.constituciones.base || {};
    const propia = this.constituciones.nakamas?.[id] || {};
    return {
      ...base,
      ...propia,
      constitucion: { ...(base.constitucion || {}), ...(propia.constitucion || {}) },
      voz: { ...(base.voz || {}), ...(propia.voz || {}) },
      recursos: propia.recursos || [],
    };
  }

  recursoDef(nombre) {
    return this.constituciones.recursos?.[nombre] || null;
  }

  /**
   * Traduce una lista de recursos necesarios en pasos con destino fisico.
   * Aqui se decide, ANTES de mover a nadie, si el personaje puede alcanzar cada
   * recurso o si el paso nace denegado o a la espera de llave.
   */
  planificar(nakamaId, recursos = []) {
    const cons = this.constitucionDe(nakamaId);
    const denegadas = new Set(cons.constitucion?.salas_denegadas || []);
    const conLlave = new Set(cons.constitucion?.requiere_llave_del_capitan || []);
    return recursos.map((recurso) => {
      const def = this.recursoDef(recurso);
      if (!def) {
        return { recurso, sala: null, cubierta: null, estado: PASO_DENEGADO, motivo: `recurso desconocido: ${recurso}` };
      }
      const paso = {
        recurso,
        sala: def.sala,
        cubierta: def.cubierta,
        sellado: Boolean(def.sellado),
        estado: PASO_PENDIENTE,
        motivo: null,
        llave: null,
      };
      if (!cons.recursos.includes(recurso)) {
        paso.estado = PASO_DENEGADO;
        paso.motivo = `la constitucion de ${nakamaId} no incluye ${recurso}`;
      } else if (denegadas.has(def.sala)) {
        paso.estado = PASO_DENEGADO;
        paso.motivo = `sala denegada por constitucion: ${def.sala}`;
      } else if (conLlave.has(recurso)) {
        paso.requiere_llave = true;
      }
      return paso;
    });
  }

  /**
   * Recado vivo equivalente: mismo personaje, mismo objetivo, mismos recursos.
   *
   * Un agente sano late cada pocos segundos repitiendo su tarea. Sin esto, cada
   * latido abriria un recado nuevo y el mismo nakama estaria dando vueltas al
   * barco en bucle por un unico encargo: movimiento sin trabajo detras, que es
   * justo lo que este sistema no puede permitirse mostrar.
   */
  recadoEquivalente({ nakama, objetivo, recursos = [] }) {
    const firma = [...recursos].sort().join("|");
    return this.recados.find((r) => (
      r.nakama === nakama
      && r.estado !== "hecho"
      && r.estado !== "denegado"
      && r.objetivo === objetivo
      && r.pasos.map((p) => p.recurso).sort().join("|") === firma
    )) || null;
  }

  /** El historial no crece sin fin: se conservan los vivos y los 40 ultimos cerrados. */
  podarRecados(limiteCerrados = 40) {
    const vivos = this.recados.filter((r) => r.estado !== "hecho" && r.estado !== "denegado");
    const cerrados = this.recados.filter((r) => r.estado === "hecho" || r.estado === "denegado");
    if (cerrados.length <= limiteCerrados) return;
    this.recados = [...cerrados.slice(-limiteCerrados), ...vivos];
  }

  crearRecado({ nakama, objetivo, recursos = [], actor = null, evidencia = null }) {
    if (!this.nakama(nakama)) throw new Error(`nakama desconocido: ${nakama}`);
    this.podarRecados();
    const recado = {
      id: nuevoId("recado"),
      nakama,
      actor,
      objetivo,
      evidencia,
      pasos: this.planificar(nakama, recursos),
      indice: 0,
      estado: "pendiente",
      motivo: null,
      creado: new Date().toISOString(),
      actualizado: new Date().toISOString(),
    };
    this.recados.push(recado);
    return recado;
  }

  /** Decision del Capitan sobre una puerta sellada. Solo el Capitan llama aqui. */
  resolverLlave(recadoId, decision, nota = null) {
    const recado = this.recados.find((r) => r.id === recadoId);
    if (!recado) return { ok: false, motivo: "recado desconocido" };
    const paso = recado.pasos[recado.indice];
    if (!paso || paso.estado !== PASO_ESPERANDO_LLAVE) {
      return { ok: false, motivo: "ese recado no esta esperando ninguna llave" };
    }
    paso.llave = { decision, nota, ts: new Date().toISOString() };
    if (decision === "conceder") {
      // Concedida la llave, el paso se da por atendido SIN entrar: lo que cruza la
      // puerta es un identificador opaco, jamas contenido. La camara se opera fuera.
      paso.estado = PASO_HECHO;
      paso.motivo = "llave concedida; salida opaca, sin contenido y sin entrar en la camara";
      paso.identificador_opaco = nuevoId("opaco");
      recado.estado = "en_curso";
      recado.indice += 1;
    } else {
      paso.estado = PASO_DENEGADO;
      paso.motivo = "llave denegada por el Capitan";
      recado.estado = "denegado";
      recado.motivo = "el Capitan denego la llave";
    }
    recado.actualizado = new Date().toISOString();
    return { ok: true, recado };
  }

  /** Encarnaciones vivas: personaje -> actor, deducidas de las senales de agentes. */
  encarnaciones(senalesVivas = []) {
    const porNakama = new Map();
    for (const senal of senalesVivas) {
      if (!senal.nakama || !this.nakama(senal.nakama)) continue;
      const previa = porNakama.get(senal.nakama);
      if (!previa || Date.parse(senal.ts) >= Date.parse(previa.ts)) porNakama.set(senal.nakama, senal);
    }
    return [...porNakama.entries()].map(([nakama, senal]) => ({
      nakama,
      actor: senal.actor || "actor sin declarar",
      desde: senal.ts,
      tarea: senal.tarea || null,
      estado: senal.estado || "disponible",
      senal,
    }));
  }

  rumboEntre([ax, ay], [bx, by]) {
    if (bx > ax) return "este";
    if (bx < ax) return "oeste";
    if (by > ay) return "sur";
    return "norte";
  }

  moverHacia(nakamaId, destino) {
    const pos = this.posiciones.get(nakamaId);
    const tramos = buscarRutaEntreCubiertas(
      this.mapas,
      { cubierta: pos.cubierta, tile: pos.tile },
      destino,
    );
    if (!tramos) return false;
    // Se aplana en una sola secuencia; el salto de cubierta ocurre entre tramos.
    pos.ruta = [];
    for (const tramo of tramos) {
      for (const tile of tramo.ruta) pos.ruta.push({ cubierta: tramo.cubierta, tile });
      if (tramo.escalera) {
        const mapa = this.mapas.get(tramo.cubierta);
        const esc = mapa.escaleras.find((e) => e.id === tramo.escalera);
        if (esc) pos.ruta.push({ cubierta: esc.destino_cubierta, tile: esc.destino_tile, salto: true });
      }
    }
    pos.i = 0;
    return true;
  }

  destinoDePaso(nakamaId, paso) {
    const mapa = this.mapas.get(paso.cubierta);
    if (!mapa) return null;
    // A una sala sellada se llega a la PUERTA. Nunca al interior.
    const tile = paso.sellado ? puertaDeSala(mapa, paso.sala) : casillaDeSala(mapa, paso.sala);
    return tile ? { cubierta: paso.cubierta, tile } : null;
  }

  /**
   * Un tick del mundo. `encarnados` es el conjunto de personajes que ahora mismo
   * tienen actor. Los que no estan en ese conjunto quedan inmoviles: es el
   * corazon de la regla "sin senal no hay movimiento".
   */
  tick(encarnados = new Set()) {
    for (const recado of this.recados) {
      if (recado.estado === "hecho" || recado.estado === "denegado") continue;

      if (!encarnados.has(recado.nakama)) {
        recado.estado = "pendiente_encarnacion";
        recado.motivo = `${recado.nakama} no tiene actor encarnandolo: el recado espera, y el personaje no se mueve`;
        continue;
      }

      const paso = recado.pasos[recado.indice];
      if (!paso) {
        this.cerrarRecado(recado);
        continue;
      }
      if (paso.estado === PASO_DENEGADO) {
        recado.estado = "denegado";
        recado.motivo = paso.motivo;
        continue;
      }
      if (paso.estado === PASO_ESPERANDO_LLAVE) {
        recado.estado = "esperando_llave";
        recado.motivo = `${recado.nakama} esta en la puerta de ${paso.sala} esperando la llave del Capitan`;
        continue;
      }

      const pos = this.posiciones.get(recado.nakama);
      if (paso.estado === PASO_PENDIENTE) {
        const destino = this.destinoDePaso(recado.nakama, paso);
        if (!destino) {
          paso.estado = PASO_DENEGADO;
          paso.motivo = `no hay ruta fisica hasta ${paso.sala}`;
          continue;
        }
        if (!this.moverHacia(recado.nakama, destino)) {
          paso.estado = PASO_DENEGADO;
          paso.motivo = `no hay camino desde ${pos.cubierta} hasta ${paso.sala}`;
          continue;
        }
        paso.estado = PASO_EN_RUTA;
        recado.estado = "en_curso";
        recado.motivo = null;
      }

      if (paso.estado === PASO_EN_RUTA) {
        if (this.avanzar(recado.nakama)) {
          if (paso.requiere_llave) {
            paso.estado = PASO_ESPERANDO_LLAVE;
            recado.estado = "esperando_llave";
            recado.motivo = `${recado.nakama} ha llegado a la puerta de ${paso.sala}; el contenido no cruza sin llave del Capitan`;
          } else {
            paso.estado = PASO_EN_SITIO;
            pos.trabajando = TICKS_TRABAJANDO;
          }
        }
        continue;
      }

      if (paso.estado === PASO_EN_SITIO) {
        pos.trabajando -= 1;
        if (pos.trabajando <= 0) {
          paso.estado = PASO_HECHO;
          recado.indice += 1;
          if (recado.indice >= recado.pasos.length) this.cerrarRecado(recado);
        }
      }
    }

    // Quien no tiene recado vivo vuelve a su puesto, y solo si esta encarnado.
    for (const nakama of this.tripulacion.nakamas) {
      if (!encarnados.has(nakama.id)) continue;
      const ocupado = this.recados.some(
        (r) => r.nakama === nakama.id && (r.estado === "en_curso" || r.estado === "esperando_llave"),
      );
      if (ocupado) continue;
      const pos = this.posiciones.get(nakama.id);
      if (pos.ruta) { this.avanzar(nakama.id); continue; }
      const enPuesto = pos.cubierta === nakama.cubierta
        && pos.tile[0] === nakama.puesto[0] && pos.tile[1] === nakama.puesto[1];
      if (!enPuesto) this.moverHacia(nakama.id, { cubierta: nakama.cubierta, tile: nakama.puesto });
    }
  }

  /** Avanza una casilla. Devuelve true si ha llegado al final de la ruta. */
  avanzar(nakamaId) {
    const pos = this.posiciones.get(nakamaId);
    if (!pos.ruta) return true;
    if (pos.i >= pos.ruta.length - 1) {
      pos.ruta = null;
      pos.i = 0;
      return true;
    }
    pos.i += 1;
    const siguiente = pos.ruta[pos.i];
    pos.rumbo = this.rumboEntre(pos.tile, siguiente.tile);
    pos.cubierta = siguiente.cubierta;
    pos.tile = siguiente.tile.slice();
    if (pos.i >= pos.ruta.length - 1) { pos.ruta = null; pos.i = 0; return true; }
    return false;
  }

  cerrarRecado(recado) {
    recado.estado = "hecho";
    recado.motivo = null;
    recado.actualizado = new Date().toISOString();
    const yaRegistrado = this.artefactos.some((a) => a.recado === recado.id);
    if (!yaRegistrado) {
      this.artefactos.unshift({
        id: nuevoId("artefacto"),
        recado: recado.id,
        nakama: recado.nakama,
        actor: recado.actor,
        titulo: recado.objetivo,
        evidencia: recado.evidencia,
        recursos: recado.pasos.map((p) => p.recurso),
        ts: new Date().toISOString(),
        tinta: recado.evidencia ? "medido" : "propuesto",
      });
      this.artefactos = this.artefactos.slice(0, 40);
    }
  }

  estadoNakamas(encarnaciones) {
    const porId = new Map(encarnaciones.map((e) => [e.nakama, e]));
    return this.tripulacion.nakamas.map((n) => {
      const pos = this.posiciones.get(n.id);
      const enc = porId.get(n.id) || null;
      const recado = this.recados.find(
        (r) => r.nakama === n.id && ["en_curso", "esperando_llave", "pendiente_encarnacion"].includes(r.estado),
      ) || null;
      let estado = "apagado";
      if (enc) {
        if (recado?.estado === "esperando_llave") estado = "esperando_llave";
        else if (recado?.estado === "en_curso") estado = pos.ruta ? "en_recado" : "trabajando";
        else if (enc.estado === "bloqueado") estado = "bloqueado";
        else estado = "disponible";
      }
      return {
        id: n.id,
        nombre: n.nombre,
        rol: n.rol,
        acento: n.acento,
        cubierta: pos.cubierta,
        tile: pos.tile,
        rumbo: pos.rumbo,
        en_ruta: Boolean(pos.ruta),
        estado,
        encarnado: Boolean(enc),
        actor: enc?.actor || null,
        tarea: enc?.tarea || null,
        desde: enc?.desde || null,
        recado: recado ? { id: recado.id, objetivo: recado.objetivo, estado: recado.estado, motivo: recado.motivo, paso: recado.pasos[recado.indice] || null } : null,
      };
    });
  }
}
