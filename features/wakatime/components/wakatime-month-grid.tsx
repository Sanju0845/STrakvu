'use client';

import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Calendar,
  Flame,
  FolderGit2,
  Laptop,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { WakaTimeDaySummary } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, MONTH_NAMES } from '@/lib/utils';

interface WakaTimeMonthGridProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToday: () => void;
  onSelectMonthYear?: (year: number, month: number) => void;
  monthDaysMap: Record<string, WakaTimeDaySummary>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WakaTimeMonthGrid({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onJumpToday,
  onSelectMonthYear,
  monthDaysMap,
  selectedDate,
  onSelectDate,
}: WakaTimeMonthGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = MONTH_NAMES[month];

  const [showYearPicker, setShowYearPicker] = React.useState(false);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 2018 + 2 }, (_, i) => thisYear + 1 - i);

  // Build full calendar month grid (leading days + month days + trailing days)
  const calendarCells = useMemo(() => {
    const cells: {
      date: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      summary: WakaTimeDaySummary | null;
      intensity: 0 | 1 | 2 | 3 | 4;
      totalSeconds: number;
      topProject?: string;
      topEditor?: string;
    }[] = [];

    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
    const startDayOfWeek = firstDayOfMonth.getUTCDay(); // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getUTCDate();

    const now = new Date();
    const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

    // Previous month trailing
    const prevMonthLastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevMonthNum = month === 0 ? 12 : month;
      const prevYearNum = month === 0 ? year - 1 : year;
      const dateStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const sum = monthDaysMap[dateStr] || null;
      const totalSecs = sum?.totalSeconds || 0;

      let intensity: 0 | 1 | 2 | 3 | 4 = 0;
      if (totalSecs > 18000) intensity = 4;
      else if (totalSecs > 10800) intensity = 3;
      else if (totalSecs > 3600) intensity = 2;
      else if (totalSecs > 0) intensity = 1;

      cells.push({
        date: dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        summary: sum,
        intensity,
        totalSeconds: totalSecs,
        topProject: sum?.projects?.[0]?.name,
        topEditor: sum?.editors?.[0]?.name,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const sum = monthDaysMap[dateStr] || null;
      const totalSecs = sum?.totalSeconds || 0;

      let intensity: 0 | 1 | 2 | 3 | 4 = 0;
      if (totalSecs >= 18000) intensity = 4; // 5h+
      else if (totalSecs >= 10800) intensity = 3; // 3h - 5h
      else if (totalSecs >= 3600) intensity = 2; // 1h - 3h
      else if (totalSecs > 0) intensity = 1; // < 1h

      cells.push({
        date: dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        summary: sum,
        intensity,
        totalSeconds: totalSecs,
        topProject: sum?.projects?.[0]?.name,
        topEditor: sum?.editors?.[0]?.name,
      });
    }

    // Next month trailing (to complete 35 or 42 cells)
    const remainder = cells.length % 7;
    if (remainder > 0) {
      const daysToAdd = 7 - remainder;
      const nextMonthNum = month === 11 ? 1 : month + 2;
      const nextYearNum = month === 11 ? year + 1 : year;
      for (let d = 1; d <= daysToAdd; d++) {
        const dateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const sum = monthDaysMap[dateStr] || null;
        cells.push({
          date: dateStr,
          dayNumber: d,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
          summary: sum,
          intensity: 0,
          totalSeconds: 0,
        });
      }
    }

    return cells;
  }, [year, month, monthDaysMap]);

  // Aggregate stats for this month
  const monthStats = useMemo(() => {
    let totalSecs = 0;
    let activeDaysCount = 0;
    const projectFrequency: Record<string, number> = {};
    const editorFrequency: Record<string, number> = {};

    for (const cell of calendarCells) {
      if (cell.isCurrentMonth && cell.totalSeconds > 0) {
        totalSecs += cell.totalSeconds;
        activeDaysCount++;
        if (cell.summary?.projects) {
          for (const pr of cell.summary.projects) {
            projectFrequency[pr.name] = (projectFrequency[pr.name] || 0) + pr.total_seconds;
          }
        }
        if (cell.summary?.editors) {
          for (const ed of cell.summary.editors) {
            editorFrequency[ed.name] = (editorFrequency[ed.name] || 0) + ed.total_seconds;
          }
        }
      }
    }

    const totalHours = (totalSecs / 3600).toFixed(1);
    const avgMinsPerActiveDay = activeDaysCount > 0 ? Math.round((totalSecs / 60) / activeDaysCount) : 0;
    const avgH = Math.floor(avgMinsPerActiveDay / 60);
    const avgM = avgMinsPerActiveDay % 60;
    const avgText = avgH > 0 && avgM > 0 ? `${avgH}h ${avgM}m` : avgH > 0 ? `${avgH}h` : `${avgM}m`;

    const topProject = Object.entries(projectFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || 'STrakvu';
    const topEditor = Object.entries(editorFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Qoder AI';

    return {
      totalHours,
      activeDaysCount,
      avgText,
      topProject,
      topEditor,
    };
  }, [calendarCells]);

  return (
    <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] shadow-2xl p-4 sm:p-6 overflow-hidden">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#21262d] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#161b22] border border-cyan-500/40 text-cyan-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowYearPicker(!showYearPicker)}
              className="flex items-center gap-2 group text-left"
            >
              <h3 className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2 group-hover:text-cyan-300 transition-colors">
                <span>{monthName} {year}</span>
                <ChevronDown className="h-4 w-4 text-[#8b949e] group-hover:text-cyan-300 transition-colors" />
              </h3>
              <span className="text-xs text-cyan-400 font-normal px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 hidden sm:inline">
                WakaTime Grid
              </span>
            </button>
            <p className="text-xs text-[#8b949e] font-mono mt-0.5">
              Daily coding duration & projects worked on
            </p>

            {/* Year & Month Selection Popover */}
            {showYearPicker && (
              <div className="absolute top-full left-0 mt-2 z-50 w-64 sm:w-72 rounded-xl border border-[#30363d] bg-[#161b22] p-3 shadow-2xl space-y-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8b949e] tracking-wider block mb-1.5">
                    Select Month
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {MONTH_NAMES.map((m, idx) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          onSelectMonthYear?.(year, idx);
                          setShowYearPicker(false);
                        }}
                        className={`py-1 text-xs font-mono rounded transition-colors ${
                          idx === month
                            ? 'bg-cyan-600 text-white font-semibold'
                            : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
                        }`}
                      >
                        {m.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#30363d] pt-2">
                  <label className="text-[10px] font-mono uppercase text-[#8b949e] tracking-wider block mb-1.5">
                    Select Year
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {years.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          onSelectMonthYear?.(y, month);
                          setShowYearPicker(false);
                        }}
                        className={`px-2.5 py-1 text-xs font-mono rounded shrink-0 transition-colors ${
                          y === year
                            ? 'bg-cyan-600 text-white font-semibold'
                            : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={onPrevMonth}
            className="h-8 w-8 p-0 border-[#30363d] text-[#8b949e] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onJumpToday}
            className="h-8 font-mono text-xs border-[#30363d] text-cyan-300 hover:text-white"
          >
            Today
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onNextMonth}
            className="h-8 w-8 p-0 border-[#30363d] text-[#8b949e] hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Monthly Summary Metrics Banner */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#161b22]/70 rounded-xl p-3 border border-[#21262d]">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8b949e]">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Month Coding</span>
          </div>
          <div className="mt-1 text-lg sm:text-xl font-extrabold font-mono text-cyan-300">
            {monthStats.totalHours} hrs
          </div>
        </div>

        <div className="bg-[#161b22]/70 rounded-xl p-3 border border-[#21262d]">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8b949e]">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span>Daily Average</span>
          </div>
          <div className="mt-1 text-lg sm:text-xl font-extrabold font-mono text-emerald-400">
            {monthStats.avgText}
          </div>
        </div>

        <div className="bg-[#161b22]/70 rounded-xl p-3 border border-[#21262d]">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8b949e]">
            <FolderGit2 className="h-3.5 w-3.5 text-purple-400" />
            <span>Top Project</span>
          </div>
          <div className="mt-1 text-sm font-bold font-mono text-white truncate" title={monthStats.topProject}>
            {monthStats.topProject}
          </div>
        </div>

        <div className="bg-[#161b22]/70 rounded-xl p-3 border border-[#21262d]">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8b949e]">
            <Laptop className="h-3.5 w-3.5 text-amber-400" />
            <span>Primary IDE</span>
          </div>
          <div className="mt-1 text-sm font-bold font-mono text-emerald-400 truncate">
            {monthStats.topEditor}
          </div>
        </div>
      </div>

      {/* Week Day Column Headers */}
      <div className="mt-5 grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-mono text-[#8b949e] pb-2 border-b border-[#21262d]">
        {WEEK_DAYS.map((day) => (
          <span key={day} className="font-semibold">{day}</span>
        ))}
      </div>

      {/* Calendar Month Cells Grid */}
      <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
        {calendarCells.map((cell) => {
          const isSelected = selectedDate === cell.date;
          const isQoder = (cell.topEditor || '').toLowerCase().includes('qoder');
          const isCursor = (cell.topEditor || '').toLowerCase().includes('cursor');

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className={cn(
                'min-h-[72px] sm:min-h-[88px] rounded-xl border p-1.5 sm:p-2 text-left flex flex-col justify-between transition-all duration-150 relative group',
                cell.isCurrentMonth ? 'opacity-100' : 'opacity-35 bg-[#090d14]/40',
                cell.intensity === 0 && 'bg-[#161b22]/40 border-[#21262d] hover:border-[#30363d]',
                cell.intensity === 1 && 'bg-emerald-950/20 border-emerald-900/50 hover:border-emerald-500',
                cell.intensity === 2 && 'bg-emerald-950/40 border-emerald-800/70 hover:border-emerald-400',
                cell.intensity === 3 && 'bg-emerald-900/40 border-emerald-600/80 hover:border-emerald-300 shadow-sm shadow-emerald-950',
                cell.intensity === 4 && 'bg-emerald-800/40 border-emerald-500 shadow-md shadow-emerald-950/80 hover:border-emerald-200',
                isSelected && 'ring-2 ring-cyan-400 border-cyan-400 scale-[1.02] z-10 shadow-lg shadow-cyan-950'
              )}
            >
              {/* Day Number and Today badge */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    'text-xs font-mono font-bold leading-none',
                    cell.isToday
                      ? 'text-cyan-400 bg-cyan-950/90 px-1.5 py-0.5 rounded border border-cyan-700/60'
                      : cell.isCurrentMonth
                      ? 'text-white'
                      : 'text-[#6e7681]'
                  )}
                >
                  {cell.dayNumber}
                </span>

                {/* Primary editor indicator dot */}
                {cell.intensity > 0 && (
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      isQoder ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : isCursor ? 'bg-cyan-400 shadow-[0_0_6px_#06b6d4]' : 'bg-sky-400 shadow-[0_0_6px_#38bdf8]'
                    )}
                    title={cell.topEditor || 'Editor session'}
                  />
                )}
              </div>

              {/* Center Coding Duration Readout */}
              <div className="my-1">
                {cell.totalSeconds > 0 ? (
                  <span className="text-[11px] sm:text-xs font-mono font-extrabold text-cyan-300 block truncate">
                    {cell.summary?.totalText || `${Math.round(cell.totalSeconds / 3600)}h`}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-[#484f58] block">0m</span>
                )}
              </div>

              {/* Bottom Project Chip */}
              <div className="w-full truncate">
                {cell.topProject ? (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#0d1117]/80 text-[#8b949e] border border-[#30363d] truncate block max-w-full">
                    {cell.topProject}
                  </span>
                ) : cell.intensity > 0 ? (
                  <span className="text-[9px] font-mono text-emerald-400 block truncate">
                    Active
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Grid Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between text-xs font-mono text-[#8b949e] pt-3 border-t border-[#21262d] gap-2">
        <div className="flex items-center gap-2">
          <span>Daily Hours:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#484f58]">0m</span>
            <div className="h-3 w-3 rounded bg-[#161b22] border border-[#21262d]" />
            <div className="h-3 w-3 rounded bg-emerald-950 border border-emerald-800" />
            <div className="h-3 w-3 rounded bg-emerald-900 border border-emerald-700" />
            <div className="h-3 w-3 rounded bg-emerald-700 border border-emerald-500" />
            <div className="h-3 w-3 rounded bg-emerald-500 border border-emerald-300" />
            <span className="text-[10px] text-emerald-400">6h+</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Qoder AI</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span>Cursor</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span>VS Code</span>
          </span>
        </div>
      </div>
    </div>
  );
}
