# NOX

NOX 是基于 Tauri 2、React 19 和 TypeScript 的 AI 编程桌面客户端，通过 Codex app-server 连接编程会话，提供工作区文件树、模型选择和推理强度设置。

## 运行

### 从源码运行

需要 Node.js、pnpm，以及构建 Tauri 应用所需的 Rust 和平台开发工具。

```sh
git clone https://github.com/1m01m0/NOX.git
cd NOX
pnpm install
pnpm desktop
```

仅启动 Vite Web 开发界面：

```sh
pnpm dev
```

桌面集成通过 Tauri 原生命令完成；浏览器预览用于前端开发。

## 开发

```sh
pnpm build
pnpm desktop:build
```

`pnpm build` 检查 TypeScript 并构建前端；`pnpm desktop:build` 构建桌面安装包。

上游内核同步脚本位于 [scripts/sync-upstream.sh](scripts/sync-upstream.sh)：

```sh
pnpm sync:upstream
```

前端源码位于 [src/](src/)，原生工程位于 [src-tauri/](src-tauri/)，自动同步与构建配置位于 [.github/workflows/](.github/workflows/)。界面中的模型选项仍取决于后端实际提供的能力。

## 许可证

原 README 声明 MIT License；当前仓库未附独立许可证文件。
