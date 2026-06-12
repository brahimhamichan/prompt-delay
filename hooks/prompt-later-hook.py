#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys

PYTHON_BIN = os.path.realpath(sys.executable or "/usr/bin/python3")
RAW_PROMPT_PREFIX_RE = re.compile(r"^/(\w+)\b\s*(.*)$")
SKILL_LINK_PREFIX_RE = re.compile(r"^\[\$(\w+)\]\([^)]+\)\s*(.*)$")
SKILL_MENTION_PREFIX_RE = re.compile(r"^\$(\w+)\b\s*(.*)$")
DURATION_COMPACT_RE = re.compile(
    r"^(?P<value>\d+(?:\.\d+)?)(?P<unit>s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours)$",
    re.IGNORECASE,
)
DURATION_VALUE_RE = re.compile(r"^(?P<value>\d+(?:\.\d+)?)$")
DURATION_UNITS = {
    "s": 1.0,
    "sec": 1.0,
    "secs": 1.0,
    "second": 1.0,
    "seconds": 1.0,
    "m": 60.0,
    "min": 60.0,
    "mins": 60.0,
    "minute": 60.0,
    "minutes": 60.0,
    "h": 3600.0,
    "hr": 3600.0,
    "hrs": 3600.0,
    "hour": 3600.0,
    "hours": 3600.0,
}


def prompt_command_and_rest(prompt):
    stripped = (prompt or "").strip()
    for pattern in (RAW_PROMPT_PREFIX_RE, SKILL_LINK_PREFIX_RE, SKILL_MENTION_PREFIX_RE):
        match = pattern.match(stripped)
        if match:
            return match.group(1).lower(), (match.group(2) or "").strip()
    return None, ""


def parse_duration_component(parts, index):
    if index >= len(parts):
        return None

    compact_match = DURATION_COMPACT_RE.match(parts[index])
    if compact_match:
        value = float(compact_match.group("value"))
        unit = compact_match.group("unit").lower()
        return parts[index].lower(), value * DURATION_UNITS[unit], 1

    if index + 1 < len(parts):
        value_match = DURATION_VALUE_RE.match(parts[index])
        unit = parts[index + 1].lower()
        if value_match and unit in DURATION_UNITS:
            value = float(value_match.group("value"))
            return f"{parts[index]} {parts[index + 1]}", value * DURATION_UNITS[unit], 2

    return None


def parse_duration_parts(parts):
    if not parts:
        return None, 0

    consumed = 0
    seconds = 0.0
    tokens = []

    while consumed < len(parts):
        component = parse_duration_component(parts, consumed)
        if not component:
            break
        token, component_seconds, component_consumed = component
        tokens.append(token)
        seconds += component_seconds
        consumed += component_consumed

    if not tokens:
        return None, 0

    return {"duration_token": " ".join(tokens), "seconds": seconds}, consumed


def parse_prompt(prompt):
    command, rest = prompt_command_and_rest(prompt)
    if command not in ("wait", "steer"):
        return None
    if not rest:
        return {"error": "Missing duration and payload. Use /wait 1m <prompt> or /steer 1m <prompt>."}

    parts = rest.split()
    duration, consumed = parse_duration_parts(parts)
    if not duration:
        return {"error": "Invalid duration. Use forms like 1s, 1 second, 5m, 5 min, 1.5h, 2 hours, or 1h 30min."}

    mode = "steer" if command == "steer" else "queue"
    remaining = parts[consumed:]
    if command == "wait" and remaining and remaining[0] in ("queue", "steer"):
        mode = remaining[0]
        remaining = remaining[1:]
    if not remaining:
        return {"error": "Missing payload after duration."}

    seconds = duration["seconds"]
    if seconds <= 0:
        return {"error": "Duration must be greater than zero."}

    return {
        "mode": mode,
        "seconds": seconds,
        "duration_token": duration["duration_token"],
        "payload": " ".join(remaining).strip(),
    }


def block(reason):
    print(json.dumps({"decision": "block", "reason": reason}))


def _human_wait_message(seconds, duration_token):
    if duration_token:
        return f"Queued for {duration_token}."
    if seconds >= 3600 and seconds % 3600 == 0:
        return f"Queued for {int(seconds // 3600)} hour(s)."
    if seconds >= 60 and seconds % 60 == 0:
        return f"Queued for {int(seconds // 60)} minute(s)."
    return f"Queued for {int(seconds)} second(s)."


def _enqueue_job(parsed, hook_input):
    script = os.path.join(os.path.dirname(__file__), "prompt-later-worker.py")
    command = [
        PYTHON_BIN,
        script,
        "enqueue",
        "--payload",
        parsed["payload"],
        "--mode",
        parsed["mode"],
        "--seconds",
        str(parsed["seconds"]),
        "--duration-token",
        parsed["duration_token"],
        "--session-id",
        str(hook_input.get("session_id", "")),
        "--turn-id",
        str(hook_input.get("turn_id", "")),
        "--cwd",
        str(hook_input.get("cwd", os.getcwd())),
    ]
    subprocess.run(command, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def _start_worker():
    script = os.path.join(os.path.dirname(__file__), "prompt-later-worker.py")
    subprocess.Popen(
        [PYTHON_BIN, script, "run"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        stdin=subprocess.DEVNULL,
        start_new_session=True,
    )


def main():
    try:
        hook_input = json.load(sys.stdin)
    except Exception:
        return 0

    if hook_input.get("hook_event_name") != "UserPromptSubmit":
        return 0

    prompt = hook_input.get("prompt")
    if not isinstance(prompt, str):
        return 0

    parsed = parse_prompt(prompt)
    if not parsed:
        return 0
    if "error" in parsed:
        block(parsed["error"])
        return 0

    _enqueue_job(parsed, hook_input)
    _start_worker()
    block(_human_wait_message(parsed["seconds"], parsed["duration_token"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
