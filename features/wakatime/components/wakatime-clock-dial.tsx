'use client';

import React, { useState } from 'react';
import { Clock, Flame, Laptop, Sparkles, FolderGit2, Info } from 'lucide-react';
import { HourlyCodingSlot } from '../types';
import { cn } from '@/lib/utils';

interface WakaTimeClockDialProps {
  hourlySlots: HourlyCodingSlot[];
  totalDayText: string;
  selectedDate: string;
  topEditor?: string;
}

export function WakaTimeClockDial({
  hourlySlots,
  totalDayText,
  selectedDate,
  topEditor,
}: WakaTimeClockDialProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Default to slot 15 (3 PM) or peak hour if nothing is hovered
  const peakSlot = [...hourlySlots].sort((a, b) => b.totalSeconds - a.totalSeconds)[0];
  const activeHoverSlot = hoveredHour !== null ? hourlySlots[hoveredHour] : null;

  // Geometry constants for 24-hour circular dial
  const size = 320;
  const center = size / 2;
  const innerRadius = 78;
  const baseOuterRadius = 135;

  // Calculate 24 hour radial sectors
  const anglePerSector = 360 / 24; // 15 degrees per hour

  return (
    <div className="rounded-2xl border border-[#30363d] bg-gradient-to-b from-[#0d1117] to-[#161b22]/70 p-5 shadow-2xl relative overflow-hidden flex flex-col items-center">
      {/* Background ambient neon glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#161b22] border border-cyan-500/40 text-cyan-400">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold font-mono text-white flex items-center gap-1.5">
              <span>24-Hour Circular Dial</span>
              <span className="text-[10px] text-cyan-400 font-normal px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/60">
                24H Radar
              </span>
            </h4>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#8b949e]">
          Hover hours to inspect
        </span>
      </div>

      {/* SVG 24-Hour Clock Dial */}
      <div className="relative my-2 select-none flex items-center justify-center w-[320px] h-[320px] shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          <defs>
            {/* Gradient for Qoder/Emerald coding sectors */}
            <linearGradient id="qoderDialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            {/* Gradient for Cursor/Cyan sectors */}
            <linearGradient id="cyanDialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            {/* Gradient for Sky / VS Code */}
            <linearGradient id="skyDialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <filter id="dialGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Outer Ring & Quadrant guides */}
          <circle
            cx={center}
            cy={center}
            r={baseOuterRadius + 6}
            fill="none"
            stroke="#21262d"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="#090d14"
            stroke="#30363d"
            strokeWidth="1.5"
          />

          {/* 24 Sector Segments */}
          {hourlySlots.map((slot) => {
            const h = slot.hour;
            // Angle 0 at top: hour 0 starts at -90 deg
            const startAngle = (h * anglePerSector - 90);
            const endAngle = startAngle + anglePerSector - 1.5; // slight gap between sectors

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            // Vary outer radius by intensity / minutes
            const activeBonus = slot.intensity > 0 ? 4 + slot.intensity * 4 : 0;
            const isHovered = hoveredHour === h;
            const currentOuter = baseOuterRadius + activeBonus + (isHovered ? 6 : 0);

            // Arc coordinates
            const x1 = center + innerRadius * Math.cos(startRad);
            const y1 = center + innerRadius * Math.sin(startRad);
            const x2 = center + currentOuter * Math.cos(startRad);
            const y2 = center + currentOuter * Math.sin(startRad);
            const x3 = center + currentOuter * Math.cos(endRad);
            const y3 = center + currentOuter * Math.sin(endRad);
            const x4 = center + innerRadius * Math.cos(endRad);
            const y4 = center + innerRadius * Math.sin(endRad);

            const pathData = [
              `M ${x1} ${y1}`,
              `L ${x2} ${y2}`,
              `A ${currentOuter} ${currentOuter} 0 0 1 ${x3} ${y3}`,
              `L ${x4} ${y4}`,
              `A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1}`,
              'Z',
            ].join(' ');

            const isQoder = (slot.primaryEditor || '').toLowerCase().includes('qoder');
            const isCursor = (slot.primaryEditor || '').toLowerCase().includes('cursor');

            let fillColor = '#161b22';
            let strokeColor = '#21262d';

            if (slot.intensity > 0) {
              if (isQoder) {
                fillColor = slot.intensity === 4 ? '#10b981' : slot.intensity === 3 ? '#059669' : slot.intensity === 2 ? '#047857' : '#064e3b';
                strokeColor = '#34d399';
              } else if (isCursor) {
                fillColor = slot.intensity === 4 ? '#06b6d4' : slot.intensity === 3 ? '#0891b2' : slot.intensity === 2 ? '#0e7490' : '#155e75';
                strokeColor = '#22d3ee';
              } else {
                fillColor = slot.intensity === 4 ? '#38bdf8' : slot.intensity === 3 ? '#0284c7' : slot.intensity === 2 ? '#0369a1' : '#075985';
                strokeColor = '#60a5fa';
              }
            }

            if (isHovered) {
              strokeColor = '#ffffff';
            }

            // Hour label placement at outer rim for key intervals (0h, 6h, 12h, 18h)
            const showMajorLabel = h % 3 === 0;
            const labelAngleRad = ((startAngle + anglePerSector / 2) * Math.PI) / 180;
            const labelRadius = baseOuterRadius + 18;
            const labelX = center + labelRadius * Math.cos(labelAngleRad);
            const labelY = center + labelRadius * Math.sin(labelAngleRad);

            return (
              <g key={h} className="cursor-pointer transition-all">
                <path
                  d={pathData}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isHovered ? 2 : 1}
                  filter={slot.intensity >= 3 ? 'url(#dialGlow)' : undefined}
                  onMouseEnter={() => setHoveredHour(h)}
                  onMouseLeave={() => setHoveredHour(null)}
                  className="transition-colors duration-150"
                />

                {showMajorLabel && (
                  <text
                    x={labelX}
                    y={labelY + 3}
                    textAnchor="middle"
                    className="text-[9px] font-mono fill-[#8b949e] font-semibold select-none pointer-events-none"
                  >
                    {h === 0 ? '12A' : h === 6 ? '6A' : h === 12 ? '12P' : h === 18 ? '6P' : `${h}h`}
                  </text>
                )}
              </g>
            );
          })}

          {/* Center Display Overlay */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius - 4}
            fill="#0b0f17"
            stroke="#21262d"
            strokeWidth="1.5"
            className="shadow-inner"
          />
        </svg>

        {/* Center Text Readout Inside Dial */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
          style={{
            top: center - innerRadius + 6,
            left: center - innerRadius + 6,
            width: (innerRadius - 6) * 2,
            height: (innerRadius - 6) * 2,
          }}
        >
          {activeHoverSlot ? (
            <div className="space-y-0.5 animate-in fade-in-50 duration-150">
              <span className="text-[10px] font-mono font-semibold text-cyan-400 block uppercase tracking-wider">
                {activeHoverSlot.hourLabel}
              </span>
              <div className="text-base sm:text-lg font-extrabold font-mono text-white leading-tight">
                {activeHoverSlot.minutes > 0 ? `${activeHoverSlot.minutes} mins` : 'Idle Hour'}
              </div>
              <div className="text-[10px] font-mono text-emerald-400 truncate max-w-[120px] mx-auto">
                {activeHoverSlot.primaryProject || (activeHoverSlot.minutes > 0 ? 'Coding' : 'No activity')}
              </div>
              {activeHoverSlot.primaryEditor && (
                <span className="text-[9px] font-mono text-[#8b949e] block">
                  via {activeHoverSlot.primaryEditor}
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-0.5 animate-in fade-in duration-200">
              <span className="text-[10px] font-mono text-[#8b949e] block">
                Daily Coding
              </span>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-cyan-300 leading-tight">
                {totalDayText || '0m'}
              </div>
              <span className="text-[10px] font-mono text-emerald-400 block font-semibold truncate max-w-[120px]">
                {topEditor || 'Qoder AI'}
              </span>
              {peakSlot && peakSlot.minutes > 0 && (
                <span className="text-[9px] font-mono text-[#6e7681] block">
                  Peak: {peakSlot.hourLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4 Quadrant Timeline Summary */}
      <div className="grid grid-cols-4 gap-1.5 w-full mt-2 pt-3 border-t border-[#21262d] text-center font-mono">
        <div className="bg-[#161b22]/70 rounded-lg p-1.5 border border-[#21262d]">
          <span className="text-[9px] text-[#8b949e] block">Night (0-6)</span>
          <span className="text-[11px] font-bold text-white">
            {hourlySlots.slice(0, 6).reduce((acc, s) => acc + s.minutes, 0)}m
          </span>
        </div>
        <div className="bg-[#161b22]/70 rounded-lg p-1.5 border border-[#21262d]">
          <span className="text-[9px] text-[#8b949e] block">Morn (6-12)</span>
          <span className="text-[11px] font-bold text-cyan-300">
            {hourlySlots.slice(6, 12).reduce((acc, s) => acc + s.minutes, 0)}m
          </span>
        </div>
        <div className="bg-[#161b22]/70 rounded-lg p-1.5 border border-[#21262d]">
          <span className="text-[9px] text-[#8b949e] block">After (12-18)</span>
          <span className="text-[11px] font-bold text-emerald-400">
            {hourlySlots.slice(12, 18).reduce((acc, s) => acc + s.minutes, 0)}m
          </span>
        </div>
        <div className="bg-[#161b22]/70 rounded-lg p-1.5 border border-[#21262d]">
          <span className="text-[9px] text-[#8b949e] block">Eve (18-24)</span>
          <span className="text-[11px] font-bold text-purple-300">
            {hourlySlots.slice(18, 24).reduce((acc, s) => acc + s.minutes, 0)}m
          </span>
        </div>
      </div>
    </div>
  );
}
