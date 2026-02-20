import React from "react";
import { Box, Text } from "ink";
import type { Session, Project } from "../../shared/types.js";
import {
  STATUS_COLORS,
  STATUS_ICONS,
  DOMAIN_COLORS,
} from "../../shared/constants.js";

interface ScanViewProps {
  sessions: Session[];
  projects: Record<string, Project>;
  selectedIndex: number;
}

export function ScanView({
  sessions,
  projects,
  selectedIndex,
}: ScanViewProps) {
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
        <Box
          key={projectName}
          flexDirection="column"
          marginBottom={1}
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
        >
          <Text bold color="white">
            {projectName}
          </Text>
          {projectSessions.map((session) => {
            const isSelected = globalIndex === selectedIndex;
            const currentIndex = globalIndex;
            globalIndex++;

            return (
              <SessionRow
                key={session.id}
                session={session}
                selected={isSelected}
                index={currentIndex + 1}
              />
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

function SessionRow({
  session,
  selected,
  index,
}: {
  session: Session;
  selected: boolean;
  index: number;
}) {
  const statusColor = STATUS_COLORS[session.status] || "gray";
  const icon = STATUS_ICONS[session.status] || "?";
  const domainColor = session.domain
    ? DOMAIN_COLORS[session.domain] || "white"
    : "gray";
  const ago = timeSince(session.lastActivity);
  const commitMsg = session.lastCommit?.message || "-";
  const truncatedCommit =
    commitMsg.length > 30 ? commitMsg.slice(0, 27) + "..." : commitMsg;

  return (
    <Box
      flexDirection="row"
      gap={1}
      paddingY={0}
      {...(selected ? { borderStyle: undefined } : {})}
    >
      <Text color={statusColor} bold>
        {icon}
      </Text>
      <Text color={selected ? "cyan" : "white"} bold={selected}>
        {session.worktree.padEnd(12)}
      </Text>
      {session.domain && (
        <Text color={domainColor}>[{session.domain.padEnd(5)}]</Text>
      )}
      {!session.domain && <Text color="gray">{"       "}</Text>}
      <Text color="gray">{session.branch.padEnd(20)}</Text>
      <Text color="white" dimColor>
        "{truncatedCommit}"
      </Text>
      <Text color="gray">{ago.padStart(6)}</Text>
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
