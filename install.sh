#!/usr/bin/env bash
set -euo pipefail

REPO_RAW_URL="${PROMPT_LATER_RAW_URL:-https://raw.githubusercontent.com/brahimhamichan/prompt-later/main}"
ROOT=""
if [[ -n "${BASH_SOURCE[0]:-}" && -f "${BASH_SOURCE[0]}" ]]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
HOOKS_DIR="$CODEX_HOME/hooks"
SKILLS_DIR="$CODEX_HOME/skills"
HOOK_TARGET="$HOOKS_DIR/prompt-later-hook.py"
HOOKS_JSON="$CODEX_HOME/hooks.json"

mkdir -p "$HOOKS_DIR" "$SKILLS_DIR/wait" "$SKILLS_DIR/steer"

if [[ -n "$ROOT" && -f "$ROOT/hooks/prompt-later-hook.py" ]]; then
  install -m 755 "$ROOT/hooks/prompt-later-hook.py" "$HOOK_TARGET"
  install -m 644 "$ROOT/skills/wait/SKILL.md" "$SKILLS_DIR/wait/SKILL.md"
  install -m 644 "$ROOT/skills/steer/SKILL.md" "$SKILLS_DIR/steer/SKILL.md"
else
  curl -fsSL "$REPO_RAW_URL/hooks/prompt-later-hook.py" -o "$HOOK_TARGET"
  chmod 755 "$HOOK_TARGET"
  curl -fsSL "$REPO_RAW_URL/skills/wait/SKILL.md" -o "$SKILLS_DIR/wait/SKILL.md"
  chmod 644 "$SKILLS_DIR/wait/SKILL.md"
  curl -fsSL "$REPO_RAW_URL/skills/steer/SKILL.md" -o "$SKILLS_DIR/steer/SKILL.md"
  chmod 644 "$SKILLS_DIR/steer/SKILL.md"
fi

python3 - "$HOOKS_JSON" "$HOOK_TARGET" <<'PY'
import json
import os
import sys
from datetime import datetime

hooks_json, hook_target = sys.argv[1], sys.argv[2]
data = {"hooks": {}}

if os.path.exists(hooks_json) and os.path.getsize(hooks_json) > 0:
    with open(hooks_json, "r", encoding="utf-8") as f:
        data = json.load(f)

backup = f"{hooks_json}.prompt-later-backup-{datetime.now().strftime('%Y%m%d%H%M%S')}"
if os.path.exists(hooks_json):
    with open(hooks_json, "r", encoding="utf-8") as src, open(backup, "w", encoding="utf-8") as dst:
        dst.write(src.read())

hooks = data.setdefault("hooks", {})
entries = hooks.setdefault("UserPromptSubmit", [])
command = {
    "type": "command",
    "command": hook_target,
    "timeout": 86400,
}

for entry in entries:
    for hook in entry.get("hooks", []):
        if hook.get("command") == hook_target:
            hook.update(command)
            break
    else:
        continue
    break
else:
    entries.insert(0, {"hooks": [command]})

with open(hooks_json, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PY

echo "Prompt Later installed."
echo "Restart Codex, then try: /wait 5s hello"
