# NOX

基于 Tauri 2、React 19 和 TypeScript 的 AI 编程桌面工作台，通过本地 WebSocket 连接 Codex app-server，提供会话、工具执行和变更审批界面。

**当前状态：开发中的客户端原型。** 仓库包含前端、Tauri 原生入口和协议适配代码；真实对话需要另行准备兼容的 app-server 及其认证配置。本项目为独立客户端，与 OpenAI 官方产品没有隶属关系。

## 功能与边界

| 能力 | 当前实现 |
| --- | --- |
| 对话界面 | Markdown 消息、流式输出、推理内容、停止生成 |
| 工程浏览 | 可伸缩侧栏、目录树、文件引用；跳过隐藏项和常见构建目录 |
| 工具与审批 | 命令、工具输出、补丁，以及执行／补丁审批请求 |
| 模型与推理强度 | 静态模型菜单；`Off / Low / Med / Max` 分别传递 `null / low / medium / high` |
| 界面语言 | 简体中文、English |
| 原生目录选择 | 当前通过 macOS `osascript` 实现 |

菜单中的模型名称不代表服务端已支持或账户已获授权；实际能力由后端决定。Linux 和 Windows 的目录选择仍需平台适配。

## 快速开始

### 1. 准备环境

- Git、Node.js、pnpm。仓库未固定 Node.js／pnpm 版本，请选择与 [package.json](package.json) 和 [锁文件](pnpm-lock.yaml) 兼容的工具链。
- 桌面模式还需要 Rust/Cargo 和 Tauri 2 对应的系统构建依赖；macOS 需要 Xcode Command Line Tools。
- 真实对话需要兼容当前 [协议类型](src/types/protocol.ts) 的 app-server。仓库不包含已打包的服务端二进制，也不负责安装服务端或配置模型凭证。

```bash
git clone https://github.com/1m01m0/NOX.git
cd NOX
pnpm install --frozen-lockfile
```

### 2. 预览界面

```bash
pnpm dev
```

打开 <http://localhost:5173>。浏览器模式可以预览界面；原生目录选择和文件树依赖 Tauri。没有连接后端时，发送消息会提示连接失败。

### 3. 连接后端并启动桌面模式

客户端当前连接 `ws://127.0.0.1:4500`。如果已准备好支持以下接口的 `codex-app-server` 可执行文件，在独立终端启动：

```bash
codex-app-server --listen ws://127.0.0.1:4500
```

这是仓库代码期望的启动形式；先核对所安装服务端是否接受该命令和协议。然后在仓库目录启动桌面客户端：

```bash
pnpm desktop
```

选择工程目录，确认连接状态，再发送项目分析请求。审批对话框出现时，检查目标目录、命令或补丁后再决定是否执行。

## 开发命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动 Vite 开发服务器，端口 5173 |
| `pnpm build` | TypeScript 检查并构建前端到 `dist/` |
| `pnpm preview` | 预览已构建的前端 |
| `pnpm desktop` | 启动 Tauri 开发窗口 |
| `pnpm desktop:build` | 构建当前平台桌面包，需要本机原生构建依赖 |
| `pnpm sync:upstream` | 查询上游版本并更新 `upstream-version.json`，需要 Bash、curl、jq、Git |

[同步脚本](scripts/sync-upstream.sh) 更新版本记录，不会下载、替换或编译 app-server 内核。[定时工作流](.github/workflows/sync-upstream.yml) 每 6 小时检查上游；[构建工作流](.github/workflows/build-engine.yml) 定义了多平台打包任务，但这些定义不代表已成功发布可用安装包。下载前请检查对应运行结果及 release 附件。

## 项目结构

```text
src/
├── components/          # 会话、侧栏、输入、设置和审批界面
├── services/            # WebSocket RPC 客户端与会话状态
├── types/               # 协议类型
└── i18n/                # 中英文界面文本
src-tauri/
├── src/main.rs          # 进程启动、目录扫描、macOS 目录选择
└── tauri.conf.json      # 窗口与打包配置
scripts/sync-upstream.sh # 上游版本跟踪
upstream-version.json   # 上次记录的上游版本
```

## 已知限制与排查

- **无法连接：** 确认兼容后端监听 `127.0.0.1:4500`。原生层定义了启动服务端的命令，当前前端没有调用它，需要手动启动后端。
- **修改设置中的地址无效：** 地址输入框没有写回 RPC 客户端；连接地址仍由 [codexClient.ts](src/services/codexClient.ts) 定义。
- **模型不可用／协议错误：** 静态菜单和客户端类型可能与后端不匹配；核对服务端日志、模型权限及协议版本。
- **目录不完整：** 扫描深度为 4 层，隐藏项、`node_modules`、`target` 和 `dist` 被过滤。
- **平台支持：** 多平台打包配置需要结合原生功能和实际构建结果验证。

## 贡献

在 [Issues](https://github.com/1m01m0/NOX/issues) 提供系统、工具链和服务端版本、复现步骤及脱敏日志。提交 PR 前运行 `pnpm build`；涉及原生层时补充当前平台构建结果。不要提交凭证或私有项目内容。

## 许可

当前仓库未附带 `LICENSE` 文件，无法从仓库确认原 README 中的 MIT 授权声明。复用或分发前请向维护者确认许可；第三方组件按各自许可证使用。
