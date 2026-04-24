import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const temp = await mkdtemp(path.join(os.tmpdir(), "ultrabuild-e2e-"));
const env = { ...process.env, ULTRABUILD_HOME: path.join(temp, "home"), NO_COLOR: "1" };

const cases = [
  ["--help"],
  ["doctor"],
  ["init"],
  ["--provider", "mock", "--print", "hello"],
  ["--mode", "plan", "--provider", "mock", "--print", "plan"],
  ["workers", "--count", "2", "--provider", "mock", "task"],
  ["vibe", "status"],
  ["vibe", "test"],
];

try {
  for (const args of cases) {
    const child = spawnSync(process.execPath, [path.join(root, "dist", "cli.js"), ...args], {
      cwd: root,
      env,
      encoding: "utf8",
      timeout: 15_000,
    });
    if (child.status !== 0) {
      console.error(`E2E failed: ultrabuild ${args.join(" ")}`);
      console.error(child.stdout);
      console.error(child.stderr);
      process.exit(child.status ?? 1);
    }
    const output = `${child.stdout}\n${child.stderr}`;
    if (!output.trim()) {
      console.error(`E2E produced no output: ultrabuild ${args.join(" ")}`);
      process.exit(1);
    }
    console.log(`✓ ultrabuild ${args.join(" ")}`);
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
