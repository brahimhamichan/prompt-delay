#!/usr/bin/env python3
import argparse
import json
import os
import shutil
import shlex
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path

BASE_DIR = Path.home() / ".codex" / "prompt-later"
QUEUE_FILE = BASE_DIR / "queue.json"
LOCK_FILE = BASE_DIR / "queue.lock"
PID_FILE = BASE_DIR / "worker.pid"
LOG_FILE = BASE_DIR / "worker.log"

STATE_VERSION = 1
POLL_SECONDS = 5.0


def log(message):
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    ts = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(f"[{ts}] {message}\n")


def get_codex_binary():
    return shutil.which("codex") or "/Applications/Codex.app/Contents/Resources/codex"


def lock_handle():
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    fd = os.open(str(LOCK_FILE), os.O_RDWR | os.O_CREAT, 0o600)
    try:
        import fcntl

        fcntl.flock(fd, fcntl.LOCK_EX)
    except Exception:
        os.close(fd)
        raise
    return fd


def read_state():
    if not QUEUE_FILE.exists():
        return {"version": STATE_VERSION, "jobs": []}
    try:
        with QUEUE_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"version": STATE_VERSION, "jobs": []}


def write_state(state):
    with tempfile.NamedTemporaryFile(
            "w", dir=str(BASE_DIR), delete=False, encoding="utf-8"
        ) as f:
        json.dump(state, f, indent=2)
        f.write("\n")
        temp = Path(f.name)
    temp.replace(QUEUE_FILE)


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Prompt-later background worker.")
    sub = parser.add_subparsers(dest="command", required=True)

    enqueue = sub.add_parser("enqueue")
    enqueue.add_argument("--payload", required=True)
    enqueue.add_argument("--mode", choices=("queue", "steer"), required=True)
    enqueue.add_argument("--seconds", required=True, type=float)
    enqueue.add_argument("--session-id", required=True)
    enqueue.add_argument("--turn-id", required=True)
    enqueue.add_argument("--cwd", default="")
    enqueue.add_argument("--duration-token", default="")

    sub.add_parser("run")
    return parser.parse_args(argv)


def enqueue_job(args):
    fd = lock_handle()
    try:
        state = read_state()
        jobs = state.setdefault("jobs", [])
        jobs.append(
            {
                "id": str(uuid.uuid4()),
                "session_id": args.session_id,
                "turn_id": args.turn_id,
                "mode": args.mode,
                "payload": args.payload,
                "cwd": args.cwd,
                "due_at": time.time() + max(0.0, args.seconds),
                "created_at": time.time(),
                "duration_token": args.duration_token,
            }
        )
        write_state(state)
    finally:
        os.close(fd)


def pop_due_jobs():
    now = time.time()
    ready = []
    next_state = None
    fd = lock_handle()
    try:
        state = read_state()
        jobs = [job for job in state.get("jobs", []) if isinstance(job, dict)]
        remaining = []
        for job in jobs:
            if job.get("due_at", 0) <= now and job.get("status", "pending") == "pending":
                ready.append(job)
            else:
                remaining.append(job)
        if ready:
            next_state = {"version": STATE_VERSION, "jobs": remaining}
            write_state(next_state)
        else:
            next_state = state
        next_due = None
        if next_state.get("jobs"):
            due_candidates = [
                job.get("due_at", 0.0)
                for job in next_state["jobs"]
                if job.get("status", "pending") == "pending"
            ]
            if due_candidates:
                next_due = min(due_candidates)
        return ready, next_due
    finally:
        os.close(fd)


def send_job(job):
    payload = job.get("payload", "").strip()
    mode = job.get("mode", "queue")
    if mode == "steer":
        payload = f"Steering instruction: {payload}"

    codex = get_codex_binary()
    cwd = job.get("cwd") or os.getcwd()

    if job.get("session_id"):
        command = [
            codex,
            "--no-alt-screen",
            "-C",
            cwd,
            "exec",
            "--skip-git-repo-check",
            "resume",
            str(job["session_id"]),
            payload,
        ]
    else:
        command = [
            codex,
            "--no-alt-screen",
            "-C",
            cwd,
            "exec",
            "--skip-git-repo-check",
            payload,
        ]

    dispatch_log = BASE_DIR / f"dispatch-{job.get('id', 'unknown')}.log"

    def run(cmd):
        env = os.environ.copy()
        env.setdefault("TERM", "xterm-256color")
        with dispatch_log.open("a", encoding="utf-8") as out:
            out.write(f"$ {shlex.join(cmd)}\n")
            out.flush()
            proc = subprocess.Popen(
                cmd,
                stdin=subprocess.DEVNULL,
                stdout=out,
                stderr=subprocess.STDOUT,
                text=True,
                start_new_session=True,
                env=env,
            )
        try:
            proc.wait(timeout=2.0)
        except subprocess.TimeoutExpired:
            # Command is still running asynchronously; assume dispatch started.
            return None
        output = dispatch_log.read_text(encoding="utf-8", errors="replace")
        return subprocess.CompletedProcess(cmd, proc.returncode, output, "")

    try:
        result = run(command)
    except Exception as exc:
        log(f"Failed to dispatch job {job.get('id')}: {exc}")
        return False

    if result is None:
        return True

    combined = (result.stdout or "") + "\n" + (result.stderr or "")
    if (
        result.returncode != 0
        and "stdin is not a terminal" in combined
        and shutil.which("script")
    ):
        script_cmd = [
            "script",
            "-q",
            "/tmp/prompt-later-worker.log",
            "/bin/sh",
            "-c",
            shlex.join(command),
        ]
        try:
            result = run(script_cmd)
            if result is None:
                return True
            combined = (result.stdout or "") + "\n" + (result.stderr or "")
        except Exception as exc:
            log(f"Failed to dispatch job {job.get('id')} with pty fallback: {exc}")
            return False

    if result.returncode != 0:
        preview = (result.stderr or result.stdout or "").replace("\n", " ").strip()[:500]
        log(
            f"Job {job.get('id')} returned non-zero exit: "
            f"{result.returncode} output={preview}"
        )
        return False

    return True


def run_worker():
    # Ensure single worker process.
    if PID_FILE.exists():
        try:
            pid = int(PID_FILE.read_text(encoding="utf-8").strip())
            if pid > 0:
                try:
                    os.kill(pid, 0)
                    return
                except OSError:
                    pass
        except Exception:
            pass

    PID_FILE.write_text(str(os.getpid()), encoding="utf-8")

    try:
        while True:
            ready_jobs, next_due = pop_due_jobs()
            if ready_jobs:
                for job in ready_jobs:
                    success = send_job(job)
                    if not success:
                        # Requeue at end if dispatch fails.
                        fd = lock_handle()
                        try:
                            state = read_state()
                            jobs = state.setdefault("jobs", [])
                            job["due_at"] = time.time() + 120.0
                            jobs.append(job)
                            state["jobs"] = jobs
                            write_state(state)
                        finally:
                            os.close(fd)
            if not next_due:
                if not read_state().get("jobs"):
                    return
                next_due = min(
                    job.get("due_at", time.time() + POLL_SECONDS)
                    for job in read_state().get("jobs", [])
                    if job.get("status", "pending") == "pending"
                )
            sleep_for = max(0.0, min(300.0, next_due - time.time()))
            if sleep_for > 0:
                time.sleep(sleep_for)
    finally:
        try:
            if PID_FILE.exists():
                PID_FILE.unlink()
        except Exception:
            pass


def main():
    args = parse_args(sys.argv[1:])

    if args.command == "enqueue":
        enqueue_job(args)
        return 0
    if args.command == "run":
        run_worker()
        return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
