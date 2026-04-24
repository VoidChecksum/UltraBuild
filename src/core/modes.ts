export type ModeName = "chat" | "build" | "plan" | "review" | "debug" | "workers" | "yolo";

export interface ModeDefinition {
  name: ModeName;
  label: string;
  description: string;
  promptAddendum: string;
  readOnly: boolean;
  autoApprove: boolean;
  allowedTools: string[] | "all";
  warning?: string;
}

const modes: ModeDefinition[] = [
  {
    name: "chat",
    label: "Chat",
    description: "General conversation and light repository help.",
    promptAddendum: "Default to concise answers. Use tools only when useful.",
    readOnly: false,
    autoApprove: false,
    allowedTools: "all",
  },
  {
    name: "build",
    label: "Build",
    description: "Implementation mode with all tools available behind approvals.",
    promptAddendum: "Focus on implementation, verification, and clean diffs.",
    readOnly: false,
    autoApprove: false,
    allowedTools: "all",
  },
  {
    name: "plan",
    label: "Plan",
    description: "Read-only planning and research mode.",
    promptAddendum: "You are in read-only planning mode. Do not write files or run mutating commands.",
    readOnly: true,
    autoApprove: false,
    allowedTools: ["read", "list", "grep"],
  },
  {
    name: "review",
    label: "Review",
    description: "Read-only code review mode.",
    promptAddendum: "Review for correctness, security, portability, and test coverage. Do not modify files.",
    readOnly: true,
    autoApprove: false,
    allowedTools: ["read", "list", "grep"],
  },
  {
    name: "debug",
    label: "Debug",
    description: "Systematic debugging mode.",
    promptAddendum: "Reproduce, gather evidence, isolate cause, fix minimally, verify.",
    readOnly: false,
    autoApprove: false,
    allowedTools: "all",
  },
  {
    name: "workers",
    label: "Workers",
    description: "Coordinate worker agents and summarize results.",
    promptAddendum: "Break work into independent tasks and report worker outputs clearly.",
    readOnly: false,
    autoApprove: false,
    allowedTools: "all",
  },
  {
    name: "yolo",
    label: "YOLO",
    description: "Trusted automation mode with automatic approvals.",
    promptAddendum: "Auto-approval is enabled. Be extra careful and verify before destructive actions.",
    readOnly: false,
    autoApprove: true,
    allowedTools: "all",
    warning: "Danger: yolo mode auto-approves write/edit/bash tool calls.",
  },
];

export function listModes(): ModeDefinition[] {
  return [...modes];
}

export function getMode(name: string | undefined): ModeDefinition {
  const found = modes.find((mode) => mode.name === (name || "chat"));
  if (!found) throw new Error(`Unknown UltraBuild mode: ${name}`);
  return found;
}

export function toolAllowedInMode(toolName: string, mode: ModeDefinition): boolean {
  return mode.allowedTools === "all" || mode.allowedTools.includes(toolName);
}
