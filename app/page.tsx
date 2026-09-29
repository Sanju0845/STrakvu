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
import { MONTH_NAMES, getLocalDateKey, formatDate } from '@/lib/utils';
import { Filter, Github, GitCommit, RefreshCw, Loader2, CheckCircle2, AlertCircle, Layers, Clock, Laptop, Sparkles, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Features (Modular organization)
import { GitHubSummaryCard } from '@/features/github/components/github-summary-card';
import { RepoFilter } from '@/features/github/components/repo-filter';
import { WakaTimePanel } from '@/features/wakatime/components/wakatime-panel';
import { WakaTimeView } from '@/features/wakatime/components/wakatime-view';
import { WakaTimeConnectModal } from '@/features/wakatime/components/wakatime-connect-modal';
import { WakaTimeService, CustomEditorSession } from '@/features/wakatime/wakatime-service';
import { WakaTimeDaySummary } from '@/features/wakatime/types';

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

function getStoredEditorSessionsSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('strakvu_waka_sessions') || '';
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

  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [activeView, setActiveView] = useState<'dashboard' | 'wakatime' | 'landing'>('dashboard');
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

  const storedEditorSessionsRaw = useSyncExternalStore(
    emptySubscribe,
    getStoredEditorSessionsSnapshot,
    getEmptyServerSnapshot
  );

  // Profile override & state
  const [profileOverride, setProfileOverride] = useState<DeveloperProfile | null>(null);
  const [customPushesOverride, setCustomPushesOverride] = useState<Record<string, ActivityEvent[]> | null>(null);
  const [aiChatsOverride, setAiChatsOverride] = useState<Record<string, AIChatSession[]> | null>(null);
  const [editorSessionsOverride, setEditorSessionsOverride] = useState<Record<string, CustomEditorSession[]> | null>(null);

  // GitHub live API state
  const [githubEventsByDate, setGithubEventsByDate] = useState<Record<string, ActivityEvent[]>>({});
  const [storiesByDate, setStoriesByDate] = useState<Record<string, string>>({});
  const [fetchedRepos, setFetchedRepos] = useState<string[]>([]);
  const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
  const [githubFetchError, setGithubFetchError] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // WakaTime state
  const [wakaKey, setWakaKey] = useState<string>('');
  const [wakaSummary, setWakaSummary] = useState<WakaTimeDaySummary | null>(null);
  const [isWakaModalOpen, setIsWakaModalOpen] = useState(false);

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedRepoFilter, setSelectedRepoFilter] = useState<string>('all');
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [activeSidePanel, setActiveSidePanel] = useState<'timeline' | 'wakatime'>('timeline');

  // Parse URL view and stored key on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'landing') setActiveView('landing');
      else if (viewParam === 'wakatime') setActiveView('wakatime');

      const storedWaka = WakaTimeService.getStoredApiKey();
      if (storedWaka) setWakaKey(storedWaka);
    }
  }, []);

  // Base profile derived from stored or initial
  const baseProfile: DeveloperProfile = useMemo(() => {
    if (profileOverride) return profileOverride;
    if (storedProfileRaw) {
      try {
        const parsed = JSON.parse(storedProfileRaw);
        if (parsed && parsed.username) return parsed;
      } catch {}
    }
    return INITIAL_DEVELOPER;
  }, [profileOverride, storedProfileRaw]);

  // Derive custom user pushes
  const customPushes: Record<string, ActivityEvent[]> = useMemo(() => {
    if (customPushesOverride) return customPushesOverride;
    if (storedCustomPushesRaw) {
      try {
        return JSON.parse(storedCustomPushesRaw);
      } catch {}
    }
    return {};
  }, [customPushesOverride, storedCustomPushesRaw]);

  // Derive custom user AI chats
  const recordedAIChats: Record<string, AIChatSession[]> = useMemo(() => {
    if (aiChatsOverride) return aiChatsOverride;
    if (storedAIChatsRaw) {
      try {
        return JSON.parse(storedAIChatsRaw);
      } catch {}
    }
    return {};
  }, [aiChatsOverride, storedAIChatsRaw]);

  // Derive custom editor sessions (Qoder, Cursor, VS Code, etc.)
  const recordedEditorSessions: Record<string, CustomEditorSession[]> = useMemo(() => {
    if (editorSessionsOverride) return editorSessionsOverride;
    if (storedEditorSessionsRaw) {
      try {
        return JSON.parse(storedEditorSessionsRaw);
      } catch {}
    }
    return {};
  }, [editorSessionsOverride, storedEditorSessionsRaw]);

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

  // Fetch WakaTime summary for active date
  const activeQueryDate = useMemo(() => {
    if (selectedDayDate) return selectedDayDate;
    const today = new Date();
    return formatDate(today);
  }, [selectedDayDate]);

  const loadWakaTime = useCallback(async (dateStr: string, key?: string) => {
    const sum = await WakaTimeService.fetchDaySummary(dateStr, key);
    if (sum) {
      setWakaSummary(sum);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      loadWakaTime(activeQueryDate, wakaKey);
    }
  }, [isClient, activeQueryDate, wakaKey, loadWakaTime]);

  const handleSaveWakaKey = (newKey: string) => {
    setWakaKey(newKey);
    WakaTimeService.setStoredApiKey(newKey);
    loadWakaTime(activeQueryDate, newKey);
  };

  // Add custom IDE session (e.g. Qoder, Cursor, VS Code, etc.)
  const handleAddEditorSession = (session: CustomEditorSession) => {
    WakaTimeService.addCustomSession(session);
    const updated = {
      ...recordedEditorSessions,
      [session.date]: [session, ...(recordedEditorSessions[session.date] || [])],
    };
    setEditorSessionsOverride(updated);
    loadWakaTime(session.date, wakaKey);
  };

  // Fetch once on mount or when session state transitions - automatic recovery for Vercel
  const hasInitialFetched = useRef(false);
  useEffect(() => {
    if (!isClient) return;

    if (sessionStatus === 'authenticated' && session?.user) {
      // @ts-expect-error accessToken on session
      const token = session.accessToken as string | undefined;
      // @ts-expect-error username on session user
      const username = (session.user.username as string) || session.user.name || undefined;
      if (token) {
        try {
          localStorage.setItem('strakvu_github_token', token);
        } catch {}
      }
      fetchGitHubActivity(username, token);
    } else if (!hasInitialFetched.current) {
      hasInitialFetched.current = true;
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('strakvu_github_token') || undefined : undefined;
      const targetUser = baseProfile.username;
      if (targetUser || storedToken) {
        fetchGitHubActivity(targetUser, storedToken);
      }
    }
  }, [isClient, sessionStatus, session, baseProfile.username, fetchGitHubActivity]);

  // Calendar navigation
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDayDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1 + 2, 1));
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
    const newSession: AIChatSession = {
      ...chat,
      id: `ai-${Date.now()}`,
      timestamp: now.toISOString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = {
      ...recordedAIChats,
      [date]: [newSession, ...(recordedAIChats[date] || [])],
    };

    setAiChatsOverride(updated);
    try {
      localStorage.setItem('strakvu_aichats', JSON.stringify(updated));
    } catch {}
  };

  // Connect profile callback from modal
  const handleConnectSuccess = (customUsername?: string, token?: string) => {
    if (customUsername) {
      const updatedProfile: DeveloperProfile = {
        ...baseProfile,
        username: customUsername,
        displayName: customUsername,
        isConnected: true,
      };
      setProfileOverride(updatedProfile);
      try {
        localStorage.setItem('strakvu_profile', JSON.stringify(updatedProfile));
        if (token) localStorage.setItem('strakvu_github_token', token);
      } catch {}
      fetchGitHubActivity(customUsername, token, true);
    } else if (token) {
      try {
        localStorage.setItem('strakvu_github_token', token);
      } catch {}
      fetchGitHubActivity(undefined, token, true);
    }
  };

  // Disconnect / Clear profile callback
  const handleDisconnect = () => {
    setProfileOverride(INITIAL_DEVELOPER);
    setGithubEventsByDate({});
    setStoriesByDate({});
    setFetchedRepos([]);
    try {
      localStorage.removeItem('strakvu_profile');
      localStorage.removeItem('strakvu_github_token');
      localStorage.removeItem('strakvu_custom_pushes');
      localStorage.removeItem('strakvu_aichats');
      localStorage.removeItem('strakvu_waka_sessions');
    } catch {}
  };

  // Dynamically re-index all events by user's local date for 100% pinpoint accuracy
  const eventsByLocalDate = useMemo(() => {
    const map: Record<string, ActivityEvent[]> = {};
    for (const [serverDate, events] of Object.entries(githubEventsByDate)) {
      for (const evt of events) {
        const localDateKey = getLocalDateKey(evt.timestamp) || serverDate;
        if (!map[localDateKey]) {
          map[localDateKey] = [];
        }
        map[localDateKey].push(evt);
      }
    }
    // Sort each day's events newest first by timestamp
    for (const dateKey of Object.keys(map)) {
      map[dateKey].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
    }
    return map;
  }, [githubEventsByDate]);

  // Merge Live GitHub Events with IDE Coding Duration and AI chats
  const rawMonthActivities = useMemo(() => {
    const baseDays = getCleanMonthActivities(currentDate.getFullYear(), currentDate.getMonth());

    return baseDays.map((day) => {
      const ghEvents = eventsByLocalDate[day.date] || [];
      const userPushes = customPushes[day.date] || [];
      const allEvents = [...ghEvents, ...userPushes];

      const dayAIChats = recordedAIChats[day.date] || [];
      const daySessions = recordedEditorSessions[day.date] || [];

      // Calculate total coding minutes for this day
      let totalMinutes = 0;
      const editorsSet = new Set<string>();
      for (const s of daySessions) {
        totalMinutes += s.durationMinutes || 0;
        if (s.editor) editorsSet.add(s.editor);
      }

      let durationText = '';
      if (totalMinutes > 0) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        durationText = h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
      }

      const totalActivities = allEvents.length + dayAIChats.length + (totalMinutes > 0 ? 1 : 0);

      const reposSet = new Set<string>();
      let commitsCount = 0;

      for (const e of allEvents) {
        if (e.repo) reposSet.add(e.repo);
        if (e.commits && e.commits.length > 0) {
          commitsCount += e.commits.length;
        } else if (e.type === 'commit' || e.type === 'push') {
          commitsCount += 1;
        }
      }

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (commitsCount > 8 || totalMinutes > 240) level = 4;
      else if (commitsCount > 4 || totalMinutes > 120) level = 3;
      else if (commitsCount > 1 || totalMinutes > 30) level = 2;
      else if (totalActivities > 0 || totalMinutes > 0) level = 1;

      return {
        ...day,
        events: allEvents,
        totalActivities,
        totalCommits: commitsCount,
        level,
        repos: Array.from(reposSet),
        codingDurationText: durationText,
        codingSeconds: totalMinutes * 60,
        editorsUsed: Array.from(editorsSet),
        humanSummary: storiesByDate[day.date] || day.humanSummary || '',
        aiSessions: dayAIChats.length > 0 ? dayAIChats : undefined,
      };
    });
  }, [currentDate, eventsByLocalDate, customPushes, recordedAIChats, recordedEditorSessions, storiesByDate]);

  // Collect all available repositories
  const availableRepos = useMemo(() => {
    const repoSet = new Set<string>(fetchedRepos);
    Object.values(eventsByLocalDate).forEach((events) => {
      events.forEach((e) => repoSet.add(e.repo));
    });
    return Array.from(repoSet);
  }, [fetchedRepos, eventsByLocalDate]);

  // Apply repo filter
  const filteredMonthActivities = useMemo(() => {
    if (selectedRepoFilter === 'all') return rawMonthActivities;

    return rawMonthActivities.map((day) => {
      const filteredEvents = day.events.filter(
        (e) => e.repo === selectedRepoFilter || e.repo.includes(selectedRepoFilter)
      );

      let commitsCount = 0;
      for (const e of filteredEvents) {
        if (e.commits && e.commits.length > 0) {
          commitsCount += e.commits.length;
        } else if (e.type === 'commit' || e.type === 'push') {
          commitsCount += 1;
        }
      }

      const totalActivities = filteredEvents.length + (day.aiSessions?.length || 0);

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (commitsCount > 8 || totalActivities > 10) level = 4;
      else if (commitsCount > 4 || totalActivities > 6) level = 3;
      else if (commitsCount > 1 || totalActivities > 3) level = 2;
      else if (totalActivities > 0) level = 1;

      return {
        ...day,
        events: filteredEvents,
        totalActivities,
        totalCommits: commitsCount,
        level,
      };
    });
  }, [rawMonthActivities, selectedRepoFilter]);

  // Determine currently selected day or fallback to today
  const selectedDay = useMemo(() => {
    if (selectedDayDate) {
      return (
        filteredMonthActivities.find((d) => d.date === selectedDayDate) ||
        rawMonthActivities.find((d) => d.date === selectedDayDate) ||
        null
      );
    }
    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    return (
      filteredMonthActivities.find((d) => d.date === todayStr) ||
      rawMonthActivities.find((d) => d.date === todayStr) ||
      filteredMonthActivities.find((d) => d.totalActivities > 0) ||
      null
    );
  }, [filteredMonthActivities, rawMonthActivities, selectedDayDate]);

  const monthName = MONTH_NAMES[currentDate.getMonth()] || 'September';

  const totalCommitsCount = useMemo(() => {
    return Object.values(eventsByLocalDate).reduce((sum, dayEvts) => {
      return (
        sum +
        dayEvts.reduce((dSum, e) => {
          return dSum + (e.commits && e.commits.length > 0 ? e.commits.length : e.type === 'commit' ? 1 : 0);
        }, 0)
      );
    }, 0);
  }, [eventsByLocalDate]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#090d14] text-white flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-xs text-[#8b949e]">Loading STrakvu developer timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d14] text-[#c9d1d9] flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <Navbar
        profile={baseProfile}
        onConnectClick={() => setIsConnectModalOpen(true)}
        onDisconnectClick={handleDisconnect}
        setActiveView={(view) => setActiveView(view)}
        activeView={activeView}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'landing' ? (
          <LandingHero
            isConnected={baseProfile.isConnected && Boolean(baseProfile.username)}
            onGoToDashboard={() => setActiveView('dashboard')}
            onConnectClick={() => setIsConnectModalOpen(true)}
          />
        ) : activeView === 'wakatime' ? (
          <WakaTimeView
            summary={wakaSummary}
            selectedDate={selectedDay?.date || activeQueryDate}
            onOpenConnectModal={() => setIsWakaModalOpen(true)}
            isCustomKeySet={Boolean(wakaKey)}
            onSelectDate={(newDate) => {
              setSelectedDayDate(newDate);
              loadWakaTime(newDate, wakaKey);
            }}
          />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Integration Banners: GitHub + WakaTime Quick Pulse */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 xl:col-span-7">
                <GitHubSummaryCard
                  profile={baseProfile}
                  totalCommits={totalCommitsCount}
                  repositories={availableRepos}
                  isLoading={isLoadingGitHub}
                  onRefresh={() => fetchGitHubActivity(baseProfile.username, undefined, true)}
                  onOpenConnectModal={() => setIsConnectModalOpen(true)}
                />
              </div>

              <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between rounded-xl border border-[#30363d] bg-[#0d1117] p-4 sm:p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#161b22] border border-cyan-500/30 text-cyan-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold font-mono text-white">WakaTime IDE Pulse</h4>
                      <p className="text-[11px] text-[#8b949e] font-mono">
                        {wakaKey ? 'Live API connected' : 'Custom sessions active'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveView('wakatime')}
                      className="h-8 text-xs font-mono border-[#30363d] text-cyan-300 hover:text-white"
                    >
                      Studio Page
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsWakaModalOpen(true)}
                      className="h-8 text-xs font-mono border-[#30363d] text-[#8b949e] hover:text-white"
                    >
                      Key
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-[#161b22]/60 p-2.5 rounded-lg border border-[#21262d]">
                    <span className="text-[10px] text-[#8b949e] block">Selected Day Coding</span>
                    <span className="text-sm font-bold text-cyan-300 font-mono">
                      {selectedDay?.codingDurationText || wakaSummary?.totalText || '0m'}
                    </span>
                  </div>
                  <div className="bg-[#161b22]/60 p-2.5 rounded-lg border border-[#21262d]">
                    <span className="text-[10px] text-[#8b949e] block">Primary Editor</span>
                    <span className="text-sm font-bold text-white font-mono truncate block">
                      {selectedDay?.editorsUsed?.[0] || wakaSummary?.editors?.[0]?.name || 'None'}
                    </span>
                  </div>
                </div>
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

            {/* Polished Clean Repository Filter Toolbar (No horizontal scrollbars) */}
            <RepoFilter
              availableRepos={availableRepos}
              selectedRepo={selectedRepoFilter}
              onSelectRepo={setSelectedRepoFilter}
            />

            {/* Activity Grid (Left) + Day Timeline Inspection (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive Calendar Activity Grid */}
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

              {/* Right Column: Deep-Dive Day Inspection (Exact Commits, IDE Sessions, Prompts) */}
              <div className="lg:col-span-5 xl:col-span-5 space-y-4">
                <DayTimeline
                  day={selectedDay}
                  onClose={() => setSelectedDayDate(null)}
                  onAddAIChat={handleAddAIChat}
                  onAddEditorSession={handleAddEditorSession}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Connect Account Modal (GitHub) */}
      <ConnectModal
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
        onConnectSuccess={handleConnectSuccess}
      />

      {/* WakaTime Key Modal */}
      <WakaTimeConnectModal
        isOpen={isWakaModalOpen}
        onClose={() => setIsWakaModalOpen(false)}
        onSaveKey={handleSaveWakaKey}
        currentKey={wakaKey}
      />
    </div>
  );
}
