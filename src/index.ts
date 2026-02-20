import { parseArgs } from "node:util";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Daemon } from "./daemon/index.js";
import { VERSION } from "./shared/constants.js";

const HELP = `
  elementerm v${VERSION}
  The invisible orchestrator for Claude Code sessions.

  Usage:
    elementerm <command> [options]

  Commands:
    start       Start the daemon in background
    stop        Stop the daemon
    dash        Open the dashboard TUI
    new         Create and launch a new session
    rm          Remove a session
    status      Show quick status of all sessions
    help        Show this help message

  Options:
    --version   Show version
    --help      Show help

  Examples:
    elementerm start
    elementerm dash
    elementerm new --project myapp --worktree feat-auth --domain BACK
    elementerm rm --worktree feat-auth
    elementerm status
`;

async function main(): Promise<void> {
  const command = process.argv[2];

  if (!command || command === "help" || command === "--help") {
    console.log(HELP);
    return;
  }

  if (command === "--version") {
    console.log(VERSION);
    return;
  }

  // Internal flag: run daemon in foreground (called by the detached child)
  if (command === "--daemon") {
    const daemon = new Daemon();
    await daemon.start();
    await new Promise(() => {}); // Keep alive
    return;
  }

  switch (command) {
    case "start":
      await startDaemon();
      break;

    case "stop":
      await stopDaemon();
      break;

    case "dash":
      await openDashboard();
      break;

    case "new":
      await newSession();
      break;

    case "rm":
      await removeSession();
      break;

    case "status":
      await showStatus();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

async function startDaemon(): Promise<void> {
  const fs = await import("node:fs");
  const { PID_FILE } = await import("./shared/constants.js");

  // Check if already running
  if (fs.existsSync(PID_FILE)) {
    const pid = parseInt(fs.readFileSync(PID_FILE, "utf-8").trim());
    try {
      process.kill(pid, 0);
      console.log(`Elementerm daemon already running (PID: ${pid}).`);
      return;
    } catch {
      // Stale PID, will be cleaned up by daemon.start()
    }
  }

  // Fork a detached child that runs with --daemon flag
  const entryScript = fileURLToPath(import.meta.url);
  const child = spawn(process.execPath, [entryScript, "--daemon"], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });

  child.unref();

  // Wait briefly for the child to write its PID file
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, "utf-8").trim();
    console.log(`Elementerm daemon started (PID: ${pid}).`);
  } else {
    console.error("Failed to start daemon. Check logs.");
    process.exit(1);
  }
}

async function stopDaemon(): Promise<void> {
  const fs = await import("node:fs");
  const { PID_FILE } = await import("./shared/constants.js");

  if (!fs.existsSync(PID_FILE)) {
    console.log("Elementerm daemon is not running.");
    return;
  }

  const pid = parseInt(fs.readFileSync(PID_FILE, "utf-8").trim());

  try {
    process.kill(pid, "SIGTERM");
    console.log(`Elementerm daemon stopped (PID: ${pid}).`);
  } catch {
    console.log("Daemon process not found. Cleaning up...");
  }

  // Always clean up PID file (on Windows, SIGTERM kills without running handlers)
  try {
    fs.unlinkSync(PID_FILE);
  } catch {
    // Already gone
  }
}

async function openDashboard(): Promise<void> {
  // Dynamic import to avoid loading React/Ink unless needed
  const { renderDashboard } = await import("./dashboard/app.js");
  await renderDashboard();
}

async function newSession(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      project: { type: "string", short: "p" },
      worktree: { type: "string", short: "w" },
      domain: { type: "string", short: "d" },
      branch: { type: "string", short: "b" },
      template: { type: "string", short: "t" },
    },
  });

  if (!values.worktree) {
    console.error("Usage: elementerm new --worktree <name> [--project <name>] [--domain BACK|FRONT|SEO|...] [--branch <name>] [--template <name>]");
    process.exit(1);
  }

  const fs = await import("node:fs");
  const path = await import("node:path");
  const { execSync } = await import("node:child_process");
  const net = await import("node:net");
  const crypto = await import("node:crypto");
  const cwd = path.default.resolve(process.cwd());

  // --- Step 0: Validate we're in a git repo ---
  let gitRoot: string;
  try {
    gitRoot = execSync("git rev-parse --show-toplevel", { cwd, encoding: "utf-8" }).trim();
  } catch {
    console.error("Not a git repository. Run this from inside a git project.");
    process.exit(1);
  }

  // --- Step 1: Auto-detect project name if not specified ---
  let project = values.project;
  if (!project) {
    try {
      const remoteUrl = execSync("git remote get-url origin", { cwd: gitRoot, encoding: "utf-8" }).trim();
      // Extract repo name from URL (handles both https and ssh)
      project = path.default.basename(remoteUrl, ".git");
    } catch {
      // No remote, use directory name
      project = path.default.basename(gitRoot);
    }
  }

  // --- Step 2: Validate domain ---
  const validDomains = ["BACK", "FRONT", "SEO", "SEC", "TEST", "INFRA", "DOC"];
  const domain = values.domain?.toUpperCase() || null;
  if (domain && !validDomains.includes(domain)) {
    console.error(`Invalid domain: ${values.domain}. Valid: ${validDomains.join(", ")}`);
    process.exit(1);
  }

  // --- Step 3: Create git worktree ---
  const worktreeName = values.worktree;
  const worktreeDir = path.default.join(gitRoot, ".worktrees", worktreeName);
  const branch = values.branch || `wt/${worktreeName}`;

  let worktreeCwd: string;
  if (fs.existsSync(worktreeDir)) {
    console.log(`  Worktree "${worktreeName}" already exists, reusing.`);
    worktreeCwd = worktreeDir;
  } else {
    try {
      // Check if branch already exists
      let branchExists = false;
      try {
        execSync(`git rev-parse --verify ${branch}`, { cwd: gitRoot, encoding: "utf-8", stdio: "pipe" });
        branchExists = true;
      } catch {
        // Branch doesn't exist yet
      }

      if (branchExists) {
        execSync(`git worktree add "${worktreeDir}" ${branch}`, { cwd: gitRoot, encoding: "utf-8" });
      } else {
        execSync(`git worktree add -b ${branch} "${worktreeDir}"`, { cwd: gitRoot, encoding: "utf-8" });
      }
      console.log(`  Worktree created: ${worktreeDir} (${branch})`);
      worktreeCwd = worktreeDir;
    } catch (error) {
      console.error(`Failed to create worktree: ${error}`);
      process.exit(1);
    }
  }

  // --- Step 4: Copy CLAUDE.md template ---
  await copyTemplate(worktreeCwd, domain, values.template);

  // --- Step 5: Install hooks ---
  const sessionId = crypto.randomUUID();
  await installHooks(worktreeCwd, sessionId);

  // --- Step 6: Spawn native terminal ---
  const { spawnNativeTerminal } = await import("./spawner/index.js");
  const result = await spawnNativeTerminal({
    project,
    worktree: worktreeName,
    cwd: worktreeCwd,
    title: `${project}/${worktreeName}`,
  });

  if (!result.success) {
    console.error(`Failed to launch terminal: ${result.error}`);
    process.exit(1);
  }

  // --- Step 7: Register session ---
  const session = {
    id: sessionId,
    project,
    worktree: worktreeName,
    branch,
    status: "idle" as const,
    domain: domain as import("./shared/types.js").SessionDomain,
    lastCommit: null,
    lastActivity: new Date().toISOString(),
    filesModified: [],
    terminalPid: result.terminalPid || null,
    claudeSessionId: null,
    cwd: worktreeCwd,
  };

  const { IPC_PATH } = await import("./shared/constants.js");
  const { serialize } = await import("./shared/ipc-protocol.js");

  try {
    await new Promise<void>((resolve, reject) => {
      const client = net.createConnection(IPC_PATH, () => {
        client.write(serialize({ type: "session_created", payload: session }));
        client.end();
        resolve();
      });
      client.on("error", reject);
      setTimeout(() => reject(new Error("timeout")), 2000);
    });
  } catch {
    // Daemon not running, write directly to state file
    const { STATE_FILE, ELEMENTERM_DIR } = await import("./shared/constants.js");
    fs.mkdirSync(ELEMENTERM_DIR, { recursive: true });
    let state = { sessions: {} as Record<string, typeof session>, projects: {} as Record<string, { name: string; path: string; sessions: string[] }>, daemon: { startedAt: "", pid: 0, version: VERSION } };
    if (fs.existsSync(STATE_FILE)) {
      try { state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")); } catch { /* fresh state */ }
    }
    state.sessions[session.id] = session;
    if (!state.projects[project]) {
      state.projects[project] = { name: project, path: gitRoot, sessions: [] };
    }
    state.projects[project].sessions.push(session.id);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  }

  const domainTag = domain ? ` [${domain}]` : "";
  console.log(`  Session launched: ${project}/${worktreeName}${domainTag} (${branch})`);
}

async function copyTemplate(worktreeCwd: string, domain: string | null, templateName?: string): Promise<void> {
  const fs = await import("node:fs");
  const path = await import("node:path");

  const claudeMdPath = path.default.join(worktreeCwd, "CLAUDE.md");

  // Don't overwrite existing CLAUDE.md
  if (fs.existsSync(claudeMdPath)) {
    console.log("  CLAUDE.md already exists, keeping it.");
    return;
  }

  // Find template
  const entryScript = fileURLToPath(import.meta.url);
  const templatesDir = path.default.resolve(path.default.dirname(entryScript), "..", "templates");

  // Priority: explicit --template > domain-based > default
  const templateFile = templateName
    ? `${templateName}.md`
    : domain
      ? `${domain.toLowerCase()}.md`
      : "default.md";

  const templatePath = path.default.join(templatesDir, templateFile);
  const defaultPath = path.default.join(templatesDir, "default.md");

  const sourcePath = fs.existsSync(templatePath) ? templatePath : fs.existsSync(defaultPath) ? defaultPath : null;

  if (!sourcePath) {
    console.log("  No CLAUDE.md template found, skipping.");
    return;
  }

  fs.copyFileSync(sourcePath, claudeMdPath);
  console.log(`  CLAUDE.md installed (template: ${path.default.basename(sourcePath, ".md")})`);
}

async function installHooks(cwd: string, sessionId: string): Promise<void> {
  const fs = await import("node:fs");
  const path = await import("node:path");

  const claudeDir = path.default.join(cwd, ".claude");
  const settingsPath = path.default.join(claudeDir, "settings.json");

  // Find the hook script
  const entryScript = fileURLToPath(import.meta.url);
  const hookScript = path.default.resolve(path.default.dirname(entryScript), "..", "hooks", "elementerm-hook.js");

  if (!fs.existsSync(hookScript)) {
    console.log("  (hook script not found, skipping hook installation)");
    return;
  }

  // Normalize to forward slashes for cross-platform compatibility
  const hookPath = hookScript.replace(/\\/g, "/");

  const hookEntry = {
    matcher: "",
    hooks: [{ type: "command" as const, command: `node "${hookPath}"` }],
  };

  const hookConfig = {
    hooks: {
      PostToolUse: [hookEntry],
      Stop: [hookEntry],
    },
  };

  fs.mkdirSync(claudeDir, { recursive: true });

  // Merge with existing settings if present
  let settings: Record<string, unknown> = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch {
      // Corrupted, start fresh
    }
  }

  settings.hooks = hookConfig.hooks;
  if (!settings.env || typeof settings.env !== "object") {
    settings.env = {};
  }
  (settings.env as Record<string, string>).ELEMENTERM_SESSION_ID = sessionId;

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  console.log(`  Hooks installed in ${claudeDir}`);
}

async function removeSession(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      worktree: { type: "string", short: "w" },
      all: { type: "boolean" },
      cleanup: { type: "boolean" },
    },
  });

  if (!values.worktree && !values.all) {
    console.error("Usage: elementerm rm --worktree <name> [--cleanup] | --all [--cleanup]");
    process.exit(1);
  }

  const fs = await import("node:fs");
  const net = await import("node:net");
  const { STATE_FILE, IPC_PATH } = await import("./shared/constants.js");
  const { serialize } = await import("./shared/ipc-protocol.js");

  if (!fs.existsSync(STATE_FILE)) {
    console.log("No sessions to remove.");
    return;
  }

  const origState = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  const state = JSON.parse(JSON.stringify(origState));
  const entries = Object.entries(state.sessions) as Array<[string, { id: string; worktree: string; project: string }]>;

  // Determine which sessions to remove
  let toRemove: Array<{ id: string; worktree: string; project: string }>;
  if (values.all) {
    toRemove = entries.map(([, s]) => s);
  } else {
    const match = entries.find(([, s]) => s.worktree === values.worktree);
    if (!match) {
      console.error(`Session with worktree "${values.worktree}" not found.`);
      process.exit(1);
    }
    toRemove = [match[1]];
  }

  // Remove from state file directly (instant for status reads)
  for (const session of toRemove) {
    delete state.sessions[session.id];
    const project = state.projects[session.project];
    if (project) {
      project.sessions = project.sessions.filter((sid: string) => sid !== session.id);
      if (project.sessions.length === 0) {
        delete state.projects[session.project];
      }
    }
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");

  // Also notify daemon via IPC to sync its in-memory state
  for (const session of toRemove) {
    try {
      await new Promise<void>((resolve, reject) => {
        const client = net.createConnection(IPC_PATH, () => {
          client.write(serialize({ type: "session_removed", payload: session }));
          client.end();
          resolve();
        });
        client.on("error", reject);
        setTimeout(() => reject(new Error("timeout")), 2000);
      });
    } catch {
      // Daemon not running, file already updated above
    }
  }

  // Optionally remove git worktrees
  if (values.cleanup) {
    const { execSync } = await import("node:child_process");
    for (const session of toRemove) {
      const sessionFull = Object.values(origState.sessions).find((s: Record<string, unknown>) => s.id === session.id) as { cwd?: string } | undefined;
      if (sessionFull?.cwd) {
        try {
          // Check for uncommitted changes to tracked files (ignore untracked)
          const status = execSync("git diff --name-only HEAD", { cwd: sessionFull.cwd, encoding: "utf-8", stdio: "pipe" }).trim();
          const staged = execSync("git diff --cached --name-only", { cwd: sessionFull.cwd, encoding: "utf-8", stdio: "pipe" }).trim();
          if (status || staged) {
            console.log(`  Worktree "${session.worktree}" has uncommitted changes, skipping cleanup.`);
            console.log(`  Use 'git stash' or commit first, then retry with --cleanup.`);
            continue;
          }
          execSync(`git worktree remove --force "${sessionFull.cwd}"`, { encoding: "utf-8", stdio: "pipe" });
          console.log(`  Worktree removed: ${sessionFull.cwd}`);
        } catch {
          console.log(`  Could not remove worktree for "${session.worktree}" (may not be a worktree).`);
        }
      }
    }
  }

  if (values.all) {
    console.log(`Removed ${toRemove.length} session(s).`);
  } else {
    console.log(`Removed session: ${toRemove[0].project}/${toRemove[0].worktree}`);
  }
}

async function showStatus(): Promise<void> {
  const fs = await import("node:fs");
  const { STATE_FILE, PID_FILE, STATUS_ICONS } = await import(
    "./shared/constants.js"
  );

  if (!fs.existsSync(PID_FILE)) {
    console.log("Elementerm daemon is not running. Run 'elementerm start' first.");
    return;
  }

  if (!fs.existsSync(STATE_FILE)) {
    console.log("No sessions found.");
    return;
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  const sessions = Object.values(state.sessions) as Array<{
    project: string;
    worktree: string;
    status: string;
    branch: string;
    domain: string | null;
    lastActivity: string;
    lastCommit: { message: string } | null;
  }>;

  if (sessions.length === 0) {
    console.log("No active sessions.");
    return;
  }

  console.log(`\n  Elementerm - ${sessions.length} session(s)\n`);

  // Group by project
  const byProject = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const list = byProject.get(s.project) || [];
    list.push(s);
    byProject.set(s.project, list);
  }

  for (const [project, projectSessions] of byProject) {
    console.log(`  ${project}`);
    for (const s of projectSessions) {
      const icon = STATUS_ICONS[s.status] || "?";
      const domain = s.domain ? `[${s.domain}]` : "";
      const commit = s.lastCommit?.message || "-";
      const ago = timeSince(s.lastActivity);
      console.log(
        `    ${icon} ${s.worktree.padEnd(12)} ${domain.padEnd(7)} ${s.branch.padEnd(20)} "${commit}" ${ago}`
      );
    }
    console.log();
  }
}

function timeSince(isoDate: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h${minutes % 60}min`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
