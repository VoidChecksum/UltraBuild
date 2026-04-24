# Theme

UltraBuild uses a neon forge theme: dark terminal glass, cyan/violet/pink glow, and Flux the forge-dragon as the mascot.

## Palette

| Token | Hex | Purpose |
| --- | --- | --- |
| Void | `#060712` | background |
| Forge Navy | `#0f172a` | panels/code |
| Arc Cyan | `#00e5ff` | primary glow/status |
| Violet Core | `#7c3aed` | secondary glow/borders |
| Flux Pink | `#ff2bd6` | accent/mode markers |
| Verify Green | `#a3e635` | success/verification |
| Text | `#f8fafc` | foreground |
| Muted | `#94a3b8` | secondary text |

## Terminal rendering

The runtime renderer lives in `src/core/ui.ts` and deliberately uses no runtime dependencies. It provides colored pills, boxes, sections, status lines, splash output, and help output.

The UI should stay:

- copyable in logs
- readable with ANSI removed
- safe for GitHub Actions output
- usable in tmux/SSH/basic terminals

## Mascot

Flux is the UltraBuild forge-dragon: friendly, fast, portable, and tool-aware. Flux carries a terminal hammer because UltraBuild can edit files and run shell commands — with approvals unless the user explicitly asks for automation.

## Assets

- `assets/logo.svg`
- `assets/icon.svg`
- `assets/icon-dark.svg`
- `assets/social-preview.svg`
- `assets/terminal-screenshot.svg`
- `assets/ultrabuild-banner.svg`
- `assets/flux-mascot.svg`
- `assets/footer.svg`
