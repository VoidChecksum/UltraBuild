# Architecture

UltraBuild is a small TypeScript harness with explicit seams.

## Core modules

- `config.ts`: loads `~/.ultrabuild/config.json` or `ULTRABUILD_HOME/config.json`.
- `providers.ts`: normalizes model providers behind `complete()`.
- `session.ts`: append-only JSONL session log.
- `tools.ts`: portable read/write/edit/bash/list/grep tools.
- `approval.ts`: write/edit/bash safety policy.
- `skills.ts`: markdown skill discovery.
- `agent.ts`: prompt assembly, tool-call parsing, session logging.
- `workers.ts`: first worker primitive.
- `doctor.ts`: runtime health checks.

## Design principles

1. Portable first: Node built-ins, path normalization, no POSIX-only core assumptions.
2. Adapter-driven: providers, OAuth stores, tools, and skills should be replaceable.
3. Safe by default: reads are easy; writes and shell need approval.
4. Inspectable: sessions are plain JSONL.
5. Incremental: MCP, LSP, ACP, TUI, and advanced OAuth are layered after the core contracts stabilize.
