# Research

UltraBuild's MVP design was informed by a breadth-first survey of major agentic coding CLIs and workflow layers:

- OpenAI Codex CLI
- Claude Code
- Google Gemini CLI
- Kimi Code CLI
- OpenCode and Crush
- Qwen Code
- Pi CLI
- Aider
- Goose
- OpenHands
- Plandex
- Open Interpreter
- Continue CLI
- OpenClaw
- Oh My Codex
- Claude Code Superpowers
- OpenClaude

See the local research synthesis created during project planning for the detailed capability matrix and design rationale.

Core conclusion: UltraBuild should start as a standalone, portable, adapter-driven TypeScript harness with a small reliable core and strong workflow primitives. Full TUI, MCP, ACP, LSP, proprietary OAuth adapters, and advanced multi-agent orchestration should layer on after v0.1.
