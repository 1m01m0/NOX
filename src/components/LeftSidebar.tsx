import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Activity
} from 'lucide-react';
import { FileTree } from './FileTree';
import { ConnectionState } from '../services/codexClient';

interface LeftSidebarProps {
  workspace: string;
  onOpenSettings: () => void;
  onInsertFileRef?: (filePath: string) => void;
  onOpenFolderPicker?: () => void;
  connectionState: ConnectionState;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  workspace,
  onOpenSettings,
  onInsertFileRef,
  onOpenFolderPicker,
  connectionState
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Drag to resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(180, Math.min(520, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  if (isCollapsed) {
    return (
      <aside className="w-14 bg-surface border-r border-border flex flex-col items-center justify-between py-3.5 select-none z-30 transition-all flex-shrink-0 h-screen">
        {/* Top Space for macOS Traffic Lights & Collapsed NOX Button */}
        <div className="flex flex-col items-center w-full px-1 pt-9">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black font-sans text-xs transition-all border border-zinc-800 cursor-pointer flex items-center justify-center tracking-wider hover:border-zinc-700 active:scale-95 shadow-sm"
            title="点击展开侧边栏"
          >
            NOX
          </button>
        </div>

        {/* Bottom Settings Button in Collapsed Mode */}
        <div className="flex flex-col items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionState === 'connected'
                ? 'bg-white'
                : connectionState === 'connecting'
                ? 'bg-zinc-500 animate-pulse'
                : 'bg-zinc-700'
            }`}
            title={`Daemon: ${connectionState}`}
          />
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-zinc-700"
            title="设置"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className="relative bg-surface border-r border-border flex flex-col h-screen select-none z-30 flex-shrink-0"
    >
      {/* 1. Dedicated Drag Space for macOS Traffic Lights (Height ~30px) */}
      <div className="h-7 w-full bg-surface drag-region flex-shrink-0" />

      {/* 2. NOX Title Row (Comfortably situated between Traffic Lights above and Search Box below) */}
      <div className="px-5 pt-1 pb-3.5 border-b border-border flex items-center justify-between bg-surface flex-shrink-0">
        <button
          onClick={() => setIsCollapsed(true)}
          className="flex items-center group cursor-pointer text-left w-full no-drag"
          title="点击收起侧边栏"
        >
          <h2 className="text-2xl font-black text-white tracking-[0.2em] font-sans leading-none group-hover:text-zinc-400 transition-colors">
            NOX
          </h2>
        </button>
      </div>

      {/* 3. Main File Explorer Tree Area */}
      <FileTree
        workspace={workspace}
        onSelectFile={(path) => onInsertFileRef?.(path)}
        onOpenFolderPicker={onOpenFolderPicker}
      />

      {/* 4. Bottom Left Settings Bar */}
      <div className="p-3 border-t border-border bg-zinc-900/80 flex items-center justify-between gap-2 flex-shrink-0">
        <button
          onClick={onOpenSettings}
          className="flex-1 flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all group border border-transparent hover:border-zinc-700 text-left cursor-pointer"
        >
          <Sliders className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors flex-shrink-0" />
          <span className="font-sans">设置</span>
        </button>

        {/* Connection status badge */}
        <div
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] font-mono cursor-pointer hover:bg-zinc-700 text-zinc-300 transition-colors"
          title={`后端状态: ${connectionState} (点击配置)`}
        >
          {connectionState === 'connected' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-zinc-200">在线</span>
            </>
          ) : connectionState === 'connecting' ? (
            <>
              <Activity className="w-3 h-3 animate-spin text-zinc-400" />
              <span className="text-zinc-400">连接中</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span className="text-zinc-500">离线</span>
            </>
          )}
        </div>
      </div>

      {/* Right Edge Draggable Handle for Sidebar Width Resizing */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-white/20 active:bg-white/40 transition-colors z-40 group"
        title="按住左右拖拽调整侧边栏宽度"
      >
        <div className="w-[1px] h-full bg-transparent group-hover:bg-zinc-500 ml-auto transition-colors" />
      </div>
    </aside>
  );
};
