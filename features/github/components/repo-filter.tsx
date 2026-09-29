'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Check, GitBranch, Search, X, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface RepoFilterProps {
  availableRepos: string[];
  selectedRepo: string;
  onSelectRepo: (repo: string) => void;
  totalEventsCount?: number;
}

export function RepoFilter({
  availableRepos,
  selectedRepo,
  onSelectRepo,
  totalEventsCount,
}: RepoFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredList = availableRepos.filter((repo) =>
    repo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCleanName =
    selectedRepo === 'all'
      ? 'All Repositories'
      : selectedRepo.split('/')[1] || selectedRepo;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161b22]/70 p-3 sm:p-3.5 rounded-xl border border-[#21262d]">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#8b949e]">
          <Filter className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-semibold text-white">Filter Repository:</span>
        </div>

        {/* Dropdown Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors',
              selectedRepo === 'all'
                ? 'bg-[#0d1117] border-[#30363d] text-[#c9d1d9] hover:border-[#484f58] hover:text-white'
                : 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300 font-semibold'
            )}
          >
            <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
            <span className="truncate max-w-[200px]">{selectedCleanName}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 text-[#8b949e] transition-transform', isOpen && 'rotate-180')} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-[#30363d] bg-[#161b22] p-2 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 space-y-1.5">
              {/* Search input if more than 4 repos */}
              {availableRepos.length > 4 && (
                <div className="relative px-1 pt-1 pb-1">
                  <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-[#8b949e]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search repositories..."
                    className="w-full rounded-md border border-[#30363d] bg-[#0d1117] pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-[#6e7681] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-0.5">
                {/* All repos option */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectRepo('all');
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={cn(
                    'w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-mono text-left transition-colors',
                    selectedRepo === 'all'
                      ? 'bg-emerald-950/60 text-emerald-300 font-semibold'
                      : 'text-[#c9d1d9] hover:bg-[#21262d] hover:text-white'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-emerald-400" />
                    <span>All Repositories ({availableRepos.length})</span>
                  </span>
                  {selectedRepo === 'all' && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </button>

                {/* Filtered repo list */}
                {filteredList.map((repo) => {
                  const cleanName = repo.split('/')[1] || repo;
                  const isSelected = selectedRepo === repo;

                  return (
                    <button
                      key={repo}
                      type="button"
                      onClick={() => {
                        onSelectRepo(repo);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={cn(
                        'w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-mono text-left transition-colors',
                        isSelected
                          ? 'bg-emerald-950/60 text-emerald-300 font-semibold'
                          : 'text-[#c9d1d9] hover:bg-[#21262d] hover:text-white'
                      )}
                    >
                      <span className="truncate pr-2">{cleanName}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}

                {filteredList.length === 0 && (
                  <p className="text-[11px] text-[#8b949e] font-mono py-2 text-center">
                    No repositories found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Clear Filter if active */}
        {selectedRepo !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectRepo('all')}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-mono text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X className="h-3 w-3 text-[#8b949e]" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Side Status Indicator */}
      <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]" />
        <span>Click any calendar date to inspect full history</span>
      </div>
    </div>
  );
}
