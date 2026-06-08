import "./assets/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";

import App from "./App";
import { syncLocaleFromStorage } from "./lib/i18n";
import { SettingsManager } from "./lib/settings";
import { applyTheme } from "./lib/theme";

// Theme + UI language: apply the persisted values; "system" theme follows the OS.
// Synced across windows (main window changes settings -> popup window) via the storage event.
const reapply = (): void => applyTheme(SettingsManager.load().theme);
reapply();
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", reapply);
window.addEventListener("storage", () => {
  reapply();
  syncLocaleFromStorage();
});

const root = document.getElementById("root");

createRoot(root!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
