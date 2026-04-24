# UI / UX

UltraBuild's v0.1 UX is intentionally dependency-light: a small ANSI renderer instead of a full-screen TUI. The goal is to look polished in ordinary terminals, CI logs, screenshots, and Vibe Island sidecars without adding runtime packages.

## Terminal principles

1. **Status first:** provider, mode, session, and OS appear as colored pills.
2. **Modes are visible:** read-only and auto-approval modes are not hidden in config.
3. **Readable logs:** UI output remains line-oriented and copyable.
4. **No hard dependency on color:** content still makes sense if ANSI is stripped.
5. **No full-screen lock-in:** interactive mode works over SSH, tmux, CI, and basic terminals.

## Renderer API

`src/core/ui.ts` provides:

- `color(text, token)`
- `stripAnsi(text)`
- `renderPill(text, token)`
- `box(title, body)`
- `section(title, body)`
- `splash()`
- `renderHelp()`
- `renderStatus(items)`

## Slash commands

Interactive mode supports:

| Command | Purpose |
| --- | --- |
| `/help` | Show rich help |
| `/theme` | Show active theme summary |
| `/doctor` | Run health checks |
| `/skills` | List loaded skills |
| `/workers <n> <task>` | Spawn mock worker summaries |
| `/mode <mode>` | Switch mode |
| `/exit` | Quit |

## Mode UX

Modes alter prompts, tool exposure, and approvals:

- `plan` and `review` expose only read/list/grep.
- `yolo` auto-approves and carries a danger warning.
- status pills include the current mode.
- Vibe Island events include UltraBuild session/mode context through event metadata.

## Asset set

- `assets/logo.svg`
- `assets/icon.svg`
- `assets/icon-dark.svg`
- `assets/social-preview.svg`
- `assets/terminal-screenshot.svg`
- `assets/ultrabuild-banner.svg`
- `assets/flux-mascot.svg`
- `assets/footer.svg`

Flux is the mascot: a forge-dragon carrying a terminal hammer.
