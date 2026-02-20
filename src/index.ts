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
    status      Show quick status of all sessions
    help        Show this help message

  Options:
    --version   Show version
    --help      Show help

  Examples:
    elementerm start
    elementerm dash
    elementerm new --project myapp --worktree feat-auth
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
    },
  });

  if (!values.project || !values.worktree) {
    console.error("Usage: elementerm new --project <name> --worktree <name> [--domain BACK|FRONT|SEO|...] [--branch <name>]");
    process.exit(1);
  }

  const path = await import("node:path");
  const { execSync } = await import("node:child_process");
  const net = await import("node:net");
  const crypto = await import("node:crypto");
  const cwd = path.default.resolve(process.cwd());

  // Detect git branch if not specified
  let branch = values.branch || "unknown";
  if (!values.branch) {
    try {
      branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd, encoding: "utf-8" }).trim();
    } catch {
      // Not a git repo or git not available
    }
  }

  // Validate domain
  const validDomains = ["BACK", "FRONT", "SEO", "SEC", "TEST", "INFRA", "DOC"];
  const domain = values.domain?.toUpperCase() || null;
  if (domain && !validDomains.includes(domain)) {
    console.error(`Invalid domain: ${values.domain}. Valid: ${validDomains.join(", ")}`);
    process.exit(1);
  }

  // Spawn the native terminal
  const { spawnNativeTerminal } = await import("./spawner/index.js");
  const result = await spawnNativeTerminal({
    project: values.project,
    worktree: values.worktree,
    cwd,
    title: `${values.project}/${values.worktree}`,
  });

  if (!result.success) {
    console.error(`Failed to launch terminal: ${result.error}`);
    process.exit(1);
  }

  // Register session with daemon via IPC
  const { IPC_PATH } = await import("./shared/constants.js");
  const { serialize } = await import("./shared/ipc-protocol.js");

  const session = {
    id: crypto.randomUUID(),
    project: values.project,
    worktree: values.worktree,
    branch,
    status: "idle" as const,
    domain: domain as import("./shared/types.js").SessionDomain,
    lastCommit: null,
    lastActivity: new Date().toISOString(),
    filesModified: [],
    terminalPid: result.terminalPid || null,
    claudeSessionId: null,
    cwd,
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const client = net.createConnection(IPC_PATH, () => {
        const msg = serialize({ type: "session_created", payload: session });
        client.write(msg);
        client.end();
        resolve();
      });
      client.on("error", reject);
      setTimeout(() => reject(new Error("timeout")), 2000);
    });
  } catch {
    // Daemon not running, write directly to state file
    const fs = await import("node:fs");
    const { STATE_FILE, ELEMENTERM_DIR } = await import("./shared/constants.js");
    fs.mkdirSync(ELEMENTERM_DIR, { recursive: true });
    let state = { sessions: {} as Record<string, typeof session>, projects: {} as Record<string, { name: string; path: string; sessions: string[] }>, daemon: { startedAt: "", pid: 0, version: VERSION } };
    if (fs.existsSync(STATE_FILE)) {
      try { state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")); } catch { /* fresh state */ }
    }
    state.sessions[session.id] = session;
    if (!state.projects[session.project]) {
      state.projects[session.project] = { name: session.project, path: path.default.dirname(cwd), sessions: [] };
    }
    state.projects[session.project].sessions.push(session.id);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  }

  const domainTag = domain ? ` [${domain}]` : "";
  console.log(`Session launched: ${values.project}/${values.worktree}${domainTag} (${branch})`);
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
