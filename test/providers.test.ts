import assert from "node:assert/strict";
import test from "node:test";
import { createProvider } from "../src/core/providers.js";

test("mock provider returns deterministic text", async () => {
  const provider = createProvider("mock", { type: "mock" });
  const result = await provider.complete({ prompt: "hello", system: "test", tools: [] });
  assert.match(result.text, /UltraBuild mock/);
  assert.equal(result.provider, "mock");
});
