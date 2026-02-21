// Session status - semantic states that developers understand instantly
export type SessionStatus =
  | "flow" // Claude is working, everything fine
  | "waiting" // Prompt sent, waiting for Claude response
  | "ready" // Claude finished, waiting for user input
  | "attention" // Warning, non-blocking issue
  | "blocked" // Error, merge conflict, build failure
  | "idle"; // Inactive for a long time

// Domain badges for quick context identification
export type SessionDomain =
  | "BACK"
  | "FRONT"
  | "SEO"
  | "SEC"
  | "TEST"
  | "INFRA"
  | "DOC"
  | null;

// Dashboard view modes - progressive disclosure
export type ViewMode = "glance" | "scan" | "focus";

export interface CommitInfo {
  hash: string;
  message: string;
  timestamp: string;
}

export interface Session {
  id: string;
  project: string;
  worktree: string;
  branch: string;
  status: SessionStatus;
  domain: SessionDomain;
  lastCommit: CommitInfo | null;
  lastActivity: string; // ISO timestamp
  filesModified: string[];
  terminalPid: number | null;
  claudeSessionId: string | null;
  cwd: string;
}

export interface Project {
  name: string;
  path: string;
  sessions: string[]; // session IDs
}

export interface DaemonInfo {
  startedAt: string;
  pid: number;
  version: string;
}

export interface AppState {
  sessions: Record<string, Session>;
  projects: Record<string, Project>;
  daemon: DaemonInfo;
}

// IPC messages between daemon and dashboard/hooks
export interface HookEvent {
  sessionId: string;
  event: "PostToolUse" | "Stop" | "SessionEnd";
  tool?: string;
  filePath?: string;
  timestamp: number;
}

export interface IpcMessage {
  type: "state_update" | "session_created" | "session_removed" | "hook_event" | "daemon_shutdown";
  payload: Partial<AppState> | Session | HookEvent | null;
}
