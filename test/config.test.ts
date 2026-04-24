import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { defaultConfig, loadConfig } from "../src/core/config.js";

test("loadConfig creates a portable default config", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "ub-config-"));
  try {
    const config = await loadConfig(home);
    assert.equal(config.defaultProvider, "mock");
    assert.equal(config.providers.mock.type, "mock");
    assert.deepEqual(defaultConfig().approval, config.approval);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
