import { spawnSync } from "node:child_process";
import { chmod, cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const releaseTargets = [
  { os: "linux", arch: "x64", archive: "tar.gz", artifact: "ultrabuild-linux-x64.tar.gz" },
  { os: "linux", arch: "arm64", archive: "tar.gz", artifact: "ultrabuild-linux-arm64.tar.gz" },
  { os: "macos", arch: "x64", archive: "tar.gz", artifact: "ultrabuild-macos-x64.tar.gz" },
  { os: "macos", arch: "arm64", archive: "tar.gz", artifact: "ultrabuild-macos-arm64.tar.gz" },
  { os: "windows", arch: "x64", archive: "zip", artifact: "ultrabuild-windows-x64.zip" },
  { os: "windows", arch: "arm64", archive: "zip", artifact: "ultrabuild-windows-arm64.zip" },
];

const table = makeCrcTable();
const root = process.cwd();
const releaseDir = path.join(root, "release");
const stagingDir = path.join(root, ".release-staging");

run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
await rm(releaseDir, { recursive: true, force: true });
await rm(stagingDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });
await mkdir(stagingDir, { recursive: true });

for (const target of releaseTargets) {
  const packageName = `ultrabuild-${target.os}-${target.arch}`;
  const packageRoot = path.join(stagingDir, packageName);
  await stagePackage(packageRoot, target);
  const artifactPath = path.join(releaseDir, target.artifact);
  if (target.archive === "tar.gz") await writeTarGz(packageRoot, packageName, artifactPath);
  else await writeZip(packageRoot, packageName, artifactPath);
  console.log(`created ${path.relative(root, artifactPath)}`);
}

await writeFile(path.join(releaseDir, "manifest.json"), `${JSON.stringify({ createdAt: new Date().toISOString(), targets: releaseTargets }, null, 2)}\n`, "utf8");

async function stagePackage(packageRoot, target) {
  await mkdir(packageRoot, { recursive: true });
  for (const item of ["dist", "assets", "docs", "skills"]) {
    await cp(path.join(root, item), path.join(packageRoot, item), { recursive: true });
  }
  for (const item of ["package.json", "README.md", "LICENSE"]) {
    await cp(path.join(root, item), path.join(packageRoot, item));
  }
  await mkdir(path.join(packageRoot, "bin"), { recursive: true });
  const sh = `#!/usr/bin/env sh\nset -eu\nDIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nexec node "$DIR/../dist/cli.js" "$@"\n`;
  const cmd = `@echo off\r\nsetlocal\r\nset DIR=%~dp0\r\nnode "%DIR%..\\dist\\cli.js" %*\r\n`;
  await writeFile(path.join(packageRoot, "bin", "ultrabuild"), sh, "utf8");
  await writeFile(path.join(packageRoot, "bin", "ultrabuild.cmd"), cmd, "utf8");
  await chmod(path.join(packageRoot, "bin", "ultrabuild"), 0o755);
  await chmod(path.join(packageRoot, "dist", "cli.js"), 0o755).catch(() => {});
  await writeFile(path.join(packageRoot, "TARGET.txt"), `${target.os}/${target.arch}\n`, "utf8");
}

function run(command, args) {
  const useShell = process.platform === "win32" && command.toLowerCase().endsWith(".cmd");
  const child = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: useShell });
  if (child.error) {
    console.error(child.error.message);
    process.exit(1);
  }
  if (child.status !== 0) process.exit(child.status ?? 1);
}

async function collectEntries(sourceRoot, packageName) {
  const entries = [];
  async function walk(abs, rel) {
    const info = await stat(abs);
    if (info.isDirectory()) {
      const dirRel = rel ? `${packageName}/${rel}/` : `${packageName}/`;
      entries.push({ abs, rel: dirRel.replace(/\\/g, "/"), dir: true, mode: 0o755, data: Buffer.alloc(0) });
      for (const child of await readdir(abs)) await walk(path.join(abs, child), path.join(rel, child));
      return;
    }
    if (!info.isFile()) return;
    const data = await readFile(abs);
    const mode = rel.endsWith("bin/ultrabuild") || rel.endsWith("dist/cli.js") ? 0o755 : 0o644;
    entries.push({ abs, rel: `${packageName}/${rel}`.replace(/\\/g, "/"), dir: false, mode, data });
  }
  await walk(sourceRoot, "");
  return entries;
}

async function writeTarGz(sourceRoot, packageName, artifactPath) {
  const entries = await collectEntries(sourceRoot, packageName);
  const blocks = [];
  for (const entry of entries) blocks.push(tarEntry(entry));
  blocks.push(Buffer.alloc(1024));
  await writeFile(artifactPath, gzipSync(Buffer.concat(blocks), { level: 9 }));
}

function tarEntry(entry) {
  const name = Buffer.from(entry.rel, "utf8");
  const header = Buffer.alloc(512, 0);
  name.copy(header, 0, 0, Math.min(name.length, 100));
  writeOctal(header, 100, 8, entry.mode);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, entry.dir ? 0 : entry.data.length);
  writeOctal(header, 136, 12, Math.floor(Date.now() / 1000));
  header.fill(0x20, 148, 156);
  header[156] = entry.dir ? 53 : 48;
  Buffer.from("ustar\0", "ascii").copy(header, 257);
  Buffer.from("00", "ascii").copy(header, 263);
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  writeOctal(header, 148, 8, checksum);
  if (entry.dir) return header;
  const pad = (512 - (entry.data.length % 512)) % 512;
  return Buffer.concat([header, entry.data, Buffer.alloc(pad)]);
}

function writeOctal(buffer, offset, length, value) {
  const text = value.toString(8).padStart(length - 1, "0").slice(0, length - 1);
  buffer.write(text, offset, length - 1, "ascii");
  buffer[offset + length - 1] = 0;
}

async function writeZip(sourceRoot, packageName, artifactPath) {
  const entries = await collectEntries(sourceRoot, packageName);
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.rel, "utf8");
    const data = entry.dir ? Buffer.alloc(0) : entry.data;
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, data);
    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x031e, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(((entry.dir ? 0x41ed : entry.mode === 0o755 ? 0x81ed : 0x81a4) * 0x10000) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);
    offset += local.length + data.length;
  }
  const centralOffset = offset;
  const centralData = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralData.length, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);
  await writeFile(artifactPath, Buffer.concat([...locals, centralData, end]));
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrcTable() {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  return crcTable;
}
