#!/usr/bin/env node

// Elementerm Hook for Claude Code
// Installed in each worktree's .claude/settings.json
// Reports events to the Elementerm daemon via named pipe

import { createConnection } from "node:net";
import { readFileSync } from "node:fs";
import { platform } from "node:os";
import { join } from "node:path";

const IPC_PATH =
  platform() === "win32"
    ? "\\\\.\\pipe\\elementerm"
    : join(process.env.HOME || "~", ".elementerm", "elementerm.sock");

try {
  // Read hook input from stdin (Claude Code sends JSON)
  let input = "";
  try {
    input = readFileSync(0, "utf-8"); // fd 0 = stdin
  } catch {
    // No stdin data
  }

  let hookData = {};
  try {
    hookData = JSON.parse(input);
  } catch {
    // Not JSON, ignore
  }

  // Session ID from environment (set by elementerm during hook installation)
  const sessionId = process.env.ELEMENTERM_SESSION_ID || "unknown";

  // Event type: Claude Code hook names map to our events
  // The hook_event_name field tells us which hook fired
  const event = hookData.hook_event_name || process.env.ELEMENTERM_EVENT || "PostToolUse";

  const message = JSON.stringify({
    type: "hook_event",
    payload: {
      sessionId,
      event,
      tool: hookData.tool_name || null,
      filePath: hookData.tool_input?.file_path || hookData.file_path || null,
      timestamp: Date.now(),
    },
  }) + "\n";

  // Send to daemon (fire and forget)
  const client = createConnection(IPC_PATH, () => {
    client.write(message);
    client.end();
  });

  client.on("error", () => {
    // Daemon not running, silently ignore
  });

  // Don't hang - exit after 1s max
  setTimeout(() => process.exit(0), 1000);
} catch {
  // Never block Claude Code - exit silently on any error
  process.exit(0);
}
