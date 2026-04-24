#!/usr/bin/env node
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAgentTurn } from "./core/agent.js";
import { loadConfig } from "./core/config.js";
import { formatDoctor, runDoctor } from "./core/doctor.js";
import { getUltraBuildHome } from "./core/platform.js";
import { loadSkills } from "./core/skills.js";
import { runMockWorkers } from "./core/workers.js";

interface CliOptions {
  command?: string;
  prompt?: string;
  print: boolean;
  yes: boolean;
  provider?: string;
  count: number;
}

const repoRoot = findRepoRoot(path.dirname(fileURLToPath(import.meta.url)));

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.command === "help" || process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(helpText());
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

  if (options.command === "init") {
    const config = await loadConfig(home);
    console.log(`UltraBuild initialized at ${home} with providers: ${Object.keys(config.providers).join(", ")}`);
    return;
  }

  if (options.command === "workers") {
    const prompt = options.prompt || "";
    const results = await runMockWorkers({ count: options.count, prompt, home });
    for (const result of results) console.log(`[worker ${result.id}] ${result.text}\nlog: ${result.logFile}`);
    return;
  }

  if (options.print || options.prompt) {
    const config = await loadConfig(home);
    const skills = await loadAllSkills(home);
    const result = await runAgentTurn({ prompt: options.prompt || "", config, home, cwd, providerName: options.provider, print: true, yes: options.yes, skills });
    console.log(result.text);
    console.error(`\nSession: ${result.sessionId}`);
    return;
  }

  await interactive(home, cwd, options.provider, options.yes);
}

async function interactive(home: string, cwd: string, provider: string | undefined, yes: boolean): Promise<void> {
  const config = await loadConfig(home);
  const skills = await loadAllSkills(home);
  const rl = readline.createInterface({ input, output });
  console.log("UltraBuild interactive mode. Type /help, /exit, /skill <name>, or a prompt.");
  try {
    while (true) {
      const prompt = await rl.question("ultrabuild> ");
      if (!prompt.trim()) continue;
      if (["/exit", "/quit"].includes(prompt.trim())) break;
      if (prompt.trim() === "/help") {
        console.log(helpText());
        continue;
      }
      if (prompt.startsWith("/skill")) {
        console.log(skills.map((skill) => `- ${skill.name}`).join("\n") || "No skills loaded.");
        continue;
      }
      const result = await runAgentTurn({ prompt, config, home, cwd, providerName: provider, print: false, yes, skills });
      console.log(result.text);
    }
  } finally {
    rl.close();
  }
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
  const options: CliOptions = { print: false, yes: false, count: 1 };
  const positional: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--print" || arg === "-p") options.print = true;
    else if (arg === "--yes" || arg === "-y") options.yes = true;
    else if (arg === "--provider") options.provider = args[++index];
    else if (arg === "--count") options.count = Number(args[++index] || "1");
    else if (["doctor", "init", "workers", "help"].includes(arg)) options.command = arg;
    else positional.push(arg);
  }
  options.prompt = positional.join(" ").trim();
  return options;
}

function helpText(): string {
  return `
UltraBuild — cross-platform agentic harness

Usage:
  ultrabuild                         Start interactive mode
  ultrabuild --print "prompt"         Run one prompt and exit
  ultrabuild --provider mock --print "hello"
  ultrabuild doctor                  Check runtime/config health
  ultrabuild init                    Create default config
  ultrabuild workers --count 2 "task" Spawn mock worker agents

Options:
  --provider <name>                  Provider from ~/.ultrabuild/config.json
  --print, -p                        Print mode
  --yes, -y                          Auto-approve write/edit/bash tool calls
  --count <n>                        Worker count
  --help, -h                         Show help

Environment:
  ULTRABUILD_HOME                    Override ~/.ultrabuild
  OPENAI_API_KEY                     OpenAI-compatible provider key
  ANTHROPIC_API_KEY                  Anthropic provider key
`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
