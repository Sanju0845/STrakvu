'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bot, Compass, GitCommit, Sparkles } from 'lucide-react';
import { DayActivity } from '@/types/activity';
import { Button } from './ui/button';
import { cn, MONTH_NAMES } from '@/lib/utils';

interface CalendarGridProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToday: () => void;
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
  monthActivities,
  selectedDay,
  onSelectDay,
}: CalendarGridProps) {
  const monthName = MONTH_NAMES[currentDate.getMonth()] || 'September';
  const year = currentDate.getFullYear();

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
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight flex items-center gap-2">
              <span>{monthName} {year}</span>
            </h2>
            <p className="text-[11px] text-[#8b949e] font-mono">
              Click any date to view primary projects, commits & AI prompt records
            </p>
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
          const hasActivity = day.totalActivities > 0 || (day.aiSessions && day.aiSessions.length > 0);
          const aiCount = day.aiSessions?.length || 0;

          return (
            <button
              key={`${day.date}-${index}`}
              onClick={() => onSelectDay(day)}
              className={cn(
                'group relative flex flex-col justify-between text-left transition-all duration-150 p-2 sm:p-2.5 min-h-[78px] sm:min-h-[96px] md:min-h-[104px] focus:outline-none cursor-pointer',
                day.isCurrentMonth
                  ? 'bg-[#0d1117] hover:bg-[#161b22]'
                  : 'bg-[#090d14]/70 text-[#484f58] hover:bg-[#111620]',
                day.isToday && !isSelected && 'ring-1 ring-inset ring-emerald-500/50',
                isSelected && 'bg-[#161b22] ring-2 ring-inset ring-[#2ea043] z-10'
              )}
            >
              {/* Day Header row */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    'font-mono text-xs sm:text-sm font-semibold transition-colors',
                    day.isCurrentMonth ? 'text-[#c9d1d9] group-hover:text-white' : 'text-[#484f58]',
                    day.isToday && 'text-emerald-400 font-bold',
                    isSelected && 'text-white'
                  )}
                >
                  {day.dayNumber}
                </span>

                <div className="flex items-center gap-1">
                  {/* AI prompt indicator badge */}
                  {aiCount > 0 && day.isCurrentMonth && (
                    <span
                      title={`${aiCount} AI prompts used on this day`}
                      className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-mono bg-purple-950/80 border border-purple-800/60 text-purple-300"
                    >
                      <Bot className="h-2.5 w-2.5" />
                      <span>{aiCount}</span>
                    </span>
                  )}

                  {day.isToday && (
                    <span className="text-[9px] font-mono uppercase tracking-wider px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      today
                    </span>
                  )}
                </div>
              </div>

              {/* Focus Repo Title on Desktop */}
              {day.primaryFocusRepo && day.isCurrentMonth && (
                <div className="hidden sm:block mt-1">
                  <p className="text-[10px] font-mono text-[#8b949e] group-hover:text-white truncate">
                    {day.primaryFocusRepo.split('/')[1] || day.primaryFocusRepo}
                  </p>
                </div>
              )}

              {/* Activity indicator: The Green Dot + Count */}
              <div className="mt-auto pt-2 flex items-end justify-between w-full">
                {hasActivity ? (
                  <div className="flex items-center gap-1.5">
                    {/* The Green Dot */}
                    <span
                      className={cn(
                        'h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full shrink-0 transition-transform group-hover:scale-125',
                        getDotStyle(day.level)
                      )}
                    />
                    
                    {/* Count text */}
                    <span className="hidden md:inline-block text-[10px] font-mono text-[#8b949e] group-hover:text-emerald-300">
                      {day.totalActivities} {day.totalActivities === 1 ? 'evt' : 'evts'}
                    </span>
                  </div>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-transparent" />
                )}

                {/* Sub repo indicator on desktop */}
                {hasActivity && day.repos.length > 1 && (
                  <span className="hidden lg:inline-block text-[9px] font-mono text-emerald-400/80">
                    +{day.repos.length - 1} more
                  </span>
                )}
              </div>

              {/* Active selection corner badge */}
              {isSelected && (
                <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#39d353] shadow-[0_0_8px_#39d353]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar Footer / Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 sm:p-4 bg-[#161b22]/50 border-t border-[#21262d] text-xs font-mono text-[#8b949e] gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#39d353]" />
            <span className="text-[#c9d1d9]">GitHub Code</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span className="text-purple-300">Claude / ChatGPT / Gemini</span>
          </div>
        </div>

        {/* GitHub Green Legend */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#6e7681]">Less</span>
          <span className="h-2.5 w-2.5 rounded-sm bg-[#161b22] border border-[#30363d]" title="No activity" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#0e4429] border border-[#238636]/60" title="1-2 activities" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#006d32] border border-[#26a641]" title="3-4 activities" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#26a641] border border-[#39d353]" title="5-6 activities" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#39d353] shadow-[0_0_8px_#39d353]" title="7+ activities" />
          <span className="text-[11px] text-[#6e7681]">More</span>
        </div>
      </div>
    </div>
  );
}
