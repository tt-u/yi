import { useSyncExternalStore } from "react";

export type Locale = "en" | "zh";

type Dict = Record<string, string>;

const messages: Record<Locale, Dict> = {
  en: {
    "nav.features": "Features",
    "nav.download": "Download",

    "hero.badge": "Free built-in translation — no API key needed",
    "hero.title": "Translate anywhere.\nTalk across languages.",
    "hero.sub":
      "Select text in any app, press a shortcut, and Yi shows a natural DeepSeek translation right by your cursor — copied so you can paste your reply straight back.",
    "hero.download": "Download for free",
    "hero.github": "View on GitHub",

    "showcase.caption":
      "Select → ⌘Y → read the translation → ⌘V to paste it back",
    "showcase.demoText": "今天天气真不错，要不要出去走走？",
    "showcase.demoResult": "The weather's lovely today — fancy a walk?",
    "showcase.copied": "Copied · ⌘V to replace",

    "features.title": "Everything you need to read and reply across languages",
    "f.instant.t": "Instant lookup",
    "f.instant.d":
      "Select text and press the shortcut — the translation streams in right beside your cursor, natural and idiomatic.",
    "f.convo.t": "Built for conversations",
    "f.convo.d":
      "Read a foreign message, then reply in their language. No more opening a translator, pasting, copying, pasting back.",
    "f.paste.t": "Paste & go",
    "f.paste.d":
      "The translation is copied automatically; press ⌘V to drop it back into the chat — the popup closes itself.",
    "f.source.t": "Free or your own key",
    "f.source.d":
      "Use the built-in relay for free, or switch to your own DeepSeek API key. Your choice, anytime.",
    "f.ui.t": "Bilingual & themed",
    "f.ui.d":
      "中 / EN interface, light / dark / system themes, and a fully customizable shortcut.",
    "f.privacy.t": "Private by default",
    "f.privacy.d":
      "With your own key, requests go straight to DeepSeek and the key never leaves your device.",

    "dl.title": "Download Yi",
    "dl.sub":
      "Free and open source. macOS builds are Apple-signed and notarized.",
    "dl.mac.apple": "macOS · Apple Silicon",
    "dl.mac.appleNote": "M1 · M2 · M3 · M4",
    "dl.mac.intel": "macOS · Intel",
    "dl.mac.intelNote": "Intel-based Macs",
    "dl.win": "Windows",
    "dl.winNote": "64-bit · Windows 10/11",
    "dl.get": "Download",
    "dl.hint":
      'Not sure which Mac? Apple menu → About This Mac → look at "Chip". macOS opens on double-click; on Windows, click "More info → Run anyway" if SmartScreen appears.',

    "footer.tagline": "Translate anywhere, converse across languages.",
    "footer.madeWith": "Powered by DeepSeek · Built with Electron",
  },
  zh: {
    "nav.features": "功能",
    "nav.download": "下载",

    "hero.badge": "内置免费翻译 — 无需 API Key",
    "hero.title": "随处翻译。\n跨语言对话。",
    "hero.sub":
      "在任意应用选中文字，按一个快捷键，Yi 就在光标旁给出地道的 DeepSeek 译文 —— 还自动复制，直接 ⌘V 粘回去回复对方。",
    "hero.download": "免费下载",
    "hero.github": "在 GitHub 查看",

    "showcase.caption": "选中 → ⌘Y → 看译文 → ⌘V 粘回原处",
    "showcase.demoText": "今天天气真不错，要不要出去走走？",
    "showcase.demoResult": "The weather's lovely today — fancy a walk?",
    "showcase.copied": "已复制 · ⌘V 替换原文",

    "features.title": "看懂对方、回复对方，所需的一切",
    "f.instant.t": "划词即译",
    "f.instant.d": "选中文字按快捷键，译文就在光标旁逐字流式出现，自然地道。",
    "f.convo.t": "为对话而生",
    "f.convo.d":
      "看懂外语消息，再用对方的语言回复。不必再开翻译、粘贴、复制、粘回。",
    "f.paste.t": "粘贴即用",
    "f.paste.d": "译文自动复制，按 ⌘V 直接粘回聊天框，弹窗随即自动关闭。",
    "f.source.t": "免费或自带 Key",
    "f.source.d":
      "默认用内置中转，免费开箱即用；也可随时切换到自己的 DeepSeek API Key。",
    "f.ui.t": "双语 · 主题",
    "f.ui.d": "中 / EN 界面，浅色 / 深色 / 跟随系统，快捷键可自定义。",
    "f.privacy.t": "隐私优先",
    "f.privacy.d": "用自己的 Key 时请求直连 DeepSeek，Key 只存在本机。",

    "dl.title": "下载 Yi",
    "dl.sub": "免费开源。macOS 安装包已 Apple 签名 + 公证。",
    "dl.mac.apple": "macOS · Apple 芯片",
    "dl.mac.appleNote": "M1 · M2 · M3 · M4",
    "dl.mac.intel": "macOS · Intel",
    "dl.mac.intelNote": "Intel 芯片的 Mac",
    "dl.win": "Windows",
    "dl.winNote": "64 位 · Windows 10/11",
    "dl.get": "下载",
    "dl.hint":
      "不确定 Mac 是哪种？点左上角苹果菜单 →「关于本机」看「芯片」。macOS 双击即可打开；Windows 若 SmartScreen 拦截，点「更多信息 → 仍要运行」。",

    "footer.tagline": "随处翻译，跨语言对话。",
    "footer.madeWith": "由 DeepSeek 驱动 · 基于 Electron",
  },
};

function detectInitial(): Locale {
  const saved = localStorage.getItem("yi-site-locale");
  if (saved === "en" || saved === "zh") return saved;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

let locale: Locale = detectInitial();
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale): void {
  if (next === locale) return;
  locale = next;
  localStorage.setItem("yi-site-locale", next);
  document.documentElement.lang = next === "zh" ? "zh" : "en";
  listeners.forEach((fn) => fn());
}

export function t(key: string): string {
  return messages[locale][key] ?? messages.en[key] ?? key;
}

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
