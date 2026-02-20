import path from "node:path";
import os from "node:os";

const HOME = os.homedir();

// Elementerm data directory
export const ELEMENTERM_DIR = path.join(HOME, ".elementerm");
export const STATE_FILE = path.join(ELEMENTERM_DIR, "state.json");
export const PID_FILE = path.join(ELEMENTERM_DIR, "daemon.pid");
export const HOOKS_DIR = path.join(ELEMENTERM_DIR, "hooks");
export const PROFILES_DIR = path.join(ELEMENTERM_DIR, "profiles");

// IPC socket/pipe path
export const IPC_PATH =
  process.platform === "win32"
    ? "\\\\.\\pipe\\elementerm"
    : path.join(ELEMENTERM_DIR, "elementerm.sock");

// Package info
export const VERSION = "0.1.0";

// Status colors for TUI rendering
export const STATUS_COLORS: Record<string, string> = {
  flow: "green",
  waiting: "yellow",
  ready: "blue",
  attention: "magenta",
  blocked: "red",
  idle: "gray",
};

// Status icons
export const STATUS_ICONS: Record<string, string> = {
  flow: "●",
  waiting: "◐",
  ready: "◉",
  attention: "◈",
  blocked: "✖",
  idle: "○",
};

// Domain badge colors
export const DOMAIN_COLORS: Record<string, string> = {
  BACK: "cyan",
  FRONT: "magenta",
  SEO: "green",
  SEC: "red",
  TEST: "yellow",
  INFRA: "blue",
  DOC: "white",
};
