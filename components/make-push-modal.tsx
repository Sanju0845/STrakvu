'use client';

import React, { useState } from 'react';
import { GitCommit, GitBranch, FolderGit2, Plus, Sparkles, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ActivityEvent, CommitDetail } from '@/types/activity';
import { generateCommitHash } from '@/lib/mock-data';

interface MakePushModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  defaultRepo?: string;
  onPushSuccess: (event: ActivityEvent) => void;
}

export function MakePushModal({
  open,
  onOpenChange,
  selectedDate,
  defaultRepo = 'sanjayanand/strakvu',
  onPushSuccess,
}: MakePushModalProps) {
  const [repo, setRepo] = useState(defaultRepo);
  const [branch, setBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('feat: initial commit - Strakvu developer activity calendar');
  const [additions, setAdditions] = useState<number>(380);
  const [deletions, setDeletions] = useState<number>(0);
  const [linkedPrompt, setLinkedPrompt] = useState('Discussed with Claude: Clean Next.js activity calendar with 0 errors');
  const [eventType, setEventType] = useState<'push' | 'repo_created' | 'commit'>('push');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim() || !repo.trim()) return;

    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const timeStr = `${String(displayHour).padStart(2, '0')}:${minutes} ${ampm}`;
    const isoTime = `${selectedDate}T${String(hours).padStart(2, '0')}:${minutes}:00Z`;

    const commitHash = generateCommitHash(`${selectedDate}-${commitMessage}-${Date.now()}`);

    const newCommit: CommitDetail = {
      id: `cmt-${Date.now()}`,
      hash: commitHash,
      message: commitMessage.trim(),
      repo: repo.trim(),
      branch: branch.trim() || 'main',
      time: timeStr,
      timestamp: isoTime,
      additions: Number(additions) || 0,
      deletions: Number(deletions) || 0,
    };

    const newEvent: ActivityEvent = {
      id: `evt-${Date.now()}`,
      type: eventType,
      title: eventType === 'push'
        ? `Pushed 1 commit to ${branch.trim() || 'main'}`
        : eventType === 'repo_created'
        ? `Created new public repository ${repo.trim()}`
        : commitMessage.trim(),
      description: eventType === 'repo_created' ? 'Developer activity calendar tracking commits, pushes, and repos in a timeline view.' : undefined,
      repo: repo.trim(),
      branch: branch.trim() || 'main',
      time: timeStr,
      timestamp: isoTime,
      commits: [newCommit],
      additions: Number(additions) || 0,
      deletions: Number(deletions) || 0,
      hash: commitHash,
      linkedPrompt: linkedPrompt.trim() || undefined,
    };

    onPushSuccess(newEvent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 mb-2">
          <GitCommit className="h-5 w-5" />
        </div>
        <DialogTitle>Make First Push to GitHub</DialogTitle>
        <DialogDescription>
          Record your first genuine commit and push for {selectedDate}. This will light up your calendar with zero fake data.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-[#8b949e] mb-1">
              Repository
            </label>
            <input
              type="text"
              required
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="sanjayanand/strakvu"
              className="w-full rounded-lg border border-[#30363d] bg-[#090d14] px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8b949e] mb-1">
              Branch
            </label>
            <input
              type="text"
              required
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full rounded-lg border border-[#30363d] bg-[#090d14] px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-[#8b949e] mb-1">
            Commit Message
          </label>
          <input
            type="text"
            required
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="feat: initial commit - Strakvu developer activity calendar"
            className="w-full rounded-lg border border-[#30363d] bg-[#090d14] px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-[#8b949e] mb-1">
              Lines Added (+)
            </label>
            <input
              type="number"
              min="0"
              value={additions}
              onChange={(e) => setAdditions(Number(e.target.value))}
              className="w-full rounded-lg border border-[#30363d] bg-[#090d14] px-3 py-2 text-xs font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8b949e] mb-1">
              Lines Deleted (-)
            </label>
            <input
              type="number"
              min="0"
              value={deletions}
              onChange={(e) => setDeletions(Number(e.target.value))}
              className="w-full rounded-lg border border-[#30363d] bg-[#090d14] px-3 py-2 text-xs font-mono text-red-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-[#8b949e] mb-1">
            Linked AI Prompt / Discussion (Optional)
          </label>
          <input
            type="text"
            value={linkedPrompt}
            onChange={(e) => setLinkedPrompt(e.target.value)}
            placeholder="e.g. Brainstormed architecture with Claude before pushing"
            className="w-full rounded-lg border border-[#30363d] bg-[#090d14] px-3 py-2 text-xs font-mono text-purple-300 placeholder:text-[#484f58] focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="border-[#30363d] text-[#8b949e]"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs"
          >
            <GitCommit className="h-3.5 w-3.5 mr-1.5" />
            <span>Record Push</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
