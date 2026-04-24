import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureDir } from "./platform.js";

export type ApprovalMode = "ask" | "auto" | "deny";

export interface ApprovalConfig {
  mode: ApprovalMode;
  allowRead: boolean;
  allowWrite: boolean;
  allowBash: boolean;
}

export type ProviderConfig =
  | { type: "mock"; model?: string }
  | {
      type: "openai-compatible";
      baseUrl: string;
      apiKeyEnv: string;
      model: string;
    }
  | {
      type: "anthropic";
      apiKeyEnv: string;
      model: string;
      baseUrl?: string;
    }
  | {
      type: "oauth-adapter";
      adapter: "pi" | "codex" | "claude" | "gemini" | "kimi";
      model: string;
    };

export interface UltraBuildConfig {
  defaultProvider: string;
  defaultModel: string;
  approval: ApprovalConfig;
  providers: Record<string, ProviderConfig>;
}

export function defaultConfig(): UltraBuildConfig {
  return {
    defaultProvider: "mock",
    defaultModel: "mock-smart",
    approval: {
      mode: "ask",
      allowRead: true,
      allowWrite: false,
      allowBash: false,
    },
    providers: {
      mock: { type: "mock", model: "mock-smart" },
      openai: {
        type: "openai-compatible",
        baseUrl: "https://api.openai.com/v1",
        apiKeyEnv: "OPENAI_API_KEY",
        model: "gpt-4.1",
      },
      anthropic: {
        type: "anthropic",
        apiKeyEnv: "ANTHROPIC_API_KEY",
        model: "claude-sonnet-4-5",
        baseUrl: "https://api.anthropic.com",
      },
    },
  };
}

export async function loadConfig(home: string): Promise<UltraBuildConfig> {
  await ensureDir(home);
  const file = path.join(home, "config.json");
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as Partial<UltraBuildConfig>;
    return mergeConfig(defaultConfig(), parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const config = defaultConfig();
    await saveConfig(home, config);
    return config;
  }
}

export async function saveConfig(home: string, config: UltraBuildConfig): Promise<void> {
  await ensureDir(home);
  await writeFile(path.join(home, "config.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function mergeConfig(base: UltraBuildConfig, override: Partial<UltraBuildConfig>): UltraBuildConfig {
  return {
    ...base,
    ...override,
    approval: { ...base.approval, ...(override.approval || {}) },
    providers: { ...base.providers, ...(override.providers || {}) },
  };
}
