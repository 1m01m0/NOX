# NOX

> 极简纯净的 AI 编程桌面工作台 / Minimalist Monochromatic AI Engineering Desktop

NOX 是一款专为开发者构建的轻量级原生桌面应用，基于 **Tauri v2 + React 19 + TypeScript + Tailwind CSS** 开发，采用纯粹的黑白灰极客视觉设计体系。

---

## ✨ 核心特性

- 🖤 **极简黑白灰视觉体系**：摒弃杂乱色彩与冗余装饰，专注纯粹沉浸的代码编写与会话交互。
- 📂 **自由伸缩项目文件树**：
  - 侧边栏支持鼠标拖拽自由调整宽度（180px - 520px）。
  - 支持直接点击左上角「NOX」收起/展开侧栏。
  - 支持工作区未选择时的极简状态，支持原生文件夹选择器一键切换工程。
- 🧠 **Claude Code 风格 Effort 思考强度滑动条**：
  - 4 档（Off / Low / Med / Max）离散刻度滑块。
  - Faster ⟷ Smarter 交互引导，完美贴合模型推理预算控制。
- 🤖 **模型快速切换**：内置 `o3-mini`、`o1`、`GPT-4o`、`Claude 3.7 Sonnet` 等前沿推理模型选单。
- ⚡ **原生级性能**：基于 Rust + WebKit (Tauri v2) 打包，体积小、内存占用极低。

---

## 🛠️ 技术栈

- **前端**：React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **原生层**：Tauri v2 (Rust)
- **协议**：JSON-RPC 2.0 双向流式通信

---

## 🚀 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 本地开发预览 (Web 模式)
```bash
pnpm dev
```

### 3. 启动桌面客户端 (Tauri 原生窗口)
```bash
pnpm desktop
```

### 4. 构建发布安装包
```bash
pnpm desktop:build
```

---

## 📄 License
MIT License
