/**
 * Codex App Server JSON-RPC 2.0 WebSocket Client
 */

import {
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCNotification,
  JSONRPCError,
  InitializeResult,
  ThreadStartParams,
  ThreadStartResult,
  TurnSubmitParams,
  RequestId
} from '../types/protocol';

export type NotificationListener = (method: string, params: any) => void;
export type ServerRequestListener = (id: RequestId, method: string, params: any) => Promise<any> | any;
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export class CodexClient {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<RequestId, {
    resolve: (val: any) => void;
    reject: (err: any) => void;
    timeout: NodeJS.Timeout;
  }>();

  private notificationListeners = new Set<NotificationListener>();
  private serverRequestHandlers = new Map<string, ServerRequestListener>();
  private connectionStateListeners = new Set<(state: ConnectionState) => void>();

  public state: ConnectionState = 'disconnected';

  constructor(private url: string = 'ws://127.0.0.1:4500') {}

  public onConnectionChange(cb: (state: ConnectionState) => void) {
    this.connectionStateListeners.add(cb);
    return () => this.connectionStateListeners.delete(cb);
  }

  public onNotification(cb: NotificationListener) {
    this.notificationListeners.add(cb);
    return () => this.notificationListeners.delete(cb);
  }

  public onServerRequest(method: string, handler: ServerRequestListener) {
    this.serverRequestHandlers.set(method, handler);
    return () => this.serverRequestHandlers.delete(method);
  }

  private setState(newState: ConnectionState) {
    this.state = newState;
    this.connectionStateListeners.forEach(cb => cb(newState));
  }

  public async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setState('connecting');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = async () => {
          this.setState('connected');
          try {
            // Auto initialize
            await this.initialize();
            resolve();
          } catch (err) {
            console.error('Initialize failed:', err);
            resolve(); // Still connected
          }
        };

        this.ws.onclose = () => {
          this.setState('disconnected');
          this.cleanupPendingRequests('WebSocket connection closed');
        };

        this.ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          this.setState('error');
          reject(err);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (err) {
        this.setState('error');
        reject(err);
      }
    });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.setState('disconnected');
    }
  }

  private cleanupPendingRequests(reason: string) {
    for (const [id, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(`${reason} (request id: ${id})`));
    }
    this.pendingRequests.clear();
  }

  private async handleMessage(raw: string) {
    try {
      const msg: JSONRPCMessage = JSON.parse(raw);

      // Check if it's a response to a client request
      if ('id' in msg && msg.id !== undefined && (('result' in msg) || ('error' in msg))) {
        const pending = this.pendingRequests.get(msg.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(msg.id);
          if ('error' in msg && msg.error) {
            pending.reject(new Error(msg.error.message || `RPC Error code ${msg.error.code}`));
          } else {
            pending.resolve((msg as JSONRPCResponse).result);
          }
          return;
        }
      }

      // Check if it's a Server-Initiated Request (e.g. approval request)
      if ('id' in msg && msg.id !== undefined && 'method' in msg && !('result' in msg)) {
        const req = msg as JSONRPCRequest;
        const handler = this.serverRequestHandlers.get(req.method);
        if (handler) {
          try {
            const result = await handler(req.id, req.method, req.params);
            this.sendResponse(req.id, result);
          } catch (err: any) {
            this.sendError(req.id, -32603, err?.message || 'Internal error');
          }
        } else {
          // Method not found handler
          this.sendError(req.id, -32601, `Method '${req.method}' not implemented on client`);
        }
        return;
      }

      // Check if it's a Server Notification (e.g. agentMessageDelta)
      if ('method' in msg && !('id' in msg)) {
        const notif = msg as JSONRPCNotification;
        this.notificationListeners.forEach(listener => {
          try {
            listener(notif.method, notif.params);
          } catch (e) {
            console.error('Notification listener error:', e);
          }
        });
        return;
      }
    } catch (e) {
      console.error('Failed to parse incoming JSON-RPC message:', e, raw);
    }
  }

  public async request<TResult = any>(method: string, params?: any, timeoutMs = 60000): Promise<TResult> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Cannot send request: WebSocket is not connected');
    }

    const id = ++this.requestId;
    const req: JSONRPCRequest = {
      id,
      method,
      params
    };

    return new Promise<TResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${method} (${id}) timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      this.ws!.send(JSON.stringify(req));
    });
  }

  public sendNotification(method: string, params?: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send notification: WebSocket is not connected');
      return;
    }
    const notif: JSONRPCNotification = { method, params };
    this.ws.send(JSON.stringify(notif));
  }

  public sendResponse(id: RequestId, result: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const resp: JSONRPCResponse = { id, result };
    this.ws.send(JSON.stringify(resp));
  }

  public sendError(id: RequestId, code: number, message: string, data?: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const err: JSONRPCError = {
      id,
      error: { code, message, data }
    };
    this.ws.send(JSON.stringify(err));
  }

  // High-level API convenience methods
  public async initialize(): Promise<InitializeResult> {
    return this.request('initialize', {
      clientInfo: {
        name: 'codex-desktop',
        version: '0.1.0'
      },
      capabilities: {
        experimental: {}
      }
    });
  }

  public async threadStart(params: ThreadStartParams): Promise<ThreadStartResult> {
    return this.request('thread/start', params);
  }

  public async threadList(params: { limit?: number; cursor?: string } = {}) {
    return this.request('thread/list', params);
  }

  public async threadRead(threadId: string) {
    return this.request('thread/read', { threadId });
  }

  public async turnSubmit(params: TurnSubmitParams) {
    return this.request('turn/submit', params);
  }

  public async turnInterrupt(threadId: string) {
    return this.request('turn/interrupt', { threadId });
  }

  public async configRead() {
    return this.request('config/read', {});
  }

  public async modelList() {
    return this.request('model/list', {});
  }
}

// Global singleton instance
export const codexClient = new CodexClient();
