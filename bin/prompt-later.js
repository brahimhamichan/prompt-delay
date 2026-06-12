#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const hooksDir = path.join(codexHome, "hooks");
const skillsDir = path.join(codexHome, "skills");
const hookTarget = path.join(hooksDir, "prompt-later-hook.py");
const workerTarget = path.join(hooksDir, "prompt-later-worker.py");
const hooksJson = path.join(codexHome, "hooks.json");

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest, mode) {
  mkdirp(path.dirname(dest));
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, mode);
}

function readHooksJson() {
  if (!fs.existsSync(hooksJson) || fs.statSync(hooksJson).size === 0) {
    return { hooks: {} };
  }
  return JSON.parse(fs.readFileSync(hooksJson, "utf8"));
}

function writeHooksJson(data) {
  mkdirp(path.dirname(hooksJson));
  fs.writeFileSync(hooksJson, `${JSON.stringify(data, null, 2)}\n`);
}

function backupHooksJson() {
  if (!fs.existsSync(hooksJson)) return;
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  fs.copyFileSync(hooksJson, `${hooksJson}.prompt-later-backup-${stamp}`);
}

function install() {
  mkdirp(hooksDir);
  mkdirp(path.join(skillsDir, "wait"));
  mkdirp(path.join(skillsDir, "steer"));

  copyFile(path.join(root, "hooks", "prompt-later-hook.py"), hookTarget, 0o755);
  copyFile(path.join(root, "hooks", "prompt-later-worker.py"), workerTarget, 0o755);
  copyFile(path.join(root, "skills", "wait", "SKILL.md"), path.join(skillsDir, "wait", "SKILL.md"), 0o644);
  copyFile(path.join(root, "skills", "steer", "SKILL.md"), path.join(skillsDir, "steer", "SKILL.md"), 0o644);

  const data = readHooksJson();
  backupHooksJson();
  data.hooks ||= {};
  const entries = data.hooks.UserPromptSubmit ||= [];
  const command = {
    type: "command",
    command: hookTarget,
    timeout: 86400,
  };

  let found = false;
  for (const entry of entries) {
    entry.hooks ||= [];
    for (const hook of entry.hooks) {
      if (hook.command === hookTarget) {
        Object.assign(hook, command);
        found = true;
      }
    }
  }
  if (!found) {
    entries.unshift({ hooks: [command] });
  }

  writeHooksJson(data);
  console.log("Prompt Later installed. Restart Codex, then try: /wait 5s hello");
}

function uninstall() {
  fs.rmSync(hookTarget, { force: true });
  fs.rmSync(workerTarget, { force: true });
  fs.rmSync(path.join(skillsDir, "wait"), { recursive: true, force: true });
  fs.rmSync(path.join(skillsDir, "steer"), { recursive: true, force: true });

  if (fs.existsSync(hooksJson)) {
    const data = readHooksJson();
    const entries = data.hooks?.UserPromptSubmit || [];
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const entry = entries[i];
      entry.hooks = (entry.hooks || []).filter((hook) => hook.command !== hookTarget);
      if (entry.hooks.length === 0) entries.splice(i, 1);
    }
    writeHooksJson(data);
  }

  console.log("Prompt Later uninstalled.");
}

const command = process.argv[2] || "install";
if (command === "install") {
  install();
} else if (command === "uninstall") {
  uninstall();
} else {
  console.error("Usage: prompt-later [install|uninstall]");
  process.exit(1);
}
