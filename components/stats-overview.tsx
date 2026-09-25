'use client';

import React from 'react';
import { Flame, GitCommit, FolderGit2, Layers } from 'lucide-react';
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
  const isConnected = profile.isConnected && Boolean(profile.username);

  // Compute monthly stats dynamically from the actual calendar days
  const activeDaysCount = isConnected
    ? monthActivities.filter((d) => d.isCurrentMonth && d.totalActivities > 0).length
    : 0;

  const monthlyCommits = isConnected
    ? monthActivities
        .filter((d) => d.isCurrentMonth)
        .reduce((sum, d) => sum + d.totalCommits, 0)
    : 0;

  // Determine top project of the month by commit density
  const repoCounts: Record<string, number> = {};
  if (isConnected) {
    for (const day of monthActivities) {
      if (day.isCurrentMonth) {
        for (const repo of day.repos) {
          repoCounts[repo] = (repoCounts[repo] || 0) + 1;
        }
      }
    }
  }

  let topProject = isConnected ? (profile.topRepo || 'No pushes yet') : 'Not Connected';
  let topCount = 0;
  for (const [r, count] of Object.entries(repoCounts)) {
    if (count > topCount) {
      topCount = count;
      topProject = r;
    }
  }

  const cleanTopRepo = topProject.includes('/') ? topProject.split('/')[1] : topProject;
  const totalRepos = isConnected ? (profile.activeReposCount || Object.keys(repoCounts).length || 0) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Primary Project Worked On */}
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3.5 sm:p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-[#8b949e]">
          <span className="text-xs font-mono">Top Project</span>
          <FolderGit2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <p className="text-base sm:text-lg font-bold font-mono text-white truncate" title={topProject}>
            {cleanTopRepo}
          </p>
          <p className="text-[11px] text-emerald-400 font-mono mt-0.5 truncate">
            {isConnected && topCount > 0
              ? `${topCount} active days in ${selectedMonthName}`
              : isConnected
              ? 'Ready for push'
              : 'Connect GitHub'}
          </p>
        </div>
      </div>

      {/* Monthly Code Output */}
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3.5 sm:p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-[#8b949e]">
          <span className="text-xs font-mono">Month Commits</span>
          <GitCommit className="h-4 w-4 text-sky-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            {monthlyCommits}
          </span>
          <span className="text-xs font-mono text-sky-400">commits</span>
        </div>
        <p className="mt-1 text-[11px] text-[#8b949e] font-mono truncate">
          {isConnected && activeDaysCount > 0
            ? `Across ${activeDaysCount} active days in ${selectedMonthName}`
            : isConnected
            ? `0 commits in ${selectedMonthName}`
            : 'Connect GitHub to sync'}
        </p>
      </div>

      {/* Total Repositories Count */}
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3.5 sm:p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-[#8b949e]">
          <span className="text-xs font-mono">GitHub Repos</span>
          <Layers className="h-4 w-4 text-purple-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            {totalRepos}
          </span>
          <span className="text-xs font-mono text-purple-400">repositories</span>
        </div>
        <p className="mt-1 text-[11px] text-[#8b949e] font-mono truncate">
          {isConnected ? 'Public & Private repos' : '0 repos connected'}
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
            {isConnected ? profile.currentStreak : 0}
          </span>
          <span className="text-xs font-mono text-amber-400">days streak</span>
        </div>
        <p className="mt-1 text-[11px] text-[#8b949e] font-mono truncate">
          {isConnected && profile.longestStreak > 0
            ? `Longest: ${profile.longestStreak} days`
            : isConnected
            ? 'Start your streak today'
            : 'Not Connected'}
        </p>
      </div>
    </div>
  );
}
