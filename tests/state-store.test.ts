import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// We'll test the StateStore logic by importing and using a temp directory
// Since StateStore uses constants, we need to mock the file paths
import { vi } from "vitest";

const tmpDir = path.join(os.tmpdir(), `elementerm-test-${Date.now()}`);
const tmpStateFile = path.join(tmpDir, "state.json");

vi.mock("../src/shared/constants.js", () => ({
  ELEMENTERM_DIR: tmpDir,
  STATE_FILE: tmpStateFile,
  PID_FILE: path.join(tmpDir, "daemon.pid"),
  VERSION: "0.0.0-test",
}));

// Import after mock
const { StateStore } = await import("../src/daemon/state-store.js");

function makeSession(id: string, project = "testproj", worktree = "feat") {
  return {
    id,
    project,
    worktree,
    branch: `wt/${worktree}`,
    status: "idle" as const,
    domain: "BACK" as const,
    lastCommit: null,
    lastActivity: new Date().toISOString(),
    filesModified: [],
    terminalPid: null,
    claudeSessionId: null,
    cwd: `/tmp/${project}/.worktrees/${worktree}`,
  };
}

describe("StateStore", () => {
  let store: InstanceType<typeof StateStore>;

  beforeEach(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
    store = new StateStore();
    store.init();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should initialize with empty state", () => {
    const state = store.getState();
    expect(state.sessions).toEqual({});
    expect(state.projects).toEqual({});
    expect(state.daemon.version).toBe("0.0.0-test");
    expect(state.daemon.pid).toBe(process.pid);
  });

  it("should persist state to file", () => {
    expect(fs.existsSync(tmpStateFile)).toBe(true);
    const raw = JSON.parse(fs.readFileSync(tmpStateFile, "utf-8"));
    expect(raw.daemon).toBeDefined();
  });

  it("should add a session", () => {
    const session = makeSession("s1", "myapp", "auth");
    store.addSession(session);

    expect(store.getSession("s1")).toBeDefined();
    expect(store.getSession("s1")?.worktree).toBe("auth");
    expect(store.getSessions()).toHaveLength(1);
  });

  it("should create project when adding first session", () => {
    store.addSession(makeSession("s1", "myapp", "auth"));
    const projects = store.getProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("myapp");
    expect(projects[0].sessions).toContain("s1");
  });

  it("should group sessions under same project", () => {
    store.addSession(makeSession("s1", "myapp", "auth"));
    store.addSession(makeSession("s2", "myapp", "api"));
    const projects = store.getProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].sessions).toHaveLength(2);
  });

  it("should update session", () => {
    store.addSession(makeSession("s1"));
    store.updateSession("s1", { status: "flow" });
    expect(store.getSession("s1")?.status).toBe("flow");
  });

  it("should update lastActivity on session update", () => {
    const session = makeSession("s1");
    session.lastActivity = "2020-01-01T00:00:00.000Z";
    store.addSession(session);

    store.updateSession("s1", { status: "flow" });
    const updated = store.getSession("s1");
    expect(new Date(updated!.lastActivity).getFullYear()).toBeGreaterThan(2020);
  });

  it("should track modified files", () => {
    store.addSession(makeSession("s1"));
    store.updateSession("s1", { filesModified: ["src/a.ts", "src/b.ts"] });
    expect(store.getSession("s1")?.filesModified).toEqual(["src/a.ts", "src/b.ts"]);
  });

  it("should remove session", () => {
    store.addSession(makeSession("s1", "myapp", "auth"));
    store.removeSession("s1");
    expect(store.getSession("s1")).toBeUndefined();
    expect(store.getSessions()).toHaveLength(0);
  });

  it("should remove project when last session removed", () => {
    store.addSession(makeSession("s1", "myapp", "auth"));
    store.removeSession("s1");
    expect(store.getProjects()).toHaveLength(0);
  });

  it("should keep project when other sessions remain", () => {
    store.addSession(makeSession("s1", "myapp", "auth"));
    store.addSession(makeSession("s2", "myapp", "api"));
    store.removeSession("s1");
    expect(store.getProjects()).toHaveLength(1);
    expect(store.getProjects()[0].sessions).toEqual(["s2"]);
  });

  it("should reload from file", () => {
    store.addSession(makeSession("s1", "myapp", "auth"));

    // Externally modify the file (simulate another process writing)
    const raw = JSON.parse(fs.readFileSync(tmpStateFile, "utf-8"));
    raw.sessions.s1.status = "blocked";
    fs.writeFileSync(tmpStateFile, JSON.stringify(raw), "utf-8");

    store.reload();
    expect(store.getSession("s1")?.status).toBe("blocked");
  });

  it("should keep daemon info on reload", () => {
    const daemonPid = store.getState().daemon.pid;
    store.addSession(makeSession("s1"));
    store.reload();
    expect(store.getState().daemon.pid).toBe(daemonPid);
  });

  it("should set all sessions to idle", () => {
    store.addSession(makeSession("s1"));
    store.addSession(makeSession("s2", "proj2", "feat2"));
    store.updateSession("s1", { status: "flow" });
    store.updateSession("s2", { status: "blocked" });

    store.setAllSessionsIdle();
    expect(store.getSession("s1")?.status).toBe("idle");
    expect(store.getSession("s2")?.status).toBe("idle");
  });

  it("should ignore update on non-existent session", () => {
    store.updateSession("nonexistent", { status: "flow" });
    expect(store.getSessions()).toHaveLength(0);
  });

  it("should ignore remove on non-existent session", () => {
    store.removeSession("nonexistent");
    expect(store.getSessions()).toHaveLength(0);
  });
});
