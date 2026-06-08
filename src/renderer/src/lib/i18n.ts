import { useSyncExternalStore } from "react";

import { SettingsManager } from "./settings";

export type Locale = "zh" | "en";

/** UI strings keyed by id. English is the fallback when a key is missing in zh. */
const messages: Record<Locale, Record<string, string>> = {
  en: {
    "app.tagline": "Translate anywhere, converse across languages",

    "section.api": "DeepSeek API",
    "section.languages": "Languages",
    "section.shortcut": "Shortcut",

    "apiKey.placeholder": "API Key (sk-...)",
    "apiKey.show": "Show key",
    "apiKey.hide": "Hide key",
    "apiKey.test": "Test",
    "apiKey.connected": "Connected",
    "apiKey.networkError": "Network error: unable to connect",
    "apiKey.hintBefore": "Create one at",
    "apiKey.hintAfter": ". The key is stored only on this device.",

    "lang.source": "Source language",
    "lang.target": "Target language",
    "lang.swap": "Swap languages",
    "lang.hint":
      "Detects which language the input is in and translates it to the other",

    "shortcut.label": "Translation shortcut",
    "shortcut.inUse": "Shortcut already in use, please pick another",
    "shortcut.note": "Note: {warn}",
    "shortcut.hint": "Select text in any app, then press this key to translate",
    "shortcut.recording": "Press your shortcut… (Esc to cancel)",
    "shortcut.conflict": " (conflict)",
    "shortcut.warn.redo": "Maps to “Redo” in some apps",
    "shortcut.warn.newtab": "Overrides “New Tab” in browsers",

    "a11y.title": "Accessibility permission",
    "a11y.granted": "Granted",
    "a11y.required":
      "Required to read selected text (System Settings → Privacy & Security)",
    "a11y.grant": "Grant access",
    "a11y.refresh": "Refresh permission status",

    "usage.before":
      "Reading a foreign message? Select it and press the shortcut to see it in your language. Replying? Write in your own words, select, translate, then press",
    "usage.between":
      "to paste it back into the chat — the translation is copied automatically.",
    "usage.after": "shows / hides this window.",

    "settings.saved": "Changes are saved automatically",

    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",
    "locale.switch": "Switch language",

    "popup.close": "Close",
    "popup.empty": "Select any text to translate it",
    "popup.translating": "Translating",
    "popup.noKey": "No API key configured yet",
    "popup.settings": "Settings",
    "popup.copied": "Copied. {key} to replace",
    "popup.networkError": "Network error. Please try again.",

    "error.no-selection":
      "No text selected. Select some text first, then press the shortcut.",
    "error.no-accessibility":
      "Accessibility permission is required to read the selected text. Please grant it in System Settings.",
    "error.read-failed": "Couldn't read the selected text. Please try again.",
    "error.lookup-failed": "Lookup failed, please try again.",

    "deepseek.401": "Invalid API key. Please check it in Settings.",
    "deepseek.402":
      "Insufficient balance. Please top up on the DeepSeek platform.",
    "deepseek.429": "Too many requests. Please try again later.",
    "deepseek.5xx":
      "DeepSeek service is temporarily unavailable. Please try again later.",
    "deepseek.stream": "Response does not support streaming",
    "deepseek.failed": "Request failed (HTTP {status})",
  },
  zh: {
    "app.tagline": "随处翻译，跨语言对话",

    "section.api": "DeepSeek API",
    "section.languages": "语言",
    "section.shortcut": "快捷键",

    "apiKey.placeholder": "API Key（sk-...）",
    "apiKey.show": "显示密钥",
    "apiKey.hide": "隐藏密钥",
    "apiKey.test": "测试",
    "apiKey.connected": "连接成功",
    "apiKey.networkError": "网络错误：无法连接",
    "apiKey.hintBefore": "前往",
    "apiKey.hintAfter": " 创建。密钥只保存在本机。",

    "lang.source": "源语言",
    "lang.target": "目标语言",
    "lang.swap": "交换语言",
    "lang.hint": "自动判断输入是哪种语言，并翻译成另一种",

    "shortcut.label": "翻译快捷键",
    "shortcut.inUse": "快捷键已被占用，请换一个",
    "shortcut.note": "注意：{warn}",
    "shortcut.hint": "在任意应用选中文字，按此键即可翻译",
    "shortcut.recording": "请按下快捷键…（Esc 取消）",
    "shortcut.conflict": "（冲突）",
    "shortcut.warn.redo": "在部分应用中是“重做”",
    "shortcut.warn.newtab": "会覆盖浏览器的“新建标签页”",

    "a11y.title": "辅助功能权限",
    "a11y.granted": "已授权",
    "a11y.required": "需要此权限才能读取选中文字（系统设置 → 隐私与安全性）",
    "a11y.grant": "去授权",
    "a11y.refresh": "刷新权限状态",

    "usage.before":
      "看到外语消息？选中它，按快捷键就能看到母语翻译。想回复？用母语写好，选中并翻译，然后按",
    "usage.between": "粘回聊天框即可——译文会自动复制。",
    "usage.after": "显示 / 隐藏本窗口。",

    "settings.saved": "更改已自动保存",

    "theme.light": "浅色",
    "theme.dark": "深色",
    "theme.system": "跟随系统",
    "locale.switch": "切换语言",

    "popup.close": "关闭",
    "popup.empty": "选中任意文字即可翻译",
    "popup.translating": "翻译中",
    "popup.noKey": "尚未配置 API Key",
    "popup.settings": "设置",
    "popup.copied": "已复制，{key} 替换原文",
    "popup.networkError": "网络错误，请重试。",

    "error.no-selection": "没有选中文字。请先选中文字，再按快捷键。",
    "error.no-accessibility":
      "需要辅助功能权限才能读取选中文字，请在系统设置中授权。",
    "error.read-failed": "读取选中文字失败，请重试。",
    "error.lookup-failed": "翻译失败，请重试。",

    "deepseek.401": "API Key 无效，请在设置中检查。",
    "deepseek.402": "余额不足，请前往 DeepSeek 平台充值。",
    "deepseek.429": "请求过于频繁，请稍后再试。",
    "deepseek.5xx": "DeepSeek 服务暂时不可用，请稍后再试。",
    "deepseek.stream": "响应不支持流式传输",
    "deepseek.failed": "请求失败（HTTP {status}）",
  },
};

function detectInitial(): Locale {
  const saved = SettingsManager.load().locale;
  if (saved === "zh" || saved === "en") return saved;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

let locale: Locale = detectInitial();
const listeners = new Set<() => void>();

function notify(): void {
  for (const fn of listeners) fn();
}

export function getLocale(): Locale {
  return locale;
}

/** Switch the active locale in this window and re-render subscribers (persistence is handled by the settings state). */
export function setLocale(next: Locale): void {
  if (next === locale) return;
  locale = next;
  notify();
}

/** Re-read the locale from storage; used when another window changed it (storage event). */
export function syncLocaleFromStorage(): void {
  const next = detectInitial();
  if (next !== locale) {
    locale = next;
    notify();
  }
}

/** Translate a key, interpolating {placeholders} from vars. */
export function t(key: string, vars?: Record<string, string | number>): string {
  let s = messages[locale][key] ?? messages.en[key] ?? key;
  if (vars) {
    for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  }
  return s;
}

/** Subscribe to locale changes so the component re-renders; returns the translate function. */
export function useT(): typeof t {
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getLocale,
    getLocale,
  );
  return t;
}
