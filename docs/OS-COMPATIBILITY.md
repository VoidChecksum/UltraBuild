# OS Compatibility

UltraBuild targets every operating system where a modern Node.js runtime can realistically work.

## Official v0.1 support

- Linux x64/arm64
- macOS x64/arm64
- Windows x64/arm64 with PowerShell/cmd/Windows Terminal
- WSL2

## Best effort

- FreeBSD/OpenBSD/NetBSD
- Termux/Android
- Docker/devcontainers
- GitHub Actions runners

## Portability rules

- Node.js 20+ is required.
- Core code uses Node built-ins.
- Paths are normalized with `node:path`.
- Child processes use `spawn` argument arrays.
- Shell selection is platform-aware.
- CI runs on Ubuntu, macOS, and Windows.
