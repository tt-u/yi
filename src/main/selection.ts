import { exec } from "child_process";
import { clipboard, systemPreferences } from "electron";
import { promisify } from "util";

const execAsync = promisify(exec);

/** Time to wait after simulating the keystroke for the target app to finish reading/writing the clipboard */
const CLIPBOARD_WAIT_MS = 250;
/** Sentinel value: distinguishes "target app has no selected text" (copy is a no-op, clipboard keeps the sentinel) */
const SENTINEL = " yi:no-selection ";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Error codes for selection capture; the renderer localizes them. */
export type SelectionErrorCode = "no-accessibility" | "read-failed";

export class SelectionError extends Error {
  code: SelectionErrorCode;

  constructor(code: SelectionErrorCode) {
    super(code);
    this.name = "SelectionError";
    this.code = code;
  }
}

/** macOS: check Accessibility permission; when prompt is true, show the system authorization dialog */
export function checkAccessibility(prompt: boolean): boolean {
  if (process.platform !== "darwin") return true;
  return systemPreferences.isTrustedAccessibilityClient(prompt);
}

/** Simulate a "⌘/Ctrl + key" combo to the foreground app (dispatched per platform) */
async function simulateKey(key: string): Promise<void> {
  if (process.platform === "darwin") {
    await execAsync(
      `osascript -e 'tell application "System Events" to keystroke "${key}" using {command down}'`,
    );
  } else {
    // win32
    await execAsync(
      `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^${key}')"`,
    );
  }
}

/**
 * Capture the selected text in the foreground app:
 * back up the clipboard → write the sentinel → simulate copy → read → restore the clipboard.
 * Returns an empty string when nothing is selected.
 *
 * Retry note: when the user triggers the global shortcut, modifiers like ⌘/Ctrl/Shift are often
 * still physically held down, which pollutes the simulated "copy" keystroke (turning it into an
 * invalid combo like ⌘⇧C). On failure, back off and retry to give the fingers time to release.
 */
export async function captureSelection(): Promise<string> {
  if (process.platform === "darwin" && !checkAccessibility(false)) {
    throw new SelectionError("no-accessibility");
  }

  const previous = clipboard.readText();
  clipboard.writeText(SENTINEL);

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      await delay(attempt === 0 ? 120 : 320);
      await simulateKey("c");
      await delay(CLIPBOARD_WAIT_MS);
      const captured = clipboard.readText();
      if (captured && captured !== SENTINEL) return captured;
    }
    return "";
  } catch (error) {
    const message = String(error);
    if (message.includes("assistive") || message.includes("1002")) {
      throw new SelectionError("no-accessibility");
    }
    throw new SelectionError("read-failed");
  } finally {
    clipboard.writeText(previous);
  }
}
