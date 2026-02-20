import { spawn } from "node:child_process";
import type { SpawnOptions, SpawnResult } from "./index.js";

// Strip Claude Code env vars so the new session doesn't detect nesting
function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.CLAUDECODE;
  delete env.CLAUDE_SESSION_ID;
  return env;
}

export async function spawnWindows(
  options: SpawnOptions
): Promise<SpawnResult> {
  const title = options.title || `${options.project}/${options.worktree}`;
  const env = cleanEnv();

  try {
    // Use Windows Terminal (wt.exe) to open a new tab with claude
    const child = spawn(
      "wt.exe",
      [
        "-w",
        "0", // Current window (new tab in same window)
        "nt", // New tab
        "--title",
        title,
        "-d",
        options.cwd,
        "--",
        "claude",
      ],
      {
        detached: true,
        stdio: "ignore",
        env,
      }
    );

    child.unref();

    return {
      success: true,
      terminalPid: child.pid,
    };
  } catch (error) {
    // Fallback: try cmd.exe start
    try {
      const child = spawn("cmd.exe", ["/c", "start", "cmd", "/k", `cd /d "${options.cwd}" && claude`], {
        detached: true,
        stdio: "ignore",
        env,
      });
      child.unref();

      return {
        success: true,
        terminalPid: child.pid,
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: `Failed to spawn terminal: ${error}`,
      };
    }
  }
}
