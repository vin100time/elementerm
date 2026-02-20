import net from "node:net";
import fs from "node:fs";
import { IPC_PATH } from "../shared/constants.js";
import { serialize, deserialize } from "../shared/ipc-protocol.js";
import type { AppState, IpcMessage } from "../shared/types.js";

export class IpcServer {
  private server: net.Server | null = null;
  private clients: Set<net.Socket> = new Set();
  private onMessageCallback: ((msg: IpcMessage) => void) | null = null;

  onMessage(callback: (msg: IpcMessage) => void): void {
    this.onMessageCallback = callback;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Clean up stale socket on Unix
      if (process.platform !== "win32" && fs.existsSync(IPC_PATH)) {
        fs.unlinkSync(IPC_PATH);
      }

      this.server = net.createServer((socket) => {
        this.clients.add(socket);

        let buffer = "";

        socket.on("data", (data) => {
          buffer += data.toString();

          // Process complete messages (newline-delimited)
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim().length === 0) continue;
            try {
              const messages = deserialize(line + "\n");
              for (const msg of messages) {
                this.onMessageCallback?.(msg);
              }
            } catch {
              // Ignore malformed messages
            }
          }
        });

        socket.on("close", () => {
          this.clients.delete(socket);
        });

        socket.on("error", () => {
          this.clients.delete(socket);
        });
      });

      this.server.on("error", reject);

      this.server.listen(IPC_PATH, () => {
        resolve();
      });
    });
  }

  broadcast(message: IpcMessage): void {
    const data = serialize(message);
    for (const client of this.clients) {
      try {
        client.write(data);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  broadcastState(state: AppState): void {
    this.broadcast({ type: "state_update", payload: state });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const client of this.clients) {
        client.destroy();
      }
      this.clients.clear();

      if (this.server) {
        this.server.close(() => {
          // Clean up socket file on Unix
          if (process.platform !== "win32") {
            try {
              fs.unlinkSync(IPC_PATH);
            } catch {
              // Ignore
            }
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
