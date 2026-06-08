const LANG_TO_BCP47: Record<string, string> = {
  zh: "zh-CN",
  en: "en-US",
  ja: "ja-JP",
  ko: "ko-KR",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  ru: "ru-RU",
};

/** Roughly detect the text's primary language to pick the speech voice */
export function detectSpeechLang(text: string): string {
  if (/[一-鿿]/.test(text)) return "zh-CN";
  if (/[぀-ヿ]/.test(text)) return "ja-JP";
  if (/[가-힯]/.test(text)) return "ko-KR";
  if (/[Ѐ-ӿ]/.test(text)) return "ru-RU";
  return "en-US";
}

/** Read aloud using the system voice (speechSynthesis, works offline) */
export function speak(text: string, langCode?: string): void {
  if (!("speechSynthesis" in window) || !text.trim()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode
    ? (LANG_TO_BCP47[langCode] ?? langCode)
    : detectSpeechLang(text);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
