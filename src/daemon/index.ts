import fs from "node:fs";
import { StateStore } from "./state-store.js";
import { IpcServer } from "./ipc-server.js";
import { HookHandler } from "./hook-handler.js";
import { ELEMENTERM_DIR, PID_FILE } from "../shared/constants.js";
import type { HookEvent, Session } from "../shared/types.js";

export class Daemon {
  private store: StateStore;
  private ipc: IpcServer;
  private hookHandler: HookHandler;
  private running = false;

  constructor() {
    this.store = new StateStore();
    this.ipc = new IpcServer();
    this.hookHandler = new HookHandler(this.store);
  }

  async start(): Promise<void> {
    if (this.running) return;

    // Check if another daemon is already running
    if (fs.existsSync(PID_FILE)) {
      const existingPid = parseInt(fs.readFileSync(PID_FILE, "utf-8").trim());
      if (isProcessRunning(existingPid)) {
        throw new Error(
          `Elementerm daemon already running (PID: ${existingPid}). Run 'elementerm stop' first.`
        );
      }
      // Stale PID file, clean up
      fs.unlinkSync(PID_FILE);
    }

    // Initialize
    fs.mkdirSync(ELEMENTERM_DIR, { recursive: true });
    this.store.init();

    // Write PID file
    fs.writeFileSync(PID_FILE, process.pid.toString(), "utf-8");

    // Set up IPC message handling
    this.ipc.onMessage((msg) => {
      if (msg.type === "hook_event") {
        this.hookHandler.handle(msg.payload as HookEvent);
      } else if (msg.type === "session_created") {
        this.store.addSession(msg.payload as Session);
      } else if (msg.type === "session_removed") {
        // Reload from file first (rm command writes file before sending IPC)
        this.store.reload();
      }
      // Broadcast updated state to all connected dashboards
      this.ipc.broadcastState(this.store.getState());
    });

    // Start IPC server
    await this.ipc.start();
    this.running = true;

    // Handle graceful shutdown
    const shutdown = () => this.stop();
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    console.log(`Elementerm daemon started. PID: ${process.pid}`);
  }

  async stop(): Promise<void> {
    if (!this.running) return;

    console.log("Elementerm daemon stopping...");

    await this.ipc.stop();

    // Clean up PID file
    try {
      fs.unlinkSync(PID_FILE);
    } catch {
      // Ignore
    }

    this.running = false;
    console.log("Elementerm daemon stopped.");
    process.exit(0);
  }

  getStore(): StateStore {
    return this.store;
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
