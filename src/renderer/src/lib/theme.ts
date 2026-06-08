export type ThemeMode = "light" | "dark" | "system";

const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

/** Toggle the .dark class on documentElement based on the theme mode */
export function applyTheme(mode: ThemeMode): void {
  const dark = mode === "dark" || (mode === "system" && darkQuery.matches);
  document.documentElement.classList.toggle("dark", dark);
}
