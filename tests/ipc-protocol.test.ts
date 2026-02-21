import { describe, it, expect } from "vitest";
import { serialize, deserialize, stateUpdateMessage, hookEventMessage } from "../src/shared/ipc-protocol.js";
import type { AppState, HookEvent } from "../src/shared/types.js";

describe("IPC Protocol", () => {
  describe("serialize", () => {
    it("should produce newline-delimited JSON", () => {
      const msg = hookEventMessage({
        sessionId: "s1",
        event: "PostToolUse",
        tool: "Edit",
        timestamp: 1000,
      });
      const result = serialize(msg);
      expect(result).toMatch(/\n$/);
      expect(JSON.parse(result.trim())).toEqual(msg);
    });
  });

  describe("deserialize", () => {
    it("should parse single message", () => {
      const msg = { type: "hook_event" as const, payload: { sessionId: "s1", event: "Stop" as const, timestamp: 1000 } };
      const data = JSON.stringify(msg) + "\n";
      const result = deserialize(data);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(msg);
    });

    it("should parse multiple messages", () => {
      const msg1 = { type: "hook_event" as const, payload: { sessionId: "s1", event: "Stop" as const, timestamp: 1000 } };
      const msg2 = { type: "hook_event" as const, payload: { sessionId: "s2", event: "PostToolUse" as const, timestamp: 2000 } };
      const data = JSON.stringify(msg1) + "\n" + JSON.stringify(msg2) + "\n";
      const result = deserialize(data);
      expect(result).toHaveLength(2);
      expect(result[0].payload).toHaveProperty("sessionId", "s1");
      expect(result[1].payload).toHaveProperty("sessionId", "s2");
    });

    it("should skip empty lines", () => {
      const msg = { type: "hook_event" as const, payload: { sessionId: "s1", event: "Stop" as const, timestamp: 1000 } };
      const data = "\n" + JSON.stringify(msg) + "\n\n";
      const result = deserialize(data);
      expect(result).toHaveLength(1);
    });
  });

  describe("roundtrip", () => {
    it("should serialize then deserialize correctly", () => {
      const event: HookEvent = {
        sessionId: "abc-123",
        event: "PostToolUse",
        tool: "Write",
        filePath: "/src/foo.ts",
        timestamp: Date.now(),
      };
      const msg = hookEventMessage(event);
      const serialized = serialize(msg);
      const [deserialized] = deserialize(serialized);
      expect(deserialized).toEqual(msg);
    });
  });
});
