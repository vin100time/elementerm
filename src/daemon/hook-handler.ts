import type { HookEvent } from "../shared/types.js";
import type { StateStore } from "./state-store.js";

export class HookHandler {
  constructor(private store: StateStore) {}

  handle(event: HookEvent): void {
    const session = this.store.getSession(event.sessionId);
    if (!session) return;

    switch (event.event) {
      case "PostToolUse":
        this.handlePostToolUse(event);
        break;
      case "Stop":
        this.handleStop(event);
        break;
      case "SessionEnd":
        this.handleSessionEnd(event);
        break;
    }
  }

  private handlePostToolUse(event: HookEvent): void {
    const updates: Record<string, unknown> = {
      status: "flow",
      lastActivity: new Date().toISOString(),
    };

    // Track modified files
    if (event.filePath) {
      const session = this.store.getSession(event.sessionId);
      if (session) {
        const files = new Set(session.filesModified);
        files.add(event.filePath);
        updates.filesModified = [...files];
      }
    }

    this.store.updateSession(event.sessionId, updates);
  }

  private handleStop(event: HookEvent): void {
    // Claude finished responding, waiting for user
    this.store.updateSession(event.sessionId, {
      status: "ready",
    });
  }

  private handleSessionEnd(event: HookEvent): void {
    this.store.updateSession(event.sessionId, {
      status: "idle",
    });
  }
}
