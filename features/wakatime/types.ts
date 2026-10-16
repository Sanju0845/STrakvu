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
  iconType?: 'qoder' | 'cursor' | 'vscode' | 'terminal' | 'web' | 'idea' | 'code';
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

export interface HourlyCodingSlot {
  hour: number; // 0 to 23
  hourLabel: string; // e.g. "12 AM", "1 PM"
  totalSeconds: number;
  minutes: number;
  percent: number; // 0 - 100% of the hour
  intensity: 0 | 1 | 2 | 3 | 4;
  projects: string[];
  editors: string[];
  primaryProject?: string;
  primaryEditor?: string;
}

export interface WakaTimeMonthDay {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  totalSeconds: number;
  totalText: string;
  level: 0 | 1 | 2 | 3 | 4;
  projects: { name: string; minutes: number }[];
  topProject?: string;
  editors: string[];
  topEditor?: string;
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
  hourlySlots?: HourlyCodingSlot[];
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
