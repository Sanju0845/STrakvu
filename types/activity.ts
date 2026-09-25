export type ActivityEventType = 'commit' | 'push' | 'repo_created' | 'pull_request' | 'release';

export type AISource = 'claude' | 'chatgpt' | 'gemini' | 'cursor' | 'manual';

export interface AIChatSession {
  id: string;
  source: AISource;
  promptTopic: string;
  aiResponseSummary: string;
  codeSnippet?: string;
  timestamp: string;
  time: string;
  targetRepo?: string;
  tags?: string[];
}

export interface ChromeResearchItem {
  id: string;
  title: string;
  url: string;
  category: 'docs' | 'ui-inspiration' | 'npm' | 'stackoverflow' | 'spec';
  time: string;
}

export interface CommitDetail {
  id: string;
  hash: string;
  message: string;
  repo: string;
  repoUrl?: string;
  branch: string;
  time: string; // e.g. "09:42 AM"
  timestamp: string; // ISO
  additions: number;
  deletions: number;
  linkedPromptId?: string;
}

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  description?: string;
  repo: string;
  repoUrl?: string;
  branch?: string;
  time: string; // e.g. "10:15 AM"
  timestamp: string; // ISO
  commits?: CommitDetail[];
  additions?: number;
  deletions?: number;
  language?: string;
  languageColor?: string;
  hash?: string;
  linkedPrompt?: string;
}

export interface DayActivity {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  totalActivities: number;
  totalCommits: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = none, 1 = 1-2, 2 = 3-5, 3 = 6-9, 4 = 10+
  events: ActivityEvent[];
  repos: string[];
  // Humanoid / developer life context for that day
  humanSummary?: string;
  primaryFocusRepo?: string;
  aiSessions?: AIChatSession[];
  chromeResearch?: ChromeResearchItem[];
}

export interface DeveloperProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isConnected: boolean;
  currentStreak: number;
  longestStreak: number;
  totalCommitsMonth: number;
  activeReposCount: number;
  topRepo: string;
  // Stats on connected tooling
  totalAiAssistedPrompts?: number;
}
