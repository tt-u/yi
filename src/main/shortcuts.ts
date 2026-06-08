import { globalShortcut } from "electron";

export const DEFAULT_CAPTURE_SHORTCUT = "CommandOrControl+Y";
export const TOGGLE_MAIN_SHORTCUT = "CommandOrControl+Shift+M";

let captureAccel = DEFAULT_CAPTURE_SHORTCUT;
let captureHandler: (() => void) | null = null;
let captureEnabled = true;

export function getCaptureShortcut(): string {
  return captureAccel;
}

export function isCaptureShortcutRegistered(): boolean {
  return globalShortcut.isRegistered(captureAccel);
}

/**
 * Single entry point: update the capture shortcut's enabled state / key / handler and re-register it.
 * Returns whether registration succeeded (always true when disabled).
 */
export function applyCaptureShortcut(options: {
  enabled?: boolean;
  accelerator?: string;
  handler?: () => void;
}): boolean {
  if (globalShortcut.isRegistered(captureAccel)) {
    globalShortcut.unregister(captureAccel);
  }
  if (options.handler) captureHandler = options.handler;
  if (options.accelerator) captureAccel = options.accelerator;
  if (options.enabled !== undefined) captureEnabled = options.enabled;

  if (!captureEnabled || !captureHandler) return true;

  const ok = globalShortcut.register(captureAccel, captureHandler);
  console.log(
    `[shortcuts] capture ${captureAccel}: ${ok ? "registered" : "registration failed (may be in use by another app)"}`,
  );
  return ok;
}

export function registerToggleMainShortcut(handler: () => void): void {
  const ok = globalShortcut.register(TOGGLE_MAIN_SHORTCUT, handler);
  console.log(
    `[shortcuts] toggle main window ${TOGGLE_MAIN_SHORTCUT}: ${ok ? "registered" : "registration failed (may be in use by another app)"}`,
  );
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
