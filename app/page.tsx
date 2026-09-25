'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { LandingHero } from '@/components/landing-hero';
import { CalendarGrid } from '@/components/calendar-grid';
import { DayTimeline } from '@/components/day-timeline';
import { StatsOverview } from '@/components/stats-overview';
import { ConnectModal } from '@/components/connect-modal';
import { MakePushModal } from '@/components/make-push-modal';
import { INITIAL_DEVELOPER, getCleanMonthActivities } from '@/lib/mock-data';
import { DayActivity, DeveloperProfile, AIChatSession, ActivityEvent } from '@/types/activity';
import { MONTH_NAMES } from '@/lib/utils';
import { Filter, Github, GitCommit, RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const emptySubscribe = () => () => {};

function getStoredProfileSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('strakvu_profile') || '';
  } catch {
    return '';
  }
}

function getStoredCustomPushesSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('strakvu_custom_pushes') || '';
  } catch {
    return '';
  }
}

function getStoredAIChatsSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('strakvu_aichats') || '';
  } catch {
    return '';
  }
}

function getEmptyServerSnapshot(): string {
  return '';
}

export default function StrakvuPage() {
  const { data: session, status: sessionStatus } = useSession();

  const [activeView, setActiveView] = useState<'dashboard' | 'landing'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'landing') return 'landing';
    }
    return 'dashboard';
  });
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const storedProfileRaw = useSyncExternalStore(
    emptySubscribe,
    getStoredProfileSnapshot,
    getEmptyServerSnapshot
  );

  const storedCustomPushesRaw = useSyncExternalStore(
    emptySubscribe,
    getStoredCustomPushesSnapshot,
    getEmptyServerSnapshot
  );

  const storedAIChatsRaw = useSyncExternalStore(
    emptySubscribe,
    getStoredAIChatsSnapshot,
    getEmptyServerSnapshot
  );

  // Profile override & state
  const [profileOverride, setProfileOverride] = useState<DeveloperProfile | null>(null);
  const [customPushesOverride, setCustomPushesOverride] = useState<Record<string, ActivityEvent[]> | null>(null);
  const [aiChatsOverride, setAiChatsOverride] = useState<Record<string, AIChatSession[]> | null>(null);

  // GitHub live API state
  const [githubEventsByDate, setGithubEventsByDate] = useState<Record<string, ActivityEvent[]>>({});
  const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
  const [githubFetchError, setGithubFetchError] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isMakePushModalOpen, setIsMakePushModalOpen] = useState(false);
  const [selectedRepoFilter, setSelectedRepoFilter] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked'>('split');
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // Base profile derived from stored or initial
  const baseProfile: DeveloperProfile = useMemo(() => {
    if (profileOverride) return profileOverride;
    if (storedProfileRaw) {
      try {
        const parsed = JSON.parse(storedProfileRaw);
        if (parsed && parsed.username) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_DEVELOPER;
  }, [profileOverride, storedProfileRaw]);

  // Derive custom user pushes
  const customPushes: Record<string, ActivityEvent[]> = useMemo(() => {
    if (customPushesOverride) return customPushesOverride;
    if (storedCustomPushesRaw) {
      try {
        return JSON.parse(storedCustomPushesRaw);
      } catch {
        // fallback
      }
    }
    return {};
  }, [customPushesOverride, storedCustomPushesRaw]);

  // Derive custom user AI chats
  const recordedAIChats: Record<string, AIChatSession[]> = useMemo(() => {
    if (aiChatsOverride) return aiChatsOverride;
    if (storedAIChatsRaw) {
      try {
        return JSON.parse(storedAIChatsRaw);
      } catch {
        // fallback
      }
    }
    return {};
  }, [aiChatsOverride, storedAIChatsRaw]);

  // Fetch 90-day real GitHub activity from our Octokit API route
  const fetchGitHubActivity = useCallback(async (targetUsername?: string, token?: string) => {
    setIsLoadingGitHub(true);
    setGithubFetchError(null);

    try {
      const params = new URLSearchParams();
      if (targetUsername) params.set('username', targetUsername);
      if (token) params.set('token', token);

      const res = await fetch(`/api/github/activity?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch GitHub activity');
      }

      if (data.eventsByDate) {
        setGithubEventsByDate(data.eventsByDate);
      }

      if (data.profile) {
        const updatedProfile: DeveloperProfile = {
          ...baseProfile,
          ...data.profile,
          isConnected: true,
        };
        setProfileOverride(updatedProfile);
        try {
          localStorage.setItem('strakvu_profile', JSON.stringify(updatedProfile));
        } catch {
          // fallback
        }
      }

      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setGithubFetchError(err?.message || 'Could not load GitHub activity.');
    } finally {
      setIsLoadingGitHub(false);
    }
  }, [baseProfile]);

  // Automatically fetch on mount or when NextAuth session changes
  useEffect(() => {
    let active = true;

    const syncActivity = async () => {
      // Defer to microtask to ensure component mount is complete
      await Promise.resolve();
      if (!active) return;

      if (sessionStatus === 'authenticated' && session?.user) {
        // @ts-expect-error accessToken on session
        const token = session.accessToken as string | undefined;
        // @ts-expect-error username on session user
        const username = (session.user.username as string) || session.user.name || undefined;
        await fetchGitHubActivity(username, token);
      } else if (sessionStatus === 'unauthenticated') {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('strakvu_github_token') || undefined : undefined;
        const stored = baseProfile.username || 'sanjayanand';
        await fetchGitHubActivity(stored, storedToken);
      }
    };

    syncActivity();

    return () => {
      active = false;
    };
  }, [sessionStatus, session, baseProfile.username, fetchGitHubActivity]);

  const handleUpdateProfile = (newProfile: DeveloperProfile) => {
    setProfileOverride(newProfile);
    try {
      localStorage.setItem('strakvu_profile', JSON.stringify(newProfile));
    } catch {
      // Fallback
    }
  };

  const handleDisconnect = () => {
    const disconnected = {
      ...baseProfile,
      isConnected: false,
    };
    handleUpdateProfile(disconnected);
    setGithubEventsByDate({});
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('strakvu_github_token');
      } catch {
        // Fallback
      }
    }
  };

  const handleConnectSuccess = (customUsername?: string, token?: string) => {
    const userToFetch = customUsername || 'sanjayanand';
    if (typeof window !== 'undefined' && token) {
      try {
        localStorage.setItem('strakvu_github_token', token);
      } catch {
        // Fallback
      }
    }
    fetchGitHubActivity(userToFetch, token);
    setActiveView('dashboard');
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDayDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDayDate(null);
  };

  const handleJumpToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDayDate(todayStr);
  };

  // Record a new push (either custom or manual)
  const handleRecordPush = (newEvent: ActivityEvent) => {
    const date = selectedDayDate || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const nextPushes = {
      ...customPushes,
      [date]: [...(customPushes[date] || []), newEvent],
    };

    setCustomPushesOverride(nextPushes);
    try {
      localStorage.setItem('strakvu_custom_pushes', JSON.stringify(nextPushes));
    } catch {
      // Fallback
    }

    setSelectedDayDate(date);
  };

  // Add custom AI chat session for a day
  const handleAddAIChat = (date: string, chat: Omit<AIChatSession, 'id' | 'timestamp' | 'time'>) => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;

    const newSession: AIChatSession = {
      ...chat,
      id: `custom-ai-${Date.now()}`,
      time: `${String(displayHour).padStart(2, '0')}:${minutes} ${ampm}`,
      timestamp: now.toISOString(),
    };

    const nextChats = {
      ...recordedAIChats,
      [date]: [...(recordedAIChats[date] || []), newSession],
    };

    setAiChatsOverride(nextChats);
    try {
      localStorage.setItem('strakvu_aichats', JSON.stringify(nextChats));
    } catch {
      // Fallback
    }
  };

  // Merge Live GitHub Events with any custom pushes & AI chats
  const rawMonthActivities = useMemo(() => {
    const baseDays = getCleanMonthActivities(currentDate.getFullYear(), currentDate.getMonth());

    return baseDays.map((day) => {
      const ghEvents = githubEventsByDate[day.date] || [];
      const userPushes = customPushes[day.date] || [];
      const allEvents = [...ghEvents, ...userPushes];

      const dayAIChats = recordedAIChats[day.date] || [];

      const totalCommits = allEvents.reduce(
        (sum, e) => sum + (e.commits ? e.commits.length : 1),
        0
      );

      const repos = Array.from(new Set(allEvents.map((e) => e.repo)));

      let level: DayActivity['level'] = 0;
      if (allEvents.length === 0) level = 0;
      else if (allEvents.length <= 2) level = 1;
      else if (allEvents.length <= 4) level = 2;
      else if (allEvents.length <= 6) level = 3;
      else level = 4;

      const primaryFocusRepo = repos[0];
      let humanSummary: string | undefined = undefined;

      if (allEvents.length > 0) {
        humanSummary = `Shipped ${totalCommits} ${totalCommits === 1 ? 'commit' : 'commits'} across ${repos.join(', ')}.`;
      }

      return {
        ...day,
        totalActivities: allEvents.length,
        totalCommits,
        level,
        events: allEvents,
        repos,
        primaryFocusRepo,
        humanSummary,
        aiSessions: dayAIChats.length > 0 ? dayAIChats : undefined,
      };
    });
  }, [currentDate, githubEventsByDate, customPushes, recordedAIChats]);

  // Collect all available repositories from real events
  const availableRepos = useMemo(() => {
    const repoSet = new Set<string>();
    Object.values(githubEventsByDate).forEach((events) => {
      events.forEach((e) => repoSet.add(e.repo));
    });
    Object.values(customPushes).forEach((events) => {
      events.forEach((e) => repoSet.add(e.repo));
    });
    return Array.from(repoSet);
  }, [githubEventsByDate, customPushes]);

  // Apply repo filter
  const filteredMonthActivities = useMemo(() => {
    if (selectedRepoFilter === 'all') return rawMonthActivities;

    return rawMonthActivities.map((day) => {
      const matchingEvents = day.events.filter((e) => e.repo === selectedRepoFilter);
      let level: DayActivity['level'] = 0;
      if (matchingEvents.length === 0) level = 0;
      else if (matchingEvents.length <= 2) level = 1;
      else if (matchingEvents.length <= 4) level = 2;
      else if (matchingEvents.length <= 6) level = 3;
      else level = 4;

      return {
        ...day,
        totalActivities: matchingEvents.length,
        totalCommits: matchingEvents.reduce(
          (sum, e) => sum + (e.commits ? e.commits.length : 1),
          0
        ),
        level,
        events: matchingEvents,
        repos: Array.from(new Set(matchingEvents.map((e) => e.repo))),
      };
    });
  }, [rawMonthActivities, selectedRepoFilter]);

  // Derive default active date
  const defaultDayDate = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayActivity = filteredMonthActivities.find((d) => d.date === todayStr);

    if (todayActivity) return todayActivity.date;

    const firstActive = filteredMonthActivities.find(
      (d) => d.isCurrentMonth && d.totalActivities > 0
    );
    if (firstActive) return firstActive.date;

    const firstOfMonth = filteredMonthActivities.find((d) => d.isCurrentMonth);
    return firstOfMonth ? firstOfMonth.date : null;
  }, [filteredMonthActivities]);

  const effectiveSelectedDate = selectedDayDate ?? defaultDayDate;

  const selectedDay = useMemo(() => {
    if (!effectiveSelectedDate) return null;
    return filteredMonthActivities.find((d) => d.date === effectiveSelectedDate) || null;
  }, [effectiveSelectedDate, filteredMonthActivities]);

  const monthName = MONTH_NAMES[currentDate.getMonth()] || 'September';

  // Overall activity count
  const totalRealEventsCount = useMemo(() => {
    return Object.values(githubEventsByDate).reduce((sum, evts) => sum + evts.length, 0);
  }, [githubEventsByDate]);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#e6edf3] flex flex-col font-sans selection:bg-[#238636] selection:text-white antialiased">
      {/* Navbar */}
      <Navbar
        profile={baseProfile}
        onConnectClick={() => setIsConnectModalOpen(true)}
        onDisconnectClick={handleDisconnect}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'landing' ? (
          <LandingHero
            isConnected={baseProfile.isConnected}
            onConnectClick={() => setIsConnectModalOpen(true)}
            onGoToDashboard={() => setActiveView('dashboard')}
          />
        ) : (
          <div className="space-y-6">
            {/* Live Sync Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#161b22]/50 border border-[#30363d] rounded-xl px-4 py-3 gap-3">
              <div className="flex items-center gap-2.5">
                {isLoadingGitHub ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#39d353] shadow-[0_0_8px_#39d353]" />
                )}
                <div>
                  <p className="text-xs font-mono font-medium text-white flex items-center gap-2">
                    <span>GitHub Events API: @{baseProfile.username}</span>
                    {lastSyncedTime && (
                      <span className="text-[10px] text-[#8b949e]">
                        (Synced {lastSyncedTime})
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-[#8b949e]">
                    {totalRealEventsCount > 0
                      ? `Pulled ${totalRealEventsCount} real events (pushes, repos, PRs) across the last 90 days.`
                      : 'Syncing live GitHub repository activity down to the minute...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchGitHubActivity(baseProfile.username)}
                  disabled={isLoadingGitHub}
                  className="h-8 text-xs font-mono border-[#30363d] text-[#c9d1d9] hover:text-white"
                >
                  <RefreshCw className={`h-3 w-3 mr-1.5 ${isLoadingGitHub ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="h-8 bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs"
                >
                  <Github className="h-3.5 w-3.5 mr-1.5" />
                  <span>Change Account</span>
                </Button>
              </div>
            </div>

            {/* Error Notification if any */}
            {githubFetchError && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-800/60 bg-amber-950/40 p-3 sm:p-4 text-xs font-mono text-amber-200">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>{githubFetchError}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs whitespace-nowrap self-start sm:self-auto h-8 px-3"
                >
                  <Github className="h-3.5 w-3.5 mr-1.5" />
                  <span>Connect Account / Token</span>
                </Button>
              </div>
            )}

            {/* Developer Monthly Stats */}
            <StatsOverview
              profile={baseProfile}
              monthActivities={filteredMonthActivities}
              selectedMonthName={monthName}
            />

            {/* Repository Filter & View Controls Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161b22]/40 p-3 rounded-xl border border-[#21262d]">
              {/* Repo Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <span className="flex items-center gap-1 text-xs font-mono text-[#8b949e] shrink-0">
                  <Filter className="h-3 w-3" />
                  <span>Repo:</span>
                </span>
                <button
                  onClick={() => setSelectedRepoFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono shrink-0 transition-colors ${
                    selectedRepoFilter === 'all'
                      ? 'bg-emerald-950/80 border border-emerald-700/70 text-emerald-300 font-medium'
                      : 'border border-transparent text-[#8b949e] hover:text-white'
                  }`}
                >
                  all repos ({availableRepos.length})
                </button>
                {availableRepos.map((repo) => (
                  <button
                    key={repo}
                    onClick={() => setSelectedRepoFilter(repo)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono shrink-0 transition-colors ${
                      selectedRepoFilter === repo
                        ? 'bg-emerald-950/80 border border-emerald-700/70 text-emerald-300 font-medium'
                        : 'border border-transparent text-[#8b949e] hover:text-white'
                    }`}
                  >
                    {repo.split('/')[1] || repo}
                  </button>
                ))}
              </div>

              {/* Action and Layout Switcher */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  size="sm"
                  onClick={() => setIsMakePushModalOpen(true)}
                  className="h-7 text-xs font-mono bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/80"
                >
                  <GitCommit className="h-3 w-3 mr-1" />
                  <span>+ Push</span>
                </Button>

                <div className="hidden lg:flex items-center gap-1 text-xs font-mono text-[#8b949e]">
                  <button
                    onClick={() => setLayoutMode('split')}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      layoutMode === 'split'
                        ? 'bg-[#21262d] text-white border border-[#30363d]'
                        : 'text-[#8b949e] hover:text-white'
                    }`}
                  >
                    Split
                  </button>
                  <button
                    onClick={() => setLayoutMode('stacked')}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      layoutMode === 'stacked'
                        ? 'bg-[#21262d] text-white border border-[#30363d]'
                        : 'text-[#8b949e] hover:text-white'
                    }`}
                  >
                    Stacked
                  </button>
                </div>
              </div>
            </div>

            {/* Main Interactive Grid and Timeline */}
            {layoutMode === 'split' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Calendar Grid (Takes 7 cols on desktop, full width on mobile) */}
                <div className="lg:col-span-7">
                  <CalendarGrid
                    currentDate={currentDate}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onJumpToday={handleJumpToday}
                    monthActivities={filteredMonthActivities}
                    selectedDay={selectedDay}
                    onSelectDay={(day) => setSelectedDayDate(day.date)}
                  />
                </div>

                {/* Day Timeline (Takes 5 cols on desktop, slides below on mobile) */}
                <div className="lg:col-span-5 sticky top-20">
                  <DayTimeline
                    day={selectedDay}
                    onClose={() => setSelectedDayDate(null)}
                    onAddAIChat={handleAddAIChat}
                    onOpenMakePush={() => setIsMakePushModalOpen(true)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <CalendarGrid
                  currentDate={currentDate}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onJumpToday={handleJumpToday}
                  monthActivities={filteredMonthActivities}
                  selectedDay={selectedDay}
                  onSelectDay={(day) => setSelectedDayDate(day.date)}
                />

                <DayTimeline
                  day={selectedDay}
                  onClose={() => setSelectedDayDate(null)}
                  onAddAIChat={handleAddAIChat}
                  onOpenMakePush={() => setIsMakePushModalOpen(true)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#21262d] bg-[#090d14] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8b949e]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Strakvu</span>
            <span>·</span>
            <span>Developer Activity Calendar</span>
            <span>·</span>
            <span className="text-[#39d353]">Live GitHub Connected</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('dashboard')}
              className="hover:text-white transition-colors"
            >
              Activity Grid
            </button>
            <button
              onClick={() => setIsMakePushModalOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Record Push
            </button>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Connect GitHub
            </button>
          </div>
        </div>
      </footer>

      {/* GitHub Connect Modal */}
      <ConnectModal
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
        onConnectSuccess={handleConnectSuccess}
      />

      {/* Make First Push to GitHub Modal */}
      <MakePushModal
        open={isMakePushModalOpen}
        onOpenChange={setIsMakePushModalOpen}
        selectedDate={effectiveSelectedDate || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
        defaultRepo={baseProfile.topRepo || 'sanjayanand/strakvu'}
        onPushSuccess={handleRecordPush}
      />
    </div>
  );
}
