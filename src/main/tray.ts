import { app, Menu, nativeImage, Tray } from "electron";

import icon from "../../resources/icon.png?asset";

let tray: Tray | null = null;
let handlersRef: TrayHandlers | null = null;
let locale: "zh" | "en" = app.getLocale().toLowerCase().startsWith("zh")
  ? "zh"
  : "en";

const TRAY_TEXT = {
  en: {
    tooltip: "Yi — translate anywhere",
    open: "Open Yi",
    translate: "Translate Selection",
    quit: "Quit",
  },
  zh: {
    tooltip: "Yi —— 随处翻译",
    open: "打开 Yi",
    translate: "翻译选中内容",
    quit: "退出",
  },
} as const;

export interface TrayHandlers {
  onShowMain: () => void;
  onCaptureSelection: () => void;
  onQuit: () => void;
}

function applyMenu(): void {
  if (!tray || !handlersRef) return;
  const text = TRAY_TEXT[locale];
  tray.setToolTip(text.tooltip);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: text.open, click: handlersRef.onShowMain },
      // Trigger a translation directly; don't hardcode the shortcut in the label (it can be changed in Settings)
      { label: text.translate, click: handlersRef.onCaptureSelection },
      { type: "separator" },
      { label: text.quit, click: handlersRef.onQuit },
    ]),
  );
}

export function createTray(handlers: TrayHandlers): void {
  handlersRef = handlers;
  const image = nativeImage
    .createFromPath(icon)
    .resize({ width: 18, height: 18 });
  tray = new Tray(image);
  applyMenu();

  // Windows/Linux convention: single-click the tray icon to show the main window
  tray.on("click", () => {
    if (process.platform !== "darwin") handlers.onShowMain();
  });

  app.on("will-quit", () => {
    tray?.destroy();
    tray = null;
  });
}

/** Update the tray language (called from the renderer via IPC) and rebuild the menu. */
export function setTrayLocale(next: string): void {
  if (next !== "zh" && next !== "en") return;
  if (next === locale) return;
  locale = next;
  applyMenu();
}
