import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { sanitizeControl } from './sanitize.mjs'

const live = {
  generated_at: '2026-07-31T00:00:00.000Z',
  guard: { open: 2, sensitive: 'remove-me' },
  rumbo: { label: 'private', rule: 'private', fronts: [{ next_gate: 'private' }] },
  crew: [{ actor: 'private' }],
  jinbe: {
    overall: 'operational', local_runtime: { status: 'operational' },
    public_ingress: { status: 'degraded', mode: 'named-secret' },
    durable_intake_queue: { status: 'ready' }, durable_outbox: { status: 'ready' },
  },
  orders: [{
    order_id: 'ORD-TG-1', instruction: 'Texto real del Capitán',
    proposed_at: '2026-07-27T00:00:00.000Z', contract_version: null,
    deliberation_status: 'deliberated',
    agents: [
      { target: 'claude', delivery: { value: 'responded', label: 'Respondida', explanation: 'fin', recognized: true }, outcome: { value: 'not_recorded', label: 'No registrado', explanation: 'ausente', recognized: true }, epistemic: { value: 'unknown', label: 'Desconocido', explanation: 'declarado', recognized: true }, evidence_refs: ['secret'] },
      { target: 'actor-libre', delivery: { value: 'pending' } },
    ],
    execution: { value: 'not_requested', label: 'Sin ejecución', explanation: 'no pedida', recognized: true, result: 'secret' },
  }],
}

test('sanitization preserves structure and removes real instructions and free actors', () => {
  const preview = sanitizeControl(live)
  assert.equal(preview.orders[0].order_id, 'ORD-TG-1')
  assert.equal(preview.orders[0].instruction, 'Instrucción omitida · orden 1')
  assert.ok(!JSON.stringify(preview).includes('Texto real del Capitán'))
  assert.deepEqual(preview.orders[0].agents.map(agent => agent.target), ['claude'])
  assert.ok(!JSON.stringify(preview).includes('actor-libre'))
})

test('sanitization preserves not_recorded, unknown, time and null contract version', () => {
  const order = sanitizeControl(live).orders[0]
  assert.equal(order.proposed_at, live.orders[0].proposed_at)
  assert.equal(order.contract_version, null)
  assert.equal(order.agents[0].outcome.value, 'not_recorded')
  assert.equal(order.agents[0].epistemic.value, 'unknown')
})

test('preview excludes responses, evidence, credentials and operational prose', () => {
  const serialized = JSON.stringify(sanitizeControl(live))
  for (const forbidden of ['evidence_refs', 'result', 'private', 'named-secret', 'sensitive']) {
    assert.ok(!serialized.includes(forbidden), forbidden)
  }
})

test('preview server is loopback-only, GET-only and does not write files', () => {
  const source = readFileSync(new URL('./server.mjs', import.meta.url), 'utf8')
  assert.match(source, /const HOST = '127\.0\.0\.1'/)
  assert.match(source, /SUNNY_PREVIEW_SOURCE_URL must be loopback HTTP/)
  assert.match(source, /req\.method !== 'GET'/)
  assert.doesNotMatch(source, /writeFile|appendFile|createWriteStream/)
  assert.doesNotMatch(source, /method:\s*'POST'/)
  assert.match(source, /cache-control.*no-store/s)
})
