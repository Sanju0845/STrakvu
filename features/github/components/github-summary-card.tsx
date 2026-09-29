'use client';

import React from 'react';
import {
  Github,
  GitCommit,
  GitPullRequest,
  GitBranch,
  Flame,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { DeveloperProfile } from '@/types/activity';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GitHubSummaryCardProps {
  profile: DeveloperProfile;
  totalCommits: number;
  repositories: string[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenConnectModal: () => void;
}

export function GitHubSummaryCard({
  profile,
  totalCommits,
  repositories,
  isLoading,
  onRefresh,
  onOpenConnectModal,
}: GitHubSummaryCardProps) {
  const isConnected = profile.isConnected;

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] shadow-xl overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#161b22] border border-[#30363d] text-white">
            <Github className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold font-mono text-white tracking-tight">
                GitHub Pipeline
              </h3>
              {isConnected ? (
                <Badge variant="default" className="text-[10px] py-0 px-1.5 bg-[#238636]">
                  @{profile.username}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-[#8b949e]">
                  Disconnected
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-[#8b949e] font-mono mt-0.5">
              Live multi-branch commits, PR merges, and repo sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isConnected && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 text-xs font-mono border-[#30363d] text-[#c9d1d9] hover:text-white"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="default"
            onClick={onOpenConnectModal}
            className="h-8 text-xs font-mono bg-[#238636] hover:bg-[#2ea043] text-white"
          >
            {isConnected ? 'Switch Account' : 'Connect GitHub'}
          </Button>
        </div>
      </div>

      {/* Metric counters */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-[#30363d] bg-[#161b22]/50 p-2.5">
          <div className="flex items-center gap-1 text-[10px] font-mono text-[#8b949e]">
            <GitCommit className="h-3 w-3 text-sky-400" />
            <span>Total Commits</span>
          </div>
          <div className="mt-1 text-base sm:text-lg font-bold font-mono text-white">
            {isConnected ? totalCommits : 0}
          </div>
        </div>

        <div className="rounded-lg border border-[#30363d] bg-[#161b22]/50 p-2.5">
          <div className="flex items-center gap-1 text-[10px] font-mono text-[#8b949e]">
            <Layers className="h-3 w-3 text-emerald-400" />
            <span>Active Repos</span>
          </div>
          <div className="mt-1 text-base sm:text-lg font-bold font-mono text-white">
            {isConnected ? repositories.length : 0}
          </div>
        </div>

        <div className="rounded-lg border border-[#30363d] bg-[#161b22]/50 p-2.5">
          <div className="flex items-center gap-1 text-[10px] font-mono text-[#8b949e]">
            <Flame className="h-3 w-3 text-amber-400" />
            <span>Streak</span>
          </div>
          <div className="mt-1 text-base sm:text-lg font-bold font-mono text-amber-400">
            {isConnected ? `${profile.currentStreak}d` : '0d'}
          </div>
        </div>
      </div>
    </div>
  );
}
