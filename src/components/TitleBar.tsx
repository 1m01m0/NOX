import React, { useState, useRef, useEffect } from 'react';
import {
  FolderGit2,
  ChevronDown,
  FolderOpen,
  Check,
  HardDrive
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface TitleBarProps {
  workspace: string;
  onSelectWorkspace: (ws: string) => void;
}

const STORAGE_KEY = 'nox_recent_workspaces';

export const TitleBar: React.FC<TitleBarProps> = ({
  workspace,
  onSelectWorkspace
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [recentList, setRecentList] = useState<string[]>([]);
  const [customPathInput, setCustomPathInput] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasWorkspace = Boolean(workspace && workspace.trim() !== '');
  const shortPath = hasWorkspace
    ? workspace.split('/').slice(-2).join('/') || workspace
    : '选择工作区';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (hasWorkspace && !list.includes(workspace)) {
        list = [workspace, ...list.filter((p) => p !== workspace)].slice(0, 10);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
      setRecentList(list);
    } catch {
      setRecentList(hasWorkspace ? [workspace] : []);
    }
  }, [workspace, hasWorkspace]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingManual(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchWorkspace = (path: string) => {
    onSelectWorkspace(path);
    const updated = [path, ...recentList.filter((p) => p !== path)].slice(0, 10);
    setRecentList(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setIsOpen(false);
    setIsAddingManual(false);
  };

  const handlePickNativeFolder = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import('@tauri-apps/api/core');
        const chosen = await invoke<string | null>('pick_folder');
        if (chosen) {
          switchWorkspace(chosen);
          return;
        }
      }
    } catch (e) {
      console.warn('Native folder picker fallback:', e);
    }
    setIsAddingManual(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPathInput.trim()) {
      switchWorkspace(customPathInput.trim());
      setCustomPathInput('');
    }
  };

  return (
    <header className="h-10 bg-surface/50 border-b border-border flex items-center justify-center px-4 select-none drag-region z-20 relative">
      <div className="relative no-drag" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs cursor-pointer transition-all ${
            isOpen
              ? 'bg-zinc-800 border-zinc-600 text-white shadow-md'
              : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-300'
          }`}
          title={workspace || '点击选择工作区'}
        >
          <FolderGit2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors flex-shrink-0" />
          <span className="text-[11px] text-zinc-300 font-mono font-medium truncate max-w-xs">
            {shortPath}
          </span>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider px-1 bg-zinc-800 rounded border border-zinc-700">
            {t.titleBar.workspace}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-zinc-400 ml-0.5 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-80 rounded-xl bg-surface border border-zinc-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-zinc-400 border-b border-zinc-800 pb-1.5 mb-1.5 uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                <span>选择工程工作区</span>
              </div>
              <button
                onClick={handlePickNativeFolder}
                className="flex items-center gap-1 text-white hover:text-zinc-200 transition-colors font-sans normal-case text-xs font-semibold cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded border border-zinc-700"
              >
                <FolderOpen className="w-3 h-3" />
                <span>打开目录...</span>
              </button>
            </div>

            {isAddingManual && (
              <form onSubmit={handleManualSubmit} className="mb-2 p-1.5 bg-zinc-900 rounded-lg border border-zinc-700 flex gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={customPathInput}
                  onChange={(e) => setCustomPathInput(e.target.value)}
                  placeholder="输入绝对路径 (如 /Users/...)"
                  className="flex-1 bg-transparent px-2 py-1 text-xs font-mono text-white outline-none placeholder-zinc-500"
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-white hover:bg-zinc-200 text-black rounded text-xs font-bold transition-all cursor-pointer"
                >
                  确定
                </button>
              </form>
            )}

            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {recentList.length === 0 ? (
                <div className="p-3 text-center text-xs text-zinc-500 font-sans">
                  暂无历史工作区，点击上方「打开目录...」选择
                </div>
              ) : (
                recentList.map((itemPath) => {
                  const isSelected = itemPath === workspace;
                  const folderName = itemPath.split('/').pop() || itemPath;
                  return (
                    <button
                      key={itemPath}
                      type="button"
                      onClick={() => switchWorkspace(itemPath)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-zinc-800/90 text-white font-semibold border border-zinc-700'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <FolderGit2 className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                        <div className="truncate">
                          <div className="text-xs truncate font-sans">{folderName}</div>
                          <div className="text-[10px] text-zinc-500 truncate font-mono mt-0.5">{itemPath}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
