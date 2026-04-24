# Security

UltraBuild can read files, write files, edit files, and run shell commands. Treat it like a developer with terminal access.

## Defaults

- read/list/grep: allowed
- write/edit/bash: approval required
- `--yes`: auto-approve for automation
- dangerous shell patterns: extra guarded unless `--yes`
- all tool activity: logged to JSONL sessions

## Recommendations

- Run inside a git repo and review diffs.
- Use containers or worktrees for risky tasks.
- Do not paste secrets into prompts.
- Prefer API key environment variables over checked-in config.
- Never run `--yes` in a directory you do not trust.
