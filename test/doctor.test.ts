import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { runDoctor } from "../src/core/doctor.js";

test("doctor reports core checks", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "ub-doctor-"));
  try {
    const report = await runDoctor({ home, cwd: process.cwd() });
    assert.ok(report.checks.some((check) => check.name === "node"));
    assert.ok(report.checks.some((check) => check.name === "home"));
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
