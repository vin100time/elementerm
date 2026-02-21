import { spawn, execSync } from "node:child_process";
import type { SpawnOptions, SpawnResult } from "./index.js";

// Strip Claude Code env vars so the new session doesn't detect nesting
function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.CLAUDECODE;
  delete env.CLAUDE_SESSION_ID;
  return env;
}

export function focusWindows(title: string): boolean {
  try {
    // Try to activate Windows Terminal window matching the session title
    const script = `
      Add-Type -Name User32 -Namespace Win32 -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd); [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);'
      $procs = Get-Process -Name WindowsTerminal -ErrorAction SilentlyContinue
      if ($procs) { $h = $procs[0].MainWindowHandle; [Win32.User32]::ShowWindow($h, 9); [Win32.User32]::SetForegroundWindow($h) }
    `;
    execSync(`powershell -NoProfile -Command "${script.replace(/\n/g, " ")}"`, {
      stdio: "ignore",
      timeout: 3000,
    });
    return true;
  } catch {
    return false;
  }
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
