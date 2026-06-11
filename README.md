# Yi

随处翻译，跨语言对话。在任意应用选中文字按一个快捷键，DeepSeek 的地道译文就浮现在光标旁；译文自动复制，`⌘V` 直接粘回对话。

<video src="https://github.com/tt-u/yi/raw/main/site/public/promo.mp4" poster="https://github.com/tt-u/yi/raw/main/site/public/promo-poster.jpg" controls muted width="720"></video>

> 在线预览与下载 👉 **https://blockinsight.top/yi**

## 下载

| 平台 | 安装包 |
| --- | --- |
| macOS · Apple 芯片 | [Yi-macOS-Apple-Silicon.dmg](https://github.com/tt-u/yi/releases/latest/download/Yi-macOS-Apple-Silicon.dmg) |
| macOS · Intel | [Yi-macOS-Intel.dmg](https://github.com/tt-u/yi/releases/latest/download/Yi-macOS-Intel.dmg) |
| Windows | [Yi-Windows-x64-Setup.exe](https://github.com/tt-u/yi/releases/latest/download/Yi-Windows-x64-Setup.exe) |

macOS 已签名 + 公证，双击即可打开；Windows 若 SmartScreen 拦截，点「更多信息 → 仍要运行」。

## 特点

- **划词即译** — 选中文字按 `⌘Y`（Windows `Ctrl+Y`），光标旁逐字流式出译文，自然地道
- **为对话而生** — 看懂对方消息，再用对方的语言回复，免去开翻译、复制、粘贴来回
- **粘贴即用** — 译文自动复制，`⌘V` 粘回聊天框，弹窗随即自动关
- **两种来源** — 内置中转（免费、无需自己的 key），或填自己的 DeepSeek Key
- 中英双语界面 · 浅 / 深 / 跟随系统主题 · 可自定义快捷键

> macOS 取词依赖「辅助功能 / 自动化」权限，首次使用按设置页引导授权即可（无需「输入监控」）。

## 开发

```bash
pnpm install
pnpm dev          # 开发模式
pnpm build:mac    # 打包 macOS（arm64 + x64 dmg）
pnpm build:win    # 打包 Windows
```

发版：推送 `vX.Y.Z` tag（与 `package.json` 的 version 对应），GitHub Actions 自动签名公证、打包并发布到 Releases。

## 技术栈与致谢

Electron · React 19 · TypeScript · Tailwind v4 · shadcn/ui · DeepSeek。设计灵感与 skill 来自 [Kami](https://github.com/tw93/kami)。
