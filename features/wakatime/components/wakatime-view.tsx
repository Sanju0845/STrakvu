'use client';

import React, { useState } from 'react';
import {
  Clock,
  Laptop,
  Code2,
  Activity,
  KeyRound,
  Flame,
  Calendar,
  Sparkles,
  Zap,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Monitor,
  FolderGit2,
  FileCode2,
  TrendingUp,
  BarChart3,
  Bot,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { WakaTimeDaySummary } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDayTitle, formatDate } from '@/lib/utils';

interface WakaTimeViewProps {
  summary: WakaTimeDaySummary | null;
  selectedDate: string;
  onOpenConnectModal: () => void;
  isCustomKeySet: boolean;
  onSelectDate?: (date: string) => void;
}

export function WakaTimeView({
  summary,
  selectedDate,
  onOpenConnectModal,
  isCustomKeySet,
  onSelectDate,
}: WakaTimeViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'editors' | 'languages' | 'projects' | 'heartbeats'>('all');

  const totalTime = summary?.totalText || '0m';
  const editors = summary?.editors || [];
  const languages = summary?.languages || [];
  const projects = summary?.projects || [];
  const heartbeats = summary?.heartbeats || [];

  // Date Navigation helpers
  const handleOffsetDay = (days: number) => {
    const current = new Date(selectedDate + 'T12:00:00Z');
    current.setUTCDate(current.getUTCDate() + days);
    if (onSelectDate) {
      onSelectDate(formatDate(current));
    }
  };

  const handleJumpToday = () => {
    if (onSelectDate) {
      onSelectDate(formatDate(new Date()));
    }
  };

  const formattedDateTitle = formatDayTitle(selectedDate);

  const getEditorBadge = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('cursor')) return { badge: 'Cursor AI', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/60' };
    if (lower.includes('vs code') || lower.includes('code')) return { badge: 'VS Code', color: 'text-sky-400 bg-sky-950/60 border-sky-700/60' };
    if (lower.includes('antigravity') || lower.includes('web') || lower.includes('studio'))
      return { badge: 'Antigravity / Web IDE', color: 'text-purple-400 bg-purple-950/60 border-purple-700/60' };
    if (lower.includes('qoder')) return { badge: 'Qoder AI', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/60' };
    if (lower.includes('jetbrains') || lower.includes('webstorm') || lower.includes('pycharm'))
      return { badge: 'JetBrains', color: 'text-pink-400 bg-pink-950/60 border-pink-700/60' };
    return { badge: name, color: 'text-amber-400 bg-amber-950/60 border-amber-700/60' };
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#30363d] bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117] p-6 sm:p-8 shadow-2xl">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 h-64 w-64 bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 items-center gap-1.5 rounded-md bg-cyan-950/70 border border-cyan-800/60 px-2.5 text-xs font-mono font-medium text-cyan-400">
                <Clock className="h-3.5 w-3.5" />
                <span>WakaTime & Editor Pulse Studio</span>
              </span>
              {isCustomKeySet ? (
                <Badge variant="default" className="text-xs py-0.5 bg-emerald-700/90 border border-emerald-500/50">
                  Live API Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs py-0.5 text-cyan-300 border-cyan-500/40">
                  Custom Sessions Active
                </Badge>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
              Automated IDE & Editor Analytics
            </h2>
            <p className="text-xs sm:text-sm text-[#8b949e] font-sans max-w-2xl leading-relaxed">
              Track minute-by-minute coding heartbeats across <span className="text-cyan-300 font-mono">Cursor</span>, <span className="text-sky-300 font-mono">VS Code</span>, <span className="text-emerald-300 font-mono">Qoder</span>, and <span className="text-purple-300 font-mono">Web IDEs</span> with zero manual entry.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <Button
              onClick={onOpenConnectModal}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs shadow-lg shadow-cyan-950/50 h-9"
            >
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              <span>{isCustomKeySet ? 'Update WakaTime Key' : 'Connect WakaTime Token'}</span>
            </Button>
          </div>
        </div>

        {/* Date Selector Navigation Toolbar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#30363d] pt-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-[#30363d] bg-[#0d1117]">
              <button
                type="button"
                onClick={() => handleOffsetDay(-1)}
                title="Previous Day"
                className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-l-md transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="px-3 py-1 text-xs font-mono font-bold text-white flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                <span>{formattedDateTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => handleOffsetDay(1)}
                title="Next Day"
                className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-r-md transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleJumpToday}
              className="h-8 text-xs font-mono border-[#30363d] text-[#c9d1d9] hover:text-white"
            >
              Today
            </Button>
          </div>

          <div className="text-xs font-mono text-[#8b949e]">
            Viewing active logs for: <code className="text-cyan-300 font-bold">{selectedDate}</code>
          </div>
        </div>

        {/* Highlights Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117]/80 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#8b949e]">
              <Flame className="h-4 w-4 text-amber-400" />
              <span>Total Coding ({selectedDate})</span>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white">
              {totalTime}
            </div>
          </div>

          <div className="rounded-xl border border-[#30363d] bg-[#0d1117]/80 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#8b949e]">
              <Laptop className="h-4 w-4 text-cyan-400" />
              <span>Primary Editor</span>
            </div>
            <div className="mt-2 text-base sm:text-lg font-bold font-mono text-cyan-300 truncate">
              {editors[0]?.name || 'None'}
            </div>
          </div>

          <div className="rounded-xl border border-[#30363d] bg-[#0d1117]/80 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#8b949e]">
              <Code2 className="h-4 w-4 text-emerald-400" />
              <span>Top Language</span>
            </div>
            <div className="mt-2 text-base sm:text-lg font-bold font-mono text-emerald-300 truncate">
              {languages[0]?.name || 'None'}
            </div>
          </div>

          <div className="rounded-xl border border-[#30363d] bg-[#0d1117]/80 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#8b949e]">
              <FolderGit2 className="h-4 w-4 text-purple-400" />
              <span>Active Project</span>
            </div>
            <div className="mt-2 text-base sm:text-lg font-bold font-mono text-purple-300 truncate">
              {projects[0]?.name || 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-[#21262d] pb-2 text-xs font-mono overflow-x-auto">
        {(['all', 'editors', 'languages', 'projects', 'heartbeats'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg capitalize transition-colors font-medium',
              activeTab === tab
                ? 'bg-[#161b22] text-white border border-[#30363d] shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editors & Languages */}
        <div className="lg:col-span-6 space-y-6">
          {/* Editors Section */}
          {(activeTab === 'all' || activeTab === 'editors') && (
            <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                  <Monitor className="h-4 w-4 text-cyan-400" />
                  <span>Editor & IDE Breakdown</span>
                </div>
                <span className="text-xs font-mono text-[#8b949e]">{editors.length} detected</span>
              </div>

              {editors.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-[#8b949e]">
                  No active editor heartbeats recorded for {selectedDate}.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {editors.map((ed) => {
                    const meta = getEditorBadge(ed.name);
                    return (
                      <div key={ed.name} className="rounded-lg border border-[#30363d] bg-[#161b22]/60 p-3.5">
                        <div className="flex items-center justify-between text-xs font-mono mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn('px-2 py-0.5 rounded border font-semibold text-[11px]', meta.color)}>
                              {meta.badge}
                            </span>
                            <span className="text-[#8b949e]">{ed.percent}% duration</span>
                          </div>
                          <span className="font-bold text-white font-mono text-sm">{ed.text}</span>
                        </div>
                        <div className="h-2 w-full bg-[#21262d] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                            style={{ width: `${ed.percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Languages Section */}
          {(activeTab === 'all' || activeTab === 'languages') && (
            <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                  <Code2 className="h-4 w-4 text-emerald-400" />
                  <span>Programming Languages & Tech Stack</span>
                </div>
                <span className="text-xs font-mono text-[#8b949e]">{languages.length} languages</span>
              </div>

              {languages.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-[#8b949e]">
                  No languages recorded for {selectedDate}.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {languages.map((lang) => (
                    <div key={lang.name} className="rounded-lg border border-[#30363d] bg-[#161b22]/60 p-3.5">
                      <div className="flex items-center justify-between text-xs font-mono mb-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lang.color || '#38bdf8' }} />
                          <span className="font-bold text-white">{lang.name}</span>
                          <span className="text-[#8b949e]">({lang.percent}%)</span>
                        </div>
                        <span className="font-bold text-emerald-400 font-mono text-sm">{lang.text}</span>
                      </div>
                      <div className="h-2 w-full bg-[#21262d] rounded-full overflow-hidden">
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
              )}
            </div>
          )}
        </div>

        {/* Right Column: Heartbeats Timeline & Projects */}
        <div className="lg:col-span-6 space-y-6">
          {/* Projects Section */}
          {(activeTab === 'all' || activeTab === 'projects') && (
            <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                  <FolderGit2 className="h-4 w-4 text-purple-400" />
                  <span>Projects & Repositories Worked On</span>
                </div>
                <span className="text-xs font-mono text-[#8b949e]">{projects.length} projects</span>
              </div>

              {projects.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-[#8b949e]">
                  No projects recorded for {selectedDate}.
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((proj) => (
                    <div key={proj.name} className="rounded-lg border border-[#30363d] bg-[#161b22]/60 p-3.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold font-mono text-white text-sm block">{proj.name}</span>
                        {proj.branch && (
                          <span className="text-[11px] font-mono text-[#8b949e] block mt-0.5">
                            branch: <code className="text-purple-300">{proj.branch}</code>
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-purple-300 text-sm block">{proj.text}</span>
                        <span className="text-[11px] font-mono text-[#8b949e]">{proj.percent}% share</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Detailed Heartbeat Sessions */}
          {(activeTab === 'all' || activeTab === 'heartbeats') && (
            <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>Time-to-Time Coding Intervals</span>
                </div>
                <span className="text-xs font-mono text-[#8b949e]">{heartbeats.length} sessions</span>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar">
                {heartbeats.length === 0 ? (
                  <p className="text-xs text-[#8b949e] font-mono py-4 text-center">
                    No heartbeat intervals logged for {selectedDate}.
                  </p>
                ) : (
                  heartbeats.map((hb) => (
                    <div
                      key={hb.id}
                      className="rounded-lg border border-[#30363d] bg-[#161b22]/50 p-3.5 hover:border-cyan-500/40 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{hb.startTime} – {hb.endTime}</span>
                          <span className="text-cyan-400 font-semibold">({hb.durationText})</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-cyan-300 border-cyan-800">
                          {hb.editor}
                        </Badge>
                      </div>

                      {hb.file && (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-[#8b949e] bg-[#0d1117] px-2.5 py-1.5 rounded border border-[#21262d]">
                          <FileCode2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{hb.file}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
