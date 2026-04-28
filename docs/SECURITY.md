# Security

UltraBuild can read files, write files, edit files, and run shell commands. Treat it like a developer with terminal access.

## Supported Versions

Security fixes target the latest `main` branch and the most recent release.

## Reporting a Vulnerability

Please report vulnerabilities privately when possible:

- Use GitHub's **Report a vulnerability** flow for this repository if available.
- Otherwise open a minimal GitHub issue that avoids live secrets, private paths, tokens, or exploit payloads.
- For coordination, contact `v0idch3cksum` on Discord.

## Defaults

- read/list/grep: allowed
- write/edit/bash: approval required
- `--yes`: auto-approve for automation
- dangerous shell patterns: extra guarded unless `--yes`
- all tool activity: logged to JSONL sessions

## Sensitive Data Guidelines

- Session JSONL, shell output, prompts, and tool logs can contain credentials or private paths.
- Do not attach raw `.ultrabuild/`, `.omc/`, `.serena/`, terminal-cache, or worktree state without redaction.
- Rotate any API key, cookie, SSH key, or token that may have been pasted into prompts or emitted in logs.

## Recommendations

- Run inside a git repo and review diffs.
- Use containers or worktrees for risky tasks.
- Do not paste secrets into prompts.
- Prefer API key environment variables over checked-in config.
- Never run `--yes` in a directory you do not trust.
