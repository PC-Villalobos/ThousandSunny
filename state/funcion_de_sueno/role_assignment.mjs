function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`missing_required_identity:${field}`);
  }
  return value.trim();
}

function optionalText(value, field) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`invalid_optional_identity:${field}`);
  }
  return value.trim();
}

function comparable(entry) {
  return entry
    && typeof entry.scopeId === "string" && entry.scopeId.length > 0
    && typeof entry.executor === "string" && entry.executor.length > 0
    && typeof entry.actor === "string" && entry.actor.length > 0
    && typeof entry.role === "string" && entry.role.length > 0;
}

function sameAssignment(left, right) {
  return comparable(left)
    && comparable(right)
    && left.scopeId === right.scopeId
    && left.executor === right.executor
    && left.actor === right.actor
    && left.role === right.role;
}

export function normalizeRoleIdentity({ scopeId, executor, actor, role, supervisorModel = null }) {
  return {
    scopeId: requiredText(scopeId, "scope_id"),
    executor: requiredText(executor, "executor"),
    actor: requiredText(actor, "actor"),
    role: requiredText(role, "role"),
    supervisorModel: optionalText(supervisorModel, "supervisor_model")
  };
}

export function createRoleAssignment({
  scopeId,
  executor,
  actor,
  role,
  supervisorModel = null,
  timestamp = new Date().toISOString()
}) {
  const normalizedTimestamp = requiredText(timestamp, "timestamp");
  const cycleDate = normalizedTimestamp.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cycleDate)) {
    throw new Error("invalid_identity_timestamp");
  }
  return {
    timestamp: normalizedTimestamp,
    cycleDate,
    ...normalizeRoleIdentity({ scopeId, executor, actor, role, supervisorModel })
  };
}

export function assessRoleAssignment({ previousLedger = [], assignment, roles = [], dayThreshold = 3 }) {
  const ledger = [...previousLedger, assignment];
  let executionStreak = 0;
  const distinctDates = new Set();

  for (let index = ledger.length - 1; index >= 0; index -= 1) {
    const entry = ledger[index];
    if (!sameAssignment(entry, assignment)) break;
    executionStreak += 1;
    if (typeof entry.cycleDate === "string") distinctDates.add(entry.cycleDate);
  }

  const dayStreak = distinctDates.size;
  const roleIndex = roles.findIndex((item) => item.toLowerCase() === assignment.role.toLowerCase());
  const nextCandidateRole = roleIndex >= 0 && roles.length > 0
    ? roles[(roleIndex + 1) % roles.length]
    : null;
  const warnings = [];

  if (dayStreak >= dayThreshold) {
    warnings.push({
      severity: "medium",
      kind: "repeated_role_assignment",
      detail: `Declared assignment ${assignment.scopeId} / ${assignment.executor} / ${assignment.actor} / ${assignment.role} repeated across ${executionStreak} executions and ${dayStreak} recorded UTC dates; human review required before rotation.`
    });
  }

  return {
    ledger,
    current: {
      ...assignment,
      executionStreak,
      dayStreak
    },
    nextCandidateRole,
    rotationDecision: "human_required",
    legacyEntriesExcluded: previousLedger.filter((entry) => !comparable(entry)).length,
    warnings
  };
}
