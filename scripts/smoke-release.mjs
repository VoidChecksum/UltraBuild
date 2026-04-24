import { access, chmod, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const releaseDir = path.join(root, "release");
const temp = await mkdtemp(path.join(os.tmpdir(), "ultrabuild-release-smoke-"));
const currentOs = process.platform === "darwin" ? "macos" : process.platform === "win32" ? "windows" : "linux";
const currentArch = process.arch === "arm64" ? "arm64" : "x64";

try {
  const artifacts = await readdir(releaseDir);
  const current = artifacts.find((name) => name.includes(`${currentOs}-${currentArch}`));
  const firstTar = artifacts.find((name) => name.endsWith(".tar.gz"));
  const firstZip = artifacts.find((name) => name.endsWith(".zip"));
  const selected = [...new Set([current, firstTar, firstZip].filter(Boolean))];
  if (!selected.length) throw new Error("No release artifacts found. Run npm run package:all first.");
  for (const artifact of selected) {
    await smokeArtifact(artifact);
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}

async function smokeArtifact(artifact) {
  const unpackDir = path.join(temp, artifact.replace(/[^a-zA-Z0-9.-]/g, "_"));
  await rm(unpackDir, { recursive: true, force: true });
  await mkdir(unpackDir, { recursive: true });
  await extractArtifact(path.join(releaseDir, artifact), unpackDir);
  const [packageRootName] = await readdir(unpackDir);
  const packageRoot = path.join(unpackDir, packageRootName);
  for (const required of ["dist/cli.js", "package.json", "README.md", "LICENSE", "assets", "docs", "bin/ultrabuild", "bin/ultrabuild.cmd"]) {
    await access(path.join(packageRoot, required));
  }
  const env = { ...process.env, ULTRABUILD_HOME: path.join(unpackDir, "home"), NO_COLOR: "1" };
  const isCurrentTarget = artifact.includes(`${currentOs}-${currentArch}`);
  if (isCurrentTarget) {
    const launcher = process.platform === "win32" ? path.join(packageRoot, "bin", "ultrabuild.cmd") : path.join(packageRoot, "bin", "ultrabuild");
    if (process.platform !== "win32") await chmod(launcher, 0o755).catch(() => {});
    run(launcher, ["--provider", "mock", "--print", "smoke"], packageRoot, env);
    run(launcher, ["doctor"], packageRoot, env);
  } else {
    run(process.execPath, [path.join(packageRoot, "dist", "cli.js"), "--help"], packageRoot, env);
  }
  console.log(`✓ smoke ${artifact}`);
}

async function extractArtifact(artifactPath, destination) {
  if (artifactPath.endsWith(".zip")) {
    await extractStoredZip(artifactPath, destination);
    return;
  }
  const extracted = spawnSync("tar", ["-xf", artifactPath, "-C", destination], { encoding: "utf8" });
  if (extracted.status !== 0) {
    console.error(extracted.stdout);
    console.error(extracted.stderr);
    throw new Error(`Failed to unpack ${artifactPath}; tar is required for tar.gz smoke tests.`);
  }
}

async function extractStoredZip(artifactPath, destination) {
  const zip = await readFile(artifactPath);
  let offset = 0;
  while (offset + 30 <= zip.length && zip.readUInt32LE(offset) === 0x04034b50) {
    const compressedSize = zip.readUInt32LE(offset + 18);
    const nameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    const name = zip.subarray(offset + 30, offset + 30 + nameLength).toString("utf8");
    const dataStart = offset + 30 + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    const target = path.join(destination, ...name.split("/"));
    if (name.endsWith("/")) await mkdir(target, { recursive: true });
    else {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, zip.subarray(dataStart, dataEnd));
    }
    offset = dataEnd;
  }
}

function run(command, args, cwd, env) {
  const child = spawnSync(command, args, { cwd, env, encoding: "utf8", timeout: 20_000, shell: false });
  if (child.status !== 0) {
    console.error(`Command failed: ${command} ${args.join(" ")}`);
    console.error(child.stdout);
    console.error(child.stderr);
    process.exit(child.status ?? 1);
  }
}
