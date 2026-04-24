import net from "node:net";
import os from "node:os";
import path from "node:path";

export type VibeHookEventName =
  | "SessionStart"
  | "UserPromptSubmit"
  | "PreToolUse"
  | "PostToolUse"
  | "PermissionRequest"
  | "Stop"
  | "Notification"
  | "SessionEnd";

export interface VibeEvent {
  session_id: string;
  hook_event_name: VibeHookEventName;
  cwd?: string;
  tool_name?: string;
  tool_input?: unknown;
  prompt?: string;
  last_assistant_message?: string;
  _source: "ultrabuild";
  _ppid: number;
  _tty?: string;
  _env: Record<string, string>;
}

export interface VibeOptions {
  home?: string;
  enabled?: boolean;
  timeoutMs?: number;
}

export interface VibeSendResult {
  sent: boolean;
  path: string;
  error?: string;
}

export function createVibeEvent(input: {
  sessionId: string;
  hookEventName: VibeHookEventName;
  cwd?: string;
  toolName?: string;
  toolInput?: unknown;
  prompt?: string;
  lastAssistantMessage?: string;
}): VibeEvent {
  return {
    session_id: input.sessionId,
    hook_event_name: input.hookEventName,
    cwd: input.cwd,
    tool_name: input.toolName,
    tool_input: input.toolInput,
    prompt: input.prompt,
    last_assistant_message: input.lastAssistantMessage,
    _source: "ultrabuild",
    _ppid: process.pid,
    _tty: getTty(),
    _env: envSnapshot(),
  };
}

export async function getVibeStatus(options: VibeOptions = {}): Promise<{ reachable: boolean; path: string; error?: string }> {
  const result = await sendRaw({ hook_event_name: "Notification", session_id: "ultrabuild-status", _source: "ultrabuild", _ppid: process.pid, _env: {} }, options);
  return { reachable: result.sent, path: result.path, error: result.error };
}

export async function sendVibeEvent(event: VibeEvent, options: VibeOptions = {}): Promise<VibeSendResult> {
  if (options.enabled === false) return { sent: false, path: vibePath(options), error: "disabled" };
  return sendRaw(event, options);
}

async function sendRaw(payload: unknown, options: VibeOptions): Promise<VibeSendResult> {
  const primary = vibePath(options);
  const paths = process.platform === "win32" ? [primary] : [primary, "/tmp/vibe-island.sock"];
  let lastError = "unreachable";
  for (const socketPath of paths) {
    const sent = await writeSocket(socketPath, JSON.stringify(payload), options.timeoutMs || 120).catch((error: Error) => {
      lastError = error.message;
      return false;
    });
    if (sent) return { sent: true, path: socketPath };
  }
  return { sent: false, path: primary, error: lastError };
}

function vibePath(options: VibeOptions): string {
  if (process.platform === "win32") return "\\\\.\\pipe\\vibe-island";
  return path.join(options.home || os.homedir(), ".vibe-island", "run", "vibe-island.sock");
}

function writeSocket(socketPath: string, message: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(socketPath);
    const timer = setTimeout(() => {
      client.destroy();
      reject(new Error("timeout"));
    }, timeoutMs);
    client.on("connect", () => {
      client.write(message);
      client.end();
    });
    client.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    client.on("close", () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

function getTty(): string | undefined {
  if (process.stdin.isTTY) return process.env.TTY;
  return process.env.TTY;
}

function envSnapshot(): Record<string, string> {
  const prefixes = ["TERM", "TMUX", "SSH_", "HYPRLAND", "WAYLAND", "XDG_", "DISPLAY", "COLORTERM"];
  return Object.fromEntries(Object.entries(process.env).filter(([key, value]) => value && prefixes.some((prefix) => key.startsWith(prefix))) as Array<[string, string]>);
}
