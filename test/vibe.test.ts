import assert from "node:assert/strict";
import test from "node:test";
import { createVibeEvent, getVibeStatus, sendVibeEvent } from "../src/core/vibe.js";

test("createVibeEvent uses UltraBuild source", () => {
  const event = createVibeEvent({ sessionId: "s1", hookEventName: "SessionStart", cwd: "/tmp/demo" });
  assert.equal(event.session_id, "s1");
  assert.equal(event.hook_event_name, "SessionStart");
  assert.equal(event._source, "ultrabuild");
  assert.equal(event.cwd, "/tmp/demo");
});

test("vibe status is safe when app is absent", async () => {
  const status = await getVibeStatus({ home: "/tmp/ultrabuild-no-vibe-home" });
  assert.equal(typeof status.reachable, "boolean");
  assert.ok(status.path.length > 0);
});

test("sendVibeEvent does not throw when unavailable", async () => {
  const result = await sendVibeEvent(createVibeEvent({ sessionId: "s2", hookEventName: "Notification" }), { home: "/tmp/ultrabuild-no-vibe-home" });
  assert.equal(result.sent, false);
});
