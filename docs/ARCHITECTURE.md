# Architecture

UltraBuild is a small TypeScript harness with explicit seams. The core stays dependency-light and portable; higher-level workflows layer on top through modes, skills, providers, workers, integrations, and release scripts.

## Core modules

- `config.ts`: loads `~/.ultrabuild/config.json` or `ULTRABUILD_HOME/config.json`.
- `providers.ts`: normalizes model providers behind `complete()`.
- `session.ts`: append-only JSONL session log.
- `tools.ts`: portable read/write/edit/bash/list/grep tools.
- `approval.ts`: write/edit/bash safety policy.
- `skills.ts`: markdown skill discovery.
- `modes.ts`: mode definitions and mode-aware tool restrictions.
- `ui.ts`: ANSI renderer for boxes, pills, sections, splash, and help.
- `vibe.ts`: best-effort Vibe Island socket/named-pipe event client.
- `agent.ts`: prompt assembly, mode application, tool-call parsing, session logging, Vibe events.
- `workers.ts`: first worker primitive.
- `doctor.ts`: runtime health checks.
- `release-targets.ts`: official OS/architecture release matrix.

## CLI flow

```text
src/cli.ts
├─ parse args / slash commands
├─ load config + skills
├─ choose provider + mode
├─ run agent turn or command
├─ render status/help/doctor output
└─ send best-effort Vibe Island events
```

## Agent turn flow

```text
prompt
  ↓
load mode + provider + skills + allowed tools
  ↓
append JSONL user event
  ↓
provider.complete(system, prompt, tools)
  ↓
parse fenced JSON tool calls
  ↓
approval policy / mode auto-approval
  ↓
tool execution + JSONL tool events
  ↓
continue until no tool calls or max steps
```

## Modes

Modes are first-class runtime constraints:

- `chat`: default conversational mode.
- `build`: implementation mode.
- `plan`: read/list/grep only.
- `review`: read/list/grep only.
- `debug`: evidence-first bug fixing.
- `workers`: worker orchestration.
- `yolo`: explicit auto-approval mode.

## Vibe Island integration

`vibe.ts` emits JSON compatible with `VoidChecksum/vibe-island`:

- `_source: "ultrabuild"`
- `session_id`
- `hook_event_name`
- `cwd`
- prompt/tool/assistant fields when relevant
- `_ppid`, `_tty`, `_env`

Transports:

- Unix: `~/.vibe-island/run/vibe-island.sock`, fallback `/tmp/vibe-island.sock`
- Windows: `\\.\\pipe\\vibe-island`

All sends are best-effort and non-blocking for the CLI user experience.

## Release architecture

Release scripts create portable bundles rather than native binaries:

- `scripts/package-release.mjs`: builds six official artifacts.
- `scripts/smoke-release.mjs`: unpacks tar/zip bundles and runs smoke checks.
- `scripts/e2e.mjs`: exercises CLI behavior from compiled output.

## Design principles

1. Portable first: Node built-ins, path normalization, no POSIX-only core assumptions.
2. Adapter-driven: providers, OAuth stores, tools, and skills should be replaceable.
3. Safe by default: reads are easy; writes and shell need approval.
4. Mode-aware: planning/review can be genuinely read-only.
5. Inspectable: sessions are plain JSONL.
6. Incremental: MCP, LSP, ACP, TUI, and advanced OAuth layer after core contracts stabilize.
