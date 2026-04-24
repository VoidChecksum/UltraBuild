import assert from "node:assert/strict";
import test from "node:test";
import { getMode, listModes, toolAllowedInMode } from "../src/core/modes.js";

test("plan and review modes are read-only", () => {
  assert.equal(getMode("plan").readOnly, true);
  assert.equal(getMode("review").readOnly, true);
  assert.equal(toolAllowedInMode("write", getMode("plan")), false);
  assert.equal(toolAllowedInMode("bash", getMode("review")), false);
});

test("yolo mode is explicit and auto-approves", () => {
  const yolo = getMode("yolo");
  assert.equal(yolo.autoApprove, true);
  assert.match(yolo.warning || "", /danger/i);
});

test("all expected modes are listed", () => {
  const names = listModes().map((mode) => mode.name);
  assert.deepEqual(names, ["chat", "build", "plan", "review", "debug", "workers", "yolo"]);
});
