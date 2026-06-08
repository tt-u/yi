import "./assets/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";

import App from "./App";
import { SettingsManager } from "./lib/settings";
import { applyTheme } from "./lib/theme";

// Theme: apply the persisted light/dark mode; "system" mode follows the OS;
// synced across windows (main window changes settings -> popup window) via the storage event
const reapply = (): void => applyTheme(SettingsManager.load().theme);
reapply();
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", reapply);
window.addEventListener("storage", reapply);

const root = document.getElementById("root");

createRoot(root!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
