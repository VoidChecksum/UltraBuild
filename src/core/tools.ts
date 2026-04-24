import { spawn } from "node:child_process";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { dangerousCommand } from "./approval.js";
import { defaultShell, resolveInside } from "./platform.js";

export interface JsonSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface ToolContext {
  cwd: string;
  yes: boolean;
}

export interface ToolResult {
  output: string;
  isError?: boolean;
}

export interface ToolDefinition<TInput = Record<string, unknown>> {
  name: string;
  description: string;
  parameters: JsonSchema;
  requiresApproval: boolean;
  approvalKind: "read" | "write" | "bash";
  run(input: TInput, ctx: ToolContext): Promise<ToolResult>;
}

export type ToolMap = Record<string, ToolDefinition<any>>;

export function createDefaultTools(): ToolMap {
  return {
    read: {
      name: "read",
      description: "Read a UTF-8 text file inside the workspace.",
      parameters: objectSchema({ path: { type: "string" } }, ["path"]),
      requiresApproval: false,
      approvalKind: "read",
      async run(input: { path: string }, ctx) {
        return { output: await readFile(resolveInside(ctx.cwd, input.path), "utf8") };
      },
    },
    write: {
      name: "write",
      description: "Write a UTF-8 text file inside the workspace.",
      parameters: objectSchema({ path: { type: "string" }, content: { type: "string" } }, ["path", "content"]),
      requiresApproval: true,
      approvalKind: "write",
      async run(input: { path: string; content: string }, ctx) {
        const target = resolveInside(ctx.cwd, input.path);
        await writeFile(target, input.content, "utf8");
        return { output: `Wrote ${input.path}` };
      },
    },
    edit: {
      name: "edit",
      description: "Replace exact text in a UTF-8 file inside the workspace.",
      parameters: objectSchema({ path: { type: "string" }, oldText: { type: "string" }, newText: { type: "string" } }, ["path", "oldText", "newText"]),
      requiresApproval: true,
      approvalKind: "write",
      async run(input: { path: string; oldText: string; newText: string }, ctx) {
        const target = resolveInside(ctx.cwd, input.path);
        const original = await readFile(target, "utf8");
        const count = original.split(input.oldText).length - 1;
        if (count !== 1) throw new Error(`edit expected exactly one match, found ${count}`);
        await writeFile(target, original.replace(input.oldText, input.newText), "utf8");
        return { output: `Edited ${input.path}` };
      },
    },
    bash: {
      name: "bash",
      description: "Run a shell command in the workspace.",
      parameters: objectSchema({ command: { type: "string" } }, ["command"]),
      requiresApproval: true,
      approvalKind: "bash",
      async run(input: { command: string }, ctx) {
        if (dangerousCommand(input.command) && !ctx.yes) throw new Error("Dangerous command requires --yes");
        return runShell(input.command, ctx.cwd);
      },
    },
    list: {
      name: "list",
      description: "List files in a directory inside the workspace.",
      parameters: objectSchema({ path: { type: "string" } }, ["path"]),
      requiresApproval: false,
      approvalKind: "read",
      async run(input: { path: string }, ctx) {
        const dir = resolveInside(ctx.cwd, input.path || ".");
        const entries = await readdir(dir, { withFileTypes: true });
        return { output: entries.map((entry) => `${entry.isDirectory() ? "dir " : "file"}\t${entry.name}`).join("\n") };
      },
    },
    grep: {
      name: "grep",
      description: "Search text files for a regular expression inside the workspace.",
      parameters: objectSchema({ pattern: { type: "string" }, path: { type: "string" } }, ["pattern"]),
      requiresApproval: false,
      approvalKind: "read",
      async run(input: { pattern: string; path?: string }, ctx) {
        const root = resolveInside(ctx.cwd, input.path || ".");
        const regex = new RegExp(input.pattern, "i");
        const matches: string[] = [];
        await walkText(root, async (file) => {
          const text = await readFile(file, "utf8").catch(() => "");
          const lines = text.split(/\r?\n/);
          lines.forEach((line, index) => {
            if (regex.test(line)) matches.push(`${path.relative(ctx.cwd, file)}:${index + 1}:${line}`);
          });
        });
        return { output: matches.join("\n") };
      },
    },
  };
}

function objectSchema(properties: Record<string, unknown>, required: string[]): JsonSchema {
  return { type: "object", properties, required };
}

async function runShell(command: string, cwd: string): Promise<ToolResult> {
  const shell = defaultShell();
  const isWindows = process.platform === "win32";
  const args = isWindows && /powershell/i.test(shell.command) ? ["-NoProfile", "-Command", command] : ["-lc", command];
  return new Promise((resolve) => {
    const child = spawn(shell.command, args, { cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    child.on("close", (code) => {
      resolve({ output: `${stdout}${stderr}`.trim(), isError: code !== 0 });
    });
    child.on("error", (error) => resolve({ output: error.message, isError: true }));
  });
}

async function walkText(fileOrDir: string, visit: (file: string) => Promise<void>): Promise<void> {
  const info = await stat(fileOrDir);
  if (info.isDirectory()) {
    const entries = await readdir(fileOrDir);
    for (const entry of entries) {
      if (["node_modules", ".git", "dist"].includes(entry)) continue;
      await walkText(path.join(fileOrDir, entry), visit);
    }
  } else if (info.isFile() && info.size < 1_000_000) {
    await visit(fileOrDir);
  }
}
