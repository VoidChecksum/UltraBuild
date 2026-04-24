# Providers

UltraBuild v0.1 supports three provider types.

## mock

Deterministic offline provider used for tests and demos.

## openai-compatible

Uses `/v1/chat/completions` with an API key environment variable.

```json
{
  "type": "openai-compatible",
  "baseUrl": "https://api.openai.com/v1",
  "apiKeyEnv": "OPENAI_API_KEY",
  "model": "gpt-4.1"
}
```

Works with OpenAI-compatible services such as OpenAI, OpenRouter, LM Studio, vLLM, and compatible gateways when configured.

## anthropic

Uses Anthropic Messages API.

```json
{
  "type": "anthropic",
  "apiKeyEnv": "ANTHROPIC_API_KEY",
  "model": "claude-sonnet-4-5"
}
```

## OAuth adapters

Pi/Codex/Claude/Gemini/Kimi OAuth-store adapters are planned as plugins. They are intentionally not a v0.1 blocker because proprietary local auth formats can change.
