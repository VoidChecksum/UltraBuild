import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createDefaultTools } from "../src/core/tools.js";

test("read/write/edit/list/grep tools operate inside cwd", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "ub-tools-"));
  try {
    const tools = createDefaultTools();
    await tools.write.run({ path: "a.txt", content: "hello world" }, { cwd, yes: true });
    const read = await tools.read.run({ path: "a.txt" }, { cwd, yes: false });
    assert.equal(read.output, "hello world");
    await tools.edit.run({ path: "a.txt", oldText: "world", newText: "UltraBuild" }, { cwd, yes: true });
    assert.equal(await readFile(path.join(cwd, "a.txt"), "utf8"), "hello UltraBuild");
    const grep = await tools.grep.run({ pattern: "Ultra", path: "." }, { cwd, yes: false });
    assert.match(grep.output, /a\.txt/);
    const list = await tools.list.run({ path: "." }, { cwd, yes: false });
    assert.match(list.output, /a\.txt/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("tools prevent path escape", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "ub-tools-"));
  const outside = path.join(tmpdir(), "ub-outside.txt");
  try {
    await writeFile(outside, "secret");
    const tools = createDefaultTools();
    await assert.rejects(() => tools.read.run({ path: "../ub-outside.txt" }, { cwd, yes: false }), /outside workspace/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
    await rm(outside, { force: true });
  }
});
