'use client';

import React, { useState } from 'react';
import { Clock, Laptop, FolderGit2, Sparkles, Activity, Layers } from 'lucide-react';
import { HourlyCodingSlot } from '../types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface WakaTimeHourlyTimelineProps {
  hourlySlots: HourlyCodingSlot[];
  selectedDate: string;
}

export function WakaTimeHourlyTimeline({
  hourlySlots,
  selectedDate,
}: WakaTimeHourlyTimelineProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const activeSlot = hoveredHour !== null ? hourlySlots[hoveredHour] : null;
  const totalCodedMinutes = hourlySlots.reduce((acc, s) => acc + s.minutes, 0);
  const maxMinutesInAnyHour = Math.max(1, ...hourlySlots.map((s) => s.minutes));

  return (
    <div className="rounded-2xl border border-[#30363d] bg-gradient-to-b from-[#0d1117] to-[#161b22]/70 p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#161b22] border border-emerald-500/40 text-emerald-400">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold font-mono text-white flex items-center gap-1.5">
              <span>Per-Hour Coding Intensity</span>
              <span className="text-[10px] text-emerald-400 font-normal px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/60">
                24H Swimlane
              </span>
            </h4>
          </div>
        </div>

        <Badge variant="outline" className="text-[10px] font-mono border-emerald-800 text-emerald-300">
          {totalCodedMinutes} mins recorded
        </Badge>
      </div>

      {/* 24-Column Bar Graph */}
      <div className="mt-2 relative">
        <div className="grid grid-cols-24 gap-1 sm:gap-1.5 h-36 items-end pb-6 border-b border-[#21262d]">
          {hourlySlots.map((slot) => {
            const h = slot.hour;
            const isHovered = hoveredHour === h;
            const heightPercent = slot.minutes > 0 ? Math.max(12, Math.round((slot.minutes / 60) * 100)) : 4;
            const isQoder = (slot.primaryEditor || '').toLowerCase().includes('qoder');
            const isCursor = (slot.primaryEditor || '').toLowerCase().includes('cursor');

            return (
              <div
                key={h}
                onMouseEnter={() => setHoveredHour(h)}
                onMouseLeave={() => setHoveredHour(null)}
                className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
              >
                {/* Bar */}
                <div
                  className={cn(
                    'w-full rounded-t-sm transition-all duration-150',
                    slot.intensity === 0
                      ? 'bg-[#161b22] hover:bg-[#21262d]'
                      : isQoder
                      ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm shadow-emerald-950'
                      : isCursor
                      ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-sm shadow-cyan-950'
                      : 'bg-gradient-to-t from-sky-600 to-sky-400 shadow-sm shadow-sky-950',
                    isHovered && 'brightness-125 ring-1 ring-white/80 scale-105'
                  )}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Hour label tick */}
                <span
                  className={cn(
                    'absolute -bottom-5 text-[8px] sm:text-[9px] font-mono text-center select-none pointer-events-none transition-colors',
                    isHovered
                      ? 'text-white font-bold'
                      : h % 3 === 0
                      ? 'text-[#8b949e]'
                      : 'text-[#484f58] hidden sm:inline'
                  )}
                >
                  {h === 0 ? '0' : h === 12 ? '12' : `${h}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time Phase Guides below timeline */}
        <div className="flex justify-between items-center text-[9px] font-mono text-[#6e7681] pt-6 px-1">
          <span>00:00 (Night)</span>
          <span>06:00 (Morning)</span>
          <span>12:00 (Noon)</span>
          <span>18:00 (Evening)</span>
          <span>23:59</span>
        </div>
      </div>

      {/* Floating / Active Hour Info Card */}
      <div className="mt-4 rounded-xl border border-[#21262d] bg-[#161b22]/90 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
        {activeSlot ? (
          <>
            <div className="flex items-center gap-2">
              <span className="flex h-6 items-center px-2 rounded bg-[#0d1117] border border-cyan-500/40 text-cyan-300 font-bold text-[11px]">
                {activeSlot.hourLabel}
              </span>
              <span className="text-white font-semibold">
                {activeSlot.minutes > 0 ? `${activeSlot.minutes} minutes coding` : 'No coding recorded in this hour'}
              </span>
            </div>

            {activeSlot.primaryProject && (
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-[#8b949e] flex items-center gap-1">
                  <FolderGit2 className="h-3 w-3 text-cyan-400" />
                  <span className="text-cyan-300 font-semibold">{activeSlot.primaryProject}</span>
                </span>
                {activeSlot.primaryEditor && (
                  <span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 text-[10px]">
                    {activeSlot.primaryEditor}
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-[11px] text-[#8b949e]">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Hover over any hour column to view active projects and editors</span>
            </span>
            <span className="text-emerald-400 font-semibold">
              Peak hour: {maxMinutesInAnyHour}m
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
