import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { runAgentTurn } from "../src/core/agent.js";
import { defaultConfig } from "../src/core/config.js";

test("agent loop records a mock response", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "ub-agent-"));
  const cwd = await mkdtemp(path.join(tmpdir(), "ub-agent-cwd-"));
  try {
    const result = await runAgentTurn({ prompt: "hello", config: defaultConfig(), home, cwd, providerName: "mock", print: true, yes: true });
    assert.match(result.text, /UltraBuild mock/);
    assert.ok(result.sessionId.length > 0);
  } finally {
    await rm(home, { recursive: true, force: true });
    await rm(cwd, { recursive: true, force: true });
  }
});
