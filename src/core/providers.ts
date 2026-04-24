import type { ProviderConfig } from "./config.js";

export interface ToolPromptInfo {
  name: string;
  description: string;
  parameters: unknown;
}

export interface CompletionRequest {
  prompt: string;
  system: string;
  tools: ToolPromptInfo[];
  history?: Array<{ role: "user" | "assistant" | "tool"; content: string }>;
}

export interface CompletionResult {
  text: string;
  provider: string;
  model: string;
  raw?: unknown;
}

export interface Provider {
  name: string;
  model: string;
  complete(request: CompletionRequest): Promise<CompletionResult>;
}

export function createProvider(name: string, config: ProviderConfig): Provider {
  if (config.type === "mock") return new MockProvider(name, config.model || "mock-smart");
  if (config.type === "openai-compatible") return new OpenAICompatibleProvider(name, config);
  if (config.type === "anthropic") return new AnthropicProvider(name, config);
  return new OAuthAdapterPlaceholderProvider(name, config.adapter, config.model);
}

class MockProvider implements Provider {
  constructor(
    public readonly name: string,
    public readonly model: string,
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const toolNames = request.tools.map((tool) => tool.name).join(", ") || "none";
    return {
      text: `UltraBuild mock response for: ${request.prompt}\n\nTools available: ${toolNames}`,
      provider: this.name,
      model: this.model,
    };
  }
}

class OpenAICompatibleProvider implements Provider {
  public readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKeyEnv: string;

  constructor(
    public readonly name: string,
    config: Extract<ProviderConfig, { type: "openai-compatible" }>,
  ) {
    this.model = config.model;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKeyEnv = config.apiKeyEnv;
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const apiKey = process.env[this.apiKeyEnv];
    if (!apiKey) throw new Error(`Missing API key environment variable: ${this.apiKeyEnv}`);
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: toChatMessages(request),
        temperature: 0.2,
      }),
    });
    if (!response.ok) throw new Error(`OpenAI-compatible request failed: ${response.status} ${await response.text()}`);
    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return {
      text: json.choices?.[0]?.message?.content || "",
      provider: this.name,
      model: this.model,
      raw: json,
    };
  }
}

class AnthropicProvider implements Provider {
  public readonly model: string;
  private readonly apiKeyEnv: string;
  private readonly baseUrl: string;

  constructor(
    public readonly name: string,
    config: Extract<ProviderConfig, { type: "anthropic" }>,
  ) {
    this.model = config.model;
    this.apiKeyEnv = config.apiKeyEnv;
    this.baseUrl = (config.baseUrl || "https://api.anthropic.com").replace(/\/$/, "");
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const apiKey = process.env[this.apiKeyEnv];
    if (!apiKey) throw new Error(`Missing API key environment variable: ${this.apiKeyEnv}`);
    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: request.system,
        messages: toAnthropicMessages(request),
      }),
    });
    if (!response.ok) throw new Error(`Anthropic request failed: ${response.status} ${await response.text()}`);
    const json = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
    return {
      text: (json.content || []).filter((part) => part.type === "text").map((part) => part.text || "").join(""),
      provider: this.name,
      model: this.model,
      raw: json,
    };
  }
}

class OAuthAdapterPlaceholderProvider implements Provider {
  constructor(
    public readonly name: string,
    private readonly adapter: string,
    public readonly model: string,
  ) {}

  async complete(): Promise<CompletionResult> {
    throw new Error(`OAuth adapter '${this.adapter}' is planned but not enabled in UltraBuild v0.1. Use API-key providers or mock.`);
  }
}

function toChatMessages(request: CompletionRequest): Array<{ role: string; content: string }> {
  return [
    { role: "system", content: request.system },
    ...(request.history || []),
    { role: "user", content: request.prompt },
  ];
}

function toAnthropicMessages(request: CompletionRequest): Array<{ role: "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const item of request.history || []) {
    if (item.role === "assistant") messages.push({ role: "assistant", content: item.content });
    else messages.push({ role: "user", content: item.content });
  }
  messages.push({ role: "user", content: request.prompt });
  return messages;
}
