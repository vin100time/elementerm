import React from "react";
import { Box, Text } from "ink";
import type { Session } from "../../shared/types.js";

interface FocusViewProps {
  session: Session;
  statusEmoji: Record<string, string>;
  statusLabel: Record<string, string>;
  domainColors: Record<string, string>;
  timeSince: (isoDate: string) => string;
}

export function FocusView({
  session,
  statusEmoji,
  statusLabel,
  domainColors,
  timeSince,
}: FocusViewProps) {
  const emoji = statusEmoji[session.status] || "⚪";
  const label = statusLabel[session.status] || "Unknown";
  const domainColor = session.domain
    ? domainColors[session.domain] || "white"
    : "gray";
  const sessionAge = timeSince(session.lastActivity);

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      {/* Session meta */}
      <Box flexDirection="row" gap={2} marginBottom={1}>
        <Box flexDirection="column">
          <Text color="gray" dimColor>Statut</Text>
          <Text bold>{emoji} {label}</Text>
        </Box>
        <Box flexDirection="column">
          <Text color="gray" dimColor>Branche</Text>
          <Text color="cyan">{session.branch}</Text>
        </Box>
        {session.domain && (
          <Box flexDirection="column">
            <Text color="gray" dimColor>Domaine</Text>
            <Text color={domainColor} bold>[{session.domain}]</Text>
          </Box>
        )}
        <Box flexDirection="column">
          <Text color="gray" dimColor>Activite</Text>
          <Text color="gray">{sessionAge}</Text>
        </Box>
      </Box>

      {/* Worktree path */}
      <Box marginBottom={1}>
        <Text color="gray" dimColor>Worktree: </Text>
        <Text color="gray">{session.cwd}</Text>
      </Box>

      {/* Separator */}
      <Text color="gray" dimColor>{"── Derniers Commits ──────────────────────────────────"}</Text>

      {/* Commits */}
      <Box flexDirection="column" marginBottom={1} paddingX={1}>
        {session.lastCommit ? (
          <Box flexDirection="row" gap={2}>
            <Text color="yellow">{session.lastCommit.hash.slice(0, 7)}</Text>
            <Text color="white">"{session.lastCommit.message}"</Text>
            <Text color="gray" dimColor>{timeSince(session.lastCommit.timestamp)}</Text>
          </Box>
        ) : (
          <Text color="gray" dimColor>Aucun commit enregistre</Text>
        )}
      </Box>

      {/* Separator */}
      <Text color="gray" dimColor>{"── Fichiers Modifies ({0}) ─────────────────────────────".replace("{0}", String(session.filesModified.length))}</Text>

      {/* Modified files */}
      <Box flexDirection="column" paddingX={1} marginBottom={1}>
        {session.filesModified.length === 0 ? (
          <Text color="gray" dimColor>Aucun fichier modifie depuis le dernier commit</Text>
        ) : (
          session.filesModified.slice(0, 10).map((file) => (
            <Text key={file}>
              <Text color="green">M  </Text>
              <Text color="white">{file}</Text>
            </Text>
          ))
        )}
        {session.filesModified.length > 10 && (
          <Text color="gray" dimColor>
            ...et {session.filesModified.length - 10} de plus
          </Text>
        )}
      </Box>
    </Box>
  );
}
