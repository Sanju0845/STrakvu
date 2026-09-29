export interface WakaLanguage {
  name: string;
  total_seconds: number;
  percent: number;
  digital: string;
  text: string;
  color?: string;
}

export interface WakaEditor {
  name: string; // e.g. 'Cursor', 'VS Code', 'Qoder', 'WebStorm', 'Neovim', 'Google AI Studio'
  total_seconds: number;
  percent: number;
  digital: string;
  text: string;
  iconType?: 'cursor' | 'vscode' | 'terminal' | 'web' | 'idea' | 'code';
}

export interface WakaProject {
  name: string;
  total_seconds: number;
  percent: number;
  digital: string;
  text: string;
  branch?: string;
}

export interface WakaHeartbeatSession {
  id: string;
  startTime: string; // e.g. "10:15 AM"
  endTime: string; // e.g. "11:45 AM"
  startTimestamp: string;
  endTimestamp: string;
  durationText: string;
  durationMinutes: number;
  project: string;
  editor: string;
  language: string;
  file?: string;
  branch?: string;
}

export interface WakaTimeDaySummary {
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  totalText: string;
  dailyAverageText?: string;
  editors: WakaEditor[];
  languages: WakaLanguage[];
  projects: WakaProject[];
  heartbeats: WakaHeartbeatSession[];
  isConnected: boolean;
}

export interface WakaTimeProfile {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  totalCodingTimeWeek?: string;
  bestDayText?: string;
  dailyAverage?: string;
  topEditor?: string;
  topLanguage?: string;
  isConnected: boolean;
}
