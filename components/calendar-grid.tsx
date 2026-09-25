'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bot, Compass, GitCommit, Sparkles, ChevronDown } from 'lucide-react';
import { DayActivity } from '@/types/activity';
import { Button } from './ui/button';
import { cn, MONTH_NAMES } from '@/lib/utils';

interface CalendarGridProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToday: () => void;
  onSelectMonthYear?: (year: number, month: number) => void;
  monthActivities: DayActivity[];
  selectedDay: DayActivity | null;
  onSelectDay: (day: DayActivity) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onJumpToday,
  onSelectMonthYear,
  monthActivities,
  selectedDay,
  onSelectDay,
}: CalendarGridProps) {
  const currentMonthIdx = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const monthName = MONTH_NAMES[currentMonthIdx] || 'September';

  const [showYearPicker, setShowYearPicker] = useState(false);

  // Years range from 2018 up to current year + 1
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 2018 + 2 }, (_, i) => thisYear + 1 - i);

  // Green color mapping matching GitHub contribution tones
  const getDotStyle = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#0e4429] border border-[#238636]/60 shadow-[0_0_6px_rgba(35,134,54,0.3)]';
      case 2:
        return 'bg-[#006d32] border border-[#26a641]/80 shadow-[0_0_8px_rgba(38,166,65,0.4)]';
      case 3:
        return 'bg-[#26a641] border border-[#39d353] shadow-[0_0_10px_rgba(57,211,83,0.5)]';
      case 4:
        return 'bg-[#39d353] border border-white/60 shadow-[0_0_14px_rgba(57,211,83,0.8)]';
      default:
        return 'bg-transparent';
    }
  };

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] shadow-xl overflow-hidden">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#21262d] p-4 sm:p-5 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#161b22] border border-[#30363d] text-emerald-400">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowYearPicker(!showYearPicker)}
                className="flex items-center gap-1.5 text-lg sm:text-xl font-bold font-mono text-white tracking-tight hover:text-emerald-400 transition-colors group"
              >
                <span>{monthName} {year}</span>
                <ChevronDown className={`h-4 w-4 text-[#8b949e] group-hover:text-emerald-400 transition-transform ${showYearPicker ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <p className="text-[11px] text-[#8b949e] font-mono">
              Explore your complete GitHub commits & journey across any date
            </p>

            {/* Quick Month & Year Picker Dropdown */}
            {showYearPicker && (
              <div className="absolute top-full left-0 mt-2 z-50 w-72 rounded-xl border border-[#30363d] bg-[#161b22] p-3 shadow-2xl space-y-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8b949e] tracking-wider block mb-1.5">
                    Select Month
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {MONTH_NAMES.map((m, idx) => (
                      <button
                        key={m}
                        onClick={() => {
                          onSelectMonthYear?.(year, idx);
                          setShowYearPicker(false);
                        }}
                        className={`py-1 text-xs font-mono rounded transition-colors ${
                          idx === currentMonthIdx
                            ? 'bg-[#238636] text-white font-semibold'
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
                        onClick={() => {
                          onSelectMonthYear?.(y, currentMonthIdx);
                          setShowYearPicker(false);
                        }}
                        className={`px-2.5 py-1 text-xs font-mono rounded shrink-0 transition-colors ${
                          y === year
                            ? 'bg-[#238636] text-white font-semibold'
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

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            onClick={onJumpToday}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-mono border-[#30363d] text-[#c9d1d9] hover:text-white"
          >
            Today
          </Button>

          <div className="flex items-center rounded-lg border border-[#30363d] bg-[#161b22]">
            <button
              onClick={onPrevMonth}
              title="Previous Month"
              className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-l-md transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-[#30363d]" />
            <button
              onClick={onNextMonth}
              title="Next Month"
              className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-r-md transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 border-b border-[#21262d] bg-[#161b22]/40 text-center">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={`py-2 text-[11px] sm:text-xs font-mono font-medium tracking-wider uppercase ${
              idx === 0 || idx === 6 ? 'text-[#6e7681]' : 'text-[#8b949e]'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 bg-[#21262d] gap-px">
        {monthActivities.map((day, index) => {
          const isSelected = selectedDay?.date === day.date;
          const hasActivity = day.totalActivities > 0;
          const primaryRepo = day.repos[0]?.split('/')[1] || day.repos[0];

          return (
            <button
              key={`${day.date}-${index}`}
              onClick={() => onSelectDay(day)}
              className={cn(
                'group relative flex flex-col justify-between p-2 sm:p-2.5 min-h-[90px] sm:min-h-[105px] transition-all text-left outline-none',
                day.isCurrentMonth
                  ? 'bg-[#0d1117] hover:bg-[#161b22]'
                  : 'bg-[#090d14]/70 text-[#484f58] hover:bg-[#121620]',
                isSelected && 'ring-2 ring-emerald-500 ring-inset bg-[#161b22] z-10',
                day.isToday && !isSelected && 'bg-emerald-950/20'
              )}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    'font-mono text-xs sm:text-sm transition-colors',
                    day.isCurrentMonth
                      ? 'text-[#c9d1d9] group-hover:text-white'
                      : 'text-[#484f58]',
                    day.isToday && 'font-bold text-emerald-400',
                    isSelected && 'font-bold text-white'
                  )}
                >
                  {day.dayNumber}
                </span>

                {/* Level / Intensity Indicator */}
                {hasActivity && (
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        'h-2.5 w-2.5 rounded-sm transition-transform group-hover:scale-110',
                        getDotStyle(day.level)
                      )}
                      title={`${day.totalCommits} commits, ${day.totalActivities} total events`}
                    />
                  </div>
                )}
              </div>

              {/* Day Content Summary (Primary Project & Commit/AI Indicators) */}
              <div className="mt-auto space-y-1 w-full overflow-hidden">
                {hasActivity ? (
                  <>
                    {/* Primary repo badge */}
                    {primaryRepo && (
                      <div className="truncate rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-[#21262d] text-emerald-300 group-hover:bg-[#30363d] transition-colors">
                        {primaryRepo}
                      </div>
                    )}

                    {/* Commit & AI badge indicators */}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8b949e]">
                      {day.totalCommits > 0 && (
                        <span className="flex items-center gap-0.5 text-sky-400">
                          <GitCommit className="h-3 w-3" />
                          <span>{day.totalCommits}</span>
                        </span>
                      )}

                      {day.aiSessions && day.aiSessions.length > 0 && (
                        <span className="flex items-center gap-0.5 text-purple-400">
                          <Bot className="h-3 w-3" />
                          <span>{day.aiSessions.length}</span>
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-4" />
                )}
              </div>

              {/* Highlight today pill */}
              {day.isToday && (
                <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#39d353] shadow-[0_0_8px_#39d353]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
