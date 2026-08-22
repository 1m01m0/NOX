import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileJson,
  FileText,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Search,
  FolderPlus
} from 'lucide-react';

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

interface FileTreeProps {
  workspace: string;
  onSelectFile?: (filePath: string) => void;
  onOpenFolderPicker?: () => void;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx' || ext === 'rs') {
    return <FileCode className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" />;
  }
  if (ext === 'json' || ext === 'toml' || ext === 'yaml' || ext === 'yml') {
    return <FileJson className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />;
  }
  if (ext === 'md' || ext === 'txt') {
    return <FileText className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />;
  }
  return <File className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />;
}

export const FileTree: React.FC<FileTreeProps> = ({ workspace, onSelectFile, onOpenFolderPicker }) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasWorkspace = Boolean(workspace && workspace.trim() !== '');

  const fetchFiles = async () => {
    if (!hasWorkspace) {
      setFiles([]);
      return;
    }

    setIsLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<FileNode[]>('list_workspace_files', { workspacePath: workspace });
        setFiles(res || []);
      } else {
        setFiles([]);
      }
    } catch (e) {
      console.warn('Failed to list workspace files:', e);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [workspace]);

  const toggleExpand = (path: string) => {
    const next = new Set(expandedPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setExpandedPaths(next);
  };

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return (
      <div className="space-y-0.5 font-mono text-[11px]">
        {nodes.map((node) => {
          const isExpanded = expandedPaths.has(node.path);
          const nodeName = String(node.name);

          if (searchQuery && !node.is_dir && !nodeName.toLowerCase().includes(searchQuery.toLowerCase())) {
            return null;
          }

          if (node.is_dir) {
            return (
              <div key={node.path} className="select-none">
                <div
                  onClick={() => toggleExpand(node.path)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-800/60 text-zinc-300 hover:text-white cursor-pointer transition-colors group"
                  style={{ paddingLeft: `${depth * 12 + 8}px` }}
                >
                  <span className="text-zinc-500 group-hover:text-zinc-300">
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-zinc-500" />
                    )}
                  </span>
                  {isExpanded ? (
                    <FolderOpen className="w-3.5 h-3.5 text-zinc-200 flex-shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-300 flex-shrink-0" />
                  )}
                  <span className="truncate font-sans font-medium">{nodeName}</span>
                </div>

                {isExpanded && node.children && node.children.length > 0 && (
                  <div>{renderTree(node.children, depth + 1)}</div>
                )}
              </div>
            );
          }

          return (
            <div
              key={node.path}
              onClick={() => onSelectFile?.(node.path)}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-800/80 text-zinc-400 hover:text-white cursor-pointer transition-colors group"
              style={{ paddingLeft: `${depth * 12 + 20}px` }}
              title={`点击引用: ${node.path}`}
            >
              {getFileIcon(nodeName)}
              <span className="truncate group-hover:underline decoration-zinc-500 underline-offset-2">
                {nodeName}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // If no workspace is selected, show purely simplified folder icon button
  if (!hasWorkspace) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        {onOpenFolderPicker ? (
          <button
            onClick={onOpenFolderPicker}
            className="w-12 h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer shadow-sm group active:scale-95"
            title="打开项目文件夹"
          >
            <Folder className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
          </button>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
            <Folder className="w-6 h-6" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search & Refresh */}
      <div className="px-3 py-2 border-b border-zinc-800/70 flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文件..."
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded pl-6 pr-2 py-1 text-[11px] font-sans text-zinc-200 placeholder-zinc-500 outline-none"
          />
        </div>
        <button
          onClick={fetchFiles}
          disabled={isLoading}
          className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="刷新目录"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto px-1 py-1.5">
        {files.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500 font-sans">
            {isLoading ? '加载目录中...' : '目录为空或无权限访问'}
          </div>
        ) : (
          renderTree(files)
        )}
      </div>
    </div>
  );
};
