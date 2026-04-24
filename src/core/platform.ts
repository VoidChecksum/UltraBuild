import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function getUltraBuildHome(env: NodeJS.ProcessEnv = process.env): string {
  return path.resolve(env.ULTRABUILD_HOME || path.join(os.homedir(), ".ultrabuild"));
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export function resolveInside(baseDir: string, requestedPath: string): string {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, requestedPath || ".");
  const relative = path.relative(base, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return target;
  }
  throw new Error(`Path escapes outside workspace: ${requestedPath}`);
}

export function defaultShell(): { command: string; args: string[] } {
  if (process.platform === "win32") {
    return { command: process.env.ComSpec || "powershell.exe", args: [] };
  }
  return { command: process.env.SHELL || "/bin/sh", args: [] };
}
