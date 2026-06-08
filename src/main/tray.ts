import { app, Menu, nativeImage, Tray } from "electron";

import icon from "../../resources/icon.png?asset";

let tray: Tray | null = null;

export interface TrayHandlers {
  onShowMain: () => void;
  onCaptureSelection: () => void;
  onQuit: () => void;
}

export function createTray(handlers: TrayHandlers): void {
  const image = nativeImage
    .createFromPath(icon)
    .resize({ width: 18, height: 18 });
  tray = new Tray(image);
  tray.setToolTip("Yi Translate");

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show Main Window", click: handlers.onShowMain },
      // Trigger capture directly; don't hardcode the shortcut in the label (it can be changed in Settings)
      { label: "Capture & Translate", click: handlers.onCaptureSelection },
      { type: "separator" },
      { label: "Quit", click: handlers.onQuit },
    ]),
  );

  // Windows/Linux convention: single-click the tray icon to show the main window
  tray.on("click", () => {
    if (process.platform !== "darwin") handlers.onShowMain();
  });

  app.on("will-quit", () => {
    tray?.destroy();
    tray = null;
  });
}
