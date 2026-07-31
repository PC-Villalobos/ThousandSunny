// Capa de presentacion de la Cubierta — modelo puro, sin DOM ni red.
//
// QUE ES ESTO Y QUE NO ES
// Es una implementacion de REFERENCIA reconciliada contra el codigo observado en D:
// y en la VM. No es el artefacto desplegable: define como se adapta y traduce el
// modelo vivo, y lo deja verificado por pruebas.
//
// LA REGLA QUE GOBIERNA TODO EL MODULO
// La traduccion hereda el estatuto del origen y NUNCA lo mejora. Si el registro no
// sabe, la traduccion dice que no sabe y dice por que. Un hueco honesto vale mas que
// un dato reconstruido hacia atras.

export const CONTRATO = "cubierta.presentacion.v1";

// Aviso invariante: `responded` acredita fin de turno, no orden cumplida. Es la
// distincion fundacional del contrato v3 y viaja pegada a cada respuesta.
export const AVISO_TURNO = "El turno termino. Esto no significa que la orden se ejecutara.";

export const SIN_MARCA_TEMPORAL = "Sin marca temporal en el registro.";

export const AVISO_HISTORICO =
  "Orden anterior al contrato v3. El registro de entonces no capturaba estos campos; " +
  "no se reconstruye hacia atras lo que no se observo.";

export const AVISO_AUSENCIA_ESTRUCTURAL =
  "Este campo no fue registrado. La ausencia se conserva y no se interpreta como desconocimiento declarado.";

// Los mapas son cerrados. Un valor no listado NO se deja pasar en crudo: se traduce a
// un aviso explicito de que el vocabulario no lo reconoce. Vease `traducir`.
const ESTADO_ORDEN = {
  deliberated: {
    titulo: "Deliberada",
    detalle: "Los agentes respondieron. La orden no pedia ejecutar, o su ejecucion se trata aparte."
  },
  authorized: {
    titulo: "Deliberacion autorizada",
    detalle: "Hay GO de deliberacion; todavia pueden faltar respuestas de agentes."
  },
  not_authorized: {
    titulo: "Sin autorizacion",
    detalle: "La orden no llego a tener GO. No es un rechazo de los agentes: es que nunca se autorizo."
  },
  pending: {
    titulo: "Abierta",
    detalle: "Emitida y todavia sin cerrar."
  },
  blocked: {
    titulo: "Bloqueada",
    detalle: "Algo impide continuar. El motivo debe constar en la propia orden."
  }
};

const ENTREGA = {
  pending: {
    titulo: "Pendiente",
    detalle: "El agente todavia no ha acusado la orden."
  },
  claimed: {
    titulo: "Recogida",
    detalle: "El agente acuso la orden y todavia no ha terminado su turno."
  },
  responded: {
    titulo: "Respondida",
    detalle: AVISO_TURNO
  },
  blocked: {
    titulo: "Bloqueada",
    detalle: "El turno termino sin marcador estructurado, o algo lo impidio."
  }
};

const DELIBERACION = {
  assessment_provided: {
    titulo: "Evaluacion aportada",
    detalle: "La respuesta contiene una valoracion de la orden."
  },
  clarification_required: {
    titulo: "Necesita aclaracion",
    detalle: "La respuesta termino, pero falta informacion para decidir."
  },
  cannot_assess: {
    titulo: "No evaluable",
    detalle: "El agente declaro que no puede valorar la orden con lo que tiene."
  },
  unknown: {
    titulo: "Resultado historico desconocido",
    detalle: "El agente declaro explicitamente que no conoce el resultado."
  },
  not_recorded: {
    titulo: "No registrado",
    detalle: AVISO_AUSENCIA_ESTRUCTURAL
  }
};

const EPISTEMICO = {
  observed: {
    titulo: "Observado",
    detalle: "El agente miro el sistema directamente y hay al menos dos referencias de evidencia."
  },
  calculated: {
    titulo: "Calculado",
    detalle: "Se obtuvo mediante una operacion reproducible sobre datos."
  },
  inferred: {
    titulo: "Inferido",
    detalle: "El agente razono con el contexto disponible; no observo directamente el sistema."
  },
  evaluated: {
    titulo: "Evaluado",
    detalle: "Es una valoracion, no un hecho observado."
  },
  proposed: {
    titulo: "Propuesto",
    detalle: "Es una propuesta del agente, no una comprobacion."
  },
  unknown: {
    titulo: "Desconocido",
    detalle: "El agente declaro explicitamente que no conoce el estatuto."
  },
  not_recorded: {
    titulo: "No registrado",
    detalle: AVISO_AUSENCIA_ESTRUCTURAL
  }
};

// AJUSTE 1: la ejecucion es atributo de la ORDEN, nunca de un trabajador.
// El DOM vivo ya la coloca al nivel de la orden. La proximidad visual al ultimo
// worker, especialmente en movil, hace ambigua esa separacion.
const EJECUCION = {
  executed: {
    titulo: "Ejecutada",
    detalle: "La accion tipada termino y dejo resultado durable."
  },
  authorized: {
    titulo: "Ejecucion autorizada",
    detalle: "Hay GO de ejecucion. Todavia no consta que haya terminado."
  },
  proposed: {
    titulo: "Ejecucion propuesta",
    detalle: "Existe un contrato tipado, todavia sin GO de ejecucion."
  },
  not_requested: {
    titulo: "Sin ejecucion solicitada",
    detalle: "La orden solo pide deliberacion."
  },
  blocked: {
    titulo: "Ejecucion bloqueada",
    detalle: "La accion tipada no pudo completarse."
  },
  unknown: {
    titulo: "Ejecucion desconocida",
    detalle: "El registro no dice si hubo ejecucion. No se asume que no la hubiera."
  }
};

// Traduce contra un mapa cerrado. Un valor ausente del vocabulario no se filtra en
// crudo a la interfaz ni se silencia: se nombra como no reconocido.
//
// R10 (guardas que no ensenen a mentir): esta funcion no obliga a que todo valor
// futuro encaje en el vocabulario de hoy. Un valor nuevo produce un aviso legible y
// `reconocido:false`, que es una senal, no un fallo que empuje a etiquetar mal.
export function traducir(mapa, valor) {
  const clave = typeof valor === "string" ? valor : "";
  if (Object.prototype.hasOwnProperty.call(mapa, clave)) {
    return { ...mapa[clave], valorCrudo: clave, reconocido: true };
  }
  return {
    titulo: "Estado no reconocido",
    detalle: clave
      ? `El registro trae un valor que este vocabulario no cubre: "${clave}". No se interpreta.`
      : "El registro no trae valor para este campo.",
    valorCrudo: clave,
    reconocido: false
  };
}

// AJUSTE 4: el tiempo no puede faltar en silencio. Sin posicion temporal no hay
// posicion, y "pendiente" significa cosas opuestas segun sea de hace tres minutos o
// de hace cinco dias.
export function formatearMomento(iso) {
  if (!iso) return { texto: SIN_MARCA_TEMPORAL, conocido: false, iso: null };
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return { texto: `Marca temporal ilegible en el registro: "${iso}".`, conocido: false, iso };
  }
  return { texto: fecha.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC"), conocido: true, iso };
}

// AJUSTE 5: una orden anterior al contrato v3 sale llena de "desconocido" porque el
// registro de entonces no capturaba esos campos. Sin decirlo, el lector concluye que
// el sistema esta roto, cuando lo que ve es al sistema negandose a inventar.
export function esHistorica(orden) {
  const version = String(orden?.contractVersion || "").toLowerCase();
  return version === "v1" || version === "v2" || version.endsWith(".v1") || version.endsWith(".v2");
}

// Adaptador explicito desde la salida real de `translateOrder()` al modelo de
// presentacion de referencia. No rellena campos que el snapshot vivo no transporta.
export function adaptarOrdenViva(orden) {
  return {
    orderId: orden?.order_id,
    text: orden?.instruction,
    orderState: orden?.deliberation_status,
    createdAt: orden?.proposed_at,
    contractVersion: orden?.contract_version || null,
    execution: {
      status: orden?.execution?.value || orden?.execution?.execution_status || "not_requested",
      actor: orden?.execution?.actor || null,
      executedAt: orden?.execution?.executed_at || null
    },
    workers: Array.isArray(orden?.agents)
      ? orden.agents.map((agent) => ({
          actor: agent?.target,
          deliveryStatus: agent?.delivery?.value,
          deliberationOutcome: agent?.outcome?.value,
          epistemicStatus: agent?.epistemic?.value
        }))
      : []
  };
}

function renderWorker(worker, historica) {
  const entrega = traducir(ENTREGA, worker?.deliveryStatus);
  const resultado = traducir(DELIBERACION, worker?.deliberationOutcome);
  const evidencia = traducir(EPISTEMICO, worker?.epistemicStatus);

  return {
    actor: worker?.actor || "actor no identificado",
    entrega,
    resultado,
    evidencia,
    // AJUSTE 6: el aviso viaja con toda respuesta, sin excepcion y sin acortar.
    avisoTurno: entrega.valorCrudo === "responded" ? AVISO_TURNO : null,
    avisoAusenciaEstructural:
      resultado.valorCrudo === "not_recorded" || evidencia.valorCrudo === "not_recorded"
        ? AVISO_AUSENCIA_ESTRUCTURAL
        : null,
    avisoHistorico: historica && resultado.valorCrudo === "not_recorded"
      ? AVISO_HISTORICO
      : null
  };
}

/**
 * Construye el modelo de presentacion de una orden.
 *
 * El resultado no contiene ningun enum en crudo destinado al lector: todo campo
 * visible pasa por un vocabulario cerrado. Los valores crudos se conservan en
 * `valorCrudo` para diagnostico, no para pintarlos.
 */
export function renderOrden(orden) {
  const historica = esHistorica(orden);

  return {
    contrato: CONTRATO,
    // AJUSTE 3: el titular es lo que se pidio. El identificador es clave de busqueda,
    // no titulo: un lector que escanea necesita la orden, no su numero.
    titular: orden?.text || "Orden sin texto en el registro.",
    referencia: orden?.orderId || "sin identificador",
    estado: traducir(ESTADO_ORDEN, orden?.orderState),
    momento: formatearMomento(orden?.createdAt),
    historica,
    avisoHistorico: historica ? AVISO_HISTORICO : null,
    // AJUSTE 1: al nivel de la orden. Ningun worker lleva ejecucion.
    ejecucion: {
      ...traducir(EJECUCION, orden?.execution?.status),
      actor: orden?.execution?.actor || null,
      momento: formatearMomento(orden?.execution?.executedAt)
    },
    agentes: Array.isArray(orden?.workers)
      ? orden.workers.map((worker) => renderWorker(worker, historica))
      : []
  };
}

export function renderOrdenes(ordenes) {
  return Array.isArray(ordenes) ? ordenes.map(renderOrden) : [];
}

export function renderOrdenViva(orden) {
  return renderOrden(adaptarOrdenViva(orden));
}

// Las tres palabras con las que el Capitan mide la superficie: respondido, ejecutado,
// pendiente. Esta funcion las responde por separado y explicita, para que la prueba
// humana tenga contra que contrastarse.
export function posicion(modelo) {
  const respondidos = modelo.agentes.filter((a) => a.entrega.valorCrudo === "responded").length;
  const pendientes = modelo.agentes.filter((a) => a.entrega.valorCrudo === "pending").length;
  return {
    respondido: `${respondidos} de ${modelo.agentes.length} agentes terminaron su turno.`,
    ejecutado: modelo.ejecucion.titulo,
    pendiente: pendientes > 0
      ? `${pendientes} agentes sin acusar la orden.`
      : "Ningun agente queda sin acusar."
  };
}
