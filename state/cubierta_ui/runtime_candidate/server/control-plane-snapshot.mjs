const COPY = {
  delivery: {
    pending: ['Pendiente', 'El agente todavía no ha acusado la orden.'],
    claimed: ['Recibida', 'El agente tomó la orden, pero aún no respondió.'],
    responded: ['Respondida', 'El turno terminó. Esto no significa que la orden se ejecutara.'],
    blocked: ['Bloqueada', 'El agente no pudo completar su respuesta.'],
  },
  outcome: {
    assessment_provided: ['Evaluación aportada', 'La respuesta contiene una valoración de la orden.'],
    clarification_required: ['Necesita aclaración', 'La respuesta terminó, pero falta información para decidir.'],
    cannot_assess: ['No puede evaluar', 'El agente declara que no dispone de base suficiente.'],
    unknown: ['Resultado histórico desconocido', 'El agente declaró explícitamente que no conoce el resultado.'],
    not_recorded: ['No registrado', 'El registro no capturó este campo. No se interpreta como desconocimiento declarado.'],
  },
  epistemic: {
    observed: ['Observado', 'Procede de una lectura o hecho registrado con evidencia.'],
    calculated: ['Calculado', 'Se obtuvo mediante una operación reproducible sobre datos.'],
    inferred: ['Inferido', 'El agente razonó con el contexto disponible; no observó directamente el sistema.'],
    evaluated: ['Evaluado', 'Es una valoración, no un hecho observado.'],
    proposed: ['Propuesto', 'Es una propuesta; aún no está autorizada ni ejecutada.'],
    unknown: ['Desconocido', 'El agente declaró explícitamente que no conoce el estatuto.'],
    not_recorded: ['No registrado', 'El registro no capturó este campo. No se asigna un estatuto retrospectivo.'],
  },
  execution: {
    not_requested: ['Sin ejecución solicitada', 'La orden solo pide deliberación.'],
    proposed: ['Ejecución propuesta', 'Existe un contrato tipado, todavía sin GO de ejecución.'],
    authorized: ['Ejecución autorizada', 'Hay GO, pero todavía no consta resultado ejecutado.'],
    executed: ['Ejecutada', 'La acción tipada terminó y dejó resultado durable.'],
    blocked: ['Ejecución bloqueada', 'La acción tipada no pudo completarse.'],
  },
}

function explain(axis, value) {
  const [label, explanation] = COPY[axis]?.[value] || [
    'Estado no reconocido',
    'Fallo cerrado: no debe interpretarse como éxito.',
  ]
  return { value: value || 'unknown', label, explanation, recognized: Boolean(COPY[axis]?.[value]) }
}

export function translateOrder(order) {
  return {
    order_id: order.order_id,
    instruction: order.instruction,
    proposed_at: order.proposed_at,
    contract_version: order.contract_version || null,
    deliberation_status: order.deliberation_status,
    targets: order.targets,
    agents: order.targets.map(target => {
      const delivery = order.deliveries?.[target] || { delivery_status: 'pending' }
      return {
        target,
        delivery: explain('delivery', delivery.delivery_status),
        outcome: explain('outcome', delivery.deliberation_outcome ?? 'not_recorded'),
        epistemic: explain('epistemic', delivery.epistemic_status ?? 'not_recorded'),
        epistemic_scope: delivery.epistemic_scope || 'not_recorded',
        claim_analysis_status: delivery.claim_analysis_status || 'not_recorded',
      }
    }),
    execution: {
      action_type: order.execution?.action_type || null,
      shell: order.execution?.shell === true,
      ...explain('execution', order.execution?.execution_status || 'not_requested'),
    },
  }
}

export function buildControlPlaneSnapshot({
  orders = [],
  guard = {},
  workers = [],
  ingressMode = 'unmonitored',
  now = () => new Date().toISOString(),
} = {}) {
  const localOperational = true
  const ingressStable = ingressMode === 'named_tunnel'
  return {
    schema: 'sunny.control-plane.v1',
    generated_at: now(),
    rumbo: {
      mission_id: 'RUMBO-20260727',
      label: 'Preparar el arnés para una tripulación gobernada',
      status: 'in_progress',
      rule: 'Formar, observar y verificar antes de admitir o ampliar autoridad.',
      fronts: [
        { id: 'technical_helm', label: 'Timón técnico · nombre provisional', owner: 'Codex', status: 'diagnosed', epistemic_status: 'observed', next_gate: 'Resolver la colisión con el Jinbe clínico antes de canonizar el nombre; GO independiente para entrada estable y cola durable.' },
        { id: 'klabautermann', label: 'Klabautermann · ojos y manos de Groot', owner: 'OpenClaw', status: 'audited_not_eligible', epistemic_status: 'evaluated', next_gate: 'Aislar canales y completar entrenamiento antes de conectar.' },
        { id: 'onboarding', label: 'Alta de nuevos motores', owner: 'Tripulación', status: 'proposed_noncanonical', epistemic_status: 'proposed', next_gate: 'Aceptar un contrato de onboarding en un GO separado.' },
        { id: 'claude', label: 'Contraste de navegación', owner: 'Claude Code', status: 'external_session_reported', epistemic_status: 'inferred', next_gate: 'Incorporar su handoff solo con evidencia recibida.' },
      ],
    },
    crew: [
      { actor: 'Claude', provider: 'Anthropic', role: 'Nami · Robin · Vivi', admission: 'admitted', command_target: true },
      { actor: 'Codex', provider: 'OpenAI', role: 'Usopp · construcción', admission: 'admitted', command_target: true },
      { actor: 'OpenClaw', provider: 'motor efectivo no verificado', role: 'Klabautermann · casting candidato', admission: 'not_eligible', command_target: false },
      { actor: 'DeepSeek', provider: 'motor candidato', role: 'Sin puesto asignado', admission: 'not_admitted', command_target: false },
    ],
    jinbe: {
      overall: ingressStable ? 'operational' : 'degraded',
      local_runtime: { status: localOperational ? 'operational' : 'unknown', epistemic_status: 'observed', explanation: 'Esta instantánea fue servida por el propio bridge.' },
      public_ingress: {
        status: ingressStable ? 'operational' : 'unmonitored',
        mode: ingressMode,
        stable_identity: ingressStable,
        epistemic_status: ingressStable ? 'observed' : 'unknown',
        explanation: ingressStable
          ? 'La entrada declara identidad estable.'
          : 'La salud local no demuestra que Telegram pueda alcanzar la entrada pública.',
      },
      durable_intake_queue: { status: 'not_implemented', epistemic_status: 'observed' },
      durable_outbox: { status: 'not_implemented', epistemic_status: 'observed' },
      deliberation_workers: [...workers].sort(),
    },
    guard: {
      open: Number(guard.openCabos || 0),
      claimed: Number(guard.claimedCabos || 0),
      pending_delivery: Number(guard.pendingDelivery || 0),
    },
    captain_stop: {
      authority: 'captain_only',
      runtime_control: 'not_wired',
      epistemic_status: 'observed',
      explanation: 'La autoridad de STOP está declarada, pero este incremento no incorpora un control runtime.',
    },
    orders: orders.slice(-20).reverse().map(translateOrder),
    boundaries: {
      arbitrary_shell: false,
      openclaw_connected: false,
      deepseek_command_target: false,
      onboarding_canonical: false,
      jinbe_name_canonical: false,
      klabautermann_casting_is_identity: false,
    },
  }
}
