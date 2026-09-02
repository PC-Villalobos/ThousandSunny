import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  assessRoleAssignment,
  createRoleAssignment,
  normalizeRoleIdentity
} from "./role_assignment.mjs";

const roles = ["Nami", "Robin", "Chopper", "Vivi", "Usopp", "Zoro", "Groot"];
const assignment = (timestamp, overrides = {}) => createRoleAssignment({
  timestamp,
  scopeId: "thousandsunny-repo",
  executor: "github-actions",
  actor: "deterministic-sleep-engine",
  role: "Groot",
  supervisorModel: null,
  ...overrides
});

test("requires scope, executor, actor and role explicitly", () => {
  assert.throws(
    () => normalizeRoleIdentity({ executor: "github-actions", actor: "deterministic-sleep-engine", role: "Groot" }),
    /missing_required_identity:scope_id/
  );
  assert.throws(
    () => normalizeRoleIdentity({ scopeId: "thousandsunny-repo", actor: "deterministic-sleep-engine", role: "Groot" }),
    /missing_required_identity:executor/
  );
});

test("keeps actor separate from an optional supervisor model", () => {
  const current = assignment("2026-09-02T03:09:00.000Z", {
    scopeId: "groot-local-full-corpus",
    executor: "codex-local-cron",
    supervisorModel: "gpt-5.6-terra",
    role: "Usopp"
  });
  assert.equal(current.actor, "deterministic-sleep-engine");
  assert.equal(current.supervisorModel, "gpt-5.6-terra");
});

test("does not extend a streak from legacy entries without the complete contract", () => {
  const current = assignment("2026-09-02T03:09:00.000Z");
  const result = assessRoleAssignment({
    previousLedger: [{ timestamp: "2026-09-01T03:09:00.000Z", actor: "deterministic-sleep-engine", role: "Groot" }],
    assignment: current,
    roles
  });
  assert.equal(result.current.executionStreak, 1);
  assert.equal(result.current.dayStreak, 1);
  assert.equal(result.legacyEntriesExcluded, 1);
});

test("does not merge ledgers from different scopes", () => {
  const previous = assignment("2026-09-01T03:09:00.000Z", { scopeId: "groot-local-full-corpus" });
  const current = assignment("2026-09-02T03:09:00.000Z");
  const result = assessRoleAssignment({ previousLedger: [previous], assignment: current, roles });
  assert.equal(result.current.executionStreak, 1);
  assert.equal(result.current.dayStreak, 1);
});

test("distinguishes repeated executions from distinct UTC dates", () => {
  const first = assignment("2026-09-02T03:09:00.000Z");
  const second = assignment("2026-09-02T11:39:00.000Z");
  const result = assessRoleAssignment({ previousLedger: [first], assignment: second, roles });
  assert.equal(result.current.executionStreak, 2);
  assert.equal(result.current.dayStreak, 1);
  assert.equal(result.warnings.length, 0);
});

test("reports repeated assignment without claiming fusion", () => {
  const result = assessRoleAssignment({
    previousLedger: [
      assignment("2026-09-01T03:09:00.000Z"),
      assignment("2026-09-02T03:09:00.000Z")
    ],
    assignment: assignment("2026-09-03T03:09:00.000Z"),
    roles,
    dayThreshold: 3
  });
  assert.equal(result.warnings[0].kind, "repeated_role_assignment");
  assert.equal(result.warnings[0].severity, "medium");
  assert.doesNotMatch(result.warnings[0].detail, /fusion/i);
});

test("a changed assignment resets both counters", () => {
  const result = assessRoleAssignment({
    previousLedger: [assignment("2026-09-01T03:09:00.000Z")],
    assignment: assignment("2026-09-02T03:09:00.000Z", { role: "Nami" }),
    roles
  });
  assert.equal(result.current.executionStreak, 1);
  assert.equal(result.current.dayStreak, 1);
});

test("next role is only a candidate and rotation remains human", () => {
  const result = assessRoleAssignment({ assignment: assignment("2026-09-02T03:09:00.000Z"), roles });
  assert.equal(result.nextCandidateRole, "Nami");
  assert.equal(result.rotationDecision, "human_required");
});

test("declares two profiles with separate state lineages and valid identities", () => {
  const manifest = JSON.parse(fs.readFileSync(new URL("./sleep_profiles.v1.json", import.meta.url), "utf8"));
  assert.equal(manifest.profiles.length, 2);
  assert.equal(new Set(manifest.profiles.map((profile) => profile.scope_id)).size, 2);
  assert.equal(new Set(manifest.profiles.map((profile) => profile.state)).size, 2);
  for (const profile of manifest.profiles) {
    const identity = normalizeRoleIdentity({
      scopeId: profile.scope_id,
      executor: profile.executor,
      actor: profile.actor,
      role: profile.role,
      supervisorModel: profile.supervisor_model
    });
    assert.equal(identity.scopeId, profile.scope_id);
  }
});
