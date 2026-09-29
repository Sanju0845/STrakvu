import { ActivityEvent, CommitDetail, DeveloperProfile } from '@/types/activity';

export interface GitHubRepoSummary {
  name: string;
  fullName: string;
  url: string;
  isPrivate: boolean;
  language?: string;
  description?: string;
  updatedAt: string;
  commitsCount: number;
}

export interface GitHubDayActivity {
  date: string;
  events: ActivityEvent[];
  commits: CommitDetail[];
  totalCommits: number;
  repos: string[];
  additions: number;
  deletions: number;
  story?: string;
}

export interface GitHubSyncState {
  isConnected: boolean;
  username: string;
  avatarUrl: string;
  lastSyncedAt?: string;
  totalReposCount: number;
  totalCommitsCount: number;
  currentStreak: number;
}
