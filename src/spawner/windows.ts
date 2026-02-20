import { spawn } from "node:child_process";
import type { SpawnOptions, SpawnResult } from "./index.js";

export async function spawnWindows(
  options: SpawnOptions
): Promise<SpawnResult> {
  const title = options.title || `${options.project}/${options.worktree}`;

  try {
    // Use Windows Terminal (wt.exe) to open a new tab with claude
    const child = spawn(
      "wt.exe",
      [
        "-w",
        "0", // Current window (use "new" for a new window)
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
