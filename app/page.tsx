'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
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
import { Filter, Github, GitCommit, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Client-safe external store reader for localStorage
const emptySubscribe = () => () => {};

function getStoredProfileSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('strakvu_profile') || '';
  } catch {
    return '';
  }
}

function getStoredPushesSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('strakvu_pushes') || '';
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
  const [activeView, setActiveView] = useState<'dashboard' | 'landing'>('dashboard');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const storedProfileRaw = useSyncExternalStore(
    emptySubscribe,
    getStoredProfileSnapshot,
    getEmptyServerSnapshot
  );

  const storedPushesRaw = useSyncExternalStore(
    emptySubscribe,
    getStoredPushesSnapshot,
    getEmptyServerSnapshot
  );

  const storedAIChatsRaw = useSyncExternalStore(
    emptySubscribe,
    getStoredAIChatsSnapshot,
    getEmptyServerSnapshot
  );

  // Local state overrides
  const [profileOverride, setProfileOverride] = useState<DeveloperProfile | null>(null);
  const [pushesOverride, setPushesOverride] = useState<Record<string, ActivityEvent[]> | null>(null);
  const [aiChatsOverride, setAiChatsOverride] = useState<Record<string, AIChatSession[]> | null>(null);

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isMakePushModalOpen, setIsMakePushModalOpen] = useState(false);
  const [selectedRepoFilter, setSelectedRepoFilter] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked'>('split');
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // Derive profile
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

  // Derive recorded pushes
  const recordedPushes: Record<string, ActivityEvent[]> = useMemo(() => {
    if (pushesOverride) return pushesOverride;
    if (storedPushesRaw) {
      try {
        return JSON.parse(storedPushesRaw);
      } catch {
        // fallback
      }
    }
    return {};
  }, [pushesOverride, storedPushesRaw]);

  // Derive recorded AI chats
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
  };

  const handleConnectSuccess = (customUsername?: string) => {
    const username = customUsername || 'sanjayanand';
    const connected: DeveloperProfile = {
      ...baseProfile,
      username,
      displayName: username === 'sanjayanand' ? 'Sanjay Anand' : username,
      avatarUrl:
        username === 'sanjayanand'
          ? INITIAL_DEVELOPER.avatarUrl
          : `https://github.com/${username}.png`,
      isConnected: true,
    };
    handleUpdateProfile(connected);
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

  // Record a new push (the user's first or subsequent pushes)
  const handleRecordPush = (newEvent: ActivityEvent) => {
    const date = selectedDayDate || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const nextPushes = {
      ...recordedPushes,
      [date]: [...(recordedPushes[date] || []), newEvent],
    };

    setPushesOverride(nextPushes);
    try {
      localStorage.setItem('strakvu_pushes', JSON.stringify(nextPushes));
    } catch {
      // Fallback
    }

    // Auto-select this day so user sees the result immediately
    setSelectedDayDate(date);

    // Update profile top repo
    handleUpdateProfile({
      ...baseProfile,
      topRepo: newEvent.repo,
      currentStreak: Math.max(1, baseProfile.currentStreak),
      longestStreak: Math.max(1, baseProfile.longestStreak),
    });
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

  // Reset all recorded activity to a clean slate
  const handleResetToClean = () => {
    setPushesOverride({});
    setAiChatsOverride({});
    try {
      localStorage.removeItem('strakvu_pushes');
      localStorage.removeItem('strakvu_aichats');
    } catch {
      // Fallback
    }
  };

  // Generate clean month activities populated ONLY with real recorded data
  const rawMonthActivities = useMemo(() => {
    const baseDays = getCleanMonthActivities(currentDate.getFullYear(), currentDate.getMonth());

    return baseDays.map((day) => {
      const dayPushes = recordedPushes[day.date] || [];
      const dayAIChats = recordedAIChats[day.date] || [];

      const totalCommits = dayPushes.reduce(
        (sum, e) => sum + (e.commits ? e.commits.length : 1),
        0
      );

      const repos = Array.from(new Set(dayPushes.map((e) => e.repo)));

      let level: DayActivity['level'] = 0;
      if (dayPushes.length === 0) level = 0;
      else if (dayPushes.length <= 2) level = 1;
      else if (dayPushes.length <= 4) level = 2;
      else if (dayPushes.length <= 6) level = 3;
      else level = 4;

      const primaryFocusRepo = repos[0];
      let humanSummary: string | undefined = undefined;

      if (dayPushes.length > 0) {
        humanSummary = `Shipped ${totalCommits} ${totalCommits === 1 ? 'commit' : 'commits'} to ${repos.join(', ')} with ${dayPushes.length} ${dayPushes.length === 1 ? 'push' : 'pushes'}.`;
      }

      return {
        ...day,
        totalActivities: dayPushes.length,
        totalCommits,
        level,
        events: dayPushes,
        repos,
        primaryFocusRepo,
        humanSummary,
        aiSessions: dayAIChats.length > 0 ? dayAIChats : undefined,
      };
    });
  }, [currentDate, recordedPushes, recordedAIChats]);

  // Collect list of all repositories pushed to
  const availableRepos = useMemo(() => {
    const repoSet = new Set<string>();
    Object.values(recordedPushes).forEach((events) => {
      events.forEach((e) => repoSet.add(e.repo));
    });
    return Array.from(repoSet);
  }, [recordedPushes]);

  // Apply repo filter if active
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

  // Overall activity count for banner
  const totalRecordedEvents = useMemo(() => {
    return Object.values(recordedPushes).reduce((sum, evts) => sum + evts.length, 0);
  }, [recordedPushes]);

  // Compute live profile stats
  const profileWithLiveStats: DeveloperProfile = useMemo(() => {
    const monthCommits = filteredMonthActivities
      .filter((d) => d.isCurrentMonth)
      .reduce((sum, d) => sum + d.totalCommits, 0);

    const activeDays = filteredMonthActivities.filter(
      (d) => d.isCurrentMonth && d.totalActivities > 0
    ).length;

    const totalPrompts = Object.values(recordedAIChats).reduce(
      (sum, list) => sum + list.length,
      0
    );

    return {
      ...baseProfile,
      totalCommitsMonth: monthCommits,
      activeReposCount: availableRepos.length,
      currentStreak: activeDays > 0 ? activeDays : 0,
      longestStreak: Math.max(baseProfile.longestStreak, activeDays),
      totalAiAssistedPrompts: totalPrompts,
      topRepo: availableRepos[0] || baseProfile.topRepo || 'sanjayanand/strakvu',
    };
  }, [baseProfile, filteredMonthActivities, availableRepos, recordedAIChats]);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#e6edf3] flex flex-col font-sans selection:bg-[#238636] selection:text-white antialiased">
      {/* Navbar */}
      <Navbar
        profile={profileWithLiveStats}
        onConnectClick={() => setIsConnectModalOpen(true)}
        onDisconnectClick={handleDisconnect}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'landing' ? (
          <LandingHero
            isConnected={profileWithLiveStats.isConnected}
            onConnectClick={() => setIsConnectModalOpen(true)}
            onGoToDashboard={() => setActiveView('dashboard')}
          />
        ) : (
          <div className="space-y-6">
            {/* Clean State Callout: Make your first push! */}
            {totalRecordedEvents === 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-emerald-700/60 bg-gradient-to-r from-emerald-950/60 to-[#0d1624] p-4 sm:p-5 gap-4 shadow-lg shadow-emerald-950/30">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900/70 border border-emerald-700/60 text-emerald-400">
                    <GitCommit className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold font-mono text-white flex items-center gap-2">
                      <span>Clean Slate · Zero Dummy Data</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                        Ready
                      </span>
                    </h3>
                    <p className="text-xs text-[#8b949e] font-sans mt-0.5">
                      All mock data has been removed. Record your first push to GitHub to light up your calendar with real code.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                  <Button
                    onClick={() => setIsMakePushModalOpen(true)}
                    className="bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs px-4 h-9 shadow-md shadow-emerald-950/50"
                  >
                    <GitCommit className="h-4 w-4 mr-1.5" />
                    <span>Make First Push to GitHub</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between bg-[#161b22]/50 border border-[#30363d] rounded-xl px-4 py-2.5 gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-[#39d353] shadow-[0_0_8px_#39d353]" />
                  <span>{totalRecordedEvents} real {totalRecordedEvents === 1 ? 'push' : 'pushes'} recorded</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsMakePushModalOpen(true)}
                    className="h-8 bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs"
                  >
                    <GitCommit className="h-3.5 w-3.5 mr-1.5" />
                    <span>+ Record Push</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleResetToClean}
                    className="h-8 text-xs font-mono text-[#8b949e] hover:text-red-400"
                    title="Clear all recorded data back to 0"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    <span>Reset Clean</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Developer Monthly Stats */}
            <StatsOverview
              profile={profileWithLiveStats}
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
            <span className="text-[#39d353]">Clean State</span>
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
