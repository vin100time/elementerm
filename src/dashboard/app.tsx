import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput, useApp, useStdout } from "ink";
import net from "node:net";
import fs from "node:fs";
import { IPC_PATH, PID_FILE, STATE_FILE } from "../shared/constants.js";
import { deserialize } from "../shared/ipc-protocol.js";
import type { AppState, Session, ViewMode } from "../shared/types.js";
import { GlanceView } from "./views/glance.js";
import { ScanView } from "./views/scan.js";
import { FocusView } from "./views/focus.js";
import { MasterPanel } from "./master-panel.js";
import { focusTerminal } from "../spawner/index.js";

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
      // Daemon not running - keep showing file state
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

const STATUS_EMOJI: Record<string, string> = {
  flow: "🟢",
  waiting: "🟡",
  ready: "🔵",
  attention: "🟠",
  blocked: "🔴",
  idle: "⚪",
};

const STATUS_LABEL: Record<string, string> = {
  flow: "Flow",
  waiting: "Waiting",
  ready: "Ready",
  attention: "Attention",
  blocked: "Blocked",
  idle: "Idle",
};

const DOMAIN_COLORS: Record<string, string> = {
  BACK: "cyan",
  FRONT: "magenta",
  SEO: "green",
  SEC: "red",
  TEST: "yellow",
  INFRA: "blue",
  DOC: "white",
};

function timeSince(isoDate: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d`;
}

function groupByProject(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    const list = map.get(s.project) || [];
    list.push(s);
    map.set(s.project, list);
  }
  return map;
}

function App() {
  const { exit } = useApp();
  const state = useDaemonConnection();
  const [view, setView] = useState<ViewMode>("scan");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [masterActive, setMasterActive] = useState(false);

  const sessions: Session[] = state ? Object.values(state.sessions) : [];
  const selectedSession = sessions[selectedIndex] || null;

  useInput((input, key) => {
    // When master panel is active, don't capture keys
    if (masterActive) return;

    if (input === "g") setView("glance");
    if (input === "s") setView("scan");
    if (input === "f" && selectedSession) setView("focus");
    if (input === "o" && selectedSession) {
      const title = `${selectedSession.project}/${selectedSession.worktree}`;
      focusTerminal(title);
      return;
    }
    if (input === "m") { setMasterActive(true); return; }
    if (input === "q") exit();

    if (key.tab) {
      setSelectedIndex((prev) => (prev + 1) % Math.max(sessions.length, 1));
    }
    if (key.return) {
      if (view === "focus") setView("scan");
      else if (selectedSession) setView("focus");
    }
    if (key.escape) {
      if (view === "focus") setView("scan");
      else if (view === "scan") setView("glance");
    }

    const num = parseInt(input);
    if (num >= 1 && num <= 9 && num <= sessions.length) {
      setSelectedIndex(num - 1);
    }
  });

  const { stdout } = useStdout();
  const termHeight = stdout?.rows || 24;
  const termWidth = stdout?.columns || 80;

  const elapsed = state?.daemon.startedAt ? timeSince(state.daemon.startedAt) : "-";

  // Breadcrumb for focus view
  const breadcrumb = view === "focus" && selectedSession
    ? ` > ${selectedSession.project} > ${selectedSession.worktree}`
    : "";

  // Header = 3 lines (border + text + border), Footer = 2 lines
  const bodyHeight = Math.max(termHeight - 5, 5);

  return (
    <Box flexDirection="column" width={termWidth} height={termHeight}>
      {/* ═══ HEADER ═══ */}
      <Box
        borderStyle="double"
        borderColor="cyan"
        paddingX={1}
        justifyContent="space-between"
        width="100%"
      >
        <Text bold color="cyan">
          ELEMENTERM{breadcrumb}
        </Text>
        <Text color="white">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} | {elapsed}
        </Text>
      </Box>

      {/* ═══ BODY ═══ */}
      <Box flexDirection="column" flexGrow={1} height={bodyHeight}>
        {sessions.length === 0 ? (
          <Box paddingX={2} paddingY={1} flexGrow={1}>
            <Text color="gray">
              No active sessions.{"\n\n"}
              <Text color="white">Start a session:</Text>{"\n"}
              <Text color="cyan">  elementerm new -w feat-auth -d BACK</Text>{"\n\n"}
              <Text color="gray" dimColor>Sessions will appear here in real-time.</Text>
            </Text>
          </Box>
        ) : (
          <>
            {view === "glance" && (
              <GlanceView
                sessions={sessions}
                groupByProject={groupByProject}
                selectedIndex={selectedIndex}
                statusEmoji={STATUS_EMOJI}
              />
            )}
            {view === "scan" && (
              <ScanView
                sessions={sessions}
                groupByProject={groupByProject}
                selectedIndex={selectedIndex}
                statusEmoji={STATUS_EMOJI}
                domainColors={DOMAIN_COLORS}
                timeSince={timeSince}
              />
            )}
            {view === "focus" && selectedSession && (
              <FocusView
                session={selectedSession}
                statusEmoji={STATUS_EMOJI}
                statusLabel={STATUS_LABEL}
                domainColors={DOMAIN_COLORS}
                timeSince={timeSince}
              />
            )}
          </>
        )}
      </Box>

      {/* ═══ MASTER PANEL ═══ */}
      <MasterPanel
        state={state}
        onClose={() => setMasterActive(false)}
        active={masterActive}
      />

      {/* ═══ FOOTER ═══ */}
      <Box paddingX={1} borderStyle="single" borderColor="gray" borderTop={true} borderBottom={false} borderLeft={false} borderRight={false}>
        {view === "glance" && (
          <Text color="gray">
            <Text color="white" bold>[g]</Text>lance  <Text color="white" bold>[s]</Text>can  <Text color="white" bold>[f]</Text>ocus  <Text color="green" bold>[o]</Text><Text color="green">pen</Text>  <Text color="magenta" bold>[m]</Text><Text color="magenta">aster</Text>  <Text color="white" bold>[Tab]</Text>next  <Text color="white" bold>[1-9]</Text>jump  <Text color="white" bold>[q]</Text>uit
          </Text>
        )}
        {view === "scan" && (
          <Text color="gray">
            <Text color="white" bold>[g]</Text>lance  <Text color="white" bold>[s]</Text>can  <Text color="white" bold>[f]</Text>ocus  <Text color="green" bold>[o]</Text><Text color="green">pen</Text>  <Text color="magenta" bold>[m]</Text><Text color="magenta">aster</Text>  <Text color="white" bold>[Tab]</Text>next  <Text color="white" bold>[Enter]</Text>focus  <Text color="white" bold>[q]</Text>uit
          </Text>
        )}
        {view === "focus" && (
          <Text color="gray">
            <Text color="white" bold>[Esc]</Text>back  <Text color="green" bold>[o]</Text><Text color="green">pen</Text>  <Text color="white" bold>[s]</Text>can  <Text color="white" bold>[g]</Text>lance  <Text color="magenta" bold>[m]</Text><Text color="magenta">aster</Text>  <Text color="white" bold>[Tab]</Text>next  <Text color="white" bold>[q]</Text>uit
          </Text>
        )}
      </Box>
    </Box>
  );
}

export async function renderDashboard(): Promise<void> {
  if (!fs.existsSync(PID_FILE)) {
    console.error(
      "Warning: Elementerm daemon is not running. Dashboard will show last known state."
    );
    console.error("Run 'elementerm start' to enable real-time updates.\n");
  }

  // Clear screen and render fullscreen
  process.stdout.write("\x1B[2J\x1B[H");
  render(<App />);
}
