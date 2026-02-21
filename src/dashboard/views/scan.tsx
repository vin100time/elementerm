import React from "react";
import { Box, Text } from "ink";
import type { Session } from "../../shared/types.js";

interface ScanViewProps {
  sessions: Session[];
  groupByProject: (sessions: Session[]) => Map<string, Session[]>;
  selectedIndex: number;
  statusEmoji: Record<string, string>;
  domainColors: Record<string, string>;
  timeSince: (isoDate: string) => string;
}

export function ScanView({
  sessions,
  groupByProject,
  selectedIndex,
  statusEmoji,
  domainColors,
  timeSince,
}: ScanViewProps) {
  const byProject = groupByProject(sessions);
  let globalIndex = 0;

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      {[...byProject.entries()].map(([projectName, projectSessions]) => (
        <Box
          key={projectName}
          flexDirection="column"
          borderStyle="single"
          borderColor="gray"
          marginBottom={1}
        >
          {/* Project header */}
          <Box paddingX={1}>
            <Text bold color="white">
              {projectName}
            </Text>
            <Text color="gray" dimColor>
              {" "}({projectSessions.length})
            </Text>
          </Box>

          {/* Session rows */}
          {projectSessions.map((session) => {
            const isSelected = globalIndex === selectedIndex;
            globalIndex++;

            const emoji = statusEmoji[session.status] || "⚪";
            const domainColor = session.domain
              ? domainColors[session.domain] || "white"
              : "gray";
            const ago = timeSince(session.lastActivity);
            const commitMsg = session.lastCommit?.message || "-";
            const truncatedCommit =
              commitMsg.length > 25 ? commitMsg.slice(0, 22) + "..." : commitMsg;

            return (
              <Box
                key={session.id}
                flexDirection="row"
                paddingX={1}
                gap={1}
              >
                {/* Selection indicator */}
                <Text color="cyan">{isSelected ? ">" : " "}</Text>

                {/* Status emoji */}
                <Text>{emoji}</Text>

                {/* Worktree name */}
                <Text
                  color={isSelected ? "white" : "gray"}
                  bold={isSelected}
                >
                  {session.worktree.padEnd(12)}
                </Text>

                {/* Domain badge */}
                {session.domain ? (
                  <Text color={domainColor}>
                    [{session.domain.padEnd(5)}]
                  </Text>
                ) : (
                  <Text color="gray">{"        "}</Text>
                )}

                {/* Branch */}
                <Text color="gray">
                  {session.branch.padEnd(18)}
                </Text>

                {/* Last commit/action */}
                <Text color="white" dimColor>
                  "{truncatedCommit}"
                </Text>

                {/* Time */}
                <Text color="gray" dimColor>
                  {ago.padStart(6)}
                </Text>
              </Box>
            );
          })}
        </Box>
      ))}

      {/* Selected session indicator */}
      {sessions[selectedIndex] && (
        <Box paddingX={1}>
          <Text color="gray">
            {"  > session: "}
          </Text>
          <Text color="cyan" bold>
            {sessions[selectedIndex].worktree}
          </Text>
          <Text color="gray">
            {"  [Enter] focus  [Tab] next"}
          </Text>
        </Box>
      )}
    </Box>
  );
}
