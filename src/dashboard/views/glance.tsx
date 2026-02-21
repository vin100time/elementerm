import React from "react";
import { Box, Text } from "ink";
import type { Session } from "../../shared/types.js";

interface GlanceViewProps {
  sessions: Session[];
  groupByProject: (sessions: Session[]) => Map<string, Session[]>;
  selectedIndex: number;
  statusEmoji: Record<string, string>;
}

export function GlanceView({
  sessions,
  groupByProject,
  selectedIndex,
  statusEmoji,
}: GlanceViewProps) {
  const byProject = groupByProject(sessions);
  let globalIndex = 0;

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      {[...byProject.entries()].map(([projectName, projectSessions]) => (
        <Box key={projectName} flexDirection="column" marginBottom={1}>
          <Text color="white" dimColor>
            {projectName}
          </Text>
          <Box flexDirection="row" gap={1} marginTop={0}>
            {projectSessions.map((session) => {
              const isSelected = globalIndex === selectedIndex;
              const idx = globalIndex;
              globalIndex++;
              const emoji = statusEmoji[session.status] || "⚪";

              return (
                <Box
                  key={session.id}
                  flexDirection="column"
                  alignItems="center"
                  borderStyle={isSelected ? "double" : "single"}
                  borderColor={isSelected ? "cyan" : "gray"}
                  paddingX={1}
                  minWidth={10}
                >
                  <Text>{emoji}</Text>
                  <Text
                    color={isSelected ? "white" : "gray"}
                    bold={isSelected}
                  >
                    {session.worktree}
                  </Text>
                  <Text color="gray" dimColor>
                    {idx + 1}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
