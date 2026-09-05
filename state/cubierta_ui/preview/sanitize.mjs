const PUBLIC_TARGETS = new Set(['claude', 'codex'])

const safeAxis = axis => ({
  value: axis?.value || 'not_recorded',
  label: axis?.label || 'No registrado',
  explanation: axis?.explanation || 'El registro no capturó este campo.',
  recognized: axis?.recognized === true,
})

const instructionLabel = index => `Instrucción omitida · orden ${index + 1}`

export function sanitizeControl(control = {}) {
  const orders = Array.isArray(control.orders) ? control.orders : []
  return {
    schema: 'sunny.control-plane.preview.v1',
    generated_at: control.generated_at || null,
    rumbo: {
      label: 'Vista previa local de la Cubierta',
      rule: 'Solo lectura, efímera y sanitizada.',
      fronts: [],
    },
    guard: { open: Number(control.guard?.open || 0) },
    crew: [],
    captain_stop: {
      runtime_control: 'fuera de esta vista previa',
      explanation: 'La vista previa no concede GO, STOP ni capacidad de escritura.',
    },
    jinbe: {
      overall: control.jinbe?.overall || 'unknown',
      deliberation_workers: [],
      local_runtime: {
        status: control.jinbe?.local_runtime?.status || 'unknown',
        explanation: 'Estado transportado desde una consulta de solo lectura.',
      },
      public_ingress: {
        status: control.jinbe?.public_ingress?.status || 'unknown',
        mode: 'redacted',
        stable_identity: false,
        explanation: 'Detalles de entrada omitidos en la vista previa.',
      },
      durable_intake_queue: { status: control.jinbe?.durable_intake_queue?.status || 'unknown' },
      durable_outbox: { status: control.jinbe?.durable_outbox?.status || 'unknown' },
    },
    orders: orders.map((order, index) => ({
      order_id: order.order_id,
      instruction: instructionLabel(index),
      proposed_at: order.proposed_at || null,
      contract_version: order.contract_version || null,
      deliberation_status: order.deliberation_status,
      agents: (Array.isArray(order.agents) ? order.agents : [])
        .filter(agent => PUBLIC_TARGETS.has(agent.target))
        .map(agent => ({
          target: agent.target,
          delivery: safeAxis(agent.delivery),
          outcome: safeAxis(agent.outcome),
          epistemic: safeAxis(agent.epistemic),
        })),
      execution: safeAxis(order.execution),
    })),
  }
}
