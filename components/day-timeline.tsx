'use client';

import React, { useState } from 'react';
import {
  GitCommit,
  GitPullRequest,
  GitBranch,
  FolderGit2,
  Clock,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Sparkles,
  Bot,
  Globe,
  Compass,
  FileCode,
  Send,
  MessageSquare,
  Wand2,
} from 'lucide-react';
import { DayActivity, ActivityEvent, AIChatSession } from '@/types/activity';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn, formatDayTitle } from '@/lib/utils';

interface DayTimelineProps {
  day: DayActivity | null;
  onClose?: () => void;
  onAddAIChat?: (date: string, chat: Omit<AIChatSession, 'id' | 'timestamp' | 'time'>) => void;
  onOpenMakePush?: () => void;
}

export function DayTimeline({ day, onClose, onAddAIChat, onOpenMakePush }: DayTimelineProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'github' | 'ai' | 'chrome'>('all');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedPushes, setExpandedPushes] = useState<Record<string, boolean>>({});

  // Paste AI chat form state
  const [isAddingChat, setIsAddingChat] = useState(false);
  const [chatSource, setChatSource] = useState<'claude' | 'chatgpt' | 'gemini' | 'cursor'>('claude');
  const [promptTopic, setPromptTopic] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [targetRepo, setTargetRepo] = useState('');

  if (!day) {
    return (
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#161b22] border border-[#30363d] text-[#8b949e] mb-3">
          <Clock className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold font-mono text-white">Select a Day</h3>
        <p className="text-xs text-[#8b949e] mt-1 max-w-sm mx-auto">
          Click any date on the calendar above to inspect the complete commit logs and developer events for that day.
        </p>
      </div>
    );
  }

  // Deterministic date title for server & client
  const formattedDayTitle = formatDayTitle(day.date);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1600);
  };

  const togglePushExpanded = (eventId: string) => {
    setExpandedPushes((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const handleSubmitAIChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptTopic.trim()) return;

    if (onAddAIChat) {
      onAddAIChat(day.date, {
        source: chatSource,
        promptTopic: promptTopic.trim(),
        aiResponseSummary: aiSummary.trim() || 'Custom brainstorm session and prompt exploration',
        codeSnippet: codeSnippet.trim() || undefined,
        targetRepo: targetRepo.trim() || (day.repos[0] || 'sanjayanand/strakvu'),
        tags: [chatSource.toUpperCase(), 'Development'],
      });
    }

    setPromptTopic('');
    setAiSummary('');
    setCodeSnippet('');
    setIsAddingChat(false);
  };

  // Calculate day additions/deletions
  const totalAdditions = day.events.reduce((sum, e) => sum + (e.additions || 0), 0);
  const totalDeletions = day.events.reduce((sum, e) => sum + (e.deletions || 0), 0);

  const aiCount = day.aiSessions?.length || 0;
  const chromeCount = day.chromeResearch?.length || 0;
  const ghCount = day.events.length;

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] shadow-xl overflow-hidden animate-in fade-in-50 duration-200">
      {/* Day View Header */}
      <div className="border-b border-[#21262d] bg-[#161b22]/70 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#39d353] shadow-[0_0_8px_#39d353]" />
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Daily Work Log
              </span>
              {day.isToday && (
                <Badge variant="default" className="text-[10px] py-0 px-1.5">
                  Today
                </Badge>
              )}
            </div>
            <h3 className="mt-1 text-lg sm:text-xl font-bold font-mono text-white tracking-tight">
              {formattedDayTitle}
            </h3>
            <p className="text-xs text-[#8b949e] font-mono mt-0.5">
              {day.totalActivities === 0
                ? 'No code activity logged'
                : `${ghCount} git ${ghCount === 1 ? 'action' : 'actions'} · ${aiCount} AI ${aiCount === 1 ? 'prompt' : 'prompts'} · ${day.repos.length} ${day.repos.length === 1 ? 'repo' : 'repos'}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {totalAdditions > 0 || totalDeletions > 0 ? (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0d1117] border border-[#30363d] text-xs font-mono">
                <span className="text-[#39d353] font-medium">+{totalAdditions}</span>
                <span className="text-[#f85149] font-medium">-{totalDeletions}</span>
              </div>
            ) : null}

            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[#8b949e] hover:bg-[#21262d] hover:text-white transition-colors"
                title="Close Day View"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Humanoid Narrative / What I worked on today */}
        {day.humanSummary ? (
          <div className="mt-4 p-3.5 rounded-lg border border-emerald-900/40 bg-emerald-950/20 text-xs text-[#e6edf3] font-sans leading-relaxed">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-medium text-[11px] mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Developer Story · What was built today</span>
            </div>
            <p className="text-[#c9d1d9]">{day.humanSummary}</p>
          </div>
        ) : null}

        {/* Connected Tooling Filter Tabs */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#21262d]/60">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap',
                activeTab === 'all'
                  ? 'bg-[#21262d] border border-[#30363d] text-white font-medium'
                  : 'text-[#8b949e] hover:text-white'
              )}
            >
              Unified Stream
            </button>
            <button
              onClick={() => setActiveTab('github')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap flex items-center gap-1.5',
                activeTab === 'github'
                  ? 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-medium'
                  : 'text-[#8b949e] hover:text-white'
              )}
            >
              <GitCommit className="h-3 w-3 text-emerald-400" />
              <span>GitHub ({ghCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap flex items-center gap-1.5',
                activeTab === 'ai'
                  ? 'bg-purple-950/80 border border-purple-700/60 text-purple-300 font-medium'
                  : 'text-[#8b949e] hover:text-white'
              )}
            >
              <Bot className="h-3 w-3 text-purple-400" />
              <span>AI Chats ({aiCount})</span>
            </button>
            {chromeCount > 0 && (
              <button
                onClick={() => setActiveTab('chrome')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap flex items-center gap-1.5',
                  activeTab === 'chrome'
                    ? 'bg-sky-950/80 border border-sky-700/60 text-sky-300 font-medium'
                    : 'text-[#8b949e] hover:text-white'
                )}
              >
                <Compass className="h-3 w-3 text-sky-400" />
                <span>Chrome ({chromeCount})</span>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {onOpenMakePush && (
              <Button
                size="sm"
                onClick={onOpenMakePush}
                className="h-7 px-2.5 text-xs font-mono bg-[#238636] hover:bg-[#2ea043] text-white"
              >
                <GitCommit className="h-3 w-3 mr-1" />
                <span>+ Push</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddingChat(!isAddingChat)}
              className="h-7 px-2.5 text-xs font-mono border-[#30363d] bg-[#0d1117] text-purple-300 hover:text-white hover:bg-purple-950/40"
            >
              <Plus className="h-3 w-3 mr-1" />
              <span>Paste AI Chat</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Paste AI Chat Quick Form Drawer */}
      {isAddingChat && (
        <form
          onSubmit={handleSubmitAIChat}
          className="border-b border-[#21262d] bg-[#0b0f17] p-4 space-y-3 animate-in fade-in-0 duration-150"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-semibold">
              <Bot className="h-3.5 w-3.5" />
              <span>Log AI Prompts for this Date ({day.date})</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingChat(false)}
              className="text-[#8b949e] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-[#8b949e] block mb-1">
                Source AI Tool
              </label>
              <select
                value={chatSource}
                onChange={(e) => setChatSource(e.target.value as any)}
                className="w-full rounded-md border border-[#30363d] bg-[#161b22] px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
              >
                <option value="claude">Claude (Anthropic)</option>
                <option value="chatgpt">ChatGPT (OpenAI)</option>
                <option value="gemini">Gemini (Google)</option>
                <option value="cursor">Cursor / Qoder / IDE</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-[#8b949e] block mb-1">
                Related Repository / Project
              </label>
              <input
                type="text"
                value={targetRepo}
                onChange={(e) => setTargetRepo(e.target.value)}
                placeholder="sanjayanand/strakvu"
                className="w-full rounded-md border border-[#30363d] bg-[#161b22] px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#8b949e] block mb-1">
              What did you ask the AI? (Prompt or Goal)
            </label>
            <input
              type="text"
              required
              value={promptTopic}
              onChange={(e) => setPromptTopic(e.target.value)}
              placeholder="e.g. Architect a calendar view connecting GitHub commits with exact timestamps"
              className="w-full rounded-md border border-[#30363d] bg-[#161b22] px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#8b949e] block mb-1">
              AI Output / Key Code Generated (Optional)
            </label>
            <textarea
              rows={2}
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder="Paste generated idea, prompt results, or architecture instructions..."
              className="w-full rounded-md border border-[#30363d] bg-[#161b22] px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingChat(false)}
              className="h-7 text-xs font-mono border-[#30363d] text-[#8b949e]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 bg-purple-700 hover:bg-purple-600 text-white font-mono text-xs"
            >
              <Send className="h-3 w-3 mr-1" />
              <span>Save AI Prompt</span>
            </Button>
          </div>
        </form>
      )}

      {/* Timeline Stream */}
      <div className="p-4 sm:p-6">
        {day.events.length === 0 && (!day.aiSessions || day.aiSessions.length === 0) ? (
          <div className="py-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#161b22] border border-[#30363d] text-[#8b949e] mb-3">
              <GitCommit className="h-5 w-5 text-emerald-400" />
            </div>
            <h4 className="text-sm font-semibold font-mono text-white">
              Clean Canvas · No Activity Yet
            </h4>
            <p className="mt-1 text-xs text-[#8b949e] max-w-sm mx-auto font-sans leading-relaxed">
              No commits or AI prompts recorded for this date. Push your code or log your first commit to illuminate this day on your calendar.
            </p>
            {onOpenMakePush && (
              <div className="mt-4">
                <Button
                  onClick={onOpenMakePush}
                  className="bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs px-4"
                >
                  <GitCommit className="h-3.5 w-3.5 mr-1.5" />
                  <span>Make First Push to GitHub</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Show AI sessions if on 'all' or 'ai' tab */}
            {(activeTab === 'all' || activeTab === 'ai') && day.aiSessions && day.aiSessions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-semibold">
                  <Bot className="h-3.5 w-3.5" />
                  <span>AI Prompting & IDE Context</span>
                </div>

                <div className="space-y-2.5">
                  {day.aiSessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-3.5 sm:p-4 hover:border-purple-700/60 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-mono gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="pr" className="text-[10px] capitalize">
                            {session.source}
                          </Badge>
                          <span className="text-[#8b949e] text-[11px] flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.time}
                          </span>
                        </div>
                        {session.targetRepo && (
                          <span className="text-xs font-mono text-purple-300">
                            → {session.targetRepo}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-white font-sans">
                        &quot;{session.promptTopic}&quot;
                      </p>

                      <p className="mt-1.5 text-xs text-[#8b949e] leading-relaxed">
                        {session.aiResponseSummary}
                      </p>

                      {session.codeSnippet && (
                        <div className="mt-2.5 bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d] overflow-x-auto">
                          <code className="text-[11px] font-mono text-emerald-300">
                            {session.codeSnippet}
                          </code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GitHub Commits & Events */}
            {(activeTab === 'all' || activeTab === 'github') && day.events.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
                  <GitCommit className="h-3.5 w-3.5" />
                  <span>GitHub Events & Commits</span>
                </div>

                <div className="relative border-l border-[#30363d] ml-3 sm:ml-4 space-y-6 sm:space-y-8">
                  {day.events.map((evt) => {
                    const isPushExpanded = expandedPushes[evt.id] ?? false;

                    return (
                      <div key={evt.id} className="relative pl-6 sm:pl-8 group">
                        {/* Timeline Node Icon */}
                        <div
                          className={cn(
                            'absolute -left-3 sm:-left-3.5 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border shadow-sm transition-transform group-hover:scale-110',
                            evt.type === 'commit' &&
                              'bg-[#0d1117] border-[#388bfd] text-[#58a6ff]',
                            evt.type === 'push' &&
                              'bg-[#0d1117] border-[#2ea043] text-[#39d353]',
                            evt.type === 'pull_request' &&
                              'bg-[#0d1117] border-[#a371f7] text-[#bc8cff]',
                            evt.type === 'repo_created' &&
                              'bg-[#0d1117] border-amber-500 text-amber-400'
                          )}
                        >
                          {evt.type === 'commit' && <GitCommit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                          {evt.type === 'push' && <GitBranch className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                          {evt.type === 'pull_request' && <GitPullRequest className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                          {evt.type === 'repo_created' && <FolderGit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                        </div>

                        {/* Event Card Content */}
                        <div className="rounded-xl border border-[#30363d] bg-[#161b22]/70 p-3.5 sm:p-4 hover:border-[#484f58] transition-colors">
                          {/* Header Row: Time & Repo info */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono mb-2">
                            <div className="flex items-center gap-2">
                              {/* Exact timestamp */}
                              <span className="flex items-center gap-1 text-[#8b949e] font-mono text-[11px]">
                                <Clock className="h-3 w-3" />
                                <span>{evt.time}</span>
                              </span>

                              <span className="text-[#484f58]">·</span>

                              {/* Repo Name */}
                              <span className="font-semibold text-white hover:text-emerald-400 transition-colors">
                                {evt.repo}
                              </span>

                              {/* Branch badge */}
                              {evt.branch && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                                  {evt.branch}
                                </Badge>
                              )}
                            </div>

                            {/* Diff badges */}
                            {(evt.additions || evt.deletions) && (
                              <div className="flex items-center gap-1 text-[11px] font-mono">
                                {evt.additions ? (
                                  <span className="text-[#39d353]">+{evt.additions}</span>
                                ) : null}
                                {evt.deletions ? (
                                  <span className="text-[#f85149]">-{evt.deletions}</span>
                                ) : null}
                              </div>
                            )}
                          </div>

                          {/* Commit or Event Title */}
                          <p className="text-xs sm:text-sm font-sans text-[#e6edf3] font-medium leading-relaxed break-words">
                            {evt.title}
                          </p>

                          {evt.description && (
                            <p className="mt-1 text-xs text-[#8b949e] leading-relaxed">
                              {evt.description}
                            </p>
                          )}

                          {/* Linked AI Prompt indicator if matched */}
                          {evt.linkedPrompt && (
                            <div className="mt-2 text-[11px] text-purple-300 font-mono bg-purple-950/30 border border-purple-900/40 rounded px-2 py-1 flex items-center gap-1.5">
                              <Wand2 className="h-3 w-3 text-purple-400 shrink-0" />
                              <span className="truncate">Prompt: {evt.linkedPrompt}</span>
                            </div>
                          )}

                          {/* Hash & Copy on Commit / Push */}
                          {evt.hash && (
                            <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-[#21262d] text-xs font-mono text-[#8b949e]">
                              <span className="text-[11px] text-[#6e7681]">commit:</span>
                              <code className="text-[#58a6ff] bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d] text-[11px]">
                                {evt.hash}
                              </code>
                              <button
                                onClick={() => handleCopy(evt.hash!)}
                                className="p-1 rounded hover:bg-[#21262d] hover:text-white transition-colors"
                                title="Copy commit hash"
                              >
                                {copiedHash === evt.hash ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          )}

                          {/* Sub-commits list for push events */}
                          {evt.commits && evt.commits.length > 1 && (
                            <div className="mt-3 pt-2 border-t border-[#21262d]">
                              <button
                                onClick={() => togglePushExpanded(evt.id)}
                                className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                <span>
                                  {isPushExpanded ? 'Hide' : 'View'} {evt.commits.length} commits in this push
                                </span>
                                {isPushExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </button>

                              {isPushExpanded && (
                                <div className="mt-2.5 space-y-2 pl-2 border-l border-[#30363d]">
                                  {evt.commits.map((sub) => (
                                    <div
                                      key={sub.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-1 py-1"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <code className="text-[#58a6ff] text-[11px] shrink-0">
                                          {sub.hash}
                                        </code>
                                        <span className="text-[#c9d1d9] truncate font-sans">
                                          {sub.message}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-[#8b949e] shrink-0 self-end sm:self-auto">
                                        <span className="text-[#39d353]">+{sub.additions}</span>
                                        <span className="text-[#f85149]">-{sub.deletions}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chrome Research Links */}
            {(activeTab === 'all' || activeTab === 'chrome') && day.chromeResearch && day.chromeResearch.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-[#21262d]">
                <div className="flex items-center gap-2 text-xs font-mono text-sky-400 font-semibold">
                  <Compass className="h-3.5 w-3.5" />
                  <span>Chrome Research & Documentation Visited</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {day.chromeResearch.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[#30363d] bg-[#161b22]/50 hover:bg-[#161b22] hover:border-sky-500/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                        <span className="text-xs font-mono text-[#c9d1d9] group-hover:text-white truncate">
                          {item.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-[#8b949e]">
                          {item.time}
                        </span>
                        <ExternalLink className="h-3 w-3 text-[#8b949e] group-hover:text-white" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
