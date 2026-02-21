import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { spawn, execSync } from "node:child_process";
import type { AppState, Session } from "../shared/types.js";

interface MasterPanelProps {
  state: AppState | null;
  onClose: () => void;
  active: boolean;
}

type HistoryEntry =
  | { role: "user"; text: string }
  | { role: "master"; text: string }
  | { role: "exec"; command: string; result: string; success: boolean };

// Strip markdown formatting for clean terminal display
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")      // **bold** → bold
    .replace(/\*(.+?)\*/g, "$1")            // *italic* → italic
    .replace(/`(.+?)`/g, "$1")              // `code` → code
    .replace(/^#{1,3}\s+/gm, "")            // ### heading → heading
    .replace(/\|[-:]+\|/g, "")              // |---| table separators
    .replace(/^\|(.+)\|$/gm, (_, row) =>    // |col1|col2| → col1  col2
      row.split("|").map((c: string) => c.trim()).filter(Boolean).join("  ")
    )
    .replace(/^- /gm, "  → ")              // - item → → item
    .replace(/\n{3,}/g, "\n\n")             // collapse multiple newlines
    .trim();
}

// Extract elementerm commands from master response
function extractCommands(text: string): string[] {
  const commands: string[] = [];
  const regex = /(?:^|\n)\s*(?:→\s*)?elementerm\s+[^\n]+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const cmd = match[0].trim().replace(/^→\s*/, "");
    if (cmd.startsWith("elementerm ")) {
      commands.push(cmd);
    }
  }
  return commands;
}

function buildContext(state: AppState | null): string {
  const sessions = state ? Object.values(state.sessions) : [];
  const emoji: Record<string, string> = { flow: "🟢", waiting: "🟡", ready: "🔵", attention: "🟠", blocked: "🔴", idle: "⚪" };

  const lines = sessions.map((s: Session) => {
    const e = emoji[s.status] || "⚪";
    const domain = s.domain ? `[${s.domain}]` : "";
    const commit = s.lastCommit?.message || "no commits";
    const files = s.filesModified.length;
    return `  ${e} ${s.project}/${s.worktree} ${domain} branch:${s.branch} status:${s.status} "${commit}" ${files} fichiers`;
  });

  return `Tu es le Master Orchestrator d'Elementerm, chef d'orchestre de sessions Claude Code.
Tu reponds UNIQUEMENT en texte brut pour un terminal. PAS de markdown, PAS de tableaux, PAS de **bold**, PAS de backticks.
Utilise des tirets (-) pour les listes, des fleches (→) pour les actions.
Reponses courtes (max 8 lignes). Francais. Direct. Zero blabla.

Sessions actives (${sessions.length}):
${lines.join("\n") || "  Aucune session."}

Quand tu recommandes une action, ecris la commande elementerm complete sur sa propre ligne precedee de →.
Exemples:
→ elementerm new -w auth -d BACK
→ elementerm rm s4
→ elementerm status
Le systeme detectera et executera automatiquement ces commandes.`;
}

export function MasterPanel({ state, onClose, active }: MasterPanelProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [thinking, setThinking] = useState(false);
  const executeCommand = useCallback((cmd: string) => {
    try {
      const env = { ...process.env };
      delete env.CLAUDECODE;
      delete env.CLAUDE_SESSION_ID;
      const result = execSync(cmd, { env, timeout: 10000, encoding: "utf-8" }).trim();
      setHistory((prev) => [...prev, { role: "exec", command: cmd, result: result || "OK", success: true }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setHistory((prev) => [...prev, { role: "exec", command: cmd, result: msg.slice(0, 200), success: false }]);
    }
  }, []);

  const sendToMaster = useCallback((message: string) => {
    if (!message.trim() || thinking) return;

    setHistory((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setThinking(true);

    const context = buildContext(state);
    const fullPrompt = `${context}\n\nUtilisateur: ${message}`;

    const env = { ...process.env };
    delete env.CLAUDECODE;

    const child = spawn("claude", ["-p", "--output-format", "text"], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let out = "";
    let err = "";

    child.stdout.on("data", (data: Buffer) => { out += data.toString(); });
    child.stderr.on("data", (data: Buffer) => { err += data.toString(); });

    child.on("close", (code: number | null) => {
      setThinking(false);
      if (code !== 0 && err) {
        setHistory((prev) => [...prev, { role: "master", text: `Erreur: ${err.slice(0, 200)}` }]);
      } else {
        const clean = stripMarkdown(out);
        setHistory((prev) => [...prev, { role: "master", text: clean }]);

        // Auto-execute detected elementerm commands
        const commands = extractCommands(clean);
        for (const cmd of commands) {
          executeCommand(cmd);
        }
      }
    });

    child.on("error", (e: Error) => {
      setThinking(false);
      setHistory((prev) => [...prev, { role: "master", text: `Erreur: ${e.message}` }]);
    });

    child.stdin.write(fullPrompt);
    child.stdin.end();

    setTimeout(() => { try { child.kill(); } catch { /* */ } }, 30000);
  }, [state, thinking, executeCommand]);

  useInput((ch, key) => {
    if (!active) return;

    if (key.escape) { onClose(); return; }
    if (key.return) { sendToMaster(input); return; }
    if (key.backspace || key.delete) { setInput((prev) => prev.slice(0, -1)); return; }

    if (ch && !key.ctrl && !key.meta && ch.length === 1) {
      setInput((prev) => prev + ch);
    }
  }, { isActive: active });

  if (!active) return null;

  // Show last 4 exchanges max to avoid overflow
  const visibleHistory = history.slice(-6);

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="magenta"
      paddingX={1}
      width="100%"
    >
      {/* Panel header */}
      <Box justifyContent="space-between">
        <Text bold color="magenta">♦ MASTER</Text>
        <Text color="gray" dimColor>[Esc] fermer</Text>
      </Box>

      {/* Chat history */}
      {visibleHistory.map((msg, i) => (
        <Box key={i} flexDirection="column" paddingX={1}>
          {msg.role === "user" ? (
            <Text wrap="wrap">
              <Text color="cyan" bold>{"› "}</Text>
              <Text color="white">{msg.text}</Text>
            </Text>
          ) : msg.role === "exec" ? (
            <Box flexDirection="column">
              <Text wrap="wrap">
                <Text color={msg.success ? "green" : "red"}>{msg.success ? "⚡ " : "✗ "}</Text>
                <Text color="yellow">{msg.command}</Text>
              </Text>
              {msg.result && (
                <Text wrap="wrap">
                  <Text color="gray">{"  "}{msg.result}</Text>
                </Text>
              )}
            </Box>
          ) : (
            <Box flexDirection="column">
              {msg.text.split("\n").map((line, j) => (
                <Text key={j} wrap="wrap">
                  <Text color="magenta">{j === 0 ? "♦ " : "  "}</Text>
                  <Text color="white">{line}</Text>
                </Text>
              ))}
            </Box>
          )}
        </Box>
      ))}

      {/* Thinking */}
      {thinking && (
        <Box paddingX={1}>
          <Text color="magenta">♦ </Text>
          <Text color="magenta" dimColor>reflexion...</Text>
        </Box>
      )}

      {/* Input */}
      <Box paddingX={1} marginTop={0}>
        <Text color="cyan" bold>{"› "}</Text>
        <Text color="white">{input}</Text>
        <Text color="cyan">█</Text>
      </Box>
    </Box>
  );
}
