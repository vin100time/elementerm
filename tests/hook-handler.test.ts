import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { vi } from "vitest";

const tmpDir = path.join(os.tmpdir(), `elementerm-hook-test-${Date.now()}`);
const tmpStateFile = path.join(tmpDir, "state.json");

vi.mock("../src/shared/constants.js", () => ({
  ELEMENTERM_DIR: tmpDir,
  STATE_FILE: tmpStateFile,
  PID_FILE: path.join(tmpDir, "daemon.pid"),
  VERSION: "0.0.0-test",
}));

const { StateStore } = await import("../src/daemon/state-store.js");
const { HookHandler } = await import("../src/daemon/hook-handler.js");

function makeSession(id: string) {
  return {
    id,
    project: "testproj",
    worktree: "feat",
    branch: "wt/feat",
    status: "idle" as const,
    domain: "BACK" as const,
    lastCommit: null,
    lastActivity: "2020-01-01T00:00:00.000Z",
    filesModified: [] as string[],
    terminalPid: null,
    claudeSessionId: null,
    cwd: "/tmp/testproj/.worktrees/feat",
  };
}

describe("HookHandler", () => {
  let store: InstanceType<typeof StateStore>;
  let handler: InstanceType<typeof HookHandler>;

  beforeEach(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
    store = new StateStore();
    store.init();
    handler = new HookHandler(store);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("PostToolUse", () => {
    it("should set status to flow", () => {
      store.addSession(makeSession("s1"));
      handler.handle({
        sessionId: "s1",
        event: "PostToolUse",
        tool: "Edit",
        timestamp: Date.now(),
      });
      expect(store.getSession("s1")?.status).toBe("flow");
    });

    it("should update lastActivity", () => {
      store.addSession(makeSession("s1"));
      handler.handle({
        sessionId: "s1",
        event: "PostToolUse",
        tool: "Edit",
        timestamp: Date.now(),
      });
      const activity = new Date(store.getSession("s1")!.lastActivity);
      expect(activity.getFullYear()).toBeGreaterThan(2020);
    });

    it("should track modified files when filePath provided", () => {
      store.addSession(makeSession("s1"));
      handler.handle({
        sessionId: "s1",
        event: "PostToolUse",
        tool: "Write",
        filePath: "src/foo.ts",
        timestamp: Date.now(),
      });
      expect(store.getSession("s1")?.filesModified).toContain("src/foo.ts");
    });

    it("should not duplicate file paths", () => {
      store.addSession(makeSession("s1"));
      handler.handle({
        sessionId: "s1",
        event: "PostToolUse",
        tool: "Write",
        filePath: "src/foo.ts",
        timestamp: Date.now(),
      });
      handler.handle({
        sessionId: "s1",
        event: "PostToolUse",
        tool: "Edit",
        filePath: "src/foo.ts",
        timestamp: Date.now(),
      });
      expect(store.getSession("s1")?.filesModified.filter((f) => f === "src/foo.ts")).toHaveLength(1);
    });

    it("should accumulate different file paths", () => {
      store.addSession(makeSession("s1"));
      handler.handle({ sessionId: "s1", event: "PostToolUse", tool: "Write", filePath: "src/a.ts", timestamp: Date.now() });
      handler.handle({ sessionId: "s1", event: "PostToolUse", tool: "Write", filePath: "src/b.ts", timestamp: Date.now() });
      expect(store.getSession("s1")?.filesModified).toHaveLength(2);
    });
  });

  describe("Stop", () => {
    it("should set status to ready", () => {
      store.addSession(makeSession("s1"));
      store.updateSession("s1", { status: "flow" });
      handler.handle({ sessionId: "s1", event: "Stop", timestamp: Date.now() });
      expect(store.getSession("s1")?.status).toBe("ready");
    });
  });

  describe("SessionEnd", () => {
    it("should set status to idle", () => {
      store.addSession(makeSession("s1"));
      store.updateSession("s1", { status: "flow" });
      handler.handle({ sessionId: "s1", event: "SessionEnd", timestamp: Date.now() });
      expect(store.getSession("s1")?.status).toBe("idle");
    });
  });

  describe("unknown session", () => {
    it("should ignore events for unknown sessions", () => {
      handler.handle({ sessionId: "ghost", event: "PostToolUse", timestamp: Date.now() });
      expect(store.getSessions()).toHaveLength(0);
    });
  });
});
