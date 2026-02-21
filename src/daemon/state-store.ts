import fs from "node:fs";
import path from "node:path";
import type { AppState, Session, Project } from "../shared/types.js";
import { ELEMENTERM_DIR, STATE_FILE, VERSION } from "../shared/constants.js";

function createEmptyState(): AppState {
  return {
    sessions: {},
    projects: {},
    daemon: {
      startedAt: new Date().toISOString(),
      pid: process.pid,
      version: VERSION,
    },
  };
}

export class StateStore {
  private state: AppState;

  constructor() {
    this.state = createEmptyState();
  }

  init(): void {
    // Ensure the elementerm directory exists
    fs.mkdirSync(ELEMENTERM_DIR, { recursive: true });

    // Load existing state or create new
    if (fs.existsSync(STATE_FILE)) {
      try {
        const raw = fs.readFileSync(STATE_FILE, "utf-8");
        const loaded = JSON.parse(raw) as AppState;
        // Validate basic structure
        if (loaded && typeof loaded.sessions === "object") {
          this.state = {
            ...loaded,
            daemon: {
              startedAt: new Date().toISOString(),
              pid: process.pid,
              version: VERSION,
            },
          };
        } else {
          console.log("State file has invalid structure, starting fresh.");
          this.state = createEmptyState();
        }
      } catch {
        // Backup corrupted file and start fresh
        const backupPath = STATE_FILE + ".bak";
        try {
          fs.copyFileSync(STATE_FILE, backupPath);
          console.log(`Corrupted state file backed up to ${backupPath}`);
        } catch { /* ignore */ }
        this.state = createEmptyState();
      }
    }

    this.save();
  }

  getState(): AppState {
    return this.state;
  }

  reload(): void {
    if (fs.existsSync(STATE_FILE)) {
      try {
        const raw = fs.readFileSync(STATE_FILE, "utf-8");
        const loaded = JSON.parse(raw) as AppState;
        // Keep daemon info from current process
        this.state = {
          ...loaded,
          daemon: this.state.daemon,
        };
      } catch {
        // Keep current state if file is corrupted
      }
    }
  }

  getSession(id: string): Session | undefined {
    return this.state.sessions[id];
  }

  getSessions(): Session[] {
    return Object.values(this.state.sessions);
  }

  getProjects(): Project[] {
    return Object.values(this.state.projects);
  }

  addSession(session: Session): void {
    this.state.sessions[session.id] = session;

    // Ensure project exists
    if (!this.state.projects[session.project]) {
      this.state.projects[session.project] = {
        name: session.project,
        path: path.dirname(session.cwd),
        sessions: [],
      };
    }

    const project = this.state.projects[session.project];
    if (!project.sessions.includes(session.id)) {
      project.sessions.push(session.id);
    }

    this.save();
  }

  updateSession(id: string, updates: Partial<Session>): void {
    const session = this.state.sessions[id];
    if (!session) return;

    Object.assign(session, updates);
    session.lastActivity = new Date().toISOString();
    this.save();
  }

  removeSession(id: string): void {
    const session = this.state.sessions[id];
    if (!session) return;

    // Remove from project
    const project = this.state.projects[session.project];
    if (project) {
      project.sessions = project.sessions.filter((sid) => sid !== id);
      if (project.sessions.length === 0) {
        delete this.state.projects[session.project];
      }
    }

    delete this.state.sessions[id];
    this.save();
  }

  setAllSessionsIdle(): void {
    for (const session of Object.values(this.state.sessions)) {
      session.status = "idle";
    }
  }

  persist(): void {
    this.save();
  }

  private save(): void {
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), "utf-8");
  }

  cleanup(): void {
    // Remove the state file on shutdown
    try {
      fs.unlinkSync(STATE_FILE);
    } catch {
      // Ignore if already gone
    }
  }
}
