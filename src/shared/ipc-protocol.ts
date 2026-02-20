import type { AppState, HookEvent, IpcMessage, Session } from "./types.js";

// Create IPC messages with type safety

export function stateUpdateMessage(state: AppState): IpcMessage {
  return { type: "state_update", payload: state };
}

export function sessionCreatedMessage(session: Session): IpcMessage {
  return { type: "session_created", payload: session };
}

export function sessionRemovedMessage(session: Session): IpcMessage {
  return { type: "session_removed", payload: session };
}

export function hookEventMessage(event: HookEvent): IpcMessage {
  return { type: "hook_event", payload: event };
}

// Serialize/deserialize for IPC transport (newline-delimited JSON)
export function serialize(message: IpcMessage): string {
  return JSON.stringify(message) + "\n";
}

export function deserialize(data: string): IpcMessage[] {
  return data
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as IpcMessage);
}
