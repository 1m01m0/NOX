import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Terminal,
  FileCode,
  User,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
  Activity
} from 'lucide-react';
import { MessageItem } from '../services/useCodexSession';

interface MessageItemViewProps {
  message: MessageItem;
}

export const MessageItemView: React.FC<MessageItemViewProps> = ({ message }) => {
  const [isReasoningOpen, setIsReasoningOpen] = useState(true);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4 px-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-xs text-zinc-300 max-w-2xl font-mono flex items-center gap-2.5">
          <XCircle className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-4 py-5 px-6 transition-colors ${
        isUser
          ? 'bg-zinc-900/30 border-b border-zinc-800/40'
          : 'bg-zinc-900/80 border-b border-zinc-800'
      }`}
    >
      {/* Monochromatic Node Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        {isUser ? (
          <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <User className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-600 flex items-center justify-center text-white font-mono text-[11px] font-bold">
            CX
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-1 min-w-0 space-y-3.5">
        {/* Header Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-white tracking-wide font-sans">
              {isUser ? 'Operator' : 'Codex Agent'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>

          {!isUser && message.isStreaming && (
            <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>STREAMING</span>
            </div>
          )}
        </div>

        {/* Cognitive Waveform & Reasoning Stream */}
        {message.reasoningContent && (
          <div className="border border-zinc-700 rounded-lg bg-zinc-900 overflow-hidden text-xs">
            <button
              onClick={() => setIsReasoningOpen(!isReasoningOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-zinc-800/60 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Brain className="w-4 h-4 text-zinc-400 animate-pulse" />
                <span className="font-semibold text-zinc-200 tracking-wide font-sans text-xs">
                  思考过程
                </span>
                {message.isStreaming && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-300 font-mono bg-zinc-700 px-2 py-0.5 rounded">
                    <Activity className="w-3 h-3 animate-spin" />
                    <span>思考中</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500">
                  {isReasoningOpen ? '收起' : '展开'}
                </span>
                {isReasoningOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </div>
            </button>

            {isReasoningOpen && (
              <div className="p-3.5 text-zinc-300 font-mono text-[11px] leading-relaxed border-t border-zinc-800 bg-black/60 whitespace-pre-wrap select-text border-l-2 border-l-zinc-500">
                {message.reasoningContent}
              </div>
            )}
          </div>
        )}

        {/* Formatted Markdown Output */}
        {message.content && (
          <div className="prose prose-invert prose-sm max-w-none text-zinc-200 text-[13px] leading-relaxed select-text font-sans break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeText = String(children).replace(/\n$/, '');
                  const codeId = Math.random().toString(36).substring(7);

                  return !inline && match ? (
                    <div className="relative rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 my-3 font-mono not-prose">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 border-b border-zinc-700 text-[11px] text-zinc-400">
                        <span className="text-white font-semibold uppercase">{match[1]}</span>
                        <button
                          onClick={() => copyToClipboard(codeText, codeId)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          {copiedCodeId === codeId ? (
                            <>
                              <Check className="w-3 h-3 text-white" />
                              <span className="text-white">已复制</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>复制</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 text-[12px] overflow-x-auto text-zinc-200 bg-black/80 leading-normal">
                        <code>{children}</code>
                      </pre>
                    </div>
                  ) : (
                    <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-white font-mono text-[12px] border border-zinc-700" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Tool Executions & Real-time Console */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2.5 pt-1">
            {message.toolCalls.map((tool) => (
              <div
                key={tool.id}
                className="rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden font-mono text-xs"
              >
                <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-800 border-b border-zinc-700">
                  <div className="flex items-center gap-2 truncate pr-4">
                    <Terminal className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" />
                    <span className="text-white font-medium truncate font-mono text-[11px]">
                      {tool.command.join(' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {tool.status === 'running' && (
                      <span className="flex items-center gap-1.5 text-[10px] text-zinc-300 bg-zinc-700 px-2 py-0.5 rounded-full font-mono">
                        <Loader2 className="w-3 h-3 animate-spin" /> 执行中
                      </span>
                    )}
                    {tool.status === 'completed' && (
                      <span className="flex items-center gap-1 text-[10px] text-white bg-zinc-700 border border-zinc-600 px-2 py-0.5 rounded-full font-mono">
                        <CheckCircle2 className="w-3 h-3" /> 完成 (0)
                      </span>
                    )}
                    {tool.status === 'failed' && (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-800 border border-zinc-600 px-2 py-0.5 rounded-full font-mono">
                        <XCircle className="w-3 h-3" /> 退出码 {tool.exitCode ?? 1}
                      </span>
                    )}
                  </div>
                </div>
                {tool.output && (
                  <pre className="p-3.5 text-[11px] text-zinc-300 max-h-52 overflow-y-auto bg-black/80 whitespace-pre-wrap leading-relaxed">
                    {tool.output}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Patch Apply Diffs */}
        {message.diffs && message.diffs.length > 0 && (
          <div className="space-y-2.5 pt-1">
            {message.diffs.map((patch) => (
              <div
                key={patch.id}
                className="rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden font-mono text-xs"
              >
                <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-800 border-b border-zinc-700">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-zinc-300" />
                    <span className="text-white font-medium">
                      {patch.path || (patch.files && patch.files.join(', ')) || 'Diff 补丁'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-300 bg-zinc-700 px-2 py-0.5 rounded-full uppercase">
                    {patch.status}
                  </span>
                </div>
                {patch.diff && (
                  <pre className="p-3.5 text-[11px] text-zinc-300 max-h-60 overflow-y-auto bg-black/80 whitespace-pre-wrap leading-relaxed">
                    {patch.diff}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Generation Spinner */}
        {message.isStreaming && !message.content && !message.reasoningContent && (
          <div className="flex items-center gap-2.5 text-xs text-zinc-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span className="font-mono text-[11px]">Codex 正在思考并组织回复...</span>
          </div>
        )}
      </div>
    </div>
  );
};
