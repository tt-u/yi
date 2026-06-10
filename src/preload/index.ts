import { electronAPI } from "@electron-toolkit/preload";
import { clipboard, contextBridge, ipcRenderer } from "electron";

/** Error kinds shown in the popup; the renderer localizes them. */
export type PopupErrorCode =
  | "no-selection"
  | "no-accessibility"
  | "no-automation"
  | "read-failed"
  | "lookup-failed";

export type PopupPayload =
  | { kind: "pending" }
  | { kind: "text"; text: string }
  | { kind: "error"; code: PopupErrorCode };

export interface SelectionStatus {
  /** Whether the global shortcut is currently registered */
  registered: boolean;
  /** Shortcut definition (Electron accelerator format) */
  shortcut: string;
  /** macOS Accessibility permission (always true on other platforms) */
  accessibilityOk: boolean;
}

// Custom APIs for renderer
const api = {
  /** Current platform: darwin / win32 */
  platform: process.platform,

  /** Capture popup APIs */
  popup: {
    /** Subscribe to capture payloads delivered by the main process; returns an unsubscribe function */
    onPayload: (callback: (payload: PopupPayload) => void) => {
      const listener = (_event: unknown, payload: PopupPayload) =>
        callback(payload);
      ipcRenderer.on("popup:payload", listener);
      return () => {
        ipcRenderer.removeListener("popup:payload", listener);
      };
    },
    /** Renderer has mounted and is ready to receive payloads */
    ready: () => ipcRenderer.send("popup:ready"),
    hide: () => ipcRenderer.send("popup:hide"),
    /** Translation copied to clipboard; main arms ⌘/Ctrl+V to close + replay the paste */
    copied: () => ipcRenderer.send("popup:copied"),
    /** Request the main process to adjust the window height when content height changes */
    resize: (height: number) => ipcRenderer.send("popup:resize", height),
  },

  /** Write to the system clipboard (independent of window focus, used for "⌘V to replace") */
  clipboard: {
    write: (text: string) => clipboard.writeText(text),
  },

  /** Open the main window (optionally with a route path, e.g. /settings) */
  openMain: (path?: string) => ipcRenderer.send("app:open-main", path),

  /** Tell the main process the UI language so the tray menu matches */
  setLocale: (locale: string) => ipcRenderer.send("app:set-locale", locale),

  /** Main window subscribes to navigation requests (triggered by entries like the popup's "Open main window") */
  onNavigate: (callback: (path: string) => void) => {
    const listener = (_event: unknown, path: string) => callback(path);
    ipcRenderer.on("main:navigate", listener);
    return () => {
      ipcRenderer.removeListener("main:navigate", listener);
    };
  },

  /** macOS Accessibility permission (always true on other platforms) */
  accessibility: {
    check: (): Promise<boolean> => ipcRenderer.invoke("accessibility:check"),
    request: (): Promise<boolean> =>
      ipcRenderer.invoke("accessibility:request"),
  },

  /** Open macOS system-settings panes */
  system: {
    openAutomationSettings: () => ipcRenderer.send("system:open-automation"),
  },

  /** Capture & translate runtime status / toggle / shortcut */
  selection: {
    getStatus: (): Promise<SelectionStatus> =>
      ipcRenderer.invoke("selection:get-status"),
    setEnabled: (enabled: boolean): Promise<SelectionStatus> =>
      ipcRenderer.invoke("selection:set-enabled", enabled),
    setShortcut: (accelerator: string): Promise<SelectionStatus> =>
      ipcRenderer.invoke("selection:set-shortcut", accelerator),
  },
};

export type YiApi = typeof api;

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
