import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadSkills } from "../src/core/skills.js";

test("loadSkills discovers markdown skills", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ub-skills-"));
  try {
    await mkdir(path.join(root, "skills"));
    await writeFile(path.join(root, "skills", "review.md"), "# Review\nCheck quality.");
    const skills = await loadSkills([path.join(root, "skills")]);
    assert.equal(skills[0].name, "review");
    assert.match(skills[0].content, /Check quality/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
