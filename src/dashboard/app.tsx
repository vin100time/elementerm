import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import net from "node:net";
import fs from "node:fs";
import { IPC_PATH, PID_FILE, STATE_FILE, VERSION } from "../shared/constants.js";
import { deserialize } from "../shared/ipc-protocol.js";
import type { AppState, Session, ViewMode } from "../shared/types.js";
import { GlanceView } from "./views/glance.js";
import { ScanView } from "./views/scan.js";
import { FocusView } from "./views/focus.js";

function useDaemonConnection(): AppState | null {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    // Load initial state from file
    if (fs.existsSync(STATE_FILE)) {
      try {
        const raw = fs.readFileSync(STATE_FILE, "utf-8");
        setState(JSON.parse(raw));
      } catch {
        // Ignore
      }
    }

    // Connect to daemon IPC for live updates
    const client = net.connect(IPC_PATH);
    let buffer = "";

    client.on("data", (data) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim().length === 0) continue;
        try {
          const messages = deserialize(line + "\n");
          for (const msg of messages) {
            if (msg.type === "state_update") {
              setState(msg.payload as AppState);
            }
          }
        } catch {
          // Ignore
        }
      }
    });

    client.on("error", () => {
      // Daemon not running or connection lost - keep showing last state
    });

    // Poll state file as fallback
    const interval = setInterval(() => {
      if (fs.existsSync(STATE_FILE)) {
        try {
          const raw = fs.readFileSync(STATE_FILE, "utf-8");
          setState(JSON.parse(raw));
        } catch {
          // Ignore
        }
      }
    }, 2000);

    return () => {
      client.destroy();
      clearInterval(interval);
    };
  }, []);

  return state;
}

function App() {
  const { exit } = useApp();
  const state = useDaemonConnection();
  const [view, setView] = useState<ViewMode>("scan");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const sessions: Session[] = state ? Object.values(state.sessions) : [];
  const selectedSession = sessions[selectedIndex] || null;

  useInput((input, key) => {
    // View switching
    if (input === "g") setView("glance");
    if (input === "s") setView("scan");
    if (input === "f" && selectedSession) setView("focus");
    if (input === "q") exit();

    // Navigation
    if (key.tab) {
      setSelectedIndex((prev) => (prev + 1) % Math.max(sessions.length, 1));
    }
    if (key.return) {
      setView((prev) => (prev === "focus" ? "scan" : "focus"));
    }
    if (key.escape) {
      if (view === "focus") setView("scan");
      else if (view === "scan") setView("glance");
    }

    // Number keys for direct jump
    const num = parseInt(input);
    if (num >= 1 && num <= 9 && num <= sessions.length) {
      setSelectedIndex(num - 1);
    }
  });

  return (
    <Box flexDirection="column" width="100%">
      <Header
        sessionCount={sessions.length}
        view={view}
        uptime={state?.daemon.startedAt}
      />

      {sessions.length === 0 ? (
        <Box padding={1}>
          <Text color="gray">
            No active sessions. Run 'elementerm new --project myapp --worktree
            feat-auth' to create one.
          </Text>
        </Box>
      ) : (
        <>
          {view === "glance" && (
            <GlanceView
              sessions={sessions}
              projects={state?.projects || {}}
              selectedIndex={selectedIndex}
            />
          )}
          {view === "scan" && (
            <ScanView
              sessions={sessions}
              projects={state?.projects || {}}
              selectedIndex={selectedIndex}
            />
          )}
          {view === "focus" && selectedSession && (
            <FocusView session={selectedSession} />
          )}
        </>
      )}

      <Footer view={view} />
    </Box>
  );
}

function Header({
  sessionCount,
  view,
  uptime,
}: {
  sessionCount: number;
  view: ViewMode;
  uptime?: string;
}) {
  const elapsed = uptime ? timeSince(uptime) : "-";
  const viewLabel = view.toUpperCase();

  return (
    <Box
      borderStyle="single"
      borderColor="cyan"
      paddingX={1}
      justifyContent="space-between"
    >
      <Text bold color="cyan">
        ELEMENTERM
      </Text>
      <Text color="white">
        {viewLabel} | {sessionCount} session{sessionCount !== 1 ? "s" : ""} |{" "}
        {elapsed}
      </Text>
    </Box>
  );
}

function Footer({ view }: { view: ViewMode }) {
  return (
    <Box paddingX={1} marginTop={1}>
      <Text color="gray">
        [g]lance [s]can [f]ocus [Tab]next [1-9]jump{" "}
        {view === "focus" ? "[Esc]back " : ""}[q]uit
      </Text>
    </Box>
  );
}

function timeSince(isoDate: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h${minutes % 60}m`;
}

export async function renderDashboard(): Promise<void> {
  if (!fs.existsSync(PID_FILE)) {
    console.error(
      "Elementerm daemon is not running. Run 'elementerm start' first."
    );
    process.exit(1);
  }

  render(<App />);
}
