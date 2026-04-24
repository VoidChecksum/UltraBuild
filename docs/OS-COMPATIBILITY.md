# OS Compatibility

UltraBuild targets every operating system where a modern Node.js runtime can realistically work.

## Official release matrix

| OS | Architecture | Artifact | Status |
| --- | --- | --- | --- |
| Linux | x64 | `ultrabuild-linux-x64.tar.gz` | supported |
| Linux | arm64 | `ultrabuild-linux-arm64.tar.gz` | supported |
| macOS | x64 | `ultrabuild-macos-x64.tar.gz` | supported |
| macOS | arm64 | `ultrabuild-macos-arm64.tar.gz` | supported |
| Windows | x64 | `ultrabuild-windows-x64.zip` | supported |
| Windows | arm64 | `ultrabuild-windows-arm64.zip` | supported |

WSL2 is supported through the Linux path.

## Best effort

- FreeBSD/OpenBSD/NetBSD
- Termux/Android
- Docker/devcontainers
- GitHub Actions runners
- other Node.js 20+ environments

## Portability rules

- Node.js 20+ is required.
- Core code uses Node built-ins.
- Paths are normalized with `node:path`.
- Child processes use `spawn` argument arrays.
- Shell selection is platform-aware.
- Release artifacts include POSIX and Windows launchers.
- CI runs on Ubuntu, macOS, and Windows with Node 20 and 22.

## Verification

Local verification:

```bash
npm test
npm run e2e
npm run package:all
npm run smoke:release
```

CI verification runs unit tests, E2E smoke tests, bundle creation, and release smoke tests across the official desktop/server OS family.
