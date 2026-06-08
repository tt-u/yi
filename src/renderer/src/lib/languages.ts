export interface Language {
  code: string;
  /** Display name in the UI (native spelling) */
  label: string;
  /** English name used in the prompt; more stable for the model */
  promptName: string;
}

export const LANGUAGES: Language[] = [
  { code: "zh", label: "中文", promptName: "Simplified Chinese" },
  { code: "en", label: "English", promptName: "English" },
  { code: "ja", label: "日本語", promptName: "Japanese" },
  { code: "ko", label: "한국어", promptName: "Korean" },
  { code: "fr", label: "Français", promptName: "French" },
  { code: "de", label: "Deutsch", promptName: "German" },
  { code: "es", label: "Español", promptName: "Spanish" },
  { code: "ru", label: "Русский", promptName: "Russian" },
];

export function getLanguage(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
