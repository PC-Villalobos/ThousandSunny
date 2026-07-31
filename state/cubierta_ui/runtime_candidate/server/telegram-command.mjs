import fs from 'node:fs'
import path from 'node:path'

const TARGETS = new Set(['claude', 'codex'])
const DELIVERY_TERMINAL = new Set(['responded', 'blocked'])
export const EPISTEMIC_STATUSES = new Set(['observed', 'calculated', 'inferred', 'evaluated', 'proposed', 'unknown'])
export const DELIBERATION_OUTCOMES = new Set(['assessment_provided', 'clarification_required', 'cannot_assess'])
export const EXECUTION_ACTIONS = new Set(['bridge_health_read'])

function readEvents(filePath) {
  if (!fs.existsSync(filePath)) return []
  return fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)] } catch { return [] }
  })
}

export function parseTelegramCommand(text = '') {
  const executionProposal = String(text).match(/^\/orden-ejecutar\s+((?:claude|codex)(?:\s*,\s*(?:claude|codex))*)\s+accion=(bridge_health_read)\s*:\s*(.{1,4000})$/is)
  if (executionProposal) {
    return {
      type: 'propose',
      targets: [...new Set(executionProposal[1].toLowerCase().split(',').map(value => value.trim()))].sort(),
      instruction: executionProposal[3].trim(),
      execution_contract: {
        action_type: executionProposal[2].toLowerCase(),
        parameters: {},
        shell: false,
        authority_effect: 'typed_action_only',
      },
    }
  }
  const proposal = String(text).match(/^\/orden\s+((?:claude|codex)(?:\s*,\s*(?:claude|codex))*)\s*:\s*(.{1,4000})$/is)
  if (proposal) {
    return {
      type: 'propose',
      targets: [...new Set(proposal[1].toLowerCase().split(',').map(value => value.trim()))].sort(),
      instruction: proposal[2].trim(),
    }
  }
  const deliberate = String(text).trim().match(/^\/go-deliberar\s+(ORD-TG-\d+)$/i)
  if (deliberate) return { type: 'go_deliberate', order_id: deliberate[1].toUpperCase() }
  const execute = String(text).trim().match(/^\/go-ejecutar\s+(ORD-TG-\d+)$/i)
  if (execute) return { type: 'go_execute', order_id: execute[1].toUpperCase() }
  const ambiguous = String(text).trim().match(/^\/go(?:\s+.*)?$/i)
  if (ambiguous) return { type: 'ambiguous_go' }
  return null
}

export function parseDeliberationResponse(text = '') {
  const source = String(text).trim()
  const match = source.match(/(?:^|\n)DELIBERATION_OUTCOME:\s*(assessment_provided|clarification_required|cannot_assess)\s*$/i)
  if (!match) return null
  const result = source.slice(0, match.index).trim()
  if (!result) return null
  return { result, deliberation_outcome: match[1].toLowerCase() }
}

function evidenceRefs(event) {
  if (Array.isArray(event.evidence_refs)) return event.evidence_refs.filter(value => typeof value === 'string' && value.trim())
  const legacy = event.evidence_ref || event.receipt
  return legacy ? [legacy] : []
}

function apply(order, event) {
  const next = { ...order, updated_at: event.at }
  if (event.type === 'decided') {
    next.deliberation_status = 'authorized'
    next.decided_at = event.at
    next.go_update_id = event.go_update_id
    next.go_message_id = event.go_message_id
  } else if (event.type === 'claimed') {
    next.deliveries = { ...next.deliveries, [event.target]: {
      delivery_status: 'claimed', actor: event.actor, claimed_at: event.at,
    } }
  } else if (['responded', 'completed', 'blocked'].includes(event.type)) {
    const deliveryStatus = event.type === 'completed' ? 'responded' : event.type
    next.deliveries = { ...next.deliveries, [event.target]: {
      ...next.deliveries[event.target],
      delivery_status: deliveryStatus,
      actor: event.actor,
      evidence_refs: evidenceRefs(event),
      result: event.result || null,
      deliberation_outcome: event.deliberation_outcome ?? 'not_recorded',
      epistemic_status: event.epistemic_status ?? 'not_recorded',
      epistemic_scope: event.epistemic_scope || (event.schema === 'sunny.telegram-command.v3' ? 'response' : 'legacy_response'),
      claim_analysis_status: event.claim_analysis_status
        || (event.schema === 'sunny.telegram-command.v3' ? 'not_implemented' : 'not_recorded'),
      responded_at: event.at,
    } }
    if (next.targets.every(target => DELIVERY_TERMINAL.has(next.deliveries[target]?.delivery_status))) {
      next.deliberation_status = next.targets.every(target => next.deliveries[target].delivery_status === 'responded')
        ? 'deliberated'
        : 'blocked'
    }
  } else if (event.type === 'retried') {
    next.deliberation_status = 'authorized'
    next.deliveries = { ...next.deliveries, [event.target]: {
      delivery_status: 'pending', retried_by: event.actor, retried_at: event.at,
      previous_delivery_status: next.deliveries[event.target]?.delivery_status || null,
    } }
  } else if (event.type === 'execution_decided') {
    next.execution = {
      ...next.execution,
      execution_status: 'authorized',
      actor: event.actor,
      go_update_id: event.go_update_id,
      go_message_id: event.go_message_id,
      decided_at: event.at,
    }
  } else if (['execution_executed', 'execution_completed', 'execution_blocked'].includes(event.type)) {
    next.execution = {
      ...next.execution,
      execution_status: ['execution_executed', 'execution_completed'].includes(event.type) ? 'executed' : 'blocked',
      actor: event.actor,
      result: event.result,
      epistemic_status: event.epistemic_status,
      evidence_refs: evidenceRefs(event),
      executed_at: event.at,
    }
  }
  return next
}

function initialOrder(event) {
  return {
    order_id: event.order_id,
    contract_version: event.schema || null,
    proposal_status: 'proposed',
    deliberation_status: 'not_authorized',
    instruction: event.instruction,
    targets: event.targets,
    captain_id: event.captain_id,
    chat_id: event.chat_id,
    canonical_chat_id: event.canonical_chat_id,
    proposal_update_id: event.proposal_update_id,
    proposal_message_id: event.proposal_message_id,
    proposed_at: event.at,
    updated_at: event.at,
    deliveries: Object.fromEntries(event.targets.map(target => [target, { delivery_status: 'pending' }])),
    execution: event.execution_contract
      ? { ...event.execution_contract, execution_status: 'proposed' }
      : { execution_status: 'not_requested' },
  }
}

function validV3Terminal(event) {
  if (!['responded', 'blocked', 'execution_executed', 'execution_blocked'].includes(event.type)) return true
  if (!EPISTEMIC_STATUSES.has(event.epistemic_status)) return false
  if (event.epistemic_status === 'observed'
      && evidenceRefs(event).length < (['responded', 'blocked'].includes(event.type) ? 2 : 1)) return false
  if (['responded', 'blocked'].includes(event.type) && !DELIBERATION_OUTCOMES.has(event.deliberation_outcome)) return false
  return true
}

export function projectCommandEventToBitacora(event) {
  const projections = {
    proposed: ['observed', 'observation', 'proposed'],
    decided: ['decided', 'decision', 'observed'],
    claimed: ['observed', 'transition', 'observed'],
    responded: ['observed', 'result', event.epistemic_status],
    completed: ['observed', 'result', event.epistemic_status || 'unknown'],
    blocked: ['blocked', 'result', event.epistemic_status],
    retried: ['observed', 'transition', 'observed'],
    execution_decided: ['decided', 'decision', 'observed'],
    execution_executed: ['executed', 'result', event.epistemic_status],
    execution_completed: ['executed', 'result', event.epistemic_status || 'unknown'],
    execution_blocked: ['blocked', 'result', event.epistemic_status],
  }
  const [status, event_kind, epistemic_status] = projections[event.type] || []
  if (!status || !EPISTEMIC_STATUSES.has(epistemic_status)) return null
  return {
    status,
    event_kind,
    epistemic_status,
    source_event_id: `${event.schema}:${event.order_id}:${event.type}:${event.at}`,
  }
}

export class TelegramCommandLedger {
  constructor({ logPath, chatId = 0, captainId = 0, identity = null, now = () => new Date().toISOString() }) {
    this.logPath = logPath
    this.chatId = Number(chatId)
    this.captainId = Number(captainId)
    this.identity = identity
    this.now = now
    this.orders = new Map()
    for (const event of readEvents(logPath)) {
      if (!['sunny.telegram-command.v1', 'sunny.telegram-command.v2', 'sunny.telegram-command.v3'].includes(event.schema)) continue
      if (event.type === 'proposed') {
        this.orders.set(event.order_id, initialOrder(event))
      } else if (this.orders.has(event.order_id)) {
        if (event.schema === 'sunny.telegram-command.v2'
            && ['completed', 'blocked', 'execution_completed', 'execution_blocked'].includes(event.type)
            && !EPISTEMIC_STATUSES.has(event.epistemic_status)) continue
        if (event.schema === 'sunny.telegram-command.v3' && !validV3Terminal(event)) continue
        this.orders.set(event.order_id, apply(this.orders.get(event.order_id), event))
      }
    }
  }

  append(type, fields) {
    const event = { schema: 'sunny.telegram-command.v3', type, at: this.now(), ...fields }
    fs.mkdirSync(path.dirname(this.logPath), { recursive: true })
    fs.appendFileSync(this.logPath, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 })
    return event
  }

  authorized(entry) {
    if (!this.chatId || !this.captainId || entry.sender?.id !== this.captainId || entry.sender?.is_bot) return false
    const configured = this.identity?.resolve(this.chatId)?.canonical_chat_id || this.chatId
    const actual = this.identity?.resolve(entry.chat_id)?.canonical_chat_id || entry.chat_id
    return configured === actual && entry.update_type === 'message'
  }

  ingest(entry) {
    const command = parseTelegramCommand(entry.text)
    if (!command) return { accepted: false, reason: 'not_command' }
    if (['edited_message', 'edited_channel_post', 'edited_business_message'].includes(entry.update_type)) {
      return { accepted: false, reason: 'edited_command_forbidden', command: command.type }
    }
    if (!this.authorized(entry)) return { accepted: false, reason: 'captain_or_chat_not_allowed', command: command.type }
    if (command.type === 'ambiguous_go') return { accepted: false, reason: 'ambiguous_go_forbidden', command: command.type }
    if (command.type === 'propose') {
      if (!command.targets.every(target => TARGETS.has(target))) return { accepted: false, reason: 'target_invalid' }
      const orderId = `ORD-TG-${entry.update_id}`
      if (this.orders.has(orderId)) return { accepted: true, duplicate: true, order: this.orders.get(orderId) }
      const canonical = this.identity?.resolve(entry.chat_id)?.canonical_chat_id || entry.chat_id
      const event = this.append('proposed', {
        order_id: orderId,
        instruction: command.instruction,
        targets: command.targets,
        captain_id: entry.sender.id,
        chat_id: entry.chat_id,
        canonical_chat_id: canonical,
        proposal_update_id: entry.update_id,
        proposal_message_id: entry.message_id,
        execution_contract: command.execution_contract || null,
      })
      const order = initialOrder(event)
      this.orders.set(orderId, order)
      return { accepted: true, duplicate: false, action: 'proposed', order }
    }
    const order = this.orders.get(command.order_id)
    if (!order) return { accepted: false, reason: 'order_not_found', command: command.type }
    if ((this.identity?.resolve(entry.chat_id)?.canonical_chat_id || entry.chat_id) !== order.canonical_chat_id) {
      return { accepted: false, reason: 'conversation_mismatch', command: command.type }
    }
    if (command.type === 'go_execute') {
      if (order.deliberation_status !== 'deliberated') {
        return { accepted: false, reason: 'deliberation_not_completed', command: command.type, order }
      }
      if (!order.execution?.action_type || !EXECUTION_ACTIONS.has(order.execution.action_type)
          || order.execution.shell !== false || Object.keys(order.execution.parameters || {}).length) {
        return { accepted: false, reason: 'execution_contract_invalid', command: command.type, order }
      }
      if (order.execution.execution_status !== 'proposed') {
        return { accepted: false, reason: 'execution_not_proposed', command: command.type, order }
      }
      const event = this.append('execution_decided', {
        order_id: order.order_id,
        actor: `telegram-user:${entry.sender.id}`,
        go_update_id: entry.update_id,
        go_message_id: entry.message_id,
      })
      const decided = apply(order, event)
      this.orders.set(order.order_id, decided)
      return { accepted: true, action: 'execution_decided', order: decided }
    }
    if (command.type !== 'go_deliberate') return { accepted: false, reason: 'command_invalid', command: command.type }
    if (order.deliberation_status !== 'not_authorized') {
      return { accepted: false, reason: 'order_not_proposed', command: command.type, order }
    }
    const event = this.append('decided', {
      order_id: order.order_id,
      actor: `telegram-user:${entry.sender.id}`,
      go_update_id: entry.update_id,
      go_message_id: entry.message_id,
    })
    const decided = apply(order, event)
    this.orders.set(order.order_id, decided)
    return { accepted: true, action: 'decided', order: decided }
  }

  list({ target, deliberation_status, status, limit = 50 } = {}) {
    const requestedStatus = deliberation_status || status
    return [...this.orders.values()]
      .filter(order => !requestedStatus || order.deliberation_status === requestedStatus)
      .filter(order => !target || order.targets.includes(target))
      .sort((a, b) => a.proposed_at.localeCompare(b.proposed_at))
      .slice(-Math.max(1, Math.min(Number(limit) || 50, 200)))
  }

  transition(orderId, type, {
    target, actor, evidence_refs, result, epistemic_status, deliberation_outcome,
  } = {}) {
    const order = this.orders.get(orderId)
    if (!order || !order.targets.includes(target)
        || !['claimed', 'responded', 'blocked', 'retried'].includes(type)) return null
    if (order.deliberation_status === 'not_authorized') return null
    const current = order.deliveries[target]?.delivery_status
    if (type === 'claimed' && current !== 'pending') return null
    if (['responded', 'blocked'].includes(type) && current !== 'claimed') return null
    if (type === 'retried' && !['claimed', 'blocked'].includes(current)) return null
    if (['responded', 'blocked'].includes(type)) {
      if (!EPISTEMIC_STATUSES.has(epistemic_status)
          || !DELIBERATION_OUTCOMES.has(deliberation_outcome)) return null
      if (epistemic_status === 'observed'
          && (!Array.isArray(evidence_refs) || evidence_refs.filter(Boolean).length < 2)) return null
    }
    const event = this.append(type, {
      order_id: orderId,
      target,
      actor,
      evidence_refs: Array.isArray(evidence_refs) ? evidence_refs : [],
      result,
      epistemic_status,
      deliberation_outcome,
      epistemic_scope: 'response',
      claim_analysis_status: 'not_implemented',
    })
    const next = apply(order, event)
    this.orders.set(orderId, next)
    return next
  }

  completeExecution(orderId, {
    actor, result, epistemic_status, evidence_refs, blocked = false,
  } = {}) {
    const order = this.orders.get(orderId)
    if (!order || order.execution?.execution_status !== 'authorized') return null
    if (!EPISTEMIC_STATUSES.has(epistemic_status)) return null
    if (epistemic_status === 'observed'
        && (!Array.isArray(evidence_refs) || evidence_refs.filter(Boolean).length < 1)) return null
    const event = this.append(blocked ? 'execution_blocked' : 'execution_executed', {
      order_id: orderId,
      actor,
      result,
      epistemic_status,
      evidence_refs: Array.isArray(evidence_refs) ? evidence_refs : [],
    })
    const next = apply(order, event)
    this.orders.set(orderId, next)
    return next
  }

  status() {
    return {
      configured: Boolean(this.chatId && this.captainId),
      proposed: this.list({ deliberation_status: 'not_authorized', limit: 200 }).length,
      deliberation_authorized: this.list({ deliberation_status: 'authorized', limit: 200 }).length,
    }
  }
}
