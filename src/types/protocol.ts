/**
 * Codex App Server JSON-RPC Protocol Types
 */

export type RequestId = string | number;

export interface JSONRPCRequest<T = any> {
  id: RequestId;
  method: string;
  params?: T;
}

export interface JSONRPCNotification<T = any> {
  method: string;
  params?: T;
}

export interface JSONRPCResponse<T = any> {
  id: RequestId;
  result: T;
}

export interface JSONRPCError {
  id: RequestId;
  error: {
    code: number;
    message: string;
    data?: any;
  };
}

export type JSONRPCMessage = JSONRPCRequest | JSONRPCNotification | JSONRPCResponse | JSONRPCError;

// Client-to-Server types
export interface ClientInfo {
  name: string;
  version: string;
}

export interface InitializeParams {
  clientInfo: ClientInfo;
  capabilities?: {
    experimental?: Record<string, any>;
  };
}

export interface InitializeResult {
  userAgent: string;
  codexHome: string;
  platform?: {
    os: string;
    arch: string;
  };
}

export interface ThreadStartParams {
  workspace: string;
  model?: string;
  reasoningEffort?: 'low' | 'medium' | 'high' | null;
  personality?: string;
}

export interface ThreadStartResult {
  threadId: string;
}

export interface ThreadListParams {
  limit?: number;
  cursor?: string;
}

export interface ThreadItemSummary {
  id: string;
  workspace: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
}

export interface TurnSubmitParams {
  threadId: string;
  input: {
    type: 'text';
    content: string;
  };
}

// Server Notifications
export type ServerNotificationType =
  | 'turnStarted'
  | 'agentMessageDelta'
  | 'reasoningContentDelta'
  | 'execCommandBegin'
  | 'execCommandOutputDelta'
  | 'execCommandEnd'
  | 'patchApplyBegin'
  | 'patchApplyEnd'
  | 'itemCompleted'
  | 'turnCompleted'
  | 'error';

export interface AgentMessageDeltaNotification {
  threadId: string;
  delta: string;
}

export interface ReasoningDeltaNotification {
  threadId: string;
  delta: string;
}

export interface ExecCommandBeginNotification {
  threadId: string;
  itemId: string;
  command: string[];
  cwd: string;
}

export interface ExecCommandOutputNotification {
  threadId: string;
  itemId: string;
  output: string;
}

export interface ExecCommandEndNotification {
  threadId: string;
  itemId: string;
  exitCode: number;
}

export interface PatchApplyNotification {
  threadId: string;
  itemId: string;
  diff: string;
  path?: string;
}

// Approvals requested by Server
export interface ExecApprovalRequest {
  id: RequestId;
  threadId: string;
  command: string[];
  cwd: string;
  justification?: string;
}

export interface PatchApprovalRequest {
  id: RequestId;
  threadId: string;
  diff: string;
  files: string[];
  justification?: string;
}
