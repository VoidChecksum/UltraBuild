import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { ApprovalConfig } from "./config.js";

export interface ApprovalRequest {
  tool: string;
  summary: string;
  kind: "read" | "write" | "bash";
}

export async function approve(request: ApprovalRequest, config: ApprovalConfig, yes: boolean): Promise<boolean> {
  if (yes || config.mode === "auto") return true;
  if (config.mode === "deny") return request.kind === "read" && config.allowRead;
  if (request.kind === "read") return config.allowRead;
  if (request.kind === "write" && config.allowWrite) return true;
  if (request.kind === "bash" && config.allowBash) return true;

  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`Approve ${request.tool}: ${request.summary}? [y/N] `);
    return answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}

export function dangerousCommand(command: string): boolean {
  return /\b(rm\s+-rf\s+\/|mkfs|dd\s+if=|shutdown|reboot|:(){:|chmod\s+-R\s+777)\b/.test(command);
}
