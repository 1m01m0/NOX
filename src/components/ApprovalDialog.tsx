import React, { useState } from 'react';
import {
  ShieldAlert,
  Terminal,
  FileCode,
  Check,
  X,
  Edit2
} from 'lucide-react';
import { PendingApproval } from '../services/useCodexSession';
import { RequestId } from '../types/protocol';

interface ApprovalDialogProps {
  approvals: PendingApproval[];
  onRespond: (approvalId: RequestId, approved: boolean, amendedCommand?: string[]) => void;
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({ approvals, onRespond }) => {
  const [editingCommand, setEditingCommand] = useState<Record<string, string>>({});

  if (approvals.length === 0) return null;

  const current = approvals[0];
  const isExec = current.type === 'exec';

  const handleAmendSubmit = () => {
    const rawCmd = editingCommand[current.id.toString()];
    if (rawCmd) {
      const parts = rawCmd.split(' ');
      onRespond(current.id, true, parts);
    } else {
      onRespond(current.id, true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-surface border border-zinc-700 rounded-xl shadow-panel max-w-xl w-full overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans tracking-wide">
                安全执行确认
              </h3>
              <p className="text-[10px] font-mono text-zinc-400">
                需要操作员手动授权执行
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-zinc-300 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded uppercase tracking-wider">
            {isExec ? '命令执行' : '文件修改'}
          </span>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto font-mono text-xs">
          {current.justification && (
            <div className="text-zinc-300 font-sans text-xs bg-zinc-900 p-3 rounded-lg border border-zinc-800 space-y-1">
              <span className="font-semibold text-white text-[11px] uppercase tracking-wider font-mono">
                操作意图：
              </span>
              <p className="leading-relaxed text-zinc-300">
                {current.justification}
              </p>
            </div>
          )}

          {isExec ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                  <span>拟执行的 Shell 命令</span>
                </div>
                {current.cwd && (
                  <span className="text-zinc-400 font-mono text-[10px] truncate max-w-xs bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    cwd: {current.cwd}
                  </span>
                )}
              </div>

              {editingCommand[current.id.toString()] !== undefined ? (
                <input
                  type="text"
                  value={editingCommand[current.id.toString()]}
                  onChange={(e) =>
                    setEditingCommand({ ...editingCommand, [current.id.toString()]: e.target.value })
                  }
                  className="w-full bg-black border border-zinc-500 rounded p-3 text-white text-xs font-mono outline-none"
                />
              ) : (
                <pre className="p-3.5 bg-black border border-zinc-800 rounded-lg text-white whitespace-pre-wrap select-text font-mono text-[12px] leading-relaxed">
                  {current.command?.join(' ')}
                </pre>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                <span>涉及文件: {current.files?.join(', ')}</span>
              </div>
              <pre className="p-3.5 bg-black border border-zinc-800 rounded-lg text-zinc-300 max-h-56 overflow-y-auto whitespace-pre-wrap select-text text-[11px] font-mono leading-relaxed">
                {current.diff}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
          <div>
            {isExec && editingCommand[current.id.toString()] === undefined && (
              <button
                onClick={() =>
                  setEditingCommand({
                    ...editingCommand,
                    [current.id.toString()]: current.command?.join(' ') || ''
                  })
                }
                className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-white px-2.5 py-1 rounded hover:bg-zinc-800 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>修改命令</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onRespond(current.id, false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>拒绝</span>
            </button>

            <button
              onClick={handleAmendSubmit}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>允许执行</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
