import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  parseDeliberationResponse,
  parseTelegramCommand,
  projectCommandEventToBitacora,
  TelegramCommandLedger,
} from './telegram-command.mjs'

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'telegram-command-'))
  let tick = 0
  const ledger = new TelegramCommandLedger({
    logPath: path.join(dir, 'commands.jsonl'), chatId: -1001, captainId: 42,
    now: () => `2026-07-27T00:00:${String(tick++).padStart(2, '0')}.000Z`,
  })
  const entry = (update_id, text, overrides = {}) => ({
    update_id, update_type: 'message', chat_id: -1001, message_id: update_id,
    sender: { id: 42, is_bot: false }, text, ...overrides,
  })
  return { ledger, entry }
}

function authorizeAndClaim(ledger, entry, orderId, target = 'codex') {
  ledger.ingest(entry(orderId + 1, `/go-deliberar ORD-TG-${orderId}`))
  return ledger.transition(`ORD-TG-${orderId}`, 'claimed', { target, actor: `${target}:worker` })
}

test('syntax separates deliberation, typed execution and rejects ambiguous GO', () => {
  assert.deepEqual(parseTelegramCommand('/orden codex, claude: revisar PR 91'), {
    type: 'propose', targets: ['claude', 'codex'], instruction: 'revisar PR 91',
  })
  assert.equal(parseTelegramCommand('/go-deliberar ORD-TG-12').type, 'go_deliberate')
  assert.equal(parseTelegramCommand('/go-ejecutar ORD-TG-12').type, 'go_execute')
  assert.equal(parseTelegramCommand('/go ORD-TG-12').type, 'ambiguous_go')
  assert.equal(parseTelegramCommand('/orden-ejecutar codex accion=shell: dir'), null)
})

test('worker response requires a closed outcome marker', () => {
  assert.deepEqual(parseDeliberationResponse(
    'Necesito conocer el endpoint.\nDELIBERATION_OUTCOME: clarification_required',
  ), {
    result: 'Necesito conocer el endpoint.',
    deliberation_outcome: 'clarification_required',
  })
  assert.equal(parseDeliberationResponse('Respuesta sin marcador'), null)
  assert.equal(parseDeliberationResponse('DELIBERATION_OUTCOME: success'), null)
})

test('typed execution proposal is closed and shell-free', () => {
  const parsed = parseTelegramCommand('/orden-ejecutar claude,codex accion=bridge_health_read: salud')
  assert.equal(parsed.execution_contract.action_type, 'bridge_health_read')
  assert.equal(parsed.execution_contract.shell, false)
  assert.deepEqual(parsed.execution_contract.parameters, {})
})

test('proposal and deliberation authorization are distinct states', () => {
  const { ledger, entry } = fixture()
  const proposal = ledger.ingest(entry(10, '/orden claude,codex: revisar'))
  assert.equal(proposal.order.proposal_status, 'proposed')
  assert.equal(proposal.order.deliberation_status, 'not_authorized')
  assert.equal(proposal.order.contract_version, 'sunny.telegram-command.v3')
  assert.equal(ledger.ingest(entry(11, '/go ORD-TG-10')).reason, 'ambiguous_go_forbidden')
  const go = ledger.ingest(entry(12, '/go-deliberar ORD-TG-10'))
  assert.equal(go.order.deliberation_status, 'authorized')
})

test('an edited command never acquires authority retroactively', () => {
  const { ledger, entry } = fixture()
  const edited = ledger.ingest(entry(15, '/go-deliberar ORD-TG-10', {
    update_type: 'edited_message',
  }))
  assert.equal(edited.reason, 'edited_command_forbidden')
  assert.equal(ledger.list().length, 0)
})

test('responded is delivery completion, with a separate semantic outcome', () => {
  const { ledger, entry } = fixture()
  ledger.ingest(entry(20, '/orden claude,codex: comprobar'))
  ledger.ingest(entry(21, '/go-deliberar ORD-TG-20'))
  ledger.transition('ORD-TG-20', 'claimed', { target: 'claude', actor: 'claude:worker' })
  assert.equal(ledger.transition('ORD-TG-20', 'responded', {
    target: 'claude', actor: 'claude:worker', result: 'necesito contexto',
    epistemic_status: 'inferred',
  }), null)
  const partial = ledger.transition('ORD-TG-20', 'responded', {
    target: 'claude', actor: 'claude:worker', result: 'necesito contexto',
    epistemic_status: 'inferred', deliberation_outcome: 'clarification_required',
    evidence_refs: ['sha256:a'],
  })
  assert.equal(partial.deliberation_status, 'authorized')
  assert.equal(partial.deliveries.claude.delivery_status, 'responded')
  assert.equal(partial.deliveries.claude.deliberation_outcome, 'clarification_required')
  assert.equal(partial.deliveries.claude.epistemic_scope, 'response')
  assert.equal(partial.deliveries.claude.claim_analysis_status, 'not_implemented')
  ledger.transition('ORD-TG-20', 'claimed', { target: 'codex', actor: 'codex:worker' })
  const done = ledger.transition('ORD-TG-20', 'responded', {
    target: 'codex', actor: 'codex:worker', result: 'evaluación',
    epistemic_status: 'inferred', deliberation_outcome: 'assessment_provided',
    evidence_refs: ['sha256:b'],
  })
  assert.equal(done.deliberation_status, 'deliberated')
})

test('observed deliberation fails closed without two evidence sources', () => {
  const { ledger, entry } = fixture()
  ledger.ingest(entry(30, '/orden codex: revisar'))
  authorizeAndClaim(ledger, entry, 30)
  const base = {
    target: 'codex', actor: 'worker', result: 'observación',
    epistemic_status: 'observed', deliberation_outcome: 'assessment_provided',
  }
  assert.equal(ledger.transition('ORD-TG-30', 'responded', {
    ...base, evidence_refs: ['sha256:one'],
  }), null)
  assert.ok(ledger.transition('ORD-TG-30', 'responded', {
    ...base, evidence_refs: ['source:runtime', 'sha256:two'],
  }))
})

test('legacy completed preserves missing axes as not_recorded without rewriting', () => {
  const { ledger } = fixture()
  const events = [
    { schema: 'sunny.telegram-command.v1', type: 'proposed', at: '2026-07-26T00:00:00Z',
      order_id: 'ORD-TG-1', instruction: 'legacy', targets: ['codex'], captain_id: 42,
      chat_id: -1001, canonical_chat_id: -1001, proposal_update_id: 1, proposal_message_id: 1 },
    { schema: 'sunny.telegram-command.v1', type: 'decided', at: '2026-07-26T00:01:00Z',
      order_id: 'ORD-TG-1', go_update_id: 2, go_message_id: 2 },
    { schema: 'sunny.telegram-command.v1', type: 'claimed', at: '2026-07-26T00:02:00Z',
      order_id: 'ORD-TG-1', target: 'codex', actor: 'legacy' },
    { schema: 'sunny.telegram-command.v1', type: 'completed', at: '2026-07-26T00:03:00Z',
      order_id: 'ORD-TG-1', target: 'codex', actor: 'legacy', result: 'old' },
  ]
  fs.writeFileSync(ledger.logPath, `${events.map(JSON.stringify).join('\n')}\n`)
  const before = fs.readFileSync(ledger.logPath, 'utf8')
  const restored = new TelegramCommandLedger({ logPath: ledger.logPath, chatId: -1001, captainId: 42 })
  const delivery = restored.list({ target: 'codex' })[0].deliveries.codex
  assert.equal(delivery.delivery_status, 'responded')
  assert.equal(delivery.deliberation_outcome, 'not_recorded')
  assert.equal(delivery.epistemic_status, 'not_recorded')
  assert.equal(restored.list({ target: 'codex' })[0].contract_version, 'sunny.telegram-command.v1')
  assert.equal(fs.readFileSync(ledger.logPath, 'utf8'), before)
})

test('invalid v3 terminal event fails closed during restore', () => {
  const { ledger } = fixture()
  const events = [
    { schema: 'sunny.telegram-command.v3', type: 'proposed', at: '2026-07-27T00:00:00Z',
      order_id: 'ORD-TG-2', instruction: 'v3', targets: ['codex'], captain_id: 42,
      chat_id: -1001, canonical_chat_id: -1001, proposal_update_id: 2, proposal_message_id: 2 },
    { schema: 'sunny.telegram-command.v3', type: 'decided', at: '2026-07-27T00:01:00Z',
      order_id: 'ORD-TG-2', go_update_id: 3, go_message_id: 3 },
    { schema: 'sunny.telegram-command.v3', type: 'claimed', at: '2026-07-27T00:02:00Z',
      order_id: 'ORD-TG-2', target: 'codex', actor: 'worker' },
    { schema: 'sunny.telegram-command.v3', type: 'responded', at: '2026-07-27T00:03:00Z',
      order_id: 'ORD-TG-2', target: 'codex', actor: 'worker', epistemic_status: 'inferred' },
  ]
  fs.writeFileSync(ledger.logPath, `${events.map(JSON.stringify).join('\n')}\n`)
  const restored = new TelegramCommandLedger({ logPath: ledger.logPath, chatId: -1001, captainId: 42 })
  const order = restored.list({ target: 'codex' })[0]
  assert.equal(order.deliberation_status, 'authorized')
  assert.equal(order.deliveries.codex.delivery_status, 'claimed')
})

test('execution uses executed only after deliberation and typed GO', () => {
  const { ledger, entry } = fixture()
  ledger.ingest(entry(40, '/orden-ejecutar codex accion=bridge_health_read: comprobar'))
  assert.equal(ledger.ingest(entry(41, '/go-ejecutar ORD-TG-40')).reason, 'deliberation_not_completed')
  authorizeAndClaim(ledger, entry, 40)
  ledger.transition('ORD-TG-40', 'responded', {
    target: 'codex', actor: 'worker', epistemic_status: 'inferred',
    deliberation_outcome: 'clarification_required', evidence_refs: ['sha256:x'],
  })
  const execution = ledger.ingest(entry(42, '/go-ejecutar ORD-TG-40'))
  assert.equal(execution.order.execution.execution_status, 'authorized')
  const executed = ledger.completeExecution('ORD-TG-40', {
    actor: 'typed-adapter', result: 'healthy', epistemic_status: 'observed',
    evidence_refs: ['sha256:health'],
  })
  assert.equal(executed.execution.execution_status, 'executed')
})

test('retry preserves the prior delivery state append-only', () => {
  const { ledger, entry } = fixture()
  ledger.ingest(entry(50, '/orden codex: revisar'))
  authorizeAndClaim(ledger, entry, 50)
  ledger.transition('ORD-TG-50', 'blocked', {
    target: 'codex', actor: 'worker', result: 'engine error',
    epistemic_status: 'observed', deliberation_outcome: 'cannot_assess',
    evidence_refs: ['worker:exit', 'sha256:error'],
  })
  const retried = ledger.transition('ORD-TG-50', 'retried', {
    target: 'codex', actor: 'operator',
  })
  assert.equal(retried.deliberation_status, 'authorized')
  assert.equal(retried.deliveries.codex.delivery_status, 'pending')
  assert.equal(retried.deliveries.codex.previous_delivery_status, 'blocked')
})

test('Bitacora projection explicitly translates lifecycle vocabulary', () => {
  const base = { schema: 'sunny.telegram-command.v3', order_id: 'ORD-TG-1', at: 'now' }
  assert.deepEqual(projectCommandEventToBitacora({ ...base, type: 'claimed' }), {
    status: 'observed', event_kind: 'transition', epistemic_status: 'observed',
    source_event_id: 'sunny.telegram-command.v3:ORD-TG-1:claimed:now',
  })
  assert.equal(projectCommandEventToBitacora({
    ...base, type: 'responded', epistemic_status: 'inferred',
  }).status, 'observed')
  assert.equal(projectCommandEventToBitacora({
    ...base, type: 'execution_executed', epistemic_status: 'observed',
  }).status, 'executed')
})
