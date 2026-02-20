import { execFile } from "node:child_process";
import type { SpawnOptions, SpawnResult } from "./index.js";

export async function spawnMacos(options: SpawnOptions): Promise<SpawnResult> {
  return new Promise((resolve) => {
    // Unset CLAUDECODE so the new session doesn't detect nesting
    const script = `
      tell application "Terminal"
        activate
        do script "unset CLAUDECODE && cd '${options.cwd}' && claude"
      end tell
    `;

    execFile("osascript", ["-e", script], (error) => {
      if (error) {
        resolve({
          success: false,
          error: `Failed to spawn Terminal.app: ${error.message}`,
        });
      } else {
        resolve({ success: true });
      }
    });
  });
}
