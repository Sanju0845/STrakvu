'use client';

import React, { useState } from 'react';
import {
  X,
  KeyRound,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Laptop,
  Flame,
  Info,
} from 'lucide-react';
import { WakaTimeService } from '../wakatime-service';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WakaTimeConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
  currentKey: string;
}

export function WakaTimeConnectModal({
  isOpen,
  onClose,
  onSaveKey,
  currentKey,
}: WakaTimeConnectModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState(currentKey || '');
  const [remapEditor, setRemapEditor] = useState<string>(() => WakaTimeService.getRemapVSCode());
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    WakaTimeService.setRemapVSCode(remapEditor);
    onSaveKey(apiKeyInput.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setApiKeyInput('');
    onSaveKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50 duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#30363d] bg-[#0d1117] p-6 shadow-2xl overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#161b22] border border-cyan-500/30 text-cyan-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-white">
                Connect WakaTime API
              </h3>
              <p className="text-xs text-[#8b949e] font-mono">
                1-time free token setup for automatic IDE & time tracking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8b949e] hover:bg-[#161b22] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-4 rounded-xl border border-[#30363d] bg-[#161b22]/70 p-4 space-y-2 text-xs font-mono text-[#c9d1d9]">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <Zap className="h-4 w-4" />
            <span>How to get your free WakaTime Key in 30 seconds:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[#8b949e] text-[11px] leading-relaxed">
            <li>
              Log into{' '}
              <a
                href="https://wakatime.com/settings/api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 underline inline-flex items-center gap-0.5 hover:text-white"
              >
                wakatime.com/settings/api-key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </li>
            <li>Copy your Secret API Key (e.g. <code className="text-white bg-[#0d1117] px-1 py-0.5 rounded">waka_...</code>).</li>
            <li>Paste it below. Your key stays securely in your browser and proxies securely to WakaTime.</li>
          </ol>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-mono text-white font-medium block mb-1.5">
              WakaTime API Key
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="waka_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full rounded-xl border border-[#30363d] bg-[#161b22] px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-[#6e7681] focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Primary Editor Selection */}
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                <Laptop className="h-3.5 w-3.5" />
                <span>Primary Editor Mapping</span>
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                Remaps VS Code
              </span>
            </div>
            <p className="text-[11px] text-[#8b949e] font-sans leading-relaxed">
              <strong>Why Qoder shows as VS Code:</strong> Qoder is built on the VS Code engine. When you use the WakaTime extension inside Qoder, WakaTime automatically logs your heartbeats under the label &ldquo;VS Code&rdquo;. Strakvu remaps them so your profile accurately shows Qoder!
            </p>
            <div className="grid grid-cols-3 gap-2 pt-0.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setRemapEditor('Qoder')}
                className={cn(
                  'px-2.5 py-2 rounded-lg border text-center transition-all',
                  remapEditor === 'Qoder'
                    ? 'bg-emerald-600 text-white border-emerald-400 font-semibold shadow-sm shadow-emerald-950/60'
                    : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#484f58]'
                )}
              >
                Qoder AI
              </button>
              <button
                type="button"
                onClick={() => setRemapEditor('Cursor')}
                className={cn(
                  'px-2.5 py-2 rounded-lg border text-center transition-all',
                  remapEditor === 'Cursor'
                    ? 'bg-cyan-600 text-white border-cyan-400 font-semibold shadow-sm shadow-cyan-950/60'
                    : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#484f58]'
                )}
              >
                Cursor AI
              </button>
              <button
                type="button"
                onClick={() => setRemapEditor('VS Code')}
                className={cn(
                  'px-2.5 py-2 rounded-lg border text-center transition-all',
                  remapEditor === 'VS Code'
                    ? 'bg-sky-600 text-white border-sky-400 font-semibold shadow-sm shadow-sky-950/60'
                    : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#484f58]'
                )}
              >
                VS Code
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {currentKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 hover:underline"
              >
                Remove Key
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 font-mono text-xs border-[#30363d] text-[#8b949e]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-white" />
                    Saved!
                  </>
                ) : (
                  'Save & Sync WakaTime'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
