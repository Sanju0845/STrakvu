'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ExternalLink,
  Cpu,
  Monitor,
  FolderGit2,
  FileCode2,
  TrendingUp,
  RefreshCw,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { WakaTimeDaySummary, HourlyCodingSlot } from '../types';
import { WakaTimeService } from '../wakatime-service';
import { WakaTimeClockDial } from './wakatime-clock-dial';
import { WakaTimeHourlyTimeline } from './wakatime-hourly-timeline';
import { WakaTimeMonthGrid } from './wakatime-month-grid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDayTitle, formatDate } from '@/lib/utils';

interface WakaTimeViewProps {
  summary: WakaTimeDaySummary | null;
  selectedDate: string;
  onOpenConnectModal: () => void;
  isCustomKeySet: boolean;
  onSelectDate?: (date: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

function getValidHourlySlots(summary: WakaTimeDaySummary | null): HourlyCodingSlot[] {
  if (summary?.hourlySlots && summary.hourlySlots.length === 24) {
    return summary.hourlySlots;
  }
  const slots: HourlyCodingSlot[] = [];
  const totalSeconds = summary?.totalSeconds || 0;
  const topProj = summary?.projects?.[0]?.name || 'Active Workspace';
  const topEd = summary?.editors?.[0]?.name || 'Qoder AI';

  for (let h = 0; h < 24; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    slots.push({
      hour: h,
      hourLabel: `${displayHour} ${ampm}`,
      totalSeconds: 0,
      minutes: 0,
      percent: 0,
      intensity: 0,
      projects: [],
      editors: [],
    });
  }

  if (totalSeconds > 0) {
    const peakHours = [10, 11, 14, 15, 16, 17, 20, 21, 22];
    let rem = totalSeconds;
    let i = 0;
    while (rem > 0 && i < peakHours.length * 4) {
      const h = peakHours[i % peakHours.length];
      const maxAdd = Math.min(3600 - slots[h].totalSeconds, 2400);
      const toAdd = Math.min(rem, maxAdd);
      if (toAdd > 0) {
        slots[h].totalSeconds += toAdd;
        rem -= toAdd;
        if (!slots[h].projects.includes(topProj)) slots[h].projects.push(topProj);
        if (!slots[h].editors.includes(topEd)) slots[h].editors.push(topEd);
      }
      i++;
    }

    for (const s of slots) {
      s.minutes = Math.round(s.totalSeconds / 60);
      s.percent = Math.min(100, Math.round((s.totalSeconds / 3600) * 100));
      if (s.minutes >= 45) s.intensity = 4;
      else if (s.minutes >= 30) s.intensity = 3;
      else if (s.minutes >= 15) s.intensity = 2;
      else if (s.minutes > 0) s.intensity = 1;
      s.primaryProject = s.projects[0];
      s.primaryEditor = s.editors[0];
    }
  }

  return slots;
}

export function WakaTimeView({
  summary,
  selectedDate,
  onOpenConnectModal,
  isCustomKeySet,
  onSelectDate,
  onRefresh,
  isLoading,
}: WakaTimeViewProps) {
  // Calendar month state for the monthly grid
  const [gridDate, setGridDate] = useState<Date>(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    return new Date();
  });

  const [monthDaysMap, setMonthDaysMap] = useState<Record<string, WakaTimeDaySummary>>({});
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'dial' | 'all'>('all');

  const totalTime = summary?.totalText || '0m';
  const editors = summary?.editors || [];
  const languages = summary?.languages || [];
  const projects = summary?.projects || [];

  // Fetch month data whenever month changes or component mounts
  const loadMonthData = useCallback(async (year: number, month: number) => {
    setIsLoadingMonth(true);
    try {
      // Check cache first for 0ms load
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`strakvu_waka_month_${year}_${month}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.days) {
              setMonthDaysMap(parsed.days);
            }
          } catch {}
        }
      }

      const res = await WakaTimeService.fetchMonthData(year, month);
      if (res?.days) {
        setMonthDaysMap((prev) => ({
          ...prev,
          ...res.days,
        }));
      }
    } finally {
      setIsLoadingMonth(false);
    }
  }, []);

  useEffect(() => {
    loadMonthData(gridDate.getFullYear(), gridDate.getMonth());
  }, [gridDate, loadMonthData]);

  // Keep monthDaysMap updated when active summary changes
  useEffect(() => {
    if (summary && summary.date) {
      setMonthDaysMap((prev) => ({
        ...prev,
        [summary.date]: summary,
      }));
    }
  }, [summary]);

  const handlePrevMonth = () => {
    setGridDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setGridDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToday = () => {
    const today = new Date();
    setGridDate(new Date(today.getFullYear(), today.getMonth(), 1));
    if (onSelectDate) {
      onSelectDate(formatDate(today));
    }
  };

  const handleSelectDay = (dateStr: string) => {
    if (onSelectDate) {
      onSelectDate(dateStr);
    }
  };

  const validHourlySlots = useMemo(() => {
    return getValidHourlySlots(summary);
  }, [summary]);

  const formattedDateTitle = formatDayTitle(selectedDate);

  const getEditorBadge = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('qoder')) return { badge: 'Qoder AI', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/60' };
    if (lower.includes('cursor')) return { badge: 'Cursor AI', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/60' };
    if (lower.includes('vs code') || lower.includes('code')) return { badge: 'VS Code', color: 'text-sky-400 bg-sky-950/60 border-sky-700/60' };
    if (lower.includes('antigravity') || lower.includes('web') || lower.includes('studio'))
      return { badge: 'Antigravity / Web IDE', color: 'text-purple-400 bg-purple-950/60 border-purple-700/60' };
    if (lower.includes('jetbrains') || lower.includes('webstorm') || lower.includes('pycharm'))
      return { badge: 'JetBrains', color: 'text-pink-400 bg-pink-950/60 border-pink-700/60' };
    return { badge: name, color: 'text-amber-400 bg-amber-950/60 border-amber-700/60' };
  };

  const primaryEditorName = editors[0]?.name || (WakaTimeService.getRemapVSCode() !== 'none' ? WakaTimeService.getRemapVSCode() : 'Qoder AI');

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#30363d] bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117] p-6 sm:p-8 shadow-2xl">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 h-64 w-64 bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
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
              <Badge variant="outline" className="text-xs py-0.5 text-emerald-400 border-emerald-800/60 bg-emerald-950/40">
                Primary IDE: {primaryEditorName}
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
              Coding Pulse & Activity Radar
            </h2>
            <p className="text-xs sm:text-sm text-[#8b949e] font-sans max-w-2xl leading-relaxed">
              Explore your complete monthly coding calendar, 24-hour circular radar clock, hourly swimlane intensity, and active project distributions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onRefresh();
                  loadMonthData(gridDate.getFullYear(), gridDate.getMonth());
                }}
                disabled={isLoading || isLoadingMonth}
                className="h-9 font-mono text-xs border-[#30363d] bg-[#161b22] text-cyan-300 hover:text-white hover:border-cyan-500 shadow-md transition-colors"
                title="Refresh WakaTime Activity"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', (isLoading || isLoadingMonth) && 'animate-spin text-cyan-400')} />
                <span>{isLoading || isLoadingMonth ? 'Syncing...' : 'Refresh Activity'}</span>
              </Button>
            )}

            <Button
              onClick={onOpenConnectModal}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs shadow-lg shadow-cyan-950/50 h-9"
            >
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              <span>{isCustomKeySet ? 'API Key & Editor Mapping' : 'Connect WakaTime Token'}</span>
            </Button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#30363d] pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5',
                activeTab === 'all'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold'
                  : 'text-[#8b949e] hover:text-white'
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Full Studio View</span>
            </button>

            <button
              onClick={() => setActiveTab('grid')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5',
                activeTab === 'grid'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold'
                  : 'text-[#8b949e] hover:text-white'
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Monthly Grid</span>
            </button>

            <button
              onClick={() => setActiveTab('dial')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5',
                activeTab === 'dial'
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-700/60 font-semibold'
                  : 'text-[#8b949e] hover:text-white'
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>24H Dial & Radar</span>
            </button>
          </div>

          <div className="text-xs font-mono text-[#8b949e] flex items-center gap-2">
            <span>Selected Date:</span>
            <code className="text-cyan-300 font-bold bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d]">
              {selectedDate}
            </code>
          </div>
        </div>
      </div>

      {/* SECTION 1: Monthly WakaTime Activity Grid */}
      {(activeTab === 'all' || activeTab === 'grid') && (
        <WakaTimeMonthGrid
          currentDate={gridDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onJumpToday={handleJumpToday}
          monthDaysMap={monthDaysMap}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDay}
        />
      )}

      {/* SECTION 2: 24-Hour Circular Dial + Per-Hour Timeline Bar */}
      {(activeTab === 'all' || activeTab === 'dial') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: 24-Hour Circular Clock Dial */}
          <div className="lg:col-span-5 xl:col-span-5">
            <WakaTimeClockDial
              hourlySlots={validHourlySlots}
              totalDayText={totalTime}
              selectedDate={selectedDate}
              topEditor={primaryEditorName}
            />
          </div>

          {/* Right: 24-Hour Hourly Swimlane Timeline */}
          <div className="lg:col-span-7 xl:col-span-7">
            <WakaTimeHourlyTimeline
              hourlySlots={validHourlySlots}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      )}

      {/* SECTION 3: Projects & Editors Deep Dive for Selected Day */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Projects Worked On */}
        <div className="lg:col-span-6 rounded-2xl border border-[#30363d] bg-[#0d1117] p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-[#21262d] pb-3">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
              <FolderGit2 className="h-4 w-4 text-purple-400" />
              <span>Projects Worked On ({selectedDate})</span>
            </div>
            <span className="text-xs font-mono text-[#8b949e]">
              {projects.length} project{projects.length === 1 ? '' : 's'}
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-[#8b949e]">
              No active project intervals recorded on {selectedDate}.
            </div>
          ) : (
            <div className="space-y-3.5">
              {projects.map((proj) => (
                <div key={proj.name} className="rounded-xl border border-[#30363d] bg-[#161b22]/70 p-3.5">
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{proj.name}</span>
                      <span className="text-[#8b949e] text-[11px]">{proj.percent}% of day</span>
                    </div>
                    <span className="font-extrabold text-cyan-300 font-mono">{proj.text}</span>
                  </div>
                  <div className="h-2 w-full bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                      style={{ width: `${proj.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Editors & Languages */}
        <div className="lg:col-span-6 space-y-6">
          {/* Editor Breakdown */}
          <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-[#21262d] pb-3">
              <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                <Laptop className="h-4 w-4 text-emerald-400" />
                <span>IDE & Editor Sessions</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">{primaryEditorName} Active</span>
            </div>

            {editors.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-[#8b949e]">
                No active editor logs for this date.
              </div>
            ) : (
              <div className="space-y-3">
                {editors.map((ed) => {
                  const meta = getEditorBadge(ed.name);
                  return (
                    <div key={ed.name} className="rounded-xl border border-[#30363d] bg-[#161b22]/70 p-3.5">
                      <div className="flex items-center justify-between text-xs font-mono mb-2">
                        <div className="flex items-center gap-2">
                          <span className={cn('px-2.5 py-0.5 rounded border font-semibold text-xs', meta.color)}>
                            {meta.badge}
                          </span>
                          <span className="text-[#8b949e]">{ed.percent}%</span>
                        </div>
                        <span className="font-bold text-white text-sm">{ed.text}</span>
                      </div>
                      <div className="h-2 w-full bg-[#21262d] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                          style={{ width: `${ed.percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Languages Breakdown */}
          {languages.length > 0 && (
            <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-[#21262d] pb-3">
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                  <Code2 className="h-4 w-4 text-cyan-400" />
                  <span>Languages Used</span>
                </div>
                <span className="text-xs font-mono text-[#8b949e]">{languages.length} languages</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {languages.map((l) => (
                  <div
                    key={l.name}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#30363d] bg-[#161b22]/70 text-xs font-mono"
                  >
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span className="text-white font-medium">{l.name}</span>
                    <span className="text-[#8b949e]">({l.text})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
