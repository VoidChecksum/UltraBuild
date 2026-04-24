import assert from "node:assert/strict";
import test from "node:test";
import { box, renderHelp, renderPill, stripAnsi } from "../src/core/ui.js";

test("renderPill includes ansi color and text", () => {
  const rendered = renderPill("mock", "cyan");
  assert.match(rendered, /\x1b\[/);
  assert.match(stripAnsi(rendered), /mock/);
});

test("box renders title body and border glyphs", () => {
  const rendered = box("HELP", "body");
  const plain = stripAnsi(rendered);
  assert.match(plain, /HELP/);
  assert.match(plain, /body/);
  assert.match(plain, /╭/);
  assert.match(plain, /╰/);
});

test("renderHelp includes modes and vibe commands", () => {
  const plain = stripAnsi(renderHelp());
  assert.match(plain, /--mode/);
  assert.match(plain, /vibe status/);
});
