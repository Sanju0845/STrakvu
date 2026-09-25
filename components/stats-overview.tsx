'use client';

import React from 'react';
import { Flame, GitCommit, FolderGit2, Bot, Sparkles, Compass } from 'lucide-react';
import { DeveloperProfile, DayActivity } from '@/types/activity';

interface StatsOverviewProps {
  profile: DeveloperProfile;
  monthActivities: DayActivity[];
  selectedMonthName: string;
}

export function StatsOverview({
  profile,
  monthActivities,
  selectedMonthName,
}: StatsOverviewProps) {
  // Compute monthly stats dynamically
  const activeDaysCount = monthActivities.filter((d) => d.isCurrentMonth && d.totalActivities > 0).length;
  const totalCommits = monthActivities
    .filter((d) => d.isCurrentMonth)
    .reduce((sum, d) => sum + d.totalCommits, 0);

  const totalPrompts = monthActivities
    .filter((d) => d.isCurrentMonth)
    .reduce((sum, d) => sum + (d.aiSessions?.length || 0), 0);

  // Determine top project of the month by commit density
  const repoCounts: Record<string, number> = {};
  for (const day of monthActivities) {
    if (day.isCurrentMonth) {
      for (const repo of day.repos) {
        repoCounts[repo] = (repoCounts[repo] || 0) + 1;
      }
    }
  }

  let topProject = profile.topRepo;
  let topCount = 0;
  for (const [r, count] of Object.entries(repoCounts)) {
    if (count > topCount) {
      topCount = count;
      topProject = r;
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Primary Project Worked On */}
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3.5 sm:p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-[#8b949e]">
          <span className="text-xs font-mono">Major Project</span>
          <FolderGit2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <p className="text-base sm:text-lg font-bold font-mono text-white truncate" title={topProject}>
            {topCount > 0 ? (topProject.split('/')[1] || topProject) : 'Ready for Push'}
          </p>
          <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
            {topCount > 0 ? `Active in ${topCount} development days` : 'No pushes recorded yet'}
          </p>
        </div>
      </div>

      {/* Monthly Code Output */}
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3.5 sm:p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-[#8b949e]">
          <span className="text-xs font-mono">Code Output</span>
          <GitCommit className="h-4 w-4 text-sky-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            {totalCommits}
          </span>
          <span className="text-xs font-mono text-sky-400">commits</span>
        </div>
        <p className="mt-1 text-[11px] text-[#8b949e] font-mono">
          {activeDaysCount > 0 ? `Across ${activeDaysCount} active days in ${selectedMonthName}` : `Clean slate in ${selectedMonthName}`}
        </p>
      </div>

      {/* AI Pair Sessions (Claude/ChatGPT/Gemini/Cursor) */}
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3.5 sm:p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-[#8b949e]">
          <span className="text-xs font-mono">AI Brainstorming</span>
          <Bot className="h-4 w-4 text-purple-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            {totalPrompts}
          </span>
          <span className="text-xs font-mono text-purple-400">prompts</span>
        </div>
        <p className="mt-1 text-[11px] text-[#8b949e] font-mono truncate">
          Claude, ChatGPT & Cursor
        </p>
      </div>

      {/* Human Velocity & Streak */}
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3.5 sm:p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-[#8b949e]">
          <span className="text-xs font-mono">Current Rhythm</span>
          <Flame className="h-4 w-4 text-amber-500 fill-amber-500/20" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            {profile.currentStreak}
          </span>
          <span className="text-xs font-mono text-amber-400">days streak</span>
        </div>
        <p className="mt-1 text-[11px] text-[#8b949e] font-mono">
          {profile.longestStreak > 0 ? `Longest: ${profile.longestStreak} days` : 'Ready to start streak'}
        </p>
      </div>
    </div>
  );
}
