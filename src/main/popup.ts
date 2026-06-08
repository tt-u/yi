import { is } from "@electron-toolkit/utils";
import { BrowserWindow, ipcMain, screen } from "electron";
import { join } from "path";

const POPUP_WIDTH = 360;
/** Initial height at creation; adjusted dynamically via popup:resize once content renders */
const POPUP_INIT_HEIGHT = 96;
const POPUP_MAX_HEIGHT = 720;
/** Idle time before the result auto-hides */
const AUTO_HIDE_MS = 6000;

/** Error kinds shown in the popup; the renderer localizes them. */
export type PopupErrorCode =
  | "no-selection"
  | "no-accessibility"
  | "read-failed"
  | "lookup-failed";

/** Payload received by the popup: in progress / captured text / error */
export type PopupPayload =
  | { kind: "pending" }
  | { kind: "text"; text: string }
  | { kind: "error"; code: PopupErrorCode };

let popupWindow: BrowserWindow | null = null;
let rendererReady = false;
let pendingPayload: PopupPayload | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function createPopupWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: POPUP_WIDTH,
    height: POPUP_INIT_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false, // Shadow is drawn in CSS to avoid the outline artifacts of transparent windows
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  // Always stay on top, and remain visible in macOS fullscreen spaces
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  win.on("closed", () => {
    popupWindow = null;
    rendererReady = false;
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#/popup`);
  } else {
    // Note: the hash must have a leading slash, otherwise HashRouter cannot match the /popup route
    win.loadFile(join(__dirname, "../renderer/index.html"), {
      hash: "/popup",
    });
  }

  return win;
}

/** Position the popup next to the mouse cursor, clamped within the work area */
function positionAtCursor(win: BrowserWindow): void {
  const cursor = screen.getCursorScreenPoint();
  const { workArea } = screen.getDisplayNearestPoint(cursor);
  const h = win.getBounds().height;

  let x = cursor.x + 12;
  let y = cursor.y + 16;
  if (x + POPUP_WIDTH > workArea.x + workArea.width) {
    x = workArea.x + workArea.width - POPUP_WIDTH - 8;
  }
  if (y + h > workArea.y + workArea.height) {
    y = cursor.y - h - 12;
  }
  x = Math.max(workArea.x + 8, x);
  y = Math.max(workArea.y + 8, y);

  win.setPosition(Math.round(x), Math.round(y));
}

function deliver(payload: PopupPayload): void {
  if (popupWindow && !popupWindow.isDestroyed() && rendererReady) {
    popupWindow.webContents.send("popup:payload", payload);
  } else {
    pendingPayload = payload;
  }
}

/** Pre-create (hidden) at startup to eliminate the window-creation + page-load delay on first show */
export function prewarmPopup(): void {
  if (!popupWindow || popupWindow.isDestroyed()) {
    popupWindow = createPopupWindow();
  }
}

/**
 * Pop up a small window next to the cursor and show the capture result/error.
 *
 * The popup never steals focus (always showInactive): the source app stays
 * frontmost so the simulated ⌘C hits its selection, and so the user can press
 * ⌘V right away to replace the original with the auto-copied translation.
 * Closing: close button / auto-hide timer — no focus, so no system permissions
 * and no focus ring on the close button.
 */
export function showPopup(payload: PopupPayload): void {
  if (!popupWindow || popupWindow.isDestroyed()) {
    popupWindow = createPopupWindow();
  }
  deliver(payload);
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (!popupWindow.isVisible()) {
    positionAtCursor(popupWindow);
    popupWindow.showInactive();
  }
  if (payload.kind !== "pending") {
    hideTimer = setTimeout(() => hidePopup(), AUTO_HIDE_MS);
  }
}

export function hidePopup(): void {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (popupWindow && !popupWindow.isDestroyed()) popupWindow.hide();
}

export function isPopupVisible(): boolean {
  return Boolean(
    popupWindow && !popupWindow.isDestroyed() && popupWindow.isVisible(),
  );
}

export function setupPopupIpc(): void {
  // Only deliver after the renderer has mounted, to avoid messages arriving before the listener is registered
  ipcMain.on("popup:ready", () => {
    rendererReady = true;
    if (pendingPayload) {
      const payload = pendingPayload;
      pendingPayload = null;
      deliver(payload);
    }
  });
  ipcMain.on("popup:hide", () => hidePopup());

  // Renderer requests a window height matching its content height (window grows to fit the card)
  ipcMain.on("popup:resize", (_event, height: number) => {
    if (!popupWindow || popupWindow.isDestroyed()) return;
    const h = Math.max(
      48,
      Math.min(Math.round(Number(height) || 0), POPUP_MAX_HEIGHT),
    );
    const b = popupWindow.getBounds();
    if (b.height === h) return;
    const { workArea } = screen.getDisplayNearestPoint({ x: b.x, y: b.y });
    let y = b.y;
    if (y + h > workArea.y + workArea.height) {
      y = Math.max(workArea.y + 8, workArea.y + workArea.height - h - 8);
    }
    popupWindow.setBounds({ x: b.x, y, width: b.width, height: h });
  });
}
