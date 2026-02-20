import React from "react";
import { Box, Text } from "ink";
import type { Session } from "../../shared/types.js";
import {
  STATUS_COLORS,
  STATUS_ICONS,
  DOMAIN_COLORS,
} from "../../shared/constants.js";

interface FocusViewProps {
  session: Session;
}

export function FocusView({ session }: FocusViewProps) {
  const statusColor = STATUS_COLORS[session.status] || "gray";
  const icon = STATUS_ICONS[session.status] || "?";
  const statusLabel = session.status.charAt(0).toUpperCase() + session.status.slice(1);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Session header */}
      <Box flexDirection="row" gap={2} marginBottom={1}>
        <Box flexDirection="column">
          <Text color="gray">Status</Text>
          <Text color={statusColor} bold>
            {icon} {statusLabel}
          </Text>
        </Box>
        <Box flexDirection="column">
          <Text color="gray">Branch</Text>
          <Text color="white">{session.branch}</Text>
        </Box>
        {session.domain && (
          <Box flexDirection="column">
            <Text color="gray">Domain</Text>
            <Text color={DOMAIN_COLORS[session.domain] || "white"}>
              [{session.domain}]
            </Text>
          </Box>
        )}
        <Box flexDirection="column">
          <Text color="gray">Worktree</Text>
          <Text color="gray" dimColor>
            {session.cwd}
          </Text>
        </Box>
      </Box>

      {/* Last commit */}
      <Box
        flexDirection="column"
        marginBottom={1}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        <Text bold color="white">
          Last Commit
        </Text>
        {session.lastCommit ? (
          <Box flexDirection="row" gap={2}>
            <Text color="yellow">{session.lastCommit.hash.slice(0, 7)}</Text>
            <Text color="white">"{session.lastCommit.message}"</Text>
            <Text color="gray">{timeSince(session.lastCommit.timestamp)}</Text>
          </Box>
        ) : (
          <Text color="gray" dimColor>
            No commits yet
          </Text>
        )}
      </Box>

      {/* Modified files */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        <Text bold color="white">
          Modified Files ({session.filesModified.length})
        </Text>
        {session.filesModified.length === 0 ? (
          <Text color="gray" dimColor>
            No files modified since last commit
          </Text>
        ) : (
          session.filesModified.slice(0, 10).map((file) => (
            <Text key={file} color="green">
              M {file}
            </Text>
          ))
        )}
        {session.filesModified.length > 10 && (
          <Text color="gray">
            ...and {session.filesModified.length - 10} more
          </Text>
        )}
      </Box>
    </Box>
  );
}

function timeSince(isoDate: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h${minutes % 60}m ago`;
}
