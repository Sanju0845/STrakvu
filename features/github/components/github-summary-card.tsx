'use client';

import React from 'react';
import {
  Github,
  GitCommit,
  GitPullRequest,
  GitBranch,
  RefreshCw,
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
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] shadow-xl overflow-hidden p-3.5 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#161b22] border border-[#30363d] text-white shrink-0">
            <Github className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold font-mono text-white tracking-tight">
                GitHub Pipeline
              </h3>
              {isConnected ? (
                <Badge variant="default" className="text-[10px] py-0 px-1.5 bg-[#238636] truncate max-w-[140px]">
                  @{profile.username}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-[#8b949e]">
                  Disconnected
                </Badge>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#8b949e] font-mono mt-0.5 truncate">
              Live multi-branch commits & PR merges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          {isConnected && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-7 sm:h-8 px-2.5 text-xs font-mono border-[#30363d] text-[#c9d1d9] hover:text-white"
            >
              <RefreshCw className={`h-3 w-3 sm:mr-1 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="default"
            onClick={onOpenConnectModal}
            className="h-7 sm:h-8 px-2.5 text-xs font-mono bg-[#238636] hover:bg-[#2ea043] text-white"
          >
            {isConnected ? 'Switch' : 'Connect'}
          </Button>
        </div>
      </div>

      {/* Metric counters */}
      <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 text-xs font-mono">
        <div className="rounded-lg border border-[#30363d] bg-[#161b22]/50 p-2 sm:p-2.5">
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-[#8b949e]">
            <GitCommit className="h-3 w-3 text-sky-400 shrink-0" />
            <span className="truncate">Commits</span>
          </div>
          <div className="mt-1 text-sm sm:text-lg font-bold font-mono text-white">
            {isConnected ? totalCommits : 0}
          </div>
        </div>

        <div className="rounded-lg border border-[#30363d] bg-[#161b22]/50 p-2 sm:p-2.5">
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-[#8b949e]">
            <Layers className="h-3 w-3 text-emerald-400 shrink-0" />
            <span className="truncate">Active Repos</span>
          </div>
          <div className="mt-1 text-sm sm:text-lg font-bold font-mono text-white">
            {isConnected ? repositories.length : 0}
          </div>
        </div>

        <div className="rounded-lg border border-[#30363d] bg-[#161b22]/50 p-2 sm:p-2.5">
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-[#8b949e]">
            <GitBranch className="h-3 w-3 text-purple-400 shrink-0" />
            <span className="truncate">Branches</span>
          </div>
          <div className="mt-1 text-sm sm:text-lg font-bold font-mono text-purple-300">
            {isConnected ? 'Multi-sync' : 'None'}
          </div>
        </div>
      </div>
    </div>
  );
}
