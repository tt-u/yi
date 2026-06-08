import { type ReactElement, useEffect } from "react";
import { useRoutes } from "react-router";

import PopupPage from "./app/popup/page";
import SettingsPage from "./app/settings/page";
import { SettingsManager } from "./lib/settings";

const DEFAULT_SHORTCUT = "CommandOrControl+Y";

/** Main window: settings only. On startup, sync the persisted capture settings to the main process */
function MainWindow() {
  useEffect(() => {
    const s = SettingsManager.load();
    if (!s.selectionEnabled) void window.api?.selection.setEnabled(false);
    if (s.captureShortcut !== DEFAULT_SHORTCUT)
      void window.api?.selection.setShortcut(s.captureShortcut);
  }, []);

  return (
    <div className="h-screen overflow-y-auto bg-background">
      <SettingsPage />
    </div>
  );
}

function App(): ReactElement | null {
  return useRoutes([
    // Capture popup (standalone small window)
    {
      path: "/popup",
      element: <PopupPage />,
    },

    // Main window: settings
    {
      path: "/",
      element: <MainWindow />,
    },
  ]);
}

export default App;
