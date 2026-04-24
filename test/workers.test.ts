import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { runMockWorkers } from "../src/core/workers.js";

test("mock workers produce requested count", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "ub-workers-"));
  try {
    const results = await runMockWorkers({ count: 2, prompt: "summarize", home });
    assert.equal(results.length, 2);
    assert.match(results[0].text, /worker 1/);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
