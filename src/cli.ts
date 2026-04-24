#!/usr/bin/env node
import { existsSync } from "node:fs";
import readline from "node:readline/promises";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { runAgentTurn } from "./core/agent.js";
import { loadConfig } from "./core/config.js";
import { formatDoctor, runDoctor } from "./core/doctor.js";
import { getMode, listModes, type ModeName } from "./core/modes.js";
import { getUltraBuildHome } from "./core/platform.js";
import { loadSkills } from "./core/skills.js";
import { box, color, renderHelp, renderPill, renderStatus, section, splash } from "./core/ui.js";
import { createVibeEvent, getVibeStatus, sendVibeEvent } from "./core/vibe.js";
import { runMockWorkers } from "./core/workers.js";

interface CliOptions {
  command?: string;
  subcommand?: string;
  prompt?: string;
  print: boolean;
  yes: boolean;
  noVibe: boolean;
  provider?: string;
  mode?: ModeName;
  count: number;
}

const repoRoot = findRepoRoot(path.dirname(fileURLToPath(import.meta.url)));

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.command === "help" || process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(renderHelp());
    return;
  }

  const home = getUltraBuildHome();
  const cwd = process.cwd();
  if (options.command === "doctor") {
    const report = await runDoctor({ home, cwd });
    console.log(formatDoctor(report));
    process.exitCode = report.ok ? 0 : 1;
    return;
  }

  if (options.command === "vibe") {
    await runVibeCommand(options, home, cwd);
    return;
  }

  if (options.command === "init") {
    const config = await loadConfig(home);
    console.log(box("INIT", `UltraBuild home: ${home}\nProviders: ${Object.keys(config.providers).join(", ")}\nDefault mode: ${config.defaultMode}`));
    return;
  }

  if (options.command === "workers") {
    const prompt = options.prompt || "";
    const results = await runMockWorkers({ count: options.count, prompt, home });
    console.log(section("WORKERS", results.map((result) => `${renderPill(`worker ${result.id}`, "green")} ${result.text}\n${color("log:", "muted")} ${result.logFile}`).join("\n\n")));
    return;
  }

  if (options.print || options.prompt) {
    const config = await loadConfig(home);
    const skills = await loadAllSkills(home);
    const mode = options.mode || config.defaultMode;
    const result = await runAgentTurn({ prompt: options.prompt || "", config, home, cwd, providerName: options.provider, modeName: mode, print: true, yes: options.yes, vibeEnabled: !options.noVibe, skills });
    console.log(renderStatus({ provider: result.provider, mode: result.mode, session: result.sessionId.slice(0, 8), os: process.platform }));
    console.log(section("ASSISTANT", result.text));
    console.error(section("SESSION", result.sessionId));
    return;
  }

  await interactive(home, cwd, options.provider, options.mode, options.yes, !options.noVibe);
}

async function interactive(home: string, cwd: string, provider: string | undefined, initialMode: ModeName | undefined, yes: boolean, vibeEnabled: boolean): Promise<void> {
  const config = await loadConfig(home);
  const skills = await loadAllSkills(home);
  let mode = initialMode || config.defaultMode;
  const rl = readline.createInterface({ input, output });
  console.log(splash());
  console.log(renderStatus({ provider: provider || config.defaultProvider, mode, os: process.platform }));
  try {
    while (true) {
      const prompt = await rl.question(`${color("UltraBuild", "cyan")} ${color("▸", "pink")} `);
      if (!prompt.trim()) continue;
      if (["/exit", "/quit"].includes(prompt.trim())) break;
      if (prompt.trim() === "/help") {
        console.log(renderHelp());
        continue;
      }
      if (prompt.trim() === "/theme") {
        console.log(box("THEME", "neon forge · cyan/violet/pink · Flux mascot"));
        continue;
      }
      if (prompt.trim() === "/doctor") {
        console.log(formatDoctor(await runDoctor({ home, cwd })));
        continue;
      }
      if (prompt.trim() === "/skills" || prompt.startsWith("/skill")) {
        console.log(section("SKILLS", skills.map((skill) => `- ${skill.name}`).join("\n") || "No skills loaded."));
        continue;
      }
      if (prompt.startsWith("/mode")) {
        const requested = prompt.split(/\s+/)[1];
        if (!requested) console.log(section("MODES", listModes().map((item) => `${item.name}: ${item.description}`).join("\n")));
        else {
          mode = getMode(requested).name;
          console.log(renderStatus({ mode }));
        }
        continue;
      }
      if (prompt.startsWith("/workers")) {
        const [, countRaw, ...rest] = prompt.split(/\s+/);
        const results = await runMockWorkers({ count: Number(countRaw || "1"), prompt: rest.join(" "), home });
        console.log(section("WORKERS", results.map((result) => `${result.id}. ${result.text}`).join("\n")));
        continue;
      }
      const result = await runAgentTurn({ prompt, config, home, cwd, providerName: provider, modeName: mode, print: false, yes, vibeEnabled, skills });
      console.log(renderStatus({ provider: result.provider, mode: result.mode, session: result.sessionId.slice(0, 8) }));
      console.log(section("ASSISTANT", result.text));
    }
  } finally {
    rl.close();
  }
}

async function runVibeCommand(options: CliOptions, home: string, cwd: string): Promise<void> {
  if (options.subcommand === "test") {
    const event = createVibeEvent({ sessionId: `ultrabuild-test-${Date.now()}`, hookEventName: "SessionStart", cwd, prompt: "UltraBuild Vibe Island test" });
    const result = await sendVibeEvent(event, { enabled: !options.noVibe });
    console.log(box("VIBE TEST", `${result.sent ? "sent" : "not sent"}\npath: ${result.path}\n${result.error ? `error: ${result.error}` : ""}`));
    return;
  }
  const status = await getVibeStatus({ enabled: !options.noVibe });
  console.log(box("VIBE STATUS", `${status.reachable ? color("reachable", "green") : color("not running", "muted")}\npath: ${status.path}\n${status.error ? `error: ${status.error}` : ""}`));
}

async function loadAllSkills(home: string) {
  return loadSkills([path.join(repoRoot, "skills"), path.join(home, "skills"), path.join(process.cwd(), ".ultrabuild", "skills")]);
}

function findRepoRoot(start: string): string {
  let current = path.resolve(start);
  while (true) {
    if (existsSync(path.join(current, "package.json")) && existsSync(path.join(current, "skills"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(start, "..");
    current = parent;
  }
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { print: false, yes: false, noVibe: false, count: 1 };
  const positional: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--print" || arg === "-p") options.print = true;
    else if (arg === "--yes" || arg === "-y") options.yes = true;
    else if (arg === "--no-vibe") options.noVibe = true;
    else if (arg === "--provider") options.provider = args[++index];
    else if (arg === "--mode") options.mode = getMode(args[++index]).name;
    else if (arg === "--count") options.count = Number(args[++index] || "1");
    else if (["doctor", "init", "workers", "help", "vibe"].includes(arg)) {
      options.command = arg;
      if (arg === "vibe" && args[index + 1] && !args[index + 1].startsWith("--")) options.subcommand = args[++index];
    } else positional.push(arg);
  }
  options.prompt = positional.join(" ").trim();
  return options;
}

main().catch((error) => {
  console.error(section("ERROR", error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
