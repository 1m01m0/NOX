import React from 'react';
import {
  PlusCircle,
  Bot,
  Brain,
  Sliders,
  Terminal,
  Clock,
  Layers,
  Sparkles,
  Zap,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SidebarProps {
  currentModel: string;
  onSelectModel: (model: string) => void;
  reasoningEffort: 'low' | 'medium' | 'high' | null;
  onSelectReasoningEffort: (effort: 'low' | 'medium' | 'high' | null) => void;
  onNewChat: () => void;
  threadId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModel,
  onSelectModel,
  reasoningEffort,
  onSelectReasoningEffort,
  onNewChat,
  threadId
}) => {
  const { t } = useLanguage();

  const AVAILABLE_MODELS = [
    {
      id: 'o3-mini',
      name: 'o3-mini',
      tag: t.sidebar.models.o3MiniTag,
      desc: t.sidebar.models.o3MiniDesc,
      icon: Zap,
      badgeColor: 'border-cyanite/40 text-cyanite bg-cyanite/10'
    },
    {
      id: 'o1',
      name: 'o1',
      tag: t.sidebar.models.o1Tag,
      desc: t.sidebar.models.o1Desc,
      icon: Brain,
      badgeColor: 'border-amber/40 text-amber bg-amber/10'
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      tag: t.sidebar.models.gpt4oTag,
      desc: t.sidebar.models.gpt4oDesc,
      icon: Bot,
      badgeColor: 'border-telemetry-emerald/40 text-telemetry-emerald bg-telemetry-emerald/10'
    },
    {
      id: 'claude-3-7-sonnet',
      name: 'Claude 3.7 Sonnet',
      tag: t.sidebar.models.claudeTag,
      desc: t.sidebar.models.claudeDesc,
      icon: Flame,
      badgeColor: 'border-telemetry-violet/40 text-telemetry-violet bg-telemetry-violet/10'
    }
  ];

  return (
    <aside className="w-68 bg-surface border-r border-border flex flex-col h-[calc(100vh-2.75rem)] select-none z-20">
      {/* Session Dispatch Button */}
      <div className="p-3 border-b border-border/70">
        <button
          onClick={onNewChat}
          className="w-full relative group overflow-hidden flex items-center justify-center gap-2 py-2.5 px-3 bg-surface-secondary hover:bg-surface-hover border border-border-highlight hover:border-cyanite/60 text-slate-100 rounded-lg text-xs font-semibold shadow-panel transition-all active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyanite/0 via-cyanite/10 to-cyanite/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <PlusCircle className="w-3.5 h-3.5 text-cyanite" />
          <span>{t.sidebar.newThread}</span>
          <span className="ml-auto text-[9px] font-mono text-slate-400 bg-surface-tertiary px-1.5 py-0.5 rounded border border-border">
            ⌘N
          </span>
        </button>
      </div>

      {/* Model Selection Cockpit */}
      <div className="p-3 border-b border-border/70">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Bot className="w-3.5 h-3.5 text-cyanite" />
            <span>{t.sidebar.coreReasoningEngine}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {AVAILABLE_MODELS.map((model) => {
            const Icon = model.icon;
            const isSelected = currentModel === model.id;
            return (
              <button
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all relative border ${
                  isSelected
                    ? 'bg-surface-secondary/95 border-cyanite/60 shadow-glow-cyan text-slate-100'
                    : 'bg-surface/50 border-border/60 hover:bg-surface-secondary/80 hover:border-border-highlight text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-cyanite rounded-r" />
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyanite' : 'text-slate-400'}`} />
                    <span className="font-sans text-xs">{model.name}</span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${model.badgeColor}`}>
                    {model.tag}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-normal truncate mt-1 pl-5.5">
                  {model.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thinking Budget / Reasoning Effort Tuner */}
      <div className="p-3 border-b border-border/70 bg-surface/30">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Brain className="w-3.5 h-3.5 text-amber" />
            <span>{t.sidebar.thinkingBudget}</span>
          </div>
          <span className="text-[9px] text-amber font-mono">
            {reasoningEffort ? `${reasoningEffort.toUpperCase()}` : t.sidebar.budgetDefault}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-surface-secondary p-1 rounded-lg border border-border">
          {(['low', 'medium', 'high'] as const).map((level) => {
            const isActive = reasoningEffort === level;
            return (
              <button
                key={level}
                onClick={() => onSelectReasoningEffort(level)}
                className={`py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-all ${
                  isActive
                    ? 'bg-amber text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-tertiary'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Thread & Context Card */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tracking-widest uppercase">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>{t.sidebar.sessionRuntime}</span>
          </div>
        </div>

        {threadId ? (
          <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-cyanite uppercase tracking-widest bg-cyanite/10 px-1.5 py-0.5 rounded border border-cyanite/30">
                {t.sidebar.active}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                JSON-RPC 2.0
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-200 truncate bg-surface-tertiary p-1.5 rounded border border-border/80">
              {threadId}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Clock className="w-3 h-3 text-cyanite" />
              <span>{t.sidebar.fullToolAuth}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-dashed border-border/80 text-center text-xs text-slate-400 bg-surface/20">
            <Terminal className="w-4 h-4 mx-auto mb-1.5 text-slate-400" />
            <span>{t.sidebar.readyForExecution}</span>
          </div>
        )}
      </div>

      {/* Footer Security Badge */}
      <div className="p-3 border-t border-border/70 bg-surface-secondary/40 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-telemetry-emerald" />
          <span>{t.sidebar.sandboxIsolated}</span>
        </div>
        <span className="text-slate-400">{t.sidebar.port}</span>
      </div>
    </aside>
  );
};
