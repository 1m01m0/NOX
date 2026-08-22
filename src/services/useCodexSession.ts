/**
 * React Hook for managing Codex sessions, streaming messages, tool runs, and approvals
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { codexClient, ConnectionState } from './codexClient';
import { RequestId } from '../types/protocol';

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoningContent?: string;
  isStreaming?: boolean;
  timestamp: number;
  toolCalls?: ToolCallItem[];
  diffs?: PatchItem[];
}

export interface ToolCallItem {
  id: string;
  command: string[];
  cwd: string;
  output: string;
  exitCode?: number;
  status: 'running' | 'completed' | 'failed' | 'pending_approval';
}

export interface PatchItem {
  id: string;
  diff: string;
  path?: string;
  files?: string[];
  status: 'applied' | 'pending_approval' | 'rejected';
}

export interface PendingApproval {
  id: RequestId;
  type: 'exec' | 'patch';
  threadId: string;
  command?: string[];
  cwd?: string;
  diff?: string;
  files?: string[];
  justification?: string;
}

export interface ThreadSession {
  threadId: string | null;
  workspace: string;
  model: string;
  reasoningEffort: 'low' | 'medium' | 'high' | null;
  personality: string;
  isGenerating: boolean;
  messages: MessageItem[];
}

export function useCodexSession() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(codexClient.state);
  const [activeSession, setActiveSession] = useState<ThreadSession>({
    threadId: null,
    workspace: '', // Empty by default until user picks a workspace
    model: 'gpt-4o',
    reasoningEffort: 'medium',
    personality: 'default',
    isGenerating: false,
    messages: []
  });

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;

  // Initialize client and listeners
  useEffect(() => {
    const unsubConn = codexClient.onConnectionChange((state) => {
      setConnectionState(state);
    });

    // Handle server-initiated notifications
    const unsubNotif = codexClient.onNotification((method, params) => {
      handleServerNotification(method, params);
    });

    // Handle approvals from Server Requests
    const unsubExecApproval = codexClient.onServerRequest('exec/requestApproval', (id, _, params) => {
      return new Promise((resolve) => {
        setPendingApprovals(prev => [
          ...prev,
          {
            id,
            type: 'exec',
            threadId: params.threadId,
            command: params.command,
            cwd: params.cwd,
            justification: params.justification
          }
        ]);
        (window as any)[`__approval_resolve_${id}`] = resolve;
      });
    });

    const unsubPatchApproval = codexClient.onServerRequest('patch/requestApproval', (id, _, params) => {
      return new Promise((resolve) => {
        setPendingApprovals(prev => [
          ...prev,
          {
            id,
            type: 'patch',
            threadId: params.threadId,
            diff: params.diff,
            files: params.files,
            justification: params.justification
          }
        ]);
        (window as any)[`__approval_resolve_${id}`] = resolve;
      });
    });

    // Connect to local WebSocket
    codexClient.connect().catch((err) => {
      console.warn('Initial WebSocket connection failed, will retry on demand:', err);
    });

    return () => {
      unsubConn();
      unsubNotif();
      unsubExecApproval();
      unsubPatchApproval();
    };
  }, []);

  const handleServerNotification = (method: string, params: any) => {
    switch (method) {
      case 'turn/started': {
        setActiveSession(prev => ({
          ...prev,
          isGenerating: true
        }));
        break;
      }

      case 'turn/completed': {
        setActiveSession(prev => ({
          ...prev,
          isGenerating: false,
          messages: prev.messages.map(msg => ({ ...msg, isStreaming: false }))
        }));
        break;
      }

      case 'reasoning/contentDelta': {
        const delta = params.content || params.delta || '';
        setActiveSession(prev => {
          const msgs = [...prev.messages];
          const lastIndex = msgs.length - 1;
          if (lastIndex >= 0 && msgs[lastIndex].role === 'assistant') {
            msgs[lastIndex] = {
              ...msgs[lastIndex],
              reasoningContent: (msgs[lastIndex].reasoningContent || '') + delta,
              isStreaming: true
            };
          } else {
            msgs.push({
              id: Math.random().toString(36).substring(7),
              role: 'assistant',
              content: '',
              reasoningContent: delta,
              isStreaming: true,
              timestamp: Date.now()
            });
          }
          return { ...prev, messages: msgs };
        });
        break;
      }

      case 'agent/messageDelta': {
        const delta = params.content || params.delta || '';
        setActiveSession(prev => {
          const msgs = [...prev.messages];
          const lastIndex = msgs.length - 1;
          if (lastIndex >= 0 && msgs[lastIndex].role === 'assistant') {
            msgs[lastIndex] = {
              ...msgs[lastIndex],
              content: (msgs[lastIndex].content || '') + delta,
              isStreaming: true
            };
          } else {
            msgs.push({
              id: Math.random().toString(36).substring(7),
              role: 'assistant',
              content: delta,
              isStreaming: true,
              timestamp: Date.now()
            });
          }
          return { ...prev, messages: msgs };
        });
        break;
      }

      case 'exec/commandBegin': {
        const toolItem: ToolCallItem = {
          id: params.callId || Math.random().toString(36).substring(7),
          command: params.command,
          cwd: params.cwd || '',
          output: '',
          status: 'running'
        };
        setActiveSession(prev => {
          const msgs = [...prev.messages];
          const lastIndex = msgs.length - 1;
          if (lastIndex >= 0 && msgs[lastIndex].role === 'assistant') {
            const currentTools = msgs[lastIndex].toolCalls || [];
            msgs[lastIndex] = {
              ...msgs[lastIndex],
              toolCalls: [...currentTools, toolItem]
            };
          }
          return { ...prev, messages: msgs };
        });
        break;
      }

      case 'exec/commandOutputDelta': {
        const callId = params.callId;
        const chunk = params.chunk || '';
        setActiveSession(prev => {
          const msgs = [...prev.messages];
          const lastIndex = msgs.length - 1;
          if (lastIndex >= 0 && msgs[lastIndex].role === 'assistant') {
            const toolCalls = (msgs[lastIndex].toolCalls || []).map(tool => {
              if (tool.id === callId) {
                return { ...tool, output: tool.output + chunk };
              }
              return tool;
            });
            msgs[lastIndex] = { ...msgs[lastIndex], toolCalls };
          }
          return { ...prev, messages: msgs };
        });
        break;
      }

      case 'exec/commandCompleted': {
        const callId = params.callId;
        const exitCode = params.exitCode;
        setActiveSession(prev => {
          const msgs = [...prev.messages];
          const lastIndex = msgs.length - 1;
          if (lastIndex >= 0 && msgs[lastIndex].role === 'assistant') {
            const toolCalls = (msgs[lastIndex].toolCalls || []).map(tool => {
              if (tool.id === callId) {
                return {
                  ...tool,
                  exitCode,
                  status: exitCode === 0 ? ('completed' as const) : ('failed' as const)
                };
              }
              return tool;
            });
            msgs[lastIndex] = { ...msgs[lastIndex], toolCalls };
          }
          return { ...prev, messages: msgs };
        });
        break;
      }

      case 'patch/applyBegin': {
        const patchItem: PatchItem = {
          id: Math.random().toString(36).substring(7),
          diff: params.diff || '',
          path: params.path,
          files: params.files,
          status: 'applied'
        };
        setActiveSession(prev => {
          const msgs = [...prev.messages];
          const lastIndex = msgs.length - 1;
          if (lastIndex >= 0 && msgs[lastIndex].role === 'assistant') {
            const diffs = msgs[lastIndex].diffs || [];
            msgs[lastIndex] = {
              ...msgs[lastIndex],
              diffs: [...diffs, patchItem]
            };
          }
          return { ...prev, messages: msgs };
        });
        break;
      }
    }
  };

  const createThread = async (workspacePath?: string) => {
    const ws = workspacePath || activeSession.workspace;
    try {
      const res = await codexClient.request('thread/start', {
        workspace: ws,
        model: activeSession.model,
        reasoningEffort: activeSession.reasoningEffort,
        personality: activeSession.personality
      });

      const threadId = res?.threadId || Math.random().toString(36).substring(7);
      setActiveSession(prev => ({
        ...prev,
        threadId,
        messages: []
      }));
      return threadId;
    } catch (e) {
      console.warn('Failed to start thread over RPC, creating local fallback session:', e);
      const fallbackThreadId = `local-${Math.random().toString(36).substring(7)}`;
      setActiveSession(prev => ({
        ...prev,
        threadId: fallbackThreadId,
        messages: []
      }));
      return fallbackThreadId;
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    let threadId = activeSession.threadId;
    if (!threadId) {
      threadId = await createThread();
    }

    const userMessage: MessageItem = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setActiveSession(prev => ({
      ...prev,
      isGenerating: true,
      messages: [...prev.messages, userMessage]
    }));

    try {
      await codexClient.request('turn/submit', {
        threadId,
        input: {
          type: 'text',
          content
        }
      });
    } catch (e: any) {
      console.warn('Error submitting turn:', e);
      setActiveSession(prev => ({
        ...prev,
        isGenerating: false,
        messages: [
          ...prev.messages,
          {
            id: Math.random().toString(36).substring(7),
            role: 'system',
            content: `App Server Daemon not connected: ${e.message || 'ws://127.0.0.1:4500'}. Run 'codex-app-server --listen ws://127.0.0.1:4500' to start the local agent server.`,
            timestamp: Date.now()
          }
        ]
      }));
    }
  };

  const interrupt = async () => {
    if (!activeSession.threadId || !activeSession.isGenerating) return;
    try {
      await codexClient.request('turn/interrupt', {
        threadId: activeSession.threadId
      });
    } catch (e) {
      console.error('Interrupt error:', e);
    } finally {
      setActiveSession(prev => ({
        ...prev,
        isGenerating: false
      }));
    }
  };

  const respondApproval = (approvalId: RequestId, approved: boolean, amendedCommand?: string[]) => {
    const resolveFunc = (window as any)[`__approval_resolve_${approvalId}`];
    if (resolveFunc) {
      if (amendedCommand) {
        resolveFunc({ decision: 'amended', command: amendedCommand });
      } else {
        resolveFunc({ decision: approved ? 'allow' : 'deny' });
      }
      delete (window as any)[`__approval_resolve_${approvalId}`];
    }
    setPendingApprovals(prev => prev.filter(app => app.id !== approvalId));
  };

  const setWorkspace = (workspace: string) => {
    setActiveSession(prev => ({ ...prev, workspace }));
  };

  const setModel = (model: string) => {
    setActiveSession(prev => ({ ...prev, model }));
  };

  const setReasoningEffort = (effort: 'low' | 'medium' | 'high' | null) => {
    setActiveSession(prev => ({ ...prev, reasoningEffort: effort }));
  };

  return {
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
  };
}
