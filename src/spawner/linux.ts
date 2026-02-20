import { spawn } from "node:child_process";
import type { SpawnOptions, SpawnResult } from "./index.js";

export async function spawnLinux(options: SpawnOptions): Promise<SpawnResult> {
  // Try common terminal emulators in order of preference
  const terminals = [
    { cmd: "x-terminal-emulator", args: ["-e", `cd '${options.cwd}' && claude`] },
    { cmd: "gnome-terminal", args: ["--", "bash", "-c", `cd '${options.cwd}' && claude`] },
    { cmd: "konsole", args: ["-e", "bash", "-c", `cd '${options.cwd}' && claude`] },
    { cmd: "xfce4-terminal", args: ["-e", `bash -c "cd '${options.cwd}' && claude"`] },
    { cmd: "xterm", args: ["-e", `cd '${options.cwd}' && claude`] },
  ];

  for (const terminal of terminals) {
    try {
      const child = spawn(terminal.cmd, terminal.args, {
        detached: true,
        stdio: "ignore",
      });
      child.unref();

      return {
        success: true,
        terminalPid: child.pid,
      };
    } catch {
      // Try next terminal
      continue;
    }
  }

  return {
    success: false,
    error: "No supported terminal emulator found. Tried: x-terminal-emulator, gnome-terminal, konsole, xfce4-terminal, xterm",
  };
}
