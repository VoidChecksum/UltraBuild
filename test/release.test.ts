import assert from "node:assert/strict";
import test from "node:test";
import { releaseTargets } from "../src/core/release-targets.js";

test("release target list contains official six artifacts", () => {
  assert.deepEqual(releaseTargets.map((target) => target.artifact), [
    "ultrabuild-linux-x64.tar.gz",
    "ultrabuild-linux-arm64.tar.gz",
    "ultrabuild-macos-x64.tar.gz",
    "ultrabuild-macos-arm64.tar.gz",
    "ultrabuild-windows-x64.zip",
    "ultrabuild-windows-arm64.zip",
  ]);
});
