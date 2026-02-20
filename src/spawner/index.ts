import { platform } from "node:os";
import { spawnWindows } from "./windows.js";
import { spawnMacos } from "./macos.js";
import { spawnLinux } from "./linux.js";

export interface SpawnOptions {
  project: string;
  worktree: string;
  cwd: string;
  title?: string;
}

export interface SpawnResult {
  success: boolean;
  terminalPid?: number;
  error?: string;
}

export async function spawnNativeTerminal(
  options: SpawnOptions
): Promise<SpawnResult> {
  const os = platform();

  switch (os) {
    case "win32":
      return spawnWindows(options);
    case "darwin":
      return spawnMacos(options);
    case "linux":
      return spawnLinux(options);
    default:
      return {
        success: false,
        error: `Unsupported platform: ${os}`,
      };
  }
}
