# Yi

一个安静的桌面划词翻译工具。选中任意文字，一个快捷键，译文就浮现在光标边上 —— 由 DeepSeek 驱动。

## 特点

- **一键取词翻译** — 在任何应用里选中文字，按 `⌘Y`（Windows `Ctrl+Y`），光标旁弹出翻译，无需切换窗口、无需复制粘贴。
- **极简悬浮卡片** — 一个图标 + 译文，仅此而已。卡片高度随内容自适应，点击别处自动消失。
- **词典 / 整句自动切换** — 单词和短语返回词典式释义（含音标），整句走流式翻译，逐字呈现。
- **⌘V 替换原文** — 译文自动复制到剪贴板。在可编辑的地方，直接按 `⌘V` 就用译文替换掉你选中的原文。不模拟按键、不抢焦点，所以在任何应用里都稳定可靠。
- **不打扰** — 启动后只驻留菜单栏 / 托盘，主窗口仅用于设置。`⌘⇧M` 随时唤起。
- **隐私优先** — API Key 只存在本机，请求直连 DeepSeek，不经任何第三方。

## 安装（普通用户）

到 [Releases](https://github.com/tt-u/yi/releases) 下载对应芯片的安装包：

- **Apple Silicon（M 系列）**：`yi-x.y.z-arm64.dmg`
- **Intel Mac**：`yi-x.y.z-x64.dmg`

> 当前安装包未做 Apple 签名/公证，首次打开会提示「无法验证开发者」。
> 解决：在「访达」里**右键点击 Yi.app → 打开**，确认一次即可；或在「系统设置 → 隐私与安全性」里点「仍要打开」。

装好后从菜单栏托盘 / Dock 打开设置，填入 [DeepSeek API Key](https://platform.deepseek.com/api_keys)，选择语言对（默认中 ⇄ 英，支持 8 种语言）。然后在任意应用选中文字，按 `⌘Y` 取词翻译；译文已复制，按 `⌘V` 可替换原文。

> 想用应用、不想折腾源码的，**直接装 dmg 即可，不用 clone 仓库**。

### 快捷键

| 快捷键                 | 功能                       |
| ---------------------- | -------------------------- |
| `⌘Y` / `Ctrl+Y`        | 取词翻译（可在设置中更换） |
| `⌘⇧M` / `Ctrl+Shift+M` | 显示 / 隐藏主窗口          |
| `⌘V`                   | 用译文替换选中的原文       |

### macOS 权限

取词依赖系统的「辅助功能」权限（用于读取其他应用中选中的文字）。首次使用如未授权，设置页会引导你前往：系统设置 → 隐私与安全性 → 辅助功能。

## 技术栈

Electron + electron-vite · React 19 + TypeScript · Tailwind CSS v4 + shadcn/ui · DeepSeek API。

## 开发

```bash
pnpm install      # 安装依赖
pnpm dev          # 开发模式
pnpm typecheck    # 类型检查
pnpm lint         # 代码检查

# E2E 冒烟测试（验证取词/翻译/剪贴板全链路，需真实 API Key）
ATHENA_E2E=1 pnpm dev -- --remote-debugging-port=9223   # 终端 1
DEEPSEEK_API_KEY=sk-xxx pnpm e2e                        # 终端 2
```

### 常见问题

**`pnpm dev` 报 `Error: Electron uninstall`**：Electron 二进制没下载成功（多半是从 GitHub 下载超时）。强制重新下载：

```bash
pnpm rebuild electron
pnpm dev
```

## 打包

```bash
pnpm build:mac    # macOS：同时产出 arm64 + x64 两个 dmg
pnpm build:win    # Windows（nsis 安装包，x64）
```
