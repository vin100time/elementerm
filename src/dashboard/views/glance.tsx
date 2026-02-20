import React from "react";
import { Box, Text } from "ink";
import type { Session, Project } from "../../shared/types.js";
import { STATUS_COLORS, STATUS_ICONS } from "../../shared/constants.js";

interface GlanceViewProps {
  sessions: Session[];
  projects: Record<string, Project>;
  selectedIndex: number;
}

export function GlanceView({
  sessions,
  projects,
  selectedIndex,
}: GlanceViewProps) {
  // Group sessions by project
  const byProject = new Map<string, Session[]>();
  for (const session of sessions) {
    const list = byProject.get(session.project) || [];
    list.push(session);
    byProject.set(session.project, list);
  }

  let globalIndex = 0;

  return (
    <Box flexDirection="column" padding={1}>
      {[...byProject.entries()].map(([projectName, projectSessions]) => (
        <Box key={projectName} flexDirection="column" marginBottom={1}>
          <Text bold color="white">
            {projectName}
          </Text>
          <Box flexDirection="row" gap={1} marginTop={1}>
            {projectSessions.map((session) => {
              const isSelected = globalIndex === selectedIndex;
              const currentIndex = globalIndex;
              globalIndex++;

              return (
                <SessionDot
                  key={session.id}
                  session={session}
                  selected={isSelected}
                  index={currentIndex + 1}
                />
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function SessionDot({
  session,
  selected,
  index,
}: {
  session: Session;
  selected: boolean;
  index: number;
}) {
  const color = STATUS_COLORS[session.status] || "gray";
  const icon = STATUS_ICONS[session.status] || "?";

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      borderStyle={selected ? "bold" : "single"}
      borderColor={selected ? "cyan" : "gray"}
      paddingX={1}
      minWidth={8}
    >
      <Text color={color} bold>
        {icon}
      </Text>
      <Text color={selected ? "white" : "gray"} dimColor={!selected}>
        {session.worktree}
      </Text>
      <Text color="gray" dimColor>
        {index}
      </Text>
    </Box>
  );
}
