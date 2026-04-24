<p align="center">
  <img src="assets/ultrabuild-banner.svg" alt="UltraBuild banner with Flux mascot">
</p>

<p align="center">
  <a href="https://github.com/VoidChecksum/UltraBuild/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/VoidChecksum/UltraBuild/ci.yml?branch=main&style=for-the-badge"></a>
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D20-00e5ff?style=for-the-badge&logo=node.js&logoColor=white">
  <img alt="OS" src="https://img.shields.io/badge/Linux%20%7C%20macOS%20%7C%20Windows-supported-7c3aed?style=for-the-badge">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-ff2bd6?style=for-the-badge"></a>
</p>

# UltraBuild

**UltraBuild** is a standalone, cross-platform agentic harness for developers who want the provider freedom of Pi/OpenCode/Crush, the terminal power of Claude Code/Codex/Kimi/Gemini, and the workflow discipline of Superpowers/Oh-My-Codex.

> Build with every model. Ship with every agent. Control every tool.

Meet **Flux**, the UltraBuild forge-dragon: a neon mascot for fast, safe, portable agentic building.

<p align="center"><img src="assets/flux-mascot.svg" alt="Flux mascot" width="220"></p>

## MVP status

UltraBuild v0.1 is intentionally small but real:

- interactive and print-mode CLI
- OpenAI-compatible provider
- Anthropic provider
- deterministic mock provider for tests/offline demos
- JSONL sessions
- read/write/edit/bash/list/grep tools
- approval policy for write/edit/bash
- markdown skills
- simple worker spawning
- cross-platform `doctor`
- visual theme, mascot, docs, and CI

## Quickstart

```bash
git clone https://github.com/VoidChecksum/UltraBuild.git
cd UltraBuild
npm install
npm run build
node dist/cli.js doctor
node dist/cli.js --provider mock --print "hello UltraBuild"
```

Interactive mode:

```bash
node dist/cli.js
```

Workers:

```bash
node dist/cli.js workers --count 2 --provider mock "summarize this repository"
```

## Configure real providers

UltraBuild creates `~/.ultrabuild/config.json` on first run.

OpenAI-compatible:

```bash
export OPENAI_API_KEY="sk-..."
node dist/cli.js --provider openai --print "review this repo"
```

Anthropic:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
node dist/cli.js --provider anthropic --print "plan a refactor"
```

`ULTRABUILD_HOME` overrides the config/session directory.

## Commands

| Command | Purpose |
| --- | --- |
| `ultrabuild` | Interactive prompt |
| `ultrabuild --print "prompt"` | One-shot agent turn |
| `ultrabuild doctor` | Check Node, platform, config, workspace |
| `ultrabuild init` | Create default config |
| `ultrabuild workers --count 3 "task"` | Spawn mock worker summaries |

## Safety model

UltraBuild is an agentic harness. It can write files and run commands when you let it.

Defaults:

- read/list/grep allowed
- write/edit/bash require approval
- `--yes` auto-approves for automation
- dangerous shell patterns are flagged
- sessions log user prompts, assistant output, tool calls, and approval decisions

## OS compatibility

Official v0.1 support:

| OS | Status |
| --- | --- |
| Linux x64/arm64 | Supported |
| macOS x64/arm64 | Supported |
| Windows x64/arm64 | Supported through native Node/PowerShell/Windows Terminal |
| WSL2 | Supported |

Best effort: FreeBSD/OpenBSD/NetBSD, Termux/Android, Docker/devcontainers, and any platform with Node.js 20+.

## What UltraBuild learns from other agents

| Inspiration | Lesson applied |
| --- | --- |
| Pi CLI | Small core, broad provider/config surface, skills/extensibility mindset |
| Claude Code | Terminal-first agent, plugins, git/dev workflow orientation |
| Codex CLI | Lightweight local harness and ChatGPT/Codex-style workflow |
| Gemini CLI | OAuth-aware CLI, checkpointing, tools, MCP direction |
| Kimi Code | Shell-minded UX, ACP/MCP future, strong Python-agent architecture ideas |
| OpenCode / Crush | Plan/build agents, LSP/MCP direction, polished TUI aspirations |
| Qwen Code | Skills and subagents as first-class workflow units |
| Aider | Git-native practical editing discipline |
| Goose/OpenHands/OpenClaw | API/control-plane thinking, sandboxing, channels, extensibility |
| OMX/Superpowers | Process quality: brainstorm, plan, TDD, debug, review, verify |

## Architecture

```text
UltraBuild CLI
├─ command router: interactive, print, doctor, init, workers
├─ core runtime: config, sessions, providers, tools, skills, approvals
├─ providers: mock, OpenAI-compatible, Anthropic, future OAuth adapters
├─ tools: read, write, edit, bash, list, grep
├─ skills: markdown workflows
└─ workers: child/log based orchestration primitive
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Roadmap

- v0.2: native tool calling, MCP, richer worker orchestration
- v0.3: full-screen TUI, model switching, session resume/tree
- v0.4: LSP context, git worktree worker isolation, review gates
- v0.5: ACP/IDE adapters, OAuth adapter plugins, package marketplace

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT

<p align="center">
  <img src="assets/footer.svg" alt="UltraBuild footer">
</p>
