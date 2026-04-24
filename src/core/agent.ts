import path from "node:path";
import { approve } from "./approval.js";
import type { UltraBuildConfig } from "./config.js";
import { createProvider } from "./providers.js";
import { SessionStore } from "./session.js";
import { renderSkillsForPrompt, type Skill } from "./skills.js";
import { createDefaultTools, type ToolMap } from "./tools.js";

export interface AgentRunOptions {
  prompt: string;
  config: UltraBuildConfig;
  home: string;
  cwd: string;
  providerName?: string;
  print: boolean;
  yes: boolean;
  skills?: Skill[];
}

export interface AgentRunResult {
  text: string;
  sessionId: string;
}

interface ParsedToolCall {
  tool: string;
  input: Record<string, unknown>;
}

export async function runAgentTurn(options: AgentRunOptions): Promise<AgentRunResult> {
  const providerName = options.providerName || options.config.defaultProvider;
  const providerConfig = options.config.providers[providerName];
  if (!providerConfig) throw new Error(`Unknown provider: ${providerName}`);
  const provider = createProvider(providerName, providerConfig);
  const tools = createDefaultTools();
  const session = await SessionStore.create(options.home);
  await session.append("user", { prompt: options.prompt, provider: providerName });

  const system = buildSystemPrompt(tools, options.skills || []);
  let currentPrompt = options.prompt;
  let finalText = "";
  for (let step = 0; step < 4; step++) {
    const result = await provider.complete({
      prompt: currentPrompt,
      system,
      tools: Object.values(tools).map((tool) => ({ name: tool.name, description: tool.description, parameters: tool.parameters })),
    });
    finalText = result.text;
    await session.append("assistant", result);
    const calls = parseToolCalls(result.text);
    if (!calls.length) break;
    const toolOutputs: string[] = [];
    for (const call of calls) {
      const tool = tools[call.tool];
      if (!tool) {
        toolOutputs.push(`Tool ${call.tool} not found.`);
        continue;
      }
      const allowed = await approve(
        { tool: tool.name, summary: JSON.stringify(call.input), kind: tool.approvalKind },
        options.config.approval,
        options.yes,
      );
      await session.append("approval", { tool: tool.name, approved: allowed, input: call.input });
      if (!allowed) {
        toolOutputs.push(`Tool ${tool.name} denied.`);
        continue;
      }
      const output = await tool.run(call.input, { cwd: options.cwd, yes: options.yes });
      await session.append("tool", { tool: tool.name, input: call.input, output });
      toolOutputs.push(`Tool ${tool.name} result:\n${output.output}`);
    }
    currentPrompt = `Continue after these tool results:\n\n${toolOutputs.join("\n\n")}`;
  }
  return { text: finalText, sessionId: session.sessionId };
}

export function buildSystemPrompt(tools: ToolMap, skills: Skill[]): string {
  return `You are UltraBuild, a cross-platform agentic coding harness.\n\nWorkspace tools are available through fenced JSON blocks exactly like:\n\n\`\`\`json\n{"tool":"read","input":{"path":"README.md"}}\n\`\`\`\n\nAvailable tools:\n${Object.values(tools).map((tool) => `- ${tool.name}: ${tool.description}`).join("\n")}\n\nLoaded skills:\n${renderSkillsForPrompt(skills)}\n\nBe concise. Ask for tools only when needed. Respect user safety.`;
}

export function parseToolCalls(text: string): ParsedToolCall[] {
  const calls: ParsedToolCall[] = [];
  const fenced = /```json\s*([\s\S]*?)```/g;
  for (const match of text.matchAll(fenced)) {
    try {
      const parsed = JSON.parse(match[1] || "{}");
      if (typeof parsed.tool === "string" && typeof parsed.input === "object" && parsed.input) {
        calls.push({ tool: parsed.tool, input: parsed.input as Record<string, unknown> });
      }
    } catch {
      // Ignore malformed tool suggestions; the model can try again.
    }
  }
  return calls;
}

export function builtInSkillsDir(repoRoot: string): string {
  return path.join(repoRoot, "skills");
}
