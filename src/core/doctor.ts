import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "./config.js";
import { box, color, renderPill } from "./ui.js";
import { getVibeStatus } from "./vibe.js";

export interface DoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface DoctorReport {
  checks: DoctorCheck[];
  ok: boolean;
}

export async function runDoctor(options: { home: string; cwd: string }): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];
  checks.push({ name: "node", ok: Number(process.versions.node.split(".")[0]) >= 20, detail: `Node ${process.version}` });
  checks.push({ name: "platform", ok: true, detail: `${process.platform}/${process.arch}` });
  try {
    await mkdir(options.home, { recursive: true });
    await access(options.home);
    checks.push({ name: "home", ok: true, detail: options.home });
  } catch (error) {
    checks.push({ name: "home", ok: false, detail: String(error) });
  }
  try {
    const config = await loadConfig(options.home);
    checks.push({ name: "config", ok: true, detail: `${Object.keys(config.providers).length} provider(s), mode ${config.defaultMode}` });
  } catch (error) {
    checks.push({ name: "config", ok: false, detail: String(error) });
  }
  try {
    await access(path.resolve(options.cwd));
    checks.push({ name: "workspace", ok: true, detail: path.resolve(options.cwd) });
  } catch (error) {
    checks.push({ name: "workspace", ok: false, detail: String(error) });
  }
  const vibe = await getVibeStatus();
  checks.push({ name: "vibe-island", ok: true, detail: vibe.reachable ? `reachable at ${vibe.path}` : `not running (${vibe.path})` });
  return { checks, ok: checks.every((check) => check.ok) };
}

export function formatDoctor(report: DoctorReport): string {
  return box(
    `${color("UltraBuild", "cyan")} doctor ${report.ok ? renderPill("healthy", "green") : renderPill("attention", "danger")}`,
    report.checks.map((check) => `${check.ok ? color("✓", "green") : color("✗", "danger")} ${check.name}: ${check.detail}`).join("\n"),
  );
}
