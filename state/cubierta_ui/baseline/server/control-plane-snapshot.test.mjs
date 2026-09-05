import test from 'node:test'
import assert from 'node:assert/strict'
import { buildControlPlaneSnapshot, translateOrder } from './control-plane-snapshot.mjs'

const baseOrder = {
  order_id: 'ORD-TG-1',
  instruction: 'Contrastar.',
  proposed_at: '2026-07-27T00:00:00.000Z',
  deliberation_status: 'deliberated',
  targets: ['claude'],
  deliveries: { claude: {
    delivery_status: 'responded',
    deliberation_outcome: 'clarification_required',
    epistemic_status: 'inferred',
    epistemic_scope: 'response',
    claim_analysis_status: 'not_implemented',
  } },
  execution: { execution_status: 'not_requested' },
}

test('responded is translated as turn completion, not execution', () => {
  const order = translateOrder(baseOrder)
  assert.equal(order.agents[0].delivery.label, 'Respondida')
  assert.match(order.agents[0].delivery.explanation, /no significa.*ejecutara/i)
  assert.equal(order.execution.value, 'not_requested')
})

test('epistemic status and deliberation outcome remain independent', () => {
  const agent = translateOrder(baseOrder).agents[0]
  assert.equal(agent.outcome.value, 'clarification_required')
  assert.equal(agent.epistemic.value, 'inferred')
})

test('unknown enum values fail closed', () => {
  const order = structuredClone(baseOrder)
  order.deliveries.claude.delivery_status = 'victorious'
  const delivery = translateOrder(order).agents[0].delivery
  assert.equal(delivery.recognized, false)
  assert.match(delivery.explanation, /Fallo cerrado/)
})

test('snapshot never admits OpenClaw or DeepSeek as command targets', () => {
  const snapshot = buildControlPlaneSnapshot()
  for (const actor of snapshot.crew.filter(item => ['OpenClaw', 'DeepSeek'].includes(item.actor))) {
    assert.equal(actor.command_target, false)
    assert.notEqual(actor.admission, 'admitted')
  }
  assert.equal(snapshot.boundaries.openclaw_connected, false)
  assert.equal(snapshot.boundaries.deepseek_command_target, false)
})

test('local health does not imply public ingress health', () => {
  const snapshot = buildControlPlaneSnapshot({ ingressMode: 'quick_tunnel' })
  assert.equal(snapshot.jinbe.local_runtime.status, 'operational')
  assert.equal(snapshot.jinbe.public_ingress.status, 'unmonitored')
  assert.equal(snapshot.jinbe.overall, 'degraded')
})

test('named tunnel can be represented without enabling new execution', () => {
  const snapshot = buildControlPlaneSnapshot({ ingressMode: 'named_tunnel' })
  assert.equal(snapshot.jinbe.overall, 'operational')
  assert.equal(snapshot.boundaries.arbitrary_shell, false)
  assert.equal(snapshot.boundaries.onboarding_canonical, false)
})

