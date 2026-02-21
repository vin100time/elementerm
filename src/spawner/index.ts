import { platform } from "node:os";
import { spawnWindows, focusWindows } from "./windows.js";
import { spawnMacos, focusMacos } from "./macos.js";
import { spawnLinux, focusLinux } from "./linux.js";

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

export function focusTerminal(title: string): boolean {
  const os = platform();

  switch (os) {
    case "win32":
      return focusWindows(title);
    case "darwin":
      return focusMacos();
    case "linux":
      return focusLinux(title);
    default:
      return false;
  }
}
