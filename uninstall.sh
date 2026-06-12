#!/usr/bin/env bash
set -euo pipefail

CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
HOOK_TARGET="$CODEX_HOME/hooks/prompt-later-hook.py"
HOOKS_JSON="$CODEX_HOME/hooks.json"

rm -f "$HOOK_TARGET"
rm -rf "$CODEX_HOME/skills/wait" "$CODEX_HOME/skills/steer"

python3 - "$HOOKS_JSON" "$HOOK_TARGET" <<'PY'
import json
import os
import sys

hooks_json, hook_target = sys.argv[1], sys.argv[2]
if not os.path.exists(hooks_json):
    raise SystemExit(0)

with open(hooks_json, "r", encoding="utf-8") as f:
    data = json.load(f)

entries = data.get("hooks", {}).get("UserPromptSubmit", [])
for entry in list(entries):
    entry["hooks"] = [hook for hook in entry.get("hooks", []) if hook.get("command") != hook_target]
    if not entry["hooks"]:
        entries.remove(entry)

with open(hooks_json, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PY

echo "Prompt Later uninstalled."
