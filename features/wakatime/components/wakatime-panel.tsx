'use client';

import React, { useState } from 'react';
import {
  Clock,
  Code2,
  Laptop,
  Terminal,
  FileCode2,
  Sparkles,
  KeyRound,
  CheckCircle2,
  Layers,
  ChevronRight,
  ExternalLink,
  Flame,
  Activity,
  Cpu,
  Monitor,
} from 'lucide-react';
import { WakaTimeDaySummary } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WakaTimePanelProps {
  summary: WakaTimeDaySummary | null;
  selectedDate: string;
  onOpenConnectModal: () => void;
  isCustomKeySet: boolean;
}

export function WakaTimePanel({
  summary,
  selectedDate,
  onOpenConnectModal,
  isCustomKeySet,
}: WakaTimePanelProps) {
  const [activeTab, setActiveTab] = useState<'editors' | 'languages' | 'heartbeats'>('editors');

  const totalTime = summary?.totalText || '0 mins';
  const hasCodingActivity = (summary?.totalSeconds || 0) > 0;

  const getEditorBadgeColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('cursor')) return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60';
    if (lower.includes('vs code') || lower.includes('code')) return 'text-sky-400 bg-sky-950/40 border-sky-800/60';
    if (lower.includes('antigravity') || lower.includes('web') || lower.includes('studio'))
      return 'text-purple-400 bg-purple-950/40 border-purple-800/60';
    if (lower.includes('qoder')) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
    if (lower.includes('jetbrains') || lower.includes('webstorm') || lower.includes('pycharm'))
      return 'text-pink-400 bg-pink-950/40 border-pink-800/60';
    return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
  };

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] shadow-xl overflow-hidden flex flex-col h-full">
      {/* Panel Header */}
      <div className="border-b border-[#21262d] bg-[#161b22]/70 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d1117] border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold font-mono text-white tracking-tight">
                  WakaTime & Editor Pulse
                </h3>
                {isCustomKeySet ? (
                  <Badge variant="default" className="text-[10px] py-0 px-1.5 bg-emerald-700/80 border border-emerald-500/40">
                    Live Synced
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-cyan-400 border-cyan-500/30">
                    Auto Heartbeats
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-[#8b949e] font-mono mt-0.5">
                Tracks exact coding minutes, editors (Cursor, VS Code, Qoder) & active files
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenConnectModal}
            className="h-8 text-xs font-mono border-[#30363d] text-cyan-300 hover:text-white hover:border-cyan-500 transition-colors"
          >
            <KeyRound className="h-3 w-3 mr-1 text-cyan-400" />
            <span className="hidden sm:inline">{isCustomKeySet ? 'API Key Configured' : 'Connect Key'}</span>
            <span className="sm:hidden">Key</span>
          </Button>
        </div>

        {/* Big Metric Display for Selected Date */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8b949e]">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>Active Duration</span>
            </div>
            <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-white tracking-tight">
              {totalTime}
            </div>
          </div>

          <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8b949e]">
              <Laptop className="h-3.5 w-3.5 text-cyan-400" />
              <span>Primary Editor</span>
            </div>
            <div className="mt-1 text-sm sm:text-base font-bold font-mono text-cyan-300 truncate">
              {summary?.editors?.[0]?.name || 'No Activity'}
            </div>
          </div>

          <div className="hidden sm:block rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8b949e]">
              <Code2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Top Language</span>
            </div>
            <div className="mt-1 text-sm sm:text-base font-bold font-mono text-emerald-300 truncate">
              {summary?.languages?.[0]?.name || 'TypeScript'}
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="mt-4 flex items-center gap-1 border-t border-[#21262d] pt-3 text-xs font-mono">
          <button
            onClick={() => setActiveTab('editors')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5',
              activeTab === 'editors'
                ? 'bg-[#21262d] text-white font-semibold'
                : 'text-[#8b949e] hover:text-white'
            )}
          >
            <Monitor className="h-3.5 w-3.5 text-cyan-400" />
            <span>Editors ({summary?.editors?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('languages')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5',
              activeTab === 'languages'
                ? 'bg-[#21262d] text-white font-semibold'
                : 'text-[#8b949e] hover:text-white'
            )}
          >
            <Code2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Languages ({summary?.languages?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('heartbeats')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5',
              activeTab === 'heartbeats'
                ? 'bg-[#21262d] text-white font-semibold'
                : 'text-[#8b949e] hover:text-white'
            )}
          >
            <Activity className="h-3.5 w-3.5 text-purple-400" />
            <span>Intervals ({summary?.heartbeats?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Panel Body Content */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[320px] custom-scrollbar">
        {!hasCodingActivity ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#161b22] border border-[#30363d] text-[#8b949e] mb-2.5">
              <Clock className="h-5 w-5 text-cyan-400/60" />
            </div>
            <p className="text-xs font-mono font-medium text-white">No active editor heartbeats for this date</p>
            <p className="text-[11px] text-[#8b949e] mt-1">Select an active calendar day to see exact coding intervals.</p>
          </div>
        ) : activeTab === 'editors' ? (
          <div className="space-y-3">
            {summary?.editors.map((editor) => (
              <div
                key={editor.name}
                className="rounded-lg border border-[#30363d] bg-[#161b22]/50 p-3 hover:border-[#484f58] transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-0.5 rounded border font-semibold text-[11px]', getEditorBadgeColor(editor.name))}>
                      {editor.name}
                    </span>
                    <span className="text-[#8b949e] text-[11px]">{editor.percent}% of coding time</span>
                  </div>
                  <span className="font-bold text-white text-[12px]">{editor.text}</span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-[#21262d] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                    style={{ width: `${editor.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'languages' ? (
          <div className="space-y-3">
            {summary?.languages.map((lang) => (
              <div
                key={lang.name}
                className="rounded-lg border border-[#30363d] bg-[#161b22]/50 p-3 hover:border-[#484f58] transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lang.color || '#38bdf8' }} />
                    <span className="font-semibold text-white">{lang.name}</span>
                    <span className="text-[#8b949e] text-[11px]">{lang.percent}%</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-medium text-[12px]">{lang.text}</span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-[#21262d] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${lang.percent}%`,
                      backgroundColor: lang.color || '#38bdf8',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {summary?.heartbeats.map((hb) => (
              <div
                key={hb.id}
                className="rounded-lg border border-[#30363d] bg-[#161b22]/50 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-mono hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-[#0d1117] border border-[#30363d] text-cyan-400 shrink-0">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{hb.startTime} – {hb.endTime}</span>
                      <span className="text-[#8b949e]">({hb.durationText})</span>
                    </div>
                    {hb.file && (
                      <div className="flex items-center gap-1 text-[11px] text-[#8b949e] truncate max-w-[280px]">
                        <FileCode2 className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{hb.file}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <Badge variant="outline" className="text-[10px] text-cyan-300 border-cyan-800">
                    {hb.editor}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-emerald-300 border-emerald-800">
                    {hb.project}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-[#21262d] bg-[#161b22]/40 px-4 py-2.5 text-[11px] font-mono text-[#8b949e] flex items-center justify-between">
        <span className="flex items-center gap-1 text-cyan-400">
          <Sparkles className="h-3 w-3" />
          <span>Zero manual entry</span>
        </span>
        <a
          href="https://wakatime.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>wakatime.com</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
