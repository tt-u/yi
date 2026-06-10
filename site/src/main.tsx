import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { getLocale } from "./i18n";

document.documentElement.lang = getLocale() === "zh" ? "zh" : "en";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
