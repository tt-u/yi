import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, clipboard, ipcMain, shell } from "electron";
import { join } from "path";

import {
  isPopupVisible,
  prewarmPopup,
  setupPopupIpc,
  showPopup,
} from "./popup";
import {
  captureSelection,
  checkAccessibility,
  SelectionError,
} from "./selection";
import {
  applyCaptureShortcut,
  getCaptureShortcut,
  isCaptureShortcutRegistered,
  registerToggleMainShortcut,
  unregisterShortcuts,
} from "./shortcuts";
import { createTray } from "./tray";

let mainWindow: BrowserWindow | null = null;
/** True when quitting via the tray menu; distinguishes from "close to tray" on Windows. */
let quitting = false;

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 680,
    height: 760,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  // Windows: closing the main window hides it to the tray instead of quitting.
  win.on("close", (event) => {
    if (process.platform !== "darwin" && !quitting) {
      event.preventDefault();
      win.hide();
    }
  });
  win.on("closed", () => {
    mainWindow = null;
  });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return win;
}

function showMainWindow(): void {
  const isNew = !mainWindow || mainWindow.isDestroyed();
  if (isNew) mainWindow = createMainWindow();
  const win = mainWindow!;
  const reveal = (): void => {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  };
  // A freshly created window waits for content before showing, avoiding a white flash.
  if (isNew) win.once("ready-to-show", reveal);
  else reveal();
}

function toggleMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showMainWindow();
  }
}

/**
 * Shortcut-triggered lookup: capture the foreground selection and show the popup
 * beside the cursor. The popup never steals focus, so the source app stays
 * frontmost with its selection intact; the translation is copied to the
 * clipboard so the user can paste (Cmd/Ctrl+V) to replace the original.
 */
async function handleCaptureSelection(): Promise<void> {
  console.log("[capture] shortcut triggered");
  // Show the skeleton immediately (without focus, so the source app stays
  // frontmost for the simulated Cmd/Ctrl+C).
  showPopup({ kind: "pending" });
  try {
    const t0 = Date.now();
    const text = (await captureSelection()).trim();
    console.log(`[capture] len=${text.length} took=${Date.now() - t0}ms`);
    if (!text) {
      showPopup({
        kind: "error",
        message:
          "No text selected. Select some text first, then press the shortcut.",
      });
      return;
    }
    // Defensive truncation to avoid huge accidental selections.
    showPopup({ kind: "text", text: text.slice(0, 2000) });
  } catch (error) {
    console.log(`[capture] failed: ${String(error)}`);
    if (error instanceof SelectionError) {
      showPopup({
        kind: "error",
        message: error.message,
        needsAccessibility: error.needsAccessibility,
      });
    } else {
      // Fallback: the window is already in skeleton state, so it must resolve.
      showPopup({ kind: "error", message: "Lookup failed, please try again." });
    }
  }
}

function quit(): void {
  quitting = true;
  app.quit();
}

// Single instance: focus the existing window when launched again.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => showMainWindow());

  app.whenReady().then(() => {
    electronApp.setAppUserModelId("com.yi.translator");

    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    // Renderer IPC
    setupPopupIpc();
    ipcMain.on("app:open-main", () => showMainWindow());

    // E2E smoke-test hooks: drive the popup pipeline directly (window/IPC/render/translate).
    if (process.env["ATHENA_E2E"] === "1") {
      ipcMain.on("e2e:show-popup", (_event, text: string) => {
        showPopup({ kind: "text", text: String(text) });
      });
      ipcMain.on("e2e:capture", () => void handleCaptureSelection());
      ipcMain.handle("e2e:read-clip", () => clipboard.readText());
      ipcMain.handle("e2e:popup-visible", () => isPopupVisible());
    }
    ipcMain.handle("accessibility:check", () => checkAccessibility(false));
    ipcMain.handle("accessibility:request", () => checkAccessibility(true));

    // Selection-translation status / toggle / shortcut (used by the settings page).
    const selectionStatus = () => ({
      registered: isCaptureShortcutRegistered(),
      shortcut: getCaptureShortcut(),
      accessibilityOk: checkAccessibility(false),
    });
    ipcMain.handle("selection:get-status", () => selectionStatus());
    ipcMain.handle("selection:set-enabled", (_event, enabled: boolean) => {
      applyCaptureShortcut({ enabled: Boolean(enabled) });
      console.log(`[shortcuts] capture shortcut ${enabled ? "on" : "off"}`);
      return selectionStatus();
    });
    ipcMain.handle("selection:set-shortcut", (_event, accelerator: string) => {
      applyCaptureShortcut({ accelerator: String(accelerator) });
      return selectionStatus();
    });

    createTray({
      onShowMain: () => showMainWindow(),
      onCaptureSelection: () => void handleCaptureSelection(),
      onQuit: quit,
    });
    applyCaptureShortcut({
      enabled: true,
      handler: () => void handleCaptureSelection(),
    });
    registerToggleMainShortcut(toggleMainWindow);
    // Prewarm the popup window so the first lookup has no creation latency.
    prewarmPopup();

    // Packaged app: open the settings window on launch so first-run users can
    // configure their key. In dev we skip it (frequent restarts shouldn't nag).
    if (!is.dev) showMainWindow();

    // macOS: reopen the main window when the dock icon is clicked.
    app.on("activate", () => {
      showMainWindow();
    });
  });

  app.on("before-quit", () => {
    // Let Cmd+Q / menu quit bypass the close-to-tray interception.
    quitting = true;
  });

  app.on("will-quit", () => {
    unregisterShortcuts();
  });

  // Stay resident in the tray; don't quit when all windows are closed.
  app.on("window-all-closed", () => {
    // Intentionally empty: quitting goes through the tray menu or Cmd+Q.
  });
}
