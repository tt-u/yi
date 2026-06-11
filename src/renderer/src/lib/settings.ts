import type { ThemeMode } from "./theme";

export type DeepSeekModel = "deepseek-chat" | "deepseek-reasoner";

/** Where translations are sent: the built-in relay (your key/prompt) or the user's own DeepSeek key. */
export type TranslationSource = "relay" | "own";

export interface SettingsData {
  /** "relay" = built-in Worker (free for the user); "own" = direct DeepSeek with the user's key */
  translationSource: TranslationSource;
  deepseekApiKey: string;
  model: DeepSeekModel;
  /** Language pair: input one of the languages, output the other */
  langA: string;
  langB: string;
  /** Capture & translate toggle (global-shortcut capture) */
  selectionEnabled: boolean;
  /** Capture shortcut (Electron accelerator format) */
  captureShortcut: string;
  /** Auto-copy the translation to the clipboard (and arm ⌘V paste-back). Off = copy manually in the popup. */
  autoCopy: boolean;
  /** Light/dark mode: light / dark / follow system */
  theme: ThemeMode;
  /** UI language (interface text), independent of the translation language pair */
  locale: "zh" | "en";
}

const SETTINGS_KEY = "yi-settings";

const DEFAULTS: SettingsData = {
  translationSource: "relay",
  deepseekApiKey: "",
  model: "deepseek-chat",
  langA: "zh",
  langB: "en",
  selectionEnabled: true,
  captureShortcut: "CommandOrControl+Y",
  autoCopy: true,
  theme: "system",
  locale:
    typeof navigator !== "undefined" &&
    navigator.language.toLowerCase().startsWith("zh")
      ? "zh"
      : "en",
};

export const SettingsManager = {
  load(): SettingsData {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULTS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
    return { ...DEFAULTS };
  },

  save(settings: SettingsData): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  },

  /** Apply a partial update and persist it; returns the merged full settings */
  update(patch: Partial<SettingsData>): SettingsData {
    const next = { ...SettingsManager.load(), ...patch };
    SettingsManager.save(next);
    return next;
  },
};
