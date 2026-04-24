# Releases

UltraBuild v0.1 ships portable Node bundles rather than native single-file binaries. This keeps the release path reliable across the official OS matrix while leaving native packaging/signing for a later milestone.

## Official bundle matrix

| Target | Artifact | Launcher |
| --- | --- | --- |
| Linux x64 | `ultrabuild-linux-x64.tar.gz` | `bin/ultrabuild` |
| Linux arm64 | `ultrabuild-linux-arm64.tar.gz` | `bin/ultrabuild` |
| macOS x64 | `ultrabuild-macos-x64.tar.gz` | `bin/ultrabuild` |
| macOS arm64 | `ultrabuild-macos-arm64.tar.gz` | `bin/ultrabuild` |
| Windows x64 | `ultrabuild-windows-x64.zip` | `bin/ultrabuild.cmd` |
| Windows arm64 | `ultrabuild-windows-arm64.zip` | `bin/ultrabuild.cmd` |

Each bundle contains:

- `dist/` compiled CLI
- `bin/ultrabuild` POSIX launcher
- `bin/ultrabuild.cmd` Windows launcher
- `package.json`
- `README.md`
- `LICENSE`
- `assets/`
- `docs/`
- `skills/`
- `TARGET.txt`

## Build locally

```bash
npm run package:all
```

Artifacts are written to `release/` along with `manifest.json`.

## Smoke test locally

```bash
npm run smoke:release
```

The smoke test unpacks representative tar/zip artifacts, checks required files, runs the current-platform launcher, and verifies CLI help/doctor/mock-provider behavior.

## Install from a bundle

Linux/macOS:

```bash
tar -xzf ultrabuild-linux-x64.tar.gz
./ultrabuild-linux-x64/bin/ultrabuild doctor
./ultrabuild-linux-x64/bin/ultrabuild --provider mock --print "hello"
```

Windows PowerShell:

```powershell
Expand-Archive ultrabuild-windows-x64.zip
.\ultrabuild-windows-x64\bin\ultrabuild.cmd doctor
.\ultrabuild-windows-x64\bin\ultrabuild.cmd --provider mock --print "hello"
```

## Best-effort platforms

BSDs, Termux, containers, devcontainers, and other platforms can use npm/source as long as Node.js 20+ works.

## Deferred release work

- native single-file binaries
- macOS signing/notarization
- Windows signing
- distro packages (`deb`, `rpm`, Homebrew, Scoop, Winget)
- SBOM/provenance attestations
