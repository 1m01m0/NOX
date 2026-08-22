import React, { useState, useRef, useEffect } from 'react';
import {
  Square,
  CornerDownLeft,
  Bot,
  Brain,
  Zap,
  Flame,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';

export const AVAILABLE_MODELS = [
  {
    id: 'o3-mini',
    name: 'o3-mini',
    badge: 'FAST REASON',
    desc: '高速推理与代码合成',
    icon: Zap
  },
  {
    id: 'o1',
    name: 'o1',
    badge: 'FRONTIER',
    desc: '深度多步算法规划',
    icon: Brain
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    badge: 'MULTIMODAL',
    desc: '全模态架构与快速编辑',
    icon: Bot
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    badge: 'HYBRID',
    desc: '扩展混合思考与系统工程',
    icon: Flame
  }
];

const EFFORT_LEVELS: Array<{ value: 'low' | 'medium' | 'high' | null; label: string }> = [
  { value: null, label: 'Off' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Med' },
  { value: 'high', label: 'Max' }
];

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isGenerating: boolean;
  onInterrupt: () => void;
  currentModel: string;
  onSelectModel: (model: string) => void;
  reasoningEffort: 'low' | 'medium' | 'high' | null;
  onSelectReasoningEffort: (effort: 'low' | 'medium' | 'high' | null) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating,
  onInterrupt,
  currentModel,
  onSelectModel,
  reasoningEffort,
  onSelectReasoningEffort,
  disabled
}) => {
  const [content, setContent] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isEffortPopoverOpen, setIsEffortPopoverOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const effortRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const selectedModelObj =
    AVAILABLE_MODELS.find((m) => m.id === currentModel) || AVAILABLE_MODELS[0];

  const currentEffortIndex =
    reasoningEffort === null ? 0 : reasoningEffort === 'low' ? 1 : reasoningEffort === 'medium' ? 2 : 3;

  const currentEffortLabel = EFFORT_LEVELS[currentEffortIndex].label;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (effortRef.current && !effortRef.current.contains(e.target as Node)) {
        setIsEffortPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (content.trim() && !isGenerating && !disabled) {
        onSendMessage(content);
        setContent('');
      }
    }
  };

  const handleSend = () => {
    if (content.trim() && !isGenerating && !disabled) {
      onSendMessage(content);
      setContent('');
    }
  };

  // Handle precise click and drag across the track
  const updateEffortFromClientX = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const padding = 16; // 16px inset on left/right for center of thumb
    const innerWidth = rect.width - padding * 2;
    const clickX = clientX - rect.left - padding;
    const ratio = Math.max(0, Math.min(1, clickX / innerWidth));
    const step = Math.round(ratio * 3);
    onSelectReasoningEffort(EFFORT_LEVELS[step].value);
  };

  const handleTrackMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateEffortFromClientX(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateEffortFromClientX(e.clientX);
      }
    };
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="p-4 bg-background border-t border-border relative z-20">
      <div className="max-w-4xl mx-auto rounded-xl border border-zinc-700 bg-surface focus-within:border-zinc-500 transition-all shadow-panel flex flex-col">
        {/* Top Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="问问 Codex... (Enter 发送，Shift + Enter 换行，支持引用 @文件路径)"
          disabled={disabled}
          rows={2}
          className="w-full bg-transparent text-white placeholder-zinc-500 text-xs px-4 pt-3.5 pb-2 resize-none outline-none font-sans leading-relaxed select-text min-h-[56px]"
        />

        {/* Bottom Controls Toolbar */}
        <div className="px-3 py-2 bg-zinc-900 border-t border-border flex items-center justify-between gap-2 select-none">
          {/* Left: Model Selector & Claude-code style Effort Slider */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Model Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsModelDropdownOpen(!isModelDropdownOpen);
                  setIsEffortPopoverOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-white transition-all cursor-pointer"
              >
                <selectedModelObj.icon className="w-3.5 h-3.5 text-zinc-300" />
                <span className="font-semibold">{selectedModelObj.name}</span>
                <span className="text-[9px] font-mono uppercase px-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-400">
                  {selectedModelObj.badge}
                </span>
                {isModelDropdownOpen ? (
                  <ChevronUp className="w-3 h-3 ml-0.5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-0.5 text-zinc-400" />
                )}
              </button>

              {/* Model Dropdown Menu */}
              {isModelDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-surface border border-zinc-600 shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] font-mono text-zinc-400 px-2.5 py-1 uppercase tracking-wider">
                    切换基础模型
                  </div>
                  {AVAILABLE_MODELS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = currentModel === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          onSelectModel(m.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-zinc-800 text-white font-semibold border border-zinc-500'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
                          <div>
                            <div className="text-xs font-sans text-white">{m.name}</div>
                            <div className="text-[10px] text-zinc-500 font-sans">{m.desc}</div>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 uppercase flex-shrink-0">
                          {m.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-4 w-[1px] bg-zinc-800 mx-0.5" />

            {/* 2. Claude Code Style Effort Slider Popover Button */}
            <div className="relative" ref={effortRef}>
              <button
                type="button"
                onClick={() => {
                  setIsEffortPopoverOpen(!isEffortPopoverOpen);
                  setIsModelDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-200 transition-all cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-400">Effort</span>
                <span className="font-semibold text-white font-mono">{currentEffortLabel}</span>
                {isEffortPopoverOpen ? (
                  <ChevronUp className="w-3 h-3 ml-0.5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-0.5 text-zinc-400" />
                )}
              </button>

              {/* Exact Replica of Claude Code Slider Box - Enlarged Rounded-full Track */}
              {isEffortPopoverOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl bg-[#141416] border border-zinc-700 shadow-2xl p-5 z-50 select-none animate-in fade-in zoom-in-95 duration-100 font-sans">
                  {/* Top Line: Effort [Level]                     (?) */}
                  <div className="flex items-center justify-between mb-3 text-base">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-normal">Effort</span>
                      <span className="font-bold text-white text-lg font-sans">{currentEffortLabel}</span>
                    </div>
                    <HelpCircle className="w-4.5 h-4.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-help" />
                  </div>

                  {/* Second Line: Faster                     Smarter */}
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 font-medium">
                    <span>Faster</span>
                    <span>Smarter</span>
                  </div>

                  {/* Third Line: The Capsule Slider Track (Height h-7.5, perfectly centered dots & thumb) */}
                  <div
                    ref={trackRef}
                    onMouseDown={handleTrackMouseDown}
                    className="relative w-full h-[30px] bg-[#27272b] rounded-full flex items-center cursor-pointer px-[3px] border border-zinc-700/80 shadow-inner"
                  >
                    {/* The 4 Guide Dots (Positioned at 0%, 33.3%, 66.6%, 100% of inner active track) */}
                    <div className="relative w-full h-full flex items-center mx-[11px] pointer-events-none">
                      {EFFORT_LEVELS.map((_, idx) => (
                        <div
                          key={idx}
                          className="absolute w-1.5 h-1.5 rounded-full bg-zinc-500 -translate-x-1/2"
                          style={{
                            left: `${(idx / 3) * 100}%`
                          }}
                        />
                      ))}
                    </div>

                    {/* The Large Standard Rounded Capsule/Pill Thumb (24px width x 24px height) */}
                    <div
                      className="absolute top-[2px] bottom-[2px] w-[24px] rounded-full bg-white shadow-md transition-all duration-150 ease-out pointer-events-none"
                      style={{
                        left: `calc(3px + ${currentEffortIndex * ((100 - (24 + 6) / 2.88) / 3)}% - 0px)`,
                        transform: currentEffortIndex === 0
                          ? 'translateX(0px)'
                          : currentEffortIndex === 3
                          ? 'translateX(calc(100% - 24px))'
                          : 'translateX(0px)',
                        // Exact edge-to-edge calculation
                        ...((currentEffortIndex === 0) && { left: '3px' }),
                        ...((currentEffortIndex === 1) && { left: 'calc(33.33% - 8px)' }),
                        ...((currentEffortIndex === 2) && { left: 'calc(66.66% - 16px)' }),
                        ...((currentEffortIndex === 3) && { left: 'calc(100% - 27px)' })
                      }}
                    />
                  </div>

                  {/* Fourth Line: Off      Low      Med      Max */}
                  <div className="flex justify-between text-xs font-mono text-zinc-500 mt-3 px-1">
                    {EFFORT_LEVELS.map((level, idx) => (
                      <span
                        key={idx}
                        onClick={() => onSelectReasoningEffort(level.value)}
                        className={`cursor-pointer transition-colors hover:text-white ${
                          currentEffortIndex === idx ? 'text-white font-bold' : ''
                        }`}
                      >
                        {level.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Send / Interrupt Action Button */}
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                type="button"
                onClick={onInterrupt}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded text-xs font-semibold tracking-wide transition-all active:scale-95 font-sans cursor-pointer"
                title="停止生成 (Halt)"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>停止</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!content.trim() || disabled}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white text-black rounded text-xs font-bold tracking-wide transition-all active:scale-95 font-sans cursor-pointer"
              >
                <span>发送</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
