'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { LandingHero } from '@/components/landing-hero';
import { CalendarGrid } from '@/components/calendar-grid';
import { DayTimeline } from '@/components/day-timeline';
import { StatsOverview } from '@/components/stats-overview';
import { ConnectModal } from '@/components/connect-modal';
import { INITIAL_DEVELOPER, getCleanMonthActivities } from '@/lib/mock-data';
import { DayActivity, DeveloperProfile, AIChatSession, ActivityEvent } from '@/types/activity';
import { MONTH_NAMES } from '@/lib/utils';
import { Filter, Github, GitCommit, RefreshCw, Loader2, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
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
  const sessionHook = useSession();
  const session = sessionHook?.data;
  const sessionStatus = sessionHook?.status || 'unauthenticated';

  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'landing'>('dashboard');
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
  const [storiesByDate, setStoriesByDate] = useState<Record<string, string>>({});
  const [fetchedRepos, setFetchedRepos] = useState<string[]>([]);
  const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
  const [githubFetchError, setGithubFetchError] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedRepoFilter, setSelectedRepoFilter] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked'>('split');
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // Mark component mounted on client
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'landing') setActiveView('landing');
    }
  }, []);

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

  // Fetch real GitHub activity (with caching and error resilience)
  const isFetchingRef = useRef(false);

  const fetchGitHubActivity = useCallback(async (targetUsername?: string, token?: string, forceRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoadingGitHub(true);
    setGithubFetchError(null);

    try {
      const params = new URLSearchParams();
      if (targetUsername) params.set('username', targetUsername);
      if (token) params.set('token', token);
      if (forceRefresh) params.set('refresh', 'true');

      const res = await fetch(`/api/github/activity?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch GitHub activity');
      }

      if (data.eventsByDate) {
        setGithubEventsByDate(data.eventsByDate);
      }

      if (data.storiesByDate) {
        setStoriesByDate(data.storiesByDate);
      }

      if (Array.isArray(data.repositories)) {
        setFetchedRepos(data.repositories);
      }

      if (data.profile) {
        setProfileOverride((prev) => {
          const updated: DeveloperProfile = {
            ...(prev || INITIAL_DEVELOPER),
            ...data.profile,
            isConnected: true,
          };
          try {
            localStorage.setItem('strakvu_profile', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }

      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setGithubFetchError(err?.message || 'Could not load GitHub activity.');
    } finally {
      setIsLoadingGitHub(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Fetch once on mount or when session state transitions
  const hasInitialFetched = useRef(false);
  useEffect(() => {
    if (!mounted) return;

    if (sessionStatus === 'authenticated' && session?.user) {
      // @ts-expect-error accessToken on session
      const token = session.accessToken as string | undefined;
      // @ts-expect-error username on session user
      const username = (session.user.username as string) || session.user.name || undefined;
      fetchGitHubActivity(username, token);
    } else if (sessionStatus === 'unauthenticated' && !hasInitialFetched.current) {
      hasInitialFetched.current = true;
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('strakvu_github_token') || undefined : undefined;
      const targetUser = baseProfile.username;
      if (targetUser || storedToken) {
        fetchGitHubActivity(targetUser, storedToken);
      }
    }
  }, [mounted, sessionStatus, session, fetchGitHubActivity, baseProfile.username]);

  const handleUpdateProfile = (newProfile: DeveloperProfile) => {
    setProfileOverride(newProfile);
    try {
      localStorage.setItem('strakvu_profile', JSON.stringify(newProfile));
    } catch {}
  };

  const handleDisconnect = () => {
    setProfileOverride(INITIAL_DEVELOPER);
    setGithubEventsByDate({});
    setStoriesByDate({});
    setFetchedRepos([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('strakvu_github_token');
        localStorage.removeItem('strakvu_profile');
        localStorage.removeItem('strakvu_custom_pushes');
        localStorage.removeItem('strakvu_aichats');
      } catch {}
    }
  };

  const handleConnectSuccess = (customUsername?: string, token?: string) => {
    const userToFetch = customUsername;
    if (typeof window !== 'undefined' && token) {
      try {
        localStorage.setItem('strakvu_github_token', token);
      } catch {}
    }
    if (userToFetch || token) {
      fetchGitHubActivity(userToFetch, token, true);
    }
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

  const handleSelectMonthYear = (year: number, month: number) => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDayDate(null);
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
    } catch {}
  };

  // Merge Live GitHub Events with any custom AI chats
  const rawMonthActivities = useMemo(() => {
    const baseDays = getCleanMonthActivities(currentDate.getFullYear(), currentDate.getMonth());

    return baseDays.map((day) => {
      const ghEvents = githubEventsByDate[day.date] || [];
      const userPushes = customPushes[day.date] || [];
      const allEvents = [...ghEvents, ...userPushes];

      const dayAIChats = recordedAIChats[day.date] || [];

      const totalCommits = allEvents.reduce((sum, e) => {
        return sum + (e.commits && e.commits.length > 0 ? e.commits.length : e.type === 'commit' || e.type === 'push' ? 1 : 0);
      }, 0);

      const repos = Array.from(new Set(allEvents.map((e) => e.repo)));

      let level: DayActivity['level'] = 0;
      if (allEvents.length === 0) level = 0;
      else if (allEvents.length <= 2) level = 1;
      else if (allEvents.length <= 4) level = 2;
      else if (allEvents.length <= 6) level = 3;
      else level = 4;

      const primaryFocusRepo = repos[0];
      const humanSummary = storiesByDate[day.date] || (allEvents.length > 0 ? `Shipped ${totalCommits} ${totalCommits === 1 ? 'commit' : 'commits'} across ${repos.join(', ')}.` : undefined);

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
  }, [currentDate, githubEventsByDate, customPushes, recordedAIChats, storiesByDate]);

  // Collect all available repositories
  const availableRepos = useMemo(() => {
    const repoSet = new Set<string>(fetchedRepos);
    Object.values(githubEventsByDate).forEach((events) => {
      events.forEach((e) => repoSet.add(e.repo));
    });
    return Array.from(repoSet);
  }, [fetchedRepos, githubEventsByDate]);

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-[#e6edf3] flex flex-col font-sans">
        <header className="sticky top-0 z-40 w-full border-b border-[#21262d] bg-[#0b0f17]/90 backdrop-blur-md h-16 flex items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#161b22] border border-[#30363d] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/strakvu.png" alt="Strakvu" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-lg font-bold font-mono text-white">Strakvu</span>
          </div>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="flex items-center gap-3 text-xs font-mono text-[#8b949e]">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            <span>Loading Strakvu Calendar...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#e6edf3] flex flex-col font-sans selection:bg-[#238636] selection:text-white antialiased" suppressHydrationWarning>
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
                ) : baseProfile.isConnected && baseProfile.username ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#39d353] shadow-[0_0_8px_#39d353]" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8b949e]" />
                )}
                <div>
                  <p className="text-xs font-mono font-medium text-white flex items-center gap-2">
                    <span>
                      {baseProfile.isConnected && baseProfile.username
                        ? `GitHub Activity: @${baseProfile.username}`
                        : 'GitHub: Not Connected'}
                    </span>
                    {lastSyncedTime && baseProfile.isConnected && (
                      <span className="text-[10px] text-[#8b949e]">
                        (Synced {lastSyncedTime})
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-[#8b949e]">
                    {baseProfile.isConnected && baseProfile.username
                      ? totalRealEventsCount > 0
                        ? `Loaded ${totalRealEventsCount} real commits and operations across ${availableRepos.length} repositories.`
                        : 'Connected to GitHub. Syncing events...'
                      : 'Connect your GitHub account or enter a public username to populate your activity calendar.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {baseProfile.isConnected && baseProfile.username && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchGitHubActivity(baseProfile.username, undefined, true)}
                    disabled={isLoadingGitHub}
                    className="h-8 text-xs font-mono border-[#30363d] text-[#c9d1d9] hover:text-white"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1.5 ${isLoadingGitHub ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="h-8 bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs"
                >
                  <Github className="h-3.5 w-3.5 mr-1.5" />
                  <span>{baseProfile.isConnected && baseProfile.username ? 'Change Account' : 'Connect GitHub'}</span>
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
                  <span>Connect GitHub OAuth</span>
                </Button>
              </div>
            )}

            {/* Developer Monthly Stats */}
            <StatsOverview
              profile={baseProfile}
              monthActivities={filteredMonthActivities}
              selectedMonthName={monthName}
            />

            {/* Repository Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161b22]/40 p-3 rounded-xl border border-[#21262d]">
              {/* Repo Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <span className="flex items-center gap-1 text-xs font-mono text-[#8b949e] shrink-0">
                  <Filter className="h-3 w-3" />
                  <span>Filter Repo:</span>
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
                    className={`px-2.5 py-1 rounded-md text-xs font-mono shrink-0 transition-colors truncate max-w-[200px] ${
                      selectedRepoFilter === repo
                        ? 'bg-emerald-950/80 border border-emerald-700/70 text-emerald-300 font-medium'
                        : 'border border-transparent text-[#8b949e] hover:text-white'
                    }`}
                  >
                    {repo.split('/')[1] || repo}
                  </button>
                ))}
              </div>

              {/* Layout Switcher */}
              <div className="hidden lg:flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d] self-end sm:self-auto">
                <button
                  onClick={() => setLayoutMode('split')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    layoutMode === 'split' ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  Split View
                </button>
                <button
                  onClick={() => setLayoutMode('stacked')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    layoutMode === 'stacked' ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  Stacked
                </button>
              </div>
            </div>

            {/* Activity Grid + Day Timeline Section */}
            {layoutMode === 'split' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 xl:col-span-7">
                  <CalendarGrid
                    currentDate={currentDate}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onJumpToday={handleJumpToday}
                    onSelectMonthYear={handleSelectMonthYear}
                    monthActivities={filteredMonthActivities}
                    selectedDay={selectedDay}
                    onSelectDay={(day) => setSelectedDayDate(day.date)}
                  />
                </div>

                <div className="lg:col-span-5 xl:col-span-5">
                  <DayTimeline
                    day={selectedDay}
                    onClose={() => setSelectedDayDate(null)}
                    onAddAIChat={handleAddAIChat}
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
                  onSelectMonthYear={handleSelectMonthYear}
                  monthActivities={filteredMonthActivities}
                  selectedDay={selectedDay}
                  onSelectDay={(day) => setSelectedDayDate(day.date)}
                />

                <DayTimeline
                  day={selectedDay}
                  onClose={() => setSelectedDayDate(null)}
                  onAddAIChat={handleAddAIChat}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Connect Account Modal */}
      <ConnectModal
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
        onConnectSuccess={handleConnectSuccess}
      />
    </div>
  );
}
