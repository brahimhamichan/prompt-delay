<p align="center">
  <img src="assets/prompt-later-icon.svg" width="128" height="128" alt="Prompt Later icon">
</p>

# Prompt Later

[Website](https://prompt-later.pages.dev) · [npm](https://www.npmjs.com/package/prompt-later) · [GitHub](https://github.com/brahimhamichan/prompt-later)

Prompt Later adds `/wait` and `/steer` to Codex so you can submit a prompt now and have Codex wait before handling it.

The important part: the delay runs in a Codex `UserPromptSubmit` hook before the model request. The agent is not asked to run `sleep`, and the marker skill files only exist so `/wait` and `/steer` can appear in completion.

## Install

```bash
npx prompt-later
```

Restart Codex after installing. If Codex asks you to trust the new hook, approve it.

Alternative install from GitHub:

```bash
curl -fsSL https://raw.githubusercontent.com/brahimhamichan/prompt-later/main/install.sh | bash
```

## Use

```text
/wait 10s hello
/wait 1 min summarize this repo
/wait 1.5h queue run the test suite
/wait 1h 30min continue after the limit resets
/wait 2 hours steer focus only on release blockers
/steer 30 seconds keep the final answer concise
```

Supported duration forms include:

```text
1s
1 sec
1 second
1 seconds
1m
1min
1 min
1 minute
1 minutes
1h
1 hour
1 hours
1.5h
1h 30min
1 h 30 min
2 hours
```

## How It Works

Prompt Later installs:

- `~/.codex/hooks/prompt-later-hook.py`
- `~/.codex/skills/wait/SKILL.md`
- `~/.codex/skills/steer/SKILL.md`

The hook intercepts prompts that start with `/wait`, `/steer`, `$wait`, `$steer`, or Codex's linked skill form. It parses the duration, runs `/bin/sleep`, and then adds the delayed prompt as Codex hook context.

Codex hooks currently support adding context before the model request, not replacing the visible user message. That means the hook can guarantee the wait happens first, but the visible chat line remains the command you typed.

## Uninstall

```bash
npx prompt-later uninstall
```

This removes the Prompt Later hook and marker skills from `~/.codex`.
