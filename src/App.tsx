import React, { useState, useRef, useEffect } from 'react';
import { useCodexSession } from './services/useCodexSession';
import { TitleBar } from './components/TitleBar';
import { LeftSidebar } from './components/LeftSidebar';
import { MessageItemView } from './components/MessageItemView';
import { ChatInput } from './components/ChatInput';
import { ApprovalDialog } from './components/ApprovalDialog';
import { SettingsModal } from './components/SettingsModal';
import {
  Code2,
  GitBranch
} from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';

export const App: React.FC = () => {
  const { t } = useLanguage();
  const {
    connectionState,
    activeSession,
    pendingApprovals,
    sendMessage,
    createThread,
    interrupt,
    respondApproval,
    setWorkspace,
    setModel,
    setReasoningEffort
  } = useCodexSession();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession.messages, activeSession.messages[activeSession.messages.length - 1]?.content]);

  const handleInsertFileRef = (filePath: string) => {
    sendMessage(`请帮我分析或修改文件 \`${filePath}\`：\n`);
  };

  const handlePickFolder = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import('@tauri-apps/api/core');
        const chosen = await invoke<string | null>('pick_folder');
        if (chosen) {
          setWorkspace(chosen);
        }
      }
    } catch (e) {
      console.warn('Folder picker error:', e);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-background text-zinc-100 font-sans overflow-hidden select-none">
      {/* 1. Left Sidebar - Runs full height on the left */}
      <LeftSidebar
        workspace={activeSession.workspace}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onInsertFileRef={handleInsertFileRef}
        onOpenFolderPicker={handlePickFolder}
        connectionState={connectionState}
      />

      {/* 2. Right Main Area - Title bar at top, chat in center, input at bottom */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Title Bar (Centered Workspace Dropdown) */}
        <TitleBar
          workspace={activeSession.workspace}
          onSelectWorkspace={setWorkspace}
        />

        {/* Center Large Conversation Canvas */}
        <main className="flex-1 flex flex-col bg-background relative overflow-hidden">
          {/* Scrollable Dialogue Area */}
          <div className="flex-1 overflow-y-auto">
            {activeSession.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none relative max-w-2xl mx-auto">
                <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-700/80 overflow-hidden flex items-center justify-center mb-4 shadow-lg">
                  <img src="/logo.png" alt="NOX Logo" className="w-full h-full object-cover" />
                </div>

                <h1 className="text-xl font-bold text-white mb-2 font-sans tracking-tight">
                  NOX
                </h1>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed font-sans max-w-md">
                  极简纯净的 AI 编程工作台。随时在下方输入编程需求，或点击左侧项目文件进行针对性审查与代码编写。
                </p>

                {/* Quick Action Suggestion Cards */}
                <div className="grid grid-cols-2 gap-3 w-full text-left">
                  <button
                    onClick={() =>
                      sendMessage('分析当前仓库的工程结构、模块边界与依赖关系，并生成架构概览。')
                    }
                    className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-xs text-zinc-300 transition-all flex flex-col gap-1.5 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-semibold text-white font-sans">
                      <Code2 className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                      <span>代码架构洞察</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      分析项目文件层级、模块依赖与代码组织架构
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      sendMessage('检查 git 状态，对比最近未暂存的修改并验证分支状态。')
                    }
                    className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-xs text-zinc-300 transition-all flex flex-col gap-1.5 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-semibold text-white font-sans">
                      <GitBranch className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                      <span>Git 状态与变更差异</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      查看本地未暂存修改、提交历史与差异树
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto divide-y divide-zinc-800/60 py-2">
                {activeSession.messages.map((msg) => (
                  <MessageItemView key={msg.id} message={msg} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Cockpit Input with Model Selection & Reasoning Effort */}
          <ChatInput
            onSendMessage={sendMessage}
            isGenerating={activeSession.isGenerating}
            onInterrupt={interrupt}
            currentModel={activeSession.model}
            onSelectModel={setModel}
            reasoningEffort={activeSession.reasoningEffort}
            onSelectReasoningEffort={setReasoningEffort}
          />
        </main>
      </div>

      {/* Security Execution Dialog */}
      <ApprovalDialog
        approvals={pendingApprovals}
        onRespond={respondApproval}
      />

      {/* Settings Modal (Language, Workspace, Daemon socket) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        workspace={activeSession.workspace}
        onUpdateWorkspace={setWorkspace}
        connectionState={connectionState}
      />
    </div>
  );
};
