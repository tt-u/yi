import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages project site is served under /yi/
export default defineConfig({
  base: "/yi/",
  plugins: [react(), tailwindcss()],
});
