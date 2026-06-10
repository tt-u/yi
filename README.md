# Yi

随处翻译，跨语言对话。在任意应用里选中文字，一个快捷键，DeepSeek 的译文就浮现在光标边上 —— 看懂对方、也帮你回复对方，省去反复「打开 → 粘贴 → 翻译 → 粘回」。

## 特点

- **一键划词翻译** — 在任何应用里选中文字，按 `⌘Y`（Windows `Ctrl+Y`），光标旁弹出译文，无需切换窗口、无需手动复制。自动判断输入是哪种语言，翻译成语言对里的另一种；整句流式输出，逐字呈现。
- **为跨语言对话而生** — 看到外语消息：选中 → 快捷键 → 读译文。想用外语回复：用母语写好 → 选中 → 翻译 → `⌘V` 粘回聊天框。
- **⌘V 粘贴即用、即关** — 译文自动复制到剪贴板。弹窗显示译文时你直接按 `⌘V`，弹窗会自动关闭，并把译文粘贴回你原来的应用（替换选中的原文 / 粘进输入框）。整个拦截 + 补发用全局快捷键实现，**不需要「输入监控」权限**。
- **多种关闭方式** — 粘贴后自动关、点别处 / 切走应用自动关、点关闭按钮，或几秒后自行收起（仅在没拿到焦点时兜底；你正盯着它看时不会乱关）。
- **中英双语界面** — 设置页右上角一键切换「中 / EN」，整个界面（含弹窗、错误、托盘菜单）跟随。
- **浅色 / 深色 / 跟随系统** — 右上角图标一键循环切换主题。
- **自定义快捷键** — 取词快捷键可录制成任意组合键（需带修饰键或功能键）。
- **两种翻译来源** — 内置中转（免费、开箱即用，无需自己的 key），或填自己的 DeepSeek API Key 直连，设置里随时切换。
- **不打扰** — 启动后驻留菜单栏 / 托盘，主窗口仅用于设置。`⌘⇧M` 随时唤起。
- **隐私** — 用自己的 key 时请求直连 DeepSeek、key 只存本机；用内置中转时只把待译文本发往中转服务，不经其它第三方。

## 安装（普通用户）

到 [Releases](https://github.com/tt-u/yi/releases) 下载对应平台的安装包：

| 平台                  | 安装包               |
| --------------------- | -------------------- |
| macOS · Apple Silicon | `yi-x.y.z-arm64.dmg` |
| macOS · Intel         | `yi-x.y.z-x64.dmg`   |
| Windows               | `yi-x.y.z-setup.exe` |

> macOS 安装包已 **Apple 签名 + 公证**，双击即可打开。
> Windows 安装包**未签名**，SmartScreen 提示时点「更多信息 → 仍要运行」。

装好后从菜单栏托盘 / Dock 打开设置：默认用**内置中转**（免费、开箱即用，无需填 key）；也可切到**自己的 DeepSeek API Key**（[在此创建](https://platform.deepseek.com/api_keys)）。选择语言对（默认中 ⇄ 英，支持 8 种语言），然后在任意应用选中文字按 `⌘Y` 翻译；译文已复制，按 `⌘V` 粘回原处。

> 想用应用、不想折腾源码的，**直接装即可，不用 clone 仓库**。

### 快捷键

| 快捷键                 | 功能                                 |
| ---------------------- | ------------------------------------ |
| `⌘Y` / `Ctrl+Y`        | 划词翻译（可在设置中录制成其他组合） |
| `⌘⇧M` / `Ctrl+Shift+M` | 显示 / 隐藏主窗口                    |
| `⌘V` / `Ctrl+V`        | 粘贴译文到源应用（同时关闭弹窗）     |

### macOS 权限

取词与「粘贴补发」依赖系统的「辅助功能」权限（用于读取其他应用中选中的文字、并把粘贴补发回去）。首次使用如未授权，设置页会引导你前往：系统设置 → 隐私与安全性 → 辅助功能。无需「输入监控」权限。

## 技术栈

Electron + electron-vite · React 19 + TypeScript · Tailwind CSS v4 + shadcn/ui · DeepSeek API。

## 开发

```bash
pnpm install      # 安装依赖
pnpm dev          # 开发模式
pnpm typecheck    # 类型检查
pnpm lint         # 代码检查

# E2E 冒烟测试（验证取词 / 翻译 / 剪贴板全链路，需真实 API Key）
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
pnpm build:win    # Windows：nsis 安装包（x64）
```

## 发布

推送一个 `v*` tag（版本号需与 `package.json` 的 `version` 对应），GitHub Actions 会在 macOS 与 Windows runner 上分别打包，并把安装包上传到对应的 GitHub Release（默认建为草稿，确认后手动 Publish）：

```bash
git tag v0.1.0
git push origin v0.1.0
```
