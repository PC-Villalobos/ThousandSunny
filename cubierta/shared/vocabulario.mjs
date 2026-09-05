// Vocabularios de dominio del barco, traducidos.
//
// Invariante 2 del contrato pedagogico: **ningun enum crudo llega al lector**.
// Hasta la convergencia, el HUD pintaba `no_observable`, `sin_dato` o
// `discordante` tal cual, como insignias. Eso incumple una parte normativa, no
// estetica: un enum es un identificador para el codigo, no una frase para una
// persona.
//
// Los mapas son cerrados. Un valor no listado se marca no interpretable y no se
// traduce al vecino semantico (ver `traducir` en shared/epistemico.mjs).

import { traducir } from "../../shared/epistemico.mjs";

/** Los nueve veredictos de presencia. */
export const PRESENCIA = Object.freeze({
  en_puerto: {
    titulo: "En puerto",
    detalle: "Ningun actor ha emitido senal por este personaje. No ha embarcado; no ha desertado.",
  },
  a_bordo: {
    titulo: "A bordo",
    detalle: "Latido fresco y al menos un eje observado: lo declarado y lo medido concuerdan.",
  },
  declarado: {
    titulo: "Declarado, sin verificar",
    detalle: "Dice que trabaja y su latido es fresco, pero ningun instrumento lo ha comprobado.",
  },
  mudo: {
    titulo: "Vivo pero callado",
    detalle: "Su proceso sigue existiendo y dejo de reportar. No es lo mismo que estar muerto.",
  },
  discordante: {
    titulo: "Lo dicho no cuadra con lo visto",
    detalle: "Un instrumento alcanzable contradice lo que declara. Lo sentencia el Capitan, no el barco.",
  },
  no_observable: {
    titulo: "Fuera del alcance de los instrumentos",
    detalle: "Ninguna sonda llega hasta el. No es un fantasma: es que no hay con que mirarlo.",
  },
  amarrado: {
    titulo: "Amarrado",
    detalle: "Cerro su tarea antes de callarse. El silencio es limpio.",
  },
  fantasma: {
    titulo: "Fantasma",
    detalle: "Declaro trabajo y dejo de latir. Sigue dibujado en el barco, pero no esta verificado.",
  },
  a_la_deriva: {
    titulo: "A la deriva",
    detalle: "Silencio mas largo que la ventana de observacion, sin cierre declarado.",
  },
});

/** Estado de un eje de medicion. */
export const EJE = Object.freeze({
  observado: {
    titulo: "Medido por el barco",
    detalle: "Una sonda alcanzable lo leyo dentro de la ventana.",
  },
  declarado: {
    titulo: "Solo lo dice el agente",
    detalle: "Consta en la senal del actor y ningun instrumento lo ha comprobado.",
  },
  no_observable: {
    titulo: "Sin instrumento",
    detalle: "Ninguna sonda alcanza este eje: plataforma, permisos o distancia.",
  },
  sin_dato: {
    titulo: "La sonda responde y no ve nada",
    detalle: "El instrumento llega y no hay nada que reportar. No es lo mismo que no poder mirar.",
  },
});

/** Codigos de contradiccion. */
export const CONTRADICCION = Object.freeze({
  D1: { titulo: "Proceso declarado inexistente", detalle: "Dice trabajar con un pid que no existe en esta maquina." },
  D2: { titulo: "Residencia incompatible", detalle: "Declara un modelo de Ollama que no esta residente." },
  D3: { titulo: "Produccion sin corroborar", detalle: "Declara tokens por segundo y ninguna de las tres sondas lo respalda." },
});

export const presentarPresencia = (v) => traducir(v, PRESENCIA, { nombreMapa: "vocabulario de presencia" });
export const presentarEje = (v) => traducir(v, EJE, { nombreMapa: "vocabulario de ejes" });
export const presentarContradiccion = (v) => traducir(v, CONTRADICCION, { nombreMapa: "vocabulario de contradicciones" });
