import React, { useState } from 'react';
import {
  X,
  Server,
  HardDrive,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Languages,
  Check
} from 'lucide-react';
import { codexClient, ConnectionState } from '../services/codexClient';
import { useLanguage } from '../i18n/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: string;
  onUpdateWorkspace: (ws: string) => void;
  connectionState: ConnectionState;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onUpdateWorkspace,
  connectionState
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [daemonUrl, setDaemonUrl] = useState('ws://127.0.0.1:4500');
  const [wsInput, setWsInput] = useState(workspace);
  const [isReconnecting, setIsReconnecting] = useState(false);

  if (!isOpen) return null;

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      codexClient.disconnect();
      await codexClient.connect();
    } catch (e) {
      console.error(e);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleSave = () => {
    onUpdateWorkspace(wsInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-surface border border-zinc-700 rounded-xl shadow-panel max-w-lg w-full overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans tracking-wide">
                {t.settings.title}
              </h3>
              <p className="text-[10px] font-mono text-zinc-400">
                {t.settings.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-zinc-300 font-semibold flex items-center gap-2 font-sans">
              <Languages className="w-3.5 h-3.5 text-zinc-400" />
              <span>{t.settings.languageSection}</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setLanguage('zh')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                  language === 'zh'
                    ? 'bg-zinc-800 border-zinc-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/60 text-zinc-400'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs text-white font-sans">简体中文</div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">Chinese (Simplified)</div>
                </div>
                {language === 'zh' && (
                  <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>

              <button
                onClick={() => setLanguage('en')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                  language === 'en'
                    ? 'bg-zinc-800 border-zinc-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/60 text-zinc-400'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs text-white font-sans">English</div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">English (US)</div>
                </div>
                {language === 'en' && (
                  <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 font-sans">
              {t.settings.languageDesc}
            </p>
          </div>

          {/* Workspace directory */}
          <div className="space-y-1.5 pt-1">
            <label className="text-zinc-300 font-semibold flex items-center gap-2 font-sans">
              <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
              <span>{t.settings.workspaceDir}</span>
            </label>
            <input
              type="text"
              value={wsInput}
              onChange={(e) => setWsInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3.5 py-2 text-white font-mono text-xs outline-none"
            />
            <p className="text-[11px] text-zinc-500 font-sans">
              {t.settings.workspaceDesc}
            </p>
          </div>

          {/* App Server Daemon Endpoint */}
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-semibold flex items-center gap-2 font-sans">
              <Server className="w-3.5 h-3.5 text-zinc-400" />
              <span>{t.settings.daemonEndpoint}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={daemonUrl}
                onChange={(e) => setDaemonUrl(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3.5 py-2 text-white font-mono text-xs outline-none"
              />
              <button
                onClick={handleReconnect}
                disabled={isReconnecting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white transition-all text-xs font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
                <span>{t.settings.reconnect}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
              <span className="text-zinc-500">{t.settings.daemonStatus}</span>
              <span
                className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${
                  connectionState === 'connected'
                    ? 'bg-zinc-800 text-white border border-zinc-600'
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                }`}
              >
                {connectionState}
              </span>
            </div>
          </div>

          {/* Runtime Matrix */}
          <div className="p-3.5 bg-zinc-900 rounded-lg border border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-200 font-semibold font-sans">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span>{t.settings.nativePlatform}</span>
            </div>
            <div className="text-[11px] text-zinc-400 space-y-1 font-mono">
              <p>{t.settings.platformShell}</p>
              <p>{t.settings.platformProtocol}</p>
              <p>{t.settings.platformEngine}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-zinc-900 border-t border-zinc-800 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors"
          >
            {t.settings.cancel}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold tracking-wide transition-all shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.settings.apply}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
